/**
 * Futuristic animated background for the Developer Portal.
 * - Animated gradient grid
 * - Floating particles
 * - Neon glow blobs
 * Pure CSS / SVG, no extra deps.
 */
const FuturisticBg = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base */}
      <div className="absolute inset-0 bg-[hsl(213,73%,8%)]" />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(47,128,237,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(47,128,237,0.35) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 90%)",
          animation: "grid-pan 28s linear infinite",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-[hsl(214,84%,56%)]/25 blur-[120px] animate-pulse-slow" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-[hsl(250,100%,69%)]/25 blur-[140px] animate-pulse-slow" />
      <div className="absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full bg-cyan-400/15 blur-[120px] animate-pulse-slow" />

      {/* Floating particles */}
      <svg className="absolute inset-0 w-full h-full opacity-60">
        {Array.from({ length: 24 }).map((_, i) => {
          const cx = (i * 137) % 100;
          const cy = (i * 53) % 100;
          const r = (i % 3) + 1;
          const dur = 8 + (i % 6);
          return (
            <circle
              key={i}
              cx={`${cx}%`}
              cy={`${cy}%`}
              r={r}
              fill={i % 3 === 0 ? "#7B61FF" : i % 3 === 1 ? "#2F80ED" : "#22D3EE"}
              style={{
                filter: "drop-shadow(0 0 6px currentColor)",
                animation: `float-y ${dur}s ease-in-out ${i * 0.3}s infinite alternate`,
              }}
            />
          );
        })}
      </svg>

      <style>{`
        @keyframes grid-pan {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 44px 44px, 44px 44px; }
        }
        @keyframes float-y {
          from { transform: translateY(0px); opacity: 0.4; }
          to   { transform: translateY(-30px); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
};

export default FuturisticBg;
