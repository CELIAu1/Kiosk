import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listProducts } from "@/lib/data/products";
import { origin, shopUrl } from "@/lib/url";
import { signOutAction } from "@/lib/actions/auth";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { CopyField, ShareShop } from "@/components/ShareShop";
import { Panel, SectionHeading } from "@/components/ui";
import { EyeIcon } from "@/components/icons";
import { ShopForm } from "./form";

export const metadata = { title: "Your shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const session = (await getSessionUser())!;
  const business = session.business;
  const url = await shopUrl(business.slug);
  const base = await origin();

  const live = listProducts(business.id, { publicOnly: true }).length;

  return (
    <>
      <PageHeader title="Your shop" subtitle={`${live} products customers can see`} />
      <PageBody>
        <Panel className="p-5">
          <p className="eyebrow">Your shop link</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            Put this in your Instagram bio, your WhatsApp status, or send it in a DM.
            Anyone who opens it can browse everything you sell.
          </p>
          <div className="mt-3 space-y-2">
            <CopyField value={url} />
            <div className="flex gap-2">
              <ShareShop url={url} tone="primary" />
              <Link
                href={`/s/${business.slug}`}
                target="_blank"
                className="inline-flex h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-[14px] font-medium hover:bg-sunk"
              >
                <EyeIcon className="h-4 w-4" />
                View as customer
              </Link>
            </div>
          </div>
        </Panel>

        <div className="max-w-xl">
          <ShopForm business={business} origin={base} />
        </div>

        <section className="border-t border-line pt-6 md:hidden">
          <SectionHeading title="Account" />
          <p className="text-[13px] text-ink-soft">{session.email}</p>
          <form action={signOutAction} className="mt-3">
            <button
              type="submit"
              className="text-[13px] font-medium text-ember underline underline-offset-4"
            >
              Sign out
            </button>
          </form>
        </section>
      </PageBody>
    </>
  );
}
