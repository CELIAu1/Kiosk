import Link from "next/link";
import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/data/business";
import { cartCount } from "@/lib/data/cart";
import { getVisitorId } from "@/lib/visitor";
import { BagIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * The customer shell. Deliberately quiet: no dashboard chrome, no nav rail.
 * A person who tapped a link in a bio wants to see the things for sale.
 */
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = getBusinessBySlug(slug);
  if (!business) notFound();

  const visitorId = await getVisitorId(business.id);
  const count = visitorId ? cartCount(visitorId, business.id) : 0;

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href={`/s/${slug}`} className="flex min-w-0 items-center gap-2.5">
            {business.logo_image_id ? (
              <img
                src={`/api/images/${business.logo_image_id}`}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-medium text-paper">
                {business.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-[15px] font-semibold tracking-tight">
              {business.name}
            </span>
          </Link>

          <Link
            href={`/s/${slug}/cart`}
            className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-sm hover:bg-sunk"
            aria-label={`Your order${count > 0 ? `, ${count} items` : ""}`}
          >
            <BagIcon className="h-5 w-5" />
            {count > 0 && (
              <span className="tabular absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-medium text-paper">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">{children}</main>

      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center">
        <p className="text-[12px] text-ink-muted">
          {business.name} on{" "}
          <Link href="/" className="underline underline-offset-4">
            KIOSK
          </Link>
        </p>
      </footer>
    </div>
  );
}
