import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, run } from "./db";
import { newId } from "./ids";
import { hashPassword, verifyPassword } from "./password";
import type { Business } from "./types";

export { hashPassword, verifyPassword };

const SESSION_COOKIE = "kiosk_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  business: Business;
};

export async function createSession(userId: string) {
  const id = newId("ses");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await run(
    `INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
    id,
    userId,
    now.toISOString(),
    expires.toISOString(),
  );
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await run(`DELETE FROM sessions WHERE id = ?`, id);
  jar.delete(SESSION_COOKIE);
}

/** Returns the signed-in owner, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const row = await one<{
    user_id: string;
    email: string;
    name: string | null;
    expires_at: string;
    business_id: string;
  }>(
    `SELECT s.user_id, s.expires_at, u.email, u.name, u.business_id
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ?`,
    id,
  );
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await run(`DELETE FROM sessions WHERE id = ?`, id);
    return null;
  }

  const business = await one<Business>(
    `SELECT * FROM businesses WHERE id = ?`,
    row.business_id,
  );
  if (!business) return null;

  return { id: row.user_id, email: row.email, name: row.name, business };
}

/**
 * The session, or a redirect to sign-in. Pages must use this rather than
 * asserting the session is non-null: a page and its layout render in
 * parallel, so the layout's guard cannot be relied on to run first — the
 * page would throw on a signed-out request before the redirect happened.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");
  return session;
}

export function findUserByEmail(email: string) {
  return one<{ id: string; email: string; password_hash: string; business_id: string }>(
    `SELECT id, email, password_hash, business_id FROM users WHERE email = ?`,
    email.trim().toLowerCase(),
  );
}
