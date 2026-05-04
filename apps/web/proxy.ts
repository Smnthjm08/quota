import { NextRequest, NextResponse } from "next/server";
import { auth } from "@workspace/auth/auth";
import { getOnboardingRoute } from "@/lib/onboarding-route";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const targetRoute = getOnboardingRoute(
    (session as { company?: Parameters<typeof getOnboardingRoute>[0] })?.company ??
      null
  );

  if (targetRoute !== "/dashboard") {
    return NextResponse.redirect(new URL(targetRoute, request.url));
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/dashboard/:path*"],
};

export const config = {
  matcher: ["/dashboard/:path*"],
};
