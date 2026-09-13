"use client";

import { useState } from "react";
import { CopyIcon } from "./icons";
import { cx } from "./ui";

/**
 * The account handle under the welcome line, with the copy affordance from
 * the design. The tag is the thing the owner pastes into a social bio, so
 * copying it is the whole point of showing it.
 */
export function CopyTag({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Copy your tag", value);
        }
      }}
      className={cx(
        "inline-flex items-center gap-2 text-[14px] text-black hover:text-brand",
        className,
      )}
    >
      {value}
      <CopyIcon className="h-[18px] w-[18px]" />
      <span className="sr-only">Copy</span>
      {copied && <span className="text-[12px] text-brand">Copied</span>}
    </button>
  );
}
