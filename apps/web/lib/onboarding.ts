import { prisma } from "@workspace/db";

export type OnboardingRoute =
  | "/onboarding/company"
  | "/onboarding/plan"
  | "/onboarding/wallet";

export async function resolveOnboardingRoute(
  userId: string
): Promise<OnboardingRoute> {
  const company = await prisma.company.findUnique({
    where: {
      ownerId: userId,
    },
    select: {
      plan: true,
    },
  });

  if (!company) {
    return "/onboarding/company";
  }

  if (!company.plan) {
    return "/onboarding/plan";
  }

  return "/onboarding/wallet";
}