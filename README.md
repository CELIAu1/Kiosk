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
| Owner sign-in | `ada@example.com` / `kiosk1234` |
| Demo shops (customer view) | `/s/thriftbypemz` · `/s/adassneakers` |

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
- **`node:sqlite`** — Node's built-in SQLite. No native modules to compile, no database
  server to run.
- **Auth** is a scrypt password hash plus a database-backed session cookie.
- **Images** are stored as blobs and served from `/api/images/[id]` with immutable
  caching. Portable, and no object storage to set up before a business can post a photo.
- **Money** is stored as integer minor units (kobo/cents) — never floats — and formatted
  with `Intl.NumberFormat` using the business's own currency.
- **`src/proxy.ts`** mints the anonymous visitor cookie, because a Server Component
  cannot set a cookie during a render.
- **Shop tags** are unique across every business, lowercased and stripped to
  `[a-z0-9]`, because they appear in URLs and on social profiles.
- Product views are de-duplicated per visitor per 6 hours, so a refresh doesn't inflate
  the number an owner is trying to make a decision from.
- Seed imagery is generated by a small hand-written PNG encoder (`scripts/png.ts`), so
  the repository ships no binary placeholder assets.

### Not in this MVP, on purpose

Payments, delivery/logistics, discount codes, multiple staff accounts, a variant matrix
(products take a flat list of choices instead), social sign-in (the designs show Google
and Apple buttons; email and password is what's wired), and analytics beyond what answers
*"what should I do next?"*.

The database is created from `src/lib/schema.ts` on first connection and there are no
migrations yet — while the schema is still moving, `npm run db:reset` is the upgrade
path.
