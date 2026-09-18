"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Phone,
  Bot,
  FileText,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/Icons";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Phone, label: "Calls", href: "/dashboard/calls" },
  { icon: Bot, label: "Agents", href: "/dashboard/agents" },
  { icon: FileText, label: "Scripts", href: "/dashboard/scripts" },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      {/* ── Brand ── */}
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg">
            <div className="absolute inset-0 rounded-lg bg-chart-1/15 ring-1 ring-chart-1/40" />
            <div className="absolute inset-0 rounded-lg bg-chart-1/8 blur-sm" />
            <Logo size={18} className="relative text-chart-1" />
          </div>

          {/* Name — hidden when collapsed */}
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">
              Invenco
            </span>
            <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/60 uppercase">
              AI Platform
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/40 uppercase">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href + "/"));

                return (
                  <SidebarMenuItem className="mt-1" key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="border-t border-sidebar-border/60 pt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              render={<Link href="/dashboard/settings" />}
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

      </SidebarFooter>
    </Sidebar>
  );
}
