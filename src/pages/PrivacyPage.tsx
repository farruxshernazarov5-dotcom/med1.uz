import { Shield, Lock, Database, Eye, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { getDocs } from "@/i18n/docs";
import { DocSection } from "@/components/legal/DocSection";

const ICONS = [Database, Lock, Eye, Shield, Database, Lock];

export const PrivacyPage = () => {
  const { lang } = useLanguage();
  const doc = getDocs(lang).privacy;
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> {doc.back}
        </Link>
        <h1 className="font-heading font-extrabold text-3xl mb-2 text-foreground">{doc.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{doc.subtitle}</p>

        {doc.sections.map((s, i) => (
          <DocSection key={i} icon={ICONS[i] ?? Shield} title={s.title} paragraphs={s.paragraphs} bullets={s.bullets} />
        ))}
      </div>
    </div>
  );
};

export default PrivacyPage;
