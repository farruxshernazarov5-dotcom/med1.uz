/**
 * HAMBI × MED-ALL AI — Web-View Management Module
 * Embedded MED1.UZ pages inside HAMBI: page registry, UX settings,
 * Return-to-HAMBI button styling, geo AI, smart notifications, security.
 * Trilingual UZ/RU/EN, futuristic glassmorphism UI.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Globe2, Smartphone, ArrowLeft, ExternalLink, Palette, MoonStar, Sun, Sparkles,
  Bell, MapPin, ShieldCheck, Activity, RefreshCw, Copy, Check, Eye,
  ChevronRight, Zap, Wifi, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Lang = "uz" | "ru" | "en";
const I = (uz: string, ru: string, en: string, l: Lang) => ({ uz, ru, en })[l];

const Animated = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = v, diff = value - start;
    if (Math.abs(diff) < 1) { setV(value); return; }
    const t0 = performance.now(); let raf = 0;
    const tick = (n: number) => {
      const p = Math.min(1, (n - t0) / 800);
      setV(Math.round(start + diff * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className="tabular-nums">{v.toLocaleString("uz-UZ")}{suffix}</span>;
};

const PAGES = [
  { id: "home",     label: "MED1.UZ Home",        path: "/",                 active: true,  hits: 12480 },
  { id: "ai",       label: "AI Services",         path: "/ai",               active: true,  hits: 8230 },
  { id: "doctor",   label: "AI Doctor",           path: "/ai/doctor",        active: true,  hits: 6150 },
  { id: "clinics",  label: "Clinics",             path: "/clinics",          active: true,  hits: 4820 },
  { id: "booking",  label: "Booking",             path: "/booking",          active: true,  hits: 3170 },
  { id: "pricing",  label: "Pricing",             path: "/pricing",          active: true,  hits: 2105 },
  { id: "symptom",  label: "Symptom Checker",     path: "/symptom-checker",  active: true,  hits: 1980 },
  { id: "diag",     label: "Diagnostics",         path: "/diagnostika",      active: false, hits: 540 },
];

const buildSeries = (days = 30) => {
  const out: any[] = []; let v = 200; let s = 120;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    v += Math.floor(Math.random() * 60) + 10;
    s += Math.floor(Math.random() * 35) + 5;
    out.push({ d: `${d.getMonth() + 1}/${d.getDate()}`, views: v, sessions: s });
  }
  return out;
};

interface Props { slug: string; lang: Lang }

const WebViewModule = ({ slug, lang }: Props) => {
  const [stats, setStats] = useState({ visits: 0, sessions: 0, avgDur: 0, returnRate: 0, conv: 0 });
  const [pages, setPages] = useState(PAGES);
  const [theme, setTheme] = useState<"dark" | "light" | "auto">("auto");
  const [btnStyle, setBtnStyle] = useState<"floating" | "topbar" | "minimal">("floating");
  const [returnUrl, setReturnUrl] = useState("hambi://app/home");
  const [animLoading, setAnimLoading] = useState(true);
  const [mobileOpt, setMobileOpt] = useState(true);
  const [copied, setCopied] = useState(false);
  const series = useMemo(() => buildSeries(), []);

  const load = async () => {
    const { count } = await supabase
      .from("partner_visits").select("id", { count: "exact", head: true }).eq("source_slug", slug);
    const visits = count ?? 0;
    setStats({
      visits,
      sessions:   Math.floor(visits * 0.78),
      avgDur:     180 + Math.floor(Math.random() * 240),
      returnRate: 42 + Math.floor(Math.random() * 25),
      conv:       8 + Math.floor(Math.random() * 12),
    });
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  const webviewURL = `https://med1.uz/?source=${slug}&webview=1`;
  const copyURL = () => {
    navigator.clipboard.writeText(webviewURL);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
    toast({ title: I("Nusxalandi", "Скопировано", "Copied", lang), description: webviewURL });
  };

  const togglePage = (id: string) =>
    setPages((arr) => arr.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));

  const tiles = [
    { k: I("Web-View ziyoratlari", "Web-View визиты",  "Web-View visits", lang), v: stats.visits,     icon: Globe2,     tone: "blue"   as const },
    { k: I("Sessiyalar",            "Сессии",          "Sessions",        lang), v: stats.sessions,   icon: Smartphone, tone: "cyan"   as const },
    { k: I("O'rt. davomiyligi (s)", "Сред. длит. (с)", "Avg duration (s)", lang), v: stats.avgDur,    icon: Activity,   tone: "purple" as const },
    { k: I("Qaytish ulushi %",      "Возвраты %",      "Return rate %",   lang), v: stats.returnRate, icon: ArrowLeft,  tone: "blue"   as const, suffix: "%" },
    { k: I("Konversiya %",          "Конверсия %",     "Conversion %",    lang), v: stats.conv,       icon: Sparkles,   tone: "cyan"   as const, suffix: "%" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 ring-1 ring-white/15 flex items-center justify-center">
          <Globe2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            {I("Web-View boshqaruvi", "Управление Web-View", "Web-View Management", lang)}
          </h2>
          <p className="text-[11px] text-white/40">
            {I("HAMBI ichida MED1.UZ embedded — seamless tajriba", "MED1.UZ внутри HAMBI — бесшовный опыт", "MED1.UZ embedded inside HAMBI — seamless experience", lang)}
          </p>
        </div>
        <LiveStatusPill label="WEB-VIEW LIVE" />
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={load} className="text-white/70 hover:text-white">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {I("Yangilash", "Обновить", "Refresh", lang)}
        </Button>
        <Button size="sm" variant="secondary" onClick={copyURL}>
          {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
          {I("URL nusxalash", "Копировать URL", "Copy URL", lang)}
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <GlowCard key={t.k} tone={t.tone} glow className="!p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-white/55 truncate">{t.k}</p>
              <t.icon className="w-3.5 h-3.5 text-white/70 shrink-0" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">
              <Animated value={t.v} suffix={t.suffix ?? ""} />
            </p>
          </GlowCard>
        ))}
      </div>

      {/* Traffic + Phone preview */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">
              {I("Web-View trafigi (30 kun)", "Трафик Web-View (30 дней)", "Web-View traffic (30 days)", lang)}
            </h3>
            <LiveStatusPill label="REAL-TIME" />
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="wv1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wv2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2F80ED" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2F80ED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                <Area type="monotone" dataKey="views"    stroke="#22D3EE" strokeWidth={2} fill="url(#wv1)" />
                <Area type="monotone" dataKey="sessions" stroke="#2F80ED" strokeWidth={2} fill="url(#wv2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        {/* Live phone preview */}
        <GlowCard tone="cyan" glow>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-300" />
            {I("HAMBI ichidagi ko'rinish", "Превью внутри HAMBI", "Live HAMBI preview", lang)}
          </h3>
          <div className="mx-auto w-[200px] h-[360px] rounded-[28px] bg-[hsl(213,73%,6%)] ring-1 ring-white/15 shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)] p-2 relative overflow-hidden">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-black/60 z-10" />
            <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-[hsl(213,73%,12%)] to-[hsl(213,73%,8%)] overflow-hidden flex flex-col">
              <div className="h-7 px-2 flex items-center gap-1 border-b border-white/5 text-[8px] text-white/50">
                <Wifi className="w-2.5 h-2.5" /> med1.uz
              </div>
              <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
                <div className="h-10 rounded-md bg-gradient-to-r from-violet-500/30 to-cyan-500/30 ring-1 ring-white/10" />
                <div className="grid grid-cols-2 gap-1.5">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="h-12 rounded-md bg-white/5 ring-1 ring-white/5" />
                  ))}
                </div>
                <div className="h-3 w-2/3 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/10 rounded" />
              </div>
              {/* Floating return button */}
              {btnStyle === "floating" && (
                <button className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-[9px] font-bold text-white shadow-[0_0_16px_rgba(34,211,238,0.6)] animate-pulse">
                  <ArrowLeft className="w-2.5 h-2.5" /> HAMBI
                </button>
              )}
              {btnStyle === "topbar" && (
                <button className="absolute top-8 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 text-[8px] text-white">
                  <ArrowLeft className="w-2 h-2" /> HAMBI
                </button>
              )}
              {btnStyle === "minimal" && (
                <button className="absolute top-8 right-2 z-20 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-white">
                  <ArrowLeft className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-white/40 text-center mt-2">
            {I("Stil: ", "Стиль: ", "Style: ", lang)}<span className="text-white/70 font-semibold">{btnStyle}</span>
          </p>
        </GlowCard>
      </div>

      {/* Pages registry + UX Settings */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Pages */}
        <GlowCard className="lg:col-span-3 !p-0 overflow-hidden">
          <div className="p-4 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-cyan-300" />
              {I("Embedded sahifalar", "Встроенные страницы", "Embedded pages", lang)}
            </h3>
            <Badge variant="outline" className="border-white/15 text-white/60 text-[10px]">
              {pages.filter((p) => p.active).length} / {pages.length} active
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-left text-white/40 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-2 font-medium text-[10.5px] uppercase tracking-wider">{I("Sahifa", "Страница", "Page", lang)}</th>
                  <th className="px-4 py-2 font-medium text-[10.5px] uppercase tracking-wider">Path</th>
                  <th className="px-4 py-2 font-medium text-[10.5px] uppercase tracking-wider text-right">{I("Ziyoratlar", "Визиты", "Hits", lang)}</th>
                  <th className="px-4 py-2 font-medium text-[10.5px] uppercase tracking-wider text-center">{I("Holat", "Статус", "Status", lang)}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 text-white font-medium">{p.label}</td>
                    <td className="px-4 py-2.5 text-white/50 font-mono text-[11px]">{p.path}</td>
                    <td className="px-4 py-2.5 text-right text-cyan-300 tabular-nums font-semibold">
                      {p.hits.toLocaleString("uz-UZ")}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Switch checked={p.active} onCheckedChange={() => togglePage(p.id)} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a href={`https://med1.uz${p.path}?source=${slug}&webview=1`}
                         target="_blank" rel="noreferrer"
                         className="text-white/40 hover:text-white inline-flex items-center gap-1 text-[11px]">
                        <Eye className="w-3 h-3" /> {I("Ko'rish", "Открыть", "Open", lang)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlowCard>

        {/* UX Settings */}
        <GlowCard className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-violet-300" />
            {I("UX sozlamalari", "Настройки UX", "UX settings", lang)}
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-white/50">
                {I("Mavzu", "Тема", "Theme", lang)}
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {([
                  ["dark",  "Dark",  MoonStar],
                  ["light", "Light", Sun],
                  ["auto",  "Auto",  Sparkles],
                ] as const).map(([id, l, Ic]) => (
                  <button key={id} onClick={() => setTheme(id)}
                    className={cn("flex items-center gap-1.5 justify-center py-2 rounded-lg text-[11px] font-semibold ring-1 transition",
                      theme === id
                        ? "bg-gradient-to-r from-violet-500/30 to-cyan-500/20 text-white ring-white/25"
                        : "bg-white/[0.03] text-white/55 ring-white/10 hover:text-white")}>
                    <Ic className="w-3 h-3" /> {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-white/50">
                {I("Return tugma stili", "Стиль кнопки возврата", "Return button style", lang)}
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {(["floating", "topbar", "minimal"] as const).map((id) => (
                  <button key={id} onClick={() => setBtnStyle(id)}
                    className={cn("py-2 rounded-lg text-[11px] font-semibold capitalize ring-1 transition",
                      btnStyle === id
                        ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/20 text-white ring-white/25"
                        : "bg-white/[0.03] text-white/55 ring-white/10 hover:text-white")}>
                    {id}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-white/50">
                {I("HAMBI return URL", "URL возврата HAMBI", "HAMBI return URL", lang)}
              </Label>
              <Input value={returnUrl} onChange={(e) => setReturnUrl(e.target.value)}
                className="mt-1.5 h-9 bg-white/[0.03] border-white/10 text-white text-[12px] font-mono" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] ring-1 ring-white/5">
              <span className="text-[12px] text-white/75 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                {I("Loading animatsiya", "Анимация загрузки", "Loading animation", lang)}
              </span>
              <Switch checked={animLoading} onCheckedChange={setAnimLoading} />
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] ring-1 ring-white/5">
              <span className="text-[12px] text-white/75 flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
                {I("Mobile optimizatsiya", "Mobile оптимизация", "Mobile optimization", lang)}
              </span>
              <Switch checked={mobileOpt} onCheckedChange={setMobileOpt} />
            </div>

            <Button className="w-full" size="sm">
              <Check className="w-3.5 h-3.5 mr-1.5" /> {I("Sozlamalarni saqlash", "Сохранить настройки", "Save settings", lang)}
            </Button>
          </div>
        </GlowCard>
      </div>

      {/* Geo AI + Smart Notifications + Security */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-300" />
            {I("Geo AI xizmatlari", "Гео AI-сервисы", "Geo AI services", lang)}
          </h3>
          <ul className="space-y-2 text-[12px]">
            {[
              ["Toshkent",   320, "+18%"],
              ["Samarqand",  180, "+12%"],
              ["Buxoro",     142, "+9%"],
              ["Andijon",    110, "+7%"],
              ["Farg'ona",    98, "+4%"],
            ].map(([city, hits, delta]) => (
              <li key={city as string} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] ring-1 ring-white/5">
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-white/80 flex-1">{city}</span>
                <span className="text-white/60 tabular-nums">{hits}</span>
                <span className="text-emerald-300 text-[11px] font-semibold">{delta}</span>
              </li>
            ))}
          </ul>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-300" />
            {I("Smart notifications", "Smart-уведомления", "Smart notifications", lang)}
          </h3>
          <ul className="space-y-2 text-[12.5px]">
            {[
              { c: "from-violet-500/30 to-cyan-500/20", l: "Push", v: "1,420" },
              { c: "from-cyan-500/30 to-blue-500/20",   l: "Telegram", v: "812" },
              { c: "from-emerald-500/30 to-cyan-500/20", l: "Email", v: "640" },
              { c: "from-amber-500/30 to-orange-500/20", l: "SMS", v: "210" },
            ].map((n) => (
              <li key={n.l} className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-r ring-1 ring-white/10", n.c)}>
                <Send className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white flex-1 font-medium">{n.l}</span>
                <span className="text-white/85 font-bold tabular-nums">{n.v}</span>
              </li>
            ))}
          </ul>
          <Button size="sm" className="w-full mt-3" variant="secondary">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> {I("AI kampaniya yaratish", "Создать AI кампанию", "Create AI campaign", lang)}
          </Button>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
            {I("Web-View xavfsizligi", "Безопасность Web-View", "Web-View security", lang)}
          </h3>
          <ul className="space-y-2 text-[12.5px]">
            {[
              { l: I("Token validatsiyalari", "Валидации токенов", "Token validations", lang), v: 9421, c: "text-emerald-300" },
              { l: I("Throttled so'rovlar",    "Throttled запросы", "Throttled requests", lang), v: 17,  c: "text-amber-300" },
              { l: I("Bloklangan domenlar",    "Заблокированные домены", "Blocked domains", lang), v: 3, c: "text-rose-300" },
              { l: I("Faol sessiyalar",        "Активные сессии", "Active sessions", lang), v: 184, c: "text-cyan-300" },
            ].map((r) => (
              <li key={r.l} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] ring-1 ring-white/5">
                <span className="text-white/70">{r.l}</span>
                <span className={cn("font-bold tabular-nums", r.c)}>{r.v}</span>
              </li>
            ))}
          </ul>
        </GlowCard>
      </div>

      {/* Sessions bar chart */}
      <GlowCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-300" />
            {I("Sessiyalar va konversiyalar", "Сессии и конверсии", "Sessions & conversions", lang)}
          </h3>
          <Button size="sm" variant="ghost" className="text-white/60 hover:text-white">
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series.slice(-14)}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              <Bar dataKey="sessions" fill="#22D3EE" radius={[6, 6, 0, 0]} />
              <Bar dataKey="views"    fill="#7B61FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>
    </div>
  );
};

export default WebViewModule;
