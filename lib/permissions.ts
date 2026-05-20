import type { AppPermission, UserRole } from "./types";

export interface RouteRule {
  roles: UserRole[];
  permissions?: AppPermission[];
}

export const ROUTE_PERMISSIONS: Record<string, RouteRule> = {
  "/": { roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
  "/employees": {
    roles: ["ADMIN", "MANAGER"],
    permissions: ["VIEW_ALL_EMPLOYEES"],
  },
  "/departments": { roles: ["ADMIN", "MANAGER"] },
  "/positions": { roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
  "/vacations": { roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
  "/requests": { roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
  "/payroll": { roles: ["ADMIN", "MANAGER"], permissions: ["MANAGE_PAYROLL"] },
  "/users": { roles: ["ADMIN"] },
  "/profile": { roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
  "/reports": {
    roles: ["ADMIN", "MANAGER"],
    permissions: ["VIEW_REPORTS"],
  },
};

export function hasRouteAccess(
  role: UserRole | null,
  pathname: string,
  permissions?: AppPermission[],
): boolean {
  if (!role) return false;
  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((route) =>
      route === "/" ? pathname === "/" : pathname.startsWith(route),
    )
    .sort((a, b) => b.length - a.length)[0];
  if (!match) return true;
  const rule = ROUTE_PERMISSIONS[match];
  if (rule.roles.includes(role)) return true;
  // permissions ampliam o acesso: qualquer role com uma das permissões listadas é autorizado
  if (rule.permissions?.some((p) => permissions?.includes(p))) return true;
  return false;
}
