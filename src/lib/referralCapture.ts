// Referral code capture utility — reads ?ref=CODE from URL and persists to localStorage.
// Used by registration flow to attach referrer on signup.

const STORAGE_KEY = "med1.referralCode";
const STORAGE_META_KEY = "med1.referralMeta";
const TTL_DAYS = 30;

export interface ReferralMeta {
  code: string;
  capturedAt: number;
  source?: string;
}

/** Reads ?ref= from current URL (if any) and stores it in localStorage. Returns the code or null. */
export function captureReferralFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("ref") || params.get("referral") || params.get("invite");
    if (!raw) return null;
    const code = raw.trim().toUpperCase().slice(0, 32);
    if (!/^[A-Z0-9_-]{4,32}$/.test(code)) return null;
    const meta: ReferralMeta = {
      code,
      capturedAt: Date.now(),
      source: document.referrer || window.location.pathname,
    };
    localStorage.setItem(STORAGE_KEY, code);
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
    return code;
  } catch {
    return null;
  }
}

/** Returns stored referral code if not expired, else null. */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    if (!code) return null;
    const metaRaw = localStorage.getItem(STORAGE_META_KEY);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw) as ReferralMeta;
      const ageDays = (Date.now() - meta.capturedAt) / (1000 * 60 * 60 * 24);
      if (ageDays > TTL_DAYS) {
        clearReferralCode();
        return null;
      }
    }
    return code;
  } catch {
    return null;
  }
}

export function getStoredReferralMeta(): ReferralMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    return raw ? (JSON.parse(raw) as ReferralMeta) : null;
  } catch {
    return null;
  }
}

export function clearReferralCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_META_KEY);
  } catch {
    // noop
  }
}
