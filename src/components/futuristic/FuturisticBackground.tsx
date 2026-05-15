/**
 * Platform-wide animated background.
 * Variants:
 *   - "dark"   : full cinematic dark (dashboards, hero sections)
 *   - "subtle" : light-mode friendly faint grid + soft blobs
 *   - "panel"  : contained, clipped to parent (no fixed inset)
 *
 * Pure CSS / SVG, no extra deps.
 */
import { cn } from "@/lib/utils";

type Variant = "dark" | "subtle" | "panel";

interface Props {
  variant?: Variant;
  particles?: number;
  className?: string;
}

const FuturisticBackground = ({
  variant = "dark",
  particles = 18,
  className,
}: Props) => {
  const isDark = variant !== "subtle";

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none -z-10",
        className
      )}
      aria-hidden
    >
      {/* Base */}
      {variant === "dark" && (
        <div className="absolute inset-0 bg-[hsl(213,73%,8%)]" />
      )}
      {variant === "subtle" && (
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(213,30%,98%)] to-[hsl(213,30%,94%)]" />
      )}

      {/* Grid */}
      <div
        className={cn(
          "absolute inset-0 bg-grid-tech",
          isDark ? "opacity-[0.18]" : "opacity-[0.08]"
        )}
        style={{
          maskImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 90%)",
        }}
      />

      {/* Moving aurora inspired by premium AI interfaces */}
      {variant === "dark" && <div className="aurora-gemini" />}

      {/* Glow blobs (smaller, no animation for perf) */}
      <div
        className="glow-blob bg-[hsl(214,84%,56%)]"
        style={{ top: "-6rem", left: "-6rem", width: 360, height: 360, opacity: isDark ? 0.28 : 0.12 }}
      />
      <div
        className="glow-blob bg-[hsl(250,100%,69%)]"
        style={{ top: "30%", right: "-8rem", width: 420, height: 420, opacity: isDark ? 0.25 : 0.1 }}
      />

      {/* Particles (CSS-only, capped) */}
      {particles > 0 && (
        <svg className={cn("absolute inset-0 w-full h-full", isDark ? "opacity-50" : "opacity-30")}>
          {Array.from({ length: Math.min(particles, 10) }).map((_, i) => {
            const cx = (i * 137) % 100;
            const cy = (i * 53) % 100;
            const r = (i % 3) + 1;
            const dur = 8 + (i % 6);
            const colors = ["#7B61FF", "#2F80ED", "#22D3EE"];
            return (
              <circle
                key={i}
                cx={`${cx}%`}
                cy={`${cy}%`}
                r={r}
                fill={colors[i % 3]}
                style={{
                  animation: `float-y ${dur}s ease-in-out ${i * 0.3}s infinite alternate`,
                }}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default FuturisticBackground;
