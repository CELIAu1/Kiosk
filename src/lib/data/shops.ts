import { all, one, run } from "../db";
import { newId } from "../ids";
import type { Shop, ShopCard } from "../types";

/**
 * Shops are the unit a customer actually visits — "one shop per thing you
 * sell". A business can run several, each separately shareable by its @tag.
 */
const CARD_SELECT = `
  SELECT s.*,
         (SELECT COUNT(*) FROM products p
           WHERE p.shop_id = s.id AND p.status IN ('active', 'sold_out')) AS product_count,
         (SELECT COUNT(DISTINCT p.category_id) FROM products p
           WHERE p.shop_id = s.id AND p.category_id IS NOT NULL) AS category_count,
         (SELECT COUNT(*) FROM interest_events e
           WHERE e.shop_id = s.id AND e.kind = 'viewed_shop') AS views
    FROM shops s
`;

/** The three-image collage on each shop card comes from its newest products. */
function coverIds(shopId: string, limit = 3): string[] {
  return all<{ image_id: string }>(
    `SELECT pi.image_id
       FROM products p
       JOIN product_images pi ON pi.product_id = p.id AND pi.position = 0
      WHERE p.shop_id = ? AND p.status IN ('active', 'sold_out')
      ORDER BY p.created_at DESC
      LIMIT ?`,
    shopId,
    limit,
  ).map((row) => row.image_id);
}

function withCovers(shop: Omit<ShopCard, "cover_ids">): ShopCard {
  return { ...shop, cover_ids: coverIds(shop.id) };
}

export function listShops(businessId: string): ShopCard[] {
  return all<Omit<ShopCard, "cover_ids">>(
    `${CARD_SELECT} WHERE s.business_id = ? ORDER BY s.position, s.created_at`,
    businessId,
  ).map(withCovers);
}

export function getShop(businessId: string, shopId: string): ShopCard | null {
  const row = one<Omit<ShopCard, "cover_ids">>(
    `${CARD_SELECT} WHERE s.business_id = ? AND s.id = ?`,
    businessId,
    shopId,
  );
  return row ? withCovers(row) : null;
}

/** Customer-facing lookup: a shop is reachable by its slug or its @tag. */
export function getShopByHandle(handle: string): Shop | null {
  const clean = handle.replace(/^@/, "");
  return one<Shop>(
    `SELECT * FROM shops WHERE slug = ? OR tag = ? COLLATE NOCASE`,
    clean,
    clean,
  );
}

export function countShops(businessId: string): number {
  return (
    one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM shops WHERE business_id = ?`,
      businessId,
    )?.n ?? 0
  );
}

export function createShop(
  businessId: string,
  input: { name: string; tag: string; about?: string | null },
): string {
  const id = newId("shp");
  const next = one<{ n: number }>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS n FROM shops WHERE business_id = ?`,
    businessId,
  );
  run(
    `INSERT INTO shops
       (id, business_id, name, tag, slug, about, cover_image_id, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    id,
    businessId,
    input.name,
    input.tag,
    input.tag,
    input.about ?? null,
    next?.n ?? 0,
    new Date().toISOString(),
  );
  return id;
}

export function updateShop(
  businessId: string,
  shopId: string,
  fields: Partial<Pick<Shop, "name" | "tag" | "slug" | "about" | "cover_image_id">>,
) {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return;
  run(
    `UPDATE shops SET ${keys.map((k) => `${k} = ?`).join(", ")}
      WHERE id = ? AND business_id = ?`,
    ...keys.map((k) => fields[k] ?? null),
    shopId,
    businessId,
  );
}

export function deleteShop(businessId: string, shopId: string) {
  run(`DELETE FROM shops WHERE id = ? AND business_id = ?`, shopId, businessId);
}

/**
 * Tags live in customer-facing URLs and on social profiles, so they are
 * lowercase, unreserved and unique across every business on KIOSK.
 */
export function normaliseTag(input: string): string {
  return input
    .toLowerCase()
    .replace(/^@/, "")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

export function isTagTaken(tag: string, exceptShopId?: string): boolean {
  const row = one<{ id: string }>(
    `SELECT id FROM shops WHERE tag = ? OR slug = ?`,
    tag,
    tag,
  );
  return !!row && row.id !== exceptShopId;
}

/** Finds a free tag near the one asked for, e.g. sneakers -> sneakers2. */
export function availableTag(desired: string): string {
  const base = normaliseTag(desired) || "shop";
  for (let n = 0; n < 60; n++) {
    const candidate = n === 0 ? base : `${base}${n + 1}`;
    if (!isTagTaken(candidate)) return candidate;
  }
  return `${base}${Date.now().toString(36)}`;
}
