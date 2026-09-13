import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { customerActivity, getCustomer } from "@/lib/data/customers";
import { listCustomerOrders } from "@/lib/data/orders";
import { saveCustomerNoteAction } from "@/lib/actions/customers";
import { formatMoney } from "@/lib/money";
import { timeAgo } from "@/lib/time";
import { whatsappLink } from "@/lib/url";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { OrderItemRow, RowList } from "@/components/rows";
import { Button, Panel, SectionHeading, Stat, Textarea } from "@/components/ui";
import { WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const VERB: Record<string, string> = {
  viewed_shop: "Visited your shop",
  viewed_product: "Looked at",
  asked: "Asked about",
  saved: "Saved",
  added_to_cart: "Added to an order",
  checkout_started: "Started ordering",
  ordered: "Ordered",
  question: "Asked",
};

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await getSessionUser())!;
  const business = session.business;

  const customer = getCustomer(business.id, id);
  if (!customer) notFound();

  const orders = listCustomerOrders(customer.id);
  const activity = customerActivity(customer.id);
  const message = whatsappLink(
    customer.phone,
    `Hi ${customer.name.split(" ")[0]}, it's ${business.name}. `,
  );

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={`First seen ${timeAgo(customer.created_at)}`}
        back={{ href: "/customers", label: "Customers" }}
      />
      <PageBody>
        <Panel className="p-5">
          <div className="grid grid-cols-3 gap-y-6">
            <Stat value={customer.order_count} label="orders" />
            <Stat
              value={formatMoney(customer.spent_minor, business.currency)}
              label="spent"
              tone={customer.spent_minor > 0 ? "grow" : undefined}
            />
            <Stat value={customer.question_count} label="questions" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4 text-[13px] text-ink-soft">
            {customer.phone && <span className="tabular">{customer.phone}</span>}
            {customer.instagram && <span>@{customer.instagram.replace(/^@/, "")}</span>}
            {message && (
              <a
                href={message}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-sm bg-ink px-3 text-[13px] font-medium text-paper hover:bg-ink-soft"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Message
              </a>
            )}
          </div>
        </Panel>

        <section>
          <SectionHeading title="Note to self" note="Only you can see this." />
          <form action={saveCustomerNoteAction} className="space-y-2">
            <input type="hidden" name="customer_id" value={customer.id} />
            <Textarea
              name="note"
              rows={2}
              defaultValue={customer.note ?? ""}
              placeholder="Prefers pickup. Asked about size 43 restock."
            />
            <Button type="submit" tone="secondary" size="sm">
              Save note
            </Button>
          </form>
        </section>

        {orders.length > 0 && (
          <section>
            <SectionHeading title="Orders" />
            <RowList>
              {orders.map((order) => (
                <OrderItemRow key={order.id} order={order} currency={business.currency} />
              ))}
            </RowList>
          </section>
        )}

        <section>
          <SectionHeading
            title="Everything they've done"
            note="What they looked at, asked and bought."
          />
          {activity.length === 0 ? (
            <p className="text-[13px] text-ink-soft">Nothing recorded yet.</p>
          ) : (
            <ol className="border-l border-line pl-4">
              {activity.map((event) => (
                <li key={event.id} className="relative py-2.5">
                  <span className="absolute top-4 -left-[21px] h-1.5 w-1.5 rounded-full bg-line-strong" />
                  <p className="text-[14px] leading-snug">
                    <span className="text-ink-soft">{VERB[event.kind] ?? event.kind}</span>{" "}
                    {event.product_id ? (
                      <Link
                        href={`/products/${event.product_id}`}
                        className="font-medium hover:underline hover:underline-offset-4"
                      >
                        {event.product_name}
                      </Link>
                    ) : (
                      <span className="font-medium">{event.product_name ?? ""}</span>
                    )}
                  </p>
                  {event.detail && (
                    <p className="mt-0.5 text-[13px] text-ink-soft">
                      &ldquo;{event.detail}&rdquo;
                    </p>
                  )}
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    {timeAgo(event.at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </PageBody>
    </>
  );
}
