import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@workspace/auth/auth";
import OnboardingGateClient from "@/components/onboarding/onboarding-gate-client";

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Render children server-side; the client gate will fetch the correct onboarding
  // step and navigate if the current path does not match the user's state.
  return (
    <>
      {children}
      <OnboardingGateClient />
    </>
  );
}
