// On-device face tracking (MediaPipe Face Landmarker). Images never leave the phone;
// only numbers (landmark ROIs, expression scores) are used by Vital AI and Psixolog AI.
import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let pending: Promise<FaceLandmarker> | null = null;

/** Loads the landmarker once (GPU first, CPU fallback). */
export function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (pending) return pending;
  pending = (async () => {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    const make = (delegate: "GPU" | "CPU") => FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL, delegate },
      runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true,
      minFaceDetectionConfidence: 0.6, minFacePresenceConfidence: 0.6, minTrackingConfidence: 0.5,
    });
    try { return await make("GPU"); } catch { return await make("CPU"); }
  })();
  pending.catch(() => { pending = null; });
  return pending;
}

export type Box = { x: number; y: number; w: number; h: number };

// Skin patches used for rPPG (MediaPipe 468-point mesh indices).
const FOREHEAD = [10, 67, 69, 104, 108, 109, 151, 297, 299, 333, 337, 338];
const LEFT_CHEEK = [50, 101, 116, 117, 118, 123, 147, 187, 205];
const RIGHT_CHEEK = [280, 330, 345, 346, 347, 352, 376, 411, 425];

/** Bounding box of landmark points in pixels, shrunk towards its centre so edges (hair, eyes) stay out. */
export function boxOf(lm: NormalizedLandmark[], idx: number[] | null, W: number, H: number, shrink = 0.15): Box {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const i of idx ?? lm.map((_, k) => k)) {
    const p = lm[i]; if (!p) continue;
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  }
  const w = (x1 - x0) * W, h = (y1 - y0) * H;
  return { x: x0 * W + w * shrink, y: y0 * H + h * shrink, w: w * (1 - 2 * shrink), h: h * (1 - 2 * shrink) };
}

export const skinRois = (lm: NormalizedLandmark[], W: number, H: number) => [
  boxOf(lm, FOREHEAD, W, H, 0.2), boxOf(lm, LEFT_CHEEK, W, H, 0.15), boxOf(lm, RIGHT_CHEEK, W, H, 0.15),
];

/** Draws a glowing mesh like a medical face-scan HUD. Mirrors x for selfie view. */
export function drawFaceHud(ctx: CanvasRenderingContext2D, lm: NormalizedLandmark[], color: (a: number) => string, label: string, mirror = true) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const X = (p: NormalizedLandmark) => (mirror ? 1 - p.x : p.x) * W, Y = (p: NormalizedLandmark) => p.y * H;
  ctx.fillStyle = color(0.75);
  for (let i = 0; i < lm.length; i += 3) { ctx.beginPath(); ctx.arc(X(lm[i]), Y(lm[i]), 1.1, 0, Math.PI * 2); ctx.fill(); }
  // Triangle web between neighbouring key points.
  ctx.strokeStyle = color(0.3); ctx.lineWidth = 0.8;
  const web = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  ctx.beginPath();
  web.forEach((i, k) => { const p = lm[i]; if (!p) return; k ? ctx.lineTo(X(p), Y(p)) : ctx.moveTo(X(p), Y(p)); });
  ctx.closePath(); ctx.stroke();
  for (const i of [1, 4, 168, 6]) for (let k = 0; k < web.length; k += 3) {
    const a = lm[i], b = lm[web[k]]; if (!a || !b) continue;
    ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke();
  }
  // Bounding box + tag.
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (const p of lm) { x0 = Math.min(x0, X(p)); x1 = Math.max(x1, X(p)); y0 = Math.min(y0, Y(p)); y1 = Math.max(y1, Y(p)); }
  ctx.strokeStyle = color(1); ctx.lineWidth = 2;
  ctx.strokeRect(x0 - 6, y0 - 10, x1 - x0 + 12, y1 - y0 + 16);
  ctx.font = "bold 11px monospace";
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = color(0.9); ctx.fillRect(x0 - 6, y0 - 28, tw, 17);
  ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillText(label, x0 - 1, y0 - 15);
}

// ---------- Facial expression (blendshapes → emotion scores). Pure, testable. ----------

export type Blendshapes = Record<string, number>;
export type EmotionKey = "neytral" | "xursand" | "gamgin" | "hayrat" | "asabiy" | "xavotir";
export const EMOTION_LABEL: Record<EmotionKey, string> = {
  neytral: "Neytral", xursand: "Xursand", gamgin: "G‘amgin", hayrat: "Hayratda", asabiy: "Asabiy / jahldor", xavotir: "Xavotirli",
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Maps ARKit-style blendshape scores (0..1) to emotion scores (0..1) plus a muscle-tension index. */
export function emotionScores(bs: Blendshapes): Record<EmotionKey, number> & { tension: number } {
  const g = (k: string) => bs[k] ?? 0;
  const pair = (k: string) => (g(k + "Left") + g(k + "Right")) / 2;
  const smile = pair("mouthSmile"), frown = pair("mouthFrown"), browDown = pair("browDown"), browOuter = pair("browOuterUp");
  const browInner = g("browInnerUp"), jaw = g("jawOpen"), wide = pair("eyeWide"), sneer = pair("noseSneer");
  const press = pair("mouthPress"), stretch = pair("mouthStretch"), squint = pair("eyeSquint"), cheek = pair("cheekSquint");
  const xursand = clamp(smile * 1.25 + cheek * 0.3);
  const gamgin = clamp(frown * 1.6 + browInner * 0.5 - smile * 0.6);
  const hayrat = clamp(jaw * 0.55 + wide * 0.8 + browOuter * 0.6 - browDown * 0.4);
  const asabiy = clamp(browDown * 1.1 + sneer * 0.8 + press * 0.5 - smile * 0.4);
  const xavotir = clamp(browInner * 0.7 + wide * 0.5 + stretch * 0.9 - smile * 0.4);
  const neytral = clamp(1 - Math.max(xursand, gamgin, hayrat, asabiy, xavotir) * 1.3);
  const tension = clamp(browDown * 0.5 + squint * 0.4 + press * 0.6 + browInner * 0.3);
  return { neytral, xursand, gamgin, hayrat, asabiy, xavotir, tension };
}

export type FaceAnalysis = {
  dominant: EmotionKey;
  emotions: Record<EmotionKey, number>; // % share
  tension: number;   // 0-100 facial muscle tension
  blinkRate: number; // per minute
  eyeOpenness: number; // 0-100
  fatigue: "past" | "o'rta" | "yuqori";
  seconds: number;
  frames: number;
};

/** Aggregates per-frame blendshapes collected over `seconds` into one session summary. */
export function summarizeExpressions(frames: Blendshapes[], seconds: number): FaceAnalysis | null {
  if (frames.length < 10 || seconds <= 0) return null;
  const keys = Object.keys(EMOTION_LABEL) as EmotionKey[];
  const sum = Object.fromEntries(keys.map((k) => [k, 0])) as Record<EmotionKey, number>;
  let tension = 0, open = 0, blinks = 0, closed = false;
  for (const f of frames) {
    const s = emotionScores(f);
    for (const k of keys) sum[k] += s[k];
    tension += s.tension;
    const blink = ((f.eyeBlinkLeft ?? 0) + (f.eyeBlinkRight ?? 0)) / 2;
    open += 1 - blink;
    if (blink > 0.5 && !closed) { blinks++; closed = true; } else if (blink < 0.3) closed = false;
  }
  const total = keys.reduce((a, k) => a + sum[k], 0) || 1;
  const emotions = Object.fromEntries(keys.map((k) => [k, Math.round((sum[k] / total) * 100)])) as Record<EmotionKey, number>;
  const dominant = keys.reduce((a, k) => (emotions[k] > emotions[a] ? k : a), "neytral" as EmotionKey);
  const blinkRate = Math.round((blinks / seconds) * 60);
  const eyeOpenness = Math.round((open / frames.length) * 100);
  const fatigue = eyeOpenness < 60 || blinkRate > 30 ? "yuqori" : eyeOpenness < 75 || blinkRate > 22 ? "o'rta" : "past";
  return { dominant, emotions, tension: Math.round((tension / frames.length) * 100), blinkRate, eyeOpenness, fatigue, seconds: Math.round(seconds), frames: frames.length };
}

export const toBlendshapes = (cats?: { categoryName: string; score: number }[]): Blendshapes =>
  Object.fromEntries((cats ?? []).map((c) => [c.categoryName, c.score]));
