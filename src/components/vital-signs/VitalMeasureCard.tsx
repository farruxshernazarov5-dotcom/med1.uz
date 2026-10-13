import { useState } from "react";
import { Fingerprint, ScanFace, Watch, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import FingerPPGSensor from "./FingerPPGSensor";
import FaceRPPGSensor from "./FaceRPPGSensor";
import WearablesPanel from "./WearablesPanel";
import type { VitalReading, VitalSource } from "./types";

const SOURCES: { id: VitalSource; label: string; hint: string; icon: typeof Fingerprint }[] = [
  { id: "finger", label: "Barmoq (PPG)", hint: "Orqa kamera + fonar", icon: Fingerprint },
  { id: "face", label: "Yuz (rPPG)", hint: "Old kamera", icon: ScanFace },
  { id: "watch", label: "Smart Watch", hint: "BLE / Health", icon: Watch },
];

const VitalMeasureCard = ({ onResult, onStatus }: { onResult: (r: VitalReading) => void; onStatus?: (k: string) => void }) => {
  const [src, setSrc] = useState<VitalSource>("finger");
  const [last, setLast] = useState<VitalReading | null>(null);
  const handle = (r: VitalReading) => { setLast(r); onResult(r); };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
      <div role="tablist" aria-label="O‘lchov manbasi" className="grid grid-cols-3 gap-2">
        {SOURCES.map(({ id, label, hint, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={src === id} onClick={() => setSrc(id)}
            className={cn("rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              src === id ? "border-primary bg-primary/10" : "border-border hover:bg-muted")}>
            <Icon className={cn("w-5 h-5 mb-1", src === id ? "text-primary" : "text-muted-foreground")} />
            <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{label}</p>
            <p className="text-[10px] text-muted-foreground hidden sm:block">{hint}</p>
          </button>
        ))}
      </div>

      {src === "finger" && <FingerPPGSensor key="f" onResult={handle} onStatus={onStatus} />}
      {src === "face" && <FaceRPPGSensor key="c" onResult={handle} onStatus={onStatus} />}
      {src === "watch" && <WearablesPanel onResult={handle} />}

      {last && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            ["Puls", `${last.bpm} bpm`],
            ["HRV (RMSSD)", last.rmssd ? `${last.rmssd} ms` : "—"],
            ["Stress", last.stress ?? "—"],
            [last.respRate ? "Nafas" : "Ishonchlilik", last.respRate ? `${last.respRate}/daq` : `${last.confidence}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-muted/60 p-2"><p className="text-[10px] text-muted-foreground">{k}</p><p className="text-sm font-bold text-foreground capitalize">{v}</p></div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground flex items-start gap-1"><Activity className="w-3 h-3 mt-0.5 shrink-0" />Kamera va soat o‘lchovlari taxminiy. Tibbiy qurilma o‘rnini bosmaydi.</p>
    </div>
  );
};

export default VitalMeasureCard;
