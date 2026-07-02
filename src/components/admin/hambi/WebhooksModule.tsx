import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Webhook, RefreshCcw, CheckCircle2, XCircle, Clock, Download, Send } from "lucide-react";
import { downloadCSV } from "@/utils/downloadHambiReport";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Webhook yetkazish", ru: "Доставка Webhook", en: "Webhook Deliveries" },
  subtitle: { uz: "Real vaqt event dispatch va retry navbati", ru: "Реальная отправка событий и очередь ретраев", en: "Real-time event dispatch & retry queue" },
  endpoint: { uz: "Endpoint", ru: "Endpoint", en: "Endpoint" },
  event:    { uz: "Hodisa", ru: "Событие", en: "Event" },
  status:   { uz: "Holat", ru: "Статус", en: "Status" },
  attempts: { uz: "Urinishlar", ru: "Попытки", en: "Attempts" },
  code:     { uz: "HTTP", ru: "HTTP", en: "HTTP" },
  time:     { uz: "Vaqt", ru: "Время", en: "Time" },
  retry:    { uz: "Qayta yuborish", ru: "Повторить", en: "Retry" },
  refresh:  { uz: "Yangilash", ru: "Обновить", en: "Refresh" },
  empty:    { uz: "Yetkazishlar yo'q", ru: "Нет доставок", en: "No deliveries" },
  ok:       { uz: "Muvaffaqiyatli", ru: "Успешно", en: "Success" },
  failed:   { uz: "Xato", ru: "Ошибка", en: "Failed" },
  pending:  { uz: "Kutilmoqda", ru: "В ожидании", en: "Pending" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

interface Delivery {
  id: string; webhook_id: string; event: string; status: string;
  retry_count: number; status_code: number | null; created_at: string;
}

export default function WebhooksModule({ slug, lang }: Props) {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("api_webhook_deliveries")
      .select("id,webhook_id,event,status,retry_count,status_code,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as Delivery[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: rows.length,
    ok: rows.filter(r => r.status === "success" || (r.status_code && r.status_code < 400)).length,
    failed: rows.filter(r => r.status === "failed" || (r.status_code && r.status_code >= 400)).length,
    pending: rows.filter(r => r.status === "pending").length,
  }), [rows]);

  const retry = async (id: string) => {
    await supabase.from("api_webhook_deliveries").update({ status: "pending", retry_count: 0 }).eq("id", id);
    await load();
  };

  const badge = (s: string, code: number | null) => {
    const ok = s === "success" || (code && code < 400);
    const fail = s === "failed" || (code && code >= 400);
    if (ok) return "bg-emerald-500/20 text-emerald-200";
    if (fail) return "bg-rose-500/20 text-rose-200";
    return "bg-amber-500/20 text-amber-200";
  };

  return (
    <div className="space-y-6">
      <GlowCard tone="blue" glow>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Webhook className="w-5 h-5 text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
              <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
            </div>
            <LiveStatusPill label="LIVE" />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={load} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> {t("refresh", lang)}
            </Button>
            <Button size="sm" onClick={() => downloadCSV(`webhooks-${slug}`,
              ["id", "event", "status", "attempts", "http", "time"],
              rows.map(r => [r.id, r.event, r.status, r.retry_count, r.status_code ?? "", r.created_at]))}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: t("event", lang) + "s", v: stats.total, i: Webhook, tone: "text-cyan-300" },
          { l: t("ok", lang), v: stats.ok, i: CheckCircle2, tone: "text-emerald-300" },
          { l: t("failed", lang), v: stats.failed, i: XCircle, tone: "text-rose-300" },
          { l: t("pending", lang), v: stats.pending, i: Clock, tone: "text-amber-300" },
        ].map((k) => (
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
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("event", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("status", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("attempts", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("code", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("time", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">—</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-white/40">…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-white/40">{t("empty", lang)}</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 font-mono text-[11px] text-white/80">{r.event}</td>
                  <td className="py-2 pr-3"><Badge className={cn("text-[10px] border-0", badge(r.status, r.status_code))}>{r.status}</Badge></td>
                  <td className="py-2 pr-3 text-right tabular-nums text-white/80">{r.retry_count}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-white/60">{r.status_code ?? "—"}</td>
                  <td className="py-2 pr-3 text-white/60 whitespace-nowrap">{new Date(r.created_at).toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => retry(r.id)} className="h-7 text-[11px] text-cyan-300 hover:text-white">
                      <Send className="w-3 h-3 mr-1" /> {t("retry", lang)}
                    </Button>
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
