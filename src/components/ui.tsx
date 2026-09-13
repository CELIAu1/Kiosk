import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ buttons */

type ButtonTone = "primary" | "secondary" | "quiet" | "danger";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm text-[14px] font-medium " +
  "transition-colors disabled:opacity-40 disabled:pointer-events-none select-none";

const BUTTON_SIZE = {
  sm: "h-8 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-5 text-[15px]",
} as const;

const BUTTON_TONE: Record<ButtonTone, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-sunk",
  quiet: "text-ink-soft hover:text-ink hover:bg-sunk",
  danger: "border border-line-strong bg-surface text-ember hover:bg-ember-soft",
};

type ButtonProps = ComponentProps<"button"> & {
  tone?: ButtonTone;
  size?: keyof typeof BUTTON_SIZE;
};

export function Button({
  tone = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(BUTTON_BASE, BUTTON_SIZE[size], BUTTON_TONE[tone], className)}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  tone?: ButtonTone;
  size?: keyof typeof BUTTON_SIZE;
};

export function ButtonLink({
  tone = "primary",
  size = "md",
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      {...rest}
      className={cx(BUTTON_BASE, BUTTON_SIZE[size], BUTTON_TONE[tone], className)}
    />
  );
}

/* ------------------------------------------------------------------- inputs */

const FIELD =
  "w-full rounded-sm border border-line-strong bg-surface px-3 py-2.5 text-[15px] " +
  "text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input {...rest} className={cx(FIELD, className)} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea {...rest} className={cx(FIELD, "min-h-24 resize-y", className)} />;
}

export function Select({ className, ...rest }: ComponentProps<"select">) {
  return <select {...rest} className={cx(FIELD, "appearance-none pr-8", className)} />;
}

export function Field({
  label,
  hint,
  children,
  optional,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {optional && <span className="text-[12px] text-ink-muted">Optional</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-ink-muted">{hint}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ surfaces */

/** A plain bordered panel. Used instead of shadowed floating cards. */
export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("border border-line bg-surface", className)}>{children}</div>
  );
}

export function SectionHeading({
  title,
  action,
  note,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
        {note && <p className="mt-0.5 text-[13px] text-ink-muted">{note}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="text-[15px] font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-ink-soft">
        {body}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------- badges */

type BadgeTone = "neutral" | "ember" | "grow" | "flag";

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "bg-sunk text-ink-soft",
  ember: "bg-ember-soft text-ember",
  grow: "bg-grow-soft text-grow",
  flag: "bg-flag-soft text-flag",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-xs px-1.5 py-0.5 text-[11px] font-medium",
        BADGE_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

/** A count with its label, e.g. "12 looked". The unit of the interest story. */
export function Stat({
  value,
  label,
  tone,
}: {
  value: string | number;
  label: string;
  tone?: "ember" | "grow";
}) {
  return (
    <div>
      <div
        className={cx(
          "tabular text-[22px] leading-none font-semibold",
          tone === "ember" && "text-ember",
          tone === "grow" && "text-grow",
          !tone && "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] text-ink-muted">{label}</div>
    </div>
  );
}
