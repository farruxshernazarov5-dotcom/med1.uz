import { AlertTriangle, ArrowLeft, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { getDocs } from "@/i18n/docs";
import { RichText } from "@/components/legal/DocSection";

export const DisclaimerPage = () => {
  const { lang } = useLanguage();
  const d = getDocs(lang).disclaimer;
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> {d.back}
        </Link>
        <h1 className="font-heading font-extrabold text-3xl mb-2 text-foreground">{d.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{d.subtitle}</p>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-heading font-bold text-lg text-amber-900 dark:text-amber-100 mb-2">{d.alertTitle}</h2>
              <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                <RichText html={d.alertText} />
              </p>
            </div>
          </div>
        </div>

        <section className="bg-card border border-border rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <Stethoscope className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-bold text-xl">{d.decisionTitle}</h2>
          </div>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2 text-sm">
            {d.decisionPoints.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-heading font-bold text-xl mb-3">{d.liabilityTitle}</h2>
          <p className="text-sm text-muted-foreground">{d.liabilityText}</p>
        </section>
      </div>
    </div>
  );
};

export default DisclaimerPage;
