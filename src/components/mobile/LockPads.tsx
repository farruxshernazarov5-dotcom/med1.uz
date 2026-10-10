import { useRef, useState, type PointerEvent } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

/** Numeric PIN keypad with large thumb-friendly keys. */
export const PinPad = ({ length = 4, onComplete, disabled }: { length?: number; onComplete: (pin: string) => void; disabled?: boolean }) => {
  const [pin, setPin] = useState("");
  const press = (d: string) => {
    if (disabled) return;
    const next = (pin + d).slice(0, length);
    setPin(next);
    if (next.length === length) { window.setTimeout(() => { onComplete(next); setPin(""); }, 120); }
  };
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3" aria-label={`${pin.length} / ${length} raqam kiritildi`}>
        {Array.from({ length }, (_, i) => (
          <span key={i} className={cn("h-3.5 w-3.5 rounded-full border-2 border-primary transition", i < pin.length && "bg-primary")} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" disabled={disabled} onClick={() => press(d)} className="h-16 w-16 rounded-full bg-muted text-2xl font-semibold text-foreground active:scale-95 active:bg-primary/20 disabled:opacity-40">{d}</button>
        ))}
        <span />
        <button type="button" disabled={disabled} onClick={() => press("0")} className="h-16 w-16 rounded-full bg-muted text-2xl font-semibold text-foreground active:scale-95 disabled:opacity-40">0</button>
        <button type="button" aria-label="O‘chirish" onClick={() => setPin((p) => p.slice(0, -1))} className="flex h-16 w-16 items-center justify-center rounded-full text-muted-foreground active:scale-95"><Delete /></button>
      </div>
    </div>
  );
};

/** 3×3 pattern ("grafik kalit"): drag across at least 4 dots. */
export const PatternPad = ({ onComplete, disabled, error }: { onComplete: (pattern: string) => void; disabled?: boolean; error?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const SIZE = 264;
  const pos = (i: number) => ({ x: (i % 3) * (SIZE / 3) + SIZE / 6, y: Math.floor(i / 3) * (SIZE / 3) + SIZE / 6 });

  const hit = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * SIZE;
    const y = ((e.clientY - r.top) / r.height) * SIZE;
    for (let i = 0; i < 9; i++) { const p = pos(i); if (Math.hypot(p.x - x, p.y - y) < 32) return i; }
    return -1;
  };
  const add = (e: PointerEvent) => { const i = hit(e); if (i >= 0) setPath((p) => (p.includes(i) ? p : [...p, i])); };
  const end = () => {
    if (!drawing) return;
    setDrawing(false);
    const done = path;
    window.setTimeout(() => setPath([]), 250);
    if (done.length >= 4) onComplete(done.join("-"));
    else if (done.length) onComplete("");
  };

  return (
    <div
      ref={ref}
      role="application"
      aria-label="Grafik kalitni chizing"
      className={cn("relative touch-none select-none", disabled && "pointer-events-none opacity-40")}
      style={{ width: SIZE, height: SIZE }}
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setDrawing(true); setPath([]); add(e); }}
      onPointerMove={(e) => drawing && add(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <svg width={SIZE} height={SIZE} className="absolute inset-0">
        <polyline points={path.map((i) => `${pos(i).x},${pos(i).y}`).join(" ")} fill="none" className={error ? "stroke-destructive" : "stroke-primary"} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={pos(i).x} cy={pos(i).y} r={path.includes(i) ? 14 : 9} className={path.includes(i) ? (error ? "fill-destructive" : "fill-primary") : "fill-muted-foreground/40"} />
        ))}
      </svg>
    </div>
  );
};
