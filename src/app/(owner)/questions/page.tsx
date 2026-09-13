import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listQuestions } from "@/lib/data/questions";
import { PageBody, PageHeader } from "@/components/PageHeader";
import { QuestionItem, RowList } from "@/components/rows";
import { EmptyState, cx } from "@/components/ui";

export const metadata = { title: "Questions" };
export const dynamic = "force-dynamic";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = (await getSessionUser())!;
  const { status } = await searchParams;
  const filter = status === "answered" ? "answered" : status === "all" ? undefined : "waiting";
  const questions = listQuestions(session.business.id, filter);

  const tabs = [
    { key: "waiting", label: "Waiting" },
    { key: "answered", label: "Answered" },
    { key: "all", label: "All" },
  ];
  const active = status ?? "waiting";

  return (
    <>
      <PageHeader title="Questions" back={{ href: "/home", label: "Home" }} />
      <PageBody>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/questions?status=${tab.key}`}
              className={cx(
                "rounded-sm border px-3 py-1.5 text-[13px]",
                active === tab.key
                  ? "border-ink bg-ink text-paper"
                  : "border-line-strong text-ink-soft hover:bg-sunk",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {questions.length === 0 ? (
          <EmptyState
            title="Nothing here"
            body="Questions customers ask on your product pages land here, so they don't get lost in a DM."
          />
        ) : (
          <RowList>
            {questions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                shopName={session.business.name}
              />
            ))}
          </RowList>
        )}
      </PageBody>
    </>
  );
}
