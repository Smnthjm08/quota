import { OnboardingPlanPricingCard } from "@/components/onboarding-pricing-cards";

export const metadata = {
  title: "Choose your plan",
  description: "Select a Dodo subscription plan to continue onboarding.",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background">
      <OnboardingPlanPricingCard />
    </main>
  );
}
