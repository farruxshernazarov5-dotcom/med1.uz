import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Bell, Brain, CalendarCheck, CalendarClock, CalendarPlus, ChevronRight, CircleHelp, Clock, Copy, FlaskConical,
  History, Lightbulb, Loader2, MapPin, Phone, X, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { hapticTap } from "@/lib/nativeApp";
import { MarkdownView } from "@/lib/markdownRender";
import { MOBILE_AI_SERVICES } from "@/data/mobileServiceCatalog";
import { MOBILE_TIP_MENUS } from "@/data/mobileTipsCatalog";
import { fetchLabOrdersResult, fetchPatientVisits, isVisitOpen, visitDate, VISIT_STATUS, type LabOrder, type PatientVisit } from "@/lib/patientRecords";
import { NativeHealthSettings } from "@/components/mobile/NativeHealthSettings";
import { cn } from "@/lib/utils";
import { signInDestination } from "@/lib/authDestination";
import f1 from "@/assets/mobile-service-stories/doctors-2.webp";
import f2 from "@/assets/mobile-service-stories/diagnostics-3.webp";
import f3 from "@/assets/mobile-service-stories/ai-report-analysis-2.webp";
import f4 from "@/assets/mobile-service-stories/ai-doctor-chat-3.webp";

const GUIDE_KEY = "med1_appointments_guide_seen_v1";
const GUIDE = [
  { image: f1, eyebrow: "1-qadam", title: "Qabulga bir necha bosishda yoziling", text: "Shifokor yoki klinikani tanlang, qulay vaqtni belgilang — qabul shu yerda paydo bo‘ladi." },
  { image: f2, eyebrow: "2-qadam", title: "Tahlil natijasidan xabardor bo‘ling", text: "Med1 bilan ulangan laboratoriya natijalari shu yerda ko‘rinadi. Ilova ochiq paytda tayyor natijalarni tekshirib, xabar beramiz." },
  { image: f3, eyebrow: "3-qadam", title: "AI xulosalari saqlanadi", text: "Har bir xulosani sana va xizmat turi bo‘yicha topib, to‘liq o‘qishingiz mumkin." },
  { image: f4, eyebrow: "4-qadam", title: "Eslatmalar va foydali maslahatlar", text: "Qabul va dori eslatmalarini yoqing, “Foydali maslahatlar”dan bilim oling." },
];

type AiRow = { id: string; service_id: string; content: string; created_at: string };
type Panel = "upcoming" | "past" | "labs" | "ai" | "reminders";
const PANELS: Panel[] = ["upcoming", "past", "labs", "ai", "reminders"];
type DateRange = "all" | "today" | "7" | "30" | "custom";

const serviceName = (id: string) => MOBILE_AI_SERVICES.find((s) => s.id === id)?.title ?? id.replace(/[-_]/g, " ");
const aiPath = (id: string) => MOBILE_AI_SERVICES.find((s) => s.id === id)?.path ?? "/ai-services";
const isLabAi = (id: string) => /report|lab|radiology|analysis/.test(id);
const dayKey = (iso: string) => iso.slice(0, 10);
const fmtDay = (key: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (key === today) return "Bugun";
  if (key === yest) return "Kecha";
  return new Date(key).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
};

const EMPTY: Record<Panel, { title: string; hint: string; cta: string; to: string }> = {
  upcoming: { title: "Kelgusi qabul yo‘q", hint: "Shifokor yoki klinikani tanlab, qulay vaqtga yoziling — qabul shu yerda ko‘rinadi va eslatma keladi.", cta: "Shifokor tanlash", to: "/doctors" },
  past: { title: "Qabullar tarixi bo‘sh", hint: "Klinika, shifokor, diagnostika va stomatologiyadagi barcha tashriflaringiz shu yerda yig‘iladi.", cta: "Qabulga yozilish", to: "/doctors" },
  labs: { title: "Tahlil natijalari yo‘q", hint: "Med1 hisobingizga bog‘langan laboratoriya natijalari shu yerda chiqadi. Boshqa klinika dasturi alohida ulanishi kerak. Tahlil varag‘ini AI bilan ham tekshirishingiz mumkin.", cta: "Tahlilni tekshirish", to: "/ai-report-analysis" },
  ai: { title: "AI xulosalari hali yo‘q", hint: "Istalgan Med1 AI xizmatidan foydalaning — bergan javoblari avtomatik shu yerda saqlanadi.", cta: "AI xizmatlarini ochish", to: "/ai-services" },
  reminders: { title: "", hint: "", cta: "", to: "/" },
};

const TITLES: Record<Panel, string> = { upcoming: "Kelgusi qabullar", past: "Qabullar tarixi", labs: "Tahlillar", ai: "AI xulosalari", reminders: "Qabul va dori eslatmalari" };

const EmptyState = ({ panel, onGo }: { panel: Panel; onGo: () => void }) => (
  <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center">
    <p className="font-semibold text-foreground">{EMPTY[panel].title}</p>
    <p className="mt-1 text-xs text-muted-foreground">{EMPTY[panel].hint}</p>
    <Button asChild size="sm" className="mt-3" onClick={onGo}><Link to={EMPTY[panel].to}>{EMPTY[panel].cta}</Link></Button>
  </div>
);

const MobileAppointmentsPage = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [guideOpen, setGuideOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [ai, setAi] = useState<AiRow[]>([]);
  const [visit, setVisit] = useState<PatientVisit | null>(null);
  const [aiOpen, setAiOpen] = useState<AiRow | null>(null);
  const [svcFilter, setSvcFilter] = useState<string>("all");
  const [range, setRange] = useState<DateRange>("all");
  const [customDay, setCustomDay] = useState("");

  const p = params.get("panel");
  const panel: Panel | null = PANELS.includes(p as Panel) ? (p as Panel) : null;
  const setPanel = (next: Panel | null) => {
    const np = new URLSearchParams(params);
    if (next) np.set("panel", next); else np.delete("panel");
    setParams(np, { replace: true });
  };

  useEffect(() => { if (!localStorage.getItem(GUIDE_KEY)) setGuideOpen(true); }, []);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [v, labs, h] = await Promise.all([
      fetchPatientVisits(user.id),
       fetchLabOrdersResult(user.id).catch(() => ({ orders: [], failed: 2 })),
      supabase.from("ai_chat_history" as any).select("id, service_id, content, created_at").eq("user_id", user.id).eq("role", "assistant").order("created_at", { ascending: false }).limit(200),
    ]);
    setVisits(v.visits);
    setLoadError(v.failed > 0 || labs.failed > 0 || !!h.error);
    setLabOrders(labs.orders);
    setAi(((h.data as unknown) as AiRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [user]);

  const now = Date.now();
  const upcoming = useMemo(() => visits.filter((v) => isVisitOpen(v) && visitDate(v).getTime() >= now - 3600e3).reverse(), [visits, now]);
  const past = useMemo(() => visits.filter((v) => !upcoming.includes(v)), [visits, upcoming]);
  const labAi = useMemo(() => ai.filter((r) => isLabAi(r.service_id)), [ai]);
  const readyLabs = labOrders.filter((l) => l.ready).length;

  const services = useMemo(() => {
    const m = new Map<string, number>();
    ai.forEach((r) => m.set(r.service_id, (m.get(r.service_id) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [ai]);

  const filteredAi = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return ai.filter((r) => {
      if (svcFilter !== "all" && r.service_id !== svcFilter) return false;
      const d = dayKey(r.created_at);
      if (range === "today") return d === today;
      if (range === "7") return Date.now() - new Date(r.created_at).getTime() <= 7 * 864e5;
      if (range === "30") return Date.now() - new Date(r.created_at).getTime() <= 30 * 864e5;
      if (range === "custom") return !customDay || d === customDay;
      return true;
    });
  }, [ai, svcFilter, range, customDay]);

  const grouped = useMemo(() => {
    const g: [string, AiRow[]][] = [];
    filteredAi.forEach((r) => {
      const k = dayKey(r.created_at);
      const last = g[g.length - 1];
      if (last && last[0] === k) last[1].push(r); else g.push([k, [r]]);
    });
    return g;
  }, [filteredAi]);

  const finishGuide = () => { localStorage.setItem(GUIDE_KEY, "1"); setGuideOpen(false); setStep(0); };
  const open = (pn: Panel) => { void hapticTap(); setPanel(pn); };

  const cancelVisit = async (v: PatientVisit) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", v.id);
    if (error) { toast.error("Bekor qilib bo‘lmadi", { description: error.message }); return; }
    toast.success("Qabul bekor qilindi");
    setVisit(null);
    void load();
  };

  const cards = [
    { key: "upcoming" as const, icon: CalendarClock, title: "Kelgusi qabullar", text: upcoming[0] ? `Eng yaqini: ${upcoming[0].date}` : "Rejalashtirilgan qabul yo‘q", count: upcoming.length, tone: "bg-primary/10 text-primary" },
    { key: "past" as const, icon: History, title: "Qabullar tarixi", text: "O‘tgan va bekor qilingan tashriflar", count: past.length, tone: "bg-secondary/10 text-secondary" },
    { key: "labs" as const, icon: FlaskConical, title: "Tahlillar", text: readyLabs ? `${readyLabs} ta natija tayyor` : "Laboratoriya va AI tahlillari", count: labOrders.length + labAi.length, tone: "bg-medical-green/10 text-medical-green" },
    { key: "ai" as const, icon: Brain, title: "AI xulosalari", text: "Sana va xizmat bo‘yicha saralang", count: ai.length, tone: "bg-ai-purple/10 text-ai-purple" },
  ];

  const visitList = panel === "upcoming" ? upcoming : panel === "past" ? past : null;
  const tipsCover = MOBILE_TIP_MENUS[1].frames[0];

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
           <Button asChild className="mt-3"><Link to={signInDestination(`/mobile-appointments${params.size ? `?${params.toString()}` : ''}`)}>Kirish</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {loadError && (
            <div className="col-span-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Ma’lumotlarni yuklab bo‘lmadi. <Button size="sm" variant="outline" onClick={() => void load()}>Qayta urinish</Button>
            </div>
          )}
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
          <button onClick={() => open("reminders")} className="col-span-2 flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left active:scale-[0.98]">
            <Bell className="h-5 w-5 text-medical-orange" />
            <span className="flex-1"><span className="block text-sm font-semibold text-foreground">Qabul va dori eslatmalari</span><span className="text-xs text-muted-foreground">Qabul yaqinlashganda va tahlil tayyor bo‘lganda xabar</span></span>
            <ChevronRight className="text-muted-foreground" />
          </button>
          <Link to="/mobile-tips" onClick={() => void hapticTap()} className="relative col-span-2 h-32 overflow-hidden rounded-xl active:scale-[0.98]">
            <img src={tipsCover} alt="" loading="lazy" className="mobile-guide-photo absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
            <div className="absolute inset-y-0 left-4 flex flex-col justify-center text-primary-foreground">
              <span className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-background text-medical-orange"><Lightbulb className="h-4 w-4" /></span>
              <span className="font-bold">Foydali maslahatlar</span>
              <span className="text-xs opacity-85">Kasalliklar, ensiklopediya, maqolalar, yangiliklar</span>
            </div>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground" />
          </Link>
        </div>
      )}

      {/* Section panels */}
      <Dialog open={panel !== null && !!user} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogTitle>{panel ? TITLES[panel] : ""}</DialogTitle>
          <DialogDescription>Faqat sizga ko‘rinadi.</DialogDescription>
           {loadError && panel !== 'reminders' && <div role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">Ayrim manbalar yuklanmadi. Ko‘rsatilgan ro‘yxat to‘liq bo‘lmasligi mumkin.<Button variant="outline" size="sm" className="mt-2" onClick={()=>void load()}>Qayta urinish</Button></div>}

          {loading && panel !== "reminders" && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}

          {!loading && visitList && (
            <div className="space-y-2">
              {visitList.map((v) => (
                <button key={`${v.source}-${v.id}`} onClick={() => setVisit(v)} className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition active:scale-[0.98]">
                  <CalendarCheck className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{v.title}</p>
                    <p className="text-xs text-muted-foreground">{v.date} {v.time?.slice(0, 5)} · {v.sourceLabel}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{VISIT_STATUS[v.status ?? ""] ?? v.status}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {visitList.length === 0 && panel && <EmptyState panel={panel} onGo={() => setPanel(null)} />}
            </div>
          )}

          {!loading && panel === "labs" && (
            <div className="space-y-3">
              {labOrders.length > 0 && <p className="text-xs font-bold uppercase text-muted-foreground">Laboratoriya buyurtmalari</p>}
              {labOrders.map((l) => (
                <div key={`${l.source}-${l.id}`} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <FlaskConical className={cn("h-5 w-5 shrink-0", l.ready ? "text-medical-green" : "text-medical-orange")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.testName}</p>
                    <p className="text-xs text-muted-foreground">{l.source} · {new Date(l.completedAt ?? l.orderedAt).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", l.ready ? "bg-medical-green/15 text-medical-green" : "bg-medical-orange/15 text-medical-orange")}>{l.ready ? "Tayyor" : "Jarayonda"}</span>
                </div>
              ))}
              {labOrders.length > 0 && (
                <Button asChild variant="outline" size="sm" className="w-full" onClick={() => setPanel(null)}><Link to="/dashboard/patient?tab=lab">Natija qiymatlarini kabinetda ko‘rish</Link></Button>
              )}
              {labAi.length > 0 && <p className="pt-1 text-xs font-bold uppercase text-muted-foreground">AI tahlillari</p>}
              {labAi.map((r) => (
                <button key={r.id} onClick={() => setAiOpen(r)} className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left">
                  <Brain className="h-5 w-5 shrink-0 text-ai-purple" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{serviceName(r.service_id)}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" })}</p></div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {labOrders.length === 0 && labAi.length === 0 && <EmptyState panel="labs" onGo={() => setPanel(null)} />}
            </div>
          )}

          {!loading && panel === "ai" && (
            ai.length === 0 ? <EmptyState panel="ai" onGo={() => setPanel(null)} /> : (
              <div className="space-y-3">
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Xizmat turi">
                  {[["all", ai.length] as [string, number], ...services].map(([id, n]) => (
                    <button key={id} onClick={() => setSvcFilter(id)} aria-pressed={svcFilter === id} className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-medium", svcFilter === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground")}>
                      {id === "all" ? "Barchasi" : serviceName(id)} · {n}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Sana">
                  {([["all", "Hammasi"], ["today", "Bugun"], ["7", "7 kun"], ["30", "30 kun"], ["custom", "Sana"]] as [DateRange, string][]).map(([k, l]) => (
                    <button key={k} onClick={() => setRange(k)} aria-pressed={range === k} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium", range === k ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}>{l}</button>
                  ))}
                  {range === "custom" && <Input type="date" value={customDay} onChange={(e) => setCustomDay(e.target.value)} className="h-8 w-40 text-xs" aria-label="Sanani tanlang" />}
                </div>
                <p className="text-xs text-muted-foreground">{filteredAi.length} ta xulosa topildi</p>
                {grouped.map(([day, rows]) => (
                  <div key={day} className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">{fmtDay(day)}</p>
                    {rows.map((r) => (
                      <button key={r.id} onClick={() => setAiOpen(r)} className="w-full rounded-lg border border-border p-3 text-left transition active:scale-[0.98]">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 shrink-0 text-ai-purple" />
                          <p className="flex-1 truncate text-sm font-semibold">{serviceName(r.service_id)}</p>
                          <span className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.content.replace(/[#*_>`]/g, "").slice(0, 200)}</p>
                      </button>
                    ))}
                  </div>
                ))}
                {filteredAi.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    Bu filtr bo‘yicha xulosa yo‘q.
                    <Button variant="link" size="sm" onClick={() => { setSvcFilter("all"); setRange("all"); }}>Filtrlarni tozalash</Button>
                  </div>
                )}
              </div>
            )
          )}

          {panel === "reminders" && <NativeHealthSettings />}
        </DialogContent>
      </Dialog>

      {/* Visit detail */}
      <Dialog open={!!visit} onOpenChange={(o) => !o && setVisit(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          {visit && (
            <>
              <DialogTitle>{visit.title}</DialogTitle>
              <DialogDescription>{visit.sourceLabel} · {VISIT_STATUS[visit.status ?? ""] ?? visit.status ?? "—"}</DialogDescription>
              <div className="space-y-2 text-sm">
                {visit.subtitle && <p className="font-medium text-foreground">{visit.subtitle}</p>}
                <p className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" /> {new Date(visit.date).toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                {visit.time && <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {visit.time.slice(0, 5)}</p>}
                {visit.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {visit.address}</p>}
                {visit.phone && <a href={`tel:${visit.phone}`} className="flex items-center gap-2 text-primary"><Phone className="h-4 w-4" /> {visit.phone}</a>}
                {Number(visit.price) > 0 && <p className="text-lg font-bold text-primary">{Number(visit.price).toLocaleString()} so‘m</p>}
                {visit.notes && <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{visit.notes}</p>}
              </div>
              <div className="grid gap-2 pt-2">
                {isVisitOpen(visit) && <Button variant="outline" onClick={() => { setVisit(null); setPanel("reminders"); }}><Bell /> Eslatmani sozlash</Button>}
                {visit.cancellable && <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => void cancelVisit(visit)}><XCircle /> Qabulni bekor qilish</Button>}
                <Button asChild><Link to="/doctors" onClick={() => setVisit(null)}><CalendarPlus /> Yangi qabulga yozilish</Link></Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI conclusion detail */}
      <Dialog open={!!aiOpen} onOpenChange={(o) => !o && setAiOpen(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          {aiOpen && (
            <>
              <DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-ai-purple" /> {serviceName(aiOpen.service_id)}</DialogTitle>
              <DialogDescription>{new Date(aiOpen.created_at).toLocaleString("uz-UZ", { dateStyle: "full", timeStyle: "short" })}</DialogDescription>
              <MarkdownView source={aiOpen.content} className="text-sm" />
              <p className="text-[11px] text-muted-foreground">AI xulosasi shifokor tashxisini almashtirmaydi.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(aiOpen.content).then(() => toast.success("Nusxa olindi")); }}><Copy /> Nusxa olish</Button>
                <Button asChild onClick={() => setAiOpen(null)}><Link to={aiPath(aiOpen.service_id)}>Xizmatni ochish</Link></Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Onboarding */}
      <Dialog open={guideOpen} onOpenChange={(o) => !o && finishGuide()}>
        <DialogContent className="fixed inset-0 left-0 top-0 z-[80] block h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden border-0 bg-primary p-0 text-primary-foreground sm:rounded-none [&>button]:hidden">
          <img key={GUIDE[step].image} src={GUIDE[step].image} alt="" className="mobile-guide-photo absolute inset-0 h-full w-full object-cover" />
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

export default MobileAppointmentsPage;
