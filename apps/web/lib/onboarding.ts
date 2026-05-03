import { prisma } from "@workspace/db";

export type OnboardingRoute =
  | "/onboarding/company"
  | "/onboarding/plan"
  | "/onboarding/wallet"
  | "/dashboard";

export async function resolveOnboardingRoute(
  userId: string
): Promise<OnboardingRoute> {
  const company = await prisma.company.findUnique({
    where: {
      ownerId: userId,
    },
    select: {
      plan: true,
      ownerWalletPubkey: true,
    },
  });

  if (!company) {
    return "/onboarding/company";
  }

  if (!company.plan) {
    return "/onboarding/plan";
  }

  if (!company.ownerWalletPubkey) {
    return "/onboarding/wallet";
  }

  return "/dashboard";
}
