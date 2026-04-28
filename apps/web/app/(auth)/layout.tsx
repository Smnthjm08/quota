import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@workspace/auth/auth";
import { authNavigateEndpoint } from "@/constants/naviagte";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (session?.user) {
    redirect(authNavigateEndpoint);
  }

  return children;
}