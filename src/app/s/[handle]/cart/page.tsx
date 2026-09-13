import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopByHandle } from "@/lib/data/shops";
import { getBusinessById } from "@/lib/data/business";
import { cartTotal, listCart } from "@/lib/data/cart";
import { recordInterest } from "@/lib/data/interest";
import { getVisitorId } from "@/lib/visitor";
import { setCartQtyAction } from "@/lib/actions/storefront";
import { formatMoney } from "@/lib/money";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { Thumb } from "@/components/Thumb";
import { ButtonLink, Card, EmptyState, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order" };

export default async function CartPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const shop = getShopByHandle(handle);
  if (!shop) notFound();
  const business = getBusinessById(shop.business_id);
  if (!business) notFound();

  const visitorId = await getVisitorId(shop.business_id);
  const lines = visitorId ? listCart(visitorId, shop.id) : [];
  const total = cartTotal(lines);

  // Opening this page is a real signal: someone got as far as checking out.
  if (visitorId && lines.length > 0) {
    recordInterest(shop.business_id, "checkout_started", { shopId: shop.id, visitorId });
  }

  if (lines.length === 0) {
    return (
      <div className="py-10">
        <EmptyState
          title="Nothing in your order yet"
          body={`Browse what ${shop.name} has and add the things you want.`}
          action={
            <ButtonLink href={`/s/${handle}`}>See what&rsquo;s for sale</ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-5">
      <section>
        <SectionHeading title="Your order" />
        <Card>
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <li key={line.id} className="flex items-start gap-3 p-3">
                <Link href={`/s/${handle}/p/${line.product_id}`} className="shrink-0">
                  <Thumb
                    imageId={line.image_id}
                    alt={line.name}
                    className="w-16 border border-line"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/s/${handle}/p/${line.product_id}`}
                    className="text-[14px] font-medium hover:underline hover:underline-offset-4"
                  >
                    {line.name}
                  </Link>
                  {line.option_label && (
                    <p className="text-[12px] text-ink-muted">{line.option_label}</p>
                  )}
                  <p className="tabular mt-0.5 text-[14px]">
                    {formatMoney(line.price_minor, business.currency)}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <QtyButton handle={handle} lineId={line.id} qty={line.qty - 1} label="−" />
                    <span className="tabular w-6 text-center text-[14px]">{line.qty}</span>
                    <QtyButton handle={handle} lineId={line.id} qty={line.qty + 1} label="+" />
                    <QtyButton
                      handle={handle}
                      lineId={line.id}
                      qty={0}
                      label="Remove"
                      wide
                    />
                  </div>
                </div>
                <span className="tabular text-[14px] font-medium">
                  {formatMoney(line.price_minor * line.qty, business.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-line px-4 py-3.5">
            <span className="text-[14px] font-medium">Total</span>
            <span className="tabular text-[17px] font-semibold">
              {formatMoney(total, business.currency)}
            </span>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading title="Where to reach you" />
        <CheckoutForm
          handle={handle}
          total={formatMoney(total, business.currency)}
          businessName={shop.name}
        />
      </section>
    </div>
  );
}

function QtyButton({
  handle,
  lineId,
  qty,
  label,
  wide,
}: {
  handle: string;
  lineId: string;
  qty: number;
  label: string;
  wide?: boolean;
}) {
  return (
    <form action={setCartQtyAction}>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="line_id" value={lineId} />
      <input type="hidden" name="qty" value={qty} />
      <button
        type="submit"
        aria-label={label === "−" ? "Reduce quantity" : label === "+" ? "Add one" : "Remove"}
        className={
          wide
            ? "ml-1 h-7 px-2 text-[12px] text-ink-muted hover:text-ember"
            : "h-7 w-7 rounded-sm border border-line text-[14px] leading-none hover:bg-sunk"
        }
      >
        {label}
      </button>
    </form>
  );
}
