import Link from "next/link";
import { ArrowLeftIcon } from "./icons";
import { cx } from "./ui";

/**
 * The setup screens in the Figma share one frame: a soft blue-to-pink wash
 * with a deep curved bottom edge, a small app mark sitting on that curve, then
 * the title and the step's content below.
 */
export function WizardShell({
  step,
  of = 4,
  title,
  subtitle,
  back,
  children,
}: {
  step: number;
  of?: number;
  title: string;
  subtitle?: string;
  back?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-5 -mb-28 min-h-dvh bg-surface">
      <div className="relative">
        <div
          className="h-56 rounded-b-[56px]"
          style={{
            background:
              "linear-gradient(160deg, #cfe3ff 0%, #e7d9fb 38%, #ffd6ec 68%, #ffffff 100%)",
          }}
        />
        {back && (
          <Link
            href={back}
            aria-label="Back"
            className="absolute top-5 left-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink backdrop-blur-sm"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        )}
        <span className="absolute top-5 right-5 rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold text-ink backdrop-blur-sm">
          Step {step} of {of}
        </span>

        <span className="absolute bottom-0 left-1/2 flex h-16 w-16 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-[18px] border-[3px] border-white bg-[#3a1430] shadow-card">
          <ShopMark />
        </span>
      </div>

      <div className="px-6 pt-14 pb-10">
        <h1 className="text-center text-[24px] leading-tight font-bold text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-2 max-w-xs text-center text-[14px] leading-relaxed text-ink-soft">
            {subtitle}
          </p>
        )}

        <div className="mt-8">{children}</div>

        <ol className="mt-10 flex justify-center gap-1.5" aria-label="Progress">
          {Array.from({ length: of }, (_, index) => (
            <li
              key={index}
              className={cx(
                "h-1 rounded-full transition-all",
                index + 1 === step ? "w-6 bg-brand" : "w-4 bg-line",
              )}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

/** The little storefront mark that sits on the curve. */
function ShopMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M6 12h20v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" fill="#f7d9a0" />
      <path d="M6 12 8 6h16l2 6z" fill="#e8b4c8" />
      <circle cx="12" cy="19" r="3" fill="#3a1430" />
      <path d="M19 16h5v10h-5z" fill="#c9636b" />
      <path d="m22 6 1.2 2.6L26 9.8l-2.4 1.4L23 14l-1.6-2.3-2.6-.4 1.9-1.9z" fill="#ffd217" />
    </svg>
  );
}
