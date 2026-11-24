import { useState, type MouseEvent } from "react";
import {
  Crosshair,
  Flame,
  Layers,
  RotateCcw,
  Ruler,
  ScanLine,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  calculateRulerMm,
  DEFAULT_BRAIN_FOV_MM,
  type NeuroRoi,
  type NeuroScanTelemetry,
  type PipelineStageKey,
  type VisionPipelineResult,
} from "@/lib/neuroScanVision";

type ViewerLayer = "diagnostic" | "heatmap" | "contours" | "skull" | "raw";

interface NeuroScanViewerProps {
  imageSrc: string;
  pipeline: VisionPipelineResult | null;
  telemetry?: NeuroScanTelemetry;
  scanModality: string;
}

const LAYER_TABS: { id: ViewerLayer; label: string }[] = [
  { id: "diagnostic", label: "Tashxis qatlami" },
  { id: "heatmap", label: "Grad-CAM issiqlik" },
  { id: "contours", label: "Konturlar" },
  { id: "skull", label: "Miya maskasi" },
  { id: "raw", label: "Asl tasvir" },
];

export default function NeuroScanViewer({
  imageSrc,
  pipeline,
  telemetry,
  scanModality,
}: NeuroScanViewerProps) {
  const [layer, setLayer] = useState<ViewerLayer>("diagnostic");
  const [selectedStage, setSelectedStage] = useState<PipelineStageKey | null>(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(75);
  const [laserActive, setLaserActive] = useState<boolean>(true);
  const [rulerMode, setRulerMode] = useState<boolean>(false);
  const [rulerPoints, setRulerPoints] = useState<{ x: number; y: number }[]>([]);
  const [zoom, setZoom] = useState<number>(100);

  const rois: NeuroRoi[] = telemetry?.regionsOfInterest ?? [];
  const fovMm = pipeline?.metrics.fovMm ?? DEFAULT_BRAIN_FOV_MM;
  const rulerMm =
    rulerPoints.length === 2
      ? calculateRulerMm(rulerPoints[0], rulerPoints[1], fovMm)
      : null;

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!rulerMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setRulerPoints((prev) => (prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }]));
  };

  const handleReset = () => {
    setLayer("diagnostic");
    setSelectedStage(null);
    setHeatmapOpacity(75);
    setZoom(100);
    setRulerPoints([]);
    setRulerMode(false);
  };

  const resolveBaseImage = (): string => {
    if (selectedStage && pipeline?.stages[selectedStage]?.dataUrl) {
      return pipeline.stages[selectedStage].dataUrl;
    }
    if (!pipeline) return imageSrc;
    if (layer === "raw") return pipeline.stages.raw.dataUrl || imageSrc;
    if (layer === "skull") return pipeline.stages.parenchyma.dataUrl || imageSrc;
    if (layer === "contours") return pipeline.stages.contours.dataUrl || imageSrc;
    return pipeline.stages.windowed.dataUrl || imageSrc;
  };

  const showHeatmapOverlay =
    !selectedStage &&
    pipeline?.stages.heatmap.dataUrl &&
    (layer === "heatmap" || layer === "diagnostic");
  const showRoiOverlay = !selectedStage && (layer === "diagnostic" || layer === "contours");

  const midlineShift =
    telemetry?.midlineShiftMm ?? pipeline?.metrics.estimatedMidlineShiftMm ?? 0;

  return (
    <div className="space-y-3 text-slate-100">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-lg">
        {/* Layer Switcher Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Ko'rish qatlami:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LAYER_TABS.map((tab) => {
              const active = !selectedStage && layer === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedStage(null);
                    setLayer(tab.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    active
                      ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-200"
                      : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Controls Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-[160px] flex-1 max-w-[240px]">
            <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-slate-400 whitespace-nowrap">Issiqlik:</span>
            <Slider
              value={[heatmapOpacity]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => setHeatmapOpacity(v[0] ?? 75)}
              className="flex-1"
            />
            <span className="font-mono text-cyan-300 w-9 text-right">{heatmapOpacity}%</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setLaserActive((v) => !v)}
              className={`h-7 px-2.5 text-xs border-slate-700 ${
                laserActive
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                  : "bg-slate-950 text-slate-300"
              }`}
            >
              <ScanLine className="w-3.5 h-3.5 mr-1" /> Lazer skan
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setRulerMode((v) => !v);
                setRulerPoints([]);
              }}
              className={`h-7 px-2.5 text-xs border-slate-700 ${
                rulerMode
                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/60"
                  : "bg-slate-950 text-slate-300"
              }`}
            >
              <Ruler className="w-3.5 h-3.5 mr-1" /> Chizg'ich
            </Button>

            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Yaqinlashtirish"
              onClick={() => setZoom((z) => Math.min(220, z + 20))}
              className="h-7 w-7 bg-slate-950 border-slate-700 text-slate-300"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Uzoqlashtirish"
              onClick={() => setZoom((z) => Math.max(100, z - 20))}
              className="h-7 w-7 bg-slate-950 border-slate-700 text-slate-300"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Asl holatga qaytarish"
              onClick={handleReset}
              className="h-7 w-7 bg-slate-950 border-slate-700 text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Main Scan Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center min-h-[320px] sm:min-h-[410px]">
          <div
            onClick={handleCanvasClick}
            className={`relative inline-block max-w-full select-none transition-transform duration-200 ${
              rulerMode ? "cursor-crosshair" : "cursor-default"
            }`}
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <img
              src={resolveBaseImage()}
              alt="Bosh miya skani"
              className="block max-h-[420px] w-auto object-contain mx-auto"
              draggable={false}
            />

            {/* Blended Grad-CAM Heatmap Overlay */}
            {showHeatmapOverlay && pipeline && (
              <img
                src={pipeline.stages.heatmap.dataUrl}
                alt="Issiqlik xaritasi qatlami"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen"
                style={{ opacity: (layer === "diagnostic" ? heatmapOpacity * 0.45 : heatmapOpacity) / 100 }}
                draggable={false}
              />
            )}

            {/* Contours accent on diagnostic mode */}
            {!selectedStage && layer === "diagnostic" && pipeline?.stages.contours.dataUrl && (
              <img
                src={pipeline.stages.contours.dataUrl}
                alt="Kontur qatlami"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-45 mix-blend-lighten"
                draggable={false}
              />
            )}

            {/* SVG Diagnostic Overlays (Midline, AI ROI boxes, Ruler) */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {/* Midline axis */}
              {showRoiOverlay && (
                <line
                  x1="50"
                  y1="4"
                  x2="50"
                  y2="96"
                  stroke="#22d3ee"
                  strokeOpacity="0.35"
                  strokeWidth="0.4"
                  strokeDasharray="2 2"
                />
              )}

              {/* AI Regions of Interest */}
              {showRoiOverlay &&
                rois.map((roi, idx) => {
                  const rx = roi.x * 100;
                  const ry = roi.y * 100;
                  const rw = roi.w * 100;
                  const rh = roi.h * 100;
                  const cx = rx + rw / 2;
                  const cy = ry + rh / 2;
                  const stroke =
                    roi.severity === "severe"
                      ? "#f43f5e"
                      : roi.severity === "moderate"
                      ? "#f59e0b"
                      : "#22d3ee";
                  return (
                    <g key={roi.id || idx}>
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill={stroke}
                        fillOpacity="0.09"
                        stroke={stroke}
                        strokeWidth="0.7"
                      />
                      <line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} stroke={stroke} strokeWidth="0.6" />
                      <line x1={cx} y1={cy - 2} x2={cx} y2={cy + 2} stroke={stroke} strokeWidth="0.6" />
                    </g>
                  );
                })}

              {/* Interactive Ruler */}
              {rulerPoints.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x * 100}
                  cy={pt.y * 100}
                  r="1.3"
                  fill="#22d3ee"
                  stroke="#020617"
                  strokeWidth="0.4"
                />
              ))}
              {rulerPoints.length === 2 && (
                <line
                  x1={rulerPoints[0].x * 100}
                  y1={rulerPoints[0].y * 100}
                  x2={rulerPoints[1].x * 100}
                  y2={rulerPoints[1].y * 100}
                  stroke="#22d3ee"
                  strokeWidth="0.7"
                  strokeDasharray="1.5 1"
                />
              )}
            </svg>

            {/* ROI Floating Text Badges */}
            {showRoiOverlay &&
              rois.map((roi, idx) => (
                <div
                  key={roi.id || idx}
                  className="absolute pointer-events-none px-1.5 py-0.5 rounded bg-slate-950/90 border border-rose-500/60 text-[10px] font-mono text-amber-200 whitespace-nowrap shadow"
                  style={{
                    left: `${Math.min(72, Math.max(2, roi.x * 100))}%`,
                    top: `${Math.max(2, roi.y * 100 - 6)}%`,
                  }}
                >
                  {roi.label} ({roi.confidence}%)
                </div>
              ))}

            {/* Animated Laser Scan Sweep */}
            {laserActive && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_14px_2px_rgba(34,211,238,0.85)] animate-[neuroScanSweep_3.2s_ease-in-out_infinite]" />
            )}
          </div>

          {/* Top-Left Study Metadata HUD */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/25 px-2.5 py-1.5 text-[10px] font-mono text-cyan-300 space-y-0.5">
            <div>STUDY: BRAIN {scanModality.toUpperCase()} {(telemetry?.plane || "AXIAL").toUpperCase()}</div>
            <div>SEQ: {(telemetry?.sequence || "STANDARD").toUpperCase()} · FOV: {fovMm} mm</div>
            {selectedStage && pipeline && (
              <div className="text-amber-300">STAGE: {pipeline.stages[selectedStage].label}</div>
            )}
          </div>

          {/* Ruler Hint Banner */}
          {rulerMode && (
            <div className="pointer-events-none absolute top-2.5 right-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 px-2.5 py-1 text-[11px] text-cyan-100 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              {rulerPoints.length === 0
                ? "1-nuqtani bosing"
                : rulerPoints.length === 1
                ? "2-nuqtani bosing"
                : `Masofa: ${rulerMm} mm (qayta bosing)`}
            </div>
          )}

          {/* Bottom HUD Bar */}
          <div className="pointer-events-none absolute bottom-2 inset-x-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <div className="rounded bg-slate-950/85 border border-slate-800 px-2 py-1 text-slate-300">
              {rulerMm !== null ? (
                <span className="text-cyan-300 font-semibold">O'lchov: {rulerMm} mm</span>
              ) : (
                <span>
                  MIDLINE:{" "}
                  <span className={midlineShift >= 3 ? "text-rose-400" : "text-emerald-400"}>
                    {midlineShift >= 3 ? `SHIFT ${midlineShift} mm` : "NORMAL"}
                  </span>
                </span>
              )}
            </div>
            <div className="rounded bg-slate-950/85 border border-slate-800 px-2 py-1 text-cyan-300">
              AI ISHONCH: {telemetry?.aiConfidence ?? 85}% · ZOOM: {zoom}%
            </div>
          </div>
        </div>
      </div>

      {/* 8-Stage Computer Vision Pipeline Breakdown */}
      {pipeline && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="text-xs sm:text-sm font-semibold text-slate-100">
              Kompyuter ko'rishi bosqichlari (8 bosqichli tahlil)
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              Bosqichni bosib ko'ring
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {pipeline.orderedStages.map((stage) => {
              const active = selectedStage === stage.key;
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => setSelectedStage(active ? null : stage.key)}
                  className={`group rounded-xl overflow-hidden border text-left transition-all ${
                    active
                      ? "border-cyan-400 ring-2 ring-cyan-400/40 bg-slate-800"
                      : "border-slate-800 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  <div className="aspect-square bg-black overflow-hidden">
                    <img
                      src={stage.dataUrl}
                      alt={stage.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="px-1.5 py-1 text-[9px] sm:text-[10px] text-slate-300 truncate">
                    {stage.shortLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes neuroScanSweep {
          0%, 100% { transform: translateY(8px); opacity: 0.4; }
          50% { transform: translateY(360px); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}