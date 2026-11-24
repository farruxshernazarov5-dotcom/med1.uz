/**
 * Subdomain routing map for med1.uz
 *
 * my.med1.uz      — bemorlar shaxsiy kabineti, profil, qabullar, referral
 * doctors.med1.uz — shifokorlar, qabulga yozilish
 * clinic.med1.uz  — klinikalar, diagnostika, dorixona, tug'ruqxona, kosmetologiya, qon banki
 * dental.med1.uz  — stomatologiya va tish laboratoriyalari
 * ai.med1.uz      — barcha AI xizmatlari
 * help.med1.uz    — yordam markazi, to'lov xavfsizligi, huquqiy hujjatlar
 * verify.med1.uz  — QR hujjat va kvitansiya tekshirish
 * admin.med1.uz   — super admin panel
 * med1.uz         — bosh portal (bosh sahifa, maqolalar, reels, narxlar, Med1 TOP...)
 */

export type SubdomainKey =
  | "my"
  | "doctors"
  | "clinic"
  | "dental"
  | "ai"
  | "help"
  | "verify"
  | "admin"
  | "www";

export const ROOT_DOMAIN = "med1.uz";
export const PRIMARY_HOST = `www.${ROOT_DOMAIN}`;

/**
 * Subdomen marshrutizatsiyasi yoqilgan (barcha 9 ta yo'nalish ulangan).
 */
export const SUBDOMAIN_ROUTING_ENABLED = true;

/**
 * Only hosts already attached to Lovable may receive cross-domain navigation.
 */
export const ACTIVE_HOSTS = new Set([
  ROOT_DOMAIN,
  PRIMARY_HOST,
  `my.${ROOT_DOMAIN}`,
  `admin.${ROOT_DOMAIN}`,
  `ai.${ROOT_DOMAIN}`,
  `doctors.${ROOT_DOMAIN}`,
  `clinic.${ROOT_DOMAIN}`,
  `dental.${ROOT_DOMAIN}`,
  `help.${ROOT_DOMAIN}`,
  `verify.${ROOT_DOMAIN}`,
]);

export interface SubdomainNavLink {
  label: string;
  href: string;
}

export interface SubdomainConfig {
  key: SubdomainKey;
  host: string;
  home: string;
  badge?: string;
  /** Path prefixlari — shu subdomen "egasi" hisoblangan yo'llar */
  prefixes: string[];
  /** Subdomenga mos ixtisoslashgan yuqori menyu */
  navLinks?: SubdomainNavLink[];
}

export const SUBDOMAINS: SubdomainConfig[] = [
  {
    key: "admin",
    host: `admin.${ROOT_DOMAIN}`,
    home: "/admin",
    badge: "Admin",
    prefixes: ["/admin", "/kassa", "/partner"],
    navLinks: [
      { label: "Boshqaruv", href: "/admin" },
      { label: "AI tahlil", href: "/admin/ai-analytics" },
      { label: "Med Coin", href: "/admin/med-coin" },
      { label: "Kassa", href: "/kassa/payme" },
      { label: "Bosh portal", href: "/" },
    ],
  },
  {
    key: "ai",
    host: `ai.${ROOT_DOMAIN}`,
    home: "/ai-services",
    badge: "AI",
    prefixes: ["/ai-", "/symptom-checker", "/smart-search"],
    navLinks: [
      { label: "Barcha AI", href: "/ai-services" },
      { label: "AI Shifokor", href: "/ai-doctor-chat" },
      { label: "Radiologiya", href: "/ai-radiology" },
      { label: "Simptomlar", href: "/symptom-checker" },
      { label: "Obuna", href: "/ai-subscription" },
      { label: "Bosh portal", href: "/" },
    ],
  },
  {
    key: "dental",
    host: `dental.${ROOT_DOMAIN}`,
    home: "/dental",
    badge: "Dental",
    prefixes: ["/dental", "/dental-register"],
    navLinks: [
      { label: "Stomatologiya", href: "/dental" },
      { label: "Klinikani ulash", href: "/dental-register" },
      { label: "Shifokorlar", href: "/doctors" },
      { label: "Yordam", href: "/help" },
      { label: "Bosh portal", href: "/" },
    ],
  },
  {
    key: "doctors",
    host: `doctors.${ROOT_DOMAIN}`,
    home: "/doctors",
    badge: "Doctors",
    prefixes: ["/doctors", "/doctor-register", "/booking"],
    navLinks: [
      { label: "Shifokorlar", href: "/doctors" },
      { label: "Qabulga yozilish", href: "/booking" },
      { label: "Shifokor ro‘yxati", href: "/doctor-register" },
      { label: "AI xizmatlar", href: "/ai-services" },
      { label: "Bosh portal", href: "/" },
    ],
  },
  {
    key: "clinic",
    host: `clinic.${ROOT_DOMAIN}`,
    home: "/clinics",
    badge: "Clinic",
    prefixes: [
      "/clinics",
      "/clinic-register",
      "/diagnostics",
      "/diagnostics-register",
      "/pharmacies",
      "/pharmacy-register",
      "/maternity",
      "/maternity-register",
      "/cosmetology",
      "/cosmetology-register",
      "/blood-banks",
      "/blood-donor-register",
      "/bloodbank-register",
      "/vendor-register",
    ],
    navLinks: [
      { label: "Klinikalar", href: "/clinics" },
      { label: "Diagnostika", href: "/diagnostics" },
      { label: "Dorixonalar", href: "/pharmacies" },
      { label: "Stomatologiya", href: "/dental" },
      { label: "Klinikani ulash", href: "/clinic-register" },
      { label: "Bosh portal", href: "/" },
    ],
  },
  {
    key: "help",
    host: `help.${ROOT_DOMAIN}`,
    home: "/help",
    badge: "Help",
    prefixes: [
      "/help",
      "/user-guide",
      "/payment-safety",
      "/contact",
      "/legal",
      "/legal-center",
      "/terms",
      "/privacy",
      "/disclaimer",
      "/saas-terms",
      "/transparency",
      "/referral-terms",
    ],
    navLinks: [
      { label: "Yordam markazi", href: "/help" },
      { label: "To‘lov xavfsizligi", href: "/payment-safety" },
      { label: "Huquqiy hujjatlar", href: "/legal-center" },
      { label: "Bog‘lanish", href: "/contact" },
      { label: "Bosh portal", href: "/" },
    ],
  },
  {
    key: "verify",
    host: `verify.${ROOT_DOMAIN}`,
    home: "/verify",
    badge: "Verify",
    prefixes: ["/verify", "/report"],
    navLinks: [
      { label: "QR tekshirish", href: "/verify" },
      { label: "To‘lov xavfsizligi", href: "/payment-safety" },
      { label: "Yordam", href: "/help" },
      { label: "Bosh portal", href: "/" },
    ],
  },
  {
    key: "my",
    host: `my.${ROOT_DOMAIN}`,
    home: "/dashboard/patient",
    badge: "My",
    prefixes: [
      "/dashboard/patient",
      "/mobile-profile",
      "/mobile-appointments",
      "/mobile-services",
      "/mobile-tips",
      "/mobile-classifieds",
      "/clinic-link",
      "/referral",
    ],
    navLinks: [
      { label: "Kabinetim", href: "/dashboard/patient" },
      { label: "Qabullarim", href: "/mobile-appointments" },
      { label: "AI xizmatlar", href: "/ai-services" },
      { label: "Shifokorlar", href: "/doctors" },
      { label: "Yordam", href: "/help" },
      { label: "Bosh portal", href: "/" },
    ],
  },
];


const WWW: SubdomainConfig = {
  key: "www",
  host: PRIMARY_HOST,
  home: "/",
  prefixes: [],
};

/**
 * Har bir hostda ochilaveradigan umumiy sahifalar (sessiya har bir domenda alohida
 * saqlanadi — shuning uchun kirish, to'lov, check-in va rolga bog'liq kabinetlar
 * foydalanuvchi turgan domenda qoladi).
 */
export const SHARED_PREFIXES = [
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/payment",
  "/check-in",
  "/link-device",
  "/app-bridge",
  "/click",
];

function matchesPrefix(path: string, prefix: string): boolean {
  if (prefix.endsWith("-")) return path.startsWith(prefix);
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isSharedPath(path: string): boolean {
  const p = path.toLowerCase();
  if (p === "/dashboard" || (p.startsWith("/dashboard/") && !matchesPrefix(p, "/dashboard/patient"))) {
    return true;
  }
  return SHARED_PREFIXES.some((pre) => matchesPrefix(p, pre));
}

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
    if (s.prefixes.some((pre) => matchesPrefix(p, pre))) return s;
  }
  return WWW;
}

/** Path uchun to'liq URL (kerak bo'lsa boshqa subdomenga) */
export function urlForPath(path: string, host: string = window.location.hostname): string | null {
  if (!isProductionHost(host)) return null;
  if (isSharedPath(path)) return null;
  const target = ownerOf(path);
  if (!ACTIVE_HOSTS.has(target.host)) return null;
  if (target.host === host) return null;
  return `https://${target.host}${path}`;
}

/**
 * Joriy sahifani avtomatik boshqa domenga ko'chirish kerakmi.
 * Asosiy www hostidan avtomatik chiqmaymiz: domen sozlamasidagi Primary redirect
 * hali yoqilgan bo'lsa, aks holda www <-> subdomain cheksiz aylanishi yuz beradi.
 */
export function redirectTargetForLocation(
  path: string,
  host: string,
  search = "",
  hash = "",
): string | null {
  const sub = currentSubdomain(host);
  if (sub.key === "www" || isSharedPath(path)) return null;
  const target = ownerOf(path);
  if (target.host === host || !isActiveSubdomainHost(target.host)) return null;
  return `https://${target.host}${path}${search}${hash}`;
}


export function isActiveSubdomainHost(host: string): boolean {
  return ACTIVE_HOSTS.has(host);
}
