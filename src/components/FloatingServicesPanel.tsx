import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Brain, Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Baby, Palette,
  UtensilsCrossed, Heart, Pill, Dumbbell, ChevronUp, ChevronDown, Crown, X, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const aiServices = [
  { icon: Stethoscope, title: "AI Erta Diagnostika", href: "/symptom-checker", color: "text-primary" },
  { icon: Bot, title: "AI Shifokor Chat", href: "/ai-doctor-chat", color: "text-blue-500" },
  { icon: FileText, title: "Analiz Tahlili", href: "/ai-report-analysis", color: "text-emerald-500" },
  { icon: HeartPulse, title: "Sog'liq Xavfi", href: "/ai-health-risk", color: "text-rose-500" },
  { icon: Eye, title: "AI Radiologiya", href: "/ai-radiology", color: "text-violet-500" },
  { icon: UserCheck, title: "AI Assistent", href: "/ai-health-assistant", color: "text-teal-500" },
  { icon: Baby, title: "AI Homiladorlik", href: "/ai-pregnancy", color: "text-pink-500" },
  { icon: Baby, title: "AI Bola Parvarishi", href: "/ai-baby-care", color: "text-amber-500" },
  { icon: Palette, title: "AI Kosmetologiya", href: "/ai-cosmetology", color: "text-violet-500" },
  { icon: UtensilsCrossed, title: "AI Dietolog", href: "/ai-dietolog", color: "text-green-500" },
  { icon: Heart, title: "AI Psixolog", href: "/ai-psixolog", color: "text-rose-400" },
  { icon: Pill, title: "AI Farmatsevt", href: "/ai-farmatsevt", color: "text-cyan-500" },
  { icon: Dumbbell, title: "AI Fitness", href: "/ai-fitness", color: "text-orange-500" },
];

const FloatingServicesPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Don't show on home page (already has services section)
  if (location.pathname === "/") return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 bottom-56 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        title="AI Xizmatlar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed right-4 bottom-[17.5rem] z-50 w-64 max-h-[60vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-right-5 fade-in duration-200">
          <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-bold text-primary-foreground">AI Xizmatlar</span>
            </div>
            <Link to="/ai-subscription" onClick={() => setIsOpen(false)}>
              <span className="text-xs bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Tariflar
              </span>
            </Link>
          </div>
          <div className="overflow-y-auto max-h-[calc(60vh-48px)] p-2 space-y-0.5">
            {aiServices.map((s) => {
              const Icon = s.icon;
              const isActive = location.pathname === s.href;
              return (
                <Link
                  key={s.href}
                  to={s.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all hover:bg-muted ${isActive ? "bg-primary/10 font-semibold" : ""}`}
                >
                  <Icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                  <span className="text-foreground truncate">{s.title}</span>
                </Link>
              );
            })}
          </div>
          <div className="p-2 border-t border-border">
            <Link to="/ai-subscription" onClick={() => setIsOpen(false)}>
              <Button size="sm" className="w-full text-xs">
                <Crown className="w-3.5 h-3.5 mr-1.5" /> Premium obuna — 50% chegirma
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingServicesPanel;
