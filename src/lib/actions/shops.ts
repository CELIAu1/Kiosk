"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { newId } from "@/lib/ids";
import { parseMoney } from "@/lib/money";
import { createProduct } from "@/lib/data/products";
import {
  availableTag,
  createShop,
  deleteShop,
  isTagTaken,
  normaliseTag,
  updateShop,
} from "@/lib/data/shops";

export type ShopFormState = { error?: string } | null;

export async function createShopAction(
  _prev: ShopFormState,
  formData: FormData,
): Promise<ShopFormState> {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give this shop a name." };

  // The tag is what a customer types, so it is never silently duplicated.
  const requested = normaliseTag(String(formData.get("tag") ?? "") || name);
  const tag = (await isTagTaken(requested)) ? await availableTag(requested) : requested;

  const id = await createShop(session.business.id, {
    name,
    tag,
    about: String(formData.get("about") ?? "").trim() || null,
  });

  revalidatePath("/shops");
  revalidatePath("/home");
  redirect(`/shops/${id}/setup/sells`);
}

export async function updateShopAction(
  _prev: ShopFormState,
  formData: FormData,
): Promise<ShopFormState> {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");

  const shopId = String(formData.get("shop_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!shopId || !name) return { error: "Give this shop a name." };

  const tag = normaliseTag(String(formData.get("tag") ?? "") || name);
  if (!tag) return { error: "The shop tag can't be empty." };
  if (await isTagTaken(tag, shopId)) return { error: "That tag is taken. Try another." };

  await updateShop(session.business.id, shopId, {
    name,
    tag,
    slug: tag,
    about: String(formData.get("about") ?? "").trim() || null,
  });

  revalidatePath("/shops");
  redirect(`/shops/${shopId}`);
}

export async function deleteShopAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const shopId = String(formData.get("shop_id") ?? "");
  if (!shopId) return;

  await deleteShop(session.business.id, shopId);
  revalidatePath("/shops");
  redirect("/shops");
}

/** Step 2: what this shop sells, in the owner's own words. */
export async function saveShopSellsAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");

  const shopId = String(formData.get("shop_id") ?? "");
  const sells = String(formData.get("sells") ?? "").trim();
  if (!shopId) return;

  await updateShop(session.business.id, shopId, { about: sells || null });
  revalidatePath(`/shops/${shopId}`);
  redirect(`/shops/${shopId}/setup/categories`);
}

/** Step 3: the categories they picked become real rows. */
export async function saveShopCategoriesAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");

  const shopId = String(formData.get("shop_id") ?? "");
  if (!shopId) return;

  const picked = formData
    .getAll("category")
    .map(String)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 12);

  for (const [index, name] of picked.entries()) {
    const existing = await one<{ id: string }>(
      `SELECT id FROM categories WHERE shop_id = ? AND name = ? COLLATE NOCASE`,
      shopId,
      name,
    );
    if (existing) continue;
    await run(
      `INSERT INTO categories (id, business_id, shop_id, name, position)
       VALUES (?, ?, ?, ?, ?)`,
      newId("cat"),
      session.business.id,
      shopId,
      name,
      index,
    );
  }

  revalidatePath(`/shops/${shopId}`);
  redirect(`/shops/${shopId}/setup/build`);
}

/** Step 4, the AI branch: turn the draft into real products. */
export async function acceptDraftAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");

  const shopId = String(formData.get("shop_id") ?? "");
  if (!shopId) return;

  const names = formData.getAll("draft_name").map(String);
  const categories = formData.getAll("draft_category").map(String);
  const descriptions = formData.getAll("draft_description").map(String);
  const prices = formData.getAll("draft_price").map(String);
  const keep = new Set(formData.getAll("draft_keep").map(String));

  for (const [index, name] of names.entries()) {
    if (!keep.has(String(index)) || !name.trim()) continue;

    const categoryName = (categories[index] ?? "").trim();
    let categoryId: string | null = null;
    if (categoryName) {
      const existing = await one<{ id: string }>(
        `SELECT id FROM categories WHERE shop_id = ? AND name = ? COLLATE NOCASE`,
        shopId,
        categoryName,
      );
      categoryId = existing?.id ?? newId("cat");
      if (!existing) {
        await run(
          `INSERT INTO categories (id, business_id, shop_id, name, position)
           VALUES (?, ?, ?, ?, ?)`,
          categoryId,
          session.business.id,
          shopId,
          categoryName,
          index,
        );
      }
    }

    await createProduct(session.business.id, {
      shopId,
      name: name.trim(),
      description: (descriptions[index] ?? "").trim() || null,
      priceMinor: parseMoney(prices[index] ?? "0") ?? 0,
      compareAtMinor: null,
      categoryId,
      // Drafts start hidden: the owner adds photos, then makes them live.
      status: "hidden",
      stock: null,
      options: [],
      imageIds: [],
    });
  }

  revalidatePath(`/shops/${shopId}`);
  redirect(`/shops/${shopId}`);
}
