import { Activity, AlertTriangle, CheckCircle2, Compass, Layers, Ruler, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  type NeuroScanTelemetry,
  type RadiomicsMetrics,
  normalizeRiskDistribution,
} from "@/lib/neuroScanVision";

interface NeuroScanRiskPanelProps {
  riskLevel: "normal" | "attention" | "critical";
  summary: string;
  telemetry?: NeuroScanTelemetry;
  metrics?: RadiomicsMetrics | null;
  scanModality: string;
}

const HEMISPHERE_LABELS: Record<string, string> = {
  left: "Chap yarim shar (Left)",
  right: "O'ng yarim shar (Right)",
  bilateral: "Ikki tomonlama (Bilateral)",
  midline: "O'rta chiziq (Midline)",
  none: "Aniqlanmadi / Simmetrik",
};

export default function NeuroScanRiskPanel({
  riskLevel,
  summary,
  telemetry,
  metrics,
  scanModality,
}: NeuroScanRiskPanelProps) {
  const dist = normalizeRiskDistribution(telemetry?.riskDistribution, riskLevel);
  const primaryPct =
    riskLevel === "critical"
      ? dist.highRisk
      : riskLevel === "attention"
      ? Math.max(dist.highRisk, dist.benignOrLowRisk)
      : dist.normal;

  const riskMeta =
    riskLevel === "critical"
      ? {
          label: "Yuqori xavf / Shoshilinch e'tibor",
          accent: "text-rose-400",
          stroke: "#f43f5e",
          pill: "bg-rose-500/15 text-rose-300 border-rose-500/40",
          Icon: ShieldAlert,
        }
      : riskLevel === "attention"
      ? {
          label: "O'rtacha xavf / Qo'shimcha tekshiruv",
          accent: "text-amber-400",
          stroke: "#f59e0b",
          pill: "bg-amber-500/15 text-amber-300 border-amber-500/40",
          Icon: AlertTriangle,
        }
      : {
          label: "Past xavf / Patologiya aniqlanmadi",
          accent: "text-emerald-400",
          stroke: "#10b981",
          pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
          Icon: CheckCircle2,
        };

  const RiskIcon = riskMeta.Icon;
  const midlineMm =
    telemetry?.midlineShiftMm !== null && telemetry?.midlineShiftMm !== undefined
      ? telemetry.midlineShiftMm
      : metrics?.estimatedMidlineShiftMm ?? 0;
  const arcRadius = 46;
  const arcLength = Math.PI * arcRadius;
  const dashOffset = arcLength * (1 - Math.max(0, Math.min(100, primaryPct)) / 100);

  return (
    <div className="space-y-3 text-slate-100">
      {/* Intelligent Risk & Classification Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <RiskIcon className={`w-4 h-4 ${riskMeta.accent} flex-shrink-0`} />
            <h3 className="text-sm font-semibold text-slate-100">
              AI Neyro-onkologiya va xavf bahosi
            </h3>
          </div>
          <Badge variant="outline" className={`text-[10px] font-semibold ${riskMeta.pill}`}>
            {riskMeta.label}
          </Badge>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 mb-3">
          <div className="text-xs font-semibold text-cyan-300 mb-1">
            {telemetry?.primaryCategory ||
              (riskLevel === "critical"
                ? "Jiddiy intrakranial o'zgarish shubhasi"
                : riskLevel === "attention"
                ? "E'tibor talab qiluvchi o'zgarish"
                : "Aniq patologik o'choq ko'rinmadi")}
          </div>
          {telemetry?.gradeOrStage && (
            <div className="inline-block rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-medium text-amber-300 mb-1.5">
              {telemetry.gradeOrStage}
            </div>
          )}
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{summary}</p>
        </div>

        {/* Gauge + Probability Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 items-center">
          <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 120 72" className="w-28 h-16 overflow-visible">
              <path
                d="M 14 62 A 46 46 0 0 1 106 62"
                fill="none"
                stroke="#1e293b"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                d="M 14 62 A 46 46 0 0 1 106 62"
                fill="none"
                stroke={riskMeta.stroke}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
              <text
                x="60"
                y="54"
                textAnchor="middle"
                className="fill-slate-100 text-[18px] font-bold"
              >
                {Math.round(primaryPct)}%
              </text>
            </svg>
            <span className="text-[10px] text-slate-400 text-center -mt-1">
              {riskLevel === "normal" ? "Normal ehtimoli" : "AI skrining indeksi"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Xavfli / Jiddiy shubha</span>
                <span className="font-mono font-semibold text-rose-400">{dist.highRisk}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${dist.highRisk}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Yaxshi sifatli / O'rtacha</span>
                <span className="font-mono font-semibold text-amber-400">{dist.benignOrLowRisk}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${dist.benignOrLowRisk}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Normal (o'choqsiz)</span>
                <span className="font-mono font-semibold text-emerald-400">{dist.normal}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${dist.normal}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Radiomics Biomarkers */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Miqdoriy radiomika biomarkerlari
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            FOV {metrics?.fovMm ?? 220}mm · {scanModality.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>O'choq maydoni</span>
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-base font-bold font-mono text-slate-100">
              {metrics ? `${metrics.lesionAreaCm2} cm²` : "—"}
            </div>
            <div className="text-[10px] text-slate-400">
              {metrics ? `${metrics.lesionPixels} px · taxminiy` : "Tasvir kutilmoqda"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Ekvivalent diametr</span>
              <Ruler className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-base font-bold font-mono text-slate-100">
              {metrics ? `${metrics.equivalentDiameterMm} mm` : "—"}
            </div>
            <div className="text-[10px] text-slate-400">FOV kalibrlangan</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Anatomik joylashuv</span>
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xs font-semibold text-cyan-300 leading-snug">
              {telemetry?.anatomicalLobe || "Umumiy tahlil"}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {HEMISPHERE_LABELS[telemetry?.hemisphere ?? "none"] ?? "Aniqlanmadi"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>O'rta chiziq siljishi</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base font-bold font-mono text-slate-100">
              {midlineMm > 0 ? `${midlineMm} mm` : "0 mm"}
            </div>
            <div className={`text-[10px] ${midlineMm >= 3 ? "text-rose-400 font-medium" : "text-emerald-400"}`}>
              {midlineMm >= 3 ? "Midline shift kuzatilmoqda" : "O'rta chiziq barqaror"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="text-[11px] text-slate-400 mb-1">Chegara zichligi (Solidity)</div>
            <div className="text-base font-bold font-mono text-slate-100">
              {metrics ? metrics.solidity.toFixed(3) : "—"}
            </div>
            <div className="text-[10px] text-slate-400">
              Dumaloqlik: {metrics ? metrics.circularity.toFixed(3) : "—"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="text-[11px] text-slate-400 mb-1">Miya parenximasi</div>
            <div className="text-base font-bold font-mono text-slate-100">
              {metrics ? `${metrics.brainAreaCm2} cm²` : "—"}
            </div>
            <div className="text-[10px] text-slate-400">
              {telemetry?.aspectsScore !== null && telemetry?.aspectsScore !== undefined
                ? `ASPECTS: ${telemetry.aspectsScore}/10`
                : `Assimmetriya: ${metrics ? (metrics.asymmetryIndex * 100).toFixed(1) : "0"}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}