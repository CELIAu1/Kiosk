import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getShop } from "@/lib/data/shops";
import { listCategories } from "@/lib/data/business";
import { WizardShell } from "@/components/WizardShell";
import { CategoryPicker } from "./form";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

/** Suggestions drawn from what the owner typed, plus a few common fallbacks. */
function suggest(sells: string | null): string[] {
  const fromText = (sells ?? "")
    .split(/[,\n/]| and /i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 28)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  const common = ["Sneakers", "Shoes", "Bags", "Clothing", "Accessories", "New in"];
  return Array.from(new Set([...fromText, ...common])).slice(0, 12);
}

export default async function CategoriesStep({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const session = await requireSession();
  const shop = await getShop(session.business.id, shopId);
  if (!shop) notFound();

  const existing = await listCategories(session.business.id, shop.id);

  return (
    <WizardShell
      step={3}
      title="Pick your categories"
      subtitle="Select all categories for this shop."
      back={`/shops/${shop.id}/setup/sells`}
    >
      <CategoryPicker
        shopId={shop.id}
        suggestions={suggest(shop.about)}
        alreadyChosen={existing.map((category) => category.name)}
      />
    </WizardShell>
  );
}
