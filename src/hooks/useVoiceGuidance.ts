import { useCallback, useRef, useState } from "react";

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
};

const useVoiceGuidance = () => {
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [lang, setLang] = useState<VoiceLang>("uz");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const langMap: Record<VoiceLang, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

  const speak = useCallback((text: string) => {
    if (!enabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    const targetLang = langMap[lang];
    utter.lang = targetLang;
    utter.rate = 0.9;
    utter.pitch = 1.1;

    // Try to find a female voice for the target language
    const voices = window.speechSynthesis.getVoices();
    const langVoices = voices.filter(v => v.lang.startsWith(targetLang.split("-")[0]));
    const femaleVoice = langVoices.find(v => /female|woman|zira|svetlana|milena|yelda/i.test(v.name));
    if (femaleVoice) utter.voice = femaleVoice;
    else if (langVoices[0]) utter.voice = langVoices[0];
    // Fallback chain: uz -> ru -> en
    else if (lang === "uz") {
      const ruVoice = voices.find(v => v.lang.startsWith("ru"));
      if (ruVoice) { utter.voice = ruVoice; utter.lang = "ru-RU"; }
    }

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;
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

  return { speak, speakKey, stop, speaking, enabled, toggle, lang, setLang };
};

export default useVoiceGuidance;
