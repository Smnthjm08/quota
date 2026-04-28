import { NextRequest } from "next/server";
import { auth } from "@workspace/auth/auth";
import { prisma } from "@workspace/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return new Response(JSON.stringify({ route: "/login" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const company = await prisma.company.findUnique({
      where: { ownerId: session.user.id },
      select: { plan: true },
    });

    if (!company) {
      return new Response(JSON.stringify({ route: "/onboarding/company" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!company.plan) {
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
