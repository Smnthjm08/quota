"use client";

import { useOnboardingRoute } from "@/hooks/use-onboarding-route";

export default function OnboardingRouteGuard() {
  useOnboardingRoute();

  return null;
}
