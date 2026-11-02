/**
 * "MED ALL" voice notifications: reads new feed notifications aloud.
 * On the phone app it uses the native text-to-speech engine; on the website
 * it falls back to the browser speech synthesizer. Only the on/off preference
 * is stored locally — notification content is never persisted here.
 */
import { isNativeApp } from "./nativeApp";

const PREF = "med1.voiceNotify";
const SPEAK_PREFIX = "MED ALL.";
const MAX_LEN = 220;

export type VoiceNotifyScope = "general" | "click";
const preferenceKey = (scope: VoiceNotifyScope) => scope === "click" ? "med1.clickVoiceNotify" : PREF;
export const voiceNotifyOn = (scope: VoiceNotifyScope = "general"): boolean => {
  try {
    const v = localStorage.getItem(preferenceKey(scope));
    // Patient alerts are on by default (can be switched off); Click admin alerts are opt-in.
    return scope === "general" ? v !== "0" : v === "1";
  } catch { return false; }
};
export const setVoiceNotify = (on: boolean, scope: VoiceNotifyScope = "general") => {
  try {
    if (on) localStorage.setItem(preferenceKey(scope), "1");
    else if (scope === "general") localStorage.setItem(preferenceKey(scope), "0");
    else localStorage.removeItem(preferenceKey(scope));
  } catch { /* ignore */ }
};

// Notifications already spoken this session (realtime can deliver duplicates).
const spoken = new Set<string>();

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_LEN);
}

async function speakNative(text: string): Promise<boolean> {
  try {
    const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
    await TextToSpeech.speak({ text, lang: "uz-UZ", rate: 1.0, pitch: 1.0, category: "ambient" });
    return true;
  } catch { return false; }
}

function speakWeb(text: string): boolean {
  try {
    if (!("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "uz-UZ";
    u.rate = 1;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("uz"))
      ?? window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ru"));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}

export type VoiceKind = "appointment" | "ai" | "wallet" | "coin" | "message";

/** Classifies a notification so voice and the appointment chime never get mixed up. */
export function voiceKind(title: string, message?: string | null, type?: string | null): VoiceKind {
  const t = `${type ?? ""} ${title} ${message ?? ""}`.toLowerCase();
  if (/appointment|qabul|visit|eslatma/.test(t)) return "appointment";
  if (/coin|med coin|obuna muddati|expir/.test(t)) return "coin";
  if (/ai|xulosa|tahlil.*tayyor|lab_ready/.test(t)) return "ai";
  if (/wallet|balans|hisob.*to.?ldir|to.?lov|payment|top.?up|cash/.test(t)) return "wallet";
  return "message";
}

/** Short spoken phrase per kind — never reads private medical text aloud. */
export function voicePhrase(kind: VoiceKind): string {
  switch (kind) {
    case "ai": return "MED ALL. AI xulosangiz tayyor.";
    case "wallet": return "MED ALL. Hisobingiz to'ldirildi.";
    case "coin": return "MED ALL. Med Coin muddati tugamoqda, ulardan foydalanib qoling.";
    case "appointment": return "MED ALL. Qabul eslatmasi.";
    default: return "MED ALL. Sizda yangi xabar bor.";
  }
}

/**
 * Speaks "MED ALL. <title>. <message>" for a fresh notification.
 * No-ops when the preference is off or the item was already spoken.
 */
export async function speakNotification(id: string, title: string, message?: string | null, scope: VoiceNotifyScope = "general"): Promise<void> {
  const key = `${scope}:${id}`;
  if (!voiceNotifyOn(scope) || spoken.has(key)) return;
  spoken.add(key);
  if (spoken.size > 50) spoken.delete(spoken.values().next().value as string);
  const text = scope === "general" ? voicePhrase(voiceKind(title, message)) : `${SPEAK_PREFIX} ${clean(title)}.${message ? ` ${clean(message)}` : ""}`;
  if (isNativeApp()) {
    if (await speakNative(text)) return;
  }
  speakWeb(text);
}

/** Test voice from the settings toggle. */
export async function testVoiceNotify(): Promise<boolean> {
  const text = `${SPEAK_PREFIX} Ovozli bildirishnomalar yoqildi. Yangi xabarlar endi ovoz chiqarib o'qiladi.`;
  if (isNativeApp() && (await speakNative(text))) return true;
  return speakWeb(text);
}
