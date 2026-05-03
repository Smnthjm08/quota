export type OnboardingRoute =
  | "/onboarding/company"
  | "/onboarding/plan"
  | "/onboarding/wallet"
  | "/dashboard";

export type OnboardingCompany = {
  planId?: number | null;
  ownerWalletPubkey?: string | null;
} | null;

export type OnboardingSession = {
  company?: OnboardingCompany;
} | null;

export function getOnboardingRoute(
  company: OnboardingCompany
): OnboardingRoute {
  if (!company) {
    return "/onboarding/company";
  }

  if (!company.planId) {
    return "/onboarding/plan";
  }

  if (!company.ownerWalletPubkey) {
    return "/onboarding/wallet";
  }

  return "/dashboard";
}
