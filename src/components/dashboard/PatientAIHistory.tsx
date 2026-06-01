import { useEffect, useState } from "react";
import { Brain, Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Calendar, ExternalLink, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PatientAIDocuments from "./PatientAIDocuments";

const typeMeta: Record<string, { icon: any; color: string; href: string; label: string }> = {
  "symptom-checker":     { icon: Stethoscope, color: "bg-primary/10 text-primary",              href: "/symptom-checker",     label: "Simptom" },
  "ai-doctor-chat":      { icon: Bot,         color: "bg-blue-500/10 text-blue-600",            href: "/ai-doctor-chat",      label: "AI Doctor" },
  "ai-report-analysis":  { icon: FileText,    color: "bg-emerald-500/10 text-emerald-600",      href: "/ai-report-analysis",  label: "Analiz" },
  "ai-health-risk":      { icon: HeartPulse,  color: "bg-rose-500/10 text-rose-600",            href: "/ai-health-risk",      label: "Risk" },
  "ai-radiology":        { icon: Eye,         color: "bg-violet-500/10 text-violet-600",        href: "/ai-radiology",        label: "Radiologiya" },
  "ai-health-assistant": { icon: UserCheck,   color: "bg-teal-500/10 text-teal-600",            href: "/ai-health-assistant", label: "Yordamchi" },
  "ai-dietolog":         { icon: Bot,         color: "bg-amber-500/10 text-amber-600",          href: "/ai-dietolog",         label: "Dietolog" },
  "ai-fitness":          { icon: Bot,         color: "bg-lime-500/10 text-lime-600",            href: "/ai-fitness",          label: "Fitness" },
  "ai-psixolog":         { icon: Bot,         color: "bg-indigo-500/10 text-indigo-600",        href: "/ai-psixolog",         label: "Psixolog" },
  "ai-pregnancy":        { icon: Bot,         color: "bg-pink-500/10 text-pink-600",            href: "/ai-pregnancy",        label: "Homiladorlik" },
  "ai-baby-care":        { icon: Bot,         color: "bg-cyan-500/10 text-cyan-600",            href: "/ai-baby-care",        label: "Chaqaloq" },
  "ai-farmatsevt":       { icon: Bot,         color: "bg-orange-500/10 text-orange-600",        href: "/ai-farmatsevt",       label: "Farmatsevt" },
  "ai-cosmetology":      { icon: Bot,         color: "bg-fuchsia-500/10 text-fuchsia-600",      href: "/ai-cosmetology",      label: "Kosmetologiya" },
  "ai-vital-signs":      { icon: HeartPulse,  color: "bg-red-500/10 text-red-600",              href: "/ai-vital-signs",      label: "Vital" },
};

interface Row {
  id: string;
  service_id: string;
  role: string;
  content: string;
  attachments: any[];
  tokens_used: number;
  model: string | null;
  created_at: string;
}

const PatientAIHistory = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("ai_chat_history" as any) as any)
      .select("*").order("created_at", { ascending: false }).limit(100);
    if (!error) setRows((data || []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("ai_chat_history" as any).delete().eq("id", id);
    if (error) toast.error("O'chirib bo'lmadi");
    else { toast.success("O'chirildi"); setRows(rs => rs.filter(r => r.id !== id)); }
  };

  const serviceKeys = Object.keys(typeMeta).slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> AI tarixi va hujjatlar
        </h2>
        <Link to="/ai-services">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Barcha xizmatlar
          </Button>
        </Link>
      </div>

      <MedicalDisclaimer compact className="mb-6" />

      <PatientAIDocuments />

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Yuklanmoqda...</div>
      ) : rows.length === 0 ? (
        <div>
          <div className="text-center py-10 bg-card rounded-2xl border border-border mb-6">
            <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-bold text-foreground mb-2">Tarix bo'sh</h3>
            <p className="text-muted-foreground text-sm mb-4">AI xizmatlardan foydalanishni boshlang — barcha suhbatlar va PDF hujjatlar shu yerda saqlanadi.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceKeys.map((key) => {
              const meta = typeMeta[key];
              const Icon = meta.icon;
              return (
                <Link key={key} to={meta.href} className="group">
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{meta.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((item) => {
            const meta = typeMeta[item.service_id] || { icon: Bot, color: "bg-muted text-foreground", href: "/ai-services", label: item.service_id };
            const Icon = meta.icon;
            const atts = Array.isArray(item.attachments) ? item.attachments : [];
            return (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{item.role}</Badge>
                    {item.tokens_used > 0 && <Badge className="text-[10px]">{item.tokens_used} tok</Badge>}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">{item.content}</p>
                  {atts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {atts.map((a: any, i: number) => (
                        <a key={i} href={a.url} target="_blank" rel="noreferrer"
                           className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md hover:bg-muted/70">
                          <Paperclip className="w-3 h-3" /> {a.name || "fayl"}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link to={meta.href}>
                    <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Ochish</Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
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
