import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopByHandle } from "@/lib/data/shops";
import { getBusinessById, listPublicCategories } from "@/lib/data/business";
import { listProducts } from "@/lib/data/products";
import { recordInterest } from "@/lib/data/interest";
import { getVisitorId } from "@/lib/visitor";
import { formatMoney } from "@/lib/money";
import { whatsappLink } from "@/lib/url";
import { Thumb } from "@/components/Thumb";
import { Badge, ButtonLink, Chip, EmptyState, cx } from "@/components/ui";
import { SearchIcon, WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const shop = getShopByHandle((await params).handle);
  if (!shop) return { title: "Shop" };
  return {
    title: { absolute: shop.name },
    description: shop.about ?? `Browse what ${shop.name} has for sale.`,
  };
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ q?: string; c?: string }>;
}) {
  const { handle } = await params;
  const { q, c } = await searchParams;

  const shop = getShopByHandle(handle);
  if (!shop) notFound();
  const business = getBusinessById(shop.business_id);
  if (!business) notFound();

  const visitorId = await getVisitorId(shop.business_id);
  if (visitorId) {
    recordInterest(shop.business_id, "viewed_shop", { shopId: shop.id, visitorId });
  }

  const categories = listPublicCategories(shop.id);
  const active = categories.find((category) => category.id === c);
  const products = listProducts(shop.business_id, {
    shopId: shop.id,
    publicOnly: true,
    search: q,
    categoryId: active?.id,
  });

  const whatsapp = whatsappLink(
    business.whatsapp,
    `Hi ${shop.name}, I saw your shop.`,
  );

  return (
    <>
      <section className="py-6">
        <h1 className="text-[24px] leading-tight font-bold">{shop.name}</h1>
        {shop.about && (
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{shop.about}</p>
        )}
        <p className="mt-2 text-[12px] text-ink-faint">
          @{shop.tag}
          {business.location && ` · ${business.location}`}
        </p>
        {whatsapp && (
          <ButtonLink
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            tone="soft"
            className="mt-4"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat on WhatsApp
          </ButtonLink>
        )}
      </section>

      {products.length === 0 && !q && !active ? (
        <EmptyState
          title="Nothing here yet"
          body={`${shop.name} hasn't added anything yet. Check back soon.`}
        />
      ) : (
        <>
          <form method="get" className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder={`Search ${shop.name}`}
              aria-label="Search products"
              className="w-full rounded-full border-[0.5px] border-line bg-sunk py-3 pr-4 pl-10 text-[13px] placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
          </form>

          {categories.length > 0 && (
            <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
              <Chip href={`/s/${handle}`} active={!active}>
                Everything
              </Chip>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  href={`/s/${handle}?c=${category.id}`}
                  active={active?.id === category.id}
                >
                  {category.name}
                </Chip>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <EmptyState title="Nothing matched" body="Try a different word." />
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5 pt-5 pb-6">
              {products.map((product) => {
                const soldOut =
                  product.status === "sold_out" ||
                  (product.stock !== null && product.stock <= 0);
                return (
                  <li key={product.id}>
                    <Link href={`/s/${handle}/p/${product.id}`} className="block">
                      <span className="relative block overflow-hidden rounded-card">
                        <Thumb
                          imageId={product.image_id}
                          alt={product.name}
                          ratio="portrait"
                          className={cx("w-full", soldOut && "opacity-60")}
                          sizes="(max-width: 480px) 50vw, 220px"
                        />
                        {soldOut && (
                          <span className="absolute top-2 left-2">
                            <Badge tone="warn">Sold out</Badge>
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block truncate text-[13px] font-medium text-ink">
                        {product.name}
                      </span>
                      <span className="tabular mt-0.5 flex items-baseline gap-2 text-[13px]">
                        <span className="font-semibold">
                          {formatMoney(product.price_minor, business.currency)}
                        </span>
                        {product.compare_at_minor && (
                          <span className="text-[11px] text-ink-faint line-through">
                            {formatMoney(product.compare_at_minor, business.currency)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}
