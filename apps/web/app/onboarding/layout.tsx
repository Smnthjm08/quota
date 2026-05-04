import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@workspace/auth/auth";
import { AuthSessionProvider } from "@/components/provider/auth-session-provider";
import { type AppSession } from "@/lib/auth-session";

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: requestHeaders,
  })) as AppSession;

  if (!session?.user) {
    redirect("/login");
  }

  return <AuthSessionProvider initialSession={session}>{children}</AuthSessionProvider>;
}
