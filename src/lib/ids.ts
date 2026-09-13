import { randomBytes, randomUUID } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford-ish, no I/L/O/U

/** Prefixed, URL-safe id. The prefix makes ids readable in logs and URLs. */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

/** Short human-quotable code, e.g. the reference a customer reads out loud. */
export function shortCode(length = 5): string {
  const bytes = randomBytes(length);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}
