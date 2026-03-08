import { useState } from "react";
import { Brain, Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Download, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

interface AIHistoryItem {
  id: string;
  type: "symptom" | "doctor-chat" | "report" | "health-risk" | "radiology" | "assistant";
  title: string;
  summary: string;
  date: string;
  riskLevel?: "past" | "o'rtacha" | "yuqori";
}

const typeConfig: Record<string, { icon: any; label: string; color: string; href: string }> = {
  "symptom": { icon: Stethoscope, label: "Erta Diagnostika", color: "bg-primary/10 text-primary", href: "/symptom-checker" },
  "doctor-chat": { icon: Bot, label: "AI Shifokor Chat", color: "bg-blue-500/10 text-blue-600", href: "/ai-doctor-chat" },
  "report": { icon: FileText, label: "Analiz Tahlili", color: "bg-emerald-500/10 text-emerald-600", href: "/ai-report-analysis" },
  "health-risk": { icon: HeartPulse, label: "Sog'liq Prognozi", color: "bg-rose-500/10 text-rose-600", href: "/ai-health-risk" },
  "radiology": { icon: Eye, label: "Radiologiya", color: "bg-violet-500/10 text-violet-600", href: "/ai-radiology" },
  "assistant": { icon: UserCheck, label: "Sog'liq Assistenti", color: "bg-teal-500/10 text-teal-600", href: "/ai-health-assistant" },
};

const riskColors: Record<string, string> = {
  "past": "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  "o'rtacha": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "yuqori": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const PatientAIHistory = () => {
  // This would come from Supabase in a real implementation
  // For now showing the empty state with links to AI services
  const [history] = useState<AIHistoryItem[]>([]);

  const aiServices = [
    { icon: Stethoscope, title: "AI Erta Diagnostika", desc: "Simptomlarni tahlil qiling", href: "/symptom-checker" },
    { icon: Bot, title: "AI Shifokor Chat", desc: "AI bilan suhbat", href: "/ai-doctor-chat" },
    { icon: FileText, title: "Analiz Tahlili", desc: "Lab natijalarini tahlil", href: "/ai-report-analysis" },
    { icon: HeartPulse, title: "Sog'liq Prognozi", desc: "Xavf darajasini baholash", href: "/ai-health-risk" },
    { icon: Eye, title: "AI Radiologiya", desc: "MRT/KT/Rentgen tahlili", href: "/ai-radiology" },
    { icon: UserCheck, title: "Sog'liq Assistenti", desc: "24/7 AI yordamchi", href: "/ai-health-assistant" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> AI xizmatlar tarixi
        </h2>
        <Link to="/ai-services">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Barcha AI xizmatlar
          </Button>
        </Link>
      </div>

      <MedicalDisclaimer compact className="mb-6" />

      {history.length === 0 ? (
        <div>
          <div className="text-center py-10 bg-card rounded-2xl border border-border mb-6">
            <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-bold text-foreground mb-2">AI tahlil tarixi yo'q</h3>
            <p className="text-muted-foreground text-sm mb-4">AI xizmatlardan foydalanganingizda natijalar shu yerda saqlanadi</p>
          </div>

          <h3 className="font-heading font-bold text-foreground mb-3">AI xizmatlarni sinab ko'ring:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiServices.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.href} to={s.href} className="group">
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const cfg = typeConfig[item.type];
            const Icon = cfg.icon;
            return (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${cfg.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-foreground text-sm truncate">{item.title}</span>
                    <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                    {item.riskLevel && (
                      <Badge className={`text-[10px] ${riskColors[item.riskLevel]}`}>{item.riskLevel} xavf</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.summary}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={cfg.href}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ochish
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientAIHistory;
