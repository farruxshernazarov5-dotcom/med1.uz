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
};

/* Premium voice selection priorities */
const VOICE_PRIORITIES: Record<VoiceLang, RegExp[]> = {
  uz: [
    /female|woman|zira|yelda|dilnoza|malika/i,
    /milena|svetlana|irina|tatiana|katya/i, // fallback to Russian female
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

const useVoiceGuidance = () => {
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [lang, setLang] = useState<VoiceLang>("uz");
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const cachedVoices = useRef<Record<string, SpeechSynthesisVoice | null>>({});

  const langMap: Record<VoiceLang, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

  // Pre-load voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        // Pre-cache best voices for each language
        (["uz", "ru", "en"] as VoiceLang[]).forEach(l => {
          cachedVoices.current[l] = findBestVoice(voices, l);
        });
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const findBestVoice = (voices: SpeechSynthesisVoice[], targetLang: VoiceLang): SpeechSynthesisVoice | null => {
    const targetCode = langMap[targetLang].split("-")[0];
    const langVoices = voices.filter(v => v.lang.startsWith(targetCode));

    // Try priority patterns
    for (const pattern of VOICE_PRIORITIES[targetLang]) {
      const match = langVoices.find(v => pattern.test(v.name));
      if (match) return match;
    }

    // Any female-sounding voice in target language
    const femaleVoice = langVoices.find(v => /female|woman/i.test(v.name));
    if (femaleVoice) return femaleVoice;

    // Any voice in target language
    if (langVoices[0]) return langVoices[0];

    // Fallback chain: uz -> ru -> en
    if (targetLang === "uz") {
      const ruVoice = voices.find(v => v.lang.startsWith("ru") && /female|woman|milena|svetlana|irina/i.test(v.name));
      if (ruVoice) return ruVoice;
      const anyRu = voices.find(v => v.lang.startsWith("ru"));
      if (anyRu) return anyRu;
    }

    return null;
  };

  const speak = useCallback((text: string) => {
    if (!enabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    const targetLang = langMap[lang];
    utter.lang = targetLang;
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.volume = 1;

    // Use cached voice or find one
    const voice = cachedVoices.current[lang] || findBestVoice(window.speechSynthesis.getVoices(), lang);
    if (voice) {
      utter.voice = voice;
      // If using a fallback language voice, update lang accordingly
      if (!voice.lang.startsWith(targetLang.split("-")[0])) {
        utter.lang = voice.lang;
      }
    }

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [enabled, lang]);

  const speakKey = useCallback((key: string) => {
    const msg = MESSAGES[key]?.[lang];
    if (msg) speak(msg);
  }, [speak, lang]);

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
