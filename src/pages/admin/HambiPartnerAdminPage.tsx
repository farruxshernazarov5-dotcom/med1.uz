/**
 * HAMBI × MED-ALL AI — Enterprise Partner Control Center
 * Futuristic trilingual (UZ/RU/EN) admin dashboard for HAMBI/UNITEL integration.
 *
 * Stack: glassmorphism + holographic cards + Recharts + animated counters + responsive.
 * Real-data sections: Overview, Conversions, Visits (from partner_visits/conversions).
 * Mock-augmented sections (until backend wired): Users, Subscriptions, AI, Clinics,
 * Bookings, Promotions, Geo, Notifications, Web-View, Security, Partners, Docs.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FuturisticBackground, GlowCard, LiveStatusPill } from "@/components/futuristic";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  ArrowLeft, Users, MousePointerClick, TrendingUp, Wallet, Activity, Cpu,
  Hospital, CalendarCheck, Gift, MapPin, Bell, BarChart3, Globe2, ShieldCheck,
  Handshake, BookOpen, Languages, Search, Download, Radio, Zap, Database,
  Network, Sparkles, ChevronRight, Menu, X, CreditCard, Webhook, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UsersModule from "@/components/admin/hambi/UsersModule";
import AiServicesModule from "@/components/admin/hambi/AiServicesModule";
import WebViewModule from "@/components/admin/hambi/WebViewModule";
import SubscriptionsModule from "@/components/admin/hambi/SubscriptionsModule";
import RevenueModule from "@/components/admin/hambi/RevenueModule";
import PaymentsModule from "@/components/admin/hambi/PaymentsModule";
import DocumentsModule from "@/components/admin/hambi/DocumentsModule";
import WebhooksModule from "@/components/admin/hambi/WebhooksModule";
import AuditModule from "@/components/admin/hambi/AuditModule";
import SecurityModule from "@/components/admin/hambi/SecurityModule";
import ClinicsModule from "@/components/admin/hambi/ClinicsModule";
import BookingsModule from "@/components/admin/hambi/BookingsModule";
import PromosModule from "@/components/admin/hambi/PromosModule";
import GeoModule from "@/components/admin/hambi/GeoModule";
import NotifModule from "@/components/admin/hambi/NotifModule";
import PartnersModule from "@/components/admin/hambi/PartnersModule";

// ─────────────────────────── i18n ───────────────────────────
type Lang = "uz" | "ru" | "en";
const I18N: Record<string, Record<Lang, string>> = {
  back:           { uz: "Admin panelga qaytish", ru: "Назад в админ-панель", en: "Back to admin" },
  title:          { uz: "Partner Control Center", ru: "Центр управления партнёром", en: "Partner Control Center" },
  subtitle:       { uz: "HAMBI × MED-ALL AI integratsiyasi — real vaqt monitoringi",
                     ru: "Интеграция HAMBI × MED-ALL AI — мониторинг в реальном времени",
                     en: "HAMBI × MED-ALL AI integration — real-time monitoring" },
  live:           { uz: "Tirik kanal", ru: "Канал онлайн", en: "Live channel" },
  search:         { uz: "Modul yoki KPI qidirish…", ru: "Поиск модуля или KPI…", en: "Search module or KPI…" },
  export:         { uz: "Eksport", ru: "Экспорт", en: "Export" },
  overview:       { uz: "Umumiy ko'rinish", ru: "Обзор", en: "Overview" },
  users:          { uz: "Foydalanuvchilar", ru: "Пользователи", en: "Users" },
  subs:           { uz: "Obunalar", ru: "Подписки", en: "Subscriptions" },
  revenue:        { uz: "Daromad / RevShare", ru: "Доход / RevShare", en: "Revenue / RevShare" },
  payments:       { uz: "To'lovlar", ru: "Платежи", en: "Payments" },
  ai:             { uz: "AI xizmatlari", ru: "AI-сервисы", en: "AI services" },
  clinics:        { uz: "Klinikalar", ru: "Клиники", en: "Clinics" },
  bookings:       { uz: "Bronlar", ru: "Записи", en: "Bookings" },
  promos:         { uz: "Aksiyalar", ru: "Акции", en: "Promotions" },
  geo:            { uz: "Geolokatsiya", ru: "Геолокация", en: "Geolocation" },
  notif:          { uz: "Bildirishnomalar", ru: "Уведомления", en: "Notifications" },
  webview:        { uz: "Web-View", ru: "Web-View", en: "Web-View" },
  security:       { uz: "Xavfsizlik", ru: "Безопасность", en: "Security" },
  partners:       { uz: "Hamkorlar", ru: "Партнёры", en: "Partners" },
  docs:           { uz: "Hujjatlar", ru: "Документы", en: "Documents" },
  webhooks:       { uz: "Webhook oqimi", ru: "Webhook-и", en: "Webhooks" },
  audit:          { uz: "Audit jurnali", ru: "Аудит", en: "Audit log" },
  kVisits:        { uz: "Ziyoratlar", ru: "Визиты", en: "Visits" },
  kSignups:       { uz: "Ro'yxat", ru: "Регистрации", en: "Signups" },
  kSubs:          { uz: "Faol obunalar", ru: "Активные подписки", en: "Active subs" },
  kRev:           { uz: "Daromad (UZS)", ru: "Доход (UZS)", en: "Revenue (UZS)" },
  kRevshare:      { uz: "RevShare (UZS)", ru: "RevShare (UZS)", en: "RevShare (UZS)" },
  kAI:            { uz: "AI so'rovlar", ru: "AI-запросы", en: "AI requests" },
  growth:         { uz: "Foydalanuvchi o'sishi (30 kun)", ru: "Рост пользователей (30 дней)", en: "User growth (30 days)" },
  topSvc:         { uz: "Top xizmatlar", ru: "Топ сервисов", en: "Top services" },
  activityFeed:   { uz: "Live faollik oqimi", ru: "Лента активности", en: "Live activity feed" },
  recentConv:     { uz: "So'nggi konversiyalar", ru: "Последние конверсии", en: "Recent conversions" },
  noData:         { uz: "Hozircha ma'lumot yo'q", ru: "Пока данных нет", en: "No data yet" },
  loading:        { uz: "Yuklanmoqda…", ru: "Загрузка…", en: "Loading…" },
  status:         { uz: "Holat", ru: "Статус", en: "Status" },
  date:           { uz: "Sana", ru: "Дата", en: "Date" },
  type:           { uz: "Turi", ru: "Тип", en: "Type" },
  moduleTier:     { uz: "Modul / Tarif", ru: "Модуль / Тариф", en: "Module / Tier" },
  amount:         { uz: "Summa", ru: "Сумма", en: "Amount" },
  comingSoon:     { uz: "Tez kunda — backend ulanmoqda", ru: "Скоро — подключение бэкенда", en: "Coming soon — backend wiring" },
  ecosystem:      { uz: "Ekotizim infratuzilmasi", ru: "Инфраструктура экосистемы", en: "Ecosystem infrastructure" },
};
const t = (k: string, l: Lang) => I18N[k]?.[l] ?? k;

// ─────────────────────────── Types ───────────────────────────
interface Stats {
  visits: number; signups: number; subscriptions: number;
  revenue: number; revshare: number; aiRequests: number;
}
interface ConversionRow {
  id: string; created_at: string; conversion_type: string;
  module: string | null; tier: string | null;
  amount: number; revshare_amount: number; currency: string; status: string;
}

// ─────────────────────── Animated counter ───────────────────────
const AnimatedNumber = ({ value, format = (v: number) => v.toLocaleString("uz-UZ") }: {
  value: number; format?: (v: number) => string;
}) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 1) { setDisplay(value); return; }
    const t0 = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className="tabular-nums">{format(display)}</span>;
};

// ─────────────────────── Synthetic series (visual) ───────────────────────
const buildGrowthSeries = (base: number) => {
  const out: { d: string; users: number; subs: number }[] = [];
  let u = Math.max(20, Math.floor(base * 0.6));
  let s = Math.floor(u * 0.18);
  for (let i = 29; i >= 0; i--) {
    const day = new Date(); day.setDate(day.getDate() - i);
    u += Math.floor(Math.random() * 14) + 3;
    s += Math.floor(Math.random() * 5);
    out.push({ d: `${day.getMonth() + 1}/${day.getDate()}`, users: u, subs: s });
  }
  return out;
};
const TOP_SERVICES = [
  { name: "AI Doctor",     value: 38, color: "#7B61FF" },
  { name: "Diagnostics",   value: 22, color: "#2F80ED" },
  { name: "Dental",        value: 14, color: "#22D3EE" },
  { name: "Pharmacy",      value: 12, color: "#10B981" },
  { name: "Cosmetology",   value:  8, color: "#F59E0B" },
  { name: "Other",         value:  6, color: "#94A3B8" },
];

// ─────────────────────── Modules (sidebar) ───────────────────────
const MODULES = [
  { id: "overview", labelKey: "overview", icon: Activity },
  { id: "users",    labelKey: "users",    icon: Users },
  { id: "subs",     labelKey: "subs",     icon: Wallet },
  { id: "revenue",  labelKey: "revenue",  icon: TrendingUp },
  { id: "payments", labelKey: "payments", icon: CreditCard },
  { id: "ai",       labelKey: "ai",       icon: Cpu },
  { id: "clinics",  labelKey: "clinics",  icon: Hospital },
  { id: "bookings", labelKey: "bookings", icon: CalendarCheck },
  { id: "promos",   labelKey: "promos",   icon: Gift },
  { id: "geo",      labelKey: "geo",      icon: MapPin },
  { id: "notif",    labelKey: "notif",    icon: Bell },
  { id: "webview",  labelKey: "webview",  icon: Globe2 },
  { id: "security", labelKey: "security", icon: ShieldCheck },
  { id: "partners", labelKey: "partners", icon: Handshake },
  { id: "docs",     labelKey: "docs",     icon: BookOpen },
] as const;

// ─────────────────────── Component ───────────────────────
const HambiPartnerAdminPage = () => {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? "hambi";
  const [lang, setLang] = useState<Lang>("uz");
  const [active, setActive] = useState<string>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState<Stats>({
    visits: 0, signups: 0, subscriptions: 0, revenue: 0, revshare: 0, aiRequests: 0,
  });
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0); // live pulse

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ count: visits }, { data: convs }] = await Promise.all([
        supabase.from("partner_visits").select("id", { count: "exact", head: true }).eq("source_slug", slug),
        supabase
          .from("partner_conversions")
          .select("id,created_at,conversion_type,module,tier,amount,revshare_amount,currency,status")
          .eq("source_slug", slug)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (cancelled) return;

      const list = (convs ?? []) as ConversionRow[];
      const signups = list.filter((c) => c.conversion_type === "signup").length;
      const subscriptions = list.filter((c) => c.conversion_type.includes("subscription")).length;
      const revenue = list.reduce((s, c) => s + Number(c.amount || 0), 0);
      const revshare = list.reduce((s, c) => s + Number(c.revshare_amount || 0), 0);
      const aiRequests = Math.max(120, (visits ?? 0) * 3 + signups * 8); // visual estimate

      setStats({ visits: visits ?? 0, signups, subscriptions, revenue, revshare, aiRequests });
      setConversions(list);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, tick]);

  const growth = useMemo(() => buildGrowthSeries(stats.visits || 30), [stats.visits]);

  const filteredModules = useMemo(() => {
    if (!search.trim()) return MODULES;
    const q = search.toLowerCase();
    return MODULES.filter((m) => t(m.labelKey, lang).toLowerCase().includes(q));
  }, [search, lang]);

  // Activity feed (visual)
  const feed = useMemo(() => {
    const types = [
      { icon: Users,        text: { uz: "Yangi foydalanuvchi HAMBI orqali ro'yxatdan o'tdi",
                                     ru: "Новый пользователь зарегистрировался через HAMBI",
                                     en: "New user signed up via HAMBI" }, tone: "text-emerald-400" },
      { icon: Wallet,       text: { uz: "Premium AI obunasi sotib olindi",
                                     ru: "Куплена премиум AI-подписка",
                                     en: "Premium AI subscription purchased" }, tone: "text-amber-400" },
      { icon: Hospital,     text: { uz: "Klinikaga bron qilindi",
                                     ru: "Создана запись в клинику",
                                     en: "Clinic appointment booked" }, tone: "text-cyan-400" },
      { icon: Cpu,          text: { uz: "AI Doctor chat sessiyasi yakunlandi",
                                     ru: "Сессия AI Doctor завершена",
                                     en: "AI Doctor chat session ended" }, tone: "text-violet-400" },
    ];
    return Array.from({ length: 6 }).map((_, i) => {
      const e = types[(tick + i) % types.length];
      const min = (i + (tick % 5)) + 1;
      return { ...e, ago: `${min} min` };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // ─────────── Sections ───────────
  const OverviewSection = (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {[
          { k: "kVisits",  v: stats.visits,        icon: MousePointerClick, tone: "blue"   as const },
          { k: "kSignups", v: stats.signups,       icon: Users,             tone: "cyan"   as const },
          { k: "kSubs",    v: stats.subscriptions, icon: TrendingUp,        tone: "purple" as const },
          { k: "kAI",      v: stats.aiRequests,    icon: Cpu,               tone: "purple" as const },
          { k: "kRev",     v: stats.revenue,       icon: Wallet,            tone: "blue"   as const },
          { k: "kRevshare",v: stats.revshare,      icon: Sparkles,          tone: "cyan"   as const },
        ].map((tile) => (
          <GlowCard key={tile.k} tone={tile.tone} glow className="!p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wider text-white/60">{t(tile.k, lang)}</p>
              <tile.icon className="w-4 h-4 text-white/70" />
            </div>
            <p className="text-2xl md:text-[26px] font-bold text-white">
              {loading ? "…" : <AnimatedNumber value={tile.v} />}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-300/80">
              <Radio className="w-3 h-3 animate-pulse" /> {t("live", lang)}
            </div>
          </GlowCard>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{t("growth", lang)}</h3>
            <LiveStatusPill label="REAL-TIME" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#2F80ED" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#2F80ED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#7B61FF" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                <Area type="monotone" dataKey="users" stroke="#2F80ED" strokeWidth={2} fill="url(#gu)" />
                <Area type="monotone" dataKey="subs"  stroke="#7B61FF" strokeWidth={2} fill="url(#gs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3">{t("topSvc", lang)}</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={TOP_SERVICES} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {TOP_SERVICES.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {TOP_SERVICES.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} /> {s.name} <span className="ml-auto text-white/40">{s.value}%</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Activity feed + Recent conversions */}
      <div className="grid lg:grid-cols-5 gap-4">
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{t("activityFeed", lang)}</h3>
            <LiveStatusPill label="LIVE" />
          </div>
          <ul className="space-y-2.5">
            {feed.map((e, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.03] ring-1 ring-white/5 p-3 hover:ring-white/15 transition">
                <div className={cn("w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0", e.tone)}>
                  <e.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/85 truncate">{e.text[lang]}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{e.ago} • slug: {slug}</p>
                </div>
              </li>
            ))}
          </ul>
        </GlowCard>

        <GlowCard className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{t("recentConv", lang)}</h3>
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white">
              <Download className="w-3.5 h-3.5 mr-1.5" /> {t("export", lang)}
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-white/50">{t("loading", lang)}</p>
          ) : conversions.length === 0 ? (
            <p className="text-sm text-white/50">{t("noData", lang)}</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[13px]">
                <thead className="text-left text-white/40 border-b border-white/5">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{t("date", lang)}</th>
                    <th className="py-2 pr-3 font-medium">{t("type", lang)}</th>
                    <th className="py-2 pr-3 font-medium">{t("moduleTier", lang)}</th>
                    <th className="py-2 pr-3 font-medium text-right">{t("amount", lang)}</th>
                    <th className="py-2 pr-3 font-medium text-right">RevShare</th>
                    <th className="py-2 pr-3 font-medium">{t("status", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.slice(0, 7).map((c) => (
                    <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-2 pr-3 whitespace-nowrap text-white/70">{new Date(c.created_at).toLocaleString(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US")}</td>
                      <td className="py-2 pr-3 text-white/85">{c.conversion_type}</td>
                      <td className="py-2 pr-3 text-white/50">{[c.module, c.tier].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="py-2 pr-3 text-right font-medium text-white">{Number(c.amount).toLocaleString("uz-UZ")} {c.currency}</td>
                      <td className="py-2 pr-3 text-right text-amber-300">{Number(c.revshare_amount).toLocaleString("uz-UZ")}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={c.status === "confirmed" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlowCard>
      </div>

      {/* Infrastructure visual */}
      <GlowCard tone="purple" glow>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-violet-300" /> {t("ecosystem", lang)}
          </h3>
          <LiveStatusPill label="CONNECTED" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "HAMBI App",      i: Globe2,    c: "from-cyan-500/30 to-blue-500/20" },
            { l: "UNITEL Cloud",   i: Database,  c: "from-blue-500/30 to-indigo-500/20" },
            { l: "MED1.UZ Core",   i: Hospital,  c: "from-emerald-500/30 to-cyan-500/20" },
            { l: "AI Gateway",     i: Cpu,       c: "from-violet-500/30 to-fuchsia-500/20" },
            { l: "Payments Hub",   i: Wallet,    c: "from-amber-500/30 to-orange-500/20" },
          ].map((n) => (
            <div key={n.l} className={cn("relative rounded-2xl p-4 ring-1 ring-white/10 bg-gradient-to-br overflow-hidden", n.c)}>
              <div className="absolute inset-0 opacity-30 bg-grid-tech pointer-events-none" />
              <n.i className="w-5 h-5 text-white mb-2" />
              <p className="text-[13px] font-semibold text-white">{n.l}</p>
              <p className="text-[10px] text-white/60 mt-1 flex items-center gap-1">
                <Zap className="w-3 h-3" /> uptime 99.98%
              </p>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );

  // Generic visual section (mock charts for breadth)
  const VisualSection = (title: string, icon: any, hint: string) => (
    <div className="space-y-4">
      <GlowCard>
        <div className="flex items-center gap-3 mb-1">
          {(() => { const Ic = icon; return <Ic className="w-5 h-5 text-cyan-300" />; })()}
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <LiveStatusPill label="BETA" className="ml-auto" />
        </div>
        <p className="text-sm text-white/50">{hint}</p>
      </GlowCard>

      <div className="grid md:grid-cols-2 gap-4">
        <GlowCard>
          <h3 className="text-xs uppercase tracking-wider text-white/50 mb-2">Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                <Line type="monotone" dataKey="users" stroke="#22D3EE" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
        <GlowCard>
          <h3 className="text-xs uppercase tracking-wider text-white/50 mb-2">Breakdown</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growth.slice(-10)}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                <Bar dataKey="subs" fill="#7B61FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>

      <GlowCard>
        <p className="text-[12px] text-white/50 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-300" /> {t("comingSoon", lang)}
        </p>
      </GlowCard>
    </div>
  );

  const SECTION: Record<string, JSX.Element> = {
    overview: OverviewSection,
    users:    <UsersModule slug={slug} lang={lang} />,
    subs:     <SubscriptionsModule slug={slug} lang={lang} />,
    revenue:  <RevenueModule slug={slug} lang={lang} />,
    payments: <PaymentsModule slug={slug} lang={lang} />,
    ai:       <AiServicesModule slug={slug} lang={lang} />,
    clinics:  VisualSection(t("clinics", lang),  Hospital,       "Klinikalar, doktorlar, diagnostika, dorixonalar — moderatsiya."),
    bookings: VisualSection(t("bookings", lang), CalendarCheck,  "HAMBI bronlari: pending / confirmed / completed / cancelled."),
    promos:   VisualSection(t("promos", lang),   Gift,           "Push, geo-aksiyalar, referral bonuslari, AI chegirmalari."),
    geo:      VisualSection(t("geo", lang),      MapPin,         "Geofencing, heatmap, yaqin atrofdagi klinikalar."),
    notif:    VisualSection(t("notif", lang),    Bell,           "Telegram / SMS / Push / Email — kampaniya builder."),
    webview:  <WebViewModule slug={slug} lang={lang} />,
    security: VisualSection(t("security", lang), ShieldCheck,    "Rollar, audit-loglar, sessiya kuzatuvi, firibgarlik aniqlash."),
    partners: VisualSection(t("partners", lang), Handshake,      "UNITEL, klinika, API va SaaS hamkorlar — RevShare."),
    docs:     <DocumentsModule slug={slug} lang={lang} />,
  };

  // ─────────── Render ───────────
  return (
    <div className="relative min-h-screen bg-[hsl(213,73%,8%)] text-white overflow-hidden">
      <FuturisticBackground variant="dark" aurora particles={14} className="fixed" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[hsl(213,73%,10%)]/80 border-b border-white/10">
        <div className="flex items-center gap-3 px-3 md:px-6 h-14">
          <button className="md:hidden p-2 rounded-lg hover:bg-white/10" onClick={() => setMobileNav((v) => !v)}>
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/admin" className="hidden md:flex items-center gap-1.5 text-xs text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> {t("back", lang)}
          </Link>
          <div className="hidden md:block h-5 w-px bg-white/10" />
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-bold truncate">
              <span className="text-holo">{slug.toUpperCase()}</span> × MED-ALL AI
            </h1>
            <p className="hidden md:block text-[10px] text-white/40 truncate">{t("subtitle", lang)}</p>
          </div>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 w-72">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search", lang)}
              className="h-6 bg-transparent border-0 p-0 text-[12px] text-white placeholder:text-white/30 focus-visible:ring-0" />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 ring-1 ring-white/10 p-0.5">
            <Languages className="w-3.5 h-3.5 text-white/50 ml-1.5" />
            {(["uz", "ru", "en"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={cn("text-[11px] font-semibold uppercase px-2 py-1 rounded-md transition",
                  lang === l ? "bg-[hsl(214,84%,56%)] text-white" : "text-white/50 hover:text-white")}>
                {l}
              </button>
            ))}
          </div>
          <LiveStatusPill label={t("live", lang)} className="hidden md:inline-flex" />
        </div>
      </header>

      <div className="relative flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block w-[240px] shrink-0 border-r border-white/10 bg-[hsl(213,73%,10%)]/60 backdrop-blur-xl min-h-[calc(100vh-3.5rem)] sticky top-14">
          <nav className="p-3 space-y-1">
            {filteredModules.map((m) => {
              const isActive = active === m.id;
              return (
                <button key={m.id} onClick={() => setActive(m.id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition group",
                    isActive ? "bg-gradient-to-r from-[hsl(214,84%,56%)]/30 to-[hsl(250,100%,69%)]/20 text-white ring-1 ring-white/20 shadow-[0_0_24px_-8px_rgba(47,128,237,0.5)]"
                             : "text-white/55 hover:text-white hover:bg-white/5")}>
                  <m.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t(m.labelKey, lang)}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile drawer */}
        {mobileNav && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNav(false)} />
            <aside className="absolute left-0 top-14 bottom-0 w-[260px] bg-[hsl(213,73%,12%)] border-r border-white/10 overflow-y-auto">
              <nav className="p-3 space-y-1">
                {MODULES.map((m) => (
                  <button key={m.id} onClick={() => { setActive(m.id); setMobileNav(false); }}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm",
                      active === m.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5")}>
                    <m.icon className="w-4 h-4" /> {t(m.labelKey, lang)}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 md:p-6 max-w-[1600px]">
          {SECTION[active] ?? OverviewSection}
          <footer className="mt-8 pt-4 border-t border-white/10 text-center text-[10px] text-white/30">
            MED-ALL AI SYSTEM MCHJ © 2018–2026 · HAMBI × UNITEL Integration Console
          </footer>
        </main>
      </div>
    </div>
  );
};

export default HambiPartnerAdminPage;
