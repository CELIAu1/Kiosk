import { all, one, run } from "../db";
import type { Business, Category } from "../types";

export function getBusinessById(id: string) {
  return one<Business>(`SELECT * FROM businesses WHERE id = ?`, id);
}

export function getBusinessBySlug(slug: string) {
  return one<Business>(`SELECT * FROM businesses WHERE slug = ?`, slug);
}

export function listCategories(businessId: string) {
  return all<Category>(
    `SELECT * FROM categories WHERE business_id = ? ORDER BY position, name`,
    businessId,
  );
}

/** Categories that actually have something a customer can see right now. */
export function listPublicCategories(businessId: string) {
  return all<Category & { product_count: number }>(
    `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       JOIN products p
         ON p.category_id = c.id AND p.status IN ('active', 'sold_out')
      WHERE c.business_id = ?
      GROUP BY c.id
      ORDER BY c.position, c.name`,
    businessId,
  );
}

export function updateBusiness(
  id: string,
  fields: Partial<
    Pick<
      Business,
      | "name"
      | "tagline"
      | "owner_name"
      | "whatsapp"
      | "instagram"
      | "tiktok"
      | "location"
      | "currency"
      | "logo_image_id"
      | "slug"
    >
  >,
) {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return;
  const setters = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => fields[key] ?? null);
  run(`UPDATE businesses SET ${setters} WHERE id = ?`, ...values, id);
}

/** Slugs live in customer-facing URLs, so keep them short and predictable. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function isSlugTaken(slug: string, exceptBusinessId?: string): boolean {
  const row = one<{ id: string }>(
    `SELECT id FROM businesses WHERE slug = ?`,
    slug,
  );
  return !!row && row.id !== exceptBusinessId;
}
