"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyIcon } from "./icons";
import { cx } from "./ui";

/**
 * A shop tag is the thing a customer types or taps to reach the shop, so it
 * behaves like one: tapping it opens the shop, and copying is a separate
 * button beside it. Previously the tag was only a copy control, so tapping it
 * appeared to do nothing.
 */
export function ShopTag({
  tag,
  href,
  copyValue,
  className,
  size = "md",
}: {
  tag: string;
  /** Where tapping the tag goes. Defaults to the shop itself. */
  href?: string;
  /** What the copy button puts on the clipboard — the full shareable URL. */
  copyValue?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);
  const target = href ?? `/s/${tag.replace(/^@/, "")}`;
  const label = tag.startsWith("@") ? tag : `@${tag}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue ?? label);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy your shop link", copyValue ?? label);
    }
  }

  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <Link
        href={target}
        className={cx(
          "font-semibold text-brand-link hover:underline",
          size === "sm" ? "text-[12px]" : "text-[14px]",
        )}
      >
        {label}
      </Link>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : `Copy the link for ${label}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-soft hover:bg-sunk hover:text-ink"
      >
        <CopyIcon className="h-[14px] w-[14px]" />
      </button>
      {copied && <span className="text-[11px] text-brand">Copied</span>}
    </span>
  );
}
