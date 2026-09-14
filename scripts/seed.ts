/**
 * Seeds a demo shop with a fortnight of plausible customer behaviour, so the
 * dashboard has something real to say the first time you open it.
 *
 *   npm run db:seed      (add to whatever is there)
 *   npm run db:reset     (start from an empty database)
 */
import { all, one, tx } from "../src/lib/db.ts";
import { newId, shortCode } from "../src/lib/ids.ts";
import { hashPassword } from "../src/lib/password.ts";
import { productPlaceholder, type RGB } from "./png.ts";

const SHOPS = [
  { key: "thrift", name: "Thrift by Pemz", tag: "thriftbypemz",
    about: "Pre-loved pieces, picked one at a time." },
  { key: "sneakers", name: "Ada's Sneakers", tag: "adassneakers",
    about: "Clean kicks and everyday shoes. Lagos." },
] as const;

const DEMO_EMAIL = "ada@example.com";
const DEMO_PASSWORD = "kiosk1234";

const DAY = 86_400_000;
const now = Date.now();

/** Deterministic pseudo-random, so repeated seeds look the same. */
let cursor = 20260913;
function random(): number {
  cursor = (cursor * 1103515245 + 12345) % 2147483648;
  return cursor / 2147483648;
}
function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)];
}
function iso(daysAgo: number): string {
  return new Date(now - daysAgo * DAY - Math.floor(random() * DAY)).toISOString();
}

type SeedProduct = {
  name: string;
  price: number;
  was?: number;
  category: string;
  description: string;
  options?: string[];
  stock?: number | null;
  colour: RGB;
  status?: "active" | "hidden" | "sold_out";
  /** Which of the demo shops this belongs to. */
  shop: "thrift" | "sneakers";
  /** Roughly how much attention this product gets, 0–1. */
  heat: number;
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "White low-top sneakers",
    shop: "sneakers",
    price: 28_000,
    category: "Sneakers",
    description:
      "Clean leather low-tops that go with everything. True to size.\nShips from Lagos in 2 working days.",
    options: ["Size 40", "Size 41", "Size 42", "Size 43"],
    stock: 6,
    colour: [232, 230, 226],
    heat: 0.9,
  },
  {
    name: "Black runners",
    shop: "sneakers",
    price: 34_500,
    was: 39_000,
    category: "Sneakers",
    description: "Lightweight everyday runners. Breathable mesh upper.",
    options: ["Size 41", "Size 42", "Size 43", "Size 44"],
    stock: 3,
    colour: [44, 44, 48],
    heat: 0.75,
  },
  {
    name: "Tan leather loafers",
    shop: "sneakers",
    price: 42_000,
    category: "Shoes",
    description: "Hand-finished leather loafers. Wear them to work or a wedding.",
    options: ["Size 41", "Size 42", "Size 43"],
    stock: 2,
    colour: [166, 118, 72],
    heat: 0.85,
  },
  {
    name: "Long denim jacket",
    shop: "thrift",
    price: 26_000,
    category: "Clothing",
    description: "Oversized wash denim. Unisex fit.",
    options: ["S", "M", "L"],
    stock: 4,
    colour: [72, 92, 122],
    // The star of the dashboard: lots of looking, no buying.
    heat: 1,
  },
  {
    name: "Brown leather slides",
    shop: "sneakers",
    price: 19_500,
    category: "Shoes",
    description: "Soft leather slides with a moulded footbed.",
    options: ["Size 41", "Size 42", "Size 43"],
    stock: 0,
    status: "sold_out",
    colour: [124, 84, 58],
    heat: 0.6,
  },
  {
    name: "Canvas tote",
    shop: "thrift",
    price: 12_000,
    category: "Bags",
    description: "Heavy canvas, holds a laptop and then some.",
    stock: null,
    colour: [214, 176, 118],
    heat: 0.45,
  },
  {
    name: "Linen midi dress",
    shop: "thrift",
    price: 31_000,
    category: "Clothing",
    description: "Breathable linen, side pockets, fully lined.",
    options: ["S", "M", "L"],
    stock: 5,
    colour: [198, 186, 170],
    heat: 0.5,
  },
  {
    name: "Suede chelsea boots",
    shop: "sneakers",
    price: 47_000,
    category: "Shoes",
    description: "Not listed yet — waiting on the rest of the sizes.",
    options: ["Size 42", "Size 43"],
    stock: 2,
    status: "hidden",
    colour: [98, 74, 62],
    heat: 0.1,
  },
];

const CUSTOMERS = [
  { name: "Sade Adeyemi", phone: "2348031234567", instagram: "sadeadeyemi" },
  { name: "Tunde Bakare", phone: "2348062223344", instagram: null },
  { name: "Chioma Eze", phone: "2347015558899", instagram: "chiomaeze" },
  { name: "Kelechi Obi", phone: "2348094447711", instagram: null },
  { name: "Amara Nwosu", phone: "2348122229090", instagram: "amaranwosu" },
  { name: "Bola Martins", phone: "2348070001122", instagram: null },
];

const QUESTIONS = [
  "Do you have this in size 43?",
  "Is this still available?",
  "Can I get it delivered to Abuja, and how much?",
  "Is the leather genuine?",
  "Are you restocking this one?",
  "Does it run true to size or should I go a size up?",
];

async function main() {
  if (await one<{ id: string }>(`SELECT id FROM users WHERE email = ?`, DEMO_EMAIL)) {
    console.log("Demo shop already exists. Run `npm run db:reset` to rebuild it.");
    return;
  }

  const businessId = newId("biz");
  const createdAt = iso(40);

  await tx(async (t) => {
    await t.run(
      `INSERT INTO businesses
         (id, name, slug, tagline, owner_name, whatsapp, instagram, tiktok,
          location, currency, logo_image_id, handle, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      businessId,
      "Ada's Sneaker Corner",
      "adas-sneaker-corner",
      "Curated sneakers, shoes and everyday pieces. Lagos.",
      "Ada Okafor",
      "2348012345678",
      "adassneakercorner",
      null,
      "Lagos, Nigeria",
      "NGN",
      null,
      "shoop.adascorner",
      createdAt,
    );

    await t.run(
      `INSERT INTO users (id, business_id, email, password_hash, name, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      newId("usr"),
      businessId,
      DEMO_EMAIL,
      hashPassword(DEMO_PASSWORD),
      "Ada Okafor",
      createdAt,
    );

    const shopIds = new Map<string, string>();
    for (const [index, shop] of SHOPS.entries()) {
      const id = newId("shp");
      shopIds.set(shop.key, id);
      await t.run(
        `INSERT INTO shops
           (id, business_id, name, tag, slug, about, cover_image_id, position, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
        id,
        businessId,
        shop.name,
        shop.tag,
        shop.tag,
        shop.about,
        index,
        createdAt,
      );
    }

    // Categories live inside a shop, so the same name in two shops is two rows.
    const categoryIds = new Map<string, string>();
    let categoryPosition = 0;
    for (const product of PRODUCTS) {
      const key = `${product.shop}:${product.category}`;
      if (categoryIds.has(key)) continue;
      const id = newId("cat");
      categoryIds.set(key, id);
      await t.run(
        `INSERT INTO categories (id, business_id, shop_id, name, position)
         VALUES (?, ?, ?, ?, ?)`,
        id,
        businessId,
        shopIds.get(product.shop)!,
        product.category,
        categoryPosition++,
      );
    }

    const productIds: { id: string; seed: SeedProduct }[] = [];
    for (const [index, seed] of PRODUCTS.entries()) {
      const productId = newId("prd");
      const addedAt = iso(30 - index * 2);
      await t.run(
        `INSERT INTO products
           (id, business_id, shop_id, category_id, name, description, price_minor,
            compare_at_minor, status, stock, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        productId,
        businessId,
        shopIds.get(seed.shop)!,
        categoryIds.get(`${seed.shop}:${seed.category}`) ?? null,
        seed.name,
        seed.description,
        seed.price * 100,
        seed.was ? seed.was * 100 : null,
        seed.status ?? "active",
        seed.stock === undefined ? null : seed.stock,
        addedAt,
        addedAt,
      );

      // Two angles per product, so the gallery has something to scroll.
      for (let angle = 0; angle < 2; angle++) {
        const imageId = newId("img");
        await t.run(
          `INSERT INTO images (id, mime, bytes, created_at) VALUES (?, ?, ?, ?)`,
          imageId,
          "image/png",
          productPlaceholder(index * 7 + angle * 3, seed.colour),
          addedAt,
        );
        await t.run(
          `INSERT INTO product_images (id, product_id, image_id, position) VALUES (?, ?, ?, ?)`,
          newId("pim"),
          productId,
          imageId,
          angle,
        );
      }

      for (const [position, label] of (seed.options ?? []).entries()) {
        await t.run(
          `INSERT INTO product_options (id, product_id, label, in_stock, position)
           VALUES (?, ?, ?, 1, ?)`,
          newId("opt"),
          productId,
          label,
          position,
        );
      }

      productIds.push({ id: productId, seed });
    }

    const customerIds: string[] = [];
    for (const person of CUSTOMERS) {
      const id = newId("cus");
      const firstSeen = iso(18 + Math.floor(random() * 10));
      await t.run(
        `INSERT INTO customers
           (id, business_id, name, phone, instagram, note, created_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
        id,
        businessId,
        person.name,
        person.phone,
        person.instagram,
        firstSeen,
        iso(Math.floor(random() * 6)),
      );
      customerIds.push(id);
    }

    // Anonymous browsers: most people look without ever saying who they are.
    const visitorIds: string[] = [];
    for (let v = 0; v < 34; v++) {
      const id = newId("vis");
      const seen = iso(Math.floor(random() * 14));
      await t.run(
        `INSERT INTO visitors
           (id, business_id, device_token, customer_id, source, created_at, last_seen_at)
         VALUES (?, ?, ?, NULL, NULL, ?, ?)`,
        id,
        businessId,
        `seed-${id}`,
        seen,
        seen,
      );
      visitorIds.push(id);
    }

    const interest = async (
      kind: string,
      at: string,
      ref: {
        shopId?: string;
        productId?: string;
        visitorId?: string;
        customerId?: string;
      },
    ) =>
      await t.run(
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
        at,
      );

    // Shop visits.
    const allShopIds = [...shopIds.values()];
    for (const visitorId of visitorIds) {
      await interest("viewed_shop", iso(Math.floor(random() * 14)), {
        visitorId,
        shopId: pick(allShopIds),
      });
    }

    // Product views, weighted by how interesting each product is.
    for (const { id, seed } of productIds) {
      if (seed.status === "hidden") continue;
      const lookers = Math.round(seed.heat * 26);
      for (let i = 0; i < lookers; i++) {
        await interest("viewed_product", iso(Math.floor(random() * 14)), {
          shopId: shopIds.get(seed.shop)!,
          productId: id,
          visitorId: pick(visitorIds),
        });
      }
    }

    // Questions, mostly on the popular and the sold-out things.
    const asking = productIds.filter((p) => p.seed.heat > 0.5);
    for (let i = 0; i < 5; i++) {
      const product = pick(asking);
      const customerId = pick(customerIds);
      const at = iso(Math.floor(random() * 8));
      // Two are still waiting, so the dashboard has something to chase.
      const answered = i >= 2;
      await t.run(
        `INSERT INTO questions
           (id, business_id, product_id, customer_id, body, status, created_at, answered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        newId("qst"),
        businessId,
        product.id,
        customerId,
        QUESTIONS[i % QUESTIONS.length],
        answered ? "answered" : "waiting",
        at,
        answered ? at : null,
      );
      await interest("asked", at, {
        shopId: shopIds.get(product.seed.shop)!,
        productId: product.id,
        customerId,
      });
    }

    // Orders. The denim jacket deliberately gets none.
    const sellable = productIds.filter(
      (p) => p.seed.status === undefined && p.seed.name !== "Long denim jacket",
    );
    const statuses = ["new", "new", "confirmed", "completed", "completed", "cancelled"];

    for (const [index, status] of statuses.entries()) {
      const customerId = customerIds[index % customerIds.length];
      const at = iso(Math.floor(random() * 12));
      const orderId = newId("ord");
      const lines = Array.from({ length: 1 + Math.floor(random() * 2) }, () =>
        pick(sellable),
      );

      const unique = [...new Map(lines.map((line) => [line.id, line])).values()];
      const total = unique.reduce((sum, line) => sum + line.seed.price * 100, 0);

      await t.run(
        `INSERT INTO orders
           (id, business_id, shop_id, customer_id, reference, status, total_minor,
            note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        orderId,
        businessId,
        shopIds.get(unique[0].seed.shop)!,
        customerId,
        shortCode(5),
        status,
        total,
        index === 0 ? "Please deliver to Yaba on Saturday." : null,
        at,
        at,
      );

      for (const line of unique) {
        const option = (
          await all<{ label: string }>(
            `SELECT label FROM product_options WHERE product_id = ? ORDER BY position LIMIT 1`,
            line.id,
          )
        )[0];
        await t.run(
          `INSERT INTO order_items
             (id, order_id, product_id, name_at_time, option_label, unit_minor, qty)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          newId("oit"),
          orderId,
          line.id,
          line.seed.name,
          option?.label ?? null,
          line.seed.price * 100,
        );
        if (status !== "cancelled") {
          await interest("ordered", at, {
            shopId: shopIds.get(line.seed.shop)!,
            productId: line.id,
            customerId,
          });
        }
      }
    }

    // A couple of people who got as far as the basket and stopped.
    for (let i = 0; i < 3; i++) {
      const product = pick(productIds.filter((p) => p.seed.heat > 0.6));
      const at = iso(Math.floor(random() * 5));
      const visitorId = pick(visitorIds);
      const shopId = shopIds.get(product.seed.shop)!;
      await interest("added_to_cart", at, { shopId, productId: product.id, visitorId });
      if (i < 2) await interest("checkout_started", at, { shopId, visitorId });
    }
  });

  console.log("Seeded Ada's Sneaker Corner with 2 shops.");
  console.log(`  Owner sign-in : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  for (const shop of SHOPS) console.log(`  Shop          : /s/${shop.tag}  (${shop.name})`);
}

await main();
