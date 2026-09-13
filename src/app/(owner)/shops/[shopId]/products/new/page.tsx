import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getShop } from "@/lib/data/shops";
import { listCategories } from "@/lib/data/business";
import { PageHeader } from "@/components/PageHeader";
import { ProductForm } from "@/components/ProductForm";

export const metadata = { title: "Add a product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const session = (await getSessionUser())!;
  const shop = getShop(session.business.id, shopId);
  if (!shop) notFound();

  return (
    <>
      <PageHeader
        title="Add a product"
        subtitle={`to ${shop.name}`}
        back={{ href: `/shops/${shop.id}` }}
      />
      <div className="pb-6">
        <ProductForm
          currency={session.business.currency}
          shopId={shop.id}
          categories={listCategories(session.business.id, shop.id).map((c) => c.name)}
        />
      </div>
    </>
  );
}
