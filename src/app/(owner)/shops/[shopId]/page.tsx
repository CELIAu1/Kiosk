import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getShop } from "@/lib/data/shops";
import { listCategories } from "@/lib/data/business";
import { listProducts } from "@/lib/data/products";
import { origin } from "@/lib/url";
import { formatMoney } from "@/lib/money";
import { Thumb } from "@/components/Thumb";
import { ShareShop } from "@/components/ShareShop";
import { Badge, ButtonLink, Chip, EmptyState, IconLink, cx } from "@/components/ui";
import { ArrowLeftIcon, MoreIcon, PlusIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const session = await getSessionUser();
  if (!session) return { title: "Shop" };
  const shop = getShop(session.business.id, (await params).shopId);
  return { title: shop?.name ?? "Shop" };
}

export default async function ShopCataloguePage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { shopId } = await params;
  const { c } = await searchParams;
  const session = (await getSessionUser())!;
  const business = session.business;

  const shop = getShop(business.id, shopId);
  if (!shop) notFound();

  const categories = listCategories(business.id, shop.id);
  const active = categories.find((category) => category.id === c);
  const products = listProducts(business.id, {
    shopId: shop.id,
    categoryId: active?.id,
  });
  const base = await origin();

  return (
    <>
      {/* The catalogue header in the design is a dark band that lets the
          product photography below it carry the screen. */}
      <div className="-mx-5 bg-black px-5 pt-5 pb-4 text-white">
        <div className="flex items-center justify-between">
          <IconLink href="/shops" aria-label="All shops" tone="ghost">
            <ArrowLeftIcon className="h-5 w-5" />
          </IconLink>
          <div className="flex items-center gap-3">
            <IconLink
              href={`/shops/${shop.id}/products/new`}
              aria-label="Add a product"
              tone="ghost"
            >
              <PlusIcon className="h-5 w-5" />
            </IconLink>
            <ShareShop url={`${base}/s/${shop.tag}`} tone="soft" label="Share" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-white/10 text-[15px] font-bold">
            {shop.cover_ids[0] ? (
              <Thumb imageId={shop.cover_ids[0]} alt="" className="h-full w-full" />
            ) : (
              shop.name.charAt(0).toUpperCase()
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-bold">{shop.name}</span>
            <span className="block text-[12px] text-white/60">
              @{shop.tag} · {shop.product_count}{" "}
              {shop.product_count === 1 ? "item" : "items"}
            </span>
          </span>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-4">
          <Chip href={`/shops/${shop.id}`} active={!active}>
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              href={`/shops/${shop.id}?c=${category.id}`}
              active={active?.id === category.id}
            >
              {category.name}
            </Chip>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          title="Nothing in this shop yet"
          body="Add what you sell — a photo, a name and a price is enough to start."
          action={
            <ButtonLink href={`/shops/${shop.id}/products/new`}>
              Add a product
            </ButtonLink>
          }
        />
      ) : (
        /* Staggered two-column grid, as in the design. */
        <ul className="grid grid-cols-2 gap-x-3 gap-y-4 pt-1 pb-6">
          {products.map((product, index) => {
            const soldOut =
              product.status === "sold_out" ||
              (product.stock !== null && product.stock <= 0);
            return (
              <li
                key={product.id}
                className={cx(index % 2 === 1 && "mt-6")}
              >
                <Link href={`/products/${product.id}`} className="block">
                  <span className="relative block overflow-hidden rounded-card">
                    <Thumb
                      imageId={product.image_id}
                      alt={product.name}
                      ratio="portrait"
                      className={cx("w-full", soldOut && "opacity-60")}
                    />
                    {product.status === "hidden" && (
                      <span className="absolute top-2 left-2">
                        <Badge>Hidden</Badge>
                      </span>
                    )}
                    {soldOut && (
                      <span className="absolute top-2 left-2">
                        <Badge tone="warn">Sold out</Badge>
                      </span>
                    )}
                  </span>
                  <span className="mt-2 flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-ink">
                        {product.name}
                      </span>
                      <span className="tabular block text-[12px] text-ink-soft">
                        {formatMoney(product.price_minor, business.currency)}
                      </span>
                    </span>
                    <MoreIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
