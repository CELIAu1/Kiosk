import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listShops } from "@/lib/data/shops";
import { listProducts } from "@/lib/data/products";
import { getPulse } from "@/lib/data/interest";
import { countOrders } from "@/lib/data/orders";
import { signOutAction } from "@/lib/actions/auth";
import { origin } from "@/lib/url";
import { PageHeader } from "@/components/PageHeader";
import { ShareShop } from "@/components/ShareShop";
import { Card, ButtonLink, SeeAll } from "@/components/ui";
import {
  ChevronRightIcon,
  InstagramIcon,
  LockIcon,
  TagIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/icons";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = (await getSessionUser())!;
  const business = session.business;

  const shops = listShops(business.id);
  const products = listProducts(business.id);
  const pulse = getPulse(business.id, 30);
  const base = await origin();
  const newOrders = countOrders(business.id, "new");

  return (
    <>
      <PageHeader
        title="Profile"
        action={
          <ButtonLink href="/profile/edit" tone="soft" size="sm">
            Edit
          </ButtonLink>
        }
      />

      <div className="space-y-7 pb-6">
        <Card className="p-6 text-center">
          <span className="mx-auto block h-16 w-16 overflow-hidden rounded-full">
            {business.logo_image_id ? (
              <img
                src={`/api/images/${business.logo_image_id}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-brand-tint text-[22px] font-bold text-brand">
                {business.name.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          <p className="mt-3 text-[16px] font-bold text-ink">{business.name}</p>
          <p className="mt-1 text-[12px] text-ink-soft">
            {business.tagline ?? "Add a short line about what you sell."}
          </p>

          <div className="mt-5 flex items-stretch border-t border-line-warm pt-4">
            <ProfileStat value={shops.length} label="Shops" />
            <span className="w-px bg-line-warm" />
            <ProfileStat value={products.length} label="Products" />
            <span className="w-px bg-line-warm" />
            <ProfileStat value={pulse.people} label="Interested" />
          </div>
        </Card>

        <section>
          <h2 className="mb-3 text-[14px] font-semibold text-ink">
            How customers reach you
          </h2>
          <Card className="divide-y divide-line-warm">
            <ContactRow
              icon={<WhatsAppIcon className="h-[18px] w-[18px]" />}
              label="WhatsApp"
              value={business.whatsapp}
            />
            <ContactRow
              icon={<InstagramIcon className="h-[18px] w-[18px]" />}
              label="Instagram"
              value={business.instagram}
            />
            <ContactRow
              icon={<TikTokIcon className="h-[18px] w-[18px]" />}
              label="TikTok"
              value={business.tiktok}
            />
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ink">Your shop tags</h2>
            <SeeAll href="/shops">Manage</SeeAll>
          </div>
          {shops.length === 0 ? (
            <p className="text-[12px] text-ink-soft">
              Create a shop and its tag appears here, ready to share.
            </p>
          ) : (
            <div className="space-y-3">
              {shops.map((shop) => (
                <Card key={shop.id} className="flex items-center gap-3 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunk text-ink">
                    <TagIcon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">
                      @{shop.tag}
                    </span>
                    <span className="block truncate text-[12px] text-ink-soft">
                      {shop.name}
                    </span>
                  </span>
                  <ShareShop url={`${base}/s/${shop.tag}`} iconOnly className="shrink-0" />
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Orders and customers live here rather than on the bottom bar. */}
        <section>
          <h2 className="mb-3 text-[14px] font-semibold text-ink">Account</h2>
          <Card className="divide-y divide-line-warm">
            <AccountRow
              href="/price-book"
              label="Price book"
              hint="private"
              icon={<LockIcon className="h-4 w-4" />}
            />
            <AccountRow href="/interest" label="Customer interest" />
            <AccountRow
              href="/orders"
              label="Orders"
              hint={newOrders > 0 ? `${newOrders} new` : undefined}
            />
            <AccountRow href="/customers" label="Customers" />
            <AccountRow href="/questions" label="Questions" />
          </Card>
        </section>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-card py-3 text-[13px] font-semibold text-bad hover:bg-bad-tint"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex-1">
      <span className="num block text-[16px] font-bold text-ink">{value}</span>
      <span className="mt-0.5 block text-[12px] text-ink-soft">{label}</span>
    </span>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="text-ink-soft">{icon}</span>
      <span className="flex-1 text-[14px] text-ink">{label}</span>
      {value ? (
        <span className="truncate text-[12px] text-ink-soft">{value}</span>
      ) : (
        <Link
          href="/profile/edit"
          className="text-[12px] font-semibold text-brand-link hover:underline"
        >
          Add
        </Link>
      )}
    </div>
  );
}

function AccountRow({
  href,
  label,
  hint,
  icon,
}: {
  href: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-2 p-4">
      {icon && <span className="text-ink-soft">{icon}</span>}
      <span className="flex-1 text-[14px] text-ink">{label}</span>
      {hint && <span className="text-[12px] text-ink-soft">{hint}</span>}
      <ChevronRightIcon className="h-4 w-4 text-ink-soft" />
    </Link>
  );
}
