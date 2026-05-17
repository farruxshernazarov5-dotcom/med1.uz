/**
 * Cinematic animated services showcase — homepage hero ecosystem.
 * Inspired by premium AI SaaS landing pages (thumbnailcreator-style).
 *
 * - Uses cleaned uploaded photos as living visual cards
 * - Mouse-tilt parallax + glow on hover
 * - Floating, glassy, holographic feel
 * - Pure CSS animations (no extra deps) for perf
 */
import { useRef, useState, useEffect, MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope, UserRound, Microscope, Brain, Pill, Smile,
  Sparkles, ShieldCheck, FileText, CalendarCheck, Bot, BookOpen,
  ArrowRight, Zap, Settings2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

import { FuturisticBackground, LiveStatusPill } from "@/components/futuristic";
import patientImg from "@/assets/showcase-patient-ecosystem.jpg";
import doctorImg from "@/assets/showcase-ai-doctor.jpg";
import networkImg from "@/assets/showcase-network-3d.jpg";
import diagImg from "@/assets/showcase-ai-diagnostics.jpg";

type Service = {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  tone: string; // tailwind gradient
};

const services: Service[] = [
  { icon: Stethoscope, title: "Klinikalar", desc: "200+ klinika ulangan", href: "/clinics", tone: "from-[#2F80ED] to-sky-400" },
  { icon: UserRound, title: "Shifokorlar", desc: "Mutaxassislardan onlayn yordam", href: "/doctors", tone: "from-emerald-500 to-teal-400" },
  { icon: Microscope, title: "Diagnostika", desc: "Lab & instrumental tekshiruvlar", href: "/diagnostics", tone: "from-rose-500 to-pink-400" },
  { icon: Brain, title: "AI Tibbiy Yordam", desc: "Gemini 3 Flash asosida", href: "/ai-services", tone: "from-[#7B61FF] to-fuchsia-400" },
  { icon: Pill, title: "Dorixonalar", desc: "Onlayn dori qidiruv", href: "/medicine", tone: "from-cyan-500 to-cyan-300" },
  { icon: Smile, title: "Stomatologiya", desc: "Tish parvarish ekotizimi", href: "/services", tone: "from-indigo-500 to-blue-400" },
  { icon: Sparkles, title: "Kosmetologiya", desc: "Estetik tibbiyot xizmatlari", href: "/cosmetology", tone: "from-fuchsia-500 to-pink-400" },
  { icon: ShieldCheck, title: "Sug'urta", desc: "Sog'liqni himoya qilish", href: "/services", tone: "from-amber-500 to-orange-400" },
  { icon: FileText, title: "EMR / HMS", desc: "Elektron tibbiy kartalar", href: "/dashboard", tone: "from-violet-500 to-purple-400" },
  { icon: CalendarCheck, title: "Onlayn Yozilish", desc: "24/7 navbat tizimi", href: "/booking", tone: "from-green-500 to-emerald-400" },
  { icon: Bot, title: "AI Assistent", desc: "Shaxsiy tibbiy yordamchi", href: "/ai-health-assistant", tone: "from-[#2F80ED] to-[#7B61FF]" },
  { icon: BookOpen, title: "Tibbiy Ensiklopediya", desc: "12 000+ maqola UZ/EN", href: "/knowledge", tone: "from-teal-500 to-cyan-400" },
];

const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - y) * 8;
    const ry = (x - 0.5) * 10;
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[hsl(213,60%,12%)]/80 backdrop-blur-xl transition-transform duration-300 will-change-transform ${className}`}
      style={{
        transform: "perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0))",
      }}
    >
      {/* Cursor light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(123,97,255,0.22), transparent 55%)",
        }}
      />
      {children}
    </div>
  );
};

const NET_KEY = "med1.svcNetSettings.v1";
const DEFAULTS = { speed: 6, intensity: 1, pulse: 1.4 };

const AnimatedServicesShowcase = () => {
  const [net, setNet] = useState(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NET_KEY);
      if (raw) setNet({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(NET_KEY, JSON.stringify(net)); } catch {}
  }, [net]);

  const netStyle = {
    ["--svc-speed" as any]: `${net.speed}s`,
    ["--svc-intensity" as any]: `${net.intensity}`,
    ["--svc-pulse" as any]: `${net.pulse}s`,
  } as React.CSSProperties;

  return (
    <section className="relative isolate overflow-hidden py-20">
      <div className="absolute inset-0 -z-20 bg-[hsl(213,73%,8%)]" />
      <FuturisticBackground variant="dark" particles={10} aurora />

      <div className="relative container mx-auto px-4">
        {/* Heading */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <LiveStatusPill label="Live ekotizim · 14 modul" tone="blue" className="mb-5" />
          <h2 className="font-heading text-3xl font-bold leading-tight text-white md:text-5xl">
            Bog'langan{" "}
            <span className="text-holo">AI tibbiyot</span> ekotizimi
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/65 md:text-base">
            Klinikalar, dorixonalar, laboratoriyalar, shifokorlar va AI yadro —
            barchasi bitta zamonaviy infrastrukturada birlashgan.
          </p>
        </div>

        {/* Hero bento (4 cinematic visual cards) */}
        <div className="mb-10 grid gap-4 md:grid-cols-6 md:grid-rows-2">
          {/* Big patient card */}
          <TiltCard className="md:col-span-3 md:row-span-2 min-h-[320px] md:min-h-[520px]">
            <img
              src={patientImg}
              alt="Bemorlar uchun bog'langan tibbiy ekotizim"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-95 transition-transform duration-[1.6s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213,73%,6%)] via-[hsl(213,73%,8%)]/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <LiveStatusPill label="Bemorlar uchun" tone="blue" className="mb-3" />
              <h3 className="font-heading text-2xl font-bold text-white md:text-3xl">
                Cho'ntagingizdagi sog'liq markazi
              </h3>
              <p className="mt-2 max-w-md text-sm text-white/75">
                Klinika, dorixona va laboratoriya — bitta ilovada. AI yordamchi
                har bir bemor uchun shaxsiy yo'nalish beradi.
              </p>
              <Link to="/ai-health-assistant">
                <Button size="sm" className="btn-magnetic mt-4 rounded-xl bg-white/10 text-white hover:bg-white/15">
                  Boshlash <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </TiltCard>

          {/* AI doctor */}
          <TiltCard className="md:col-span-3 min-h-[240px]">
            <img
              src={doctorImg}
              alt="AI yordamida tibbiy tashxis"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-[1.6s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(213,73%,8%)]/85 via-[hsl(213,73%,8%)]/35 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center p-6 md:p-8">
              <LiveStatusPill label="Shifokorlar uchun" tone="green" className="mb-3 w-fit" />
              <h3 className="font-heading text-xl font-bold text-white md:text-2xl">
                AI yordamchi <span className="text-holo">14 modul</span>
              </h3>
              <p className="mt-1.5 text-sm text-white/70">
                Diagnostika, rentgen, retsept va EMR — Gemini 3 Flash asosida.
              </p>
            </div>
          </TiltCard>

          {/* Diagnostics */}
          <TiltCard className="md:col-span-3 min-h-[240px]">
            <img
              src={diagImg}
              alt="AI diagnostika va anomaliya aniqlash"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-[1.6s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[hsl(213,73%,8%)]/85 via-[hsl(213,73%,8%)]/35 to-transparent" />
            <div className="absolute inset-y-0 right-0 flex max-w-md flex-col justify-center p-6 text-right md:p-8">
              <LiveStatusPill label="99% aniqlik" tone="blue" className="mb-3 ml-auto w-fit" />
              <h3 className="font-heading text-xl font-bold text-white md:text-2xl">
                Erta diagnostika tizimi
              </h3>
              <p className="mt-1.5 text-sm text-white/70">
                Anomaliyalarni soniyalar ichida aniqlash, radiologiya va lab tahlili.
              </p>
            </div>
          </TiltCard>
        </div>

        {/* Network strip (3D image) */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-white/10">
          <div className="relative aspect-[21/9] w-full">
            <img
              src={networkImg}
              alt="MED-ALL AI raqamli tibbiy infrastruktura"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213,73%,6%)] via-transparent to-[hsl(213,73%,6%)]/60" />
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-2xl px-6">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85 backdrop-blur-md">
                  <Zap className="h-3 w-3 text-[#7B61FF]" /> Real vaqt raqamli infrastruktura
                </div>
                <h3 className="font-heading text-2xl font-bold text-white md:text-4xl">
                  Bir tarmoq — <span className="text-holo">cheksiz imkoniyat</span>
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm text-white/75 md:text-base">
                  Klinikalar, dorixonalar va AI yadro xavfsiz ulanish orqali real
                  vaqtda ma'lumot almashinadi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Service grid with animated network overlay */}
        <div className="svc-net relative" style={netStyle}>
          {/* Network settings */}
          <div className="absolute -top-2 right-0 z-30 sm:-top-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-full border-white/15 bg-white/5 px-3 text-[11px] text-white/80 backdrop-blur-md hover:bg-white/10 hover:text-white"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Tarmoq
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 border-white/10 bg-[hsl(213,60%,10%)]/95 text-white backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/90">Tarmoq animatsiyasi</p>
                  <button
                    onClick={() => setNet(DEFAULTS)}
                    className="inline-flex items-center gap-1 text-[10px] text-white/60 hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3" /> reset
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-[11px] text-white/70">
                      <span>Tezlik</span>
                      <span className="text-white/50">{(12 - net.speed).toFixed(1)}×</span>
                    </div>
                    <Slider
                      min={2} max={12} step={0.5}
                      value={[12 - net.speed]}
                      onValueChange={(v) => setNet((n) => ({ ...n, speed: 12 - v[0] }))}
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-[11px] text-white/70">
                      <span>Rang intensivligi</span>
                      <span className="text-white/50">{net.intensity.toFixed(2)}</span>
                    </div>
                    <Slider
                      min={0.2} max={1.6} step={0.05}
                      value={[net.intensity]}
                      onValueChange={(v) => setNet((n) => ({ ...n, intensity: v[0] }))}
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-[11px] text-white/70">
                      <span>Puls chastotasi</span>
                      <span className="text-white/50">{(3 - net.pulse).toFixed(2)} Hz</span>
                    </div>
                    <Slider
                      min={0.4} max={2.8} step={0.1}
                      value={[3 - net.pulse]}
                      onValueChange={(v) => setNet((n) => ({ ...n, pulse: 3 - v[0] }))}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Network connection layer — animated lines + pulsing digital nodes */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="svc-line" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#2F80ED" stopOpacity="0" />
                <stop offset="50%" stopColor="#7B61FF" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="svc-line-v" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2F80ED" stopOpacity="0" />
                <stop offset="50%" stopColor="#7B61FF" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal lattice lines (between card rows) */}
            {[33.33, 66.66].map((y, i) => (
              <g key={`h-${i}`}>
                <line
                  x1="0%" x2="100%" y1={`${y}%`} y2={`${y}%`}
                  stroke="url(#svc-line)" strokeWidth="1"
                  strokeDasharray="4 8"
                  className="svc-line-dash"
                  style={{ animationDelay: `${i * 0.6}s` }}
                />
                <circle r="3" fill="#22D3EE" className="svc-travel-node">
                  <animateMotion
                    dur={`${5 + i}s`}
                    repeatCount="indefinite"
                    path={`M 0 ${y * 5} L 1200 ${y * 5}`}
                  />
                </circle>
              </g>
            ))}

            {/* Vertical lattice lines (between card cols, lg only) */}
            {[25, 50, 75].map((x, i) => (
              <line
                key={`v-${i}`}
                x1={`${x}%`} x2={`${x}%`} y1="0%" y2="100%"
                stroke="url(#svc-line-v)" strokeWidth="1"
                strokeDasharray="3 9"
                className="hidden lg:block svc-line-dash"
                style={{ animationDelay: `${i * 0.4 + 0.2}s` }}
              />
            ))}
          </svg>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {services.map((s, idx) => {
              const Icon = s.icon;
              return (
                <Link key={s.title} to={s.href} className="group block">
                  <TiltCard className="h-full p-5">
                    {/* Pulsing digital node (connection point) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-3 top-3 z-20 flex h-2.5 w-2.5"
                      style={{ animationDelay: `${(idx % 6) * 0.25}s` }}
                    >
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22D3EE] opacity-70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7B61FF] shadow-[0_0_8px_#7B61FF]" />
                    </span>

                    {/* Corner connector ticks */}
                    <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-[#2F80ED]/40" />
                    <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-[#7B61FF]/40" />

                    <div className="relative z-10 flex flex-col gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.tone} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-semibold text-white md:text-base">
                          {s.title}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-white/60">
                          {s.desc}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-white/50 transition-colors group-hover:text-white">
                        Batafsil <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Hover glow line */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7B61FF]/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    {/* Hover: outgoing connection beam (top edge) */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-px left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-[#22D3EE] via-[#7B61FF] to-transparent opacity-0 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-80"
                    />
                  </TiltCard>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/services">
            <Button
              size="lg"
              className="btn-magnetic rounded-xl bg-gradient-to-r from-[#2F80ED] to-[#7B61FF] text-white shadow-glow-sm"
            >
              Barcha xizmatlar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/ai-subscription">
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              AI tariflar
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AnimatedServicesShowcase;
