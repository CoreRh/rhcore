"use client";

import { useAuth } from "@/contexts/auth-context";
import type { AppPermission, UserRole } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Palmtree,
  FileText,
  UserCog,
  BarChart2,
  DollarSign,
  Gift,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"] as UserRole[],
  },
  {
    title: "Funcionários",
    url: "/employees",
    icon: Users,
    roles: ["ADMIN", "MANAGER"] as UserRole[],
    permission: "VIEW_ALL_EMPLOYEES",
  },
  {
    title: "Departamentos",
    url: "/departments",
    icon: Building2,
    roles: ["ADMIN", "MANAGER"] as UserRole[],
  },
  {
    title: "Cargos",
    url: "/positions",
    icon: Briefcase,
    roles: ["ADMIN", "MANAGER"] as UserRole[],
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart2,
    roles: [] as UserRole[],
    permission: "VIEW_REPORTS",
  },
  {
    title: "Folha de Pagamento",
    url: "/payroll",
    icon: DollarSign,
    roles: [] as UserRole[],
    permission: "MANAGE_PAYROLL",
  },
];

const requestNavItems = [
  {
    title: "Férias",
    url: "/vacations",
    icon: Palmtree,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"] as UserRole[],
  },
  {
    title: "Solicitações",
    url: "/requests",
    icon: FileText,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"] as UserRole[],
  },
  {
    title: "Benefícios",
    url: "/benefits",
    icon: Gift,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"] as UserRole[],
  },
];

const adminNavItems = [
  {
    title: "Usuários",
    url: "/users",
    icon: UserCog,
    roles: ["ADMIN"] as UserRole[],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role, hasAppPermission } = useAuth();

  const filterByRole = <T extends { roles: UserRole[]; permission?: string }>(
    items: T[],
  ) =>
    items.filter(
      (item) =>
        (role && item.roles.includes(role)) ||
        (item.permission && hasAppPermission(item.permission as AppPermission)),
    );

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">
              RHCore
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Sistema de RH</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(mainNavItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filterByRole(requestNavItems).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(requestNavItems).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filterByRole(adminNavItems).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(adminNavItems).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          RHCore v1.0.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
