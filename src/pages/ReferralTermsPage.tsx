import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Gift, ShieldAlert, Wallet, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { getDocs } from "@/i18n/docs";
import { DocSection } from "@/components/legal/DocSection";

const ICONS = [Gift, Wallet, ShieldAlert, AlertTriangle, ShieldAlert, FileText];

export default function ReferralTermsPage() {
  const { lang } = useLanguage();
  const d = getDocs(lang).referralTerms;

  useEffect(() => { document.title = `${d.title} | Med1.uz`; }, [d.title]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/referral" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {d.backToReferral}
        </Link>

        <div className="text-center mb-8">
          <FileText className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h1 className="text-3xl font-bold mb-2">{d.title}</h1>
          <p className="text-sm text-muted-foreground">{d.lastUpdated}</p>
        </div>

        {d.sections.map((s, i) => (
          <DocSection key={i} icon={ICONS[i] ?? FileText} title={s.title} paragraphs={s.paragraphs} bullets={s.bullets} />
        ))}

        <p className="text-xs text-center text-muted-foreground mt-8">{d.copyright}</p>
      </div>
    </div>
  );
}
