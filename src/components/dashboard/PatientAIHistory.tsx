import { useState } from "react";
import { Brain, Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { useTranslation } from "react-i18next";

type RiskKey = "low" | "mid" | "high";

interface AIHistoryItem {
  id: string;
  type: "symptom" | "doctorChat" | "report" | "healthRisk" | "radiology" | "assistant";
  title: string;
  summary: string;
  date: string;
  riskLevel?: RiskKey;
}

const typeMeta: Record<string, { icon: any; color: string; href: string }> = {
  symptom: { icon: Stethoscope, color: "bg-primary/10 text-primary", href: "/symptom-checker" },
  doctorChat: { icon: Bot, color: "bg-blue-500/10 text-blue-600", href: "/ai-doctor-chat" },
  report: { icon: FileText, color: "bg-emerald-500/10 text-emerald-600", href: "/ai-report-analysis" },
  healthRisk: { icon: HeartPulse, color: "bg-rose-500/10 text-rose-600", href: "/ai-health-risk" },
  radiology: { icon: Eye, color: "bg-violet-500/10 text-violet-600", href: "/ai-radiology" },
  assistant: { icon: UserCheck, color: "bg-teal-500/10 text-teal-600", href: "/ai-health-assistant" },
};

const riskColors: Record<RiskKey, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  mid: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const PatientAIHistory = () => {
  const { t } = useTranslation();
  const [history] = useState<AIHistoryItem[]>([]);

  const serviceKeys: AIHistoryItem["type"][] = ["symptom", "doctorChat", "report", "healthRisk", "radiology", "assistant"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> {t("aiHistory.title")}
        </h2>
        <Link to="/ai-services">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> {t("aiHistory.allServices")}
          </Button>
        </Link>
      </div>

      <MedicalDisclaimer compact className="mb-6" />

      {history.length === 0 ? (
        <div>
          <div className="text-center py-10 bg-card rounded-2xl border border-border mb-6">
            <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-bold text-foreground mb-2">{t("aiHistory.emptyTitle")}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t("aiHistory.emptyDesc")}</p>
          </div>

          <h3 className="font-heading font-bold text-foreground mb-3">{t("aiHistory.tryServices")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceKeys.map((key) => {
              const meta = typeMeta[key];
              const Icon = meta.icon;
              return (
                <Link key={key} to={meta.href} className="group">
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t(`aiHistory.services.${key}.label`)}</p>
                      <p className="text-xs text-muted-foreground truncate">{t(`aiHistory.services.${key}.desc`)}</p>
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
            const meta = typeMeta[item.type];
            const Icon = meta.icon;
            return (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-foreground text-sm truncate">{item.title}</span>
                    <Badge variant="outline" className="text-[10px]">{t(`aiHistory.services.${item.type}.label`)}</Badge>
                    {item.riskLevel && (
                      <Badge className={`text-[10px] ${riskColors[item.riskLevel]}`}>
                        {t(`aiHistory.risk.${item.riskLevel}`)} {t("aiHistory.riskSuffix")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.summary}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={meta.href}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> {t("aiHistory.open")}
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
