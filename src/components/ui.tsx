import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ buttons */

/**
 * Button tones, straight from the Figma file:
 *   brand   — #007aff pill, the primary action ("Share", "Continue")
 *   dark    — black pill ("Login", active filter chip)
 *   soft    — #f6f6f6 pill with dark text ("Customer view")
 *   dashed  — #e0f2ff with a dashed #1575e2 edge ("Add a Shop")
 *   quiet   — text only
 */
type Tone = "brand" | "dark" | "soft" | "dashed" | "quiet" | "danger";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-semibold " +
  "transition-colors select-none disabled:pointer-events-none";

const SIZE = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5",
  lg: "h-[52px] px-6 text-[15px]",
} as const;

const TONE: Record<Tone, string> = {
  brand: "bg-brand text-white hover:bg-brand-nav disabled:bg-brand-disabled",
  dark: "bg-black text-white hover:bg-ink disabled:opacity-40",
  soft: "bg-sunk text-ink hover:bg-line-soft disabled:opacity-40",
  dashed:
    "bg-brand-tint text-ink border border-dashed border-brand-edge hover:bg-brand-tint-soft",
  quiet: "text-ink-soft hover:text-ink hover:bg-sunk",
  danger: "bg-bad-tint text-bad hover:brightness-95",
};

type BtnProps = ComponentProps<"button"> & { tone?: Tone; size?: keyof typeof SIZE };

export function Button({ tone = "brand", size = "md", className, ...rest }: BtnProps) {
  return <button {...rest} className={cx(BASE, SIZE[size], TONE[tone], className)} />;
}

type BtnLinkProps = ComponentProps<typeof Link> & {
  tone?: Tone;
  size?: keyof typeof SIZE;
};

export function ButtonLink({
  tone = "brand",
  size = "md",
  className,
  ...rest
}: BtnLinkProps) {
  return <Link {...rest} className={cx(BASE, SIZE[size], TONE[tone], className)} />;
}

/**
 * Square icon-only controls. Kept separate from Button because Button carries
 * horizontal padding, which on a fixed-width square leaves the glyph no room.
 */
const ICON_BTN =
  "inline-flex items-center justify-center rounded-full transition-colors";

const ICON_TONE = {
  soft: "bg-sunk text-ink hover:bg-line-soft",
  dark: "bg-black text-white hover:bg-ink",
  brand: "bg-brand text-white hover:bg-brand-nav",
  ghost: "bg-white/10 text-white hover:bg-white/20",
} as const;

type IconTone = keyof typeof ICON_TONE;

export function IconButton({
  className,
  tone = "soft",
  size = 36,
  ...rest
}: ComponentProps<"button"> & { tone?: IconTone; size?: number }) {
  return (
    <button
      {...rest}
      style={{ width: size, height: size, ...rest.style }}
      className={cx(ICON_BTN, ICON_TONE[tone], className)}
    />
  );
}

export function IconLink({
  className,
  tone = "soft",
  size = 36,
  ...rest
}: ComponentProps<typeof Link> & { tone?: IconTone; size?: number }) {
  return (
    <Link
      {...rest}
      style={{ width: size, height: size, ...rest.style }}
      className={cx(ICON_BTN, ICON_TONE[tone], className)}
    />
  );
}

/** "See all" / "Manage …" — the blue text link used beside section titles. */
export function SeeAll({ href, children = "See all" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="text-[12px] font-semibold text-brand-link hover:underline">
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------- inputs */

const FIELD =
  "w-full rounded-[8px] border-[0.5px] border-line bg-sunk px-4 py-3 text-[14px] " +
  "text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none";

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
        <span className="text-[12px] font-medium text-ink-muted">{label}</span>
        {optional && <span className="text-[12px] text-ink-faint">Optional</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-ink-soft">{hint}</span>}
    </label>
  );
}

/* ----------------------------------------------------------------- surfaces */

/** White card with the design's elevation. */
export function Card({
  className,
  children,
  radius = "card",
}: {
  className?: string;
  children: ReactNode;
  radius?: "card" | "panel" | "tile";
}) {
  const r =
    radius === "tile" ? "rounded-tile" : radius === "panel" ? "rounded-panel" : "rounded-card";
  return (
    <div className={cx("bg-surface shadow-card", r, className)}>{children}</div>
  );
}

/** Grey inset block — stat cards, the interest list container. */
export function Sunk({
  className,
  children,
  radius = "card",
}: {
  className?: string;
  children: ReactNode;
  radius?: "card" | "panel";
}) {
  return (
    <div
      className={cx(
        "border-[0.5px] border-line-soft bg-sunk",
        radius === "panel" ? "rounded-panel" : "rounded-card",
        className,
      )}
    >
      {children}
    </div>
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
    <div className="mb-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="truncate text-[14px] font-semibold text-ink">{title}</h2>
        {note && <p className="mt-0.5 text-[12px] text-ink-soft">{note}</p>}
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
    <div className="px-6 py-10 text-center">
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-ink-soft">
        {body}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------- chips */

/** Rounded filter chip. Active is blue in catalogues, black in the price book. */
export function Chip({
  href,
  active,
  activeTone = "brand",
  children,
}: {
  href: string;
  active: boolean;
  activeTone?: "brand" | "dark";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "shrink-0 rounded-full px-3.5 py-2 text-[12px] font-medium whitespace-nowrap",
        active
          ? activeTone === "dark"
            ? "bg-black text-white"
            : "bg-brand text-white"
          : "bg-sunk text-ink hover:bg-line-soft",
      )}
    >
      {children}
    </Link>
  );
}

type BadgeTone = "neutral" | "brand" | "good" | "warn" | "bad";

const BADGE: Record<BadgeTone, string> = {
  neutral: "bg-sunk text-ink-soft",
  brand: "bg-brand-tint text-brand",
  good: "bg-good-tint text-good",
  warn: "bg-warn-tint text-warn",
  bad: "bg-bad-tint text-bad",
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        BADGE[tone],
      )}
    >
      {children}
    </span>
  );
}

/** The circular monogram used for people and shops without a photo. */
export function Monogram({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[12px] font-bold text-brand",
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Stat card from "Statistics over the past 7 days". */
export function Stat({
  value,
  label,
  icon,
}: {
  value: string | number;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <Sunk className="flex min-w-0 flex-1 flex-col justify-center gap-4 px-2.5 py-3">
      {icon && <span className="text-ink">{icon}</span>}
      <span className="min-w-0">
        <span className="num block truncate text-[14px] font-semibold text-black">
          {value}
        </span>
        <span className="num mt-1 block text-[10px] leading-tight font-medium text-ink-muted">
          {label}
        </span>
      </span>
    </Sunk>
  );
}
