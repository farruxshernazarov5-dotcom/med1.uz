import { useCallback, useRef, useState, useEffect } from "react";

export type VoiceLang = "uz" | "ru" | "en";

const MESSAGES: Record<string, Record<VoiceLang, string>> = {
  start: {
    uz: "Tekshiruv boshlanmoqda. Iltimos barmog'ingizni kameraga qo'ying.",
    ru: "Измерение начинается. Пожалуйста, приложите палец к камере.",
    en: "Measurement is starting. Please place your finger on the camera.",
  },
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
    if (!enabled || !("speechSynthesis" in window)) return;
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
    if (!enabled || !("speechSynthesis" in window)) return;
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
  }, [enabled, resolveVoiceLang]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(p => {
      if (p) window.speechSynthesis.cancel();
      return !p;
    });
  }, []);

  return { speak, speakKey, stop, speaking, enabled, toggle, lang, setLang, voicesLoaded };
};

export default useVoiceGuidance;
