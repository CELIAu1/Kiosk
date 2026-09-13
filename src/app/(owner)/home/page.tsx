import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listProducts } from "@/lib/data/products";
import { listQuestions } from "@/lib/data/questions";
import { listOrders } from "@/lib/data/orders";
import {
  getPulse,
  listActivity,
  productsWithUnconvertedInterest,
} from "@/lib/data/interest";
import { customersToFollowUp } from "@/lib/data/customers";
import { formatMoney } from "@/lib/money";
import { timeAgo } from "@/lib/time";
import { shopUrl } from "@/lib/url";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { OrderItemRow, QuestionItem, Row, RowList } from "@/components/rows";
import { Thumb } from "@/components/Thumb";
import { ButtonLink, EmptyState, Panel, SectionHeading, Stat } from "@/components/ui";
import { CopyField, ShareShop } from "@/components/ShareShop";
import { PlusIcon } from "@/components/icons";
import type { InterestKind } from "@/lib/types";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = (await getSessionUser())!;
  const business = session.business;
  const url = await shopUrl(business.slug);

  const products = listProducts(business.id);
  const waiting = listQuestions(business.id, "waiting");
  const newOrders = listOrders(business.id, "new");
  const pulse = getPulse(business.id, 7);
  const stalled = productsWithUnconvertedInterest(business.id);
  const followUps = customersToFollowUp(business.id);
  const activity = listActivity(business.id, 12);

  const firstName = (business.owner_name ?? "").split(" ")[0];
  const nothingPending = waiting.length === 0 && newOrders.length === 0;

  // Before there is anything to sell, the only useful screen is a setup screen.
  if (products.length === 0) {
    return (
      <>
        <PageHeader title={business.name} subtitle="Let's get your shop ready" />
        <PageBody>
          <Panel className="p-5">
            <h2 className="text-[17px] font-semibold">Two steps and you&rsquo;re open</h2>
            <ol className="mt-4 space-y-4">
              <SetupStep
                n={1}
                title="Add what you sell"
                body="A photo, a name and a price is enough to start. You can add more later."
                done={false}
                action={
                  <ButtonLink href="/products/new">
                    <PlusIcon className="h-4 w-4" />
                    Add a product
                  </ButtonLink>
                }
              />
              <SetupStep
                n={2}
                title="Share your link"
                body="Put it in your Instagram bio or your WhatsApp status. That link is your shop."
                done={false}
                action={<CopyField value={url} />}
              />
            </ol>
          </Panel>
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : business.name}
        subtitle={nothingPending ? "Nothing is waiting on you" : "A few things need you"}
        action={<ShareShop url={url} label="Share" className="md:hidden" />}
      />
      <PageBody>
        {/* 1. Things that need a decision or a reply, before anything else. */}
        {waiting.length > 0 && (
          <section>
            <SectionHeading
              title={`${waiting.length} ${waiting.length === 1 ? "question" : "questions"} waiting`}
              note="Someone asked and hasn't heard back."
            />
            <RowList>
              {waiting.slice(0, 3).map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  shopName={business.name}
                />
              ))}
            </RowList>
            {waiting.length > 3 && (
              <Link
                href="/questions"
                className="mt-2 inline-block text-[13px] font-medium underline underline-offset-4"
              >
                See all {waiting.length} questions
              </Link>
            )}
          </section>
        )}

        {newOrders.length > 0 && (
          <section>
            <SectionHeading
              title={`${newOrders.length} new ${newOrders.length === 1 ? "order" : "orders"}`}
              note="Confirm these so the customer knows you've seen them."
              action={
                <Link href="/orders" className="text-[13px] font-medium underline underline-offset-4">
                  All orders
                </Link>
              }
            />
            <RowList>
              {newOrders.slice(0, 4).map((order) => (
                <OrderItemRow key={order.id} order={order} currency={business.currency} />
              ))}
            </RowList>
          </section>
        )}

        {nothingPending && (
          <EmptyState
            title="You're all caught up"
            body="No questions waiting and no new orders. Anything customers do next will show up here."
          />
        )}

        {/* 2. What happened. Counts of people, not decorative charts. */}
        <section>
          <SectionHeading title="Last 7 days" />
          <Panel className="grid grid-cols-2 gap-y-6 p-5 sm:grid-cols-4">
            <Stat value={pulse.people} label="people looked" />
            <Stat value={pulse.productViews} label="products viewed" />
            <Stat value={pulse.questions} label="questions asked" />
            <Stat
              value={formatMoney(pulse.salesMinor, business.currency)}
              label={`${pulse.orders} ${pulse.orders === 1 ? "order" : "orders"}`}
              tone={pulse.salesMinor > 0 ? "grow" : undefined}
            />
          </Panel>
        </section>

        {/* 3. Interest turned into something the owner can act on. */}
        {(stalled.length > 0 || followUps.length > 0) && (
          <section>
            <SectionHeading
              title="Worth a look"
              note="Interest that hasn't turned into a sale yet."
            />
            <RowList>
              {stalled.map((product) => (
                <Row key={product.id} href={`/products/${product.id}`}>
                  <Thumb imageId={product.image_id} alt={product.name} className="w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{product.name}</p>
                    <p className="mt-0.5 text-[13px] text-ink-soft">
                      <span className="tabular font-medium text-ink">{product.views} people</span>{" "}
                      looked, nobody ordered
                      {product.asked > 0 && ` · ${product.asked} asked about it`}
                    </p>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      {product.stock !== null && product.stock <= 0
                        ? "It's out of stock — that may be why."
                        : "Check the price, the photo, or whether sizes are listed."}
                    </p>
                  </div>
                </Row>
              ))}
              {followUps.map((customer) => (
                <Row key={customer.id} href={`/customers/${customer.id}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-sunk text-[15px] font-medium text-ink-soft">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{customer.name}</p>
                    <p className="mt-0.5 text-[13px] text-ink-soft">
                      {customer.last_product
                        ? `Interested in ${customer.last_product}, hasn't ordered`
                        : "Looked around, hasn't ordered"}
                    </p>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      Last here {timeAgo(customer.last_seen_at)}
                    </p>
                  </div>
                </Row>
              ))}
            </RowList>
          </section>
        )}

        {/* 4. The raw trail, for when the owner wants to see everything. */}
        {activity.length > 0 && (
          <section>
            <SectionHeading title="Recent activity" />
            <RowList>
              {activity.map((event) => (
                <Row key={event.id}>
                  {/* Some events (starting a checkout) aren't about one
                      product, so they get a marker rather than a blank frame. */}
                  {event.product_id ? (
                    <Thumb imageId={event.image_id} alt="" className="w-9 shrink-0" />
                  ) : (
                    <span className="mt-1.5 ml-3 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-snug">
                      <span className="font-medium">
                        {event.customer_name ?? "Someone"}
                      </span>{" "}
                      <span className="text-ink-soft">{ACTIVITY_VERB[event.kind]}</span>{" "}
                      {event.product_name && (
                        <span className="font-medium">{event.product_name}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {timeAgo(event.created_at)}
                    </p>
                  </div>
                </Row>
              ))}
            </RowList>
          </section>
        )}
      </PageBody>
    </>
  );
}

const ACTIVITY_VERB: Record<InterestKind, string> = {
  viewed_shop: "visited your shop",
  viewed_product: "looked at",
  asked: "asked about",
  saved: "saved",
  added_to_cart: "added to their order",
  checkout_started: "started ordering",
  ordered: "ordered",
};

function SetupStep({
  n,
  title,
  body,
  action,
}: {
  n: number;
  title: string;
  body: string;
  done: boolean;
  action: React.ReactNode;
}) {
  return (
    <li className="flex gap-3.5">
      <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong text-[12px] font-medium">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{body}</p>
        <div className="mt-3">{action}</div>
      </div>
    </li>
  );
}
