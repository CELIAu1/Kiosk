"use server";

import { redirect } from "next/navigation";
import { one, run, tx } from "@/lib/db";
import { newId } from "@/lib/ids";
import { createSession, destroySession, findUserByEmail, hashPassword, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/data/business";

export type FormState = { error?: string } | null;

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const user = findUserByEmail(email);
  // Same message either way: don't reveal which emails exist.
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "That email and password don't match." };
  }

  await createSession(user.id);
  redirect("/home");
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const ownerName = String(formData.get("owner_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();

  if (!businessName) return { error: "What is your business called?" };
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (findUserByEmail(email)) return { error: "That email already has a KIOSK." };

  const businessId = newId("biz");
  const userId = newId("usr");
  const now = new Date().toISOString();

  tx(() => {
    run(
      `INSERT INTO businesses
         (id, name, slug, tagline, owner_name, whatsapp, instagram, tiktok,
          location, currency, logo_image_id, created_at)
       VALUES (?, ?, ?, NULL, ?, ?, NULL, NULL, NULL, 'NGN', NULL, ?)`,
      businessId,
      businessName,
      availableSlug(businessName),
      ownerName || null,
      whatsapp || null,
      now,
    );
    run(
      `INSERT INTO users (id, business_id, email, password_hash, name, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      userId,
      businessId,
      email,
      hashPassword(password),
      ownerName || null,
      now,
    );
  });

  await createSession(userId);
  redirect("/home");
}

export async function signOutAction() {
  await destroySession();
  redirect("/");
}

/** Turns a business name into a free shop URL, adding a suffix on collision. */
function availableSlug(name: string): string {
  const base = slugify(name) || "shop";
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = one<{ id: string }>(
      `SELECT id FROM businesses WHERE slug = ?`,
      candidate,
    );
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
