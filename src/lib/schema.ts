/**
 * KIOSK schema.
 *
 * Kept deliberately small. Every table here exists to serve the core loop:
 * a business lists what it sells -> a customer discovers it -> the customer
 * shows interest -> that interest becomes something the owner can act on.
 *
 * Money is stored in minor units (kobo, cents) as integers. Never floats.
 * Timestamps are ISO-8601 UTC strings so they sort lexicographically.
 */
export const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS businesses (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  tagline        TEXT,
  owner_name     TEXT,
  whatsapp       TEXT,
  instagram      TEXT,
  tiktok         TEXT,
  location       TEXT,
  currency       TEXT NOT NULL DEFAULT 'NGN',
  logo_image_id  TEXT,
  -- The account-level handle shown under "Welcome <name>!" on Home.
  handle         TEXT NOT NULL UNIQUE,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  business_id   TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Images live in the database so the app is portable with no object store.
CREATE TABLE IF NOT EXISTS images (
  id         TEXT PRIMARY KEY,
  mime       TEXT NOT NULL,
  bytes      BLOB NOT NULL,
  created_at TEXT NOT NULL
);

-- A business runs one shop per thing it sells ("Sneakers", "Thrift by Pemz").
-- Each shop is separately shareable and has its own tag, categories and products.
CREATE TABLE IF NOT EXISTS shops (
  id             TEXT PRIMARY KEY,
  business_id    TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  -- The @tag a customer can use to open this shop. The share mechanic.
  tag            TEXT NOT NULL UNIQUE,
  slug           TEXT NOT NULL UNIQUE,
  about          TEXT,
  cover_image_id TEXT,
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shops_business ON shops(business_id, position);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shop_id     TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_categories_shop ON categories(shop_id, position);

CREATE TABLE IF NOT EXISTS products (
  id               TEXT PRIMARY KEY,
  business_id      TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shop_id          TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id      TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  price_minor      INTEGER NOT NULL,
  compare_at_minor INTEGER,
  -- 'active' shows in the shop, 'hidden' is owner-only, 'sold_out' shows but cannot be ordered.
  status           TEXT NOT NULL DEFAULT 'active',
  -- NULL means the owner is not counting stock for this product.
  stock            INTEGER,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id, status);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id, status);

CREATE TABLE IF NOT EXISTS product_images (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_id   TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, position);

-- A flat list of choices (size 42, black, 12 inches). Not a variant matrix:
-- small businesses think in "which one do you want", not in option axes.
CREATE TABLE IF NOT EXISTS product_options (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  in_stock   INTEGER NOT NULL DEFAULT 1,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_options_product ON product_options(product_id, position);

CREATE TABLE IF NOT EXISTS customers (
  id           TEXT PRIMARY KEY,
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone        TEXT,
  instagram    TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id, last_seen_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers(business_id, phone)
  WHERE phone IS NOT NULL;

-- An anonymous browser, before they tell us who they are.
CREATE TABLE IF NOT EXISTS visitors (
  id            TEXT PRIMARY KEY,
  business_id   TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  -- Anonymous per-device token from the cookie the proxy mints.
  device_token  TEXT NOT NULL,
  customer_id   TEXT REFERENCES customers(id) ON DELETE SET NULL,
  source        TEXT,
  created_at    TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_visitors_device
  ON visitors(business_id, device_token);

-- The heart of the product: interest, recorded so it does not vanish into a DM.
CREATE TABLE IF NOT EXISTS interest_events (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shop_id     TEXT REFERENCES shops(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id) ON DELETE CASCADE,
  visitor_id  TEXT,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  -- viewed_shop | viewed_product | asked | saved | added_to_cart | checkout_started | ordered
  kind        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interest_business ON interest_events(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interest_product ON interest_events(product_id, kind);
CREATE INDEX IF NOT EXISTS idx_interest_shop ON interest_events(shop_id, kind, created_at DESC);

CREATE TABLE IF NOT EXISTS questions (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'waiting',
  created_at  TEXT NOT NULL,
  answered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_questions_business ON questions(business_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS cart_items (
  id          TEXT PRIMARY KEY,
  visitor_id  TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shop_id     TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_id   TEXT REFERENCES product_options(id) ON DELETE SET NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cart_visitor ON cart_items(visitor_id);

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shop_id     TEXT REFERENCES shops(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reference   TEXT NOT NULL,
  -- new | confirmed | completed | cancelled
  status      TEXT NOT NULL DEFAULT 'new',
  total_minor INTEGER NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_reference ON orders(business_id, reference);

CREATE TABLE IF NOT EXISTS order_items (
  id           TEXT PRIMARY KEY,
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   TEXT REFERENCES products(id) ON DELETE SET NULL,
  name_at_time TEXT NOT NULL,
  option_label TEXT,
  unit_minor   INTEGER NOT NULL,
  qty          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`;
