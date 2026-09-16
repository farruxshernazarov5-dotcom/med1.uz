const KEY = "med1_pending_role";

export const SELECTABLE_ROLES = [
  "patient",
  "doctor",
  "clinic",
  "diagnostics",
  "vendor",
  "maternity",
  "cosmetology",
  "pharmacy",
  "dental",
  "bloodbank",
] as const;

export type SelectableRole = (typeof SELECTABLE_ROLES)[number];

export const ROLE_REGISTER_PATH: Record<string, string> = {
  patient: "/dashboard/patient",
  doctor: "/doctor-register",
  clinic: "/clinic-register",
  diagnostics: "/diagnostics-register",
  vendor: "/vendor-register",
  maternity: "/maternity-register",
  cosmetology: "/cosmetology-register",
  pharmacy: "/pharmacy-register",
  dental: "/dental-register",
  bloodbank: "/bloodbank-register",
  admin: "/dashboard/admin",
};

export const setPendingRole = (role: string) => {
  try {
    if (!SELECTABLE_ROLES.includes(role as SelectableRole)) return;
    localStorage.setItem(KEY, role);
  } catch {
    /* storage unavailable */
  }
};

export const getPendingRole = (): SelectableRole | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v && SELECTABLE_ROLES.includes(v as SelectableRole) ? (v as SelectableRole) : null;
  } catch {
    return null;
  }
};

export const clearPendingRole = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
};
