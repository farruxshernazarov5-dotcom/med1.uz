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
    const granted = cur.display === "granted" || (await LN.requestPermissions()).display === "granted";
    if (granted) { await ensureReminderChannel(); await ensureExactAlarms(); }
    return granted;
  } catch { return false; }
}

/** Android 8+: a high-importance channel with sound + vibration (otherwise reminders arrive silently or not at all). */
export const REMINDER_CHANNEL = "med1_reminders";
let channelReady = false;
export async function ensureReminderChannel(): Promise<void> {
  if (channelReady || !isNativeApp()) return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() !== "android") { channelReady = true; return; }
    const LN = await ln();
    await LN.createChannel({
      id: REMINDER_CHANNEL,
      name: "Med ALL eslatmalari",
      description: "Dori, qabul va tahlil eslatmalari (ovoz va tebranish bilan)",
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: "#2F80ED",
    });
    channelReady = true;
  } catch { /* older plugin/OS — default channel is used */ }
}

/** Android 12+: "Signal va eslatmalar" ruxsati — without it the OS delays or drops timed reminders. */
export async function ensureExactAlarms(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() !== "android") return true;
    const LN = await ln();
    const cur = await LN.checkExactNotificationSetting();
    if (cur.exact_alarm === "granted") return true;
    const next = await LN.changeExactNotificationSetting();
    return next.exact_alarm === "granted";
  } catch { return true; }
}

/** Fires a reminder 10 seconds from now so the user can confirm sound and delivery. */
export async function scheduleTestReminder(): Promise<void> {
  const LN = await ln();
  await ensureReminderChannel();
  await LN.schedule({ notifications: [{
    id: LAB_BASE + 99999, title: "🔔 Med ALL sinov eslatmasi", body: "Eslatmalar ovoz bilan ishlayapti.",
    channelId: REMINDER_CHANNEL, schedule: { at: new Date(Date.now() + 10_000), allowWhileIdle: true },
    extra: { kind: "test", route: "/mobile-appointments?panel=reminders" },
  }] });
}

/** Short melody played when a reminder arrives while the app is open (the OS stays silent in foreground). */
export function playReminderChime(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.22;
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.21);
    });
    window.setTimeout(() => void ctx.close(), 1600);
    if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
  } catch { /* audio unavailable */ }
}

export async function registerForegroundReminderSound(): Promise<() => void> {
  if (!isNativeApp()) return () => {};
  try {
    const LN = await ln();
    await ensureReminderChannel();
    const h = await LN.addListener("localNotificationReceived", () => playReminderChime());
    return () => void h.remove();
  } catch { return () => {}; }
}

/** Opens the phone's app settings screen so the user can re-enable a denied permission. */
export async function openAppSettings(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { NativeSettings, AndroidSettings, IOSSettings } = await import("capacitor-native-settings");
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() === "ios") {
      await NativeSettings.openIOS({ option: IOSSettings.App });
    } else {
      await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
    }
  } catch { /* settings screen unavailable — user can open it manually */ }
}

/** Daily repeating medication reminder at HH:MM. */
export async function scheduleMedication(name: string, dose: string, times: string[]): Promise<number> {
  const LN = await ln();
  await ensureReminderChannel();
  const base = MED_BASE + Math.floor(Math.random() * 300000);
  const notifications = times.map((t, i) => {
    const [hour, minute] = t.split(":").map(Number);
    return {
      id: base + i,
      title: `💊 Dori vaqti: ${name}`,
      body: dose ? `${dose} — ichishni unutmang` : "Dorini ichishni unutmang",
      channelId: REMINDER_CHANNEL,
      schedule: { on: { hour, minute }, allowWhileIdle: true },
      extra: { kind: "med", route: "/mobile-appointments?panel=reminders" },
    };
  });
  await LN.schedule({ notifications });
  return notifications.length;
}

/** Replace all appointment reminders: 1 day and 1 hour before each visit. */
export async function syncAppointmentReminders(items: { id: string; when: Date; label: string }[]): Promise<number> {
  const LN = await ln();
  const pending = await LN.getPending();
  const old = pending.notifications.filter((n) => n.id >= APPT_BASE && n.id < LAB_BASE).map((n) => ({ id: n.id }));
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
        channelId: REMINDER_CHANNEL,
        schedule: { at, allowWhileIdle: true },
        extra: { kind: "appt", route: "/mobile-appointments?panel=upcoming" },
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

/** Checks (never prompts) whether notifications are already allowed. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try { return (await (await ln()).checkPermissions()).display === "granted"; } catch { return false; }
}

const LAB_BASE = 900000;
/** Fires an immediate local notification (e.g. lab result is ready). */
export async function notifyNow(title: string, body: string, route: string): Promise<void> {
  const LN = await ln();
  await LN.schedule({ notifications: [{
    id: LAB_BASE + Math.floor(Math.random() * 90000), title, body, channelId: REMINDER_CHANNEL,
    schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
    extra: { kind: "lab", route },
  }] });
}

// Only an on/off flag and a "last checked" timestamp — no medical data.
const LAB_ALERT_PREF = "med1_lab_alerts_v1";
const LAB_SEEN = "med1_lab_alert_seen_v1";
export const isLabAlertsEnabled = () => localStorage.getItem(LAB_ALERT_PREF) !== "0";
export const setLabAlertsEnabled = (on: boolean) => localStorage.setItem(LAB_ALERT_PREF, on ? "1" : "0");
export const getLabSeenAt = () => localStorage.getItem(LAB_SEEN) ?? new Date(Date.now() - 3 * 864e5).toISOString();
export const setLabSeenAt = (iso: string) => localStorage.setItem(LAB_SEEN, iso);

/** Opens the in-app route attached to a tapped notification. */
export async function registerNotificationTaps(go: (path: string) => void): Promise<() => void> {
  if (!isNativeApp()) return () => {};
  try {
    const LN = await ln();
    const h = await LN.addListener("localNotificationActionPerformed", (e) => {
      const route = e.notification.extra?.route;
      if (typeof route === "string" && /^\/(dashboard|mobile-appointments)(?:[/?]|$)/.test(route)) go(route);
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
