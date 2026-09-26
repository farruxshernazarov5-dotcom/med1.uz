import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain, Sparkles, Home, X, ChevronUp, Stethoscope, Bot, FileText, Eye, Activity, Plus,
} from "lucide-react";

const QUICK_AI = [
  { icon: Stethoscope, title: "AI Erta Diagnostika", href: "/symptom-checker" },
  { icon: Bot, title: "AI Shifokor Chat", href: "/ai-doctor-chat" },
  { icon: FileText, title: "Analiz Tahlili", href: "/ai-report-analysis" },
  { icon: Eye, title: "AI Radiologiya", href: "/ai-radiology" },
  { icon: Activity, title: "AI Vital Signs", href: "/ai-vital-signs" },
];

const STORAGE_KEY = "med1_dock_open";

/**
 * Yagona yig'iladigan o'ng-past burchak doki.
 * Barcha suzuvchi tugmalar shu yerda — kontentni to'sib qo'ymaydi.
 */
const FloatingDock = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  useEffect(() => {
    setOpen(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const toggle = () => {
    setOpen((v) => {
      sessionStorage.setItem(STORAGE_KEY, v ? "0" : "1");
      return !v;
    });
  };

  const fire = (name: string) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent(name));
  };

  return (
    <div className="fixed bottom-[4.75rem] right-3 lg:bottom-6 lg:right-6 z-50 flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div className="w-[min(17rem,calc(100vw-1.5rem))] bg-card/95 backdrop-blur border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
          <div className="bg-hero-gradient px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-primary-foreground">Tezkor panel</span>
            <button onClick={toggle} aria-label="Panelni yig'ish" className="text-primary-foreground/80 hover:text-primary-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 grid grid-cols-3 gap-1.5 border-b border-border">
            {!isHome && (
              <button
                onClick={() => { setOpen(false); navigate("/"); }}
                className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-accent transition-colors"
              >
                <Home className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-muted-foreground">Bosh sahifa</span>
              </button>
            )}
            <button
              onClick={() => fire("med1:open-ai-search")}
              className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-accent transition-colors"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">AI qidiruv</span>
            </button>
            <button
              onClick={() => fire("med1:open-smart-match")}
              className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-accent transition-colors"
            >
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">AI tavsiya</span>
            </button>
          </div>

          <div className="p-2 space-y-0.5 max-h-[38vh] overflow-y-auto">
            {QUICK_AI.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  to={s.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-accent transition-colors"
                >
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground truncate">{s.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border px-3 py-2">
            <Link to="/ai-services" onClick={() => setOpen(false)} className="text-[11px] text-primary font-medium hover:underline">
              Barcha AI xizmatlar →
            </Link>
          </div>
        </div>
      )}

      <button
        onClick={toggle}
        aria-label={open ? "Panelni yig'ish" : "Tezkor panelni ochish"}
        aria-expanded={open}
        className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-hero-gradient text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center opacity-80 hover:opacity-100"
      >
        {open ? <ChevronUp className="w-5 h-5 rotate-180" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default FloatingDock;
