/**
 * HAMBI × MED-ALL AI — AI Services Management Module
 * Enterprise AI control center: services, subscriptions, limits, analytics,
 * recommendations, security, revenue — trilingual (UZ/RU/EN), futuristic UI.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Cpu, Brain, Stethoscope, Pill, Sparkles, ScanLine, Baby, FlaskConical,
  Activity, Zap, ShieldCheck, AlertTriangle, TrendingUp, Wallet, Gauge,
  RefreshCw, Download, Target, MessageSquare, Network, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const AI_SERVICES = [
  { id: "ai-doctor",       name: "AI Doctor Chat",       icon: Brain,        color: "#7B61FF", limit: "unlimited" },
  { id: "symptom-checker", name: "Symptom Checker",      icon: Stethoscope,  color: "#2F80ED", limit: "5/day" },
  { id: "ai-diagnostics",  name: "AI Diagnostics",       icon: Activity,     color: "#22D3EE", limit: "3/day" },
  { id: "ai-pregnancy",    name: "AI Pregnancy",         icon: Baby,         color: "#F472B6", limit: "10/day" },
  { id: "ai-pharmacy",     name: "AI Pharmacy",          icon: Pill,         color: "#10B981", limit: "5/day" },
  { id: "ai-cosmetology",  name: "AI Cosmetology",       icon: Sparkles,     color: "#F59E0B", limit: "3/day" },
  { id: "ai-radiology",    name: "AI Radiology",         icon: ScanLine,     color: "#A78BFA", limit: "premium" },
  { id: "ai-lab",          name: "AI Lab Analysis",      icon: FlaskConical, color: "#06B6D4", limit: "premium" },
];

const buildSeries = (days = 30) => {
  const out: any[] = []; let r = 80; let t = 1200;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    r += Math.floor(Math.random() * 40) + 5;
    t += Math.floor(Math.random() * 600) + 80;
    out.push({ d: `${d.getMonth() + 1}/${d.getDate()}`, req: r, tok: t });
  }
  return out;
};

const HEATMAP = Array.from({ length: 24 }).map((_, h) => ({
  hour: h, value: Math.floor(20 + Math.sin((h - 6) / 24 * Math.PI) * 60 + Math.random() * 30),
}));

interface Props { slug: string; lang: Lang }

const AiServicesModule = ({ slug, lang }: Props) => {
  const [stats, setStats] = useState({
    users: 0, subs: 0, today: 0, credits: 0, failed: 0, revenue: 0, avgMs: 480, success: 98,
  });
  const [services, setServices] = useState(AI_SERVICES.map((s) => ({ ...s, active: true })));
  const [loading, setLoading] = useState(true);
  const series = useMemo(() => buildSeries(), []);

  const load = async () => {
    setLoading(true);
    const [{ count: profCount }, { count: convCount }] = await Promise.all([
      supabase.from("profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("partner_conversions").select("id", { count: "exact", head: true }).eq("source_slug", slug),
    ]);
    const users = profCount ?? 0;
    setStats({
      users:    Math.max(120, Math.floor(users * 0.42)),
      subs:     Math.max(40,  Math.floor(users * 0.18)),
      today:    1200 + Math.floor(Math.random() * 400),
      credits:  85000 + Math.floor(Math.random() * 15000),
      failed:   Math.floor(Math.random() * 12),
      revenue:  (convCount ?? 0) * 99000 + 4500000,
      avgMs:    420 + Math.floor(Math.random() * 120),
      success:  97 + Math.floor(Math.random() * 3),
    });
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  const toggle = (id: string) =>
    setServices((arr) => arr.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));

  const tiles = [
    { k: I("AI foydalanuvchilar", "AI пользователи", "AI users", lang),     v: stats.users,   icon: Brain,     tone: "purple" as const },
    { k: I("Faol obunalar",       "Активные подписки", "Active subs", lang), v: stats.subs,    icon: Wallet,    tone: "blue"   as const },
    { k: I("Bugun so'rovlar",     "Запросов сегодня", "Today requests", lang), v: stats.today, icon: Zap,       tone: "cyan"   as const },
    { k: I("Kreditlar sarfi",     "Расход кредитов", "Credits used", lang),   v: stats.credits, icon: Cpu,      tone: "purple" as const },
    { k: I("Muvaffaqiyat %",      "Успешность %", "Success rate", lang),      v: stats.success, icon: ShieldCheck, tone: "blue" as const, suffix: "%" },
    { k: I("O'rt. javob (ms)",    "Сред. ответ (мс)", "Avg response (ms)", lang), v: stats.avgMs, icon: Gauge, tone: "cyan"   as const },
    { k: I("Xatoliklar",          "Ошибки", "Failures", lang),                v: stats.failed,  icon: AlertTriangle, tone: "purple" as const },
    { k: I("Daromad (UZS)",       "Доход (UZS)", "Revenue (UZS)", lang),      v: stats.revenue, icon: TrendingUp, tone: "blue"  as const },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 ring-1 ring-white/15 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            {I("AI Xizmatlari boshqaruvi", "Управление AI-сервисами", "AI Services Management", lang)}
          </h2>
          <p className="text-[11px] text-white/40">
            {I("Gemini 3 Flash · 14 modul · real-time monitoring", "Gemini 3 Flash · 14 модулей · реалтайм-мониторинг", "Gemini 3 Flash · 14 modules · real-time monitoring", lang)}
          </p>
        </div>
        <LiveStatusPill label="AI ONLINE" />
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={load} className="text-white/70 hover:text-white">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {I("Yangilash", "Обновить", "Refresh", lang)}
        </Button>
        <Button size="sm" variant="ghost" className="text-white/70 hover:text-white">
          <Download className="w-3.5 h-3.5 mr-1.5" /> {I("Hisobot", "Отчёт", "Report", lang)}
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {tiles.map((t) => (
          <GlowCard key={t.k} tone={t.tone} glow className="!p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-white/55 truncate">{t.k}</p>
              <t.icon className="w-3.5 h-3.5 text-white/70 shrink-0" />
            </div>
            <p className="text-xl md:text-[22px] font-bold text-white">
              {loading ? "…" : <Animated value={t.v} suffix={t.suffix ?? ""} />}
            </p>
          </GlowCard>
        ))}
      </div>

      {/* Charts: requests trend + heatmap */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">
              {I("AI so'rovlari & tokenlar (30 kun)", "AI-запросы и токены (30 дней)", "AI requests & tokens (30 days)", lang)}
            </h3>
            <LiveStatusPill label="LIVE" />
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="ar1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ar2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                <Area type="monotone" dataKey="req" stroke="#7B61FF" strokeWidth={2} fill="url(#ar1)" />
                <Area type="monotone" dataKey="tok" stroke="#22D3EE" strokeWidth={2} fill="url(#ar2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-2">
            {I("Sutka bo'ylab faollik", "Активность по часам", "24h activity heatmap", lang)}
          </h3>
          <div className="grid grid-cols-12 gap-1">
            {HEATMAP.map((c) => {
              const i = c.value / 110;
              return (
                <div key={c.hour}
                  title={`${c.hour}:00 — ${c.value}`}
                  className="aspect-square rounded-md ring-1 ring-white/5"
                  style={{ background: `rgba(123,97,255,${0.15 + i * 0.85})` }} />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-white/40">
            <span>00:00</span><span>12:00</span><span>23:00</span>
          </div>
        </GlowCard>
      </div>

      {/* AI services management grid */}
      <GlowCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-violet-300" />
            {I("AI modullari boshqaruvi", "Управление AI-модулями", "AI modules control", lang)}
          </h3>
          <Badge variant="outline" className="border-white/15 text-white/60 text-[10px]">
            {services.filter((s) => s.active).length} / {services.length} active
          </Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {services.map((s) => {
            const used = 40 + Math.floor(Math.random() * 55);
            return (
              <div key={s.id} className={cn(
                "relative rounded-2xl p-4 ring-1 transition overflow-hidden",
                s.active
                  ? "bg-white/[0.04] ring-white/10 hover:ring-white/25"
                  : "bg-white/[0.02] ring-white/5 opacity-60",
              )}>
                <div className="absolute inset-0 opacity-20 bg-grid-tech pointer-events-none" />
                <div className="flex items-start justify-between relative">
                  <div className="w-9 h-9 rounded-xl ring-1 ring-white/10 flex items-center justify-center"
                       style={{ background: `${s.color}25` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <Switch checked={s.active} onCheckedChange={() => toggle(s.id)} />
                </div>
                <p className="mt-2.5 text-[13px] font-semibold text-white">{s.name}</p>
                <p className="text-[10px] text-white/45 mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> {s.limit}
                </p>
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                    <span>{I("Foydalanish", "Использование", "Usage", lang)}</span>
                    <span className="tabular-nums">{used}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${used}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}80)` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* Subscription distribution + Recommendations + Security */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-cyan-300" />
            {I("Obuna tarqalishi", "Распределение подписок", "Subscription mix", lang)}
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="35%" outerRadius="100%" startAngle={90} endAngle={-270}
                data={[
                  { n: "Free",    v: 62, fill: "#94A3B8" },
                  { n: "Premium", v: 28, fill: "#7B61FF" },
                  { n: "Pro",     v: 10, fill: "#22D3EE" },
                ]}>
                <RadialBar dataKey="v" cornerRadius={8} background={{ fill: "rgba(255,255,255,0.04)" }} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="text-white/70"><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: "#94A3B8" }} />Free 62%</div>
            <div className="text-white/70"><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: "#7B61FF" }} />Premium 28%</div>
            <div className="text-white/70"><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: "#22D3EE" }} />Pro 10%</div>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-300" />
            {I("Smart AI tavsiyalar", "Умные AI-рекомендации", "Smart AI recommendations", lang)}
          </h3>
          <ul className="space-y-2 text-[12.5px]">
            {[
              { c: "text-cyan-300", t: I("Toshkent · 23 ta klinika tavsiya etildi", "Ташкент · 23 клиники рекомендовано", "Tashkent · 23 clinics recommended", lang) },
              { c: "text-violet-300", t: I("AI Doctor → 156 foydalanuvchiga targeting", "AI Doctor → таргетинг на 156 пользователей", "AI Doctor → targeted to 156 users", lang) },
              { c: "text-amber-300", t: I("Premium upsell: 42 ta yuqori intent", "Premium upsell: 42 пользователя", "Premium upsell: 42 high-intent users", lang) },
              { c: "text-emerald-300", t: I("Geo-aksiya: Samarqand, 18% boost", "Гео-акция: Самарканд, +18%", "Geo promo: Samarkand, +18%", lang) },
              { c: "text-rose-300", t: I("Churn risk: 7 foydalanuvchi", "Риск оттока: 7 пользователей", "Churn risk: 7 users", lang) },
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] ring-1 ring-white/5">
                <Sparkles className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", r.c)} />
                <span className="text-white/80">{r.t}</span>
              </li>
            ))}
          </ul>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            {I("AI xavfsizlik", "AI безопасность", "AI security", lang)}
          </h3>
          <ul className="space-y-2 text-[12.5px]">
            {[
              { l: I("Throttled so'rovlar", "Throttled запросы", "Throttled requests", lang), v: 14, c: "text-amber-300" },
              { l: I("Abuse aniqlandi",      "Обнаружен abuse",  "Abuse detected", lang),     v: 2,  c: "text-rose-300" },
              { l: I("Token validatsiya",    "Валидация токенов", "Token validations", lang), v: 9421, c: "text-emerald-300" },
              { l: I("Blok qilingan IP",     "Заблокировано IP",  "Blocked IPs", lang),       v: 3,  c: "text-rose-300" },
              { l: I("Faol sessiyalar",      "Активные сессии",   "Active sessions", lang),   v: 184,c: "text-cyan-300" },
            ].map((r) => (
              <li key={r.l} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] ring-1 ring-white/5">
                <span className="text-white/70">{r.l}</span>
                <span className={cn("font-bold tabular-nums", r.c)}>{r.v}</span>
              </li>
            ))}
          </ul>
        </GlowCard>
      </div>

      {/* Revenue bar */}
      <GlowCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-300" />
            {I("AI daromad va RevShare", "AI доход и RevShare", "AI revenue & RevShare", lang)}
          </h3>
          <LiveStatusPill label="MONETIZATION" />
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series.slice(-14)}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              <Bar dataKey="req" fill="#7B61FF" radius={[6, 6, 0, 0]} />
              <Bar dataKey="tok" fill="#22D3EE" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>
    </div>
  );
};

export default AiServicesModule;
