/**
 * Animated network infrastructure visualization.
 * Shows the data flow: Mobile App → API Gateway → Clinic HMS / AI / DB.
 */
const nodes = [
  { id: "mobile", label: "Mobile / Web", x: 60, y: 140, color: "#22D3EE" },
  { id: "gateway", label: "API Gateway", x: 290, y: 140, color: "#2F80ED" },
  { id: "ai", label: "AI Services", x: 540, y: 60, color: "#7B61FF" },
  { id: "hms", label: "Clinic HMS", x: 540, y: 140, color: "#22C55E" },
  { id: "db", label: "Medical DB", x: 540, y: 220, color: "#F59E0B" },
];
const edges: Array<[string, string]> = [
  ["mobile", "gateway"],
  ["gateway", "ai"],
  ["gateway", "hms"],
  ["gateway", "db"],
];

const pos = (id: string) => nodes.find((n) => n.id === id)!;

const NetworkFlow = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 font-semibold">
          Live Infrastructure
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] text-emerald-300 font-mono">all systems operational</span>
        </div>
      </div>

      <svg viewBox="0 0 620 280" className="w-full h-auto">
        <defs>
          <linearGradient id="line-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#2F80ED" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#7B61FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map(([a, b], i) => {
          const A = pos(a);
          const B = pos(b);
          return (
            <g key={i}>
              <line
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke="url(#line-grad)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              {/* Travelling pulse */}
              <circle r="3.5" fill="#7B61FF" filter="url(#glow)">
                <animateMotion
                  dur={`${2.5 + i * 0.4}s`}
                  repeatCount="indefinite"
                  path={`M ${A.x} ${A.y} L ${B.x} ${B.y}`}
                />
              </circle>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => (
          <g key={n.id} filter="url(#glow)">
            <circle
              cx={n.x}
              cy={n.y}
              r="22"
              fill="rgba(10, 37, 64, 0.9)"
              stroke={n.color}
              strokeWidth="1.5"
            />
            <circle cx={n.x} cy={n.y} r="6" fill={n.color}>
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              x={n.x}
              y={n.y + 42}
              textAnchor="middle"
              fontSize="11"
              fontFamily="ui-monospace, monospace"
              fill="rgba(255,255,255,0.8)"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default NetworkFlow;
