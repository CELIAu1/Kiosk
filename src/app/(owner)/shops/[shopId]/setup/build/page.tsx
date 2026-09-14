import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getShop } from "@/lib/data/shops";
import { listCategories } from "@/lib/data/business";
import { draftShop } from "@/lib/ai";
import { acceptDraftAction } from "@/lib/actions/shops";
import { formatMoney, moneyInputValue } from "@/lib/money";
import { WizardShell } from "@/components/WizardShell";
import { Button, ButtonLink, Card, Input } from "@/components/ui";
import { SparkleIcon } from "@/components/icons";

export const metadata = { title: "Build this shop" };
export const dynamic = "force-dynamic";

export default async function BuildStep({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ with?: string }>;
}) {
  const { shopId } = await params;
  const { with: mode } = await searchParams;
  const session = await requireSession();
  const shop = await getShop(session.business.id, shopId);
  if (!shop) notFound();

  const categories = (await listCategories(session.business.id, shop.id)).map(
    (category) => category.name,
  );

  // The choice screen from the design.
  if (mode !== "ai") {
    return (
      <WizardShell
        step={4}
        title="Let's build this shop"
        subtitle="How do you want to build this shop?"
        back={`/shops/${shop.id}/setup/categories`}
      >
        <div className="space-y-4">
          <ButtonLink
            href={`/shops/${shop.id}/setup/build?with=ai`}
            size="lg"
            className="w-full"
          >
            <SparkleIcon className="h-5 w-5" />
            Create for me with AI
          </ButtonLink>
          <Link
            href={`/shops/${shop.id}`}
            className="block py-1 text-center text-[14px] font-semibold text-brand-link hover:underline"
          >
            I&rsquo;ll do it myself
          </Link>
        </div>
      </WizardShell>
    );
  }

  // The AI branch: draft products the owner reviews before anything is saved.
  const draft = await draftShop({
    shopName: shop.name,
    sells: shop.about ?? shop.name,
    currency: session.business.currency,
    categories,
  });

  return (
    <WizardShell
      step={4}
      title="Here's a starting point"
      subtitle="Edit anything, untick what you don't want. Nothing is live until you add photos."
      back={`/shops/${shop.id}/setup/build`}
    >
      {!draft.usedAI && (
        <p className="mb-5 rounded-card bg-warn-tint px-4 py-3 text-[12px] leading-relaxed text-warn">
          {draft.note ??
            "AI drafting isn't switched on, so these are blank starter rows built from what you typed. Set ANTHROPIC_API_KEY to have them written for you."}
        </p>
      )}

      {draft.products.length === 0 ? (
        <div className="text-center">
          <p className="text-[13px] text-ink-soft">
            Nothing to draft from yet. Add your products by hand.
          </p>
          <ButtonLink href={`/shops/${shop.id}`} className="mt-4">
            Go to the shop
          </ButtonLink>
        </div>
      ) : (
        <form action={acceptDraftAction} className="space-y-4">
          <input type="hidden" name="shop_id" value={shop.id} />

          {draft.products.map((product, index) => (
            <Card key={index} className="space-y-3 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="draft_keep"
                  value={index}
                  defaultChecked
                  className="mt-1.5"
                  aria-label={`Keep ${product.name}`}
                />
                <span className="min-w-0 flex-1 space-y-2">
                  <Input
                    name="draft_name"
                    defaultValue={product.name}
                    aria-label="Product name"
                    className="bg-surface font-semibold"
                  />
                  <span className="flex gap-2">
                    <Input
                      name="draft_category"
                      defaultValue={product.category}
                      aria-label="Category"
                      className="bg-surface"
                    />
                    <Input
                      name="draft_price"
                      inputMode="decimal"
                      defaultValue={
                        product.priceMinor
                          ? moneyInputValue(product.priceMinor, session.business.currency)
                          : ""
                      }
                      placeholder={formatMoney(0, session.business.currency)}
                      aria-label="Price"
                      className="bg-surface"
                    />
                  </span>
                  <Input
                    name="draft_description"
                    defaultValue={product.description}
                    placeholder="Description"
                    aria-label="Description"
                    className="bg-surface"
                  />
                </span>
              </label>
            </Card>
          ))}

          <Button type="submit" size="lg" className="w-full">
            Add these to my shop
          </Button>
          <Link
            href={`/shops/${shop.id}`}
            className="block py-1 text-center text-[13px] font-semibold text-ink-soft hover:text-ink"
          >
            Skip, I&rsquo;ll add them myself
          </Link>
        </form>
      )}
    </WizardShell>
  );
}
