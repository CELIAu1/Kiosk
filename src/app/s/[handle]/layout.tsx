import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopByHandle } from "@/lib/data/shops";
import { getBusinessById } from "@/lib/data/business";
import { cartCount } from "@/lib/data/cart";
import { getVisitorId } from "@/lib/visitor";
import { Thumb } from "@/components/Thumb";
import { Monogram } from "@/components/ui";
import { BagIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * The customer shell. No dashboard chrome — someone who tapped a tag in a bio
 * wants to see the things for sale.
 */
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const shop = await getShopByHandle(handle);
  if (!shop) notFound();

  const business = await getBusinessById(shop.business_id);
  if (!business) notFound();

  const visitorId = await getVisitorId(shop.business_id);
  const count = visitorId ? await cartCount(visitorId, shop.id) : 0;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-surface">
      <header className="sticky top-0 z-20 border-b border-line-warm bg-surface/95 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3 px-5">
          <Link href={`/s/${handle}`} className="flex min-w-0 items-center gap-2.5">
            {business.logo_image_id ? (
              <Thumb
                imageId={business.logo_image_id}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full"
              />
            ) : (
              <Monogram name={shop.name} className="h-8 w-8" />
            )}
            <span className="truncate text-[15px] font-bold">{shop.name}</span>
          </Link>

          <Link
            href={`/s/${handle}/cart`}
            className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-sunk"
            aria-label={`Your order${count > 0 ? `, ${count} items` : ""}`}
          >
            <BagIcon className="h-5 w-5" />
            {count > 0 && (
              <span className="num absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="px-5 pb-16">{children}</main>

      <footer className="px-5 pb-10 text-center">
        <p className="text-[12px] text-ink-faint">
          @{shop.tag} on{" "}
          <Link href="/" className="font-semibold text-ink-soft">
            KIOSK
          </Link>
        </p>
      </footer>
    </div>
  );
}
