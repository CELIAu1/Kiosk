"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { newId } from "@/lib/ids";
import { parseMoney } from "@/lib/money";
import { ImageError, saveImages } from "@/lib/data/images";
import {
  createProduct,
  deleteProduct,
  listProductImages,
  setProductStatus,
  updateProduct,
  type ProductInput,
} from "@/lib/data/products";
import type { ProductStatus } from "@/lib/types";

export type ProductFormState = { error?: string } | null;

const STATUSES: ProductStatus[] = ["active", "hidden", "sold_out"];

/** Parses the product form, which both "add" and "edit" post. */
async function readForm(
  businessId: string,
  formData: FormData,
  keepImageIds: string[],
): Promise<ProductInput | { error: string }> {
  const shopId = String(formData.get("shop_id") ?? "");
  if (!shopId) return { error: "Pick which shop this belongs to." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the product a name." };

  const priceMinor = parseMoney(String(formData.get("price") ?? ""));
  if (priceMinor === null) return { error: "Enter a price, for example 25000." };

  const compareRaw = String(formData.get("compare_at") ?? "").trim();
  const compareAtMinor = compareRaw ? parseMoney(compareRaw) : null;

  const statusRaw = String(formData.get("status") ?? "active") as ProductStatus;
  const status = STATUSES.includes(statusRaw) ? statusRaw : "active";

  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stock = stockRaw === "" ? null : Math.max(0, Number.parseInt(stockRaw, 10) || 0);

  const options = String(formData.get("options") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);

  let uploaded: string[] = [];
  try {
    const files = formData.getAll("images").filter((v): v is File => v instanceof File);
    uploaded = await saveImages(files);
  } catch (error) {
    if (error instanceof ImageError) return { error: error.message };
    throw error;
  }

  return {
    shopId,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    priceMinor,
    compareAtMinor,
    categoryId: await resolveCategory(
      businessId,
      shopId,
      String(formData.get("category") ?? ""),
    ),
    status,
    stock,
    options,
    imageIds: [...keepImageIds, ...uploaded],
  };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");

  const parsed = await readForm(session.business.id, formData, []);
  if ("error" in parsed) return parsed;

  const id = await createProduct(session.business.id, parsed);
  revalidatePath("/products");
  revalidatePath("/home");
  redirect(`/products/${id}`);
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");

  const productId = String(formData.get("product_id") ?? "");
  if (!productId) return { error: "Something went wrong. Try again." };

  // Images the owner did not tick "remove" on stay, in their current order.
  const removed = new Set(formData.getAll("remove_image").map(String));
  const keep = (await listProductImages(productId)).filter((id) => !removed.has(id));

  const parsed = await readForm(session.business.id, formData, keep);
  if ("error" in parsed) return parsed;

  await updateProduct(session.business.id, productId, parsed);
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}`);
}

export async function setProductStatusAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const id = String(formData.get("product_id") ?? "");
  const status = String(formData.get("status") ?? "") as ProductStatus;
  if (!id || !STATUSES.includes(status)) return;

  await setProductStatus(session.business.id, id, status);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
}

export async function deleteProductAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const id = String(formData.get("product_id") ?? "");
  if (!id) return;

  await deleteProduct(session.business.id, id);
  revalidatePath("/products");
  redirect("/products");
}

/**
 * Categories are typed, not managed. A small business shouldn't have to visit
 * a settings screen to say "this one is a sneaker".
 */
async function resolveCategory(
  businessId: string,
  shopId: string,
  raw: string,
): Promise<string | null> {
  const name = raw.trim();
  if (!name) return null;

  const existing = await one<{ id: string }>(
    `SELECT id FROM categories WHERE shop_id = ? AND name = ? COLLATE NOCASE`,
    shopId,
    name,
  );
  if (existing) return existing.id;

  const id = newId("cat");
  const next = await one<{ n: number }>(
    `SELECT COALESCE(MAX(position), 0) + 1 AS n FROM categories WHERE shop_id = ?`,
    shopId,
  );
  await run(
    `INSERT INTO categories (id, business_id, shop_id, name, position)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    businessId,
    shopId,
    name,
    next?.n ?? 0,
  );
  return id;
}
