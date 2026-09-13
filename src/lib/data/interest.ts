import { all, one, run } from "../db";
import { newId } from "../ids";
import type { InterestKind } from "../types";

/**
 * Interest is the reason KIOSK exists. Every signal a customer gives —
 * a look, a question, an abandoned cart — is written here so the owner can
 * see it instead of losing it inside a DM thread.
 */
export function recordInterest(
  businessId: string,
  kind: InterestKind,
  ref: {
    shopId?: string | null;
    productId?: string | null;
    visitorId?: string | null;
    customerId?: string | null;
  } = {},
) {
  run(
    `INSERT INTO interest_events
       (id, business_id, shop_id, product_id, visitor_id, customer_id, kind, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId("int"),
    businessId,
    ref.shopId ?? null,
    ref.productId ?? null,
    ref.visitorId ?? null,
    ref.customerId ?? null,
    kind,
    new Date().toISOString(),
  );
}

/**
 * A view only counts once per visitor per product per 6 hours. Otherwise a
 * refresh would inflate the number the owner is trying to make decisions from.
 */
export function recordProductView(
  businessId: string,
  shopId: string,
  productId: string,
  visitorId: string,
) {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const seen = one<{ id: string }>(
    `SELECT id FROM interest_events
      WHERE product_id = ? AND visitor_id = ? AND kind = 'viewed_product' AND created_at > ?
      LIMIT 1`,
    productId,
    visitorId,
    since,
  );
  if (!seen) {
    recordInterest(businessId, "viewed_product", { shopId, productId, visitorId });
  }
}

/** Shop views over a window — the "Overall shop views" stat. */
export function shopViews(shopId: string, days = 7): number {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return (
    one<{ n: number }>(
      `SELECT COUNT(DISTINCT COALESCE(visitor_id, customer_id)) AS n
         FROM interest_events
        WHERE shop_id = ? AND kind = 'viewed_shop' AND created_at > ?`,
      shopId,
      since,
    )?.n ?? 0
  );
}

export type Pulse = {
  people: number;
  productViews: number;
  questions: number;
  orders: number;
  salesMinor: number;
};

/** The "what happened" numbers. Counts of people, not of page hits. */
export function getPulse(businessId: string, days = 7): Pulse {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const row = one<Pulse>(
    `SELECT
       (SELECT COUNT(DISTINCT COALESCE(visitor_id, customer_id))
          FROM interest_events
         WHERE business_id = ?1 AND created_at > ?2) AS people,
       (SELECT COUNT(*) FROM interest_events
         WHERE business_id = ?1 AND kind = 'viewed_product' AND created_at > ?2) AS productViews,
       (SELECT COUNT(*) FROM questions
         WHERE business_id = ?1 AND created_at > ?2) AS questions,
       (SELECT COUNT(*) FROM orders
         WHERE business_id = ?1 AND created_at > ?2 AND status != 'cancelled') AS orders,
       (SELECT COALESCE(SUM(total_minor), 0) FROM orders
         WHERE business_id = ?1 AND created_at > ?2 AND status != 'cancelled') AS salesMinor`,
    businessId,
    since,
  );
  return row ?? { people: 0, productViews: 0, questions: 0, orders: 0, salesMinor: 0 };
}

export type WatchedProduct = {
  id: string;
  name: string;
  image_id: string | null;
  price_minor: number;
  status: string;
  stock: number | null;
  views: number;
  asked: number;
  ordered: number;
};

/**
 * Products people keep looking at but nobody buys. This is the single most
 * useful thing the owner can learn: interest without a sale means something
 * is wrong — the price, the photo, or the availability.
 */
export function productsWithUnconvertedInterest(
  businessId: string,
  days = 14,
  minViews = 5,
): WatchedProduct[] {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return all<WatchedProduct>(
    `SELECT p.id, p.name, p.price_minor, p.status, p.stock,
            (SELECT pi.image_id FROM product_images pi
              WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_id,
            COUNT(DISTINCT CASE WHEN e.kind = 'viewed_product'
                                THEN COALESCE(e.visitor_id, e.customer_id) END) AS views,
            COUNT(DISTINCT CASE WHEN e.kind = 'asked' THEN e.id END) AS asked,
            COUNT(DISTINCT CASE WHEN e.kind = 'ordered' THEN e.id END) AS ordered
       FROM products p
       JOIN interest_events e ON e.product_id = p.id AND e.created_at > ?
      WHERE p.business_id = ?
      GROUP BY p.id
     HAVING views >= ? AND ordered = 0
      ORDER BY views DESC
      LIMIT 6`,
    since,
    businessId,
    minViews,
  );
}

/** Best sellers over the window — what to restock and what to post about. */
export function topSellingProducts(businessId: string, days = 30) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return all<WatchedProduct & { sold: number; revenue_minor: number }>(
    `SELECT p.id, p.name, p.price_minor, p.status, p.stock,
            (SELECT pi.image_id FROM product_images pi
              WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_id,
            SUM(oi.qty) AS sold,
            SUM(oi.qty * oi.unit_minor) AS revenue_minor,
            0 AS views, 0 AS asked, 0 AS ordered
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE o.business_id = ? AND o.status != 'cancelled' AND o.created_at > ?
      GROUP BY p.id
      ORDER BY sold DESC
      LIMIT 5`,
    businessId,
    since,
  );
}

export type ActivityRow = {
  id: string;
  kind: InterestKind;
  created_at: string;
  product_id: string | null;
  product_name: string | null;
  image_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
};

/** Recent activity, collapsed to the events worth a human's attention. */
export function listActivity(businessId: string, limit = 20): ActivityRow[] {
  return all<ActivityRow>(
    `SELECT e.id, e.kind, e.created_at, e.product_id, e.customer_id,
            p.name AS product_name,
            (SELECT pi.image_id FROM product_images pi
              WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_id,
            c.name AS customer_name
       FROM interest_events e
       LEFT JOIN products p ON p.id = e.product_id
       LEFT JOIN customers c ON c.id = e.customer_id
      WHERE e.business_id = ?
        AND e.kind IN ('asked', 'ordered', 'added_to_cart', 'checkout_started', 'saved')
      ORDER BY e.created_at DESC
      LIMIT ?`,
    businessId,
    limit,
  );
}

/** The per-product funnel shown on the product page. */
export function productFunnel(productId: string) {
  const row = one<{ views: number; asked: number; carted: number; ordered: number }>(
    `SELECT
       COUNT(DISTINCT CASE WHEN kind = 'viewed_product'
                           THEN COALESCE(visitor_id, customer_id) END) AS views,
       COUNT(CASE WHEN kind = 'asked' THEN 1 END) AS asked,
       COUNT(DISTINCT CASE WHEN kind = 'added_to_cart'
                           THEN COALESCE(visitor_id, customer_id) END) AS carted,
       COUNT(CASE WHEN kind = 'ordered' THEN 1 END) AS ordered
     FROM interest_events WHERE product_id = ?`,
    productId,
  );
  return row ?? { views: 0, asked: 0, carted: 0, ordered: 0 };
}

export type InterestSummary = {
  key: string;
  customer_id: string | null;
  who: string;
  product_count: number;
  product_names: string;
};

/**
 * The "Customer interest" list on Home: one row per person, saying what they
 * looked at. Reads as "Ada viewed 3 products — Black runners, Canvas tote…".
 */
export function recentInterestSummaries(
  businessId: string,
  limit = 6,
  days = 14,
): InterestSummary[] {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return all<InterestSummary>(
    `SELECT COALESCE(e.customer_id, e.visitor_id) AS key,
            e.customer_id,
            COALESCE(c.name, 'Someone new') AS who,
            COUNT(DISTINCT e.product_id) AS product_count,
            GROUP_CONCAT(DISTINCT p.name) AS product_names
       FROM interest_events e
       JOIN products p ON p.id = e.product_id
       LEFT JOIN customers c ON c.id = e.customer_id
      WHERE e.business_id = ?
        AND e.kind = 'viewed_product'
        AND e.created_at > ?
      GROUP BY key
      ORDER BY MAX(e.created_at) DESC
      LIMIT ?`,
    businessId,
    since,
    limit,
  );
}

export type AttentionTile = {
  id: string;
  name: string;
  image_id: string | null;
  views: number;
};

/** "Getting attention" — the products people are actually opening. */
export function mostViewedProducts(
  businessId: string,
  limit = 6,
  days = 14,
): AttentionTile[] {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return all<AttentionTile>(
    `SELECT p.id, p.name,
            (SELECT pi.image_id FROM product_images pi
              WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_id,
            COUNT(DISTINCT COALESCE(e.visitor_id, e.customer_id)) AS views
       FROM products p
       JOIN interest_events e
         ON e.product_id = p.id AND e.kind = 'viewed_product' AND e.created_at > ?
      WHERE p.business_id = ?
      GROUP BY p.id
      ORDER BY views DESC
      LIMIT ?`,
    since,
    businessId,
    limit,
  );
}
