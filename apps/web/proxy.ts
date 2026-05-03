import { NextRequest, NextResponse } from "next/server";
import { auth } from "@workspace/auth/auth";

export async function proxy(request: NextRequest) {
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
