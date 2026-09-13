import Link from "next/link";
import { ArrowLeftIcon } from "./icons";

/** The simple title bar used on secondary screens (Price book, Orders, …). */
export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  back?: { href: string; label?: string };
}) {
  return (
    <header className="flex items-start justify-between gap-3 pt-6 pb-4">
      <div className="flex min-w-0 items-start gap-3">
        {back && (
          <Link
            href={back.href}
            aria-label={back.label ?? "Back"}
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunk text-ink hover:bg-line-soft"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-bold text-ink">{title}</h1>
          {subtitle && (
            <div className="mt-0.5 text-[12px] text-ink-soft">{subtitle}</div>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="space-y-7 pb-6">{children}</div>;
}
