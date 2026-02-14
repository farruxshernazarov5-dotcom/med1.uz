import { X, BookOpen, AlertTriangle, Stethoscope, Shield, ThumbsUp, ExternalLink } from "lucide-react";
import { MedicalTerm } from "@/data/medicalEncyclopedia";

interface TermDetailModalProps {
  term: MedicalTerm;
  onClose: () => void;
}

const TermDetailModal = ({ term, onClose }: TermDetailModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-medical-navy/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-3xl border border-border shadow-hero w-full max-w-3xl animate-fade-up">
        {/* Header */}
        <div className="relative bg-hero-gradient rounded-t-3xl p-6 md:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
          >
            <X className="w-5 h-5 text-primary-foreground" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
              {term.category}
            </span>
            <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
              {term.letter}
            </span>
          </div>

          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground">
            {term.term}
          </h2>
          <p className="text-primary-foreground/80 mt-2">{term.shortDesc}</p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Full Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-semibold text-foreground text-lg">To'liq ta'rif</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{term.fullDesc}</p>
          </div>

          {/* Causes */}
          {term.causes && term.causes.length > 0 && (
            <div className="bg-medical-red/5 rounded-2xl p-5 border border-medical-red/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-medical-red" />
                <h3 className="font-heading font-semibold text-foreground">Kelib chiqish sabablari</h3>
              </div>
              <ul className="space-y-2">
                {term.causes.map((cause, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-medical-red/10 text-medical-red flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {cause}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Symptoms */}
          {term.symptoms && term.symptoms.length > 0 && (
            <div className="bg-medical-orange/5 rounded-2xl p-5 border border-medical-orange/10">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="w-5 h-5 text-medical-orange" />
                <h3 className="font-heading font-semibold text-foreground">Belgilari (simptomlar)</h3>
              </div>
              <ul className="space-y-2">
                {term.symptoms.map((symptom, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-medical-orange flex-shrink-0 mt-2" />
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Treatment */}
          {term.treatment && term.treatment.length > 0 && (
            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Davolash usullari</h3>
              </div>
              <ul className="space-y-2">
                {term.treatment.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prevention */}
          {term.prevention && term.prevention.length > 0 && (
            <div className="bg-medical-green/5 rounded-2xl p-5 border border-medical-green/10">
              <div className="flex items-center gap-2 mb-3">
                <ThumbsUp className="w-5 h-5 text-medical-green" />
                <h3 className="font-heading font-semibold text-foreground">Oldini olish</h3>
              </div>
              <ul className="space-y-2">
                {term.prevention.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-medical-green flex-shrink-0 mt-2" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {term.recommendations && term.recommendations.length > 0 && (
            <div className="bg-accent rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-accent-foreground" />
                <h3 className="font-heading font-semibold text-foreground">Tavsiyalar</h3>
              </div>
              <ul className="space-y-2">
                {term.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground/50 flex-shrink-0 mt-2" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              <span>Ma'lumot manbasi: <strong className="text-foreground">{term.source}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-2 italic">
              Ushbu ma'lumot faqat ta'lim maqsadida taqdim etilgan. O'z-o'zini davolashga harakat qilmang. Shifokorga murojaat qiling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermDetailModal;
