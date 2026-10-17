export type VitalSource = "finger" | "face" | "watch";

export type VitalReading = {
  source: VitalSource;
  bpm: number;
  confidence: number;          // 0-100
  rmssd?: number | null;
  sdnn?: number | null;
  stress?: string | null;
  respRate?: number | null;
  spo2?: number | null;
  sleepHours?: number | null;
  steps?: number | null;
  device?: string;
  rhythm?: string | null;      // PPG rhythm hint (not an ECG diagnosis)
};
