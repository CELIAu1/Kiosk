import { NextResponse, type NextRequest } from "next/server";

/**
 * Storefront visitors are anonymous until they tell us who they are, but we
 * still need a stable handle to attribute interest to. The proxy mints that
 * token because a Server Component cannot set cookies during a render.
 *
 * It is a random opaque id. No tracking across businesses, no third parties.
 */
const VISITOR_COOKIE = "kiosk_v";
const VISITOR_HEADER = "x-kiosk-visitor";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  const token = existing ?? crypto.randomUUID();

  // Forward it on the request so the very first render can already use it.
  const headers = new Headers(request.headers);
  headers.set(VISITOR_HEADER, token);

  const response = NextResponse.next({ request: { headers } });
  if (!existing) {
    response.cookies.set(VISITOR_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }
  return response;
}

export const config = {
  // Only the customer-facing shop needs a visitor token.
  matcher: ["/s/:path*"],
};
