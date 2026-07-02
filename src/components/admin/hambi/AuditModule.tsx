import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollText, Download, Search, RefreshCcw, User, Shield } from "lucide-react";
import { downloadCSV } from "@/utils/downloadHambiReport";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Audit jurnali", ru: "Журнал аудита", en: "Audit Log" },
  subtitle: { uz: "Barcha administrativ va tizim harakatlari", ru: "Все административные и системные действия", en: "All admin & system actions" },
  when:     { uz: "Vaqt", ru: "Время", en: "Time" },
  who:      { uz: "Kim", ru: "Кто", en: "Actor" },
  action:   { uz: "Amal", ru: "Действие", en: "Action" },
  entity:   { uz: "Ob'ekt", ru: "Объект", en: "Entity" },
  role:     { uz: "Rol", ru: "Роль", en: "Role" },
  search:   { uz: "Amal yoki ob'ekt…", ru: "Действие или объект…", en: "Action or entity…" },
  empty:    { uz: "Yozuv yo'q", ru: "Нет записей", en: "No entries" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

interface Row {
  id: string; created_at: string; user_id: string | null;
  role: string | null; action: string; entity_type: string; entity_id: string | null;
}

export default function AuditModule({ slug, lang }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("audit_logs")
      .select("id,created_at,user_id,role,action,entity_type,entity_id")
      .order("created_at", { ascending: false }).limit(150);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(r => r.action.toLowerCase().includes(s) || r.entity_type.toLowerCase().includes(s));
  }, [rows, q]);

  const roleBadge = (r: string | null) => {
    if (!r) return "bg-white/10 text-white/70";
    if (r.includes("admin")) return "bg-rose-500/20 text-rose-200";
    if (r.includes("doctor")) return "bg-blue-500/20 text-blue-200";
    return "bg-emerald-500/20 text-emerald-200";
  };

  return (
    <div className="space-y-6">
      <GlowCard tone="purple" glow>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-violet-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
              <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
            </div>
            <LiveStatusPill label="IMMUTABLE" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 w-56">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search", lang)}
                className="h-6 bg-transparent border-0 p-0 text-[12px] text-white placeholder:text-white/30 focus-visible:ring-0" />
            </div>
            <Button size="sm" variant="outline" onClick={load} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <RefreshCcw className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" onClick={() => downloadCSV(`audit-${slug}`,
              ["time", "role", "user", "action", "entity", "entity_id"],
              filtered.map(r => [r.created_at, r.role ?? "", r.user_id ?? "", r.action, r.entity_type, r.entity_id ?? ""]))}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
              <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>
      </GlowCard>

      <GlowCard>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("when", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("role", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("who", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("action", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("entity", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">{t("empty", lang)}</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-white/60 whitespace-nowrap">{new Date(r.created_at).toLocaleString("uz-UZ")}</td>
                  <td className="py-2 pr-3"><Badge className={`text-[10px] border-0 ${roleBadge(r.role)}`}>{r.role ?? "—"}</Badge></td>
                  <td className="py-2 pr-3 font-mono text-[10px] text-white/50">{r.user_id?.slice(0, 8) ?? "—"}</td>
                  <td className="py-2 pr-3 text-white/85">{r.action}</td>
                  <td className="py-2 pr-3 text-white/60">{r.entity_type}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
