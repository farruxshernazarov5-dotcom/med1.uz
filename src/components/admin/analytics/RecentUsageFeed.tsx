import { useAnalyticsRecentUsage } from "@/hooks/useAdminAnalytics";
import { Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const statusColor = (s: string | null) => {
  if (s === "success") return "text-emerald-400 bg-emerald-500/10";
  if (s === "rate_limited") return "text-amber-400 bg-amber-500/10";
  if (s === "blocked") return "text-orange-400 bg-orange-500/10";
  if (s === "error" || s === "timeout") return "text-red-400 bg-red-500/10";
  return "text-white/60 bg-white/5";
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s oldin`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h oldin`;
  return d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export const RecentUsageFeed = () => {
  const { data, isLoading, isError, error, refetch } = useAnalyticsRecentUsage(200);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-[#2F80ED]" />
          <h3 className="font-semibold">So'nggi AI so'rovlari</h3>
          <span className="text-xs text-white/40">(oxirgi 200, har 15s)</span>
        </div>
        <button onClick={() => refetch()} className="text-xs text-white/60 hover:text-white px-2 py-1 rounded border border-white/10">
          Yangilash
        </button>
      </div>

      {isLoading && <div className="text-white/50 text-sm">Yuklanmoqda…</div>}
      {isError && (
        <div className="text-red-400 text-sm">
          Xato: {(error as Error)?.message || "noma'lum"}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="text-white/50 text-sm py-6 text-center">
          Hozircha yozuvlar yo'q. AI xizmatdan foydalansangiz, shu yerda darhol ko'rinadi.
        </div>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase">
                <th className="text-left px-2 py-2 font-normal">Vaqt</th>
                <th className="text-left px-2 py-2 font-normal">Xizmat</th>
                <th className="text-left px-2 py-2 font-normal">Kanal</th>
                <th className="text-left px-2 py-2 font-normal">Status</th>
                <th className="text-right px-2 py-2 font-normal">Latency</th>
                <th className="text-right px-2 py-2 font-normal">Tok</th>
                <th className="text-right px-2 py-2 font-normal">Med Coin</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-white/5 text-white/80">
                  <td className="px-2 py-2 whitespace-nowrap text-white/60">
                    <Clock className="w-3 h-3 inline mr-1 opacity-60" />
                    {fmtTime(r.used_at)}
                  </td>
                  <td className="px-2 py-2 font-medium">{r.service_id}</td>
                  <td className="px-2 py-2 text-xs">{r.channel || "—"}</td>
                  <td className="px-2 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor(r.status)}`}>
                      {r.status === "success" ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> :
                       r.status ? <AlertCircle className="w-3 h-3 inline mr-1" /> : null}
                      {r.status || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right text-white/60">{r.latency_ms ? `${r.latency_ms}ms` : "—"}</td>
                  <td className="px-2 py-2 text-right text-white/60">{r.tokens_used ?? "—"}</td>
                  <td className="px-2 py-2 text-right text-[#7B61FF]">{r.cost_credits ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
