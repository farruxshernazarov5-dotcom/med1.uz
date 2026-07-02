import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Bronlar", ru: "Записи", en: "Bookings" },
  subtitle: { uz: "HAMBI orqali qilingan barcha shifokor bronlari", ru: "Все записи к врачам через HAMBI", en: "All doctor bookings via HAMBI" },
  pending:  { uz: "Kutilmoqda", ru: "Ожидание", en: "Pending" },
  confirmed:{ uz: "Tasdiqlangan", ru: "Подтверждено", en: "Confirmed" },
  completed:{ uz: "Yakunlangan", ru: "Завершено", en: "Completed" },
  cancelled:{ uz: "Bekor", ru: "Отменено", en: "Cancelled" },
  daily:    { uz: "Kunlik bronlar (14 kun)", ru: "Записи по дням (14д)", en: "Daily bookings (14d)" },
  latest:   { uz: "Yangi bronlar", ru: "Новые записи", en: "Latest bookings" },
  when:     { uz: "Sana", ru: "Дата", en: "Date" },
  status:   { uz: "Holat", ru: "Статус", en: "Status" },
  empty:    { uz: "Bronlar yo'q", ru: "Нет записей", en: "No bookings" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

export default function BookingsModule({ slug: _slug, lang }: Props) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("appointments")
        .select("id,status,created_at,scheduled_at,notes")
        .order("created_at", { ascending: false }).limit(200);
      setRows(data ?? []);
    })();
  }, []);

  const stats = useMemo(() => ({
    pending: rows.filter(r => r.status === "pending").length,
    confirmed: rows.filter(r => r.status === "confirmed").length,
    completed: rows.filter(r => r.status === "completed").length,
    cancelled: rows.filter(r => r.status === "cancelled").length,
  }), [rows]);

  const daily = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      buckets[`${d.getMonth() + 1}/${d.getDate()}`] = 0;
    }
    rows.forEach(r => {
      const d = new Date(r.created_at);
      const k = `${d.getMonth() + 1}/${d.getDate()}`;
      if (k in buckets) buckets[k]++;
    });
    return Object.entries(buckets).map(([d, count]) => ({ d, count }));
  }, [rows]);

  const badge = (s: string) => ({
    pending: "bg-amber-500/20 text-amber-200",
    confirmed: "bg-cyan-500/20 text-cyan-200",
    completed: "bg-emerald-500/20 text-emerald-200",
    cancelled: "bg-rose-500/20 text-rose-200",
  } as any)[s] || "bg-white/10 text-white/70";

  return (
    <div className="space-y-6">
      <GlowCard tone="blue" glow>
        <div className="flex items-center gap-3">
          <CalendarCheck className="w-5 h-5 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <LiveStatusPill label="LIVE" className="ml-auto" />
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: t("pending", lang), v: stats.pending, i: Clock, tone: "text-amber-300" },
          { l: t("confirmed", lang), v: stats.confirmed, i: CheckCircle2, tone: "text-cyan-300" },
          { l: t("completed", lang), v: stats.completed, i: CheckCircle2, tone: "text-emerald-300" },
          { l: t("cancelled", lang), v: stats.cancelled, i: XCircle, tone: "text-rose-300" },
        ].map(k => (
          <GlowCard key={k.l} className="!p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-wider text-white/60">{k.l}</p>
              <k.i className={cn("w-4 h-4", k.tone)} />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{k.v}</p>
          </GlowCard>
        ))}
      </div>

      <GlowCard>
        <h3 className="text-sm font-semibold text-white mb-3">{t("daily", lang)}</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              <Bar dataKey="count" fill="#22D3EE" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>

      <GlowCard>
        <h3 className="text-sm font-semibold text-white mb-3">{t("latest", lang)}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("when", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("status", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-white/70">{new Date(r.scheduled_at ?? r.created_at).toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3"><Badge className={cn("text-[10px] border-0", badge(r.status))}>{r.status}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={2} className="py-6 text-center text-white/40">{t("empty", lang)}</td></tr>}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
