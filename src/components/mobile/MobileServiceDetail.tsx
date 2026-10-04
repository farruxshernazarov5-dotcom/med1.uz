import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { MobileServiceItem } from "@/data/mobileServiceCatalog";
import guideCare from "@/assets/mobile-guide-care.jpg";
import guideNearby from "@/assets/mobile-guide-nearby.jpg";
import guideAI from "@/assets/mobile-guide-ai.jpg";
import guideKnowledge from "@/assets/mobile-guide-knowledge.jpg";
import { hapticTap } from "@/lib/nativeApp";

const CATEGORY_VISUALS = {
  care: [guideCare, guideNearby],
  ai: [guideAI, guideCare],
  knowledge: [guideKnowledge, guideAI],
  publications: [guideKnowledge, guideCare],
  business: [guideCare, guideKnowledge],
  cabinet: [guideKnowledge, guideCare],
} as const;

const CATEGORY_BENEFITS = {
  care: ["Mos muassasa yoki mutaxassisni toping", "Manzil, xizmat va ish vaqtini solishtiring", "Qabulga to‘g‘ridan-to‘g‘ri yoziling"],
  ai: ["Kerakli ma’lumotni bir joyda kiriting", "Natijani tushunarli shaklda ko‘ring", "Muhim holatda shifokorga murojaat qiling"],
  knowledge: ["Ishonchli tibbiy ma’lumotni qidiring", "Murakkab atamalarni sodda tilda o‘qing", "Kerakli mavzuga tez o‘ting"],
  publications: ["Hujjat va nashr ma’lumotini ko‘ring", "Haqiqiyligini tekshiring", "Tasdiqlangan manbaga o‘ting"],
  business: ["Xizmatingizni Med1.uz’da taqdim eting", "Mijozlar bilan ishlashni boshqaring", "Natijalarni bitta joyda kuzating"],
  cabinet: ["Shaxsiy ishlaringizni xavfsiz boshqaring", "Muhim ma’lumotlarga tez qayting", "Barcha amallarni bitta kabinetda bajaring"],
} as const;

type Props = {
  service: MobileServiceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const MobileServiceDetail = ({ service, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [frame, setFrame] = useState(0);
  const frames = useMemo(() => service ? [service.image, ...CATEGORY_VISUALS[service.category]].filter((image): image is string => Boolean(image)) : [], [service]);

  useEffect(() => {
    if (!open) return;
    setFrame(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || frames.length < 2) return;
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % frames.length), 4200);
    return () => window.clearInterval(timer);
  }, [frames.length, open, service?.id]);

  if (!service) return null;
  const Icon = service.icon;
  const benefits = CATEGORY_BENEFITS[service.category];
  const openService = () => {
    void hapticTap();
    onOpenChange(false);
    navigate(service.path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 left-0 top-0 z-[80] block h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden border-0 bg-background p-0 text-foreground shadow-none sm:rounded-none lg:hidden [&>button]:hidden" aria-describedby="service-detail-description">
        <div className="absolute inset-0" aria-hidden="true">
          {frames.map((image, index) => (
            <img key={image} src={image} alt="" width={768} height={1280} loading={index === 0 ? "eager" : "lazy"} decoding="async" className={`mobile-visual-frame absolute inset-0 h-full w-full object-cover ${frame === index ? "is-active" : ""}`} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/45 via-primary/10 to-primary" />
          <div className="absolute inset-0 bg-grid-tech opacity-10" />
        </div>

        <div className="relative flex h-full flex-col px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-primary-foreground">
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" size="icon" className="bg-background/85 text-foreground shadow-card" onClick={() => onOpenChange(false)} aria-label="Xizmatlar katalogiga qaytish"><ArrowLeft /></Button>
            <div className="flex gap-1.5" aria-label={`${frame + 1} / ${frames.length}`}>
              {frames.map((image, index) => <span key={image} className={`h-1.5 rounded-full transition-all ${index === frame ? "w-7 bg-background" : "w-2 bg-background/45"}`} />)}
            </div>
            <Button variant="secondary" size="icon" className="bg-background/85 text-foreground shadow-card" onClick={() => onOpenChange(false)} aria-label="Xizmat ma’lumotini yopish"><X /></Button>
          </div>

          <div className="mt-auto animate-fade-up">
            <div className="mb-4 flex items-center gap-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-lg border border-background/25 shadow-card ${service.tone}`}><Icon className="h-6 w-6" /></span>
              <div>
                <p className="text-xs font-semibold uppercase text-primary-foreground/75">Med1.uz xizmati</p>
                {service.badge && <span className="text-xs font-semibold text-primary-foreground">{service.badge}</span>}
              </div>
            </div>
            <DialogTitle className="max-w-[19rem] text-3xl font-extrabold leading-tight text-primary-foreground">{service.title}</DialogTitle>
            <DialogDescription id="service-detail-description" className="mt-3 max-w-md text-base leading-relaxed text-primary-foreground/85">{service.description}. Xizmat imkoniyatlarini ko‘ring va kerakli amalni shu yerdan boshlang.</DialogDescription>

            <div className="mt-5 space-y-2.5" aria-label="Xizmat imkoniyatlari">
              {benefits.map((benefit) => <div key={benefit} className="flex items-center gap-3 rounded-lg border border-background/15 bg-primary/55 px-3 py-2.5 backdrop-blur-md"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background/15"><Check className="h-3.5 w-3.5" /></span><span className="text-sm font-medium">{benefit}</span></div>)}
            </div>

            <div className="mt-5 grid grid-cols-[auto_1fr_auto] gap-2">
              <Button variant="secondary" size="icon" onClick={() => { void hapticTap(); setFrame((current) => (current - 1 + frames.length) % frames.length); }} aria-label="Oldingi surat"><ChevronLeft /></Button>
              <Button size="lg" className="h-12 bg-background text-foreground hover:bg-background/90" onClick={openService}>Xizmatni ochish <ArrowRight /></Button>
              <Button variant="secondary" size="icon" onClick={() => { void hapticTap(); setFrame((current) => (current + 1) % frames.length); }} aria-label="Keyingi surat"><ChevronRight /></Button>
            </div>
            <p className="mt-3 text-center text-[11px] text-primary-foreground/65">{service.category === "ai" ? "AI xulosasi shifokor tashxisini almashtirmaydi." : "Batafsil ma’lumot xizmatning asosiy sahifasida ko‘rsatiladi."}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};