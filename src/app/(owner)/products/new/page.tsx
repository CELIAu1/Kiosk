import { getSessionUser } from "@/lib/auth";
import { listCategories } from "@/lib/data/business";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { ProductForm } from "@/components/ProductForm";

export const metadata = { title: "Add a product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = (await getSessionUser())!;
  const categories = listCategories(session.business.id).map((c) => c.name);

  return (
    <>
      <PageHeader title="Add a product" back={{ href: "/products", label: "Products" }} />
      <PageBody>
        <div className="max-w-xl">
          <ProductForm currency={session.business.currency} categories={categories} />
        </div>
      </PageBody>
    </>
  );
}
