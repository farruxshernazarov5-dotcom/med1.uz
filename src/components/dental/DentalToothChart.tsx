import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";

const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

const TOOTH_STATUSES: Record<string, { label: string; color: string }> = {
  healthy: { label: "Sog'lom", color: "bg-green-500" },
  caries: { label: "Kariyes", color: "bg-yellow-500" },
  filled: { label: "Plomba", color: "bg-blue-500" },
  crown: { label: "Koronka", color: "bg-purple-500" },
  missing: { label: "Yo'q", color: "bg-red-500" },
  implant: { label: "Implant", color: "bg-cyan-500" },
};

interface DentalToothChartProps {
  selectedPatient: any | null;
  toothChart: Record<number, string>;
  onSetToothStatus: (toothNum: number, status: string) => void;
  onBack: () => void;
}

const ToothRow = ({ teeth, toothChart, onSetStatus, popoverPosition }: {
  teeth: number[]; toothChart: Record<number, string>;
  onSetStatus: (t: number, s: string) => void; popoverPosition: "top" | "bottom";
}) => (
  <div className="flex justify-center gap-1 flex-wrap">
    {teeth.map(t => {
      const status = toothChart[t] || "healthy";
      return (
        <div key={t} className="relative group">
          <button className={cn(
            "w-9 h-9 rounded-lg border-2 border-border text-xs font-bold flex items-center justify-center transition-all hover:scale-110",
            TOOTH_STATUSES[status]?.color || "bg-muted", "text-white"
          )}>
            {t}
          </button>
          <div className={cn(
            "absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg z-50 p-1 min-w-[100px]",
            popoverPosition === "bottom" ? "top-full mt-1" : "bottom-full mb-1"
          )}>
            {Object.entries(TOOTH_STATUSES).map(([k, v]) => (
              <button key={k} onClick={() => onSetStatus(t, k)} className="text-xs px-2 py-1 text-left hover:bg-muted rounded flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", v.color)} /> {v.label}
              </button>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const DentalToothChart = ({ selectedPatient, toothChart, onSetToothStatus, onBack }: DentalToothChartProps) => {
  if (!selectedPatient) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Bemorlar bo'limidan bemor tanlab tish xaritasini oching</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
        </Button>
        <h2 className="font-heading text-xl font-bold text-foreground">🦷 {selectedPatient.full_name} — Tish xaritasi</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(TOOTH_STATUSES).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1">
            <div className={cn("w-3 h-3 rounded-full", v.color)} />
            <span className="text-xs text-muted-foreground">{v.label}</span>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-xs text-muted-foreground mb-3 text-center">Yuqori jag'</p>
        <ToothRow teeth={TEETH_UPPER} toothChart={toothChart} onSetStatus={onSetToothStatus} popoverPosition="bottom" />
        <p className="text-xs text-muted-foreground mt-4 mb-3 text-center">Pastki jag'</p>
        <ToothRow teeth={TEETH_LOWER} toothChart={toothChart} onSetStatus={onSetToothStatus} popoverPosition="top" />
      </div>
    </div>
  );
};

export default DentalToothChart;
