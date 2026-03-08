import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Brain, X, Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Sparkles, Baby,
} from "lucide-react";

const AI_SERVICES = [
  { icon: Stethoscope, title: "AI Erta Diagnostika", href: "/symptom-checker", desc: "Simptomlarni tahlil qilish" },
  { icon: Bot, title: "AI Shifokor Chat", href: "/ai-doctor-chat", desc: "AI bilan suhbat" },
  { icon: FileText, title: "Analiz Tahlili", href: "/ai-report-analysis", desc: "Lab natijalarini tahlil" },
  { icon: HeartPulse, title: "Kasallik Prognozi", href: "/ai-health-risk", desc: "Xavf darajasini baholash" },
  { icon: Eye, title: "AI Radiologiya", href: "/ai-radiology", desc: "MRT/KT/Rentgen tahlili" },
  { icon: UserCheck, title: "Sog'liq Assistenti", href: "/ai-health-assistant", desc: "24/7 AI yordamchi" },
  { icon: Baby, title: "AI Homiladorlik", href: "/ai-pregnancy", desc: "Homiladorlik yordamchisi" },
  { icon: Baby, title: "AI Bola Parvarishi", href: "/ai-baby-care", desc: "Chaqaloq parvarishi" },
];

const FloatingAIPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Hide on AI pages themselves
  const isOnAIPage = ["/ai-services", "/symptom-checker", "/ai-doctor-chat", "/ai-report-analysis", "/ai-health-risk", "/ai-radiology", "/ai-health-assistant", "/ai-pregnancy"].some(
    (p) => location.pathname.startsWith(p)
  );

  if (isOnAIPage) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-hero-gradient text-primary-foreground shadow-hero flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="AI Xizmatlar"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[320px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl border border-border shadow-hero animate-fade-up overflow-hidden">
          {/* Header */}
          <div className="bg-hero-gradient px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-primary-foreground text-sm">AI Tibbiy Xizmatlar</h3>
              <p className="text-primary-foreground/70 text-[11px]">Sun'iy intellekt diagnostikasi</p>
            </div>
          </div>

          {/* Services list */}
          <div className="p-3 space-y-1 max-h-[380px] overflow-y-auto">
            {AI_SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  to={s.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5">
            <Link
              to="/ai-services"
              onClick={() => setIsOpen(false)}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              Barcha AI xizmatlarni ko'rish →
            </Link>
            <p className="text-[10px] text-muted-foreground mt-1">
              ⚠️ AI tibbiy tashxis emas. Shifokorga murojaat qiling.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIPanel;
