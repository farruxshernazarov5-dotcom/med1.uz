import { useCallback, useRef, useState, useEffect } from "react";
import { isNativeApp } from "@/lib/nativeApp";

const NATIVE_LANG: Record<VoiceLang, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };
async function tts() { return { p: (await import("@capacitor-community/text-to-speech")).TextToSpeech }; }
/** Android WebView has no speechSynthesis — speak through the OS TTS engine. Uzbek falls back to Russian, then English. */
async function nativeSay(texts: Partial<Record<VoiceLang, string>>, order: VoiceLang[], onState: (b: boolean) => void) {
  const t = (await tts()).p;
  try { await t.stop(); } catch { /* idle */ }
  let supported: string[] = [];
  try { supported = (await t.getSupportedLanguages()).languages.map((l) => l.toLowerCase()); } catch { /* unknown */ }
  for (const l of order) {
    const text = texts[l];
    if (!text) continue;
    const code = NATIVE_LANG[l];
    if (supported.length && !supported.some((s) => s.startsWith(l))) continue;
    try { onState(true); await t.speak({ text, lang: code, rate: 0.95, pitch: 1, volume: 1, category: "playback" }); onState(false); return; }
    catch { onState(false); }
  }
  // No matching language engine installed — still speak with the phone's default voice.
  const l = order.find((x) => texts[x]) ;
  if (!l) return;
  try { onState(true); await t.speak({ text: texts[l]!, rate: 0.95, pitch: 1, volume: 1, category: "playback" }); } catch { /* no engine */ } finally { onState(false); }
}
const nativeStop = async () => { try { await (await tts()).p.stop(); } catch { /* idle */ } };

export type VoiceLang = "uz" | "ru" | "en";

const MESSAGES: Record<string, Record<VoiceLang, string>> = {
  start: {
    uz: "Tekshiruv boshlanmoqda. Iltimos barmog'ingizni kameraga qo'ying.",
    ru: "Измерение начинается. Пожалуйста, приложите палец к камере.",
    en: "Measurement is starting. Please place your finger on the camera.",
  },
  press_light: {
    uz: "Qattiq bosmang. Barmog'ingizni yengil tegizib turing.",
    ru: "Не давите сильно. Слегка прижмите палец.",
    en: "Do not press too hard. Rest your finger lightly.",
  },
  face_place: {
    uz: "Yuzingizni ramka ichiga joylang, yorug' joyda qimirlamay turing.",
    ru: "Расположите лицо в рамке, в хорошо освещённом месте, не двигайтесь.",
    en: "Place your face in the frame in good light and stay still.",
  },
  face_start: {
    uz: "Yuz skaneri boshlandi. Telefonni yuz ro'parasida ushlang va qimirlamang.",
    ru: "Сканирование лица началось. Держите телефон напротив лица и не двигайтесь.",
    en: "Face scan started. Hold the phone in front of your face and stay still.",
  },
  face_closer: { uz: "Kameraga yaqinroq keling.", ru: "Подойдите ближе к камере.", en: "Move closer to the camera." },
  face_farther: { uz: "Kameradan biroz uzoqlashing.", ru: "Отодвиньтесь немного от камеры.", en: "Move a little farther from the camera." },
  face_center: { uz: "Yuzingizni ramka markaziga keltiring.", ru: "Поместите лицо в центр рамки.", en: "Center your face in the frame." },
  face_light: { uz: "Yorug'lik yetarli emas. Yorug' xonaga o'ting.", ru: "Недостаточно света. Перейдите в светлую комнату.", en: "Not enough light. Please move to a brighter room." },
  face_bright: { uz: "Juda yorug'. To'g'ridan tushayotgan nurdan qoching.", ru: "Слишком ярко. Избегайте прямого света.", en: "Too bright. Avoid direct light." },
  face_glasses: { uz: "Signal kuchsiz. Ko'zoynak bo'lsa, uni yeching.", ru: "Слабый сигнал. Если вы в очках, снимите их.", en: "Weak signal. If you wear glasses, please take them off." },
  face_move: { uz: "Harakat aniqlandi. Boshingizni qimirlatmang.", ru: "Обнаружено движение. Не двигайте головой.", en: "Movement detected. Keep your head still." },
  face_measuring: { uz: "Yuz skanerlanmoqda. Qimirlamang.", ru: "Идёт сканирование лица. Не двигайтесь.", en: "Scanning your face. Stay still." },
  lens_switch: { uz: "Fonar yonidagi kamerani tanlang va barmoqni ikkalasiga birga qo'ying.", ru: "Выберите камеру рядом со вспышкой и закройте пальцем обе.", en: "Choose the camera next to the flash and cover both with your finger." },
  measuring: {
    uz: "Signal tekshirilmoqda. Iltimos harakatlanmang.",
    ru: "Сигнал проверяется. Пожалуйста, не двигайтесь.",
    en: "Checking signal. Please stay still.",
  },
  saved: {
    uz: "Ko'rsatkich muvaffaqiyatli saqlandi.",
    ru: "Показатель успешно сохранён.",
    en: "Measurement saved successfully.",
  },
  result_normal: {
    uz: "Sizning natijalaringiz normal darajada. Batafsil ma'lumotni ekranda ko'rishingiz mumkin.",
    ru: "Ваши показатели в норме. Подробности можно увидеть на экране.",
    en: "Your results are within normal range. You can see the details on screen.",
  },
  result_warning: {
    uz: "Diqqat! Sizning ko'rsatkichlaringiz me'yordan tashqarida. Shifokorga murojaat qilishingizni tavsiya qilamiz.",
    ru: "Внимание! Ваши показатели выходят за пределы нормы. Рекомендуем обратиться к врачу.",
    en: "Attention! Your readings are outside normal range. We recommend consulting a doctor.",
  },
  finger_place: {
    uz: "Barmog'ingizni orqa kameraga qo'ying va mahkam bosing.",
    ru: "Приложите палец к задней камере и плотно прижмите.",
    en: "Place your finger on the rear camera and press firmly.",
  },
  finger_detected: {
    uz: "Barmoq aniqlandi. O'lchov boshlanmoqda.",
    ru: "Палец обнаружен. Измерение начинается.",
    en: "Finger detected. Starting measurement.",
  },
  signal_weak: {
    uz: "Signal past. Barmog'ingizni kuchroq bosing.",
    ru: "Слабый сигнал. Нажмите палец сильнее.",
    en: "Weak signal. Press your finger harder.",
  },
  camera_error: {
    uz: "Kamera ruxsati berilmadi. Iltimos kamerani yoqing.",
    ru: "Нет доступа к камере. Пожалуйста, разрешите доступ.",
    en: "Camera access denied. Please enable camera access.",
  },
  bp_estimated: {
    uz: "Qon bosimingiz taxminiy aniqlandi.",
    ru: "Ваше артериальное давление приблизительно определено.",
    en: "Your blood pressure has been estimated.",
  },
  bmi_result: {
    uz: "Tana massa indeksingiz hisoblandi.",
    ru: "Ваш индекс массы тела рассчитан.",
    en: "Your body mass index has been calculated.",
  },
  health_score: {
    uz: "Umumiy sog'liq bahoingiz tayyor.",
    ru: "Ваша общая оценка здоровья готова.",
    en: "Your overall health score is ready.",
  },
};

/* Premium voice selection priorities */
const VOICE_PRIORITIES: Record<VoiceLang, RegExp[]> = {
  uz: [
    /female|woman|zira|yelda|dilnoza|malika/i,
    /milena|svetlana|irina|tatiana|katya/i,
  ],
  ru: [
    /milena|svetlana|irina|tatiana|katya|yandex|alice/i,
    /female|woman/i,
  ],
  en: [
    /samantha|victoria|karen|moira|tessa|fiona/i,
    /google.*female|microsoft.*zira|female|woman/i,
  ],
};

/* Fallback language chain: if UZ voice not found, use RU text+voice, then EN */
const FALLBACK_CHAIN: Record<VoiceLang, VoiceLang[]> = {
  uz: ["ru", "en"],
  ru: ["en"],
  en: [],
};

const useVoiceGuidance = () => {
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [lang, setLang] = useState<VoiceLang>("uz");
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const cachedVoices = useRef<Record<string, SpeechSynthesisVoice | null>>({});
  const activeLangRef = useRef<VoiceLang>("uz"); // actual language being spoken

  const langMap: Record<VoiceLang, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

  // Pre-load voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        (["uz", "ru", "en"] as VoiceLang[]).forEach(l => {
          cachedVoices.current[l] = findVoiceForLang(voices, l);
        });
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const findVoiceForLang = (voices: SpeechSynthesisVoice[], targetLang: VoiceLang): SpeechSynthesisVoice | null => {
    const targetCode = langMap[targetLang].split("-")[0];
    const langVoices = voices.filter(v => v.lang.startsWith(targetCode));

    for (const pattern of VOICE_PRIORITIES[targetLang]) {
      const match = langVoices.find(v => pattern.test(v.name));
      if (match) return match;
    }
    const femaleVoice = langVoices.find(v => /female|woman/i.test(v.name));
    if (femaleVoice) return femaleVoice;
    if (langVoices[0]) return langVoices[0];
    return null;
  };

  /** Resolve which language to actually speak: find a lang that has a voice available */
  const resolveVoiceLang = useCallback((): { voice: SpeechSynthesisVoice | null; effectiveLang: VoiceLang } => {
    // First try the selected language
    const directVoice = cachedVoices.current[lang] || findVoiceForLang(window.speechSynthesis.getVoices(), lang);
    if (directVoice) {
      const voiceLangCode = directVoice.lang.split("-")[0];
      const selectedCode = langMap[lang].split("-")[0];
      if (voiceLangCode === selectedCode) {
        return { voice: directVoice, effectiveLang: lang };
      }
    }

    // Fallback: find a language that has both voice AND message translation
    for (const fallbackLang of FALLBACK_CHAIN[lang]) {
      const fbVoice = cachedVoices.current[fallbackLang] || findVoiceForLang(window.speechSynthesis.getVoices(), fallbackLang);
      if (fbVoice) {
        return { voice: fbVoice, effectiveLang: fallbackLang };
      }
    }

    // Last resort: use whatever voice is available
    if (directVoice) return { voice: directVoice, effectiveLang: lang };
    return { voice: null, effectiveLang: lang };
  }, [lang]);

  const speak = useCallback((text: string, forceLang?: VoiceLang) => {
    if (!enabled) return;
    if (isNativeApp()) { const l = forceLang || lang; void nativeSay({ [l]: text }, [l], setSpeaking); return; }
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    const targetLang = forceLang || lang;
    utter.lang = langMap[targetLang];
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.volume = 1;

    const voice = cachedVoices.current[targetLang] || findVoiceForLang(window.speechSynthesis.getVoices(), targetLang);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [enabled, lang]);

  /** KEY FIX: speakKey now uses the text matching the ACTUAL voice language, not the selected UI language */
  const speakKey = useCallback((key: string) => {
    if (!enabled) return;
    if (isNativeApp()) { if (MESSAGES[key]) void nativeSay(MESSAGES[key], [lang, ...FALLBACK_CHAIN[lang]], setSpeaking); return; }
    if (!("speechSynthesis" in window)) return;
    const { voice, effectiveLang } = resolveVoiceLang();
    
    // Use the message text that matches the voice's actual language
    const msg = MESSAGES[key]?.[effectiveLang];
    if (!msg) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(msg);
    utter.lang = voice ? voice.lang : langMap[effectiveLang];
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.volume = 1;
    if (voice) utter.voice = voice;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [enabled, lang, resolveVoiceLang]);

  const stop = useCallback(() => {
    if (isNativeApp()) void nativeStop(); else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(p => {
      if (p) { if (isNativeApp()) void nativeStop(); else if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }
      return !p;
    });
  }, []);

  return { speak, speakKey, stop, speaking, enabled, toggle, lang, setLang, voicesLoaded };
};

export default useVoiceGuidance;
