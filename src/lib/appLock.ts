/**
 * Device app lock: PIN code or pattern, optional fingerprint / Face ID, and an
 * auto-lock delay. Only settings flags live in web storage; the secret itself
 * is a salted PBKDF2 hash, kept in the phone keystore inside the native app.
 */
import { isNativeApp } from "./nativeApp";

export type LockMethod = "none" | "pin" | "pattern";
export type LockSettings = { method: LockMethod; biometric: boolean; timeoutMin: number };

const SETTINGS_KEY = "med1_app_lock_v1";
const WEB_SECRET_KEY = "med1_app_lock_secret_v1";
const FAIL_KEY = "med1_app_lock_fail_v1";
const HIDDEN_AT_KEY = "med1_app_lock_hidden_at_v1";
const KEYSTORE_SERVER = "uz.medall.app.lock";
export const MAX_FAILS = 5;
export const BLOCK_MS = 10 * 60 * 1000;
export const TIMEOUT_OPTIONS = [0, 1, 5, 15, 30, 60];

const DEFAULTS: LockSettings = { method: "none", biometric: false, timeoutMin: 1 };

export function getLockSettings(): LockSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<LockSettings>) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

export function saveLockSettings(next: LockSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("med1-lock-settings"));
}

export const isLockEnabled = () => getLockSettings().method !== "none";

async function hash(secret: string, saltHex: string): Promise<string> {
  const salt = Uint8Array.from(saltHex.match(/../g)!.map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150_000, hash: "SHA-256" }, key, 256);
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function bio() {
  return { p: (await import("@capgo/capacitor-native-biometric")).NativeBiometric };
}

async function storeSecret(value: string): Promise<void> {
  if (isNativeApp()) {
    try { await (await bio()).p.setCredentials({ username: "lock", password: value, server: KEYSTORE_SERVER }); return; } catch { /* fall back */ }
  }
  localStorage.setItem(WEB_SECRET_KEY, value);
}

async function readSecret(): Promise<string | null> {
  if (isNativeApp()) {
    try { const c = await (await bio()).p.getCredentials({ server: KEYSTORE_SERVER }); if (c.password) return c.password; } catch { /* fall back */ }
  }
  return localStorage.getItem(WEB_SECRET_KEY);
}

/** Sets a new PIN or pattern (already encoded as a string). */
export async function setLockSecret(method: Exclude<LockMethod, "none">, secret: string): Promise<void> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  await storeSecret(`${method}:${salt}:${await hash(secret, salt)}`);
  saveLockSettings({ ...getLockSettings(), method });
  clearFails();
}

export async function disableLock(): Promise<void> {
  saveLockSettings({ ...getLockSettings(), method: "none", biometric: false });
  localStorage.removeItem(WEB_SECRET_KEY);
  if (isNativeApp()) { try { await (await bio()).p.deleteCredentials({ server: KEYSTORE_SERVER }); } catch { /* none */ } }
  clearFails();
}

type Fails = { count: number; until: number };
function getFails(): Fails {
  try { return JSON.parse(localStorage.getItem(FAIL_KEY) ?? "") as Fails; } catch { return { count: 0, until: 0 }; }
}
function clearFails() { localStorage.removeItem(FAIL_KEY); }
export const blockedUntil = () => { const f = getFails(); return f.until > Date.now() ? f.until : 0; };

/** Checks a PIN/pattern; after 5 wrong attempts the lock is blocked for 10 minutes. */
export async function verifyLockSecret(secret: string): Promise<"ok" | "wrong" | "blocked"> {
  if (blockedUntil()) return "blocked";
  const stored = await readSecret();
  if (!stored) return "ok";
  const [, salt, expected] = stored.split(":");
  if ((await hash(secret, salt)) === expected) { clearFails(); return "ok"; }
  const f = getFails();
  const count = f.count + 1;
  localStorage.setItem(FAIL_KEY, JSON.stringify(count >= MAX_FAILS ? { count: 0, until: Date.now() + BLOCK_MS } : { count, until: 0 }));
  return count >= MAX_FAILS ? "blocked" : "wrong";
}

export const remainingAttempts = () => MAX_FAILS - getFails().count;

export async function unlockWithBiometric(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await (await bio()).p.verifyIdentity({ reason: "Med ALL ilovasini ochish", title: "Med ALL", subtitle: "Barmoq izi yoki Face ID", useFallback: false });
    clearFails();
    return true;
  } catch { return false; }
}

/** Remembers when the app went to background so the auto-lock delay can be applied. */
export const markHidden = () => sessionStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
export function shouldLockOnResume(): boolean {
  const s = getLockSettings();
  if (s.method === "none") return false;
  const at = Number(sessionStorage.getItem(HIDDEN_AT_KEY) ?? 0);
  if (!at) return false;
  return Date.now() - at >= s.timeoutMin * 60_000;
}
