import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Grid2X2, MapPin, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { hapticTap } from "@/lib/nativeApp";
import guideCare from "@/assets/mobile-guide-care.jpg";
import guideNearby from "@/assets/mobile-guide-nearby.jpg";
import guideAI from "@/assets/mobile-guide-ai.jpg";
import guideKnowledge from "@/assets/mobile-guide-knowledge.jpg";

const STORAGE_KEY = "med1_mobile_onboarding_seen_v2";
const STEPS = [
  { icon: Grid2X2, image: guideCare, eyebrow: "47 ta imkoniyat", title: "Tibbiy xizmatlar — bir qarashda", description: "Shifokor, klinika, diagnostika, dorixona va boshqa xizmatlarni mazmuniga mos surat orqali tez tanlang." },
  { icon: MapPin, image: guideNearby, eyebrow: "Yaqin yordam", title: "Kerakli yordamga tezroq yeting", description: "Yaqin muassasalarni toping, ish vaqtini tekshiring, marshrut oling va qabulga yoziling." },
  { icon: Sparkles, image: guideAI, eyebrow: "23 ta AI xizmati", title: "Tahlildan kundalik maslahatgacha", description: "Tahlil yoki tasvirni tekshiring, simptomlarni baholang va sog‘liq savollariga tushunarli javob oling." },
  { icon: BookOpen, image: guideKnowledge, eyebrow: "Bilim va kabinet", title: "Salomatlik ma’lumotlari doim yoningizda", description: "Ensiklopediya, dorilar va shaxsiy tibbiy ma’lumotlaringizga xavfsiz va qulay qayting." },
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
      <DialogContent className="fixed inset-0 left-0 top-0 z-[80] block h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden border-0 bg-primary p-0 text-primary-foreground shadow-none sm:rounded-none lg:hidden [&>button]:hidden" aria-describedby="mobile-guide-description">
        <div className="absolute inset-0" aria-hidden="true">
          <img key={current.image} src={current.image} alt="" width={768} height={1280} decoding="async" className="mobile-guide-photo h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/35 via-primary/10 to-primary" />
          <div className="absolute inset-0 bg-grid-tech opacity-10" />
        </div>
        <div className="relative flex h-full flex-col px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-extrabold">Med1.uz</p>
            <div className="flex flex-1 gap-1.5" aria-label={`${step + 1} / ${STEPS.length}`}>
              {STEPS.map((item, index) => <span key={item.title} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-background" : "bg-background/30"}`} />)}
            </div>
            <Button variant="secondary" size="icon" className="bg-background/85 text-foreground" onClick={finish} aria-label="Yo‘riqnomani yopish"><X /></Button>
          </div>

          <div key={current.title} className="mt-auto animate-fade-up">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-background/25 bg-background/15 backdrop-blur-md"><Icon className="h-6 w-6" /></span>
            <p className="mt-5 text-xs font-bold uppercase text-primary-foreground/75">{current.eyebrow}</p>
            <DialogTitle className="mt-2 max-w-[21rem] text-3xl font-extrabold leading-tight text-primary-foreground">{current.title}</DialogTitle>
            <DialogDescription id="mobile-guide-description" className="mt-3 max-w-md text-base leading-relaxed text-primary-foreground/85">{current.description}</DialogDescription>
            <div className="mt-6 grid grid-cols-[auto_1fr] gap-2">
              <Button variant="secondary" size="icon" className="h-12" disabled={step === 0} onClick={() => { void hapticTap(); setStep((value) => value - 1); }} aria-label="Oldingi bosqich"><ChevronLeft /></Button>
              {step === STEPS.length - 1 ? <Button size="lg" className="h-12 bg-background text-foreground hover:bg-background/90" onClick={finish}>Med1.uz’ni boshlash</Button> : <Button size="lg" className="h-12 bg-background text-foreground hover:bg-background/90" onClick={() => { void hapticTap(); setStep((value) => value + 1); }}>Keyingi <ChevronRight /></Button>}
            </div>
            <p className="mt-3 text-center text-xs text-primary-foreground/65">Keyinroq yuqoridagi “?” orqali qayta ko‘rishingiz mumkin.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};