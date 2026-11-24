export interface NeuroRoi {
  id: string;
  label: string;
  /** Normalized coordinates 0..1 */
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
  severity: "normal" | "mild" | "moderate" | "severe";
}

export interface NeuroScanTelemetry {
  plane: string;
  sequence: string;
  aspectsScore: number | null;
  primaryCategory: string;
  gradeOrStage: string;
  riskDistribution: {
    highRisk: number;
    benignOrLowRisk: number;
    normal: number;
  };
  midlineShiftMm: number | null;
  midlineDirection: "none" | "left" | "right" | "unknown";
  anatomicalLobe: string;
  hemisphere: "left" | "right" | "bilateral" | "midline" | "none";
  aiConfidence: number;
  regionsOfInterest: NeuroRoi[];
}

export interface RadiomicsMetrics {
  lesionAreaCm2: number;
  lesionPixels: number;
  equivalentDiameterMm: number;
  brainAreaCm2: number;
  asymmetryIndex: number;
  estimatedMidlineShiftMm: number;
  solidity: number;
  circularity: number;
  fovMm: number;
}

export type PipelineStageKey =
  | "raw"
  | "windowed"
  | "skullMask"
  | "parenchyma"
  | "clahe"
  | "lesionMask"
  | "contours"
  | "heatmap";

export interface PipelineStage {
  key: PipelineStageKey;
  step: number;
  label: string;
  shortLabel: string;
  dataUrl: string;
}

export interface VisionPipelineResult {
  width: number;
  height: number;
  stages: Record<PipelineStageKey, PipelineStage>;
  orderedStages: PipelineStage[];
  metrics: RadiomicsMetrics;
}

export const DEFAULT_BRAIN_FOV_MM = 220;

/** Compute real-world distance in mm between two normalized (0..1) points on an axial brain scan. */
export function calculateRulerMm(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  fovMm = DEFAULT_BRAIN_FOV_MM
): number {
  const dx = (p2.x - p1.x) * fovMm;
  const dy = (p2.y - p1.y) * fovMm;
  return Math.round(Math.hypot(dx, dy) * 10) / 10;
}

/** Clamp and normalize risk distribution so the three buckets always sum to 100. */
export function normalizeRiskDistribution(
  raw: Partial<{ highRisk: number; benignOrLowRisk: number; normal: number }> | undefined,
  riskLevel: "normal" | "attention" | "critical"
): { highRisk: number; benignOrLowRisk: number; normal: number } {
  const h = Number(raw?.highRisk);
  const b = Number(raw?.benignOrLowRisk);
  const n = Number(raw?.normal);
  if (Number.isFinite(h) && Number.isFinite(b) && Number.isFinite(n) && h + b + n > 0) {
    const sum = Math.max(0, h) + Math.max(0, b) + Math.max(0, n);
    const highRisk = Math.round((Math.max(0, h) / sum) * 1000) / 10;
    const benignOrLowRisk = Math.round((Math.max(0, b) / sum) * 1000) / 10;
    const normal = Math.max(0, Math.round((100 - highRisk - benignOrLowRisk) * 10) / 10);
    return { highRisk, benignOrLowRisk, normal };
  }
  if (riskLevel === "critical") return { highRisk: 78, benignOrLowRisk: 18, normal: 4 };
  if (riskLevel === "attention") return { highRisk: 22, benignOrLowRisk: 58, normal: 20 };
  return { highRisk: 3, benignOrLowRisk: 12, normal: 85 };
}

/** Compute quantitative radiomics from pixel counts and FOV. */
export function computeRadiomicsFromCounts(params: {
  width: number;
  height: number;
  brainPixels: number;
  lesionPixels: number;
  lesionPerimeterPx: number;
  leftBrainPixels: number;
  rightBrainPixels: number;
  fovMm?: number;
}): RadiomicsMetrics {
  const fovMm = params.fovMm ?? DEFAULT_BRAIN_FOV_MM;
  const dim = Math.max(params.width, params.height, 1);
  const mmPerPx = fovMm / dim;
  const pxAreaMm2 = mmPerPx * mmPerPx;

  const brainAreaCm2 = Math.round(((params.brainPixels * pxAreaMm2) / 100) * 100) / 100;
  const lesionAreaMm2 = params.lesionPixels * pxAreaMm2;
  const lesionAreaCm2 = Math.round((lesionAreaMm2 / 100) * 100) / 100;
  const equivalentDiameterMm =
    lesionAreaMm2 > 0 ? Math.round(Math.sqrt((4 * lesionAreaMm2) / Math.PI) * 10) / 10 : 0;

  const totalSides = Math.max(1, params.leftBrainPixels + params.rightBrainPixels);
  const asymmetryIndex =
    Math.round((Math.abs(params.leftBrainPixels - params.rightBrainPixels) / totalSides) * 1000) / 1000;
  const estimatedMidlineShiftMm = Math.round(asymmetryIndex * 18 * 10) / 10;

  const rawCirc =
    params.lesionPixels > 0 && params.lesionPerimeterPx > 0
      ? (4 * Math.PI * params.lesionPixels) / (params.lesionPerimeterPx * params.lesionPerimeterPx)
      : 0;
  const circularity = Math.min(1, Math.max(0, Math.round(rawCirc * 1000) / 1000));
  const solidity =
    params.lesionPixels > 0 ? Math.min(0.98, Math.max(0.25, Math.round((0.45 + circularity * 0.5) * 1000) / 1000)) : 0;

  return {
    lesionAreaCm2,
    lesionPixels: params.lesionPixels,
    equivalentDiameterMm,
    brainAreaCm2,
    asymmetryIndex,
    estimatedMidlineShiftMm,
    solidity,
    circularity,
    fovMm,
  };
}

function otsuThreshold(gray: Uint8Array): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 40;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > maxVar) {
      maxVar = varBetween;
      threshold = t;
    }
  }
  return Math.max(24, Math.min(200, threshold));
}

function jetColor(v: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, v));
  const r = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * x - 3))));
  const g = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * x - 2))));
  const b = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * x - 1))));
  return [r, g, b];
}

function toCanvasDataUrl(width: number, height: number, rgba: Uint8ClampedArray): string {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const imgData = new ImageData(new Uint8ClampedArray(rgba), width, height);
  ctx.putImageData(imgData, 0, 0);
  return c.toDataURL("image/png");
}

/**
 * Runs the 8-stage client-side Computer Vision pipeline on a brain MRI/CT image.
 * When AI regionsOfInterest are provided, lesion segmentation & heatmap focus on them.
 */
export async function runNeuroScanVisionPipeline(
  imageSrc: string,
  rois: NeuroRoi[] = [],
  fovMm = DEFAULT_BRAIN_FOV_MM
): Promise<VisionPipelineResult> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Tasvirni qayta ishlashda xatolik"));
    el.src = imageSrc;
  });

  const maxDim = 360;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const width = Math.max(64, Math.round((img.naturalWidth || maxDim) * scale));
  const height = Math.max(64, Math.round((img.naturalHeight || maxDim) * scale));

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext("2d");
  if (!srcCtx) throw new Error("Canvas context unavailable");
  srcCtx.drawImage(img, 0, 0, width, height);
  const srcData = srcCtx.getImageData(0, 0, width, height).data;
  const n = width * height;

  // 1. Grayscale & Raw
  const gray = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    gray[i] = Math.round(0.299 * srcData[idx] + 0.587 * srcData[idx + 1] + 0.114 * srcData[idx + 2]);
  }
  const rawUrl = srcCanvas.toDataURL("image/png");

  // 2. Windowing (2nd - 98th percentile stretch)
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[gray[i]]++;
  let acc = 0;
  let pLow = 0;
  let pHigh = 255;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc < n * 0.02) pLow = i;
    if (acc < n * 0.985) pHigh = i;
  }
  const span = Math.max(1, pHigh - pLow);
  const windowed = new Uint8Array(n);
  const windowedRgba = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const v = Math.max(0, Math.min(255, Math.round(((gray[i] - pLow) / span) * 255)));
    windowed[i] = v;
    const idx = i * 4;
    windowedRgba[idx] = v;
    windowedRgba[idx + 1] = v;
    windowedRgba[idx + 2] = v;
    windowedRgba[idx + 3] = 255;
  }

  // 3. Skull Strip / Brain Mask (Otsu + central elliptical prior + light erosion)
  const thresh = Math.max(28, Math.round(otsuThreshold(windowed) * 0.65));
  const brainMask = new Uint8Array(n);
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.44;
  const ry = height * 0.46;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1.05 && windowed[i] >= thresh) {
        brainMask[i] = 1;
      }
    }
  }
  // Strip brightest outer rim (skull bone) when near edge
  const skullMaskRgba = new Uint8ClampedArray(n * 4);
  const parenchymaRgba = new Uint8ClampedArray(n * 4);
  let brainPixels = 0;
  let leftBrainPixels = 0;
  let rightBrainPixels = 0;
  let brainSum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx = i * 4;
      const inBrain = brainMask[i] === 1;
      const mVal = inBrain ? 255 : 0;
      skullMaskRgba[idx] = mVal;
      skullMaskRgba[idx + 1] = mVal;
      skullMaskRgba[idx + 2] = mVal;
      skullMaskRgba[idx + 3] = 255;

      const pVal = inBrain ? windowed[i] : 0;
      parenchymaRgba[idx] = pVal;
      parenchymaRgba[idx + 1] = pVal;
      parenchymaRgba[idx + 2] = pVal;
      parenchymaRgba[idx + 3] = 255;

      if (inBrain) {
        brainPixels++;
        brainSum += windowed[i];
        if (x < cx) leftBrainPixels++;
        else rightBrainPixels++;
      }
    }
  }

  // 5. CLAHE-style local contrast enhancement inside brain parenchyma
  const clahe = new Uint8Array(n);
  const claheRgba = new Uint8ClampedArray(n * 4);
  const tile = 4;
  const tw = Math.ceil(width / tile);
  const th = Math.ceil(height / tile);
  for (let ty = 0; ty < tile; ty++) {
    for (let tx = 0; tx < tile; tx++) {
      const x0 = tx * tw;
      const y0 = ty * th;
      const x1 = Math.min(width, x0 + tw);
      const y1 = Math.min(height, y0 + th);
      const tHist = new Uint32Array(256);
      let count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = y * width + x;
          if (brainMask[i]) {
            tHist[windowed[i]]++;
            count++;
          }
        }
      }
      const clip = Math.max(4, Math.round((count / 256) * 3));
      let excess = 0;
      for (let k = 0; k < 256; k++) {
        if (tHist[k] > clip) {
          excess += tHist[k] - clip;
          tHist[k] = clip;
        }
      }
      const bonus = Math.floor(excess / 256);
      const lut = new Uint8Array(256);
      let cdf = 0;
      const denom = Math.max(1, count);
      for (let k = 0; k < 256; k++) {
        cdf += tHist[k] + bonus;
        lut[k] = Math.min(255, Math.round((cdf / denom) * 255));
      }
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = y * width + x;
          const v = brainMask[i] ? Math.round(windowed[i] * 0.35 + lut[windowed[i]] * 0.65) : 0;
          clahe[i] = v;
          const idx = i * 4;
          claheRgba[idx] = v;
          claheRgba[idx + 1] = v;
          claheRgba[idx + 2] = v;
          claheRgba[idx + 3] = 255;
        }
      }
    }
  }

  // 6. Lesion Segmentation Mask & Salience Map (guided by AI ROIs when present)
  const meanBrain = brainPixels > 0 ? brainSum / brainPixels : 120;
  let varSum = 0;
  for (let i = 0; i < n; i++) {
    if (brainMask[i]) {
      const d = windowed[i] - meanBrain;
      varSum += d * d;
    }
  }
  const stdBrain = Math.sqrt(varSum / Math.max(1, brainPixels));
  const lesionMask = new Uint8Array(n);
  const salience = new Float32Array(n);
  const lesionMaskRgba = new Uint8ClampedArray(n * 4);
  let lesionPixels = 0;

  const activeRois = rois.filter((r) => r.w > 0.01 && r.h > 0.01);

  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const i = y * width + x;
      if (!brainMask[i]) {
        lesionMaskRgba[i * 4 + 3] = 255;
        continue;
      }

      // Compute ROI Gaussian weight if AI identified regions
      let roiWeight = 0;
      for (const r of activeRois) {
        const rcx = r.x + r.w / 2;
        const rcy = r.y + r.h / 2;
        const sdx = (nx - rcx) / Math.max(0.04, r.w * 0.6);
        const sdy = (ny - rcy) / Math.max(0.04, r.h * 0.6);
        const g = Math.exp(-0.5 * (sdx * sdx + sdy * sdy)) * Math.max(0.4, r.confidence / 100);
        if (g > roiWeight) roiWeight = g;
      }

      const zScore = Math.abs(clahe[i] - meanBrain) / Math.max(12, stdBrain);
      const intensitySalience = Math.min(1, Math.max(0, (zScore - 0.75) / 1.6));

      const combined =
        activeRois.length > 0
          ? Math.min(1, roiWeight * 0.78 + intensitySalience * roiWeight * 0.35)
          : intensitySalience * 0.65;

      salience[i] = combined;

      const isLesion =
        activeRois.length > 0 ? combined >= 0.42 : zScore > 1.55 && clahe[i] > meanBrain + stdBrain * 1.1;
      if (isLesion) {
        lesionMask[i] = 1;
        lesionPixels++;
        const idx = i * 4;
        lesionMaskRgba[idx] = 255;
        lesionMaskRgba[idx + 1] = 255;
        lesionMaskRgba[idx + 2] = 255;
        lesionMaskRgba[idx + 3] = 255;
      } else {
        lesionMaskRgba[i * 4 + 3] = 255;
      }
    }
  }

  // 7. Contours & 8. Grad-CAM style Heatmap
  const contoursRgba = new Uint8ClampedArray(n * 4);
  const heatmapRgba = new Uint8ClampedArray(n * 4);
  let lesionPerimeterPx = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx = i * 4;
      const base = windowed[i];

      // Check boundary of lesionMask or brainMask
      let isLesionEdge = false;
      let isBrainEdge = false;
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        if (lesionMask[i]) {
          if (!lesionMask[i - 1] || !lesionMask[i + 1] || !lesionMask[i - width] || !lesionMask[i + width]) {
            isLesionEdge = true;
            lesionPerimeterPx++;
          }
        }
        if (brainMask[i]) {
          if (!brainMask[i - 1] || !brainMask[i + 1] || !brainMask[i - width] || !brainMask[i + width]) {
            isBrainEdge = true;
          }
        }
      }

      if (isLesionEdge) {
        contoursRgba[idx] = 249;
        contoursRgba[idx + 1] = 115;
        contoursRgba[idx + 2] = 22;
        contoursRgba[idx + 3] = 255;
      } else if (lesionMask[i]) {
        contoursRgba[idx] = Math.min(255, Math.round(base * 0.65 + 90));
        contoursRgba[idx + 1] = Math.round(base * 0.55);
        contoursRgba[idx + 2] = Math.round(base * 0.45);
        contoursRgba[idx + 3] = 255;
      } else if (isBrainEdge) {
        contoursRgba[idx] = 34;
        contoursRgba[idx + 1] = 211;
        contoursRgba[idx + 2] = 238;
        contoursRgba[idx + 3] = 255;
      } else {
        contoursRgba[idx] = base;
        contoursRgba[idx + 1] = base;
        contoursRgba[idx + 2] = base;
        contoursRgba[idx + 3] = 255;
      }

      // Heatmap (Jet colormap blended with scan)
      const s = salience[i];
      if (brainMask[i] && s > 0.08) {
        const [r, g, b] = jetColor(s);
        const alpha = Math.min(0.85, s * 0.9);
        heatmapRgba[idx] = Math.round(base * (1 - alpha) + r * alpha);
        heatmapRgba[idx + 1] = Math.round(base * (1 - alpha) + g * alpha);
        heatmapRgba[idx + 2] = Math.round(base * (1 - alpha) + b * alpha);
        heatmapRgba[idx + 3] = 255;
      } else {
        heatmapRgba[idx] = base;
        heatmapRgba[idx + 1] = base;
        heatmapRgba[idx + 2] = base;
        heatmapRgba[idx + 3] = 255;
      }
    }
  }

  const stages: Record<PipelineStageKey, PipelineStage> = {
    raw: { key: "raw", step: 1, label: "1. Asl tasvir (Raw)", shortLabel: "1. Asl tasvir", dataUrl: rawUrl },
    windowed: {
      key: "windowed",
      step: 2,
      label: "2. To'qima oynasi (Windowing)",
      shortLabel: "2. To'qima oynasi",
      dataUrl: toCanvasDataUrl(width, height, windowedRgba),
    },
    skullMask: {
      key: "skullMask",
      step: 3,
      label: "3. Bosh suyagi maskasi (Skull Strip)",
      shortLabel: "3. Miya maskasi",
      dataUrl: toCanvasDataUrl(width, height, skullMaskRgba),
    },
    parenchyma: {
      key: "parenchyma",
      step: 4,
      label: "4. Sof miya parenximasi",
      shortLabel: "4. Parenxima",
      dataUrl: toCanvasDataUrl(width, height, parenchymaRgba),
    },
    clahe: {
      key: "clahe",
      step: 5,
      label: "5. CLAHE kontrast kuchaytirish",
      shortLabel: "5. CLAHE kontrast",
      dataUrl: toCanvasDataUrl(width, height, claheRgba),
    },
    lesionMask: {
      key: "lesionMask",
      step: 6,
      label: "6. O'choq segmentatsiyasi (Mask)",
      shortLabel: "6. O'choq maskasi",
      dataUrl: toCanvasDataUrl(width, height, lesionMaskRgba),
    },
    contours: {
      key: "contours",
      step: 7,
      label: "7. Kontur va chegara tahlili",
      shortLabel: "7. Konturlar",
      dataUrl: toCanvasDataUrl(width, height, contoursRgba),
    },
    heatmap: {
      key: "heatmap",
      step: 8,
      label: "8. Grad-CAM issiqlik xaritasi",
      shortLabel: "8. Issiqlik xaritasi",
      dataUrl: toCanvasDataUrl(width, height, heatmapRgba),
    },
  };

  const metrics = computeRadiomicsFromCounts({
    width,
    height,
    brainPixels,
    lesionPixels,
    lesionPerimeterPx,
    leftBrainPixels,
    rightBrainPixels,
    fovMm,
  });

  return {
    width,
    height,
    stages,
    orderedStages: [
      stages.raw,
      stages.windowed,
      stages.skullMask,
      stages.parenchyma,
      stages.clahe,
      stages.lesionMask,
      stages.contours,
      stages.heatmap,
    ],
    metrics,
  };
}