import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listShops } from "@/lib/data/shops";
import { listProducts } from "@/lib/data/products";
import { countWaitingQuestions } from "@/lib/data/questions";
import { countOrders } from "@/lib/data/orders";
import {
  getPulse,
  mostViewedProducts,
  recentInterestSummaries,
} from "@/lib/data/interest";
import { Thumb } from "@/components/Thumb";
import { CopyTag } from "@/components/CopyTag";
import { TagBanner } from "@/components/TagBanner";
import { ShopCardTile } from "@/components/ShopCardTile";
import {
  ButtonLink,
  Card,
  IconLink,
  Monogram,
  SeeAll,
  SectionHeading,
  Stat,
  Sunk,
} from "@/components/ui";
import {
  BellIcon,
  ChevronRightIcon,
  EyeIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  TagIcon,
  WalletIcon,
} from "@/components/icons";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireSession();
  const business = session.business;

  const shops = listShops(business.id);
  const pulse = getPulse(business.id, 7);
  const interest = recentInterestSummaries(business.id, 3);
  const attention = mostViewedProducts(business.id, 6);
  const products = listProducts(business.id);
  const waiting = countWaitingQuestions(business.id);
  const newOrders = countOrders(business.id, "new");

  const firstName = (business.owner_name ?? business.name).split(" ")[0];

  return (
    <>
      <header className="pt-5">
        <div className="flex items-center justify-between">
          <span className="block h-10 w-10 overflow-hidden rounded-[6px] bg-sunk">
            {business.logo_image_id ? (
              <img
                src={`/api/images/${business.logo_image_id}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-brand text-[15px] font-bold text-white">
                {business.name.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          <div className="flex items-center gap-4">
            <IconLink href="/questions" aria-label="Notifications" className="relative">
              <BellIcon className="h-5 w-5" />
              {(waiting > 0 || newOrders > 0) && (
                <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-brand" />
              )}
            </IconLink>
            <IconLink href="/profile" aria-label="Your shop tags">
              <ShareIcon className="h-5 w-5" />
            </IconLink>
          </div>
        </div>

        <div className="mt-4 opacity-90">
          <h1 className="text-[18px] font-bold text-black">Welcome {firstName}!</h1>
          <CopyTag value={business.handle} className="mt-2.5" />
        </div>
      </header>

      {shops.length === 0 ? (
        <EmptyHome />
      ) : (
        <div className="mt-6 space-y-6">
          <form method="get" action="/shops" className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              name="q"
              placeholder="Search..."
              aria-label="Search your products"
              className="w-full rounded-[8px] border-[0.5px] border-line bg-sunk py-3 pr-4 pl-10 text-[12px] font-medium text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
          </form>

          <TagBanner tag={shops[0].tag} href="/profile" />

          {/* The two things an owner opens most often. */}
          <div className="grid grid-cols-2 gap-4">
            <QuickLink
              href={`/shops/${shops[0].id}/products/new`}
              icon={<PlusIcon className="h-[18px] w-[18px]" />}
              label="Add products"
            />
            <QuickLink
              href="/price-book"
              icon={<WalletIcon className="h-[18px] w-[18px]" />}
              label="Price book"
            />
          </div>

          <section>
            <Link
              href="/interest"
              className="mb-3 flex items-center justify-between"
            >
              <span className="text-[14px] font-semibold text-ink-muted">
                Statistics over the past 7 days
              </span>
              <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
            </Link>
            <div className="flex gap-3">
              <Stat
                value={pulse.people}
                label="Overall shop views"
                icon={<EyeIcon className="h-4 w-4" />}
              />
              <Stat
                value={pulse.productViews}
                label="Products viewed"
                icon={<TagIcon className="h-4 w-4" />}
              />
              <Stat
                value={products.length}
                label="Products listed"
                icon={<WalletIcon className="h-4 w-4" />}
              />
            </div>
          </section>

          <section>
            <Link href="/shops" className="mb-3 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-black">My Shops</span>
              <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
            </Link>
            <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
              {shops.map((shop) => (
                <ShopCardTile key={shop.id} shop={shop} />
              ))}
            </div>
            <ButtonLink
              href="/shops/new"
              tone="dashed"
              className="mt-3 h-auto w-full rounded-card py-4"
            >
              <PlusIcon className="h-5 w-5" />
              Add a Shop
            </ButtonLink>
          </section>

          {interest.length > 0 && (
            <section>
              <SectionHeading
                title="Customer interest"
                action={<SeeAll href="/interest" />}
              />
              <Sunk radius="panel" className="divide-y divide-line-warm shadow-soft">
                {interest.map((row) => (
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

          {attention.length > 0 && (
            <section>
              <SectionHeading
                title="Getting attention"
                action={<SeeAll href="/interest" />}
              />
              <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
                {attention.map((tile) => (
                  <Link
                    key={tile.id}
                    href={`/products/${tile.id}`}
                    className="relative block h-32 w-24 shrink-0 overflow-hidden rounded-card"
                    title={tile.name}
                  >
                    <Thumb
                      imageId={tile.image_id}
                      alt={tile.name}
                      className="h-full w-full"
                    />
                    <span className="absolute right-1.5 bottom-1.5 rounded-full bg-scrim px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {tile.views}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card radius="tile" className="flex h-full flex-col gap-2 p-4">
        <span className="text-ink">{icon}</span>
        <span className="text-[12px] font-semibold text-ink">{label}</span>
      </Card>
    </Link>
  );
}

/** 232:1754 — nothing works until there is a shop, so say only that. */
function EmptyHome() {
  return (
    <div className="mt-6">
      <form method="get" action="/shops" className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          name="q"
          placeholder="Search..."
          aria-label="Search"
          className="w-full rounded-[8px] border-[0.5px] border-line bg-sunk py-3 pr-4 pl-10 text-[12px] font-medium placeholder:text-ink-faint focus:border-brand focus:outline-none"
        />
      </form>

      <div className="flex flex-col items-center py-20 text-center">
        <StorefrontMark />
        <p className="mt-5 max-w-[16rem] text-[12px] leading-relaxed text-ink-soft">
          Create your first shop to unlock your full tools and statistics
        </p>
      </div>

      <div className="space-y-3">
        <ButtonLink href="/shops/new" tone="dashed" className="w-full text-brand">
          <StoreMini />
          Create your first shop
        </ButtonLink>
        <ButtonLink href="/profile/edit" className="w-full">
          <PlusIcon className="h-4 w-4" />
          Complete your profile
        </ButtonLink>
      </div>
    </div>
  );
}

function StorefrontMark() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-line"
      aria-hidden
    >
      <path d="M12 24h40v26a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" />
      <path d="M12 24 16 12h32l4 12" />
      <path d="M25 24v8M39 24v8" />
      <circle cx="22" cy="44" r="7" />
      <path d="M22 41v6M19 44h6" />
    </svg>
  );
}

function StoreMini() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M3.5 9 5 4.5h14L20.5 9" />
    </svg>
  );
}
