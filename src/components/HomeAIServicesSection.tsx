import { Link } from "react-router-dom";
import {
  Brain, Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Baby, Palette,
  UtensilsCrossed, Heart, Pill, Dumbbell, ArrowRight, Crown, Sparkles, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuturisticBackground, LiveStatusPill } from "@/components/futuristic";

const aiServices = [
  { icon: Stethoscope, title: "AI Erta Diagnostika", href: "/symptom-checker", tone: "from-[hsl(214,84%,56%)] to-[hsl(214,84%,40%)]" },
  { icon: Bot, title: "AI Shifokor Chat", href: "/ai-doctor-chat", tone: "from-sky-500 to-sky-400" },
  { icon: FileText, title: "Analiz Tahlili", href: "/ai-report-analysis", tone: "from-emerald-500 to-emerald-400" },
  { icon: HeartPulse, title: "Sog'liq Xavfi", href: "/ai-health-risk", tone: "from-rose-500 to-rose-400" },
  { icon: Eye, title: "AI Radiologiya", href: "/ai-radiology", tone: "from-violet-500 to-violet-400" },
  { icon: UserCheck, title: "AI Assistent", href: "/ai-health-assistant", tone: "from-teal-500 to-teal-400" },
  { icon: Baby, title: "AI Homiladorlik", href: "/ai-pregnancy", tone: "from-pink-500 to-pink-400" },
  { icon: Baby, title: "AI Bola Parvarishi", href: "/ai-baby-care", tone: "from-amber-500 to-amber-400" },
  { icon: Palette, title: "AI Kosmetologiya", href: "/ai-cosmetology", tone: "from-fuchsia-500 to-fuchsia-400" },
  { icon: UtensilsCrossed, title: "AI Dietolog", href: "/ai-dietolog", tone: "from-green-500 to-green-400" },
  { icon: Heart, title: "AI Psixolog", href: "/ai-psixolog", tone: "from-rose-400 to-rose-300" },
  { icon: Pill, title: "AI Farmatsevt", href: "/ai-farmatsevt", tone: "from-cyan-500 to-cyan-400" },
  { icon: Dumbbell, title: "AI Fitness", href: "/ai-fitness", tone: "from-orange-500 to-orange-400" },
  { icon: Activity, title: "AI Vital Signs", href: "/ai-vital-signs", tone: "from-red-500 to-blue-400" },
];

const HomeAIServicesSection = () => {
  return (
    <section className="relative py-14 overflow-hidden isolate">
      <div className="absolute inset-0 -z-20 bg-[hsl(213,73%,8%)]" />
      <FuturisticBackground variant="dark" particles={12} />

      <div className="relative container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(214,84%,56%)] to-[hsl(250,100%,69%)] flex items-center justify-center shadow-glow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl md:text-2xl font-heading font-bold text-white">
                  <span className="text-holo">AI Xizmatlar</span>
                </h2>
                <LiveStatusPill label="14 modul live" tone="green" />
              </div>
              <p className="text-xs text-white/55">
                Gemini 3 Flash asosidagi sun'iy intellekt tibbiy yordamchilari
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/ai-subscription">
              <Button size="sm" variant="outline" className="text-xs rounded-xl border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white">
                <Crown className="w-3.5 h-3.5 mr-1 text-amber-300" /> Tariflar
              </Button>
            </Link>
            <Link to="/ai-services">
              <Button size="sm" variant="ghost" className="text-xs text-white/70 hover:text-white hover:bg-white/[0.06]">
                Barchasi <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {aiServices.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.href} to={s.href} className="group">
                <div className="glass-dark p-3 text-center h-full flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.tone} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-medium text-white/85 leading-tight">{s.title}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 glass-dark px-5 py-4 flex items-center justify-between flex-wrap gap-3 ring-neon-purple">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[hsl(250,100%,80%)]" />
            <p className="text-sm text-white/85">
              <span className="font-semibold text-white">Har bir xizmatdan 1 ta bepul so'rov!</span>{" "}
              <span className="text-white/55">Cheksiz foydalanish uchun obuna bo'ling</span>
            </p>
          </div>
          <Link to="/ai-subscription">
            <Button size="sm" className="btn-magnetic bg-gradient-to-r from-[hsl(214,84%,56%)] to-[hsl(250,100%,69%)] text-white border-0 rounded-xl">
              <Crown className="w-3.5 h-3.5 mr-1.5" /> Obuna bo'lish
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeAIServicesSection;
