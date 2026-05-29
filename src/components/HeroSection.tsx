import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, ArrowRight, Stethoscope, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";
import { FuturisticBackground, GlowCard, LiveStatusPill } from "@/components/futuristic";
import heroImage from "@/assets/hero-medical.webp";

const HeroSection = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden isolate">
        {/* Cinematic backdrop */}
        <div className="absolute inset-0 -z-20">
          <img
            src={heroImage}
            alt=""
            aria-hidden
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover opacity-25"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(213,73%,8%)]/95 via-[hsl(213,73%,10%)]/92 to-[hsl(213,73%,8%)]" />
        </div>

        {/* Futuristic animated layer */}
        <FuturisticBackground variant="dark" particles={6} />

        <div className="relative container mx-auto px-4 py-16 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
            {/* Left: copy + search + CTAs */}
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-up">
                <LiveStatusPill label="Tizim faol • 24/7" tone="green" />
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/70 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04]">
                  <Sparkles className="w-3 h-3 text-[hsl(250,100%,75%)]" />
                  AI-Powered Healthcare Ecosystem
                </span>
              </div>

              <h1
                className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.05] animate-fade-up"
                style={{ animationDelay: "0.1s" }}
              >
                O'zbekistonning yetakchi{" "}
                <span className="text-holo">raqamli sog'liqni</span>{" "}
                saqlash ekotizimi
              </h1>

              <p
                className="text-base md:text-lg text-white/65 mb-8 leading-relaxed max-w-xl animate-fade-up"
                style={{ animationDelay: "0.2s" }}
              >
                Klinikalar, shifokorlar, diagnostika, dorixonalar va 14+ AI tibbiy yordamchi —
                bitta intellektual platformada birlashtirilgan.
              </p>

              {/* Glass search */}
              <div
                className="relative max-w-xl animate-fade-up mb-6"
                style={{ animationDelay: "0.3s" }}
              >
                <button
                  onClick={() => setSearchOpen(true)}
                  className="group w-full flex items-center glass-dark p-1.5 cursor-text hover:border-[hsl(214,84%,56%)]/50 transition"
                >
                  <Search className="w-5 h-5 text-white/50 ml-4 shrink-0 group-hover:text-[hsl(214,84%,66%)] transition" />
                  <span className="flex-1 px-4 py-3 text-white/55 text-left text-sm md:text-base">
                    Kasallik, dori, klinika yoki AI xizmat qidirish...
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-lg text-[11px] font-medium text-white/60 border border-white/10 bg-white/[0.04]">
                    ⌘ K
                  </span>
                  <span className="btn-magnetic inline-flex items-center gap-1.5 bg-gradient-to-r from-[hsl(214,84%,56%)] to-[hsl(250,100%,69%)] text-white border-0 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-glow-sm">
                    Qidirish
                  </span>
                </button>
              </div>

              {/* CTAs */}
              <div
                className="flex flex-wrap gap-3 animate-fade-up"
                style={{ animationDelay: "0.4s" }}
              >
                <Button
                  asChild
                  size="lg"
                  className="btn-magnetic bg-gradient-to-r from-[hsl(214,84%,56%)] to-[hsl(250,100%,69%)] hover:opacity-95 text-white border-0 rounded-xl px-6 shadow-glow-sm"
                >
                  <Link to="/clinics">
                    Klinika band qilish
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white backdrop-blur"
                >
                  <Link to="/ai-services">
                    <Sparkles className="w-4 h-4 mr-2 text-[hsl(250,100%,75%)]" />
                    AI Yordamchi
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06]"
                >
                  <Link to="/developers">
                    Developers Portal
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div
                className="grid grid-cols-3 gap-3 mt-10 max-w-xl animate-fade-up"
                style={{ animationDelay: "0.5s" }}
              >
                {[
                  { value: "20,000+", label: "Tibbiy atamalar" },
                  { value: "25,000+", label: "Dori vositalari" },
                  { value: "14+", label: "AI modullar" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-dark px-4 py-3 text-left"
                  >
                    <p className="text-xl md:text-2xl font-heading font-bold text-white tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-[11px] md:text-xs text-white/55 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: floating ecosystem cards */}
            <div className="hidden lg:block relative h-[480px] animate-fade-up" style={{ animationDelay: "0.3s" }}>
              {/* Decorative orbital ring */}
              <div className="absolute inset-8 rounded-full border border-white/10" />
              <div
                className="absolute inset-16 rounded-full border border-[hsl(214,84%,56%)]/20"
                style={{ animation: "spin 24s linear infinite" }}
              />

              <GlowCard
                tone="blue"
                glow
                className="absolute top-2 left-4 w-56 animate-float-y"
                style={{ animationDelay: "0s" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(214,84%,56%)]/20 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-[hsl(214,84%,66%)]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/55">Faol klinikalar</p>
                    <p className="text-lg font-bold text-white">1,240+</p>
                  </div>
                </div>
              </GlowCard>

              <GlowCard
                tone="purple"
                glow
                className="absolute top-32 right-2 w-60 animate-float-y"
                style={{ animationDelay: "1.2s" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(250,100%,69%)]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[hsl(250,100%,80%)]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/55">AI Tashxis</p>
                    <p className="text-sm font-semibold text-white leading-snug">
                      Gemini 3 Flash · 14 modul live
                    </p>
                  </div>
                </div>
              </GlowCard>

              <GlowCard
                tone="cyan"
                glow
                className="absolute bottom-20 left-2 w-56 animate-float-y"
                style={{ animationDelay: "2.4s" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/15 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-xs text-white/55">Bugungi tashriflar</p>
                    <p className="text-lg font-bold text-white">8,512</p>
                  </div>
                </div>
              </GlowCard>

              <GlowCard
                tone="neutral"
                className="absolute bottom-2 right-6 w-52 animate-float-y"
                style={{ animationDelay: "3s" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/15 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-xs text-white/55">Xavfsizlik</p>
                    <p className="text-sm font-semibold text-white">RLS · HMAC · 99.9%</p>
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </div>
      </section>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default HeroSection;
