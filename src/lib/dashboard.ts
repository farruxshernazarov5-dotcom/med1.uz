export const DASHBOARD_ROUTE_BY_ROLE: Record<string, string> = {
  admin: "/dashboard/admin",
  bloodbank: "/dashboard/bloodbank",
  clinic: "/dashboard/clinic",
  cosmetology: "/dashboard/cosmetology",
  dental: "/dashboard/dental",
  diagnostics: "/dashboard/diagnostics",
  doctor: "/dashboard/doctor",
  maternity: "/dashboard/maternity",
  patient: "/dashboard/patient",
  pharmacy: "/dashboard/pharmacy",
  vendor: "/dashboard/vendor",
};

const PATIENT_ROLE_ALIASES = new Set(["patient", "user", "hambi", "member", "customer"]);

export const normalizeDashboardRole = (role?: string | null) => {
  if (!role) return "patient";
  const normalized = role.toLowerCase();
  if (PATIENT_ROLE_ALIASES.has(normalized)) return "patient";
  return DASHBOARD_ROUTE_BY_ROLE[normalized] ? normalized : "patient";
};

export const getDashboardPath = (role?: string | null) => {
  return DASHBOARD_ROUTE_BY_ROLE[normalizeDashboardRole(role)] || DASHBOARD_ROUTE_BY_ROLE.patient;
};