// Pulse-rhythm classification from beat-to-beat (RR) intervals of a camera/watch PPG.
// Screening hint only — a PPG is not an ECG.

export type Rhythm = { key: "normal" | "brady" | "tachy" | "irregular" | "unknown"; label: string; confidence: number };

export function classifyRhythm(rr: number[], bpm: number, sqi = 60): Rhythm {
  if (rr.length < 5 || !bpm) return { key: "unknown", label: "Ritm aniqlanmadi", confidence: 0 };
  const mean = rr.reduce((a, b) => a + b, 0) / rr.length;
  let d = 0;
  for (let i = 1; i < rr.length; i++) d += (rr[i] - rr[i - 1]) ** 2;
  const rmssdRatio = Math.sqrt(d / (rr.length - 1)) / mean;
  const confidence = Math.round(Math.max(20, Math.min(95, sqi * 0.7 + Math.min(rr.length, 25))));
  if (rmssdRatio > 0.15) return { key: "irregular", label: "Notekis ritm (aritmiya ehtimoli)", confidence };
  if (bpm < 60) return { key: "brady", label: "Sinus bradikardiya", confidence };
  if (bpm > 100) return { key: "tachy", label: "Sinus taxikardiya", confidence };
  return { key: "normal", label: "Normal sinus ritm", confidence };
}
