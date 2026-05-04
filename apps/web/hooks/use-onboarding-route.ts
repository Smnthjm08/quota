"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  getOnboardingRoute,
  type OnboardingCompany,
} from "@/lib/onboarding-route";

export function useOnboardingRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const { company, isPending } = useAuthSession();
  const onboardingCompany = company as OnboardingCompany;

  const targetRoute = useMemo(() => {
    return getOnboardingRoute(onboardingCompany ?? null);
  }, [onboardingCompany]);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!pathname || !pathname.startsWith("/onboarding")) {
      return;
    }

    if (pathname === "/onboarding" || pathname === targetRoute) {
      return;
    }

    router.replace(targetRoute);
  }, [isPending, pathname, router, targetRoute]);

  return {
    isPending,
    pathname,
    targetRoute,
  };
}
