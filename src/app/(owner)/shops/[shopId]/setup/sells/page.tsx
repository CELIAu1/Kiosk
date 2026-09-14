import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getShop } from "@/lib/data/shops";
import { saveShopSellsAction } from "@/lib/actions/shops";
import { WizardShell } from "@/components/WizardShell";
import { Button, Textarea } from "@/components/ui";

export const metadata = { title: "What do you sell" };
export const dynamic = "force-dynamic";

export default async function SellsStep({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const session = await requireSession();
  const shop = await getShop(session.business.id, shopId);
  if (!shop) notFound();

  return (
    <WizardShell
      step={2}
      title={`What does ${shop.name} sell?`}
      subtitle="A sentence is enough. This is what we use to set the shop up."
      back="/shops/new"
    >
      <form action={saveShopSellsAction} className="space-y-4">
        <input type="hidden" name="shop_id" value={shop.id} />
        <Textarea
          name="sells"
          rows={4}
          required
          defaultValue={shop.about ?? ""}
          aria-label="What this shop sells"
          placeholder="List out or describe what you sell"
          className="rounded-card bg-sunk"
        />
        <Button type="submit" size="lg" className="w-full">
          Continue
        </Button>
        <Link
          href={`/shops/${shop.id}`}
          className="block py-1 text-center text-[13px] font-semibold text-ink-soft hover:text-ink"
        >
          Skip setup
        </Link>
      </form>
    </WizardShell>
  );
}
