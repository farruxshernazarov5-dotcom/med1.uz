import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { Shield, FileText, AlertTriangle } from "lucide-react";
import { useLegalAcceptance, LegalDocType } from "@/hooks/useLegalAcceptance";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "global" | "saas";
  onAccepted?: () => void;
  context?: string;
}

const docsByVariant: Record<"global" | "saas", { type: LegalDocType; label: string; href: string; icon: any }[]> = {
  global: [
    { type: "global_terms", label: "Foydalanish shartlari", href: "/terms", icon: FileText },
    { type: "privacy", label: "Maxfiylik siyosati", href: "/privacy", icon: Shield },
    { type: "disclaimer", label: "Tibbiy ogohlantirish", href: "/disclaimer", icon: AlertTriangle },
  ],
  saas: [
    { type: "saas_terms", label: "SaaS HMS Foydalanish shartlari", href: "/saas-terms", icon: FileText },
    { type: "privacy", label: "Maxfiylik siyosati", href: "/privacy", icon: Shield },
    { type: "disclaimer", label: "Javobgarlik cheklovi (Disclaimer)", href: "/disclaimer", icon: AlertTriangle },
  ],
};

export const LegalAcceptanceModal = ({ open, onOpenChange, variant, onAccepted, context = variant }: Props) => {
  const docs = docsByVariant[variant];
  const { accept } = useLegalAcceptance(docs.map((d) => d.type));
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const allChecked = docs.every((d) => checks[d.type]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      for (const d of docs) {
        await accept(d.type, context);
      }
      toast.success("Shartlar qabul qilindi");
      onOpenChange(false);
      onAccepted?.();
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {variant === "saas" ? "SaaS HMS shartlarini qabul qilish" : "Yuridik hujjatlarni qabul qilish"}
          </DialogTitle>
          <DialogDescription>
            {variant === "saas"
              ? "Pullik SaaS HMS xizmatidan foydalanish uchun quyidagi hujjatlar bilan tanishib, qabul qiling."
              : "Davom etish uchun quyidagi hujjatlarni qabul qiling."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-3">
          <div className="space-y-3">
            {docs.map((d) => {
              const Icon = d.icon;
              return (
                <label
                  key={d.type}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition"
                >
                  <Checkbox
                    checked={!!checks[d.type]}
                    onCheckedChange={(v) => setChecks((p) => ({ ...p, [d.type]: !!v }))}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{d.label}</span>
                    </div>
                    <Link
                      to={d.href}
                      target="_blank"
                      className="text-xs text-primary hover:underline"
                    >
                      Hujjatni o'qish →
                    </Link>
                  </div>
                </label>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Bekor qilish</Button>
          <Button onClick={handleAccept} disabled={!allChecked || submitting} className="flex-1">
            {submitting ? "Saqlanmoqda..." : "Qabul qilaman"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalAcceptanceModal;
