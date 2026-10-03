import { useEffect, useState } from "react";
import { BookOpen, Grid2X2, MapPin, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { hapticTap } from "@/lib/nativeApp";

const STORAGE_KEY = "med1_mobile_onboarding_seen_v2";
const STEPS = [
  { icon: Grid2X2, title: "Barcha xizmatlar bir joyda", description: "Xizmatlar menyusida tibbiy yordam, AI, bilimlar, biznes va kabinetlarni toifa yoki qidiruv orqali toping." },
  { icon: MapPin, title: "Yaqin yordamni toping", description: "Xarita orqali klinika, shifokor, dorixona va diagnostika markazlarini ko‘ring, yo‘nalish oling yoki qabulga yoziling." },
  { icon: Sparkles, title: "Med1 AI markazi", description: "Pastki menyudagi markaziy tugma 23 ta AI xizmatini ochadi. Kerakli modulni nomi bo‘yicha ham qidirishingiz mumkin." },
  { icon: BookOpen, title: "Bilim va shaxsiy kabinet", description: "Ensiklopediyada kasallik va dorilarni o‘rganing, kabinetda esa qabullar va salomatlik ma’lumotlarini boshqaring." },
];

export const MobileOnboarding = () => {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (mobile && !localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, [mobile]);

  useEffect(() => {
    const show = () => { setStep(0); setOpen(true); };
    window.addEventListener("med1:open-mobile-guide", show);
    return () => window.removeEventListener("med1:open-mobile-guide", show);
  }, []);

  if (!mobile) return null;
  const current = STEPS[step];
  const Icon = current.icon;
  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) finish(); }}>
      <DialogContent className="left-4 right-4 top-auto bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] w-auto max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-lg p-0 lg:hidden" aria-describedby="mobile-guide-description">
        <div className="relative bg-ai-gradient p-5 text-accent-foreground">
          <div className="pointer-events-none absolute inset-0 bg-grid-tech opacity-20" aria-hidden="true" />
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 text-accent-foreground" onClick={finish} aria-label="Yo‘riqnomani yopish"><X /></Button>
          <span className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-background/20"><Icon className="h-6 w-6" /></span>
          <DialogTitle className="relative mt-4 text-xl">{current.title}</DialogTitle>
          <DialogDescription id="mobile-guide-description" className="relative mt-2 text-sm text-accent-foreground/80">{current.description}</DialogDescription>
        </div>
        <div className="space-y-4 bg-card p-4">
          <div className="flex gap-1" aria-label={`${step + 1} / ${STEPS.length}`}>
            {STEPS.map((item, index) => <span key={item.title} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />)}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" disabled={step === 0} onClick={() => { void hapticTap(); setStep((value) => value - 1); }}>Orqaga</Button>
            <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
            {step === STEPS.length - 1 ? <Button onClick={finish}>Boshlash</Button> : <Button onClick={() => { void hapticTap(); setStep((value) => value + 1); }}>Keyingi</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};