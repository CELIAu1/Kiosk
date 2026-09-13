import { all, one, run, tx } from "../db";
import { newId, shortCode } from "../ids";
import type { CartLine, Order, OrderItem, OrderStatus } from "../types";
import { recordInterest } from "./interest";

export type OrderRow = Order & {
  customer_name: string;
  customer_phone: string | null;
  customer_instagram: string | null;
  item_count: number;
  preview_image_id: string | null;
};

const SELECT = `
  SELECT o.*, c.name AS customer_name, c.phone AS customer_phone,
         c.instagram AS customer_instagram,
         (SELECT COALESCE(SUM(oi.qty), 0) FROM order_items oi
           WHERE oi.order_id = o.id) AS item_count,
         (SELECT pi.image_id FROM order_items oi
             JOIN product_images pi ON pi.product_id = oi.product_id
            WHERE oi.order_id = o.id ORDER BY pi.position LIMIT 1) AS preview_image_id
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
`;

export function listOrders(businessId: string, status?: OrderStatus): OrderRow[] {
  const clause = status ? ` AND o.status = ?` : "";
  const params: string[] = status ? [businessId, status] : [businessId];
  return all<OrderRow>(
    `${SELECT} WHERE o.business_id = ?${clause} ORDER BY o.created_at DESC`,
    ...params,
  );
}

export function listCustomerOrders(customerId: string): OrderRow[] {
  return all<OrderRow>(
    `${SELECT} WHERE o.customer_id = ? ORDER BY o.created_at DESC`,
    customerId,
  );
}

export function getOrder(businessId: string, orderId: string) {
  return one<OrderRow>(
    `${SELECT} WHERE o.business_id = ? AND o.id = ?`,
    businessId,
    orderId,
  );
}

/** Used by the customer-facing receipt, which is scoped by id alone. */
export function getOrderById(orderId: string) {
  return one<OrderRow>(`${SELECT} WHERE o.id = ?`, orderId);
}

export function listOrderItems(orderId: string) {
  return all<OrderItem>(
    `SELECT * FROM order_items WHERE order_id = ? ORDER BY rowid`,
    orderId,
  );
}

export function countOrders(businessId: string, status: OrderStatus): number {
  return (
    one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM orders WHERE business_id = ? AND status = ?`,
      businessId,
      status,
    )?.n ?? 0
  );
}

export function placeOrder(input: {
  businessId: string;
  shopId: string;
  customerId: string;
  visitorId: string | null;
  lines: CartLine[];
  note: string | null;
}): { id: string; reference: string } {
  if (input.lines.length === 0) throw new Error("Cannot place an empty order");

  const id = newId("ord");
  const now = new Date().toISOString();
  const total = input.lines.reduce((sum, l) => sum + l.price_minor * l.qty, 0);
  const reference = uniqueReference(input.businessId);

  tx(() => {
    run(
      `INSERT INTO orders
         (id, business_id, shop_id, customer_id, reference, status, total_minor,
          note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`,
      id,
      input.businessId,
      input.shopId,
      input.customerId,
      reference,
      total,
      input.note,
      now,
      now,
    );

    for (const line of input.lines) {
      run(
        `INSERT INTO order_items
           (id, order_id, product_id, name_at_time, option_label, unit_minor, qty)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        newId("oit"),
        id,
        line.product_id,
        line.name,
        line.option_label,
        line.price_minor,
        line.qty,
      );
      // Only counted stock moves; NULL means the owner is not tracking it.
      run(
        `UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ? AND stock IS NOT NULL`,
        line.qty,
        line.product_id,
      );
      recordInterest(input.businessId, "ordered", {
        shopId: input.shopId,
        productId: line.product_id,
        customerId: input.customerId,
        visitorId: input.visitorId,
      });
    }
  });

  return { id, reference };
}

export function setOrderStatus(
  businessId: string,
  orderId: string,
  status: OrderStatus,
) {
  run(
    `UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND business_id = ?`,
    status,
    new Date().toISOString(),
    orderId,
    businessId,
  );
}

function uniqueReference(businessId: string): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = shortCode(5);
    const clash = one<{ id: string }>(
      `SELECT id FROM orders WHERE business_id = ? AND reference = ?`,
      businessId,
      candidate,
    );
    if (!clash) return candidate;
  }
  return shortCode(8);
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
