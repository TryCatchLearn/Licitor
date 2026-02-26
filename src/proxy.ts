import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAuthRouteRedirect } from "@/lib/auth-routing";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = Boolean(sessionCookie);

  const redirectPath = getAuthRouteRedirect(
    request.nextUrl.pathname,
    isAuthenticated,
  );

  if (!redirectPath) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}

export const config = {
  matcher: ["/profile/:path*", "/sign-in", "/register"],
};
