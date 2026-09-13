import Link from "next/link";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "./icons";

/**
 * The blue prompt from the Figma home screen (232:1561). It is the one piece
 * of instruction in the app, and it earns its place: putting the tag on a
 * social profile is the entire distribution mechanic.
 */
export function TagBanner({ tag, href }: { tag: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-end justify-between gap-3 rounded-card bg-brand p-3 text-white"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] leading-tight font-extrabold">
          Add your special tag{" "}
          <span className="text-accent">&ldquo;@{tag}&rdquo;</span> to your social
          media profile
        </span>
        <span className="mt-2 flex items-center gap-3.5 opacity-90">
          <InstagramIcon className="h-3.5 w-3.5" />
          <WhatsAppIcon className="h-3.5 w-3.5" />
          <TikTokIcon className="h-3.5 w-3.5" />
        </span>
      </span>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[13px]">
        ›
      </span>
    </Link>
  );
}
