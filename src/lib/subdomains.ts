/**
 * Subdomain routing map for med1.uz
 *
 * clinic.med1.uz  — klinikalar, stomatologiya, diagnostika, dorixona, tug'ruqxona, kosmetologiya
 * doctors.med1.uz — shifokorlar, band qilish
 * ai.med1.uz      — barcha AI xizmatlari
 * admin.med1.uz   — super admin panel
 * med1.uz         — qolgan barcha sahifalar (bosh sahifa, kontent, huquqiy, to'lov...)
 */

export type SubdomainKey = "clinic" | "doctors" | "ai" | "admin" | "www";

export const ROOT_DOMAIN = "med1.uz";
export const PRIMARY_HOST = `www.${ROOT_DOMAIN}`;

/**
 * Only hosts already attached to Lovable may receive cross-domain navigation.
 * Add a service host here after its custom-domain status becomes Active.
 */
const ACTIVE_HOSTS = new Set([ROOT_DOMAIN, PRIMARY_HOST]);

interface SubdomainConfig {
  key: SubdomainKey;
  host: string;
  home: string;
  /** Path prefixlari — shu subdomen "egasi" hisoblangan yo'llar */
  prefixes: string[];
}

export const SUBDOMAINS: SubdomainConfig[] = [
  {
    key: "admin",
    host: `admin.${ROOT_DOMAIN}`,
    home: "/admin",
    prefixes: ["/admin"],
  },
  {
    key: "ai",
    host: `ai.${ROOT_DOMAIN}`,
    home: "/ai-services",
    prefixes: ["/ai-", "/symptom-checker", "/smart-search"],
  },
  {
    key: "doctors",
    host: `doctors.${ROOT_DOMAIN}`,
    home: "/doctors",
    prefixes: ["/doctors", "/doctor-register", "/booking"],
  },
  {
    key: "clinic",
    host: `clinic.${ROOT_DOMAIN}`,
    home: "/clinics",
    prefixes: [
      "/clinics",
      "/dental",
      "/diagnostics",
      "/pharmacies",
      "/maternity",
      "/cosmetology",
      "/blood-banks",
      "/clinic-register",
      "/diagnostics-register",
      "/maternity-register",
      "/cosmetology-register",
      "/pharmacy-register",
    ],
  },
];

const WWW: SubdomainConfig = {
  key: "www",
  host: PRIMARY_HOST,
  home: "/",
  prefixes: [],
};

/** Faqat haqiqiy med1.uz hostlarida subdomen mantiqini yoqamiz (preview/localhost — yo'q) */
export function isProductionHost(host: string = window.location.hostname): boolean {
  return host === ROOT_DOMAIN || host === PRIMARY_HOST || SUBDOMAINS.some((s) => s.host === host);
}

export function currentSubdomain(host: string = window.location.hostname): SubdomainConfig {
  const found = SUBDOMAINS.find((s) => s.host === host);
  return found ?? WWW;
}

/** Ushbu path qaysi subdomenga tegishli */
export function ownerOf(path: string): SubdomainConfig {
  const p = path.toLowerCase();
  for (const s of SUBDOMAINS) {
    if (s.prefixes.some((pre) => p === pre || p.startsWith(pre))) return s;
  }
  return WWW;
}

/** Path uchun to'liq URL (kerak bo'lsa boshqa subdomenga) */
export function urlForPath(path: string, host: string = window.location.hostname): string | null {
  if (!isProductionHost(host)) return null;
  const target = ownerOf(path);
  if (!ACTIVE_HOSTS.has(target.host)) return null;
  if (target.host === host) return null;
  return `https://${target.host}${path}`;
}

export function isActiveSubdomainHost(host: string): boolean {
  return ACTIVE_HOSTS.has(host);
}
