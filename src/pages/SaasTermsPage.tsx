import { Briefcase, CreditCard, Shield, AlertTriangle, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Copyright from "@/components/Copyright";
import { useLanguage } from "@/hooks/useLanguage";
import { getDocs } from "@/i18n/docs";
import { DocSection, RichText } from "@/components/legal/DocSection";

const ICONS = [FileText, CreditCard, Shield, AlertTriangle, FileText, AlertTriangle, Shield, FileText];

export const SaasTermsPage = () => {
  const { lang } = useLanguage();
  const d = getDocs(lang).saasTerms;
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> {d.back}
        </Link>
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Briefcase className="w-3.5 h-3.5" /> {d.badge}
        </div>
        <h1 className="font-heading font-extrabold text-3xl mb-2 text-foreground">{d.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          <RichText html={d.intro} />{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>.
        </p>

        {d.sections.map((s, i) => (
          <DocSection key={i} icon={ICONS[i] ?? FileText} title={s.title} paragraphs={s.paragraphs} bullets={s.bullets} />
        ))}

        <Copyright className="mt-8" />
      </div>
    </div>
  );
};

export default SaasTermsPage;
