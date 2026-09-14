export const RESIDENT_ROLE_SET = new Set<string>(["RESIDENT", "OWNER", "TENANT"]);
export const MANAGEMENT_ROLE_SET = new Set<string>([
  "ADMIN",
  "SUPER_ADMIN",
  "PROPERTY_MANAGER",
  "FACILITY_MANAGER",
]);
export const GLOBAL_ROLE_SET = new Set<string>(["ADMIN", "SUPER_ADMIN"]);
export const MAINTENANCE_ROLE_SET = new Set<string>([
  "MAINTENANCE_STAFF",
  "MAINTENANCE_TECHNICIAN",
  "TECHNICIAN",
]);
export const TECHNICIAN_CREATOR_ROLE_SET = new Set<string>([
  "ADMIN",
  "SUPER_ADMIN",
  "PROPERTY_MANAGER",
]);

export const normalizeRole = (role: string | null | undefined): string =>
  (role ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");

export const hasRole = (
  role: string | null | undefined,
  allowedRoles: ReadonlySet<string>
): boolean => allowedRoles.has(normalizeRole(role));

export const hasExactRole = (
  role: string | null | undefined,
  allowedRoles: readonly string[]
): boolean => typeof role === "string" && allowedRoles.includes(role);

export const isResidentRole = (role: string | null | undefined): boolean =>
  hasRole(role, RESIDENT_ROLE_SET);

export const isManagementRole = (role: string | null | undefined): boolean =>
  hasRole(role, MANAGEMENT_ROLE_SET);

export const isGlobalRole = (role: string | null | undefined): boolean =>
  hasRole(role, GLOBAL_ROLE_SET);

export const isMaintenanceRole = (role: string | null | undefined): boolean =>
  hasRole(role, MAINTENANCE_ROLE_SET);

export const isTechnicianCreatorRole = (role: string | null | undefined): boolean =>
  hasRole(role, TECHNICIAN_CREATOR_ROLE_SET);
