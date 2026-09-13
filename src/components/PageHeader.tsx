import Link from "next/link";
import { ArrowLeftIcon } from "./icons";

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-4 pt-4 pb-3 backdrop-blur-sm md:px-0 md:pt-8">
      {back && (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-tight md:text-[26px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-[13px] text-ink-soft">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

/** Consistent page body padding: edge-to-edge on phones, inset on desktop. */
export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8 px-4 py-5 md:px-0 md:py-7">{children}</div>;
}
