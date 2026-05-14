/**
 * Cinematic infrastructure showcase — visualizes the connected
 * MED-ALL ecosystem: Patients ↔ Clinics ↔ AI ↔ Pharmacy ↔ Lab.
 * Pure SVG with animated motion paths for "live data flow".
 */
import { Link } from "react-router-dom";
import { Users, Stethoscope, Sparkles, Pill, FlaskConical, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuturisticBackground, GlowCard, LiveStatusPill } from "@/components/futuristic";

const nodes = [
  { id: "patient", label: "Bemorlar", icon: Users, x: 50, y: 50, tone: "from-[hsl(214,84%,56%)] to-sky-400" },
  { id: "clinic", label: "Klinikalar", icon: Stethoscope, x: 280, y: 50, tone: "from-emerald-500 to-emerald-400" },
  { id: "ai", label: "AI Yadro", icon: Sparkles, x: 510, y: 50, tone: "from-[hsl(250,100%,69%)] to-fuchsia-400" },
  { id: "pharmacy", label: "Dorixonalar", icon: Pill, x: 165, y: 200, tone: "from-cyan-500 to-cyan-400" },
  { id: "lab", label: "Laboratoriyalar", icon: FlaskConical, x: 395, y: 200, tone: "from-rose-500 to-rose-400" },
];

const links: Array<[string, string]> = [
  ["patient", "clinic"],
  ["clinic", "ai"],
  ["clinic", "pharmacy"],
  ["clinic", "lab"],
  ["ai", "lab"],
  ["ai", "pharmacy"],
  ["patient", "pharmacy"],
];

const HomeEcosystemSection = () => {
  const find = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <section className="relative py-16 overflow-hidden isolate">
      <div className="absolute inset-0 -z-20 bg-[hsl(213,73%,8%)]" />
      <FuturisticBackground variant="dark" particles={16} />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <LiveStatusPill label="Live infrastructure" tone="blue" className="mb-4" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            Bog'langan <span className="text-holo">tibbiy ekotizim</span>
          </h2>
          <p className="text-white/60 text-sm md:text-base">
            Klinikalar, AI yadro, dorixonalar va laboratoriyalar bitta xavfsiz infrastruktura orqali real vaqtda almashinadi.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-center">
          {/* SVG network */}
          <div className="glass-dark p-6 ring-neon">
            <svg viewBox="0 0 560 270" className="w-full h-auto" role="img" aria-label="MED-ALL ekotizimi tarmog'i">
              <defs>
                <linearGradient id="line-grad" x1="0" x2="1">
                  <stop offset="0%" stopColor="#2F80ED" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#7B61FF" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.15" />
                </linearGradient>
                <radialGradient id="node-glow">
                  <stop offset="0%" stopColor="#7B61FF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#7B61FF" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Connection lines */}
              {links.map(([a, b], i) => {
                const A = find(a);
                const B = find(b);
                return (
                  <g key={`${a}-${b}`}>
                    <line
                      x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                      stroke="url(#line-grad)"
                      strokeWidth={1.5}
                    />
                    {/* Traveling pulse */}
                    <circle r="3" fill="#22D3EE" opacity="0.95" style={{ filter: "drop-shadow(0 0 6px #22D3EE)" }}>
                      <animateMotion
                        dur={`${4 + (i % 3)}s`}
                        repeatCount="indefinite"
                        path={`M ${A.x} ${A.y} L ${B.x} ${B.y}`}
                        begin={`${i * 0.4}s`}
                      />
                    </circle>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((n) => (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r="40" fill="url(#node-glow)" />
                  <circle cx={n.x} cy={n.y} r="22" fill="#0A2540" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <foreignObject x={n.x - 12} y={n.y - 12} width="24" height="24">
                    <div className="w-6 h-6 flex items-center justify-center text-white">
                      <n.icon className="w-4 h-4" />
                    </div>
                  </foreignObject>
                  <text
                    x={n.x}
                    y={n.y + 38}
                    textAnchor="middle"
                    fontSize="11"
                    fill="rgba(255,255,255,0.75)"
                    fontFamily="Inter, sans-serif"
                  >
                    {n.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Right: feature cards */}
          <div className="space-y-4">
            <GlowCard tone="blue" glow>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(214,84%,56%)]/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[hsl(214,84%,66%)]" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Enterprise xavfsizlik</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    RLS, HMAC imzolar, ko'p ijarali izolyatsiya va 99.9% uptime SLA.
                  </p>
                </div>
              </div>
            </GlowCard>

            <GlowCard tone="purple" glow>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(250,100%,69%)]/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[hsl(250,100%,80%)]" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">AI-yadro</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    14+ AI modul Gemini 3 Flash asosida — diagnostika, retsept, rentgen va ko'proq.
                  </p>
                </div>
              </div>
            </GlowCard>

            <GlowCard tone="cyan" glow>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Ochiq API platforma</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Webhook'lar, REST API va SDK'lar orqali tizimingizni ulang.
                  </p>
                </div>
              </div>
            </GlowCard>

            <Button
              asChild
              size="lg"
              className="btn-magnetic w-full bg-gradient-to-r from-[hsl(214,84%,56%)] to-[hsl(250,100%,69%)] text-white border-0 rounded-xl shadow-glow-sm"
            >
              <Link to="/developers">
                Developers Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeEcosystemSection;
