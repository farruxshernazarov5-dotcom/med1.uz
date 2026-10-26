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

export const voiceNotifyOn = (): boolean => {
  try { return localStorage.getItem(PREF) === "1"; } catch { return false; }
};
export const setVoiceNotify = (on: boolean) => {
  try { on ? localStorage.setItem(PREF, "1") : localStorage.removeItem(PREF); } catch { /* ignore */ }
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

/**
 * Speaks "MED ALL. <title>. <message>" for a fresh notification.
 * No-ops when the preference is off or the item was already spoken.
 */
export async function speakNotification(id: string, title: string, message?: string | null): Promise<void> {
  if (!voiceNotifyOn() || spoken.has(id)) return;
  spoken.add(id);
  if (spoken.size > 50) spoken.delete(spoken.values().next().value as string);
  const text = `${SPEAK_PREFIX} ${clean(title)}.${message ? ` ${clean(message)}` : ""}`;
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
