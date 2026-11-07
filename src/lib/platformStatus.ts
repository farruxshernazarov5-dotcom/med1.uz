export interface PlatformStatus {
  maintenance: { active: boolean; title: string; message: string; until?: string; paths?: string[] };
  release: { version: string; title: string; message: string; highlights: string[] } | null;
}
export function parsePlatformStatus(value: unknown): PlatformStatus | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, any>;
  if (typeof data.maintenance?.active !== "boolean") return null;
  return {
    maintenance: { active: data.maintenance.active, title: String(data.maintenance.title || "Texnik ishlar olib borilmoqda"), message: String(data.maintenance.message || "Tez orada qaytamiz."), until: typeof data.maintenance.until === "string" ? data.maintenance.until : undefined, paths: Array.isArray(data.maintenance.paths) ? data.maintenance.paths.filter((p: unknown) => typeof p === "string" && p.startsWith("/")) : undefined },
    release: data.release && typeof data.release.version === "string" && data.release.version.trim() ? { version: data.release.version, title: String(data.release.title || "MED ALL yangilandi"), message: String(data.release.message || ""), highlights: Array.isArray(data.release.highlights) ? data.release.highlights.filter((s: unknown) => typeof s === "string").slice(0, 5) : [] } : null,
  };
}
export function maintenanceApplies(status: PlatformStatus, path: string) {
  if (!status.maintenance.active || /^\/(admin|auth|forgot-password|reset-password)(\/|$)/.test(path)) return false;
  const paths = status.maintenance.paths;
  return !paths?.length || paths.some(p => path === p || path.startsWith(`${p}/`));
}
export function shouldShowRelease(version: string | undefined, seen: string | null) { return Boolean(version && version !== seen); }