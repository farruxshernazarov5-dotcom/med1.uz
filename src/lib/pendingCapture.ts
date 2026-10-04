// In-memory handoff for a photo captured in the mobile AI hub.
// Never persisted to storage: medical images stay only in this tab's memory.
let pending: File | null = null;

export const setPendingCapture = (file: File) => { pending = file; };
export const takePendingCapture = (): File | null => {
  const file = pending;
  pending = null;
  return file;
};

type SpeechCallbacks = { onText: (text: string, final: boolean) => void; onEnd: () => void };

/** Starts Web Speech recognition (uz-UZ). Returns a stop function, or null when unsupported. */
export const startVoiceInput = ({ onText, onEnd }: SpeechCallbacks, lang = "uz-UZ"): (() => void) | null => {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    onText(result[0].transcript, result.isFinal);
  };
  rec.onend = onEnd;
  rec.onerror = onEnd;
  rec.start();
  return () => rec.stop();
};
