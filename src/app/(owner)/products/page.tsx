import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listProducts } from "@/lib/data/products";
import { listCategories } from "@/lib/data/business";
import { formatMoney } from "@/lib/money";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { Thumb } from "@/components/Thumb";
import { Badge, ButtonLink, EmptyState, Input, cx } from "@/components/ui";
import { ChatIcon, EyeIcon, PlusIcon } from "@/components/icons";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = (await getSessionUser())!;
  const business = session.business;
  const { q, category } = await searchParams;

  const categories = listCategories(business.id);
  const activeCategory = categories.find((c) => c.id === category);
  const products = listProducts(business.id, {
    search: q,
    categoryId: activeCategory?.id,
  });

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${products.length} ${products.length === 1 ? "product" : "products"}`}
        action={
          <ButtonLink href="/products/new" size="sm">
            <PlusIcon className="h-4 w-4" />
            Add
          </ButtonLink>
        }
      />
      <PageBody>
        <div className="space-y-3">
          <form method="get" className="flex gap-2">
            {activeCategory && (
              <input type="hidden" name="category" value={activeCategory.id} />
            )}
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search your products"
              aria-label="Search products"
            />
          </form>

          {categories.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              <CategoryChip href="/products" active={!activeCategory}>
                All
              </CategoryChip>
              {categories.map((c) => (
                <CategoryChip
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  active={activeCategory?.id === c.id}
                >
                  {c.name}
                </CategoryChip>
              ))}
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <EmptyState
            title={q ? "Nothing matched that" : "No products yet"}
            body={
              q
                ? "Try a different word, or clear the search."
                : "Add what you sell — a photo, a name and a price is enough to start."
            }
            action={
              q ? (
                <ButtonLink href="/products" tone="secondary">
                  Clear search
                </ButtonLink>
              ) : (
                <ButtonLink href="/products/new">Add your first product</ButtonLink>
              )
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-3">
            {products.map((product) => {
              const soldOut =
                product.status === "sold_out" ||
                (product.stock !== null && product.stock <= 0);
              return (
                <li key={product.id}>
                  <Link href={`/products/${product.id}`} className="group block">
                    <div className="relative">
                      <Thumb
                        imageId={product.image_id}
                        alt={product.name}
                        ratio="portrait"
                        className="border border-line"
                      />
                      {(product.status === "hidden" || soldOut) && (
                        <span className="absolute top-2 left-2">
                          <Badge tone={product.status === "hidden" ? "neutral" : "flag"}>
                            {product.status === "hidden" ? "Hidden" : "Sold out"}
                          </Badge>
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate text-[14px] font-medium group-hover:underline group-hover:underline-offset-4">
                      {product.name}
                    </p>
                    <p className="tabular text-[14px] text-ink-soft">
                      {formatMoney(product.price_minor, business.currency)}
                    </p>
                    {/* Interest sits on the product itself — that is where a
                        decision about the product actually gets made. */}
                    <p className="mt-1.5 flex items-center gap-3 text-[12px] text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <EyeIcon className="h-3.5 w-3.5" />
                        <span className="tabular">{product.views}</span>
                      </span>
                      {product.questions > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ChatIcon className="h-3.5 w-3.5" />
                          <span className="tabular">{product.questions}</span>
                        </span>
                      )}
                      {product.orders > 0 && (
                        <span className="tabular text-grow">{product.orders} sold</span>
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}

function CategoryChip({
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
