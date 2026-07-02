import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Bildirishnomalar", ru: "Уведомления", en: "Notifications" },
  subtitle: { uz: "Push, SMS, Email va Telegram xabar oqimlari", ru: "Push, SMS, Email и Telegram", en: "Push, SMS, Email & Telegram streams" },
  total:    { uz: "Jami", ru: "Всего", en: "Total" },
  sent:     { uz: "Yuborilgan", ru: "Отправлено", en: "Sent" },
  emails:   { uz: "Emaillar", ru: "Emails", en: "Emails" },
  telegram: { uz: "Telegram", ru: "Telegram", en: "Telegram" },
  latest:   { uz: "So'nggi", ru: "Последние", en: "Latest" },
  when:     { uz: "Vaqt", ru: "Время", en: "Time" },
  title2:   { uz: "Sarlavha", ru: "Заголовок", en: "Title" },
  type:     { uz: "Turi", ru: "Тип", en: "Type" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

export default function NotifModule({ slug: _slug, lang }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [k, setK] = useState({ total: 0, emails: 0 });

  useEffect(() => {
    (async () => {
      const [n, c, e] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30),
        supabase.from("notifications").select("id", { count: "exact", head: true }),
        supabase.from("email_send_log").select("id", { count: "exact", head: true }),
      ]);
      setRows(n.data ?? []);
      setK({ total: c.count ?? 0, emails: e.count ?? 0 });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <GlowCard tone="blue" glow>
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <LiveStatusPill label="LIVE" className="ml-auto" />
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: t("total", lang), v: k.total, i: Bell, tone: "text-cyan-300" },
          { l: t("sent", lang), v: rows.filter((r: any) => r.status === "sent" || r.read).length, i: Send, tone: "text-emerald-300" },
          { l: t("emails", lang), v: k.emails, i: Mail, tone: "text-amber-300" },
          { l: t("telegram", lang), v: rows.filter((r: any) => (r.channel ?? "").includes("telegram")).length, i: MessageSquare, tone: "text-violet-300" },
        ].map(x => (
          <GlowCard key={x.l} className="!p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-wider text-white/60">{x.l}</p>
              <x.i className={cn("w-4 h-4", x.tone)} />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{x.v}</p>
          </GlowCard>
        ))}
      </div>

      <GlowCard>
        <h3 className="text-sm font-semibold text-white mb-3">{t("latest", lang)}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("when", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("title2", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("type", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-white/60 whitespace-nowrap">{new Date(r.created_at).toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3 text-white/90 max-w-[380px] truncate">{r.title ?? r.message ?? "—"}</td>
                  <td className="py-2 pr-3"><Badge className="text-[10px] bg-white/10 text-white border-0">{r.type ?? "info"}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-white/40">—</td></tr>}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
