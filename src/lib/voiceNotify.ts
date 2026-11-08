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

const CYR: [RegExp,string][] = [[/o['‘’ʻ`]/gi,'ў'],[/g['‘’ʻ`]/gi,'ғ'],[/sh/gi,'ш'],[/ch/gi,'ч'],[/ng/gi,'нг'],[/yo/gi,'ё'],[/yu/gi,'ю'],[/ya/gi,'я'],[/['‘’ʻ`]/g,'ъ']];
const MAP: Record<string,string> = {a:'а',b:'б',d:'д',e:'е',f:'ф',g:'г',h:'ҳ',i:'и',j:'ж',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',q:'қ',r:'р',s:'с',t:'т',u:'у',v:'в',x:'х',y:'й',z:'з',c:'с',w:'в'};
/** Uzbek Latin → Cyrillic so Russian voices pronounce Uzbek words correctly (no Uzbek voice on most phones). */
export function uzForRussianVoice(text: string): string {
  let t = text.replace(/MED ALL/g, 'Мед Олл').replace(/Med Coin/gi, 'Мед Коин').replace(/\bAI\b/g, 'Эй-Ай');
  for (const [r, c] of CYR) t = t.replace(r, c);
  return t.replace(/[a-z]/gi, ch => { const c = MAP[ch.toLowerCase()] ?? ch; return ch === ch.toUpperCase() ? c.toUpperCase() : c; })
    .replace(/ў/g,'у').replace(/Ў/g,'У').replace(/ҳ/g,'х').replace(/қ/g,'к').replace(/ғ/g,'г').replace(/Қ/g,'К').replace(/Ғ/g,'Г').replace(/Ҳ/g,'Х');
}
const MED_UZ = (t: string) => t.replace(/MED ALL/g, 'Med Oll');

async function speakNative(text: string): Promise<boolean> {
  try {
    const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
    const { languages } = await TextToSpeech.getSupportedLanguages();
    const lang = languages.find(l => /^uz/i.test(l)) ?? languages.find(l => /^ru/i.test(l)) ?? languages.find(l => /^en/i.test(l));
    if (!lang) return false;
    const spokenText = /^uz/i.test(lang) ? MED_UZ(text) : /^ru/i.test(lang) ? uzForRussianVoice(text) : MED_UZ(text);
    await TextToSpeech.speak({ text: spokenText, lang, rate: 1.0, pitch: 1.0, category: "playback" });
    return true;
  } catch { return false; }
}

function speakWeb(text: string, onFailure?: () => void): boolean {
  try {
    if (!("speechSynthesis" in window)) return false;
    const voices = window.speechSynthesis.getVoices();
    const uz = voices.find((v) => v.lang.toLowerCase().startsWith("uz"));
    const ru = uz ? undefined : voices.find((v) => v.lang.toLowerCase().startsWith("ru"));
    const u = new SpeechSynthesisUtterance(ru ? uzForRussianVoice(text) : MED_UZ(text));
    u.onerror = () => { onFailure?.(); window.dispatchEvent(new Event('medall:voice-blocked')); };
    u.lang = ru ? "ru-RU" : "uz-UZ";
    u.rate = 0.92;
    const voice = uz ?? ru;
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}

export type VoiceKind = "appointment" | "ai" | "wallet" | "transfer" | "coin" | "message";

/** Classifies a notification so voice and the appointment chime never get mixed up. */
export function voiceKind(title: string, message?: string | null, type?: string | null): VoiceKind {
  const t = `${type ?? ""} ${title} ${message ?? ""}`.toLowerCase();
  if (/transfer|o[‘’'`ʻ]?tkazma|pul.*yubor/.test(t)) return "transfer";
  if (/appointment|qabul|visit|eslatma/.test(t)) return "appointment";
  if (/coin|med coin|obuna muddati|expir/.test(t)) return "coin";
  if (/\bai\b|xulosa|tahlil.*tayyor|lab_ready/.test(t)) return "ai";
  if (/wallet|balans|hisob.*to.?ldir|to.?lov|payment|top.?up|cash/.test(t)) return "wallet";
  return "message";
}

/** Short spoken phrase per kind — never reads private medical text aloud. */
export function voicePhrase(kind: VoiceKind): string {
  switch (kind) {
    case "transfer": return "MED ALL. Sizda yangi o'tkazma bor.";
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
  if (scope === 'general' && voiceKind(title, message) === 'appointment') return;
  spoken.add(key);
  if (spoken.size > 50) spoken.delete(spoken.values().next().value as string);
  const text = scope === "general" ? voicePhrase(voiceKind(title, message)) : `${SPEAK_PREFIX} ${clean(title)}.${message ? ` ${clean(message)}` : ""}`;
  if (isNativeApp()) {
    if (await speakNative(text)) return;
  }
  if (!speakWeb(text, () => spoken.delete(key))) spoken.delete(key);
}

/** Test voice from the settings toggle. */
export async function testVoiceNotify(): Promise<boolean> {
  const text = `${SPEAK_PREFIX} Ovozli bildirishnomalar yoqildi. Yangi xabarlar endi ovoz chiqarib o'qiladi.`;
  if (isNativeApp() && (await speakNative(text))) return true;
  return speakWeb(text);
}
