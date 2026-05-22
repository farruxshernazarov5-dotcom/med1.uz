import { useMemo, useState } from "react";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CreditCard, CheckCircle2, Clock, XCircle, RotateCcw, Receipt, Search,
  Download, Wallet, Gift, ArrowUpRight, Filter,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { downloadHambiReport, downloadCSV } from "@/utils/downloadHambiReport";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Foydalanuvchi to'lovlari", ru: "Платежи пользователей", en: "User Payments" },
  subtitle: { uz: "Onlayn to'lovlar, invoyslar, refundlar va promo bonuslar",
              ru: "Онлайн-платежи, инвойсы, возвраты и промо-бонусы",
              en: "Online payments, invoices, refunds and promo bonuses" },
  history:  { uz: "To'lov tarixi", ru: "История", en: "Payment history" },
  active:   { uz: "Faol tranzaksiyalar", ru: "Активные", en: "Active txns" },
  invoices: { uz: "Invoyslar", ru: "Инвойсы", en: "Invoices" },
  failed:   { uz: "Muvaffaqiyatsiz", ru: "Неуспешные", en: "Failed" },
  refunds:  { uz: "Refund so'rovlari", ru: "Возвраты", en: "Refund requests" },
  ai:       { uz: "AI kreditlar", ru: "AI кредиты", en: "AI credits" },
  subs:     { uz: "Obuna to'lovlari", ru: "Подписки", en: "Subscription pay" },
  wallet:   { uz: "Hamyon balansi", ru: "Кошелёк", en: "Wallet balance" },
  cashback: { uz: "Cashback & Bonus", ru: "Кэшбэк и бонусы", en: "Cashback & bonuses" },
  total:    { uz: "Jami to'langan", ru: "Всего", en: "Total paid" },
  pending:  { uz: "Kutilmoqda", ru: "Ожидание", en: "Pending" },
  completed:{ uz: "Yakunlangan", ru: "Завершено", en: "Completed" },
  refunded: { uz: "Qaytarilgan", ru: "Возвращено", en: "Refunded" },
  cancelled:{ uz: "Bekor", ru: "Отменено", en: "Cancelled" },
  user:     { uz: "Foydalanuvchi", ru: "Пользователь", en: "User" },
  amount:   { uz: "Summa", ru: "Сумма", en: "Amount" },
  method:   { uz: "Usul", ru: "Метод", en: "Method" },
  invoice:  { uz: "Invoys", ru: "Инвойс", en: "Invoice" },
  date:     { uz: "Sana", ru: "Дата", en: "Date" },
  status:   { uz: "Holat", ru: "Статус", en: "Status" },
  actions:  { uz: "Amallar", ru: "Действия", en: "Actions" },
  search:   { uz: "Foydalanuvchi yoki invoys…", ru: "Пользователь или инвойс…", en: "User or invoice…" },
  download: { uz: "Yuklab olish", ru: "Скачать", en: "Download" },
  csv:      { uz: "CSV", ru: "CSV", en: "CSV" },
  export:   { uz: "PDF eksport", ru: "PDF экспорт", en: "Export PDF" },
  byMethod: { uz: "To'lov usullari", ru: "По методам", en: "By method" },
  daily:    { uz: "Kunlik to'lovlar (14 kun)", ru: "Платежи (14 дней)", en: "Daily payments (14d)" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

const METHODS = ["Click", "Payme", "Stripe", "Wallet", "HAMBI"];
const STATUSES = ["completed", "pending", "failed", "refunded", "cancelled"];

const MOCK = Array.from({ length: 24 }).map((_, i) => ({
  id: `txn-${1000 + i}`,
  invoice: `INV-2026-${String(10000 + i).padStart(6, "0")}`,
  user: ["Aziz Karimov", "Dilshod Yusupov", "Madina Saidova", "Bekzod Toirov", "Nigora A."][i % 5],
  phone: `+998 9${i % 9}-${(123456 + i).toString().slice(-6)}`,
  amount: [49000, 99000, 199000, 25000, 499000, 15000][i % 6],
  method: METHODS[i % METHODS.length],
  date: new Date(Date.now() - i * 86400000 / 2).toISOString(),
  status: STATUSES[i % 5],
  type: ["subscription", "ai_credit", "subscription", "ai_credit", "subscription"][i % 5],
}));

export default function PaymentsModule({ slug, lang }: Props) {
  const [tab, setTab] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = MOCK;
    if (tab !== "all") list = list.filter((x) => x.status === tab || (tab === "ai" && x.type === "ai_credit") || (tab === "subs" && x.type === "subscription"));
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((x) => x.user.toLowerCase().includes(s) || x.invoice.toLowerCase().includes(s) || x.phone.includes(s));
    }
    return list;
  }, [tab, q]);

  const stats = useMemo(() => {
    const completed = MOCK.filter((x) => x.status === "completed");
    return {
      total: completed.reduce((s, x) => s + x.amount, 0),
      pending: MOCK.filter((x) => x.status === "pending").length,
      failed: MOCK.filter((x) => x.status === "failed").length,
      refunded: MOCK.filter((x) => x.status === "refunded").length,
      txCount: MOCK.length,
      wallet: 14_300_000, cashback: 2_140_000,
    };
  }, []);

  const daily = useMemo(() => Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return { d: `${d.getMonth() + 1}/${d.getDate()}`, amount: 800_000 + Math.random() * 2_400_000 };
  }), []);

  const byMethod = useMemo(() => METHODS.map((m, i) => ({
    name: m, value: MOCK.filter((x) => x.method === m).length,
    color: ["#2F80ED", "#22D3EE", "#7B61FF", "#10B981", "#F59E0B"][i],
  })), []);

  const handleExportPDF = async () => {
    await downloadHambiReport({
      title: t("title", lang),
      subtitle: t("subtitle", lang),
      refNumber: `PAY-${Date.now().toString().slice(-8)}`,
      language: lang,
      sections: [
        { heading: "Summary", rows: [
          [t("total", lang), `${stats.total.toLocaleString("uz-UZ")} UZS`],
          ["Transactions", String(stats.txCount)],
          [t("pending", lang), String(stats.pending)],
          [t("failed", lang), String(stats.failed)],
          [t("refunded", lang), String(stats.refunded)],
          [t("wallet", lang), `${stats.wallet.toLocaleString("uz-UZ")} UZS`],
          [t("cashback", lang), `${stats.cashback.toLocaleString("uz-UZ")} UZS`],
        ]},
      ],
      table: {
        headers: [t("invoice", lang), t("user", lang), t("amount", lang), t("method", lang), t("date", lang), t("status", lang)],
        rows: filtered.map((x) => [
          x.invoice, x.user, `${x.amount.toLocaleString("uz-UZ")}`, x.method,
          new Date(x.date).toLocaleDateString("uz-UZ"), x.status,
        ]),
      },
      totals: [["Filtered total", `${filtered.reduce((s, x) => s + x.amount, 0).toLocaleString("uz-UZ")} UZS`]],
      notes: `Partner: ${slug}. Trilingual payment report — invoices, refunds, AI credits & subscription payments.`,
    });
  };

  const handleCSV = () => downloadCSV(`payments-${slug}`,
    ["invoice", "user", "phone", "amount", "method", "date", "status", "type"],
    filtered.map((x) => [x.invoice, x.user, x.phone, x.amount, x.method, x.date, x.status, x.type]));

  const handleReceipt = async (item: typeof MOCK[0]) => {
    await downloadHambiReport({
      title: `Payment Receipt — ${item.invoice}`,
      subtitle: t("title", lang),
      refNumber: item.invoice,
      language: lang,
      sections: [
        { heading: "Customer", rows: [["Name", item.user], ["Phone", item.phone]] },
        { heading: "Payment", rows: [
          [t("amount", lang), `${item.amount.toLocaleString("uz-UZ")} UZS`],
          [t("method", lang), item.method],
          [t("date", lang), new Date(item.date).toLocaleString("uz-UZ")],
          [t("status", lang), item.status],
          ["Type", item.type],
        ]},
      ],
      totals: [["Total", `${item.amount.toLocaleString("uz-UZ")} UZS`]],
      notes: "Thank you for your payment. This receipt is digitally signed and verifiable via QR code.",
    });
  };

  const KPI = ({ icon: Icon, label, value, tone, accent }: any) => (
    <GlowCard tone={tone} glow className="!p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider text-white/60">{label}</p>
        <Icon className={cn("w-4 h-4", accent || "text-white/70")} />
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
    </GlowCard>
  );

  const TABS = [
    { id: "all", label: t("history", lang), icon: Receipt },
    { id: "pending", label: t("pending", lang), icon: Clock },
    { id: "completed", label: t("completed", lang), icon: CheckCircle2 },
    { id: "failed", label: t("failed", lang), icon: XCircle },
    { id: "refunded", label: t("refunds", lang), icon: RotateCcw },
    { id: "ai", label: t("ai", lang), icon: Gift },
    { id: "subs", label: t("subs", lang), icon: Wallet },
  ];

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      completed: "bg-emerald-500/20 text-emerald-200",
      pending: "bg-amber-500/20 text-amber-200",
      failed: "bg-rose-500/20 text-rose-200",
      refunded: "bg-blue-500/20 text-blue-200",
      cancelled: "bg-slate-500/20 text-slate-300",
    };
    return map[s] || "bg-white/10 text-white";
  };

  return (
    <div className="space-y-6">
      <GlowCard tone="blue" glow>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CreditCard className="w-5 h-5 text-cyan-300" />
              <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
              <LiveStatusPill label="LIVE" />
            </div>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCSV} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <Download className="w-3.5 h-3.5 mr-1.5" /> {t("csv", lang)}
            </Button>
            <Button size="sm" onClick={handleExportPDF} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <Download className="w-3.5 h-3.5 mr-1.5" /> {t("export", lang)}
            </Button>
          </div>
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <KPI icon={CheckCircle2} label={t("total", lang)} value={`${(stats.total / 1_000_000).toFixed(1)}M`} tone="blue" accent="text-emerald-300" />
        <KPI icon={Receipt} label="Tx" value={stats.txCount} tone="cyan" />
        <KPI icon={Clock} label={t("pending", lang)} value={stats.pending} tone="purple" accent="text-amber-300" />
        <KPI icon={XCircle} label={t("failed", lang)} value={stats.failed} tone="purple" accent="text-rose-300" />
        <KPI icon={RotateCcw} label={t("refunded", lang)} value={stats.refunded} tone="blue" />
        <KPI icon={Wallet} label={t("wallet", lang)} value={`${(stats.wallet / 1_000_000).toFixed(1)}M`} tone="cyan" />
        <KPI icon={Gift} label={t("cashback", lang)} value={`${(stats.cashback / 1_000_000).toFixed(1)}M`} tone="purple" accent="text-amber-300" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <GlowCard className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-3">{t("daily", lang)}</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} formatter={(v: any) => `${(v / 1000).toFixed(0)}K UZS`} />
                <Bar dataKey="amount" fill="#22D3EE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
        <GlowCard>
          <h3 className="text-sm font-semibold text-white mb-3">{t("byMethod", lang)}</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byMethod} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={3}>
                  {byMethod.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-1 mt-2">
            {byMethod.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="w-2 h-2 rounded-full" style={{ background: m.color }} /> {m.name}
                <span className="ml-auto tabular-nums text-white/50">{m.value}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      <GlowCard>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-white/40" />
          {TABS.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition",
                tab === tb.id ? "bg-cyan-500/30 text-white ring-1 ring-cyan-400/50" : "bg-white/5 text-white/60 hover:bg-white/10")}>
              <tb.icon className="w-3.5 h-3.5" /> {tb.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 w-64">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search", lang)}
              className="h-6 bg-transparent border-0 p-0 text-[12px] text-white placeholder:text-white/30 focus-visible:ring-0" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("invoice", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("user", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("amount", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("method", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("date", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("status", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("actions", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((x) => (
                <tr key={x.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 font-mono text-[11px] text-white/70">{x.invoice}</td>
                  <td className="py-2 pr-3">
                    <p className="text-white font-medium">{x.user}</p>
                    <p className="text-[10px] text-white/40">{x.phone}</p>
                  </td>
                  <td className="py-2 pr-3 text-right text-white tabular-nums">{x.amount.toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3"><Badge className="text-[10px] bg-white/10 text-white border-0">{x.method}</Badge></td>
                  <td className="py-2 pr-3 text-white/60 whitespace-nowrap">{new Date(x.date).toLocaleDateString("uz-UZ")}</td>
                  <td className="py-2 pr-3"><Badge className={cn("text-[10px] border-0", statusBadge(x.status))}>{x.status}</Badge></td>
                  <td className="py-2 pr-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleReceipt(x)} className="h-7 text-[11px] text-cyan-300 hover:text-white">
                      <Download className="w-3 h-3 mr-1" /> PDF
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-white/40 text-sm">No payments match the filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
