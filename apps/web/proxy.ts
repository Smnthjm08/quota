import { NextRequest, NextResponse } from "next/server";
import { auth } from "@workspace/auth/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never guard auth and framework-internal routes to avoid self-redirect loops.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/dashboard/:path*"],
};

export const config = {
  matcher: ["/dashboard/:path*"],
};
