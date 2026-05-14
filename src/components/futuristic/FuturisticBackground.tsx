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

      {/* Glow blobs */}
      <div
        className="glow-blob bg-[hsl(214,84%,56%)] animate-pulse-slow"
        style={{ top: "-8rem", left: "-8rem", width: 520, height: 520, opacity: isDark ? 0.35 : 0.15 }}
      />
      <div
        className="glow-blob bg-[hsl(250,100%,69%)] animate-pulse-slow"
        style={{ top: "30%", right: "-10rem", width: 600, height: 600, opacity: isDark ? 0.32 : 0.14 }}
      />
      <div
        className="glow-blob bg-cyan-400 animate-pulse-slow"
        style={{ bottom: 0, left: "30%", width: 480, height: 480, opacity: isDark ? 0.18 : 0.08 }}
      />

      {/* Particles */}
      {particles > 0 && (
        <svg className={cn("absolute inset-0 w-full h-full", isDark ? "opacity-60" : "opacity-40")}>
          {Array.from({ length: particles }).map((_, i) => {
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
                  filter: "drop-shadow(0 0 6px currentColor)",
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
