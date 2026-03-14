import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_AUTHENTICATED_REDIRECT,
  DEFAULT_UNAUTHENTICATED_REDIRECT,
} from "@/lib/auth/redirects";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = Boolean(user);
  const isApiRoute = pathname.startsWith("/api");
  const isAuthPage =
    pathname === "/login" || pathname === "/signup" || pathname === "/reset-password";

  if (isApiRoute) {
    return response;
  }

  if (pathname === "/") {
    return redirectWithSessionCookies(
      request,
      isAuthenticated ? DEFAULT_AUTHENTICATED_REDIRECT : DEFAULT_UNAUTHENTICATED_REDIRECT,
      response,
    );
  }

  if (isAuthenticated && isAuthPage) {
    return redirectWithSessionCookies(request, DEFAULT_AUTHENTICATED_REDIRECT, response);
  }

  if (!isAuthenticated && !isAuthPage) {
    const nextPath = `${pathname}${search}`;
    return redirectWithSessionCookies(
      request,
      `${DEFAULT_UNAUTHENTICATED_REDIRECT}?next=${encodeURIComponent(nextPath)}`,
      response,
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};

function redirectWithSessionCookies(
  request: NextRequest,
  destination: string,
  sourceResponse: NextResponse,
) {
  const redirectUrl = new URL(destination, request.url);
  const redirectResponse = NextResponse.redirect(redirectUrl);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
