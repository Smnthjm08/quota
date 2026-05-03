import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@workspace/auth/auth";

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

  return <>{children}</>;
}
