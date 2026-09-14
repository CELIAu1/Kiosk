"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getShopByHandle } from "@/lib/data/shops";
import { getOption, getProduct, isOrderable } from "@/lib/data/products";
import { addToCart, clearCart, listCart, setCartQty } from "@/lib/data/cart";
import { findOrCreateCustomer, touchCustomer } from "@/lib/data/customers";
import { askQuestion } from "@/lib/data/questions";
import { placeOrder } from "@/lib/data/orders";
import { recordInterest } from "@/lib/data/interest";
import { getVisitorId, linkVisitorToCustomer } from "@/lib/visitor";

export type StorefrontState = { error?: string } | null;

export async function addToCartAction(formData: FormData) {
  const handle = String(formData.get("handle") ?? "");
  const shop = await getShopByHandle(handle);
  if (!shop) return;

  const productId = String(formData.get("product_id") ?? "");
  const product = await getProduct(shop.business_id, productId);
  if (!product || product.shop_id !== shop.id || !isOrderable(product)) return;

  // Guard against a stale form posting an option from another product.
  const optionId = String(formData.get("option_id") ?? "") || null;
  const option = optionId ? await getOption(optionId) : null;
  const safeOptionId = option?.product_id === productId ? option.id : null;

  const visitorId = await getVisitorId(shop.business_id);
  if (!visitorId) return;

  await addToCart({
    visitorId,
    businessId: shop.business_id,
    shopId: shop.id,
    productId,
    optionId: safeOptionId,
    qty: Number(formData.get("qty") ?? 1) || 1,
  });
  await recordInterest(shop.business_id, "added_to_cart", {
    shopId: shop.id,
    productId,
    visitorId,
  });

  revalidatePath(`/s/${handle}`, "layout");
  redirect(`/s/${handle}/cart`);
}

export async function setCartQtyAction(formData: FormData) {
  const handle = String(formData.get("handle") ?? "");
  const shop = await getShopByHandle(handle);
  if (!shop) return;

  const visitorId = await getVisitorId(shop.business_id);
  if (!visitorId) return;

  await setCartQty(
    visitorId,
    String(formData.get("line_id") ?? ""),
    Number(formData.get("qty") ?? 0),
  );
  revalidatePath(`/s/${handle}`, "layout");
}

export async function askQuestionAction(
  _prev: StorefrontState,
  formData: FormData,
): Promise<StorefrontState> {
  const handle = String(formData.get("handle") ?? "");
  const shop = await getShopByHandle(handle);
  if (!shop) return { error: "This shop is no longer available." };

  const body = String(formData.get("body") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!body) return { error: "Type your question first." };
  if (!name) return { error: "Add your name so they know who's asking." };
  if (!phone) return { error: "Add a number so they can reply to you." };

  const productId = String(formData.get("product_id") ?? "") || null;
  const visitorId = await getVisitorId(shop.business_id);

  const customer = await findOrCreateCustomer(shop.business_id, { name, phone });
  if (visitorId) await linkVisitorToCustomer(visitorId, customer.id);

  await askQuestion({
    businessId: shop.business_id,
    productId,
    customerId: customer.id,
    visitorId,
    body,
  });
  await recordInterest(shop.business_id, "asked", {
    shopId: shop.id,
    productId,
    customerId: customer.id,
    visitorId,
  });

  revalidatePath(`/s/${handle}`, "layout");
  redirect(`/s/${handle}${productId ? `/p/${productId}` : ""}?asked=1`);
}

export async function placeOrderAction(
  _prev: StorefrontState,
  formData: FormData,
): Promise<StorefrontState> {
  const handle = String(formData.get("handle") ?? "");
  const shop = await getShopByHandle(handle);
  if (!shop) return { error: "This shop is no longer available." };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) return { error: "Add your name." };
  if (!phone) return { error: "Add a phone number so they can confirm your order." };

  const visitorId = await getVisitorId(shop.business_id);
  if (!visitorId) return { error: "Your basket expired. Add your items again." };

  const lines = await listCart(visitorId, shop.id);
  if (lines.length === 0) return { error: "Your basket is empty." };

  // Re-check availability at the moment of ordering, not when the page rendered.
  const checked = await Promise.all(
    lines.map(async (line) => ({
      line,
      product: await getProduct(shop.business_id, line.product_id),
    })),
  );
  const unavailable = checked
    .filter(({ product }) => !product || !isOrderable(product))
    .map(({ line }) => line);
  if (unavailable.length > 0) {
    return {
      error: `${unavailable[0].name} isn't available any more. Remove it to continue.`,
    };
  }

  const customer = await findOrCreateCustomer(shop.business_id, {
    name,
    phone,
    instagram: String(formData.get("instagram") ?? "").trim() || null,
  });
  await linkVisitorToCustomer(visitorId, customer.id);
  await touchCustomer(customer.id);

  const order = await placeOrder({
    businessId: shop.business_id,
    shopId: shop.id,
    customerId: customer.id,
    visitorId,
    lines,
    note: String(formData.get("note") ?? "").trim() || null,
  });

  await clearCart(visitorId, shop.id);
  revalidatePath(`/s/${handle}`, "layout");
  redirect(`/s/${handle}/order/${order.id}`);
}
