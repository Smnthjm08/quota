import { OnboardingPlanPricingCard } from "@/components/onboarding-pricing-cards";
import OnboardingRouteGuard from "@/components/onboarding/onboarding-route-guard";

export const metadata = {
  title: "Choose your plan",
  description: "Select a Dodo subscription plan to continue onboarding.",
};

export default function OnboardingPage() {
  return (
    <>
      <OnboardingRouteGuard />
      <main className="min-h-screen bg-background">
        <OnboardingPlanPricingCard />
      </main>
    </>
  );
}
