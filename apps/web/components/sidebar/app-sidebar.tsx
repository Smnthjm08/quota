"use client";

import * as React from "react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import {
  LayoutDashboardIcon,
  ChartBarIcon,
  Settings2Icon,
  CircleHelpIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  ReceiptTextIcon,
  ArmchairIcon,
  VaultIcon,
} from "lucide-react";
import LogoTitle from "../utils/logo-title";
import { useAuthSession } from "@/hooks/use-auth-session";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "My Vault",
      url: "/vault",
      icon: <VaultIcon />,
    },
    {
      title: "Seats",
      url: "/seats",
      icon: <ArmchairIcon />,
    },
    {
      title: "Usage",
      url: "/usage",
      icon: <ChartBarIcon />,
    },
    {
      title: "Billing",
      url: "/billing",
      icon: <ReceiptTextIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: <CircleHelpIcon />,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: <DatabaseIcon />,
    },
    {
      name: "Reports",
      url: "#",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: <FileIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session, company } = useAuthSession();
  const displayName =
    session?.user?.name?.trim() ||
    company?.name ||
    session?.user?.email ||
    "User";
  const displayEmail = session?.user?.email || "";
  const displayAvatar = session?.user?.image || "/avatars/shadcn.jpg";

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <LogoTitle />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email: displayEmail,
            avatar: displayAvatar,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
