import Link from "next/link";
import { Thumb } from "./Thumb";
import { Badge, cx } from "./ui";
import { WhatsAppIcon } from "./icons";
import { timeAgo } from "@/lib/time";
import { formatMoney } from "@/lib/money";
import { whatsappLink } from "@/lib/url";
import { markQuestionAnsweredAction } from "@/lib/actions/questions";
import { ORDER_STATUS_LABEL } from "@/lib/data/orders";
import type { QuestionRow } from "@/lib/data/questions";
import type { OrderRow } from "@/lib/data/orders";
import type { OrderStatus } from "@/lib/types";

/** Shared row chrome: full-width, hairline separated, tappable. */
export function Row({
  href,
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const body = (
    <div className={cx("flex items-start gap-3 px-4 py-3.5", className)}>{children}</div>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block hover:bg-sunk">
      {body}
    </Link>
  );
}

export function RowList({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-line border border-line bg-surface">{children}</div>
  );
}

/* ---------------------------------------------------------------- questions */

/**
 * A question is answered where the customer already is — WhatsApp. KIOSK's
 * job is making sure it is not forgotten, not replacing the conversation.
 */
export function QuestionItem({
  question,
  shopName,
}: {
  question: QuestionRow;
  shopName: string;
}) {
  const reply = whatsappLink(
    question.customer_phone,
    `Hi ${question.customer_name.split(" ")[0]}, it's ${shopName}. About your question${
      question.product_name ? ` on the ${question.product_name}` : ""
    }: `,
  );

  return (
    <Row>
      <Thumb
        imageId={question.image_id}
        alt={question.product_name ?? ""}
        className="w-12 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[14px] font-medium">
            {question.customer_name}
          </span>
          <span className="shrink-0 text-[12px] text-ink-muted">
            {timeAgo(question.created_at)}
          </span>
        </div>
        {question.product_name && (
          <p className="mt-0.5 truncate text-[12px] text-ink-muted">
            on {question.product_name}
          </p>
        )}
        <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">
          &ldquo;{question.body}&rdquo;
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {reply ? (
            <a
              href={reply}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-ink px-2.5 text-[13px] font-medium text-paper hover:bg-ink-soft"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              Reply on WhatsApp
            </a>
          ) : (
            <span className="text-[12px] text-ink-muted">
              No phone number — reply on {question.customer_instagram ?? "Instagram"}
            </span>
          )}
          {question.status === "waiting" ? (
            <form action={markQuestionAnsweredAction}>
              <input type="hidden" name="question_id" value={question.id} />
              <input type="hidden" name="answered" value="true" />
              <button
                type="submit"
                className="h-8 rounded-sm border border-line-strong px-2.5 text-[13px] text-ink-soft hover:bg-sunk"
              >
                Mark answered
              </button>
            </form>
          ) : (
            <Badge tone="grow">Answered</Badge>
          )}
        </div>
      </div>
    </Row>
  );
}

/* ------------------------------------------------------------------- orders */

const STATUS_TONE: Record<OrderStatus, "ember" | "flag" | "grow" | "neutral"> = {
  new: "ember",
  confirmed: "flag",
  completed: "grow",
  cancelled: "neutral",
};

export function OrderItemRow({
  order,
  currency,
}: {
  order: OrderRow;
  currency: string;
}) {
  return (
    <Row href={`/orders/${order.id}`}>
      <Thumb
        imageId={order.preview_image_id}
        alt=""
        className="w-12 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-medium">{order.customer_name}</span>
          <span className="tabular shrink-0 text-[14px] font-medium">
            {formatMoney(order.total_minor, currency)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-ink-muted">
          <Badge tone={STATUS_TONE[order.status]}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
          <span>
            {order.item_count} item{order.item_count === 1 ? "" : "s"}
          </span>
          <span aria-hidden>·</span>
          <span>{timeAgo(order.created_at)}</span>
        </div>
      </div>
    </Row>
  );
}
