import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon, Save, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";

interface Props {
  storageKey?: string; // localStorage key so it shows once
  title: string;
  bodyParts?: string[];
}

export default function RadiologyOnboardingModal({
  storageKey = "radiology-onboarded-v1",
  title,
  bodyParts = [],
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch { /* ignore */ }
  }, [storageKey]);

  const close = () => {
    try { localStorage.setItem(storageKey, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title} · Yo'riqnoma
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Step n={1} icon={<Upload className="w-4 h-4" />} title="Tasvirni yuklang"
            desc="Rentgen / MRT / KT tasvirini JPG, PNG yoki PDF formatida yuklang (max 10MB)." />
          <Step n={2} icon={<ImageIcon className="w-4 h-4" />} title="Tana qismini tanlang"
            desc={`Tekshiruv sohasini tanlang${bodyParts.length ? ` (masalan: ${bodyParts.slice(0, 3).join(", ")})` : ""} va klinik ma'lumotni kiriting.`} />
          <Step n={3} icon={<CheckCircle2 className="w-4 h-4" />} title="AI tahlilni ko'ring"
            desc="Bir necha soniya ichida topilmalar, risk darajasi va tavsiyalar chiqadi." />
          <Step n={4} icon={<Save className="w-4 h-4" />} title="Saqlang va ulashing"
            desc="Natijani tibbiy tarixga saqlang, PDF yuklab oling yoki shifokorga ulashing." />

          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">
            <div className="text-[11px] font-medium uppercase text-emerald-700 dark:text-emerald-300 mb-1">
              Namunaviy test
            </div>
            <div className="text-xs text-emerald-900 dark:text-emerald-100">
              Yuqori sifatli rentgen tasvir + "35 yosh, erkak, yo'tal 2 hafta" klinik ma'lumot bilan sinab ko'ring.
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 flex gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-100">
              AI natijasi yakuniy tashxis emas. Radiolog/shifokor tasdig'i kerak.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={close} className="w-full">Tushundim, boshlaymiz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Step = ({ n, icon, title, desc }: { n: number; icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
      {n}
    </div>
    <div className="flex-1">
      <div className="text-sm font-semibold flex items-center gap-1.5">{icon}{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  </div>
);
