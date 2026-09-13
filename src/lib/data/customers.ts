import { all, one, run } from "../db";
import { newId } from "../ids";
import type { Customer } from "../types";

/** Digits only, so "0803 123 4567" and "+234 803 123 4567" are one person. */
export function normalisePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/[^0-9]/g, "");
  return digits.length >= 7 ? digits : null;
}

export type CustomerSummary = Customer & {
  order_count: number;
  spent_minor: number;
  question_count: number;
  waiting_questions: number;
};

const SUMMARY_SELECT = `
  SELECT c.*,
         (SELECT COUNT(*) FROM orders o
           WHERE o.customer_id = c.id AND o.status != 'cancelled') AS order_count,
         (SELECT COALESCE(SUM(o.total_minor), 0) FROM orders o
           WHERE o.customer_id = c.id AND o.status != 'cancelled') AS spent_minor,
         (SELECT COUNT(*) FROM questions q WHERE q.customer_id = c.id) AS question_count,
         (SELECT COUNT(*) FROM questions q
           WHERE q.customer_id = c.id AND q.status = 'waiting') AS waiting_questions
    FROM customers c
`;

export async function listCustomers(businessId: string, search?: string): Promise<CustomerSummary[]> {
  const params: (string | number)[] = [businessId];
  let where = `c.business_id = ?`;
  if (search?.trim()) {
    where += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.instagram LIKE ?)`;
    const like = `%${search.trim()}%`;
    params.push(like, like, like);
  }
  return all<CustomerSummary>(
    `${SUMMARY_SELECT} WHERE ${where} ORDER BY c.last_seen_at DESC`,
    ...params,
  );
}

export async function getCustomer(businessId: string, customerId: string) {
  return one<CustomerSummary>(
    `${SUMMARY_SELECT} WHERE c.business_id = ? AND c.id = ?`,
    businessId,
    customerId,
  );
}

/**
 * Customers identify themselves by phone number when they ask or order.
 * Matching on that turns repeat DMs into one person with a history.
 */
export async function findOrCreateCustomer(
  businessId: string,
  input: { name: string; phone?: string | null; instagram?: string | null },
): Promise<Customer> {
  const now = new Date().toISOString();
  const phone = normalisePhone(input.phone);

  if (phone) {
    const existing = await one<Customer>(
      `SELECT * FROM customers WHERE business_id = ? AND phone = ?`,
      businessId,
      phone,
    );
    if (existing) {
      await run(
        `UPDATE customers SET name = ?, instagram = COALESCE(?, instagram), last_seen_at = ?
          WHERE id = ?`,
        input.name.trim() || existing.name,
        input.instagram?.trim() || null,
        now,
        existing.id,
      );
      return { ...existing, name: input.name.trim() || existing.name, last_seen_at: now };
    }
  }

  const customer: Customer = {
    id: newId("cus"),
    business_id: businessId,
    name: input.name.trim() || "Customer",
    phone,
    instagram: input.instagram?.trim() || null,
    note: null,
    created_at: now,
    last_seen_at: now,
  };
  await run(
    `INSERT INTO customers
       (id, business_id, name, phone, instagram, note, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    customer.id,
    customer.business_id,
    customer.name,
    customer.phone,
    customer.instagram,
    customer.note,
    customer.created_at,
    customer.last_seen_at,
  );
  return customer;
}

export async function touchCustomer(customerId: string) {
  await run(
    `UPDATE customers SET last_seen_at = ? WHERE id = ?`,
    new Date().toISOString(),
    customerId,
  );
}

export async function setCustomerNote(businessId: string, customerId: string, note: string) {
  await run(
    `UPDATE customers SET note = ? WHERE id = ? AND business_id = ?`,
    note.trim() || null,
    customerId,
    businessId,
  );
}

export type CustomerActivity = {
  id: string;
  at: string;
  kind: string;
  detail: string | null;
  product_id: string | null;
  product_name: string | null;
};

/** One timeline per person: what they looked at, asked and bought. */
export async function customerActivity(customerId: string): Promise<CustomerActivity[]> {
  return all<CustomerActivity>(
    `SELECT e.id, e.created_at AS at, e.kind, NULL AS detail,
            e.product_id, p.name AS product_name
       FROM interest_events e
       LEFT JOIN products p ON p.id = e.product_id
      WHERE e.customer_id = ?
      UNION ALL
     SELECT q.id, q.created_at AS at, 'question' AS kind, q.body AS detail,
            q.product_id, p.name AS product_name
       FROM questions q
       LEFT JOIN products p ON p.id = q.product_id
      WHERE q.customer_id = ?
      ORDER BY at DESC
      LIMIT 50`,
    customerId,
    customerId,
  );
}

/**
 * People who showed real interest but never ordered — the follow-up list.
 * This is the list a small business would otherwise keep in their head.
 */
export async function customersToFollowUp(businessId: string, days = 21) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const candidates = await all<CustomerSummary>(
    `${SUMMARY_SELECT}
      WHERE c.business_id = ?
        AND c.last_seen_at > ?
        AND NOT EXISTS (
          SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status != 'cancelled'
        )
        AND EXISTS (
          SELECT 1 FROM interest_events e WHERE e.customer_id = c.id
        )
      ORDER BY c.last_seen_at DESC
      LIMIT 8`,
    businessId,
    since,
  );

  // One extra lookup per candidate, run together rather than in series.
  return Promise.all(
    candidates.map(async (customer) => ({
      ...customer,
      last_product:
        (
          await one<{ name: string }>(
            `SELECT p.name FROM interest_events e
               JOIN products p ON p.id = e.product_id
              WHERE e.customer_id = ? AND e.product_id IS NOT NULL
              ORDER BY e.created_at DESC LIMIT 1`,
            customer.id,
          )
        )?.name ?? null,
    })),
  );
}
