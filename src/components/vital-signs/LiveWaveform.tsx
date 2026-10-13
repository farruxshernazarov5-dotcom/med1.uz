import { useEffect, useRef } from "react";

/** ECG-style scrolling trace. `data` is a ref to the latest filtered samples. */
const LiveWaveform = ({ data, active }: { data: React.MutableRefObject<number[]>; active: boolean }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const c = ref.current;
      if (c) {
        const ctx = c.getContext("2d")!;
        const w = (c.width = c.clientWidth * devicePixelRatio);
        const h = (c.height = c.clientHeight * devicePixelRatio);
        const css = getComputedStyle(c);
        const grid = `hsl(${css.getPropertyValue("--border").trim() || "220 13% 40%"} / 0.5)`;
        const line = `hsl(${css.getPropertyValue("--primary").trim() || "142 70% 45%"})`;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = grid; ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 20 * devicePixelRatio) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 20 * devicePixelRatio) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        const pts = data.current.slice(-180);
        if (pts.length > 2) {
          const max = Math.max(...pts.map(Math.abs)) || 1;
          ctx.strokeStyle = line; ctx.lineWidth = 2.5 * devicePixelRatio; ctx.lineJoin = "round";
          ctx.shadowColor = line; ctx.shadowBlur = 8;
          ctx.beginPath();
          pts.forEach((v, i) => {
            const x = (i / 179) * w, y = h / 2 - (v / max) * h * 0.4;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.stroke();
        }
      }
      if (active) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, data]);

  return <canvas ref={ref} className="w-full h-28 rounded-xl bg-muted/60" aria-label="Jonli puls to‘lqini" />;
};

export default LiveWaveform;
