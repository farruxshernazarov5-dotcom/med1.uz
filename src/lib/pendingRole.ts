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

const TS_KEY = `${KEY}_at`;
const MAX_AGE_MS = 30 * 60 * 1000; // 30 daqiqa

export const setPendingRole = (role: string) => {
  try {
    if (!SELECTABLE_ROLES.includes(role as SelectableRole)) return;
    localStorage.setItem(KEY, role);
    localStorage.setItem(TS_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
};

export const getPendingRole = (): SelectableRole | null => {
  try {
    const v = localStorage.getItem(KEY);
    if (!v || !SELECTABLE_ROLES.includes(v as SelectableRole)) return null;
    const at = Number(localStorage.getItem(TS_KEY) || 0);
    if (!at || Date.now() - at > MAX_AGE_MS) {
      clearPendingRole();
      return null;
    }
    return v as SelectableRole;
  } catch {
    return null;
  }
};

export const clearPendingRole = () => {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(TS_KEY);
  } catch {
    /* noop */
  }
};
