import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Handshake, KeyRound, TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Hamkorlar tarmog'i", ru: "Партнёрская сеть", en: "Partner Network" },
  subtitle: { uz: "HAMBI, UNITEL va API hamkorlar boshqaruvi", ru: "Управление партнёрами HAMBI, UNITEL и API", en: "HAMBI, UNITEL & API partners" },
  partners: { uz: "Hamkorlar", ru: "Партнёры", en: "Partners" },
  apiKeys:  { uz: "API kalitlar", ru: "API-ключи", en: "API keys" },
  apps:     { uz: "Arizalar", ru: "Заявки", en: "Applications" },
  reqs:     { uz: "So'rovlar", ru: "Запросы", en: "Requests" },
  name:     { uz: "Nomi", ru: "Название", en: "Name" },
  slug:     { uz: "Slug", ru: "Slug", en: "Slug" },
  rev:      { uz: "RevShare %", ru: "RevShare %", en: "RevShare %" },
  status:   { uz: "Holat", ru: "Статус", en: "Status" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

export default function PartnersModule({ slug: _slug, lang }: Props) {
  const [partners, setPartners] = useState<any[]>([]);
  const [k, setK] = useState({ keys: 0, apps: 0, reqs: 0 });

  useEffect(() => {
    (async () => {
      const [p, ky, ap, rq] = await Promise.all([
        supabase.from("api_partners").select("*").limit(30),
        supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("api_partner_applications").select("id", { count: "exact", head: true }),
        supabase.from("api_request_logs").select("id", { count: "exact", head: true }),
      ]);
      setPartners(p.data ?? []);
      setK({ keys: ky.count ?? 0, apps: ap.count ?? 0, reqs: rq.count ?? 0 });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <GlowCard tone="purple" glow>
        <div className="flex items-center gap-3">
          <Handshake className="w-5 h-5 text-violet-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <LiveStatusPill label="ACTIVE" className="ml-auto" />
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: t("partners", lang), v: partners.length, i: Building2, tone: "text-cyan-300" },
          { l: t("apiKeys", lang), v: k.keys, i: KeyRound, tone: "text-emerald-300" },
          { l: t("apps", lang), v: k.apps, i: Handshake, tone: "text-amber-300" },
          { l: t("reqs", lang), v: k.reqs, i: TrendingUp, tone: "text-violet-300" },
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
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("name", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("slug", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("rev", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("status", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p: any) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-white/90">{p.name}</td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-white/60">{p.slug}</td>
                  <td className="py-2 pr-3 text-right text-amber-300 tabular-nums">{p.revshare_percent ?? p.commission_rate ?? 0}%</td>
                  <td className="py-2 pr-3"><Badge className={cn("text-[10px] border-0", p.is_active ?? p.status === "active" ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/60")}>{p.status ?? (p.is_active ? "active" : "off")}</Badge></td>
                </tr>
              ))}
              {partners.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-white/40">—</td></tr>}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
