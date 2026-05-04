import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { AuthSessionProvider } from "@/components/provider/auth-session-provider";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@workspace/auth/auth";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { type AppSession } from "@/lib/auth-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const requestHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: requestHeaders,
  })) as AppSession;

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AuthSessionProvider initialSession={session}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AuthSessionProvider>
  );
}
