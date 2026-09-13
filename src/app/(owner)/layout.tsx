import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { countWaitingQuestions } from "@/lib/data/questions";
import { countOrders } from "@/lib/data/orders";
import { OwnerRail, OwnerTabs } from "@/components/OwnerNav";
import { ShareShop } from "@/components/ShareShop";
import { signOutAction } from "@/lib/actions/auth";
import { shopUrl } from "@/lib/url";
import { EyeIcon } from "@/components/icons";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");

  const business = session.business;
  const url = await shopUrl(business.slug);
  const badges = {
    "/home": countWaitingQuestions(business.id),
    "/orders": countOrders(business.id, "new"),
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl md:gap-8 md:px-6">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line py-6 pr-4 md:flex">
        <Link href="/home" className="px-2.5 text-[15px] font-semibold tracking-tight">
          KIOSK
        </Link>
        <p className="mt-0.5 truncate px-2.5 text-[12px] text-ink-muted">
          {business.name}
        </p>
        <div className="mt-6 flex-1">
          <OwnerRail badges={badges} />
        </div>
        <div className="space-y-2 border-t border-line pt-4">
          <ShareShop url={url} className="w-full" />
          <Link
            href={`/s/${business.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink-soft hover:text-ink"
          >
            <EyeIcon className="h-4 w-4" />
            View as customer
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="px-2.5 py-1.5 text-[13px] text-ink-muted hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-24 md:pb-10">{children}</main>
      <OwnerTabs badges={badges} />
    </div>
  );
}
