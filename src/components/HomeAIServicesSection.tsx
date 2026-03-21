import { Link } from "react-router-dom";
import { 
  Brain, Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Baby, Palette,
  UtensilsCrossed, Heart, Pill, Dumbbell, ArrowRight, Crown, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const aiServices = [
  { icon: Stethoscope, title: "AI Erta Diagnostika", href: "/symptom-checker", color: "from-primary to-primary/70" },
  { icon: Bot, title: "AI Shifokor Chat", href: "/ai-doctor-chat", color: "from-blue-500 to-blue-400" },
  { icon: FileText, title: "Analiz Tahlili", href: "/ai-report-analysis", color: "from-emerald-500 to-emerald-400" },
  { icon: HeartPulse, title: "Sog'liq Xavfi", href: "/ai-health-risk", color: "from-rose-500 to-rose-400" },
  { icon: Eye, title: "AI Radiologiya", href: "/ai-radiology", color: "from-violet-500 to-violet-400" },
  { icon: UserCheck, title: "AI Assistent", href: "/ai-health-assistant", color: "from-teal-500 to-teal-400" },
  { icon: Baby, title: "AI Homiladorlik", href: "/ai-pregnancy", color: "from-pink-500 to-pink-400" },
  { icon: Baby, title: "AI Bola Parvarishi", href: "/ai-baby-care", color: "from-amber-500 to-amber-400" },
  { icon: Palette, title: "AI Kosmetologiya", href: "/ai-cosmetology", color: "from-violet-500 to-violet-400" },
  { icon: UtensilsCrossed, title: "AI Dietolog", href: "/ai-dietolog", color: "from-green-500 to-green-400" },
  { icon: Heart, title: "AI Psixolog", href: "/ai-psixolog", color: "from-rose-400 to-rose-300" },
  { icon: Pill, title: "AI Farmatsevt", href: "/ai-farmatsevt", color: "from-cyan-500 to-cyan-400" },
  { icon: Dumbbell, title: "AI Fitness", href: "/ai-fitness", color: "from-orange-500 to-orange-400" },
  { icon: HeartPulse, title: "AI Vital Signs", href: "/ai-vital-signs", color: "from-red-500 to-blue-400" },
];

const HomeAIServicesSection = () => {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">AI Xizmatlar</h2>
              <p className="text-xs text-muted-foreground">13 ta sun'iy intellekt asosidagi tibbiy xizmat</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/ai-subscription">
              <Button size="sm" variant="outline" className="text-xs">
                <Crown className="w-3.5 h-3.5 mr-1" /> Tariflar
              </Button>
            </Link>
            <Link to="/ai-services">
              <Button size="sm" variant="ghost" className="text-xs">
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
                <div className="bg-card border border-border rounded-xl p-3 hover:shadow-md hover:border-primary/30 transition-all text-center h-full flex flex-col items-center justify-center gap-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-foreground leading-tight">{s.title}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Har bir xizmatdan 1 ta bepul so'rov!</span>{" "}
              <span className="text-muted-foreground">Cheksiz foydalanish uchun obuna bo'ling</span>
            </p>
          </div>
          <Link to="/ai-subscription">
            <Button size="sm">
              <Crown className="w-3.5 h-3.5 mr-1.5" /> Obuna bo'lish
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeAIServicesSection;
