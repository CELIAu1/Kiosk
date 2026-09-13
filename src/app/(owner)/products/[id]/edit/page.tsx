import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listCategories } from "@/lib/data/business";
import {
  getProduct,
  listProductImages,
  listProductOptions,
} from "@/lib/data/products";
import { one } from "@/lib/db";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { ProductForm } from "@/components/ProductForm";
import { deleteProductAction } from "@/lib/actions/products";
import { Button } from "@/components/ui";

export const metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await getSessionUser())!;
  const product = getProduct(session.business.id, id);
  if (!product) notFound();

  const categoryName = product.category_id
    ? (one<{ name: string }>(`SELECT name FROM categories WHERE id = ?`, product.category_id)
        ?.name ?? null)
    : null;

  return (
    <>
      <PageHeader
        title="Edit product"
        back={{ href: `/products/${product.id}`, label: product.name }}
      />
      <PageBody>
        <div className="max-w-xl space-y-10">
          <ProductForm
            currency={session.business.currency}
            categories={listCategories(session.business.id).map((c) => c.name)}
            existing={{
              product,
              categoryName,
              imageIds: listProductImages(product.id),
              options: listProductOptions(product.id).map((o) => o.label),
            }}
          />

          <div className="border-t border-line pt-6">
            <p className="text-[13px] text-ink-soft">
              Deleting removes the product and its interest history. To take it out of
              your shop without losing that, set it to hidden instead.
            </p>
            <form action={deleteProductAction} className="mt-3">
              <input type="hidden" name="product_id" value={product.id} />
              <Button type="submit" tone="danger" size="sm">
                Delete product
              </Button>
            </form>
          </div>
        </div>
      </PageBody>
    </>
  );
}
