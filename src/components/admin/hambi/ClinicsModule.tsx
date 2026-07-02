import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Hospital, Stethoscope, FlaskConical, Pill, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Klinikalar ekotizimi", ru: "Экосистема клиник", en: "Clinics ecosystem" },
  subtitle: { uz: "Ro'yxatdan o'tgan klinikalar, doktorlar, diagnostika va dorixonalar", ru: "Клиники, врачи, диагностика и аптеки", en: "Registered clinics, doctors, diagnostics & pharmacies" },
  clinics:  { uz: "Klinikalar", ru: "Клиники", en: "Clinics" },
  doctors:  { uz: "Doktorlar", ru: "Врачи", en: "Doctors" },
  diag:     { uz: "Diagnostika", ru: "Диагностика", en: "Diagnostics" },
  pharm:    { uz: "Dorixonalar", ru: "Аптеки", en: "Pharmacies" },
  cosm:     { uz: "Kosmetologiya", ru: "Косметология", en: "Cosmetology" },
  latest:   { uz: "Yangi qo'shilganlar", ru: "Недавно добавленные", en: "Recently added" },
  name:     { uz: "Nomi", ru: "Название", en: "Name" },
  region:   { uz: "Hudud", ru: "Регион", en: "Region" },
  when:     { uz: "Qo'shildi", ru: "Добавлен", en: "Added" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

export default function ClinicsModule({ slug: _slug, lang }: Props) {
  const [k, setK] = useState({ clinics: 0, doctors: 0, diag: 0, pharm: 0, cosm: 0 });
  const [latest, setLatest] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [c, d, dg, ph, co, rc] = await Promise.all([
        supabase.from("registered_clinics").select("id", { count: "exact", head: true }),
        supabase.from("doctors").select("id", { count: "exact", head: true }),
        supabase.from("registered_diagnostics").select("id", { count: "exact", head: true }),
        supabase.from("registered_pharmacies").select("id", { count: "exact", head: true }),
        supabase.from("registered_cosmetology").select("id", { count: "exact", head: true }),
        supabase.from("registered_clinics").select("id,name,region,created_at").order("created_at", { ascending: false }).limit(10),
      ]);
      setK({ clinics: c.count ?? 0, doctors: d.count ?? 0, diag: dg.count ?? 0, pharm: ph.count ?? 0, cosm: co.count ?? 0 });
      setLatest(rc.data ?? []);
    })();
  }, []);

  const tiles = [
    { l: t("clinics", lang), v: k.clinics, i: Hospital, tone: "text-cyan-300" },
    { l: t("doctors", lang), v: k.doctors, i: Stethoscope, tone: "text-blue-300" },
    { l: t("diag", lang), v: k.diag, i: FlaskConical, tone: "text-violet-300" },
    { l: t("pharm", lang), v: k.pharm, i: Pill, tone: "text-emerald-300" },
    { l: t("cosm", lang), v: k.cosm, i: Sparkles, tone: "text-amber-300" },
  ];

  return (
    <div className="space-y-6">
      <GlowCard tone="cyan" glow>
        <div className="flex items-center gap-3">
          <Hospital className="w-5 h-5 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <LiveStatusPill label="LIVE" className="ml-auto" />
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiles.map((tile) => (
          <GlowCard key={tile.l} className="!p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-wider text-white/60">{tile.l}</p>
              <tile.i className={cn("w-4 h-4", tile.tone)} />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{tile.v}</p>
          </GlowCard>
        ))}
      </div>

      <GlowCard>
        <h3 className="text-sm font-semibold text-white mb-3">{t("latest", lang)}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("name", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("region", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("when", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((r: any) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-white/90">{r.name ?? "—"}</td>
                  <td className="py-2 pr-3"><Badge className="text-[10px] bg-white/10 text-white border-0">{r.region ?? "—"}</Badge></td>
                  <td className="py-2 pr-3 text-white/60">{new Date(r.created_at).toLocaleDateString("uz-UZ")}</td>
                </tr>
              ))}
              {latest.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-white/40">—</td></tr>}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
