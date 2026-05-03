import CompanyOnboardingForm from "@/components/onboarding/company-onboarding-form";
import OnboardingRouteGuard from "@/components/onboarding/onboarding-route-guard";

export default function CompanyOnboardingPage() {
  return (
    <>
      <OnboardingRouteGuard />
      <CompanyOnboardingForm />
    </>
  );
}
