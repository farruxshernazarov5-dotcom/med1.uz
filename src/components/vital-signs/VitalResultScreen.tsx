import { Heart, RotateCcw, Wind, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Colour follows the pulse zone: green normal, amber borderline, red high, blue low. */
export function pulseZone(bpm: number) {
  if (bpm < 50) return { label: "Past puls (bradikardiya)", cls: "from-blue-600 to-sky-500", advice: "Bosh aylanish yoki holsizlik bo‘lsa, kardiologga murojaat qiling." };
  if (bpm < 60) return { label: "Me’yordan biroz past", cls: "from-amber-500 to-yellow-500", advice: "Sportchilarda normal bo‘lishi mumkin. Shikoyat bo‘lsa shifokorga ko‘rining." };
  if (bpm <= 100) return { label: "Normal", cls: "from-emerald-600 to-green-500", advice: "Yurak urishi tinch holat uchun me’yorda." };
  if (bpm <= 120) return { label: "Biroz yuqori", cls: "from-amber-500 to-orange-500", advice: "5 daqiqa dam olib, qayta o‘lchang. Kofe, stress, harakat pulsni oshiradi." };
  return { label: "Yuqori puls (taxikardiya)", cls: "from-red-600 to-rose-500", advice: "Tinch holatda takrorlansa, shifokorga murojaat qiling. Ko‘krak og‘rig‘i bo‘lsa — 103." };
}

type Props = { bpm: number; signal: number; accuracy: number; resp?: number | null; stress?: string | null; spo2?: number | null; rhythm?: string | null; onRetry: () => void };

const VitalResultScreen = ({ bpm, signal, accuracy, resp, stress, spo2, rhythm, onRetry }: Props) => {
  const z = pulseZone(bpm);
  return (
    <div className="space-y-3 animate-fade-in">
      <div className={cn("rounded-2xl bg-gradient-to-br p-6 text-center text-white shadow-lg", z.cls)}>
        <Heart className="mx-auto h-14 w-14 animate-pulse" fill="currentColor" />
        <p className="mt-2 text-6xl font-bold tabular-nums">{bpm}</p>
        <p className="text-sm opacity-90">bpm</p>
        <p className="mt-2 text-lg font-semibold">{z.label}</p>
        {rhythm && <p className="mx-auto mt-2 inline-block rounded-md bg-black/25 px-3 py-1 font-mono text-xs">RITM: {rhythm}</p>}
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm opacity-95">
          <span>Signal: {signal}%</span>
          <span>Aniqlik: {accuracy}%</span>
          {resp ? <span className="inline-flex items-center gap-1"><Wind className="h-4 w-4" />{resp}/daq</span> : null}
          {spo2 ? <span>SpO₂: {spo2}% (taxminiy)</span> : null}
          {stress ? <span className="inline-flex items-center gap-1"><Activity className="h-4 w-4" />Stress: {stress}</span> : null}
        </div>
      </div>
      <p className="rounded-xl border border-border bg-muted/50 p-3 text-sm text-foreground">{z.advice}{accuracy < 50 ? " Aniqlik past — natijani qayta o‘lchab tasdiqlang." : ""}</p>
      <Button onClick={onRetry} className="h-12 w-full"><RotateCcw className="mr-2 h-4 w-4" /> Qayta o‘lchash</Button>
    </div>
  );
};

export default VitalResultScreen;
