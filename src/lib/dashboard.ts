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

export const getDashboardPath = (role?: string | null) => {
  if (!role) return DASHBOARD_ROUTE_BY_ROLE.patient;
  return DASHBOARD_ROUTE_BY_ROLE[role] || DASHBOARD_ROUTE_BY_ROLE.patient;
};