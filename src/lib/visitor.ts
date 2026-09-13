import { cookies, headers } from "next/headers";
import { one, run } from "./db";
import { newId } from "./ids";

const VISITOR_COOKIE = "kiosk_v";
const VISITOR_HEADER = "x-kiosk-visitor";

/** The device token minted by the proxy, if this request has one. */
export async function deviceToken(): Promise<string | null> {
  const forwarded = (await headers()).get(VISITOR_HEADER);
  if (forwarded) return forwarded;
  return (await cookies()).get(VISITOR_COOKIE)?.value ?? null;
}

/**
 * Resolves this device to a visitor row for the given shop, creating it on
 * first sight. Returns null when there is no token (e.g. cookies blocked) —
 * callers treat that as "browse anonymously, record nothing".
 */
export async function getVisitorId(businessId: string): Promise<string | null> {
  const token = await deviceToken();
  if (!token) return null;

  const now = new Date().toISOString();

  // A layout and its page render concurrently, so two requests can reach this
  // at once with the same brand-new token. Insert-then-read, letting the
  // unique index decide the winner, rather than read-then-insert — which
  // races and trips the constraint.
  await run(
    `INSERT INTO visitors
       (id, business_id, device_token, customer_id, source, created_at, last_seen_at)
     VALUES (?, ?, ?, NULL, NULL, ?, ?)
     ON CONFLICT (business_id, device_token)
       DO UPDATE SET last_seen_at = excluded.last_seen_at`,
    newId("vis"),
    businessId,
    token,
    now,
    now,
  );

  const visitor = await one<{ id: string }>(
    `SELECT id FROM visitors WHERE business_id = ? AND device_token = ?`,
    businessId,
    token,
  );
  return visitor?.id ?? null;
}

/** Once a visitor identifies themselves, stitch their history to the person. */
export async function linkVisitorToCustomer(visitorId: string, customerId: string) {
  await run(`UPDATE visitors SET customer_id = ? WHERE id = ?`, customerId, visitorId);
  // Backfill so the owner sees the whole trail, not just what happened after.
  await run(
    `UPDATE interest_events SET customer_id = ? WHERE visitor_id = ? AND customer_id IS NULL`,
    customerId,
    visitorId,
  );
}
