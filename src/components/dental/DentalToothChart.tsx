import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, ClipboardList, FlaskConical, FileText } from "lucide-react";

const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

const TOOTH_STATUSES: Record<string, { label: string; color: string; emoji: string }> = {
  healthy: { label: "Sog'lom", color: "bg-green-500", emoji: "✅" },
  caries: { label: "Kariyes", color: "bg-yellow-500", emoji: "🟡" },
  pulpitis: { label: "Pulpit", color: "bg-orange-500", emoji: "🟠" },
  filled: { label: "Plomba", color: "bg-blue-500", emoji: "🔵" },
  crown: { label: "Koronka", color: "bg-purple-500", emoji: "👑" },
  missing: { label: "Yo'q", color: "bg-red-500", emoji: "❌" },
  implant: { label: "Implant", color: "bg-cyan-500", emoji: "🔩" },
  root_canal: { label: "Kanal", color: "bg-amber-600", emoji: "🦷" },
};

interface DentalToothChartProps {
  selectedPatient: any | null;
  toothChart: Record<number, string>;
  onSetToothStatus: (toothNum: number, status: string) => void;
  onBack: () => void;
}

const ToothRow = ({ teeth, toothChart, onSetStatus, onSelectTooth, selectedTooth, popoverPosition }: {
  teeth: number[]; toothChart: Record<number, string>;
  onSetStatus: (t: number, s: string) => void;
  onSelectTooth: (t: number) => void;
  selectedTooth: number | null;
  popoverPosition: "top" | "bottom";
}) => (
  <div className="flex justify-center gap-1 flex-wrap">
    {teeth.map(t => {
      const status = toothChart[t] || "healthy";
      const isSelected = selectedTooth === t;
      return (
        <div key={t} className="relative group">
          <button
            onClick={() => onSelectTooth(t)}
            className={cn(
              "w-10 h-10 rounded-lg border-2 text-xs font-bold flex items-center justify-center transition-all hover:scale-110",
              TOOTH_STATUSES[status]?.color || "bg-muted", "text-white",
              isSelected ? "border-primary ring-2 ring-primary/50 scale-110" : "border-border"
            )}
          >
            {t}
          </button>
          <div className={cn(
            "absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg z-50 p-1 min-w-[120px]",
            popoverPosition === "bottom" ? "top-full mt-1" : "bottom-full mb-1"
          )}>
            {Object.entries(TOOTH_STATUSES).map(([k, v]) => (
              <button key={k} onClick={() => onSetStatus(t, k)} className="text-xs px-2 py-1.5 text-left hover:bg-muted rounded flex items-center gap-2">
                <span>{v.emoji}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const DentalToothChart = ({ selectedPatient, toothChart, onSetToothStatus, onBack }: DentalToothChartProps) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  if (!selectedPatient) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Bemorlar bo'limidan bemor tanlab tish xaritasini oching</p>
      </div>
    );
  }

  const currentStatus = selectedTooth ? (toothChart[selectedTooth] || "healthy") : null;
  const statusInfo = currentStatus ? TOOTH_STATUSES[currentStatus] : null;

  // Count tooth statuses
  const statusCounts: Record<string, number> = {};
  [...TEETH_UPPER, ...TEETH_LOWER].forEach(t => {
    const s = toothChart[t] || "healthy";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
        </Button>
        <h2 className="font-heading text-xl font-bold text-foreground">🦷 {selectedPatient.full_name} — Tish xaritasi</h2>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TOOTH_STATUSES).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 bg-card rounded-lg border border-border px-2 py-1">
            <div className={cn("w-3 h-3 rounded-full", v.color)} />
            <span className="text-xs text-muted-foreground">{v.label}</span>
            <Badge variant="outline" className="text-xs ml-1">{statusCounts[k] || 0}</Badge>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-xs text-muted-foreground mb-3 text-center font-medium">Yuqori jag' (Maxilla)</p>
        <ToothRow teeth={TEETH_UPPER} toothChart={toothChart} onSetStatus={onSetToothStatus} onSelectTooth={setSelectedTooth} selectedTooth={selectedTooth} popoverPosition="bottom" />
        <div className="border-t border-dashed border-border my-4" />
        <p className="text-xs text-muted-foreground mb-3 text-center font-medium">Pastki jag' (Mandibula)</p>
        <ToothRow teeth={TEETH_LOWER} toothChart={toothChart} onSetStatus={onSetToothStatus} onSelectTooth={setSelectedTooth} selectedTooth={selectedTooth} popoverPosition="top" />
      </div>

      {/* Selected tooth detail panel */}
      {selectedTooth && statusInfo && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold", statusInfo.color)}>
                {selectedTooth}
              </div>
              <div>
                <p className="font-bold text-foreground">Tish #{selectedTooth}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn(statusInfo.color, "text-white")}>{statusInfo.emoji} {statusInfo.label}</Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTooth(null)}>✕</Button>
          </div>

          {/* Quick actions for this tooth */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" className="justify-start">
              <ClipboardList className="w-4 h-4 mr-2" /> Davolash boshlash
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <FileText className="w-4 h-4 mr-2" /> Retsept yozish
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <FlaskConical className="w-4 h-4 mr-2" /> Labga yuborish
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              📸 Rasm qo'shish
            </Button>
          </div>

          {/* Status change */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Statusni o'zgartirish:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TOOTH_STATUSES).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => onSetToothStatus(selectedTooth, k)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border transition-all",
                    currentStatus === k ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", v.color)} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalToothChart;
