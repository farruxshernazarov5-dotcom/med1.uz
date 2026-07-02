import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Gift, Ticket, Users, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:    { uz: "Aksiyalar va bonuslar", ru: "Акции и бонусы", en: "Promotions & bonuses" },
  subtitle: { uz: "Promo kodlar, referral bonuslar, AI chegirmalar", ru: "Промо, рефералы, AI-скидки", en: "Promo codes, referrals, AI discounts" },
  active:   { uz: "Faol promo", ru: "Активные промо", en: "Active promos" },
  redemp:   { uz: "Foydalanishlar", ru: "Использования", en: "Redemptions" },
  refs:     { uz: "Referrallar", ru: "Рефералы", en: "Referrals" },
  disc:     { uz: "Chegirmalar", ru: "Скидки", en: "Discounts" },
  code:     { uz: "Kod", ru: "Код", en: "Code" },
  used:     { uz: "Ishlatilgan", ru: "Использовано", en: "Used" },
  discount: { uz: "%", ru: "%", en: "%" },
  status:   { uz: "Holat", ru: "Статус", en: "Status" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

export default function PromosModule({ slug: _slug, lang }: Props) {
  const [promos, setPromos] = useState<any[]>([]);
  const [k, setK] = useState({ active: 0, redemp: 0, refs: 0 });

  useEffect(() => {
    (async () => {
      const [p, r, rf, red] = await Promise.all([
        supabase.from("promo_codes").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("promo_codes").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("referrals").select("id", { count: "exact", head: true }),
        supabase.from("promo_redemptions").select("id", { count: "exact", head: true }),
      ]);
      setPromos(p.data ?? []);
      setK({ active: r.count ?? 0, redemp: red.count ?? 0, refs: rf.count ?? 0 });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <GlowCard tone="purple" glow>
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-violet-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <LiveStatusPill label="LIVE" className="ml-auto" />
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: t("active", lang), v: k.active, i: Ticket, tone: "text-emerald-300" },
          { l: t("redemp", lang), v: k.redemp, i: Percent, tone: "text-amber-300" },
          { l: t("refs", lang), v: k.refs, i: Users, tone: "text-cyan-300" },
          { l: t("disc", lang), v: promos.reduce((s, x) => s + (x.discount_percent ?? 0), 0), i: Gift, tone: "text-violet-300" },
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
        <h3 className="text-sm font-semibold text-white mb-3">{t("code", lang)}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-white/40 border-b border-white/5">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("code", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("discount", lang)}</th>
                <th className="py-2 pr-3 font-medium text-right">{t("used", lang)}</th>
                <th className="py-2 pr-3 font-medium">{t("status", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p: any) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 font-mono text-white/90">{p.code}</td>
                  <td className="py-2 pr-3 text-right text-white tabular-nums">{p.discount_percent ?? p.discount ?? 0}%</td>
                  <td className="py-2 pr-3 text-right text-white/70 tabular-nums">{p.usage_count ?? 0}</td>
                  <td className="py-2 pr-3"><Badge className={cn("text-[10px] border-0", p.is_active ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/60")}>{p.is_active ? "active" : "off"}</Badge></td>
                </tr>
              ))}
              {promos.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-white/40">—</td></tr>}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
