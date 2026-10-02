import type { SessionPayload } from "./auth";

export type Role = "ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA";

export const ADMIN_TIER: Role[] = ["ADMIN", "KEPSEK", "KURIKULUM"];
export const READ_ONLY_ADMIN_TIER: Role[] = ["KEPSEK", "KURIKULUM"];
export const FULL_CRUD_ADMIN: Role[] = ["ADMIN"];

export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/admin": ["ADMIN"],
  "/kepsek": ["KEPSEK"],
  "/kurikulum": ["KURIKULUM"],
  "/guru": ["GURU"],
  "/siswa": ["SISWA"],
};

const DASHBOARD_PATHS: Record<Role, string> = {
  ADMIN: "/admin",
  KEPSEK: "/kepsek",
  KURIKULUM: "/kurikulum",
  GURU: "/guru",
  SISWA: "/siswa/dashboard",
};

export function getDashboardPath(role: Role): string {
  return DASHBOARD_PATHS[role];
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: role tidak diizinkan") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requireAuth(session: SessionPayload | null): SessionPayload {
  if (!session) throw new UnauthorizedError();
  return session;
}

export function requireRole(
  session: SessionPayload | null,
  allowedRoles: Role[]
): SessionPayload {
  const validSession = requireAuth(session);
  if (!allowedRoles.includes(validSession.role)) throw new ForbiddenError();
  return validSession;
}
