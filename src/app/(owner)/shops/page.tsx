import { requireSession } from "@/lib/auth";
import { listShops } from "@/lib/data/shops";
import { origin } from "@/lib/url";
import { PageHeader } from "@/components/PageHeader";
import { ShopCollage } from "@/components/ShopCardTile";
import { ShareShop } from "@/components/ShareShop";
import { ShopTag } from "@/components/ShopTag";
import { ButtonLink, Card, EmptyState, IconLink } from "@/components/ui";
import { EyeIcon, PlusIcon } from "@/components/icons";

export const metadata = { title: "My shops" };
export const dynamic = "force-dynamic";

export default async function ShopsPage() {
  const session = await requireSession();
  const shops = await listShops(session.business.id);
  const base = await origin();

  return (
    <>
      <PageHeader
        title="My shops"
        action={
          <IconLink href="/shops/new" aria-label="Add a shop" tone="dark" size={40}>
            <PlusIcon className="h-5 w-5" />
          </IconLink>
        }
      />

      {shops.length === 0 ? (
        <EmptyState
          title="No shops yet"
          body="A shop is one thing you sell — sneakers, thrift, hair. You can run as many as you like."
          action={<ButtonLink href="/shops/new">Create your first shop</ButtonLink>}
        />
      ) : (
        <ul className="space-y-4 pb-6">
          {shops.map((shop) => (
            <li key={shop.id}>
              <Card className="overflow-hidden">
                <ShopCollage shop={shop} />
                <div className="p-4">
                  <p className="text-[14px] font-bold text-ink">{shop.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12px] text-ink-soft">
                    <ShopTag
                      tag={shop.tag}
                      copyValue={`${base}/s/${shop.tag}`}
                      size="sm"
                    />
                    <span>
                      · {shop.category_count}{" "}
                      {shop.category_count === 1 ? "category" : "categories"} ·{" "}
                      {shop.product_count}{" "}
                      {shop.product_count === 1 ? "item" : "items"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-3 border-t border-line-warm p-4 pt-3">
                  <ShareShop url={`${base}/s/${shop.tag}`} className="flex-1" />
                  <ButtonLink
                    href={`/shops/${shop.id}`}
                    tone="soft"
                    className="flex-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Customer view
                  </ButtonLink>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
