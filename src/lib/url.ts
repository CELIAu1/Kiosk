import { headers } from "next/headers";

/**
 * The absolute URL of a shop, used everywhere the owner shares their link.
 * Derived from the incoming request so it is correct in local dev, on a
 * preview deployment and on a custom domain without any configuration.
 */
export async function shopUrl(slug: string): Promise<string> {
  return `${await origin()}/s/${slug}`;
}

export async function origin(): Promise<string> {
  const explicit = process.env.KIOSK_PUBLIC_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const head = await headers();
  const host = head.get("x-forwarded-host") ?? head.get("host") ?? "localhost:3000";
  const protocol =
    head.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/** A wa.me link that opens WhatsApp with the message already written. */
export function whatsappLink(phone: string | null, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
