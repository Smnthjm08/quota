"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  getOnboardingRoute,
  type OnboardingCompany,
} from "@/lib/onboarding-route";

export function useOnboardingRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const { company, isPending, refreshSession } = useAuthSession();
  const onboardingCompany = company as OnboardingCompany;
  const refreshedPathRef = useRef<string | null>(null);

  const targetRoute = useMemo(() => {
    return getOnboardingRoute(onboardingCompany ?? null);
  }, [onboardingCompany]);

  useEffect(() => {
    if (isPending || !pathname) {
      return;
    }

    if (
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/dashboard")
    ) {
      return;
    }

    if (refreshedPathRef.current !== pathname) {
      refreshedPathRef.current = pathname;
      void refreshSession();
    }
  }, [isPending, pathname, refreshSession]);

  useEffect(() => {
    if (isPending || !pathname) {
      return;
    }

    const isOnOnboarding = pathname.startsWith("/onboarding");
    const isOnDashboard = pathname.startsWith("/dashboard");

    if (!isOnOnboarding && !isOnDashboard) {
      return;
    }

    if (pathname === "/onboarding") {
      router.replace(targetRoute);
      return;
    }

    if (isOnDashboard && targetRoute !== "/dashboard") {
      router.replace(targetRoute);
      return;
    }

    if (isOnOnboarding && pathname !== targetRoute) {
      const isSuccessPage = pathname.endsWith("/success");

      if (isSuccessPage && targetRoute === "/onboarding/plan") {
        return;
      }

      router.replace(targetRoute);
    }
  }, [isPending, pathname, router, targetRoute]);

  return {
    isPending,
    pathname,
    targetRoute,
  };
}
