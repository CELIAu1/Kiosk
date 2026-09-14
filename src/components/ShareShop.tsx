"use client";

import { useState } from "react";
import { Button, IconButton, cx } from "./ui";
import { CheckIcon, ShareIcon } from "./icons";

/**
 * Sharing the link IS the distribution model — the shop lives in a bio, a
 * status, a DM. So copying it is a first-class action, not a settings detail.
 */
export function ShareShop({
  url,
  label = "Share",
  tone = "brand",
  iconOnly = false,
  className,
}: {
  url: string;
  label?: string;
  tone?: "brand" | "soft" | "dark";
  /** Renders a square icon control instead of a labelled pill. */
  iconOnly?: boolean;
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

  if (iconOnly) {
    return (
      <IconButton
        tone={tone}
        onClick={share}
        aria-label={copied ? "Link copied" : "Share"}
        className={className}
      >
        {copied ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
      </IconButton>
    );
  }

  return (
    <Button tone={tone} onClick={share} className={cx(className)}>
      {copied ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch overflow-hidden rounded-[8px] border-[0.5px] border-line bg-sunk">
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
        className="border-l border-line px-4 text-[13px] font-semibold text-brand hover:bg-brand-tint"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
