import Link from "next/link";
import { notFound } from "next/navigation";
import { getBusinessBySlug, listPublicCategories } from "@/lib/data/business";
import { listProducts } from "@/lib/data/products";
import { recordInterest } from "@/lib/data/interest";
import { getVisitorId } from "@/lib/visitor";
import { formatMoney } from "@/lib/money";
import { whatsappLink } from "@/lib/url";
import { Thumb } from "@/components/Thumb";
import { Badge, EmptyState, Input, cx } from "@/components/ui";
import { WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const business = getBusinessBySlug((await params).slug);
  if (!business) return { title: "Shop" };
  return {
    title: { absolute: business.name },
    description: business.tagline ?? `Browse what ${business.name} has for sale.`,
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; c?: string }>;
}) {
  const { slug } = await params;
  const { q, c } = await searchParams;

  const business = getBusinessBySlug(slug);
  if (!business) notFound();

  const visitorId = await getVisitorId(business.id);
  if (visitorId) recordInterest(business.id, "viewed_shop", { visitorId });

  const categories = listPublicCategories(business.id);
  const activeCategory = categories.find((category) => category.id === c);
  const products = listProducts(business.id, {
    publicOnly: true,
    search: q,
    categoryId: activeCategory?.id,
  });

  const whatsapp = whatsappLink(
    business.whatsapp,
    `Hi ${business.name}, I saw your shop.`,
  );

  return (
    <>
      <section className="border-b border-line py-7">
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
          {business.name}
        </h1>
        {business.tagline && (
          <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-ink-soft">
            {business.tagline}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
          {business.location && <span>{business.location}</span>}
          {business.instagram && (
            <a
              href={`https://instagram.com/${business.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink"
            >
              @{business.instagram}
            </a>
          )}
          {business.tiktok && (
            <a
              href={`https://tiktok.com/@${business.tiktok}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink"
            >
              TikTok
            </a>
          )}
        </div>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-sm border border-line-strong px-3.5 text-[14px] font-medium hover:bg-sunk"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        )}
      </section>

      {products.length === 0 && !q && !activeCategory ? (
        <div className="py-10">
          <EmptyState
            title="Nothing here yet"
            body={`${business.name} hasn't added anything to their shop yet. Check back soon.`}
          />
        </div>
      ) : (
        <>
          <div className="space-y-3 py-5">
            <form method="get">
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder={`Search ${business.name}`}
                aria-label="Search products"
              />
            </form>
            {categories.length > 0 && (
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                <Chip href={`/s/${slug}`} active={!activeCategory}>
                  Everything
                </Chip>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    href={`/s/${slug}?c=${category.id}`}
                    active={activeCategory?.id === category.id}
                  >
                    {category.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <EmptyState
              title="Nothing matched"
              body="Try a different word, or browse everything."
            />
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 pb-6 sm:grid-cols-3">
              {products.map((product) => {
                const soldOut =
                  product.status === "sold_out" ||
                  (product.stock !== null && product.stock <= 0);
                return (
                  <li key={product.id}>
                    <Link href={`/s/${slug}/p/${product.id}`} className="group block">
                      <div className="relative">
                        <Thumb
                          imageId={product.image_id}
                          alt={product.name}
                          ratio="portrait"
                          className={cx("border border-line", soldOut && "opacity-60")}
                          sizes="(max-width: 640px) 50vw, 240px"
                        />
                        {soldOut && (
                          <span className="absolute top-2 left-2">
                            <Badge tone="flag">Sold out</Badge>
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[14px] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">
                        {product.name}
                      </p>
                      <p className="tabular mt-0.5 flex items-baseline gap-2 text-[14px]">
                        <span>{formatMoney(product.price_minor, business.currency)}</span>
                        {product.compare_at_minor && (
                          <span className="text-[12px] text-ink-muted line-through">
                            {formatMoney(product.compare_at_minor, business.currency)}
                          </span>
                        )}
                      </p>
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

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "shrink-0 rounded-sm border px-3 py-1.5 text-[13px] whitespace-nowrap",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line-strong text-ink-soft hover:bg-sunk",
      )}
    >
      {children}
    </Link>
  );
}
