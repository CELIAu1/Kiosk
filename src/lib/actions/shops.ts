"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
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
  const tag = isTagTaken(requested) ? availableTag(requested) : requested;

  const id = createShop(session.business.id, {
    name,
    tag,
    about: String(formData.get("about") ?? "").trim() || null,
  });

  revalidatePath("/shops");
  revalidatePath("/home");
  redirect(`/shops/${id}`);
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
  if (isTagTaken(tag, shopId)) return { error: "That tag is taken. Try another." };

  updateShop(session.business.id, shopId, {
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

  deleteShop(session.business.id, shopId);
  revalidatePath("/shops");
  redirect("/shops");
}
