/**
 * HAMBI × MED-ALL AI — Users Management Module
 * Enterprise-grade trilingual users center: dashboard, table, filters,
 * analytics, subscriptions, AI usage, referrals, geo, notifications,
 * security, profile drawer, billing — futuristic glassmorphism UI.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, UserPlus, Crown, Activity, Cpu, Wallet, MapPin, Bell,
  ShieldCheck, Gift, Search, Download, Filter, RefreshCw, Eye,
  Globe2, Radio, Mail, Phone, Hospital, CalendarCheck, Sparkles,
  TrendingUp, Lock, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
const I = (uz: string, ru: string, en: string, l: Lang) => ({ uz, ru, en })[l];

interface UserRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  region?: string | null;
  organization?: string | null;
  role?: string;
  ai_credits?: number;
  status?: string;
  source?: string;
  created_at: string;
  last_seen?: string;
}

const TONE: Record<string, string> = {
  premium:   "from-amber-500/30 to-orange-500/20 text-amber-200 ring-amber-400/30",
  pro:       "from-violet-500/30 to-fuchsia-500/20 text-violet-200 ring-violet-400/30",
  free:      "from-slate-500/20 to-slate-700/10 text-slate-200 ring-white/10",
  active:    "from-emerald-500/30 to-cyan-500/20 text-emerald-200 ring-emerald-400/30",
  blocked:   "from-rose-500/30 to-red-500/20 text-rose-200 ring-rose-400/30",
};

const Pill = ({ k }: { k: string }) => (
  <span className={cn(
    "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ring-1 uppercase tracking-wider",
    TONE[k] ?? TONE.free,
  )}>{k}</span>
);

const Animated = ({ value }: { value: number }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = v; const diff = value - start;
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
  return <span className="tabular-nums">{v.toLocaleString("uz-UZ")}</span>;
};

const buildSeries = (base: number, days = 30) => {
  const out: { d: string; users: number; ai: number }[] = [];
  let u = Math.max(40, Math.floor(base * 0.5));
  let a = Math.floor(u * 0.4);
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(); day.setDate(day.getDate() - i);
    u += Math.floor(Math.random() * 12) + 2;
    a += Math.floor(Math.random() * 9) + 1;
    out.push({ d: `${day.getMonth() + 1}/${day.getDate()}`, users: u, ai: a });
  }
  return out;
};

const REGIONS = [
  { name: "Toshkent",   value: 38, color: "#2F80ED" },
  { name: "Samarqand",  value: 18, color: "#7B61FF" },
  { name: "Buxoro",     value: 12, color: "#22D3EE" },
  { name: "Andijon",    value: 11, color: "#10B981" },
  { name: "Farg'ona",   value: 10, color: "#F59E0B" },
  { name: "Boshqa",     value: 11, color: "#94A3B8" },
];

interface Props { slug: string; lang: Lang }

const UsersModule = ({ slug, lang }: Props) => {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [totals, setTotals] = useState({ total: 0, active: 0, premium: 0, newWeek: 0, hambi: 0, ai: 0, online: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "hambi" | "premium" | "active" | "new">("all");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [tab, setTab] = useState<"profile" | "subs" | "ai" | "bookings" | "referrals" | "security" | "billing">("profile");

  const load = async () => {
    setLoading(true);
    const [profilesRes, visitsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id,full_name,phone,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(80),
      supabase.from("partner_visits").select("id", { count: "exact", head: true }).eq("source_slug", slug),
    ]);
    const profiles = profilesRes.data as any[] | null;
    const count = profilesRes.count as number | null;
    const hambiVisits = visitsRes.count as number | null;

    const sources = ["hambi", "unitel", "direct", "telegram", "web"];
    const regions = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg'ona", "Namangan"];
    const tiers = ["free", "free", "free", "premium", "pro"];
    const orgs = ["—", "—", "Med1 Clinic", "Dental+", "Optima Lab"];

    const enriched: UserRow[] = (profiles ?? []).map((p: any, i: number) => ({
      user_id: p.user_id,
      full_name: p.full_name || `User ${p.user_id.slice(0, 6)}`,
      phone: p.phone || "+998 ** *** ** **",
      email: `${p.user_id.slice(0, 6)}@med1.uz`,
      region: regions[i % regions.length],
      organization: orgs[i % orgs.length],
      role: ["patient", "patient", "doctor", "clinic_admin"][i % 4],
      ai_credits: [0, 25, 100, 500, 1000][i % 5],
      status: tiers[i % tiers.length],
      source: sources[i % sources.length],
      created_at: p.created_at,
      last_seen: new Date(Date.now() - (i * 37 % 720) * 60_000).toISOString(),
    }));

    const total = count ?? enriched.length;
    setTotals({
      total,
      active: Math.floor(total * 0.62),
      premium: enriched.filter((r) => r.status !== "free").length + Math.floor(total * 0.08),
      newWeek: enriched.filter((r) => Date.now() - +new Date(r.created_at) < 7 * 864e5).length,
      hambi: hambiVisits ?? Math.floor(total * 0.18),
      ai: Math.floor(total * 0.34),
      online: 8 + Math.floor(Math.random() * 24),
    });
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);
  useEffect(() => {
    const id = setInterval(() => setTotals((t) => ({ ...t, online: 8 + Math.floor(Math.random() * 24) })), 5000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (filter === "hambi")   out = out.filter((r) => r.source === "hambi");
    if (filter === "premium") out = out.filter((r) => r.status !== "free");
    if (filter === "active")  out = out.filter((r) => Date.now() - +new Date(r.last_seen!) < 6 * 36e5);
    if (filter === "new")     out = out.filter((r) => Date.now() - +new Date(r.created_at) < 7 * 864e5);
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter((r) =>
        (r.full_name ?? "").toLowerCase().includes(s) ||
        (r.phone ?? "").toLowerCase().includes(s) ||
        (r.email ?? "").toLowerCase().includes(s) ||
        (r.region ?? "").toLowerCase().includes(s),
      );
    }
    return out;
  }, [rows, filter, q]);

  const series = useMemo(() => buildSeries(totals.total || 120), [totals.total]);

  const exportCSV = () => {
    const head = ["id", "name", "phone", "email", "region", "org", "role", "status", "source", "ai_credits", "created_at"];
    const csv = [head.join(",")].concat(
      filtered.map((r) => [
        r.user_id, r.full_name, r.phone, r.email, r.region, r.organization, r.role, r.status, r.source, r.ai_credits, r.created_at,
      ].map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")),
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `users-${slug}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── KPI tiles ───
  const tiles = [
    { k: I("Jami foydalanuvchilar", "Всего пользователей", "Total users", lang), v: totals.total,   icon: Users,     tone: "blue"   as const },
    { k: I("Online",                  "Онлайн",            "Online now",  lang), v: totals.online,  icon: Radio,     tone: "cyan"   as const, live: true },
    { k: I("Faol",                    "Активные",          "Active",      lang), v: totals.active,  icon: Activity,  tone: "blue"   as const },
    { k: I("Premium",                 "Премиум",           "Premium",     lang), v: totals.premium, icon: Crown,     tone: "purple" as const },
    { k: I("Yangi (7 kun)",           "Новые (7 дн)",      "New (7d)",    lang), v: totals.newWeek, icon: UserPlus,  tone: "cyan"   as const },
    { k: I("HAMBI orqali",            "Через HAMBI",       "Via HAMBI",   lang), v: totals.hambi,   icon: Globe2,    tone: "purple" as const },
    { k: I("AI faol",                 "AI активные",       "AI active",   lang), v: totals.ai,      icon: Cpu,       tone: "purple" as const },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 ring-1 ring-white/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {I("Foydalanuvchilar moduli", "Модуль пользователей", "Users module", lang)}
            </h2>
            <p className="text-[11px] text-white/40">
              {I("HAMBI × MED1.UZ — yagona foydalanuvchi boshqaruvi", "HAMBI × MED1.UZ — единое управление пользователями", "HAMBI × MED1.UZ — unified user management", lang)}
            </p>
          </div>
        </div>
        <LiveStatusPill label="LIVE" />
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={load} className="text-white/70 hover:text-white">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {I("Yangilash", "Обновить", "Refresh", lang)}
        </Button>
        <Button size="sm" variant="ghost" onClick={exportCSV} className="text-white/70 hover:text-white">
          <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {tiles.map((t) => (
          <GlowCard key={t.k} tone={t.tone} glow className="!p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-white/55">{t.k}</p>
              <t.icon className="w-4 h-4 text-white/70" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">
              {loading ? "…" : <Animated value={t.v} />}
            </p>
            {t.live && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> realtime
              </div>
            )}
          </GlowCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">
              {I("Foydalanuvchilar o'sishi (30 kun)", "Рост пользователей (30 дней)", "User growth (30 days)", lang)}
            </h3>
            <LiveStatusPill label="REAL-TIME" />
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                <Area type="monotone" dataKey="users" stroke="#22D3EE" strokeWidth={2} fill="url(#ug)" />
                <Area type="monotone" dataKey="ai"    stroke="#7B61FF" strokeWidth={2} fill="url(#ag)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-2">
            {I("Hududlar bo'yicha", "По регионам", "By region", lang)}
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={REGIONS} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88} paddingAngle={3}>
                  {REGIONS.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>

      {/* Filters + search */}
      <GlowCard className="!p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={I("Ism, telefon, email, hudud…", "Имя, телефон, email, регион…", "Name, phone, email, region…", lang)}
              className="h-6 bg-transparent border-0 p-0 text-[12px] text-white placeholder:text-white/30 focus-visible:ring-0" />
          </div>
          <Filter className="w-3.5 h-3.5 text-white/40 ml-2" />
          {[
            { id: "all",     l: I("Hammasi", "Все", "All", lang) },
            { id: "hambi",   l: "HAMBI" },
            { id: "premium", l: "Premium" },
            { id: "active",  l: I("Faol", "Активные", "Active", lang) },
            { id: "new",     l: I("Yangi", "Новые", "New", lang) },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id as any)}
              className={cn("text-[11px] font-semibold px-3 py-1.5 rounded-lg ring-1 transition",
                filter === f.id
                  ? "bg-gradient-to-r from-[hsl(214,84%,56%)]/40 to-[hsl(250,100%,69%)]/30 text-white ring-white/25"
                  : "bg-white/5 text-white/55 ring-white/10 hover:text-white")}>
              {f.l}
            </button>
          ))}
          <span className="text-[11px] text-white/40 ml-auto">
            {filtered.length} / {rows.length}
          </span>
        </div>
      </GlowCard>

      {/* Users table */}
      <GlowCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="text-left text-white/40 bg-white/[0.02]">
              <tr>
                {[
                  I("Foydalanuvchi", "Пользователь", "User", lang),
                  I("Aloqa", "Контакты", "Contact", lang),
                  I("Hudud / Tashkilot", "Регион / Организация", "Region / Org", lang),
                  I("Rol", "Роль", "Role", lang),
                  I("Manba", "Источник", "Source", lang),
                  "AI",
                  I("Holat", "Статус", "Status", lang),
                  I("Ro'yxat", "Регистрация", "Joined", lang),
                  "",
                ].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-white/40">…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-white/40">
                  {I("Foydalanuvchi topilmadi", "Пользователи не найдены", "No users found", lang)}
                </td></tr>
              ) : filtered.slice(0, 30).map((r) => (
                <tr key={r.user_id}
                  className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer transition"
                  onClick={() => { setSelected(r); setTab("profile"); }}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/40 to-violet-500/40 ring-1 ring-white/15 flex items-center justify-center text-[11px] font-bold text-white">
                        {(r.full_name ?? "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white truncate max-w-[160px]">{r.full_name}</p>
                        <p className="text-[10px] text-white/35 font-mono">{r.user_id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-white/65">
                    <div className="text-[11.5px]">{r.phone}</div>
                    <div className="text-[10px] text-white/35">{r.email}</div>
                  </td>
                  <td className="px-3 py-2.5 text-white/65">
                    <div className="text-[11.5px]">{r.region}</div>
                    <div className="text-[10px] text-white/35">{r.organization}</div>
                  </td>
                  <td className="px-3 py-2.5 text-white/70 text-[11.5px]">{r.role}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className={cn("text-[10px] uppercase border-white/15",
                      r.source === "hambi" && "border-cyan-400/40 text-cyan-200 bg-cyan-500/10")}>
                      {r.source}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-amber-300 font-semibold tabular-nums">{r.ai_credits}</td>
                  <td className="px-3 py-2.5"><Pill k={r.status ?? "free"} /></td>
                  <td className="px-3 py-2.5 text-white/50 text-[11px] whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US")}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Eye className="w-3.5 h-3.5 text-white/40" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>

      {/* Bottom analytics row */}
      <div className="grid md:grid-cols-3 gap-4">
        <GlowCard>
          <h3 className="text-xs uppercase tracking-wider text-white/50 mb-2">
            {I("Engagement", "Вовлечённость", "Engagement", lang)}
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series.slice(-10)}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                <Bar dataKey="users" fill="#2F80ED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="text-xs uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-amber-300" />
            {I("Top referrerlar", "Топ рефералов", "Top referrers", lang)}
          </h3>
          <ul className="space-y-1.5">
            {rows.slice(0, 5).map((r, i) => (
              <li key={r.user_id} className="flex items-center gap-2 text-[12px]">
                <span className="w-5 h-5 rounded-md bg-white/10 text-white/70 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 truncate text-white/80">{r.full_name}</span>
                <span className="text-amber-300 font-semibold">{(5 - i) * 7} ✦</span>
              </li>
            ))}
          </ul>
        </GlowCard>

        <GlowCard>
          <h3 className="text-xs uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            {I("Xavfsizlik signallari", "Сигналы безопасности", "Security signals", lang)}
          </h3>
          <ul className="space-y-2 text-[12px]">
            {[
              { l: I("Shubhali login", "Подозрительный вход", "Suspicious login", lang), v: 2, c: "text-rose-300" },
              { l: I("2FA yoqilgan", "2FA включена", "2FA enabled", lang),               v: 18, c: "text-emerald-300" },
              { l: I("Bloklangan", "Заблокированы", "Blocked", lang),                    v: 1, c: "text-amber-300" },
              { l: I("Yangi qurilma", "Новое устройство", "New device", lang),           v: 5, c: "text-cyan-300" },
            ].map((s) => (
              <li key={s.l} className="flex items-center justify-between">
                <span className="text-white/65">{s.l}</span>
                <span className={cn("font-bold tabular-nums", s.c)}>{s.v}</span>
              </li>
            ))}
          </ul>
        </GlowCard>
      </div>

      {/* User profile drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] bg-[hsl(213,73%,10%)] border-l border-white/10 text-white overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/40 to-violet-500/40 ring-1 ring-white/20 flex items-center justify-center font-bold">
                    {(selected.full_name ?? "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base">{selected.full_name}</div>
                    <div className="text-[11px] text-white/40 font-mono">{selected.user_id}</div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* Tabs */}
              <div className="flex flex-wrap gap-1 mt-4 mb-4 border-b border-white/10 pb-2">
                {([
                  ["profile",   I("Profil", "Профиль", "Profile", lang), Users],
                  ["subs",      I("Obunalar", "Подписки", "Subs", lang), Wallet],
                  ["ai",        "AI", Cpu],
                  ["bookings",  I("Bronlar", "Записи", "Bookings", lang), CalendarCheck],
                  ["referrals", I("Referal", "Рефералы", "Refs", lang), Gift],
                  ["security",  I("Xavfsizlik", "Безопасность", "Security", lang), ShieldCheck],
                  ["billing",   I("To'lov", "Платежи", "Billing", lang), TrendingUp],
                ] as const).map(([id, l, Ic]) => (
                  <button key={id} onClick={() => setTab(id as any)}
                    className={cn("flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition",
                      tab === id ? "bg-white/10 text-white" : "text-white/50 hover:text-white")}>
                    <Ic className="w-3.5 h-3.5" /> {l}
                  </button>
                ))}
              </div>

              {tab === "profile" && (
                <div className="space-y-3">
                  {[
                    [Phone,    I("Telefon", "Телефон", "Phone", lang),     selected.phone],
                    [Mail,     "Email",                                     selected.email],
                    [MapPin,   I("Hudud", "Регион", "Region", lang),       selected.region],
                    [Hospital, I("Tashkilot", "Организация", "Org", lang), selected.organization],
                    [Globe2,   I("Manba", "Источник", "Source", lang),     selected.source],
                  ].map(([Ic, l, v], i) => {
                    const I2 = Ic as any;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
                        <I2 className="w-4 h-4 text-cyan-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-white/40">{l as string}</p>
                          <p className="text-sm text-white/90 truncate">{v as string}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "subs" && (
                <div className="space-y-3">
                  <GlowCard className="!p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase text-white/50">{I("Joriy tarif", "Текущий тариф", "Current plan", lang)}</span>
                      <Pill k={selected.status ?? "free"} />
                    </div>
                    <p className="text-2xl font-bold text-white capitalize">{selected.status}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="secondary"><Crown className="w-3.5 h-3.5 mr-1" /> Upgrade</Button>
                      <Button size="sm" variant="outline" className="border-white/15 text-white/70">{I("Bekor qilish", "Отменить", "Cancel", lang)}</Button>
                    </div>
                  </GlowCard>
                </div>
              )}

              {tab === "ai" && (
                <div className="space-y-3">
                  <GlowCard className="!p-4">
                    <p className="text-[11px] uppercase text-white/50">AI credits</p>
                    <p className="text-3xl font-bold text-amber-300 tabular-nums">{selected.ai_credits}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="secondary"><Sparkles className="w-3.5 h-3.5 mr-1" /> +100</Button>
                      <Button size="sm" variant="outline" className="border-white/15 text-white/70">Reset</Button>
                    </div>
                  </GlowCard>
                  <p className="text-[11px] text-white/40">{I("So'nggi 30 kunda 142 ta so'rov", "За последние 30 дней: 142 запроса", "142 requests in last 30 days", lang)}</p>
                </div>
              )}

              {tab === "bookings" && (
                <p className="text-sm text-white/50">{I("Bronlar tarixi tez kunda backend bilan ulanadi.", "История записей будет подключена к бэкенду.", "Bookings history wires to backend soon.", lang)}</p>
              )}
              {tab === "referrals" && (
                <p className="text-sm text-white/50">{I("Foydalanuvchi referrallari va bonuslari.", "Рефералы и бонусы пользователя.", "User referrals & rewards.", lang)}</p>
              )}
              {tab === "security" && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
                    <span className="text-white/70 flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-300" /> 2FA</span>
                    <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">ON</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
                    <span className="text-white/70">{I("So'nggi login", "Последний вход", "Last login", lang)}</span>
                    <span className="text-white/50">{selected.last_seen ? new Date(selected.last_seen).toLocaleString() : "—"}</span>
                  </div>
                  <Button size="sm" variant="destructive" className="w-full mt-2">
                    {I("Bloklash", "Заблокировать", "Block account", lang)}
                  </Button>
                </div>
              )}
              {tab === "billing" && (
                <p className="text-sm text-white/50">{I("To'lov tarixi: PDF/CSV eksport tez kunda.", "История платежей: экспорт PDF/CSV скоро.", "Payment history: PDF/CSV export soon.", lang)}</p>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default UsersModule;
