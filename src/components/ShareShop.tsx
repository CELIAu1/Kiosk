"use client";

import { useState } from "react";
import { Button, cx } from "./ui";
import { CheckIcon, ShareIcon } from "./icons";

/**
 * Sharing the link IS the distribution model — the shop lives in a bio, a
 * status, a DM. So copying it is a first-class action, not a settings detail.
 */
export function ShareShop({
  url,
  label = "Share shop",
  tone = "secondary",
  className,
}: {
  url: string;
  label?: string;
  tone?: "primary" | "secondary";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url, title: "My shop" });
        return;
      } catch {
        // The person dismissed the sheet, or sharing isn't permitted. Copy instead.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your shop link", url);
    }
  }

  return (
    <Button tone={tone} onClick={share} className={cx(className)}>
      {copied ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
      {copied ? "Link copied" : label}
    </Button>
  );
}

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch border border-line-strong bg-surface">
      <span className="flex-1 truncate px-3 py-2.5 text-[14px] text-ink-soft">
        {value.replace(/^https?:\/\//, "")}
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy your shop link", value);
          }
        }}
        className="border-l border-line-strong px-3 text-[13px] font-medium text-ink hover:bg-sunk"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
