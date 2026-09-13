import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listShops } from "@/lib/data/shops";
import { listProducts } from "@/lib/data/products";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/PageHeader";
import { Thumb } from "@/components/Thumb";
import { Card, Chip, EmptyState, cx } from "@/components/ui";
import { LockIcon, SearchIcon } from "@/components/icons";

export const metadata = { title: "Price book" };
export const dynamic = "force-dynamic";

/**
 * The owner's private price list (232:2789). This is the screen they open
 * mid-conversation when a customer asks "how much?" — so it is a flat,
 * searchable list with the price as the loudest thing on each row.
 */
export default async function PriceBookPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shop?: string }>;
}) {
  const session = (await getSessionUser())!;
  const business = session.business;
  const { q, shop } = await searchParams;

  const shops = listShops(business.id);
  const activeShop = shops.find((s) => s.id === shop) ?? shops[0];
  const products = activeShop
    ? listProducts(business.id, { shopId: activeShop.id, search: q })
    : [];

  return (
    <>
      <PageHeader
        title="Price book"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <LockIcon className="h-3.5 w-3.5" />
            Private — customers never see this
          </span>
        }
      />

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <form method="get">
          {activeShop && <input type="hidden" name="shop" value={activeShop.id} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search products"
            aria-label="Search products"
            className="w-full rounded-full border-[0.5px] border-line bg-surface py-3 pr-4 pl-10 text-[13px] shadow-soft placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
        </form>
      </div>

      {shops.length > 1 && (
        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
          {shops.map((s) => (
            <Chip
              key={s.id}
              href={`/price-book?shop=${s.id}`}
              active={activeShop?.id === s.id}
              activeTone="dark"
            >
              {s.name}
            </Chip>
          ))}
        </div>
      )}

      {!activeShop ? (
        <EmptyState
          title="No shops yet"
          body="Your price book fills up as you add products to a shop."
        />
      ) : products.length === 0 ? (
        <EmptyState
          title={q ? "Nothing matched that" : "No products in this shop"}
          body={
            q
              ? "Try a different word."
              : "Add products and their prices land here automatically."
          }
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {products.map((product) => {
            const soldOut =
              product.status === "sold_out" ||
              (product.stock !== null && product.stock <= 0);
            return (
              <li key={product.id}>
                <Link href={`/products/${product.id}`}>
                  <Card className="flex items-center gap-3 p-3">
                    <Thumb
                      imageId={product.image_id}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-ink">
                        {product.name}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {product.category_name ?? "Uncategorised"} ·{" "}
                        <span className={cx(soldOut && "text-bad")}>
                          {soldOut ? "Sold out" : "In stock"}
                        </span>
                      </span>
                    </span>
                    <span className="tabular shrink-0 rounded-full border-[0.5px] border-line px-3 py-1.5 text-[13px] font-semibold text-ink">
                      {formatMoney(product.price_minor, business.currency)}
                    </span>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {activeShop && (
        <div className="pt-5 pb-6 text-center">
          <Link
            href={`/shops/${activeShop.id}`}
            className="text-[13px] font-semibold text-brand-link hover:underline"
          >
            Manage {activeShop.name}
          </Link>
        </div>
      )}
    </>
  );
}
