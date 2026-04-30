import { Lock, Sparkles, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "feature_blocked" | "limit_exceeded" | "expired" | "no_subscription" | string;
  moduleId: string;
  feature?: string;
  metric?: string;
  used?: number;
  limit?: number;
  currentTier?: string;
}

const REASON_TEXT: Record<string, { title: string; desc: string }> = {
  feature_blocked: { title: "🔒 Bu funksiya tarifda yo'q", desc: "Ushbu modulning kengaytirilgan imkoniyatidan foydalanish uchun tarifingizni yangilang." },
  limit_exceeded:  { title: "⚠️ Limit tugadi", desc: "Joriy oy uchun limitingiz to'lib bo'lgan. Yuqoriroq tarifga o'tib limitlarni oshiring." },
  expired:         { title: "⏰ Obuna muddati tugagan", desc: "Obunangiz muddati tugagan. Davom ettirish uchun yangilang." },
  no_subscription: { title: "✨ Faollashtirilmagan modul", desc: "Bu modul obunangizda faol emas. Tarifni tanlang." },
};

export const UpgradeModal = ({ open, onClose, reason = "feature_blocked", moduleId, feature, metric, used, limit, currentTier }: UpgradeModalProps) => {
  const t = REASON_TEXT[reason] || REASON_TEXT.feature_blocked;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">{t.title}</DialogTitle>
          <DialogDescription className="text-center pt-2">{t.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-muted/50 rounded-xl p-3 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Modul:</span><span className="font-medium">{moduleId}</span></div>
            {currentTier && <div className="flex justify-between"><span className="text-muted-foreground">Joriy tarif:</span><span className="font-medium uppercase">{currentTier}</span></div>}
            {feature && <div className="flex justify-between"><span className="text-muted-foreground">Funksiya:</span><span className="font-medium">{feature}</span></div>}
            {metric && limit !== undefined && (
              <div className="flex justify-between"><span className="text-muted-foreground">{metric}:</span><span className="font-medium">{used}/{limit === -1 ? "∞" : limit}</span></div>
            )}
          </div>

          <Link to={`/pricing?module=${moduleId}`} onClick={onClose}>
            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 gap-2">
              <Sparkles className="w-4 h-4" /> Tarifni yangilash <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            <X className="w-4 h-4 mr-1" /> Yopish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
