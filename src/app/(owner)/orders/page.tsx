import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listOrders, ORDER_STATUS_LABEL } from "@/lib/data/orders";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { OrderItemRow, RowList } from "@/components/rows";
import { EmptyState, cx } from "@/components/ui";
import type { OrderStatus } from "@/lib/types";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const TABS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "confirmed", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const business = session.business;
  const { status } = await searchParams;

  const active = TABS.find((tab) => tab.key === status)?.key ?? "all";
  const orders = await listOrders(
    business.id,
    active === "all" ? undefined : (active as OrderStatus),
  );

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
      />
      <PageBody>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/orders" : `/orders?status=${tab.key}`}
              className={cx(
                "shrink-0 rounded-full border px-3 py-1.5 text-[13px] whitespace-nowrap",
                active === tab.key
                  ? "border-brand bg-brand text-white"
                  : "border-line text-ink-soft hover:bg-sunk",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title={active === "all" ? "No orders yet" : `Nothing ${ORDER_STATUS_LABEL[active as OrderStatus].toLowerCase()}`}
            body={
              active === "all"
                ? "When someone orders from your shop link, it lands here with their name and number."
                : "Try another tab to see the rest of your orders."
            }
          />
        ) : (
          <RowList>
            {orders.map((order) => (
              <OrderItemRow key={order.id} order={order} currency={business.currency} />
            ))}
          </RowList>
        )}
      </PageBody>
    </>
  );
}
