/**
 * Native medication/appointment reminders and biometric unlock.
 * All plugins are dynamically imported and no-op on the web.
 * Reminders live only in the OS notification scheduler — nothing is cached in web storage.
 */
import { isNativeApp } from "./nativeApp";

export type PendingReminder = { id: number; title: string; body: string; at?: string; kind: "med" | "appt" };

const MED_BASE = 100000;
const APPT_BASE = 500000;

async function ln() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const LN = await ln();
    const cur = await LN.checkPermissions();
    if (cur.display === "granted") return true;
    const req = await LN.requestPermissions();
    return req.display === "granted";
  } catch { return false; }
}

/** Daily repeating medication reminder at HH:MM. */
export async function scheduleMedication(name: string, dose: string, times: string[]): Promise<number> {
  const LN = await ln();
  const base = MED_BASE + Math.floor(Math.random() * 300000);
  const notifications = times.map((t, i) => {
    const [hour, minute] = t.split(":").map(Number);
    return {
      id: base + i,
      title: `💊 Dori vaqti: ${name}`,
      body: dose ? `${dose} — ichishni unutmang` : "Dorini ichishni unutmang",
      schedule: { on: { hour, minute }, allowWhileIdle: true },
      extra: { kind: "med", route: "/dashboard/patient" },
    };
  });
  await LN.schedule({ notifications });
  return notifications.length;
}

/** Replace all appointment reminders: 1 day and 1 hour before each visit. */
export async function syncAppointmentReminders(items: { id: string; when: Date; label: string }[]): Promise<number> {
  const LN = await ln();
  const pending = await LN.getPending();
  const old = pending.notifications.filter((n) => n.id >= APPT_BASE).map((n) => ({ id: n.id }));
  if (old.length) await LN.cancel({ notifications: old });
  const now = Date.now();
  const notifications: Parameters<Awaited<ReturnType<typeof ln>>["schedule"]>[0]["notifications"] = [];
  items.forEach((a, idx) => {
    [
      { offset: 24 * 3600e3, text: "Ertaga" },
      { offset: 3600e3, text: "1 soatdan keyin" },
    ].forEach((o, j) => {
      const at = new Date(a.when.getTime() - o.offset);
      if (at.getTime() <= now) return;
      notifications.push({
        id: APPT_BASE + idx * 2 + j,
        title: "🩺 Shifokor qabuli",
        body: `${o.text}: ${a.label} — ${a.when.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}`,
        schedule: { at, allowWhileIdle: true },
        extra: { kind: "appt", route: "/dashboard/patient" },
      });
    });
  });
  if (notifications.length) await LN.schedule({ notifications });
  return notifications.length;
}

export async function listReminders(): Promise<PendingReminder[]> {
  if (!isNativeApp()) return [];
  try {
    const LN = await ln();
    const { notifications } = await LN.getPending();
    return notifications.map((n) => ({
      id: n.id, title: n.title, body: n.body,
      at: (n.schedule?.at as unknown as string | undefined) ?? undefined,
      kind: n.id >= APPT_BASE ? "appt" : "med",
    }));
  } catch { return []; }
}

export async function cancelReminder(id: number) {
  const LN = await ln();
  await LN.cancel({ notifications: [{ id }] });
}

/** Opens the in-app route attached to a tapped notification. */
export async function registerNotificationTaps(go: (path: string) => void): Promise<() => void> {
  if (!isNativeApp()) return () => {};
  try {
    const LN = await ln();
    const h = await LN.addListener("localNotificationActionPerformed", (e) => {
      const route = e.notification.extra?.route;
      if (typeof route === "string" && route.startsWith("/dashboard")) go(route);
    });
    return () => void h.remove();
  } catch { return () => {}; }
}

// ---------- Biometrics ----------
const BIO_PREF = "med1_biometric_lock_v1"; // only an on/off flag, no medical data
let unlockedThisSession = false;

export const isBiometricLockEnabled = () => isNativeApp() && localStorage.getItem(BIO_PREF) === "1";
export const setBiometricLockEnabled = (on: boolean) => {
  if (on) localStorage.setItem(BIO_PREF, "1"); else localStorage.removeItem(BIO_PREF);
  unlockedThisSession = on;
};
export const isUnlocked = () => unlockedThisSession;
export const lockNow = () => { unlockedThisSession = false; };

export async function biometricAvailable(): Promise<{ ok: boolean; label: string }> {
  if (!isNativeApp()) return { ok: false, label: "" };
  try {
    const { NativeBiometric, BiometryType } = await import("@capgo/capacitor-native-biometric");
    const r = await NativeBiometric.isAvailable();
    const label = r.biometryType === BiometryType.FACE_ID || r.biometryType === BiometryType.FACE_AUTHENTICATION ? "Face ID" : "Barmoq izi";
    return { ok: r.isAvailable, label };
  } catch { return { ok: false, label: "" }; }
}

export async function verifyBiometric(): Promise<boolean> {
  try {
    const { NativeBiometric } = await import("@capgo/capacitor-native-biometric");
    await NativeBiometric.verifyIdentity({
      reason: "Tibbiy kartangizni ochish",
      title: "Med1.uz — xavfsiz kirish",
      subtitle: "Face ID yoki barmoq izi",
      useFallback: true,
    });
    unlockedThisSession = true;
    return true;
  } catch { return false; }
}
