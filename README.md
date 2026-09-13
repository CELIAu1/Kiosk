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
npm run db:seed     # creates data/kiosk.db with a demo shop and 2 weeks of activity
npm run dev
```

Then open <http://localhost:3000>.

| | |
|---|---|
| Demo shop (customer view) | `/s/adas-sneaker-corner` |
| Owner sign-in | `ada@example.com` / `kiosk1234` |

Other commands:

```bash
npm run db:reset    # wipe the database and re-seed
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint
```

No external services to configure. The database is a single SQLite file at
`data/kiosk.db` (override with `KIOSK_DB_PATH`), and uploaded images are stored in it,
so the whole shop is one portable file.

---

## The core loop

Everything in this MVP exists to serve one loop. Anything that didn't strengthen it was
left out.

```
owner adds a product
        ↓
shares one link (bio, status, DM)
        ↓
customer browses the shop
        ↓
customer shows interest — looks, asks, adds to an order
        ↓
the owner SEES that interest
        ↓
customer orders
        ↓
owner confirms and follows up, in WhatsApp where the customer already is
```

---

## Product decisions worth knowing about

### Interest is not a page. It's information attached to products and people.

The most valuable idea in KIOSK is that *customer interest should become useful business
information* — 30 people looking and 2 buying tells you something; 15 people asking the
same question tells you something.

The obvious move is an "Insights" or "Interest" tab. That would be wrong: it becomes a
page the owner has to remember to visit, disconnected from the thing it's about. So
interest is surfaced exactly where a decision gets made:

- **Home** — what needs a reply or a decision, right now.
- **Product** — how many people looked, asked, added, ordered, *plus a plain-language
  read of what that means* ("15 people looked and none ordered. Usually that is the
  price, the photo, or a missing size.").
- **Customer** — one timeline of everything that person looked at, asked and bought.

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

### Five destinations, and that's all.

**Home · Products · Orders · Customers · Shop.** A bottom tab bar on phones, a rail on
desktop. Mobile-first throughout, because the owner is usually packing an order or
answering a DM, not sitting at a desk.

---

## Information architecture

**Owner**

| Route | What it's for |
|---|---|
| `/home` | What needs attention, the last 7 days, interest that hasn't converted, recent activity |
| `/products`, `/products/new`, `/products/[id]` | The catalogue, plus per-product interest |
| `/orders`, `/orders/[id]` | The order pipeline |
| `/customers`, `/customers/[id]` | People, and everything they've done |
| `/questions` | Every question, filtered by waiting/answered |
| `/shop` | The shareable link, shop profile, contact handles, currency |

**Customer**

| Route | What it's for |
|---|---|
| `/s/[slug]` | The shop: header, categories, search, product grid |
| `/s/[slug]/p/[id]` | A product: photos, price, availability, choices, ask, add to order |
| `/s/[slug]/cart` | Review the order and check out |
| `/s/[slug]/order/[id]` | Order status, kept as a link the customer can return to |

---

## Visual direction

Editorial and commerce-first: warm paper ground, ink-black actions, hairline rules
instead of drop shadows, a tight type scale, and large product imagery given room to
breathe. Signal colour is used sparingly and only when it means something — ember for
*needs you*, green for *money in*, amber for *waiting*.

Deliberately avoided, per the product brief: gradients, glassmorphism, SaaS blue/purple,
floating-card soup, decorative charts and vanity metrics.

---

## Technical notes

- **Next.js 16** (App Router, Server Components, Server Actions) + **TypeScript** +
  **Tailwind CSS v4**.
- **`node:sqlite`** — Node's built-in SQLite. No native modules to compile, no database
  server to run.
- **Auth** is a scrypt password hash plus a database-backed session cookie.
- **Images** are stored as blobs and served from `/api/images/[id]` with immutable
  caching. Portable, and no object storage to set up before a business can post a photo.
- **Money** is stored as integer minor units (kobo/cents) — never floats — and formatted
  with `Intl.NumberFormat` using the business's own currency.
- **`src/proxy.ts`** mints the anonymous visitor cookie, because a Server Component
  cannot set a cookie during a render.
- Product views are de-duplicated per visitor per 6 hours, so a refresh doesn't inflate
  the number an owner is trying to make a decision from.
- Seed imagery is generated by a small hand-written PNG encoder (`scripts/png.ts`), so
  the repository ships no binary placeholder assets.

### Not in this MVP, on purpose

Payments, delivery/logistics, discount codes, multiple staff accounts, a variant matrix
(products take a flat list of choices instead), and analytics beyond what answers
*"what should I do next?"*.
