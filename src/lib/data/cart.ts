import { all, one, run } from "../db";
import { newId } from "../ids";
import type { CartLine } from "../types";

const LINE_SELECT = `
  SELECT ci.id, ci.product_id, ci.option_id, ci.qty,
         po.label AS option_label,
         p.name, p.price_minor, p.status,
         (SELECT pi.image_id FROM product_images pi
           WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_id
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_options po ON po.id = ci.option_id
`;

export function listCart(visitorId: string, shopId: string): CartLine[] {
  return all<CartLine>(
    `${LINE_SELECT} WHERE ci.visitor_id = ? AND ci.shop_id = ? ORDER BY ci.created_at`,
    visitorId,
    shopId,
  );
}

export function cartCount(visitorId: string, shopId: string): number {
  return (
    one<{ n: number }>(
      `SELECT COALESCE(SUM(qty), 0) AS n FROM cart_items
        WHERE visitor_id = ? AND shop_id = ?`,
      visitorId,
      shopId,
    )?.n ?? 0
  );
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.price_minor * line.qty, 0);
}

export function addToCart(input: {
  visitorId: string;
  businessId: string;
  shopId: string;
  productId: string;
  optionId: string | null;
  qty?: number;
}) {
  const qty = Math.max(1, input.qty ?? 1);
  // Same product and same option is the same line, not a second one.
  const existing = one<{ id: string; qty: number }>(
    `SELECT id, qty FROM cart_items
      WHERE visitor_id = ? AND product_id = ? AND option_id IS ?`,
    input.visitorId,
    input.productId,
    input.optionId,
  );
  if (existing) {
    run(`UPDATE cart_items SET qty = ? WHERE id = ?`, existing.qty + qty, existing.id);
    return;
  }
  run(
    `INSERT INTO cart_items
       (id, visitor_id, business_id, shop_id, product_id, option_id, qty, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId("cit"),
    input.visitorId,
    input.businessId,
    input.shopId,
    input.productId,
    input.optionId,
    qty,
    new Date().toISOString(),
  );
}

export function setCartQty(visitorId: string, lineId: string, qty: number) {
  if (qty <= 0) {
    run(`DELETE FROM cart_items WHERE id = ? AND visitor_id = ?`, lineId, visitorId);
    return;
  }
  run(
    `UPDATE cart_items SET qty = ? WHERE id = ? AND visitor_id = ?`,
    Math.min(qty, 99),
    lineId,
    visitorId,
  );
}

export function clearCart(visitorId: string, shopId: string) {
  run(
    `DELETE FROM cart_items WHERE visitor_id = ? AND shop_id = ?`,
    visitorId,
    shopId,
  );
}
