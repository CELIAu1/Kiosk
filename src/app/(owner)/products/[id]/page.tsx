import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  getProductCard,
  listProductImages,
  listProductOptions,
} from "@/lib/data/products";
import { listProductQuestions } from "@/lib/data/questions";
import { productFunnel } from "@/lib/data/interest";
import { setProductStatusAction } from "@/lib/actions/products";
import { formatMoney } from "@/lib/money";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { QuestionItem, RowList } from "@/components/rows";
import { Thumb } from "@/components/Thumb";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  SectionHeading,
  Stat,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionUser();
  if (!session) return { title: "Product" };
  const product = getProductCard(session.business.id, (await params).id);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await getSessionUser())!;
  const business = session.business;

  const product = getProductCard(business.id, id);
  if (!product) notFound();

  const images = listProductImages(product.id);
  const options = listProductOptions(product.id);
  const questions = listProductQuestions(product.id);
  const funnel = productFunnel(product.id);
  const outOfStock = product.stock !== null && product.stock <= 0;

  return (
    <>
      <PageHeader
        title={product.name}
        back={{ href: `/shops/${product.shop_id}` }}
        action={
          <ButtonLink href={`/products/${product.id}/edit`} tone="soft" size="sm">
            Edit
          </ButtonLink>
        }
      />
      <PageBody>
        <div className="grid gap-6 md:grid-cols-[280px_1fr] md:items-start">
          <div>
            <Thumb
              imageId={images[0] ?? null}
              alt={product.name}
              ratio="portrait"
              className="border border-line"
            />
            {images.length > 1 && (
              <div className="mt-2 flex gap-2">
                {images.slice(1, 5).map((imageId) => (
                  <Thumb
                    key={imageId}
                    imageId={imageId}
                    alt=""
                    className="w-14 border border-line"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="tabular text-[22px] font-semibold">
                  {formatMoney(product.price_minor, business.currency)}
                </span>
                {product.compare_at_minor && (
                  <span className="tabular text-[15px] text-ink-muted line-through">
                    {formatMoney(product.compare_at_minor, business.currency)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {product.status === "hidden" && <Badge>Hidden from your shop</Badge>}
                {(product.status === "sold_out" || outOfStock) && (
                  <Badge tone="warn">Sold out</Badge>
                )}
                {product.status === "active" && !outOfStock && (
                  <Badge tone="good">Live in your shop</Badge>
                )}
                {product.category_name && <Badge>{product.category_name}</Badge>}
                {product.stock !== null && (
                  <span className="tabular text-[13px] text-ink-soft">
                    {product.stock} left
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <p className="max-w-prose text-[14px] leading-relaxed text-ink-soft">
                {product.description}
              </p>
            )}

            {options.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Choices</p>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((option) => (
                    <span
                      key={option.id}
                      className="rounded-full border border-line px-2 py-1 text-[13px]"
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <form action={setProductStatusAction}>
                <input type="hidden" name="product_id" value={product.id} />
                <input
                  type="hidden"
                  name="status"
                  value={product.status === "hidden" ? "active" : "hidden"}
                />
                <Button type="submit" tone="soft" size="sm">
                  {product.status === "hidden" ? "Show in shop" : "Hide from shop"}
                </Button>
              </form>
              <form action={setProductStatusAction}>
                <input type="hidden" name="product_id" value={product.id} />
                <input
                  type="hidden"
                  name="status"
                  value={product.status === "sold_out" ? "active" : "sold_out"}
                />
                <Button type="submit" tone="soft" size="sm">
                  {product.status === "sold_out" ? "Back in stock" : "Mark sold out"}
                </Button>
              </form>
              <Link
                href={`/s/${product.shop_tag}/p/${product.id}`}
                target="_blank"
                className="inline-flex h-8 items-center rounded-full px-2.5 text-[13px] text-ink-soft hover:bg-sunk hover:text-ink"
              >
                See how customers see it
              </Link>
            </div>
          </div>
        </div>

        {/* The interest story for this one product, in plain language. */}
        <section>
          <SectionHeading title="What's happening with this product" />
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
              <Stat value={funnel.views} label="people looked" />
              <Stat value={funnel.asked} label="asked a question" />
              <Stat value={funnel.carted} label="added to an order" />
              <Stat
                value={funnel.ordered}
                label="ordered"
              />
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-soft">
              {readInterest(funnel, outOfStock)}
            </p>
          </Card>
        </section>

        <section>
          <SectionHeading
            title={
              questions.length > 0
                ? `Questions about this (${questions.length})`
                : "Questions about this"
            }
          />
          {questions.length === 0 ? (
            <p className="text-[13px] text-ink-soft">
              Nobody has asked about this one yet. When they do, it shows up here and on
              your home screen.
            </p>
          ) : (
            <RowList>
              {questions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  shopName={business.name}
                />
              ))}
            </RowList>
          )}
        </section>
      </PageBody>
    </>
  );
}

/**
 * Numbers on their own don't help someone who is packing orders. The read is
 * the product: say what the numbers mean and what to do about it.
 */
function readInterest(
  funnel: { views: number; asked: number; carted: number; ordered: number },
  outOfStock: boolean,
): string {
  if (funnel.views === 0) {
    return "No one has opened this product yet. Share your shop link, or post this product on your social media.";
  }
  if (outOfStock && funnel.views > 0) {
    return `${funnel.views} people looked at this while it was sold out. That is demand waiting — restocking it is likely worth it.`;
  }
  if (funnel.ordered > 0) {
    return `${funnel.ordered} of the ${funnel.views} people who looked went on to order. This one is working.`;
  }
  if (funnel.carted > 0) {
    return `${funnel.carted} people added this to an order but didn't finish. Following up with them is usually the fastest sale.`;
  }
  if (funnel.asked > 0) {
    return `People are asking rather than ordering. Whatever they keep asking about probably belongs in the description.`;
  }
  if (funnel.views >= 5) {
    return `${funnel.views} people looked and none ordered. Usually that is the price, the photo, or a missing size.`;
  }
  return "Still early. Give it a bit more traffic before reading anything into it.";
}
