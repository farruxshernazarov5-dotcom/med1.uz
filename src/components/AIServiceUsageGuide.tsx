import { Link } from "react-router-dom";
import { Info, BookOpen, Shield, FileText, AlertTriangle } from "lucide-react";

interface AIServiceUsageGuideProps {
  serviceName: string;
  steps: { title: string; desc: string }[];
}

const AIServiceUsageGuide = ({ serviceName, steps }: AIServiceUsageGuideProps) => {
  return (
    <div className="space-y-4">
      {/* Usage instructions */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-card animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Info className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-sm">Foydalanish ko'rsatmasi</h3>
            <p className="text-xs text-muted-foreground">{serviceName} xizmatidan qanday foydalanish</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((step, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 hover:bg-muted transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs mb-2">
                {i + 1}
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">{step.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legal links */}
      <div className="flex flex-wrap gap-3 text-xs">
        <Link to="/user-guide" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
          <BookOpen className="w-3.5 h-3.5" /> Foydalanish qo'llanmasi
        </Link>
        <Link to="/user-guide#terms" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
          <FileText className="w-3.5 h-3.5" /> Foydalanish shartlari
        </Link>
        <Link to="/user-guide#privacy" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
          <Shield className="w-3.5 h-3.5" /> Maxfiylik siyosati
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          Bu AI tizim faqat ma'lumot berish maqsadida ishlaydi va tibbiy tashxis o'rnini bosmaydi. 
          Aniq tashxis va davolash uchun malakali shifokorga murojaat qiling.
        </p>
      </div>
    </div>
  );
};

export default AIServiceUsageGuide;
