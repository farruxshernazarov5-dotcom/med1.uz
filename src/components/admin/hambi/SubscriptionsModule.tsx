import { useMemo, useState } from "react";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, TrendingUp, Users, Zap, Clock, CheckCircle2, XCircle, Sparkles,
  Download, Crown, Gift, Building2, Radio, RefreshCcw, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { downloadHambiReport, downloadCSV } from "@/utils/downloadHambiReport";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:     { uz: "Obunalar boshqaruvi", ru: "Управление подписками", en: "Subscription Center" },
  subtitle:  { uz: "Faol, premium, AI va SaaS obunalarni boshqarish",
               ru: "Управление активными, премиум, AI и SaaS подписками",
               en: "Manage active, premium, AI and SaaS subscriptions" },
  active:    { uz: "Faol obunalar", ru: "Активные", en: "Active" },
  expired:   { uz: "Tugagan", ru: "Истёкшие", en: "Expired" },
  free:      { uz: "Bepul", ru: "Бесплатные", en: "Free" },
  premium:   { uz: "Premium", ru: "Премиум", en: "Premium" },
  ai:        { uz: "AI obunalar", ru: "AI подписки", en: "AI plans" },
  hms:       { uz: "HMS SaaS", ru: "HMS SaaS", en: "HMS SaaS" },
  org:       { uz: "Tashkilot", ru: "Организация", en: "Organization" },
  trial:     { uz: "Trial", ru: "Триал", en: "Trial" },
  promo:     { uz: "Promo", ru: "Промо", en: "Promo" },
  mrr:       { uz: "MRR", ru: "MRR", en: "MRR" },
  arr:       { uz: "ARR", ru: "ARR", en: "ARR" },
  churn:     { uz: "Churn rate", ru: "Отток", en: "Churn rate" },
  arpu:      { uz: "ARPU", ru: "ARPU", en: "ARPU" },
  renewals:  { uz: "Avto-yangilash", ru: "Авто-продление", en: "Auto-renewal" },
  growth:    { uz: "12 oylik MRR o'sishi", ru: "Рост MRR 12 мес.", en: "MRR growth (12 mo)" },
  distribution:{uz:"Tarif taqsimoti",ru:"Распределение",en:"Plan distribution"},
  export:    { uz: "PDF eksport", ru: "PDF экспорт", en: "Export PDF" },
  csv:       { uz: "CSV", ru: "CSV", en: "CSV" },
  user:      { uz: "Foydalanuvchi", ru: "Пользователь", en: "User" },
  plan:      { uz: "Tarif", ru: "Тариф", en: "Plan" },
  amount:    { uz: "Summa", ru: "Сумма", en: "Amount" },
  renew:     { uz: "Yangilanish", ru: "Продление", en: "Renews" },
  status:    { uz: "Holat", ru: "Статус", en: "Status" },
  actions:   { uz: "Amallar", ru: "Действия", en: "Actions" },
  upgrade:   { uz: "Yangilash", ru: "Апгрейд", en: "Upgrade" },
  downgrade: { uz: "Pasaytirish", ru: "Даунгрейд", en: "Downgrade" },
  cancel:    { uz: "Bekor qilish", ru: "Отменить", en: "Cancel" },
  aiLimits:  { uz: "AI limitlari", ru: "AI лимиты", en: "AI limits" },
  daily:     { uz: "kunlik", ru: "в день", en: "per day" },
  unlimited: { uz: "cheksiz", ru: "безлимит", en: "unlimited" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

const PLANS = [
  { id: "free",     name: "Free",     price: 0,        ai: "1/day",   color: "from-slate-500/30 to-slate-700/20", badge: "bg-slate-500/20 text-slate-200" },
  { id: "lite",     name: "Lite",     price: 49_000,   ai: "20/day",  color: "from-cyan-500/30 to-blue-500/20",   badge: "bg-cyan-500/20 text-cyan-200" },
  { id: "standard", name: "Standard", price: 99_000,   ai: "50/day",  color: "from-blue-500/30 to-indigo-500/20", badge: "bg-blue-500/20 text-blue-200" },
  { id: "premium",  name: "Premium",  price: 199_000,  ai: "unlimited", color: "from-violet-500/30 to-fuchsia-500/20", badge: "bg-violet-500/20 text-violet-200" },
  { id: "business", name: "Business", price: 499_000,  ai: "enterprise", color: "from-amber-500/30 to-orange-500/20", badge: "bg-amber-500/20 text-amber-200" },
];

const MOCK_SUBS = Array.from({ length: 12 }).map((_, i) => {
  const plans = ["Premium", "Standard", "Lite", "Free", "Business"];
  const statuses = ["active", "active", "active", "expired", "trial"];
  const tone = i % 5;
  return {
    id: `sub-${1000 + i}`,
    user: ["Aziz Karimov", "Dilshod Yusupov", "Madina Saidova", "Bekzod Toirov", "Nigora Akhmedova"][i % 5],
    phone: `+998 9${i}-${(123456 + i).toString().slice(-6)}`,
    plan: plans[tone],
    amount: [199000, 99000, 49000, 0, 499000][tone],
    renew: new Date(Date.now() + (5 + i) * 86400000).toISOString(),
    status: statuses[i % 5],
    auto: i % 3 !== 0,
  };
});

export default function SubscriptionsModule({ slug, lang }: Props) {
  const [tab, setTab] = useState<string>("all");
  const [refresh, setRefresh] = useState(0);

  const stats = useMemo(() => ({
    active: 1248, expired: 86, trial: 142, premium: 612,
    mrr: 47_300_000, arr: 567_600_000, churn: 3.2, arpu: 79_400,
  }), [refresh]);

  const mrrSeries = useMemo(() => Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
    return { m: d.toLocaleString("en", { month: "short" }), mrr: 18_000_000 + i * 2_400_000 + Math.random() * 3_000_000, churn: 6 - i * 0.25 };
  }), [refresh]);

  const distribution = [
    { name: "Premium", value: 612, color: "#7B61FF" },
    { name: "Standard", value: 384, color: "#2F80ED" },
    { name: "Lite", value: 198, color: "#22D3EE" },
    { name: "Business", value: 54, color: "#F59E0B" },
    { name: "Free", value: 2890, color: "#64748B" },
  ];

  const filtered = useMemo(() => {
    if (tab === "all") return MOCK_SUBS;
    if (tab === "active") return MOCK_SUBS.filter((s) => s.status === "active");
    if (tab === "expired") return MOCK_SUBS.filter((s) => s.status === "expired");
    if (tab === "trial") return MOCK_SUBS.filter((s) => s.status === "trial");
    if (tab === "premium") return MOCK_SUBS.filter((s) => s.plan === "Premium" || s.plan === "Business");
    return MOCK_SUBS;
  }, [tab]);

  const handleExportPDF = async () => {
    await downloadHambiReport({
      title: t("title", lang),
      subtitle: t("subtitle", lang),
      refNumber: `SUB-${Date.now().toString().slice(-8)}`,
      language: lang,
      sections: [
        { heading: "Key metrics", rows: [
          [t("active", lang), stats.active.toLocaleString()],
          [t("expired", lang), stats.expired.toLocaleString()],
          [t("premium", lang), stats.premium.toLocaleString()],
          [t("trial", lang), stats.trial.toLocaleString()],
          [t("mrr", lang), `${stats.mrr.toLocaleString("uz-UZ")} UZS`],
          [t("arr", lang), `${stats.arr.toLocaleString("uz-UZ")} UZS`],
          [t("churn", lang), `${stats.churn}%`],
          [t("arpu", lang), `${stats.arpu.toLocaleString("uz-UZ")} UZS`],
        ]},
      ],
      table: {
        headers: [t("user", lang), t("plan", lang), t("amount", lang), t("renew", lang), t("status", lang)],
        rows: filtered.map((s) => [
          s.user, s.plan, `${s.amount.toLocaleString("uz-UZ")}`,
          new Date(s.renew).toLocaleDateString("uz-UZ"), s.status,
        ]),
      },
      totals: [["Total subs", String(filtered.length)], ["MRR", `${stats.mrr.toLocaleString("uz-UZ")} UZS`]],
      notes: `Partner slug: ${slug}. Auto-generated trilingual subscription report.`,
    });
  };

  const handleExportCSV = () => {
    downloadCSV(`subscriptions-${slug}`,
      ["user", "plan", "amount", "renew", "status", "auto_renew"],
      filtered.map((s) => [s.user, s.plan, s.amount, s.renew, s.status, s.auto ? "yes" : "no"]),
    );
  };

  const KPI = ({ icon: Icon, label, value, suffix, trend, tone }: any) => (
    <GlowCard tone={tone} glow className="!p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider text-white/60">{label}</p>
        <Icon className="w-4 h-4 text-white/70" />
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">
        {value}{suffix && <span className="text-sm font-normal text-white/50 ml-1">{suffix}</span>}
      </p>
      {trend !== undefined && (
        <div className={cn("mt-1.5 flex items-center gap-1 text-[10px]", trend >= 0 ? "text-emerald-300" : "text-rose-300")}>
          {trend >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {Math.abs(trend)}% MoM
        </div>
      )}
    </GlowCard>
  );

  const TABS = [
    { id: "all", label: t("active", lang), icon: Users },
    { id: "premium", label: t("premium", lang), icon: Crown },
    { id: "trial", label: t("trial", lang), icon: Sparkles },
    { id: "expired", label: t("expired", lang), icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlowCard tone="purple" glow>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Wallet className="w-5 h-5 text-violet-300" />
              <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
              <LiveStatusPill label="LIVE" />
            </div>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setRefresh((x) => x + 1)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCSV} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <Download className="w-3.5 h-3.5 mr-1.5" /> {t("csv", lang)}
            </Button>
            <Button size="sm" onClick={handleExportPDF} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
              <Download className="w-3.5 h-3.5 mr-1.5" /> {t("export", lang)}
            </Button>
          </div>
        </div>
      </GlowCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPI icon={CheckCircle2} label={t("active", lang)} value={stats.active.toLocaleString()} tone="blue" trend={8.4} />
        <KPI icon={Crown} label={t("premium", lang)} value={stats.premium.toLocaleString()} tone="purple" trend={12.1} />
        <KPI icon={Sparkles} label={t("trial", lang)} value={stats.trial.toLocaleString()} tone="cyan" trend={-2.3} />
        <KPI icon={Clock} label={t("expired", lang)} value={stats.expired.toLocaleString()} tone="blue" trend={-4.7} />
        <KPI icon={TrendingUp} label={t("mrr", lang)} value={`${(stats.mrr / 1_000_000).toFixed(1)}M`} suffix="UZS" tone="purple" trend={15.2} />
        <KPI icon={Zap} label={t("arr", lang)} value={`${(stats.arr / 1_000_000).toFixed(0)}M`} suffix="UZS" tone="cyan" trend={18.6} />
        <KPI icon={Users} label={t("arpu", lang)} value={`${(stats.arpu / 1000).toFixed(1)}K`} suffix="UZS" tone="blue" trend={4.1} />
        <KPI icon={XCircle} label={t("churn", lang)} value={`${stats.churn}`} suffix="%" tone="purple" trend={-0.8} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{t("growth", lang)}</h3>
            <LiveStatusPill label="REAL-TIME" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrSeries}>
                <defs>
                  <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="m" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} formatter={(v: any) => `${(v / 1_000_000).toFixed(2)}M UZS`} />
                <Area type="monotone" dataKey="mrr" stroke="#7B61FF" strokeWidth={2} fill="url(#mrrG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3">{t("distribution", lang)}</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={3}>
                  {distribution.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-1 mt-2">
            {distribution.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} /> {s.name}
                <span className="ml-auto text-white/40 tabular-nums">{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Plan cards */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-300" /> {t("aiLimits", lang)}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PLANS.map((p) => (
            <div key={p.id} className={cn("relative rounded-2xl p-4 ring-1 ring-white/10 bg-gradient-to-br overflow-hidden", p.color)}>
              <div className="absolute inset-0 opacity-30 bg-grid-tech pointer-events-none" />
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{p.name}</p>
                <Badge className={cn("text-[9px] border-0", p.badge)}>AI</Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2 tabular-nums">
                {p.price === 0 ? "Free" : `${(p.price / 1000).toFixed(0)}K`}
                {p.price > 0 && <span className="text-[10px] text-white/50 ml-1">UZS/mo</span>}
              </p>
              <p className="text-[10px] text-white/60 mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> {p.ai}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + table */}
      <GlowCard>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {TABS.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition",
                tab === tb.id ? "bg-violet-500/30 text-white ring-1 ring-violet-400/50" : "bg-white/5 text-white/60 hover:bg-white/10")}>
              <tb.icon className="w-3.5 h-3.5" /> {tb.label}
            </button>
          ))}
          <div className="ml-auto text-[11px] text-white/40">{filtered.length} {t("active", lang).toLowerCase()}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("user", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("plan", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("amount", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("renew", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("renewals", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("status", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("actions", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3">
                    <p className="text-white font-medium">{s.user}</p>
                    <p className="text-[10px] text-white/40">{s.phone}</p>
                  </td>
                  <td className="py-2 pr-3">
                    <Badge className={cn("text-[10px] border-0",
                      s.plan === "Premium" || s.plan === "Business" ? "bg-violet-500/20 text-violet-200" :
                      s.plan === "Free" ? "bg-slate-500/20 text-slate-300" : "bg-cyan-500/20 text-cyan-200")}>
                      {s.plan}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 text-right text-white tabular-nums">{s.amount.toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3 text-white/60">{new Date(s.renew).toLocaleDateString("uz-UZ")}</td>
                  <td className="py-2 pr-3">
                    {s.auto
                      ? <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300"><Radio className="w-2.5 h-2.5 animate-pulse" /> ON</span>
                      : <span className="text-[10px] text-white/40">OFF</span>}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-[11px] text-white/70 hover:text-white">{t("upgrade", lang)}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
