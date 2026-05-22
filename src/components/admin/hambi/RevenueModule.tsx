import { useMemo, useState } from "react";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, DollarSign, Handshake, Cpu, Building2, Wallet,
  Download, ArrowUpRight, ArrowDownRight, Sparkles, PieChart as PieIcon,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { downloadHambiReport, downloadCSV } from "@/utils/downloadHambiReport";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Daromad va RevShare", ru: "Доход и RevShare", en: "Revenue & RevShare" },
  subtitle: { uz: "Telekom-integratsiyalashgan moliyaviy analitika markazi",
              ru: "Финансовая аналитика с интеграцией в телеком", en: "Telecom-integrated financial analytics center" },
  total:    { uz: "Jami daromad", ru: "Общий доход", en: "Total revenue" },
  monthly:  { uz: "Oylik daromad", ru: "Месячный доход", en: "Monthly revenue" },
  revshare: { uz: "RevShare", ru: "RevShare", en: "RevShare" },
  pending:  { uz: "Kutilayotgan payout", ru: "Ожидание выплаты", en: "Pending payouts" },
  ai:       { uz: "AI daromad", ru: "AI доход", en: "AI revenue" },
  saas:     { uz: "SaaS daromad", ru: "SaaS доход", en: "SaaS revenue" },
  partner:  { uz: "Hamkor daromadi", ru: "Доход партнёров", en: "Partner revenue" },
  commission:{uz:"Komissiya",ru:"Комиссия",en:"Commission"},
  growth:   { uz: "Daromad o'sishi (12 oy)", ru: "Рост дохода (12 мес.)", en: "Revenue growth (12 mo)" },
  channels: { uz: "Daromad manbalari", ru: "Источники дохода", en: "Revenue channels" },
  forecast: { uz: "Prediktiv prognoz", ru: "Прогноз", en: "Predictive forecast" },
  history:  { uz: "To'lov tarixi", ru: "История платежей", en: "Payment history" },
  date:     { uz: "Sana", ru: "Дата", en: "Date" },
  source:   { uz: "Manba", ru: "Источник", en: "Source" },
  amount:   { uz: "Summa", ru: "Сумма", en: "Amount" },
  share:    { uz: "RevShare", ru: "RevShare", en: "RevShare" },
  status:   { uz: "Holat", ru: "Статус", en: "Status" },
  export:   { uz: "PDF eksport", ru: "PDF экспорт", en: "Export PDF" },
  csv:      { uz: "CSV", ru: "CSV", en: "CSV" },
  payout:   { uz: "Payout chiqarish", ru: "Запросить выплату", en: "Request payout" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

export default function RevenueModule({ slug, lang }: Props) {
  const [period, setPeriod] = useState<"7d" | "30d" | "12m">("30d");

  const stats = useMemo(() => ({
    total: 847_300_000, monthly: 76_400_000, revshare: 152_460_000,
    pending: 24_800_000, ai: 198_300_000, saas: 489_700_000,
    partner: 159_300_000, commission: 18,
  }), []);

  const series = useMemo(() => Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
    const base = 32_000_000 + i * 3_800_000;
    return {
      m: d.toLocaleString("en", { month: "short" }),
      saas: base + Math.random() * 6_000_000,
      ai: base * 0.4 + Math.random() * 4_000_000,
      partner: base * 0.3 + Math.random() * 3_000_000,
    };
  }), []);

  const forecast = useMemo(() => Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() + i);
    return { m: d.toLocaleString("en", { month: "short" }),
      actual: i === 0 ? stats.monthly : undefined,
      predicted: stats.monthly * (1 + i * 0.08) + Math.random() * 5_000_000 };
  }), [stats.monthly]);

  const channels = [
    { name: "HMS SaaS", value: 489_700_000, color: "#2F80ED" },
    { name: "AI Services", value: 198_300_000, color: "#7B61FF" },
    { name: "Partner Apps", value: 99_300_000, color: "#22D3EE" },
    { name: "Telecom RevShare", value: 60_000_000, color: "#F59E0B" },
  ];

  const HISTORY = Array.from({ length: 10 }).map((_, i) => ({
    id: `pay-${i}`,
    date: new Date(Date.now() - i * 86400000).toISOString(),
    source: ["HAMBI", "UNITEL", "Click", "Payme", "Stripe"][i % 5],
    amount: 1_400_000 + i * 380_000,
    share: (1_400_000 + i * 380_000) * 0.18,
    status: ["completed", "completed", "pending", "completed", "failed"][i % 5],
  }));

  const handleExportPDF = async () => {
    await downloadHambiReport({
      title: t("title", lang),
      subtitle: t("subtitle", lang),
      refNumber: `REV-${Date.now().toString().slice(-8)}`,
      language: lang,
      sections: [
        { heading: "Financial summary", rows: [
          [t("total", lang), `${stats.total.toLocaleString("uz-UZ")} UZS`],
          [t("monthly", lang), `${stats.monthly.toLocaleString("uz-UZ")} UZS`],
          [t("revshare", lang), `${stats.revshare.toLocaleString("uz-UZ")} UZS`],
          [t("pending", lang), `${stats.pending.toLocaleString("uz-UZ")} UZS`],
          [t("ai", lang), `${stats.ai.toLocaleString("uz-UZ")} UZS`],
          [t("saas", lang), `${stats.saas.toLocaleString("uz-UZ")} UZS`],
          [t("partner", lang), `${stats.partner.toLocaleString("uz-UZ")} UZS`],
          [t("commission", lang), `${stats.commission}%`],
        ]},
      ],
      table: {
        headers: [t("date", lang), t("source", lang), t("amount", lang), t("share", lang), t("status", lang)],
        rows: HISTORY.map((h) => [
          new Date(h.date).toLocaleDateString("uz-UZ"), h.source,
          `${h.amount.toLocaleString("uz-UZ")}`, `${h.share.toLocaleString("uz-UZ")}`, h.status,
        ]),
      },
      totals: [
        ["Net revenue (period)", `${stats.monthly.toLocaleString("uz-UZ")} UZS`],
        ["RevShare to partner", `${stats.revshare.toLocaleString("uz-UZ")} UZS`],
      ],
      notes: `Partner: ${slug}. Period: ${period}. Auto-generated trilingual financial report.`,
    });
  };

  const handleCSV = () => downloadCSV(`revenue-${slug}`,
    ["date", "source", "amount_uzs", "revshare_uzs", "status"],
    HISTORY.map((h) => [h.date, h.source, h.amount, h.share, h.status]));

  const KPI = ({ icon: Icon, label, value, trend, tone, accent }: any) => (
    <GlowCard tone={tone} glow className="!p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider text-white/60">{label}</p>
        <Icon className={cn("w-4 h-4", accent || "text-white/70")} />
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      {trend !== undefined && (
        <div className={cn("mt-1.5 flex items-center gap-1 text-[10px]", trend >= 0 ? "text-emerald-300" : "text-rose-300")}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}% MoM
        </div>
      )}
    </GlowCard>
  );

  return (
    <div className="space-y-6">
      <GlowCard tone="cyan" glow>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp className="w-5 h-5 text-cyan-300" />
              <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
              <LiveStatusPill label="LIVE" />
            </div>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
              {(["7d", "30d", "12m"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-md transition",
                    period === p ? "bg-cyan-500/30 text-white" : "text-white/50 hover:text-white")}>
                  {p}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={handleCSV} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <Download className="w-3.5 h-3.5 mr-1.5" /> {t("csv", lang)}
            </Button>
            <Button size="sm" onClick={handleExportPDF} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <Download className="w-3.5 h-3.5 mr-1.5" /> {t("export", lang)}
            </Button>
          </div>
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPI icon={DollarSign} label={t("total", lang)} value={`${(stats.total / 1_000_000).toFixed(0)}M`} tone="blue" trend={18.4} accent="text-emerald-300" />
        <KPI icon={Wallet} label={t("monthly", lang)} value={`${(stats.monthly / 1_000_000).toFixed(1)}M`} tone="cyan" trend={12.3} />
        <KPI icon={Handshake} label={t("revshare", lang)} value={`${(stats.revshare / 1_000_000).toFixed(0)}M`} tone="purple" trend={15.8} accent="text-amber-300" />
        <KPI icon={Cpu} label={t("ai", lang)} value={`${(stats.ai / 1_000_000).toFixed(0)}M`} tone="purple" trend={24.2} />
        <KPI icon={Building2} label={t("saas", lang)} value={`${(stats.saas / 1_000_000).toFixed(0)}M`} tone="blue" trend={9.7} />
        <KPI icon={Handshake} label={t("partner", lang)} value={`${(stats.partner / 1_000_000).toFixed(0)}M`} tone="cyan" trend={14.1} />
        <KPI icon={Sparkles} label={t("commission", lang)} value={`${stats.commission}%`} tone="purple" />
        <KPI icon={Wallet} label={t("pending", lang)} value={`${(stats.pending / 1_000_000).toFixed(1)}M`} tone="blue" accent="text-amber-300" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{t("growth", lang)}</h3>
            <LiveStatusPill label="REAL-TIME" />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="rS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2F80ED" stopOpacity={0.6} /><stop offset="100%" stopColor="#2F80ED" stopOpacity={0} /></linearGradient>
                  <linearGradient id="rA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7B61FF" stopOpacity={0.6} /><stop offset="100%" stopColor="#7B61FF" stopOpacity={0} /></linearGradient>
                  <linearGradient id="rP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22D3EE" stopOpacity={0.6} /><stop offset="100%" stopColor="#22D3EE" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="m" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} formatter={(v: any) => `${(v / 1_000_000).toFixed(2)}M`} />
                <Legend wrapperStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                <Area type="monotone" dataKey="saas" stackId="1" stroke="#2F80ED" strokeWidth={2} fill="url(#rS)" />
                <Area type="monotone" dataKey="ai" stackId="1" stroke="#7B61FF" strokeWidth={2} fill="url(#rA)" />
                <Area type="monotone" dataKey="partner" stackId="1" stroke="#22D3EE" strokeWidth={2} fill="url(#rP)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><PieIcon className="w-4 h-4 text-cyan-300" /> {t("channels", lang)}</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channels} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={3}>
                  {channels.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} formatter={(v: any) => `${(v / 1_000_000).toFixed(1)}M`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-1 mt-2">
            {channels.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} /> {c.name}
                <span className="ml-auto tabular-nums text-white/50">{(c.value / 1_000_000).toFixed(0)}M</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      <GlowCard tone="purple">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-300" /> {t("forecast", lang)}
        </h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="m" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} formatter={(v: any) => v ? `${(v / 1_000_000).toFixed(2)}M` : "—"} />
              <Line type="monotone" dataKey="predicted" stroke="#7B61FF" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: "#7B61FF" }} />
              <Line type="monotone" dataKey="actual" stroke="#22D3EE" strokeWidth={3} dot={{ r: 5, fill: "#22D3EE" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>

      <GlowCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">{t("history", lang)}</h3>
          <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Wallet className="w-3.5 h-3.5 mr-1.5" /> {t("payout", lang)}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("date", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("source", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("amount", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("share", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("status", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-white/70">{new Date(h.date).toLocaleDateString("uz-UZ")}</td>
                  <td className="py-2 pr-3">
                    <Badge className="text-[10px] bg-cyan-500/20 text-cyan-200 border-0">{h.source}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-right text-white tabular-nums">{h.amount.toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3 text-right text-amber-300 tabular-nums">{h.share.toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={h.status === "completed" ? "default" : h.status === "pending" ? "secondary" : "destructive"} className="text-[10px]">{h.status}</Badge>
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
