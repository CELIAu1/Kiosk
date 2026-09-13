import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/data/business";
import { getOrderById, listOrderItems, ORDER_STATUS_LABEL } from "@/lib/data/orders";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import { whatsappLink } from "@/lib/url";
import { Badge, ButtonLink, Panel } from "@/components/ui";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", robots: { index: false } };

export default async function OrderReceiptPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const business = getBusinessBySlug(slug);
  if (!business) notFound();

  const order = getOrderById(id);
  if (!order || order.business_id !== business.id) notFound();

  const items = listOrderItems(order.id);
  const whatsapp = whatsappLink(
    business.whatsapp,
    `Hi ${business.name}, this is ${order.customer_name} about order ${order.reference}.`,
  );

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-grow-soft text-grow">
          <CheckIcon className="h-5 w-5" />
        </span>
        <h1 className="mt-3 text-[22px] font-semibold tracking-tight">
          Your order is with {business.name}
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
          They&rsquo;ll message you on the number you gave to confirm and arrange payment.
        </p>
      </div>

      <Panel>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="eyebrow">Order</p>
            <p className="tabular mt-0.5 text-[15px] font-semibold">{order.reference}</p>
          </div>
          <Badge tone={order.status === "new" ? "flag" : "grow"}>
            {order.status === "new" ? "Waiting to be confirmed" : ORDER_STATUS_LABEL[order.status]}
          </Badge>
        </div>

        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 px-4 py-3">
              <span className="tabular text-[13px] text-ink-muted">{item.qty}×</span>
              <span className="min-w-0 flex-1 text-[14px]">
                {item.name_at_time}
                {item.option_label && (
                  <span className="block text-[12px] text-ink-muted">
                    {item.option_label}
                  </span>
                )}
              </span>
              <span className="tabular text-[14px]">
                {formatMoney(item.unit_minor * item.qty, business.currency)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between border-t border-line px-4 py-3">
          <span className="text-[14px] font-medium">Total</span>
          <span className="tabular text-[16px] font-semibold">
            {formatMoney(order.total_minor, business.currency)}
          </span>
        </div>
      </Panel>

      <p className="text-center text-[12px] text-ink-muted">
        Placed {formatDateTime(order.created_at)}. Keep this link to check back.
      </p>

      <div className="space-y-2">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-ink text-[14px] font-medium text-paper hover:bg-ink-soft"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Message {business.name}
          </a>
        )}
        <ButtonLink href={`/s/${slug}`} tone="secondary" className="w-full">
          Keep browsing
        </ButtonLink>
      </div>
    </div>
  );
}
