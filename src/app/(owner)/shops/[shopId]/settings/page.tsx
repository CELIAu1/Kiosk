import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getShop } from "@/lib/data/shops";
import { PageHeader } from "@/components/PageHeader";
import { ShopSettingsForm } from "./form";

export const metadata = { title: "Shop settings" };
export const dynamic = "force-dynamic";

export default async function ShopSettingsPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const session = await requireSession();
  const shop = getShop(session.business.id, shopId);
  if (!shop) notFound();

  return (
    <>
      <PageHeader
        title="Shop settings"
        subtitle={shop.name}
        back={{ href: `/shops/${shop.id}` }}
      />
      <div className="pb-6">
        <ShopSettingsForm shop={shop} />
      </div>
    </>
  );
}
