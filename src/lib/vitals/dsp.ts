// Signal processing for camera PPG / rPPG. Pure functions, no browser APIs.

export type Sample = { t: number; v: number }; // t in ms

/** Linear resampling of irregular frames to a uniform rate. */
export function resample(samples: Sample[], fs: number): number[] {
  if (samples.length < 2) return [];
  const t0 = samples[0].t, t1 = samples[samples.length - 1].t;
  const step = 1000 / fs;
  const out: number[] = [];
  let j = 0;
  for (let t = t0; t <= t1; t += step) {
    while (j < samples.length - 2 && samples[j + 1].t < t) j++;
    const a = samples[j], b = samples[j + 1];
    const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
    out.push(a.v + (b.v - a.v) * Math.min(1, Math.max(0, k)));
  }
  return out;
}

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

function design(kind: "lp" | "hp", fc: number, fs: number, q = Math.SQRT1_2): Biquad {
  const w = (2 * Math.PI * fc) / fs;
  const cos = Math.cos(w), alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b = kind === "lp" ? [(1 - cos) / 2, 1 - cos, (1 - cos) / 2] : [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  return { b0: b[0] / a0, b1: b[1] / a0, b2: b[2] / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

function run(x: number[], f: Biquad): number[] {
  const y = new Array(x.length);
  let x1 = x[0] ?? 0, x2 = x1, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = f.b0 * x[i] + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

/** Zero-phase 4th-order Butterworth-style bandpass (forward + backward). */
export function bandpass(x: number[], fs: number, lo: number, hi: number): number[] {
  if (x.length < 8) return x.slice();
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  let y = x.map((v) => v - mean);
  const hp = design("hp", lo, fs), lp = design("lp", hi, fs);
  y = run(run(y, hp), lp);
  y = run(run(y.reverse(), hp), lp).reverse();
  return y;
}

export const std = (x: number[]) => {
  if (!x.length) return 0;
  const m = x.reduce((a, b) => a + b, 0) / x.length;
  return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / x.length);
};
const median = (x: number[]) => {
  const s = [...x].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

/** Removes motion spikes: clamps samples beyond k·std. */
export function clipArtifacts(x: number[], k = 3): number[] {
  const s = std(x) || 1;
  return x.map((v) => Math.max(-k * s, Math.min(k * s, v)));
}

/** Dominant frequency (Hz) and its share of band power via DFT scan. */
export function spectralPeak(x: number[], fs: number, lo: number, hi: number, step = 0.01) {
  let best = 0, bestF = 0, total = 0;
  const powers: { f: number; p: number }[] = [];
  for (let f = lo; f <= hi; f += step) {
    let re = 0, im = 0;
    const w = (2 * Math.PI * f) / fs;
    for (let i = 0; i < x.length; i++) { re += x[i] * Math.cos(w * i); im -= x[i] * Math.sin(w * i); }
    const p = re * re + im * im;
    powers.push({ f, p }); total += p;
    if (p > best) { best = p; bestF = f; }
  }
  // Power within ±0.12 Hz of the peak and its first harmonic counts as "signal".
  const sig = powers.filter(({ f }) => Math.abs(f - bestF) <= 0.12 || Math.abs(f - 2 * bestF) <= 0.12).reduce((a, b) => a + b.p, 0);
  return { freq: bestF, ratio: total ? sig / total : 0 };
}

/** Systolic peaks with refractory period; returns sample indices. */
export function findPeaks(x: number[], fs: number, maxBpm = 200): number[] {
  const minDist = Math.floor((60 / maxBpm) * fs);
  const thr = 0.35 * std(x);
  const peaks: number[] = [];
  for (let i = 2; i < x.length - 2; i++) {
    if (x[i] > thr && x[i] >= x[i - 1] && x[i] >= x[i - 2] && x[i] > x[i + 1] && x[i] > x[i + 2]) {
      const last = peaks[peaks.length - 1];
      if (last !== undefined && i - last < minDist) { if (x[i] > x[last]) peaks[peaks.length - 1] = i; }
      else peaks.push(i);
    }
  }
  return peaks;
}

export type PulseAnalysis = {
  bpm: number;
  rr: number[];          // clean RR intervals, ms
  rmssd: number | null;  // ms
  sdnn: number | null;   // ms
  stress: "past" | "o'rta" | "yuqori" | null;
  sqi: number;           // 0-100
  filtered: number[];
};

/** Full pulse pipeline on a uniformly sampled signal. */
export function analyzePulse(raw: number[], fs: number, invert = true): PulseAnalysis | null {
  if (raw.length < fs * 6) return null;
  // Blood volume rises → absorbance rises → brightness falls, so invert for finger PPG.
  const src = invert ? raw.map((v) => -v) : raw;
  const filtered = clipArtifacts(bandpass(src, fs, 0.7, 3.5));
  const spec = spectralPeak(filtered, fs, 0.7, 3.5);
  const peaks = findPeaks(filtered, fs);
  const rrAll: number[] = [];
  for (let i = 1; i < peaks.length; i++) rrAll.push(((peaks[i] - peaks[i - 1]) / fs) * 1000);
  const med = median(rrAll);
  const rr = rrAll.filter((r) => med && Math.abs(r - med) / med < 0.2 && r > 285 && r < 1500);

  const specBpm = spec.freq * 60;
  const rrBpm = rr.length >= 4 ? 60000 / median(rr) : 0;
  const agree = rrBpm && Math.abs(rrBpm - specBpm) < 8;
  const bpm = Math.round(rrBpm && (agree || spec.ratio < 0.35) ? rrBpm : specBpm);

  const regularity = rrAll.length ? rr.length / rrAll.length : 0;
  const sqi = Math.round(Math.min(100, (spec.ratio * 0.6 + regularity * 0.4) * 100 * (agree ? 1.1 : 0.85)));

  let rmssd: number | null = null, sdnn: number | null = null;
  if (rr.length >= 8) {
    let s = 0;
    for (let i = 1; i < rr.length; i++) s += (rr[i] - rr[i - 1]) ** 2;
    rmssd = Math.round(Math.sqrt(s / (rr.length - 1)));
    sdnn = Math.round(std(rr));
  }
  const stress = rmssd === null ? null : rmssd < 20 ? "yuqori" : rmssd < 45 ? "o'rta" : "past";
  if (bpm < 40 || bpm > 200) return null;
  return { bpm, rr, rmssd, sdnn, stress, sqi, filtered };
}

/** Breaths per minute from the 0.1–0.5 Hz component (6–30 /min). */
export function respiratoryRate(raw: number[], fs: number): { rate: number; ratio: number } | null {
  if (raw.length < fs * 15) return null;
  const y = bandpass(raw, fs, 0.1, 0.5);
  const { freq, ratio } = spectralPeak(y, fs, 0.1, 0.5, 0.005);
  return { rate: Math.round(freq * 60), ratio };
}

/** POS rPPG (Wang et al. 2017): projects RGB to cancel illumination and specular motion. */
export function posSignal(rgb: { r: number; g: number; b: number }[], fs: number): number[] {
  const n = rgb.length, win = Math.round(1.6 * fs);
  const h = new Array(n).fill(0);
  for (let s = 0; s + win <= n; s++) {
    const seg = rgb.slice(s, s + win);
    const m = seg.reduce((a, c) => ({ r: a.r + c.r / win, g: a.g + c.g / win, b: a.b + c.b / win }), { r: 0, g: 0, b: 0 });
    if (!m.r || !m.g || !m.b) continue;
    const s1: number[] = [], s2: number[] = [];
    for (const c of seg) {
      const r = c.r / m.r, g = c.g / m.g, b = c.b / m.b;
      s1.push(g - b); s2.push(-2 * r + g + b);
    }
    const alpha = std(s1) / (std(s2) || 1);
    const p = s1.map((v, i) => v + alpha * s2[i]);
    const pm = p.reduce((a, b) => a + b, 0) / p.length;
    for (let i = 0; i < win; i++) h[s + i] += p[i] - pm;
  }
  return h;
}
