import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, KeyRound, LogIn, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:     { uz: "Xavfsizlik markazi", ru: "Центр безопасности", en: "Security Center" },
  subtitle:  { uz: "Kirish urunishlari, blokirovkalar, tahdid signallari", ru: "Попытки входа, блокировки, сигналы угроз", en: "Login attempts, blocks, threat signals" },
  logins:    { uz: "Kirishlar (24s)", ru: "Входы (24ч)", en: "Logins (24h)" },
  failed:    { uz: "Muvaffaqiyatsiz", ru: "Неуспешные", en: "Failed" },
  blocks:    { uz: "Bloklanganlar", ru: "Заблокированы", en: "Blocked" },
  incidents: { uz: "Hodisalar", ru: "Инциденты", en: "Incidents" },
  recent:    { uz: "So'nggi hodisalar", ru: "Последние события", en: "Recent events" },
  when:      { uz: "Vaqt", ru: "Время", en: "Time" },
  type:      { uz: "Turi", ru: "Тип", en: "Type" },
  msg:       { uz: "Xabar", ru: "Сообщение", en: "Message" },
  sev:       { uz: "Muhimlik", ru: "Важность", en: "Severity" },
  empty:     { uz: "Hodisalar yo'q", ru: "Нет событий", en: "No events" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

export default function SecurityModule({ slug: _slug, lang }: Props) {
  const [logins24, setLogins24] = useState(0);
  const [failed24, setFailed24] = useState(0);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const dayAgo = new Date(Date.now() - 86400000).toISOString();
      const [lh, fl, ev] = await Promise.all([
        supabase.from("login_history").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("login_history").select("id", { count: "exact", head: true }).gte("created_at", dayAgo).eq("success", false),
        supabase.from("security_debug_log").select("*").order("created_at", { ascending: false }).limit(30),
      ]);
      setLogins24(lh.count ?? 0);
      setFailed24(fl.count ?? 0);
      setEvents(ev.data ?? []);
    })();
  }, []);

  const sevBadge = (s: string) => {
    const sev = (s ?? "info").toLowerCase();
    if (sev === "critical" || sev === "error") return "bg-rose-500/20 text-rose-200";
    if (sev === "warn" || sev === "warning") return "bg-amber-500/20 text-amber-200";
    return "bg-cyan-500/20 text-cyan-200";
  };

  return (
    <div className="space-y-6">
      <GlowCard tone="blue" glow>
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <LiveStatusPill label="MONITORING" className="ml-auto" />
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: t("logins", lang), v: logins24, i: LogIn, tone: "text-cyan-300" },
          { l: t("failed", lang), v: failed24, i: AlertTriangle, tone: "text-rose-300" },
          { l: t("blocks", lang), v: Math.floor(failed24 / 5), i: Ban, tone: "text-amber-300" },
          { l: t("incidents", lang), v: events.length, i: KeyRound, tone: "text-violet-300" },
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
        <h3 className="text-sm font-semibold text-white mb-3">{t("recent", lang)}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("when", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("type", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("sev", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("msg", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-white/40">{t("empty", lang)}</td></tr>
              ) : events.map((e: any) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-white/60 whitespace-nowrap">{new Date(e.created_at).toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3 text-white/85">{e.event_type ?? e.type ?? "—"}</td>
                  <td className="py-2 pr-3"><Badge className={cn("text-[10px] border-0", sevBadge(e.severity ?? e.level ?? "info"))}>{e.severity ?? "info"}</Badge></td>
                  <td className="py-2 pr-3 text-white/70 max-w-[420px] truncate">{e.message ?? JSON.stringify(e.details ?? {}).slice(0, 80)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
