"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { isSlugTaken, slugify, updateBusiness } from "@/lib/data/business";
import { ImageError, saveImage } from "@/lib/data/images";

export type ShopFormState = { error?: string; ok?: boolean } | null;

export async function saveShopAction(
  _prev: ShopFormState,
  formData: FormData,
): Promise<ShopFormState> {
  const session = await getSessionUser();
  if (!session) return { error: "Your session expired. Sign in again." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Your shop needs a name." };

  const requestedSlug = slugify(String(formData.get("slug") ?? ""));
  if (!requestedSlug) return { error: "Your shop link can't be empty." };
  if (isSlugTaken(requestedSlug, session.business.id)) {
    return { error: "That shop link is already taken. Try another." };
  }

  let logoImageId = session.business.logo_image_id;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoImageId = await saveImage(logo);
    } catch (error) {
      if (error instanceof ImageError) return { error: error.message };
      throw error;
    }
  }

  const currency = String(formData.get("currency") ?? "NGN").trim().toUpperCase();

  updateBusiness(session.business.id, {
    name,
    slug: requestedSlug,
    tagline: text(formData, "tagline"),
    owner_name: text(formData, "owner_name"),
    location: text(formData, "location"),
    whatsapp: text(formData, "whatsapp"),
    instagram: handle(formData, "instagram"),
    tiktok: handle(formData, "tiktok"),
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "NGN",
    logo_image_id: logoImageId,
  });

  revalidatePath("/shop");
  revalidatePath("/home");
  return { ok: true };
}

function text(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function handle(formData: FormData, key: string): string | null {
  const raw = text(formData, key);
  return raw ? raw.replace(/^@/, "") : null;
}
