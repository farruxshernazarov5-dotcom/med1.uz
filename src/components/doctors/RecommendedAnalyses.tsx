import { Beaker, Stethoscope, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

/**
 * Static specialty -> recommended analyses / studies map (RU keys match doctors_external.primary_specialty).
 * Rendered on the doctor detail page and on AI result pages.
 */
const RECOMMENDED: Record<string, { analyses: string[]; studies: string[]; ai?: { title: string; href: string }[] }> = {
  "Кардиолог": {
    analyses: ["Umumiy qon tahlili", "Lipid profili", "Troponin", "D-dimer", "NT-proBNP"],
    studies: ["EKG", "EKHOKG (Yurak UZI)", "Holter monitoring", "Ko'krak KT"],
    ai: [{ title: "AI Yurak analizi", href: "/ai/health-assistant" }],
  },
  "Эндокринолог": {
    analyses: ["Glyukoza (och)", "HbA1c", "TSH, T3, T4", "Insulin", "Lipid profili"],
    studies: ["Qalqonsimon bez UZI", "Bo'yin dopplerografiya"],
    ai: [{ title: "AI Diabetes assistenti", href: "/ai/diabetes" }, { title: "AI Dietolog", href: "/ai/dietolog" }],
  },
  "Гинеколог": {
    analyses: ["Surtma tahlili", "PAP test", "HPV DNA", "Gormonlar paneli (FSH/LH/E2)"],
    studies: ["Kichik tos UZI", "Mammografiya", "Ko'krak UZI"],
    ai: [{ title: "AI Mammografiya", href: "/ai/radiology/mammography" }],
  },
  "Онколог": {
    analyses: ["Onkomarkerlar (CA-125, CA-19-9, PSA, AFP)", "Umumiy qon tahlili", "Biokimyoviy tahlil"],
    studies: ["KT/MRT", "PET-KT", "Biopsiya"],
    ai: [{ title: "AI Onkologiya", href: "/ai/oncology" }],
  },
  "Невропатолог": { analyses: ["Vitamin D, B12", "Magniy"], studies: ["Bosh miya MRT", "EEG", "Bo'yin dopplerografiya"], ai: [{ title: "AI Bosh miya MRT", href: "/ai/radiology/brain" }] },
  "Невролог":     { analyses: ["Vitamin B12, D", "Magniy"], studies: ["Bosh miya MRT", "Umurtqa MRT"], ai: [{ title: "AI Umurtqa MRT", href: "/ai/radiology/spine" }] },
  "Пульмонолог":  { analyses: ["Umumiy qon tahlili", "CRP"], studies: ["Ko'krak KT/rentgen", "Spirometriya"], ai: [{ title: "AI Ko'krak KT", href: "/ai/radiology/chest-ct" }, { title: "AI Pulmonologiya", href: "/ai/radiology/pulmonology" }] },
  "Радиолог":     { analyses: [], studies: ["Rentgen", "KT", "MRT", "UZI"], ai: [{ title: "AI Radiologiya 2.0", href: "/ai/orchestrator" }] },
  "Ортопед":      { analyses: ["Kaltsiy", "Vitamin D"], studies: ["Suyak rentgeni", "Bo'g'im MRT"], ai: [{ title: "AI Suyak analizi", href: "/ai/radiology/bone" }] },
  "Гастроэнтеролог": { analyses: ["Jigar profili", "H. pylori", "Koprogramma"], studies: ["Qorin UZI", "FGDS", "Kolonoskopiya"], ai: [{ title: "AI Qorin KT", href: "/ai/radiology/abdomen" }] },
  "Уролог":       { analyses: ["PSA", "Siydik tahlili"], studies: ["Buyrak/kovuk UZI"], ai: [] },
  "Дерматолог":   { analyses: ["Alergomarkerlar"], studies: ["Dermatoskopiya"], ai: [{ title: "AI Kosmetologiya", href: "/ai/cosmetology" }] },
  "Педиатр":      { analyses: ["Umumiy qon tahlili", "Vitamin D"], studies: ["Ultratovush skrining"], ai: [] },
  "Терапевт":     { analyses: ["Umumiy qon tahlili", "Biokimyo paneli", "Glyukoza"], studies: ["EKG", "Ko'krak rentgeni"], ai: [{ title: "AI Sog'liq assistenti", href: "/ai/health-assistant" }] },
  "Офтальмолог":  { analyses: [], studies: ["Ko'z tubi", "Ko'rish o'tkirligi"], ai: [] },
  "ЛОР (Отоларинголог)": { analyses: ["Umumiy qon"], studies: ["Audiometriya", "Rinoskopiya"], ai: [] },
  "УЗИ-специалист": { analyses: [], studies: ["Qorin UZI", "Kichik tos UZI", "Qalqonsimon UZI"], ai: [] },
  "Стоматолог":   { analyses: [], studies: ["OPTG (Panorama)", "RVG"], ai: [] },
};

export default function RecommendedAnalyses({ specialty }: { specialty?: string | null }) {
  if (!specialty) return null;
  const rec = RECOMMENDED[specialty];
  if (!rec) return null;

  return (
    <div className="bg-card rounded-2xl border p-6">
      <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" /> Tavsiya etilgan tahlillar va tekshiruvlar
      </h2>
      {rec.analyses.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Beaker className="w-3.5 h-3.5" /> Laborator tahlillar</div>
          <div className="flex flex-wrap gap-2">
            {rec.analyses.map((a, i) => <Badge key={i} variant="secondary">{a}</Badge>)}
          </div>
        </div>
      )}
      {rec.studies.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5" /> Instrumental tekshiruvlar</div>
          <div className="flex flex-wrap gap-2">
            {rec.studies.map((a, i) => <Badge key={i} variant="outline">{a}</Badge>)}
          </div>
        </div>
      )}
      {rec.ai && rec.ai.length > 0 && (
        <div className="pt-3 border-t">
          <div className="text-xs font-semibold text-muted-foreground mb-2">AI xizmatlari bilan tezkor tahlil</div>
          <div className="flex flex-wrap gap-2">
            {rec.ai.map((a, i) => (
              <Link key={i} to={a.href}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition">
                {a.title} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
