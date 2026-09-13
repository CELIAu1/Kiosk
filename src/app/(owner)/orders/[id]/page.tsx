import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOrder, listOrderItems, ORDER_STATUS_LABEL } from "@/lib/data/orders";
import { setOrderStatusAction } from "@/lib/actions/orders";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import { whatsappLink } from "@/lib/url";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, SectionHeading } from "@/components/ui";
import { WhatsAppIcon } from "@/components/icons";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const NEXT_STEPS: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  new: [
    { status: "confirmed", label: "Confirm order" },
    { status: "cancelled", label: "Cancel" },
  ],
  confirmed: [
    { status: "completed", label: "Mark completed" },
    { status: "cancelled", label: "Cancel" },
  ],
  completed: [{ status: "confirmed", label: "Reopen" }],
  cancelled: [{ status: "new", label: "Restore" }],
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const business = session.business;

  const order = getOrder(business.id, id);
  if (!order) notFound();
  const items = listOrderItems(order.id);

  const message = whatsappLink(
    order.customer_phone,
    `Hi ${order.customer_name.split(" ")[0]}, it's ${business.name}. About your order ${order.reference}: `,
  );

  return (
    <>
      <PageHeader
        title={`Order ${order.reference}`}
        subtitle={formatDateTime(order.created_at)}
        back={{ href: "/orders", label: "Orders" }}
      />
      <PageBody>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            tone={
              order.status === "new"
                ? "brand"
                : order.status === "completed"
                  ? "good"
                  : order.status === "confirmed"
                    ? "warn"
                    : "neutral"
            }
          >
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
          {NEXT_STEPS[order.status].map((step) => (
            <form key={step.status} action={setOrderStatusAction}>
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="status" value={step.status} />
              <Button
                type="submit"
                size="sm"
                tone={step.status === "cancelled" ? "danger" : "brand"}
              >
                {step.label}
              </Button>
            </form>
          ))}
        </div>

        <section>
          <SectionHeading title="What they ordered" />
          <Card>
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex items-baseline gap-3 px-4 py-3">
                  <span className="tabular text-[13px] text-ink-muted">{item.qty}×</span>
                  <span className="min-w-0 flex-1">
                    {item.product_id ? (
                      <Link
                        href={`/products/${item.product_id}`}
                        className="text-[14px] font-medium hover:underline hover:underline-offset-4"
                      >
                        {item.name_at_time}
                      </Link>
                    ) : (
                      <span className="text-[14px] font-medium">{item.name_at_time}</span>
                    )}
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
          </Card>
          {order.note && (
            <p className="mt-3 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-ink-soft">
              &ldquo;{order.note}&rdquo;
            </p>
          )}
        </section>

        <section>
          <SectionHeading title="Customer" />
          <Card className="p-4">
            <Link
              href={`/customers/${order.customer_id}`}
              className="text-[15px] font-medium hover:underline hover:underline-offset-4"
            >
              {order.customer_name}
            </Link>
            <div className="mt-1 space-y-0.5 text-[13px] text-ink-soft">
              {order.customer_phone && <p className="tabular">{order.customer_phone}</p>}
              {order.customer_instagram && <p>@{order.customer_instagram.replace(/^@/, "")}</p>}
            </div>
            {message && (
              <a
                href={message}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-ink px-3 text-[13px] font-medium text-white hover:bg-ink-soft"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Message on WhatsApp
              </a>
            )}
          </Card>
        </section>
      </PageBody>
    </>
  );
}
