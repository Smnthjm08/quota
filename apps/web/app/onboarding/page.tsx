import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@workspace/auth/auth";
import {
  getOnboardingRoute,
  type OnboardingSession,
} from "@/lib/onboarding-route";

export default async function OnboardingRootPage() {
  const requestHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: requestHeaders,
  })) as OnboardingSession;

  redirect(getOnboardingRoute(session?.company ?? null));
}
