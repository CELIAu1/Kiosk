# KIOSK

**KIOSK gives small businesses one simple place to showcase what they sell, organise
customer interest, manage orders, and turn conversations into sales — without needing a
full e-commerce website.**

It sits in the gap between *"I sell through Instagram and WhatsApp"* and *"I have a
proper online store."* Social media stays the place people discover you. KIOSK is the
organised destination you send them to, and the record of what happened next.

---

## Running it

```bash
npm install
npm run db:seed     # creates data/kiosk.db with two demo shops and 2 weeks of activity
npm run dev
```

Then open <http://localhost:3000>.

| | |
|---|---|
| Owner sign-in | `ada@example.com` / `kiosk1234` |
| Demo shops (customer view) | `/s/thriftbypemz` · `/s/adassneakers` |

Other commands:

```bash
npm run db:migrate  # apply the schema (safe to re-run)
npm run db:reset    # wipe the database and re-seed
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint
```

Local development needs no configuration: the app defaults to a SQLite file at
`data/kiosk.db`, and uploaded images are stored in it, so the whole shop is one
portable file.

---

## Deploying

KIOSK runs on **libSQL**, which is SQLite reachable over the network. Local development
points at a file and production points at a hosted database, so both run the identical
code — the only difference is the URL.

This matters because **a local SQLite file cannot work on serverless hosting**: the
filesystem is read-only apart from `/tmp`, `/tmp` is per-instance and wiped, and every
route here is server-rendered on demand. A hosted database is not a nicety, it is the
thing that makes deployment possible at all.

### 1. Create a database

```bash
turso db create kiosk
turso db show kiosk --url      # -> libsql://kiosk-you.turso.io
turso db tokens create kiosk   # -> the auth token
```

### 2. Apply the schema, once

```bash
TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" npm run db:migrate
```

Every statement is `CREATE … IF NOT EXISTS`, so this is safe to re-run. To put the demo
data in a hosted database, run `npm run db:seed` with the same two variables set.

### 3. Set the environment variables

Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` on the host, for every environment you
deploy (Production, Preview, Development). See `.env.example`. Node 22.5+ is required and
declared in `engines`.

If `TURSO_DATABASE_URL` is missing in production the app fails immediately with a message
saying so, rather than silently falling back to a local file it cannot write.

### 4. Check the framework preset

`vercel.json` pins `"framework": "nextjs"`, and settings there override the dashboard.

This matters because a project created with the **Framework Preset set to "Other"** is
treated as a static site, and a static site's default output directory is `public/`. The
build then fails with:

```
No Output Directory named "public" found after the Build completed.
```

Next.js builds to `.next`, never to `public/`, so that error means the preset was wrong —
not that anything is missing from the repository. If you still see it, open
**Project Settings → Build & Deployment** and confirm:

| Setting | Value |
|---|---|
| Framework Preset | **Next.js** |
| Root Directory | `./` (repository root) |
| Build Command | leave on the default (`next build`) |
| Output Directory | leave on the default — **do not set it to `public`** |
| Install Command | leave on the default |

Clear any override that was set while the preset was "Other", then redeploy.

There is no build step that touches the database, and nothing is written to disk at
runtime.

---

## The core loop

Everything in this MVP exists to serve one loop. Anything that didn't strengthen it was
left out.

```
owner creates a shop — one per thing they sell
        ↓
adds products to it
        ↓
puts the shop's @tag in a bio, a status, a DM
        ↓
customer taps the tag and browses that shop
        ↓
customer shows interest — looks, asks, adds to an order
        ↓
the owner SEES that interest
        ↓
customer orders
        ↓
owner confirms and follows up, in WhatsApp where the customer already is
```

## Built from the designs

The screens follow the Figma file (`IiBjPQVrRnqC0A4Hf5eeHr`): Home, My shops, shop
catalogue, Price book, Interest, Profile, the onboarding carousel and the shop-creation
wizard. Colour, type, radii and elevation are taken from that file rather than invented —
`#007aff` primary, fully-rounded pills, white cards on light grey, DM Sans for the
interface and Montserrat for stat numerals.

Two deliberate departures, both noted here so they're easy to challenge:

- **"Guides & Links" is not built.** That section of the Figma home screen contains
  placeholder content from a different product ("How to Invest on Cluster", a "Finance"
  tag). There is no KIOSK meaning to implement.
- **Orders, customers and questions exist but are off the bottom bar.** The designs show
  no ordering flow, while the written brief asks for one (§7, §14). Rather than drop
  either, the four designed tabs stay exactly as drawn and those screens are reached from
  Home and from Profile → Account.

---

## Product decisions worth knowing about

### Interest is both a tab and a thread through the app.

The most valuable idea in KIOSK is that *customer interest should become useful business
information* — 30 people looking and 2 buying tells you something; 15 people asking the
same question tells you something.

The designs give interest its own tab, so it has one. But a tab on its own would be a
page the owner has to remember to visit, so the same information also surfaces where a
decision actually gets made:

- **Interest** — who has been looking, at what, and which interest hasn't become a sale.
- **Home** — the week's numbers, "Customer interest", and "Getting attention".
- **Product** — how many people looked, asked, added, ordered, *plus a plain-language
  read of what that means* ("15 people looked and none ordered. Usually that is the
  price, the photo, or a missing size.").
- **Customer** — one timeline of everything that person looked at, asked and bought.

### One shop per thing you sell.

A business owns many shops, each with its own @tag, categories and products. That is the
model the designs describe ("One shop per thing you sell. You can add more later.") and
it matches how these businesses actually talk about themselves. The tag is the share
mechanic: `/s/thriftbypemz` opens that shop and nothing else — carts, orders and view
counts are all scoped to it.

### Anonymous browsing is stitched to the person retroactively.

Visitors get an opaque per-device token. The moment someone gives their name and number
to ask a question or place an order, their earlier trail is backfilled onto that customer
record — so the owner sees *"Ngozi looked at the denim jacket, asked about sizing, then
ordered"*, not two unconnected fragments.

### Answering happens in WhatsApp, not here.

KIOSK doesn't try to replace the conversation. A waiting question comes with a
**Reply on WhatsApp** button that opens the chat with the customer's name and the product
already written into the message. KIOSK's job is making sure nothing gets lost — not
moving the relationship onto a new platform.

### Checkout collects what a small business actually needs.

Name, number, and an optional note. Payment happens the way it already does between that
business and that customer — transfer, cash, on delivery. Building a payment gateway into
the MVP would have added the most complexity for the least benefit to the core loop.

### Plain language everywhere.

"People interested", not "conversion analytics". "Products", not "inventory management".
"Customers", not "CRM". Order states read *New → In progress → Completed → Cancelled*.

### Four destinations, and that's all.

**Home · Shops · Interest · Profile**, exactly as drawn. The app is a single mobile
column that stays phone-width on a large screen, because the designs are a phone app and
the owner is usually packing an order or answering a DM, not sitting at a desk.

---

## Information architecture

**Owner**

| Route | What it's for |
|---|---|
| `/home` | The week's numbers, shops, customer interest, what's getting attention |
| `/shops`, `/shops/new`, `/shops/[shopId]` | The shops, the creation wizard, each shop's catalogue |
| `/shops/[shopId]/products/new`, `/products/[id]` | Adding a product, and per-product interest |
| `/interest` | Who's been looking, most viewed, and interest that hasn't converted |
| `/price-book` | The private price list, searchable, per shop |
| `/profile`, `/profile/edit` | Stats, contact channels, shop tags, account |
| `/orders`, `/customers`, `/questions` | Off-nav, reached from Home and Profile → Account |

**Customer**

| Route | What it's for |
|---|---|
| `/s/[handle]` | A shop, opened by its @tag: header, categories, search, product grid |
| `/s/[handle]/p/[id]` | A product: photos, price, availability, choices, ask, add to order |
| `/s/[handle]/cart` | Review the order and check out |
| `/s/[handle]/order/[id]` | Order status, kept as a link the customer can return to |

---

## Visual direction

Taken from the Figma file, not invented. `#007aff` primary on fully-rounded pills, white
cards (radius 10 / 15 / 22) with two documented elevations on a light grey ground, a
black bottom bar with a blue active tab, and the blue tag banner with its yellow
highlight. DM Sans carries the interface; Montserrat sets stat numerals. Status colour is
used only where state has to read at a glance.

---

## Technical notes

- **Next.js 16** (App Router, Server Components, Server Actions) + **TypeScript** +
  **Tailwind CSS v4**.
- **libSQL** (`@libsql/client`) — SQLite, either as a local file or a hosted database.
  The data layer is async throughout because the client is.
- **Auth** is a scrypt password hash plus a database-backed session cookie.
- **Images** are stored as blobs and served from `/api/images/[id]` with immutable
  caching, so the CDN serves each one after a single read and there is no object storage
  to configure before a business can post a photo.
- **Money** is stored as integer minor units (kobo/cents) — never floats — and formatted
  with `Intl.NumberFormat` using the business's own currency.
- **`src/proxy.ts`** mints the anonymous visitor cookie, because a Server Component
  cannot set a cookie during a render.
- **Shop tags** are unique across every business, lowercased and stripped to
  `[a-z0-9]`, because they appear in URLs and on social profiles.
- **Writes are queued in-process when the database is a local file.** One SQLite file
  cannot take concurrent writers, and these pages write on nearly every view. A hosted
  database serialises this itself, so remote writes are passed straight through.
- Product views are de-duplicated per visitor per 6 hours, so a refresh doesn't inflate
  the number an owner is trying to make a decision from.
- Seed imagery is generated by a small hand-written PNG encoder (`scripts/png.ts`), so
  the repository ships no binary placeholder assets.

### Not in this MVP, on purpose

Payments, delivery/logistics, discount codes, multiple staff accounts, a variant matrix
(products take a flat list of choices instead), social sign-in (the designs show Google
and Apple buttons; email and password is what's wired), and analytics beyond what answers
*"what should I do next?"*.

The schema lives in `src/lib/schema.ts` and is applied by `npm run db:migrate`. There is
no migration history yet — while the schema is still moving, `npm run db:reset` is the
local upgrade path.
