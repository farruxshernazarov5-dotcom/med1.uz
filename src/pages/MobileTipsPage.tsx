import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, Lightbulb, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DAILY_HEALTH_TIPS, MOBILE_TIP_MENUS, type MobileTipMenu } from "@/data/mobileTipsCatalog";
import { hapticTap } from "@/lib/nativeApp";
import { cn } from "@/lib/utils";

const GUIDE_KEY = "med1_tips_guide_seen_v1";
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Auto-advancing index for frames / phrases. */
const useTicker = (length: number, ms: number, active = true) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    if (!active || length < 2 || reduceMotion()) return;
    const t = window.setInterval(() => setI((c) => (c + 1) % length), ms);
    return () => window.clearInterval(t);
  }, [length, ms, active]);
  return [i, setI] as const;
};

const TipStory = ({ menu, onClose }: { menu: MobileTipMenu | null; onClose: () => void }) => {
  const navigate = useNavigate();
  const [frame, setFrame] = useTicker(menu?.frames.length ?? 0, 4200, !!menu);
  const [phrase] = useTicker(menu?.phrases.length ?? 0, 2800, !!menu);
  if (!menu) return null;
  const Icon = menu.icon;
  return (
    <Dialog open={!!menu} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="fixed inset-0 left-0 top-0 z-[80] block h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden border-0 bg-primary p-0 text-primary-foreground sm:rounded-none [&>button]:hidden">
        <div className="absolute inset-0" aria-hidden="true">
          {menu.frames.map((src, i) => (
            <img key={src} src={src} alt="" width={600} height={1000} loading={i === 0 ? "eager" : "lazy"} className={cn("mobile-visual-frame absolute inset-0 h-full w-full object-cover", frame === i && "is-active")} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-primary" />
        </div>
        <div className="relative flex h-full flex-col px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))]">
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" size="icon" className="bg-background/85 text-foreground" onClick={onClose} aria-label="Orqaga"><ArrowLeft /></Button>
            <div className="flex gap-1.5">{menu.frames.map((f, i) => <button key={f} onClick={() => setFrame(i)} aria-label={`${i + 1}-surat`} className={cn("h-1.5 rounded-full transition-all", i === frame ? "w-7 bg-background" : "w-2 bg-background/45")} />)}</div>
            <Button variant="secondary" size="icon" className="bg-background/85 text-foreground" onClick={onClose} aria-label="Yopish"><X /></Button>
          </div>

          <p key={phrase} aria-live="polite" className="mt-8 animate-fade-up text-3xl font-extrabold leading-tight drop-shadow-lg">{menu.phrases[phrase]}</p>

          <div className="mt-auto animate-fade-up rounded-xl border border-primary-foreground/25 bg-primary/60 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-3">
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg bg-background", menu.tone)}><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-bold uppercase opacity-80">Foydali maslahatlar{menu.badge ? ` · ${menu.badge}` : ""}</p>
                <DialogTitle className="text-2xl font-extrabold text-primary-foreground">{menu.title}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-sm text-primary-foreground/85">Bu bo‘lim sizga nima beradi:</DialogDescription>
            <div className="mt-2 space-y-1.5">
              {menu.features.map((f) => (
                <div key={f} className="flex items-center gap-3 rounded-lg border border-primary-foreground/15 bg-primary/30 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary"><Check className="h-3.5 w-3.5 text-secondary-foreground" /></span>
                  <span className="text-sm font-semibold">{f}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="mt-4 h-12 w-full bg-background text-foreground hover:bg-background/90" onClick={() => { void hapticTap(); onClose(); navigate(menu.path); }}>
              Bo‘limni ochish <ArrowRight />
            </Button>
            <p className="mt-2 text-center text-[11px] text-primary-foreground/65">Ma’lumotlar tanishuv uchun, shifokor maslahatini almashtirmaydi.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GUIDE = [
  { menu: MOBILE_TIP_MENUS[0], eyebrow: "1-qadam", title: "Foydali maslahatlar markazi", text: "Kasalliklar, ensiklopediya, maqolalar, yangiliklar va tavsiyalar — hammasi bitta joyda." },
  { menu: MOBILE_TIP_MENUS[1], eyebrow: "2-qadam", title: "Har kuni yangi maslahat", text: "“Kun maslahati” har kuni almashadi — kichik odatlar bilan sog‘lig‘ingizni mustahkamlang." },
  { menu: MOBILE_TIP_MENUS[3], eyebrow: "3-qadam", title: "Kartani bosing — tushuntiramiz", text: "Har bir bo‘lim nima qila olishini suratli taqdimotda ko‘rasiz, keyin bir bosishda ochasiz." },
  { menu: MOBILE_TIP_MENUS[7], eyebrow: "4-qadam", title: "Yordam kerakmi? “?” ni bosing", text: "Bu tanishtiruvni istalgan payt yuqoridagi “?” belgisi orqali qayta ochishingiz mumkin." },
];

const MobileTipsPage = () => {
  const [story, setStory] = useState<MobileTipMenu | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dayIndex = useMemo(() => Math.floor(Date.now() / 864e5) % DAILY_HEALTH_TIPS.length, []);
  const [tipOffset, setTipOffset] = useState(0);
  const heroFrames = useMemo(() => MOBILE_TIP_MENUS.map((m) => m.frames[0]), []);
  const [hero] = useTicker(heroFrames.length, 3800);
  const heroPhrases = ["Bilim — eng yaxshi profilaktika", "Har kuni bir foydali odat", "Ishonchli tibbiy ma’lumot bir joyda"];
  const [hp] = useTicker(heroPhrases.length, 3000);

  useEffect(() => { if (!localStorage.getItem(GUIDE_KEY)) setGuideOpen(true); }, []);
  const finishGuide = () => { localStorage.setItem(GUIDE_KEY, "1"); setGuideOpen(false); setStep(0); };
  const tip = DAILY_HEALTH_TIPS[(dayIndex + tipOffset) % DAILY_HEALTH_TIPS.length];

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-card/90 px-3 py-2 backdrop-blur-xl app-safe-top">
        <Button asChild variant="ghost" size="icon" aria-label="Orqaga"><Link to="/mobile-appointments"><ArrowLeft /></Link></Button>
        <h1 className="flex-1 text-base font-bold text-foreground">Foydali maslahatlar</h1>
        <Button variant="ghost" size="icon" aria-label="Yo‘riqnomani ochish" onClick={() => setGuideOpen(true)}><CircleHelp /></Button>
      </header>

      <section className="relative mx-4 mt-4 h-48 overflow-hidden rounded-2xl" aria-hidden="true">
        {heroFrames.map((src, i) => <img key={src} src={src} alt="" width={600} height={1000} loading={i === 0 ? "eager" : "lazy"} className={cn("mobile-visual-frame absolute inset-0 h-full w-full object-cover", hero === i && "is-active")} />)}
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
        <div className="absolute inset-x-4 bottom-4 text-primary-foreground">
          <p className="text-xs font-semibold uppercase opacity-80">Sog‘liq kutubxonasi</p>
          <p key={hp} className="animate-fade-up text-xl font-extrabold leading-tight">{heroPhrases[hp]}</p>
        </div>
      </section>

      <section className="mx-4 mt-4 rounded-xl border border-border bg-card p-4 shadow-sm" aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-medical-orange/15 text-medical-orange"><Lightbulb className="h-5 w-5" /></span>
          <p className="flex-1 font-bold text-foreground">Kun maslahati</p>
          <Button variant="ghost" size="icon" aria-label="Boshqa maslahat" onClick={() => { void hapticTap(); setTipOffset((o) => o + 1); }}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <p key={tip} className="mt-2 animate-fade-up text-sm text-foreground">{tip}</p>
      </section>

      <div className="grid grid-cols-2 gap-3 p-4">
        {MOBILE_TIP_MENUS.map((m, idx) => (
          <button key={m.id} onClick={() => { void hapticTap(); setStory(m); }} className={cn("group relative h-44 overflow-hidden rounded-xl text-left shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", idx === 0 && "col-span-2 h-40")}>
            <img src={m.frames[0]} alt="" width={600} height={1000} loading="lazy" className="mobile-guide-photo absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
            {m.badge && <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-bold text-foreground">{m.badge}</span>}
            <div className="absolute inset-x-3 bottom-3 text-primary-foreground">
              <span className={cn("mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-background", m.tone)}><m.icon className="h-4 w-4" /></span>
              <p className="font-bold leading-tight">{m.title}</p>
              <p className="line-clamp-1 text-[11px] opacity-85">{m.short}</p>
            </div>
            <ChevronRight className="absolute bottom-3 right-2 h-4 w-4 text-primary-foreground/80" />
          </button>
        ))}
      </div>

      <TipStory menu={story} onClose={() => setStory(null)} />

      <Dialog open={guideOpen} onOpenChange={(o) => !o && finishGuide()}>
        <DialogContent className="fixed inset-0 left-0 top-0 z-[80] block h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden border-0 bg-primary p-0 text-primary-foreground sm:rounded-none [&>button]:hidden">
          <img key={GUIDE[step].menu.frames[1]} src={GUIDE[step].menu.frames[1]} alt="" className="mobile-guide-photo absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-transparent to-primary" />
          <div className="relative flex h-full flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))]">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">{GUIDE.map((_, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-background" : "bg-background/30")} />)}</div>
              <Button variant="secondary" size="icon" onClick={finishGuide} aria-label="Yopish"><X /></Button>
            </div>
            <div key={step} className="mt-auto animate-fade-up rounded-xl border border-primary-foreground/25 bg-primary/55 p-5 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase opacity-75">{GUIDE[step].eyebrow}</p>
              <DialogTitle className="mt-2 text-2xl font-extrabold text-primary-foreground">{GUIDE[step].title}</DialogTitle>
              <DialogDescription className="mt-2 text-primary-foreground/85">{GUIDE[step].text}</DialogDescription>
              <Button size="lg" className="mt-5 h-12 w-full bg-background text-foreground hover:bg-background/90" onClick={() => { void hapticTap(); step === GUIDE.length - 1 ? finishGuide() : setStep(step + 1); }}>
                {step === GUIDE.length - 1 ? "Boshlash" : "Keyingi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileTipsPage;
