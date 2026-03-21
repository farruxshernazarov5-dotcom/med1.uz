import { useCallback, useRef, useState } from "react";

const useVoiceGuidance = () => {
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!enabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "uz-UZ";
    utter.rate = 0.9;
    utter.pitch = 1;
    // Fallback languages if uz-UZ not available
    const voices = window.speechSynthesis.getVoices();
    const uzVoice = voices.find((v) => v.lang.startsWith("uz"));
    const ruVoice = voices.find((v) => v.lang.startsWith("ru"));
    if (uzVoice) utter.voice = uzVoice;
    else if (ruVoice) { utter.voice = ruVoice; utter.lang = "ru-RU"; }

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [enabled]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((p) => {
      if (p) window.speechSynthesis.cancel();
      return !p;
    });
  }, []);

  return { speak, stop, speaking, enabled, toggle };
};

export default useVoiceGuidance;
