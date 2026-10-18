import { useEffect, useRef } from "react";
import { Activity, Heart, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  data: React.MutableRefObject<number[]>;
  active: boolean;
  bpm: number | null;
  resp: number | null;
  stress: string | null;
};

const STRESS_LEVEL: Record<string, number> = { past: 25, "o'rta": 60, "o‘rta": 60, yuqori: 90 };

/** Live monitor shown during a measurement: scrolling heart trace, breathing wave and stress gauge. */
const VitalLiveMonitor = ({ data, active, bpm, resp, stress }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ bpm, resp });
  live.current = { bpm, resp };

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const c = ref.current;
      if (c) {
        const dpr = devicePixelRatio || 1;
        const w = (c.width = c.clientWidth * dpr);
        const h = (c.height = c.clientHeight * dpr);
        const ctx = c.getContext("2d")!;
        const css = getComputedStyle(c);
        const tok = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
        const heart = `hsl(${tok("--destructive", "0 84% 60%")})`;
        const lung = `hsl(${tok("--primary", "200 80% 50%")})`;
        const grid = `hsl(${tok("--border", "220 13% 60%")} / 0.6)`;
        const t = (performance.now() - t0) / 1000;
        const top = h * 0.62; // heart band; breathing band below
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = grid; ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 16 * dpr) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 16 * dpr) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

        // Heart trace: real filtered signal, or a calibration sweep until data arrives.
        const pts = data.current.slice(-180);
        ctx.strokeStyle = heart; ctx.lineWidth = 2.5 * dpr; ctx.lineJoin = "round";
        ctx.shadowColor = heart; ctx.shadowBlur = 10;
        ctx.beginPath();
        if (pts.length > 10) {
          const max = Math.max(...pts.map(Math.abs)) || 1;
          pts.forEach((v, i) => {
            const x = (i / (pts.length - 1)) * w, y = top / 2 - (v / max) * top * 0.42;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.stroke();
          const lx = w - 3 * dpr, ly = top / 2 - (pts[pts.length - 1] / max) * top * 0.42;
          ctx.fillStyle = heart; ctx.beginPath(); ctx.arc(lx, ly, 4 * dpr, 0, Math.PI * 2); ctx.fill();
        } else {
          const sweep = ((t * 0.35) % 1) * w;
          ctx.globalAlpha = 0.5;
          ctx.moveTo(0, top / 2); ctx.lineTo(sweep, top / 2); ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = heart; ctx.beginPath(); ctx.arc(sweep, top / 2, 3.5 * dpr, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Breathing wave at the measured respiratory rate.
        const rr = live.current.resp ?? 0;
        const f = (rr || 14) / 60;
        ctx.strokeStyle = lung; ctx.lineWidth = 2 * dpr; ctx.globalAlpha = rr ? 1 : 0.35;
        ctx.setLineDash(rr ? [] : [6 * dpr, 6 * dpr]);
        ctx.beginPath();
        const mid = top + (h - top) / 2, amp = (h - top) * 0.32;
        for (let x = 0; x <= w; x += 3 * dpr) {
          const y = mid - Math.sin(2 * Math.PI * (f * (t - (w - x) / w * 8))) * amp;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      if (active) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, data]);

  const lvl = stress ? STRESS_LEVEL[stress.toLowerCase()] ?? 50 : 0;
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-destructive/10 p-2">
          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><Heart className={cn("h-3.5 w-3.5 text-destructive", bpm && "animate-pulse")} fill="currentColor" />Yurak ritmi</p>
          <p className="text-xl font-bold tabular-nums text-foreground">{bpm ?? "—"}<span className="text-[10px] font-normal text-muted-foreground"> bpm</span></p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2">
          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><Wind className="h-3.5 w-3.5 text-primary" />Nafas</p>
          <p className="text-xl font-bold tabular-nums text-foreground">{resp ?? "—"}<span className="text-[10px] font-normal text-muted-foreground"> /daq</span></p>
        </div>
        <div className="rounded-xl bg-muted p-2">
          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><Activity className="h-3.5 w-3.5" />Stress</p>
          <p className="text-sm font-bold capitalize text-foreground">{stress ?? "aniqlanmoqda"}</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
            <div className={cn("h-full rounded-full transition-all duration-700", lvl > 75 ? "bg-destructive" : lvl > 40 ? "bg-secondary" : "bg-primary")} style={{ width: `${lvl}%` }} />
          </div>
        </div>
      </div>
      <canvas ref={ref} className="h-36 w-full rounded-xl bg-muted/50" aria-label="Jonli yurak ritmi va nafas to‘lqini" />
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>▲ Yurak ritmi (PPG)</span><span>▼ Nafas harakati</span></div>
    </div>
  );
};

export default VitalLiveMonitor;
