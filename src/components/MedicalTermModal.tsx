import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, Stethoscope, Shield, Lightbulb, AlertTriangle, Info, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MedicalTerm } from "@/data/medicalTerms";

interface MedicalTermModalProps {
  term: MedicalTerm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Section = ({ icon: Icon, title, content, color }: { icon: any; title: string; content: string; color: string }) => (
  <div className="rounded-2xl border border-border bg-accent/30 p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-primary-foreground" />
      </div>
      <h4 className="font-heading font-semibold text-foreground text-sm">{title}</h4>
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
  </div>
);

const MedicalTermModal = ({ term, open, onOpenChange }: MedicalTermModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!term) return null;

  const shareLink = `${window.location.origin}/medicine?term=${encodeURIComponent(term.term)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      toast.success("Atama havolasi nusxalandi!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-0 gap-0">
        {/* Header */}
        <div className="bg-hero-gradient p-6 pb-5 rounded-t-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                {term.category}
              </span>
            </div>
            <DialogTitle className="font-heading text-2xl text-primary-foreground">
              {term.term}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm mt-1">
              {term.shortDesc}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Full description */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <h4 className="font-heading font-semibold text-foreground text-sm">Batafsil ma'lumot</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{term.fullDesc}</p>
          </div>

          {term.origin && (
            <Section icon={Info} title="Kelib chiqishi" content={term.origin} color="bg-blue-500" />
          )}
          {term.treatment && (
            <Section icon={Stethoscope} title="Davolash usullari" content={term.treatment} color="bg-emerald-500" />
          )}
          {term.prevention && (
            <Section icon={Shield} title="Oldini olish" content={term.prevention} color="bg-amber-500" />
          )}
          {term.recommendations && (
            <Section icon={Lightbulb} title="Tavsiyalar" content={term.recommendations} color="bg-purple-500" />
          )}

          {/* Share link */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={copyLink}
              className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
              {copied ? "Nusxalandi" : "Atama havolasini nusxalash"}
            </button>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(term.term + " — " + term.shortDesc)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
            >
              Telegram
            </a>
          </div>

          {/* Source */}
          <div className="flex items-start gap-2 p-4 rounded-xl bg-muted/50 border border-border">
            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">Ma'lumot manbasi</p>
              <p className="text-xs text-muted-foreground/80">{term.source}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 italic">
                Ushbu ma'lumotlar faqat ta'lim maqsadida. O'z-o'zini davolashdan qoching va shifokorga murojaat qiling.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalTermModal;
