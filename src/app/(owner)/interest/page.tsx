import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listShops } from "@/lib/data/shops";
import {
  getPulse,
  mostViewedProducts,
  productsWithUnconvertedInterest,
  recentInterestSummaries,
  shopViews,
} from "@/lib/data/interest";
import { customersToFollowUp } from "@/lib/data/customers";
import { countWaitingQuestions } from "@/lib/data/questions";
import { formatMoney } from "@/lib/money";
import { timeAgo } from "@/lib/time";
import { PageHeader } from "@/components/PageHeader";
import { Thumb } from "@/components/Thumb";
import {
  ButtonLink,
  Card,
  EmptyState,
  Monogram,
  SectionHeading,
  Stat,
  Sunk,
} from "@/components/ui";
import { ChevronRightIcon, EyeIcon, TagIcon, WalletIcon } from "@/components/icons";

export const metadata = { title: "Interest" };
export const dynamic = "force-dynamic";

/**
 * Interest gets its own tab because the design gives it one. What it holds is
 * the answer to "who is looking, at what, and what should I do about it" —
 * not a wall of charts.
 */
export default async function InterestPage() {
  const session = await requireSession();
  const business = session.business;

  const pulse = getPulse(business.id, 7);
  const shops = listShops(business.id);
  const summaries = recentInterestSummaries(business.id, 8);
  const attention = mostViewedProducts(business.id, 8);
  const stalled = productsWithUnconvertedInterest(business.id);
  const followUps = customersToFollowUp(business.id);
  const waiting = countWaitingQuestions(business.id);

  const nothingYet = summaries.length === 0 && attention.length === 0;

  return (
    <>
      <PageHeader title="Interest" subtitle="What customers are doing in your shops" />

      <div className="space-y-7 pb-6">
        <div className="flex gap-3">
          <Stat
            value={pulse.people}
            label="People this week"
            icon={<EyeIcon className="h-4 w-4" />}
          />
          <Stat
            value={pulse.productViews}
            label="Products viewed"
            icon={<TagIcon className="h-4 w-4" />}
          />
          <Stat
            value={formatMoney(pulse.salesMinor, business.currency)}
            label={`${pulse.orders} ${pulse.orders === 1 ? "order" : "orders"}`}
            icon={<WalletIcon className="h-4 w-4" />}
          />
        </div>

        {waiting > 0 && (
          <Link href="/questions">
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-tint text-[14px] font-bold text-brand">
                {waiting}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">
                  {waiting === 1 ? "A question is" : "Questions are"} waiting
                </span>
                <span className="block text-[12px] text-ink-soft">
                  Someone asked and hasn&rsquo;t heard back
                </span>
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-soft" />
            </Card>
          </Link>
        )}

        {nothingYet ? (
          <EmptyState
            title="No interest recorded yet"
            body="Share a shop link. Everything customers look at and ask about shows up here."
            action={
              shops.length > 0 ? (
                <ButtonLink href="/shops">Share a shop</ButtonLink>
              ) : (
                <ButtonLink href="/shops/new">Create your first shop</ButtonLink>
              )
            }
          />
        ) : (
          <>
            {shops.length > 0 && (
              <section>
                <SectionHeading title="Views by shop" />
                <div className="space-y-2">
                  {shops.map((shop) => (
                    <Link key={shop.id} href={`/shops/${shop.id}`}>
                      <Sunk className="flex items-center gap-3 p-3">
                        <Thumb
                          imageId={shop.cover_ids[0] ?? null}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-[6px]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-ink">
                            {shop.name}
                          </span>
                          <span className="block text-[12px] text-ink-soft">
                            @{shop.tag}
                          </span>
                        </span>
                        <span className="num shrink-0 text-[14px] font-semibold text-ink">
                          {shopViews(shop.id, 7)}
                        </span>
                      </Sunk>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {attention.length > 0 && (
              <section>
                <SectionHeading title="Most viewed" />
                <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
                  {attention.map((tile) => (
                    <Link
                      key={tile.id}
                      href={`/products/${tile.id}`}
                      className="relative block h-32 w-24 shrink-0 overflow-hidden rounded-card"
                      title={tile.name}
                    >
                      <Thumb imageId={tile.image_id} alt={tile.name} className="h-full w-full" />
                      <span className="absolute right-1.5 bottom-1.5 rounded-full bg-scrim px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {tile.views}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {summaries.length > 0 && (
              <section>
                <SectionHeading title="Who's been looking" />
                <Sunk radius="panel" className="divide-y divide-line-warm shadow-soft">
                  {summaries.map((row) => (
                    <Link
                      key={row.key}
                      href={row.customer_id ? `/customers/${row.customer_id}` : "/interest"}
                      className="flex items-center gap-3 p-4"
                    >
                      <Monogram name={row.who} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">
                          {row.who} viewed {row.product_count}{" "}
                          {row.product_count === 1 ? "product" : "products"}
                        </span>
                        <span className="block truncate text-[12px] text-ink-soft">
                          {row.product_names?.split(",").join(", ")}
                        </span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-soft" />
                    </Link>
                  ))}
                </Sunk>
              </section>
            )}

            {/* Interest that hasn't turned into money — the actionable half. */}
            {(stalled.length > 0 || followUps.length > 0) && (
              <section>
                <SectionHeading
                  title="Worth a look"
                  note="Interest that hasn't become a sale yet."
                />
                <Sunk radius="panel" className="divide-y divide-line-warm">
                  {stalled.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="flex items-center gap-3 p-4"
                    >
                      <Thumb
                        imageId={product.image_id}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-[8px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">
                          {product.name}
                        </span>
                        <span className="block text-[12px] text-ink-soft">
                          {product.views} looked, nobody ordered
                          {product.stock !== null && product.stock <= 0
                            ? " — it's sold out"
                            : ""}
                        </span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-soft" />
                    </Link>
                  ))}
                  {followUps.map((customer) => (
                    <Link
                      key={customer.id}
                      href={`/customers/${customer.id}`}
                      className="flex items-center gap-3 p-4"
                    >
                      <Monogram name={customer.name} className="h-11 w-11" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">
                          {customer.name}
                        </span>
                        <span className="block truncate text-[12px] text-ink-soft">
                          {customer.last_product
                            ? `Interested in ${customer.last_product}, hasn't ordered`
                            : "Looked around, hasn't ordered"}{" "}
                          · {timeAgo(customer.last_seen_at)}
                        </span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-soft" />
                    </Link>
                  ))}
                </Sunk>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
