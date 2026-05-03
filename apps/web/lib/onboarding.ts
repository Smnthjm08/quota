import { prisma } from "@workspace/db";
import { getOnboardingRoute, type OnboardingRoute } from "./onboarding-route";

export async function resolveOnboardingRoute(
  userId: string
): Promise<OnboardingRoute> {
  const company = await prisma.company.findUnique({
    where: {
      ownerId: userId,
    },
    select: {
      planId: true,
      ownerWalletPubkey: true,
    },
  });

  return getOnboardingRoute(company);
}
