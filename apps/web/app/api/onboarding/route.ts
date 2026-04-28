import { NextRequest } from "next/server";
import { auth } from "@workspace/auth/auth";
import { prisma } from "@workspace/db";

type OnboardingSession = {
  user: {
    id: string;
  };
  company?: {
    planId?: number | null;
  } | null;
} | null;

export async function GET(request: NextRequest) {
  try {
    const session = (await auth.api.getSession({
      headers: request.headers,
    })) as OnboardingSession;

    if (!session?.user) {
      return new Response(JSON.stringify({ route: "/login" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const company = session.company ?? (await prisma.company.findUnique({
      where: { ownerId: session.user.id },
      select: { planId: true },
    }));

    if (!company) {
      return new Response(JSON.stringify({ route: "/onboarding/company" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!company.planId) {
      return new Response(JSON.stringify({ route: "/onboarding/plan" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ route: "/onboarding/wallet" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("/api/onboarding error", err);
    return new Response(JSON.stringify({ route: "/onboarding/company" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
