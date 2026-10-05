import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Brain, CalendarCheck, CalendarClock, CalendarPlus, ChevronRight, CircleHelp, FlaskConical, History, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { hapticTap } from "@/lib/nativeApp";
import { MOBILE_AI_SERVICES } from "@/data/mobileServiceCatalog";
import { cn } from "@/lib/utils";
import f1 from "@/assets/mobile-service-stories/doctors-2.webp";
import f2 from "@/assets/mobile-service-stories/diagnostics-3.webp";
import f3 from "@/assets/mobile-service-stories/ai-report-analysis-2.webp";
import f4 from "@/assets/mobile-service-stories/ai-doctor-chat-3.webp";

const GUIDE_KEY = "med1_appointments_guide_seen_v1";
const GUIDE = [
  { image: f1, eyebrow: "1-qadam", title: "Qabulga bir necha bosishda yoziling", text: "Shifokor yoki klinikani tanlang, qulay vaqtni belgilang — qabul shu yerda paydo bo‘ladi." },
  { image: f2, eyebrow: "2-qadam", title: "Tahlillaringiz bir joyda", text: "Laboratoriya va diagnostika natijalarini yuklang yoki AI orqali tekshiring." },
  { image: f3, eyebrow: "3-qadam", title: "AI xulosalari saqlanadi", text: "Med1 AI bergan har bir xulosa akkauntingizda xavfsiz saqlanadi va istalgan payt qayta o‘qiladi." },
  { image: f4, eyebrow: "4-qadam", title: "Eslatmalar bilan hech narsani unutmang", text: "Qabul va dori vaqtlari uchun telefoningizga eslatma o‘rnating." },
];

type Appt = { id: string; appointment_date: string; appointment_time: string | null; status: string | null; notes: string | null };
type AiRow = { id: string; service_id: string; content: string; created_at: string };
type Panel = null | "upcoming" | "past" | "labs" | "ai";

const STATUS: Record<string, string> = { pending: "Kutilmoqda", confirmed: "Tasdiqlangan", completed: "Yakunlangan", cancelled: "Bekor qilingan" };

const MobileAppointmentsPage = () => {
  const { user } = useAuth();
  const [guideOpen, setGuideOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [ai, setAi] = useState<AiRow[]>([]);

  useEffect(() => { if (!localStorage.getItem(GUIDE_KEY)) setGuideOpen(true); }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const [a, h] = await Promise.all([
        supabase.from("appointments").select("id, appointment_date, appointment_time, status, notes").eq("patient_id", user.id).order("appointment_date", { ascending: false }).limit(50),
        supabase.from("ai_chat_history" as any).select("id, service_id, content, created_at").eq("user_id", user.id).eq("role", "assistant").order("created_at", { ascending: false }).limit(50),
      ]);
      if (!alive) return;
      setAppts((a.data as Appt[]) ?? []);
      setAi(((h.data as unknown) as AiRow[]) ?? []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(() => appts.filter((a) => a.appointment_date >= today && a.status !== "cancelled").reverse(), [appts, today]);
  const past = useMemo(() => appts.filter((a) => a.appointment_date < today || a.status === "cancelled"), [appts, today]);
  const labs = useMemo(() => ai.filter((r) => /report|lab|radiology|analysis/.test(r.service_id)), [ai]);

  const finishGuide = () => { localStorage.setItem(GUIDE_KEY, "1"); setGuideOpen(false); setStep(0); };
  const open = (p: Panel) => { void hapticTap(); setPanel(p); };

  const cards = [
    { key: "upcoming" as const, icon: CalendarClock, title: "Kelgusi qabullar", text: upcoming[0] ? `Eng yaqini: ${upcoming[0].appointment_date}` : "Rejalashtirilgan qabul yo‘q", count: upcoming.length, tone: "bg-primary/10 text-primary" },
    { key: "past" as const, icon: History, title: "Qabullar tarixi", text: "O‘tgan va bekor qilingan tashriflar", count: past.length, tone: "bg-secondary/10 text-secondary" },
    { key: "labs" as const, icon: FlaskConical, title: "Tahlillar", text: "Laboratoriya va tasvir tahlillari", count: labs.length, tone: "bg-medical-green/10 text-medical-green" },
    { key: "ai" as const, icon: Brain, title: "AI xulosalari", text: "Med1 AI bergan barcha xulosalar", count: ai.length, tone: "bg-ai-purple/10 text-ai-purple" },
  ];

  const list = panel === "upcoming" ? upcoming : panel === "past" ? past : null;
  const aiList = panel === "labs" ? labs : panel === "ai" ? ai : null;

  const aiPath = (serviceId: string) => MOBILE_AI_SERVICES.find((s) => s.id === serviceId)?.path ?? "/ai-services";

  const EMPTY: Record<string, { title: string; hint: string; cta: string; to: string }> = {
    upcoming: { title: "Kelgusi qabul yo‘q", hint: "Shifokor yoki klinikani tanlab, qulay vaqtga yoziling — qabul shu yerda ko‘rinadi.", cta: "Shifokor tanlash", to: "/doctors" },
    past: { title: "Qabullar tarixi bo‘sh", hint: "Birinchi qabulga yozilgach, o‘tgan tashriflaringiz shu yerda saqlanadi.", cta: "Qabulga yozilish", to: "/doctors" },
    labs: { title: "Tahlil natijalari yo‘q", hint: "Tahlil varag‘ini suratga oling yoki yuklang — AI uni o‘qib, xulosani shu yerda saqlaydi.", cta: "Tahlilni tekshirish", to: "/ai-report-analysis" },
    ai: { title: "AI xulosalari hali yo‘q", hint: "Istalgan Med1 AI xizmatidan foydalaning — bergan javoblari avtomatik shu yerda saqlanadi.", cta: "AI xizmatlarini ochish", to: "/ai-services" },
  };
  const empty = panel ? EMPTY[panel] : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-card/90 px-3 py-2 backdrop-blur-xl app-safe-top">
        <Button asChild variant="ghost" size="icon" aria-label="Orqaga"><Link to="/"><ArrowLeft /></Link></Button>
        <h1 className="flex-1 text-base font-bold text-foreground">Qabullar</h1>
        <Button variant="ghost" size="icon" aria-label="Yo‘riqnomani ochish" onClick={() => setGuideOpen(true)}><CircleHelp /></Button>
      </header>

      <section className="relative mx-4 mt-4 overflow-hidden rounded-2xl">
        <img src={f1} alt="" className="mobile-guide-photo h-40 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
        <div className="absolute inset-x-4 bottom-4 text-primary-foreground">
          <p className="text-xs font-semibold uppercase opacity-80">Sog‘liq kundaligi</p>
          <p className="text-xl font-extrabold leading-tight">Qabul, tahlil va AI xulosalari — bir joyda</p>
        </div>
      </section>

      {!user ? (
        <div className="m-4 rounded-xl border border-border bg-card p-5 text-center">
          <p className="font-semibold text-foreground">Ma’lumotlaringizni ko‘rish uchun tizimga kiring</p>
          <Button asChild className="mt-3"><Link to="/auth">Kirish</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {cards.map((c) => (
            <button key={c.key} onClick={() => open(c.key)} className="animate-fade-up rounded-xl border border-border bg-card p-4 text-left shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-start justify-between">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", c.tone)}><c.icon className="h-5 w-5" /></span>
                <span className="text-lg font-extrabold text-foreground">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : c.count}</span>
              </div>
              <p className="mt-3 font-bold text-foreground">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.text}</p>
            </button>
          ))}
          <Link to="/doctors" onClick={() => void hapticTap()} className="col-span-2 flex items-center gap-3 rounded-xl bg-primary p-4 text-primary-foreground active:scale-[0.98]">
            <CalendarPlus className="h-6 w-6" />
            <span className="flex-1"><span className="block font-bold">Yangi qabulga yozilish</span><span className="text-xs opacity-80">Shifokor yoki klinikani tanlang</span></span>
            <ChevronRight />
          </Link>
          <Link to="/dashboard/patient" className="col-span-2 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <Bell className="h-5 w-5 text-medical-orange" />
            <span className="flex-1 text-sm font-semibold text-foreground">Qabul va dori eslatmalari</span>
            <ChevronRight className="text-muted-foreground" />
          </Link>
        </div>
      )}

      <Dialog open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogTitle>{cards.find((c) => c.key === panel)?.title}</DialogTitle>
          <DialogDescription>Faqat sizga ko‘rinadi.</DialogDescription>
          <div className="space-y-2">
            {list?.map((a) => (
              <Link key={a.id} to="/dashboard/patient" onClick={() => setPanel(null)} className="flex items-center gap-3 rounded-lg border border-border p-3 transition active:scale-[0.98]">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <div className="flex-1"><p className="text-sm font-semibold">{a.appointment_date} {a.appointment_time?.slice(0, 5)}</p>{a.notes && <p className="text-xs text-muted-foreground line-clamp-2">{a.notes}</p>}</div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{STATUS[a.status ?? ""] ?? a.status}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {aiList?.map((r) => (
              <details key={r.id} className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer text-sm font-semibold">{r.service_id} · {new Date(r.created_at).toLocaleDateString("uz-UZ")}</summary>
                <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{r.content.slice(0, 3000)}</p>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full" onClick={() => setPanel(null)}>
                  <Link to={aiPath(r.service_id)}>Xizmatni ochish</Link>
                </Button>
              </details>
            ))}
            {empty && (list?.length === 0 || aiList?.length === 0) && (
              <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center">
                <p className="font-semibold text-foreground">{empty.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{empty.hint}</p>
                <Button asChild size="sm" className="mt-3" onClick={() => setPanel(null)}>
                  <Link to={empty.to}>{empty.cta}</Link>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={guideOpen} onOpenChange={(o) => !o && finishGuide()}>
        <DialogContent className="fixed inset-0 left-0 top-0 z-[80] block h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden border-0 bg-primary p-0 text-primary-foreground sm:rounded-none [&>button]:hidden">
          <img key={GUIDE[step].image} src={GUIDE[step].image} alt="" className="mobile-guide-photo absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-transparent to-primary" />
          <div className="relative flex h-full flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))]">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">{GUIDE.map((g, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-background" : "bg-background/30")} />)}</div>
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

export default MobileAppointmentsPage;
