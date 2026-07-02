import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { MapPin, Radio, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Geolokatsiya markazi", ru: "Гео-центр", en: "Geo Center" },
  subtitle: { uz: "Zonalar, heatmap va region bo'yicha foydalanuvchi taqsimoti", ru: "Зоны, тепловая карта, распределение по регионам", en: "Zones, heatmap & regional distribution" },
  zones:    { uz: "Geo-zonalar", ru: "Гео-зоны", en: "Geo zones" },
  consent:  { uz: "Ruxsat berganlar", ru: "Дали согласие", en: "Consented users" },
  notifs:   { uz: "Geo-notif", ru: "Гео-уведомл.", en: "Geo notifs" },
  byRegion: { uz: "Region bo'yicha", ru: "По регионам", en: "By region" },
  name:     { uz: "Nomi", ru: "Название", en: "Name" },
  radius:   { uz: "Radius (m)", ru: "Радиус (м)", en: "Radius (m)" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

export default function GeoModule({ slug: _slug, lang }: Props) {
  const [zones, setZones] = useState<any[]>([]);
  const [k, setK] = useState({ consent: 0, notifs: 0 });
  const [regions, setRegions] = useState<{ d: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const sb: any = supabase;
      const z = await sb.from("geofence_zones").select("*").limit(30);
      const c = await sb.from("user_location_consent").select("id", { count: "exact", head: true }).eq("consented", true);
      const n = await sb.from("geo_notifications").select("id", { count: "exact", head: true });
      const r = await sb.from("registered_clinics").select("region");
      setZones((z.data ?? []) as any[]);
      setK({ consent: c.count ?? 0, notifs: n.count ?? 0 });
      const map: Record<string, number> = {};
      ((r.data ?? []) as any[]).forEach((x: any) => { const k = x.region ?? "—"; map[k] = (map[k] ?? 0) + 1; });
      setRegions(Object.entries(map).map(([d, count]) => ({ d, count })).slice(0, 12));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <GlowCard tone="cyan" glow>
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <LiveStatusPill label="GPS" className="ml-auto" />
        </div>
      </GlowCard>

      <div className="grid grid-cols-3 gap-3">
        <GlowCard className="!p-4"><div className="flex items-center justify-between mb-1"><p className="text-[11px] uppercase text-white/60">{t("zones", lang)}</p><MapPin className="w-4 h-4 text-cyan-300" /></div><p className="text-2xl font-bold text-white tabular-nums">{zones.length}</p></GlowCard>
        <GlowCard className="!p-4"><div className="flex items-center justify-between mb-1"><p className="text-[11px] uppercase text-white/60">{t("consent", lang)}</p><Users className="w-4 h-4 text-emerald-300" /></div><p className="text-2xl font-bold text-white tabular-nums">{k.consent}</p></GlowCard>
        <GlowCard className="!p-4"><div className="flex items-center justify-between mb-1"><p className="text-[11px] uppercase text-white/60">{t("notifs", lang)}</p><Radio className="w-4 h-4 text-amber-300" /></div><p className="text-2xl font-bold text-white tabular-nums">{k.notifs}</p></GlowCard>
      </div>

      <GlowCard>
        <h3 className="text-sm font-semibold text-white mb-3">{t("byRegion", lang)}</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regions}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(10,37,64,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              <Bar dataKey="count" fill="#7B61FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>

      <GlowCard>
        <h3 className="text-sm font-semibold text-white mb-3">{t("zones", lang)}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("name", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("radius", lang)}</th>
                <th className="py-2 pr-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z: any) => (
                <tr key={z.id} className="border-b border-white/5 last:border-0"><td className="py-2 pr-3 text-white/90">{z.name}</td><td className="py-2 pr-3 text-right text-white/70 tabular-nums">{z.radius_meters ?? z.radius ?? "—"}</td><td className="py-2 pr-3"><Badge className="text-[10px] bg-white/10 text-white border-0">{z.zone_type ?? "geo"}</Badge></td></tr>
              ))}
              {zones.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-white/40">—</td></tr>}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
