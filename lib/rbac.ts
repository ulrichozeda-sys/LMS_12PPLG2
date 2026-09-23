export type Role = "ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA";

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
