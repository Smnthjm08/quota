"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@workspace/auth/client";
import {
  getOnboardingRoute,
  type OnboardingCompany,
} from "@/lib/onboarding-route";

type OnboardingSession = {
  company?: OnboardingCompany;
};

export function useOnboardingRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const onboardingSession = session as OnboardingSession | null;
  const company = onboardingSession?.company ?? null;

  const targetRoute = useMemo(() => {
    return getOnboardingRoute(company);
  }, [company]);

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
