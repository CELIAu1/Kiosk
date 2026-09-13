import { requireSession } from "@/lib/auth";
import { listCustomers } from "@/lib/data/customers";
import { formatMoney } from "@/lib/money";
import { timeAgo } from "@/lib/time";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { Row, RowList } from "@/components/rows";
import { Badge, EmptyState, Input } from "@/components/ui";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession();
  const business = session.business;
  const { q } = await searchParams;
  const customers = listCustomers(business.id, q);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} ${customers.length === 1 ? "person" : "people"}`}
      />
      <PageBody>
        <form method="get">
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or number"
            aria-label="Search customers"
          />
        </form>

        {customers.length === 0 ? (
          <EmptyState
            title={q ? "Nobody matched that" : "No customers yet"}
            body={
              q
                ? "Try their first name, or part of their phone number."
                : "As soon as someone asks a question or places an order, they show up here with everything they've looked at."
            }
          />
        ) : (
          <RowList>
            {customers.map((customer) => (
              <Row key={customer.id} href={`/customers/${customer.id}`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-sunk text-[15px] font-medium text-ink-soft">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[14px] font-medium">
                      {customer.name}
                    </span>
                    {customer.spent_minor > 0 && (
                      <span className="tabular shrink-0 text-[13px] text-ink-soft">
                        {formatMoney(customer.spent_minor, business.currency)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
                    {customer.waiting_questions > 0 && (
                      <Badge tone="brand">
                        {customer.waiting_questions} waiting
                      </Badge>
                    )}
                    {customer.order_count > 0 ? (
                      <span>
                        {customer.order_count}{" "}
                        {customer.order_count === 1 ? "order" : "orders"}
                      </span>
                    ) : (
                      <span>No orders yet</span>
                    )}
                    <span aria-hidden>·</span>
                    <span>Last here {timeAgo(customer.last_seen_at)}</span>
                  </div>
                </div>
              </Row>
            ))}
          </RowList>
        )}
      </PageBody>
    </>
  );
}
