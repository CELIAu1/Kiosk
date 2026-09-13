import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopByHandle } from "@/lib/data/shops";
import { getBusinessById } from "@/lib/data/business";
import {
  getProduct,
  isOrderable,
  listProductImages,
  listProductOptions,
} from "@/lib/data/products";
import { recordProductView } from "@/lib/data/interest";
import { getVisitorId } from "@/lib/visitor";
import { addToCartAction } from "@/lib/actions/storefront";
import { formatMoney } from "@/lib/money";
import { whatsappLink } from "@/lib/url";
import { AskForm } from "@/components/storefront/AskForm";
import { Thumb } from "@/components/Thumb";
import { Badge, Button } from "@/components/ui";
import { ArrowLeftIcon, WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; id: string }>;
}) {
  const { handle, id } = await params;
  const shop = getShopByHandle(handle);
  if (!shop) return { title: "Product" };
  const product = getProduct(shop.business_id, id);
  if (!product) return { title: "Product" };
  return {
    title: { absolute: `${product.name} · ${shop.name}` },
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: listProductImages(product.id)
        .slice(0, 1)
        .map((imageId) => `/api/images/${imageId}`),
    },
  };
}

export default async function StorefrontProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string; id: string }>;
  searchParams: Promise<{ asked?: string }>;
}) {
  const { handle, id } = await params;
  const { asked } = await searchParams;

  const shop = getShopByHandle(handle);
  if (!shop) notFound();
  const business = getBusinessById(shop.business_id);
  if (!business) notFound();

  const product = getProduct(shop.business_id, id);
  // Hidden products are not 404s for the owner's preview link, but customers
  // arriving at one should simply not see it.
  if (!product || product.shop_id !== shop.id || product.status === "hidden") notFound();

  const visitorId = await getVisitorId(business.id);
  if (visitorId) recordProductView(shop.business_id, shop.id, product.id, visitorId);

  const images = listProductImages(product.id);
  const options = listProductOptions(product.id);
  const orderable = isOrderable(product);
  const lowStock = product.stock !== null && product.stock > 0 && product.stock <= 3;

  const whatsapp = whatsappLink(
    business.whatsapp,
    `Hi ${shop.name}, I'm interested in the ${product.name}.`,
  );

  return (
    <article className="py-4">
      <Link
        href={`/s/${handle}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        All products
      </Link>

      <div className="mt-3 grid gap-6 md:grid-cols-2 md:items-start md:gap-8">
        <div>
          {images.length <= 1 ? (
            <Thumb
              imageId={images[0] ?? null}
              alt={product.name}
              ratio="portrait"
              className="border border-line"
            />
          ) : (
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:px-0">
              {images.map((imageId, index) => (
                <div
                  key={imageId}
                  className="w-[78%] shrink-0 snap-center md:w-auto first:md:col-span-2"
                >
                  <Thumb
                    imageId={imageId}
                    alt={index === 0 ? product.name : ""}
                    ratio="portrait"
                    className="border border-line"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 md:sticky md:top-20">
          <div>
            <h1 className="text-[22px] leading-tight font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="tabular mt-2 flex items-baseline gap-2.5">
              <span className="text-[20px] font-semibold">
                {formatMoney(product.price_minor, business.currency)}
              </span>
              {product.compare_at_minor && (
                <span className="text-[14px] text-ink-muted line-through">
                  {formatMoney(product.compare_at_minor, business.currency)}
                </span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {!orderable && <Badge tone="warn">Sold out</Badge>}
              {orderable && lowStock && (
                <Badge tone="brand">Only {product.stock} left</Badge>
              )}
            </div>
          </div>

          {product.description && (
            <p className="max-w-prose text-[14px] leading-relaxed whitespace-pre-line text-ink-soft">
              {product.description}
            </p>
          )}

          {orderable ? (
            <form action={addToCartAction} className="space-y-4">
              <input type="hidden" name="handle" value={handle} />
              <input type="hidden" name="product_id" value={product.id} />

              {options.length > 0 && (
                <fieldset>
                  <legend className="mb-2 text-[13px] font-medium">Choose one</legend>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                      <label
                        key={option.id}
                        className="cursor-pointer rounded-full border border-line px-4 py-2 text-[13px] font-medium has-checked:border-brand has-checked:bg-brand has-checked:text-white"
                      >
                        <input
                          type="radio"
                          name="option_id"
                          value={option.id}
                          required
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <Button type="submit" size="lg" className="w-full">
                Add to order
              </Button>
            </form>
          ) : (
            <div className="rounded-card bg-sunk p-4">
              <p className="text-[14px] font-medium">This one is sold out</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                Ask {shop.name} whether it&rsquo;s coming back — they&rsquo;ll see
                that you were looking for it.
              </p>
            </div>
          )}

          <AskForm
            handle={handle}
            productId={product.id}
            businessName={shop.name}
            asked={asked === "1"}
          />

          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-sunk text-[14px] font-semibold hover:brightness-95"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Chat on WhatsApp instead
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
