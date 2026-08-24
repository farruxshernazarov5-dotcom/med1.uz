import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3, Check, Crown, Loader2, Megaphone, RefreshCw, Search, Settings2, ShieldAlert, Trash2, TrendingUp, Wallet, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/utils/auditLog";
import { type AdCampaign, type AdPlacement, formatSum, statusTone } from "@/lib/med1Top";

type Tab = "dashboard" | "ads" | "moderation" | "auction" | "revenue" | "settings";

const TABS: { key: Tab; label: string; icon: typeof Crown }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "ads", label: "Reklamalar", icon: Megaphone },
  { key: "moderation", label: "Moderatsiya", icon: ShieldAlert },
  { key: "auction", label: "Auksion / TOP", icon: Crown },
  { key: "revenue", label: "Daromad & RevShare", icon: Wallet },
  { key: "settings", label: "Sozlamalar", icon: Settings2 },
];

const MedicalAdsModule = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [adsRes, plRes] = await Promise.all([
      supabase.from("med1_ad_campaigns").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("med1_ad_placements").select("*").order("sort_order"),
    ]);
    if (adsRes.error) toast({ title: "Yuklashda xato", description: adsRes.error.message, variant: "destructive" });
    setAds((adsRes.data as unknown as AdCampaign[]) ?? []);
    setPlacements((plRes.data as unknown as AdPlacement[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const paid = ads.reduce((s, a) => s + Number(a.paid_amount || 0), 0);
    const now = Date.now();
    const since = (ms: number) => ads.filter((a) => now - new Date(a.created_at).getTime() < ms)
      .reduce((s, a) => s + Number(a.paid_amount || 0), 0);
    return {
      total: paid,
      today: since(86400000),
      week: since(7 * 86400000),
      month: since(30 * 86400000),
      active: ads.filter((a) => a.status === "active").length,
      pending: ads.filter((a) => ["pending", "ai_flagged", "pending_payment"].includes(a.status)).length,
      impressions: ads.reduce((s, a) => s + Number(a.impressions || 0), 0),
      clicks: ads.reduce((s, a) => s + Number(a.clicks || 0), 0),
    };
  }, [ads]);

  const byPlacement = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; count: number }>();
    placements.forEach((p) => map.set(p.id, { name: p.name_uz, revenue: 0, count: 0 }));
    ads.forEach((a) => {
      if (!a.placement_id) return;
      const row = map.get(a.placement_id);
      if (row) { row.revenue += Number(a.paid_amount || 0); row.count += 1; }
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [ads, placements]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ads.filter((a) => !term || [a.title, a.brand_name, a.region, a.specialty].filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term)));
  }, [ads, q]);

  const setStatus = async (ad: AdCampaign, status: string, notes?: string) => {
    setBusy(ad.id);
    const patch: Record<string, unknown> = { status, moderation_notes: notes ?? null };
    if (status === "active") {
      patch.start_date = new Date().toISOString();
      patch.end_date = new Date(Date.now() + (ad.duration_days || 30) * 86400000).toISOString();
      patch.paid_amount = Number(ad.paid_amount || 0) || Number(ad.bid_amount || 0);
    }
    const { error } = await supabase.from("med1_ad_campaigns").update(patch).eq("id", ad.id);
    if (error) {
      toast({ title: "Xato", description: error.message, variant: "destructive" });
    } else {
      await supabase.rpc("med1_ads_recompute_ranks", { _placement_id: ad.placement_id } as never);
      void writeAuditLog({ action: `ad_${status}`, entity_type: "med1_ad_campaign", entity_id: ad.id, module: "medical_ads", new_data: patch });
      toast({ title: "Yangilandi", description: `${ad.title} → ${status}` });
      await load();
    }
    setBusy(null);
  };

  const remove = async (ad: AdCampaign) => {
    const { error } = await supabase.from("med1_ad_campaigns").delete().eq("id", ad.id);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { void writeAuditLog({ action: "ad_delete", entity_type: "med1_ad_campaign", entity_id: ad.id, module: "medical_ads" }); await load(); }
  };

  const savePlacement = async (p: AdPlacement, patch: Partial<AdPlacement>) => {
    const { error } = await supabase.from("med1_ad_placements").update(patch).eq("id", p.id);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "Saqlandi", description: p.name_uz }); await load(); }
  };

  const adRow = (ad: AdCampaign, moderation = false) => (
    <div key={ad.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm">{ad.title}</p>
          <p className="text-xs text-muted-foreground">
            {[ad.entity_type, ad.specialty, ad.region].filter(Boolean).join(" · ")} · {formatSum(ad.bid_amount)}
            {ad.top_rank ? ` · TOP-${ad.top_rank}` : ""}
          </p>
          {ad.description ? <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.description}</p> : null}
          {Array.isArray(ad.ai_flags) && (ad.ai_flags as string[]).length > 0 ? (
            <p className="text-xs text-orange-500 mt-1">AI flag: {(ad.ai_flags as string[]).join(", ")}</p>
          ) : null}
        </div>
        <Badge variant="outline" className={statusTone(ad.status)}>{ad.status}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {moderation || ad.status !== "active" ? (
          <Button size="sm" onClick={() => void setStatus(ad, "active")} disabled={busy === ad.id}>
            {busy === ad.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />} Tasdiqlash
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => void setStatus(ad, "rejected", "Tibbiy reklama qoidalariga mos emas")}>
          <X className="w-3.5 h-3.5 mr-1" /> Rad etish
        </Button>
        <Button size="sm" variant="outline" onClick={() => void setStatus(ad, "paused")}>Pauza</Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void remove(ad)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {ad.impressions} ko'rish · {ad.clicks} klik · CTR {ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0"}%
      </p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> Medical Ads / Med1 TOP
        </h2>
        <Button size="sm" variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-1" /> Yangilash</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? "default" : "outline"} onClick={() => setTab(t.key)} className="shrink-0">
            <t.icon className="w-3.5 h-3.5 mr-1" /> {t.label}
          </Button>
        ))}
      </div>

      {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : null}

      {tab === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "Bugungi daromad", v: formatSum(stats.today) },
              { l: "Haftalik", v: formatSum(stats.week) },
              { l: "Oylik", v: formatSum(stats.month) },
              { l: "Umumiy", v: formatSum(stats.total) },
              { l: "Faol reklama", v: String(stats.active) },
              { l: "Kutilmoqda", v: String(stats.pending) },
              { l: "Ko'rishlar", v: stats.impressions.toLocaleString("ru-RU") },
              { l: "Kliklar", v: stats.clicks.toLocaleString("ru-RU") },
            ].map((s) => (
              <div key={s.l} className="bg-card border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{s.l}</p>
                <p className="font-heading text-lg font-bold text-foreground">{s.v}</p>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Format bo'yicha daromad</p>
            <div className="space-y-2">
              {byPlacement.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{p.name} ({p.count})</span>
                  <span className="font-semibold text-foreground">{formatSum(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "ads" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish" className="pl-9" />
          </div>
          {filtered.map((a) => adRow(a))}
        </div>
      )}

      {tab === "moderation" && (
        <div className="space-y-3">
          {ads.filter((a) => ["pending", "ai_flagged", "pending_payment"].includes(a.status)).map((a) => adRow(a, true))}
          {ads.filter((a) => ["pending", "ai_flagged", "pending_payment"].includes(a.status)).length === 0 ? (
            <p className="text-sm text-muted-foreground">Moderatsiyada reklama yo'q.</p>
          ) : null}
        </div>
      )}

      {tab === "auction" && (
        <div className="space-y-3">
          <Button size="sm" onClick={async () => {
            const { error } = await supabase.rpc("med1_ads_recompute_ranks", { _placement_id: null } as never);
            toast(error ? { title: "Xato", description: error.message, variant: "destructive" } : { title: "TOP reyting qayta hisoblandi" });
            await load();
          }}>
            <Crown className="w-4 h-4 mr-1" /> TOP reytingni qayta hisoblash
          </Button>
          {placements.map((p) => {
            const list = ads.filter((a) => a.placement_id === p.id && a.status === "active")
              .sort((a, b) => (a.top_rank ?? 99) - (b.top_rank ?? 99));
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-3">
                <p className="font-semibold text-foreground text-sm mb-1">{p.name_uz} · {p.slots} o'rin</p>
                <p className="text-xs text-muted-foreground mb-2">min {formatSum(p.min_bid)} · qadam {formatSum(p.bid_step)}</p>
                {list.length === 0 ? <p className="text-xs text-muted-foreground">Faol reklama yo'q</p> : list.map((a) => (
                  <div key={a.id} className="flex justify-between text-sm py-0.5">
                    <span>TOP-{a.top_rank ?? "-"} · {a.title}</span>
                    <span className="font-semibold">{formatSum(a.bid_amount)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {tab === "revenue" && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 text-sm space-y-1">
            <p className="flex justify-between"><span className="text-muted-foreground">Umumiy to'lov</span><span className="font-semibold">{formatSum(stats.total)}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Med1 ulushi (85%)</span><span className="font-semibold">{formatSum(stats.total * 0.85)}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Hamkor ulushi (15%)</span><span className="font-semibold">{formatSum(stats.total * 0.15)}</span></p>
          </div>
          {byPlacement.map((p) => (
            <div key={p.name} className="bg-card border border-border rounded-xl p-3 flex justify-between text-sm">
              <span className="text-muted-foreground">{p.name}</span>
              <span className="font-semibold text-foreground">{formatSum(p.revenue)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-3">
          {placements.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-3 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
              <div className="col-span-2">
                <p className="text-sm font-semibold text-foreground">{p.name_uz}</p>
                <p className="text-xs text-muted-foreground">{p.code}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Min taklif</label>
                <Input type="number" defaultValue={p.min_bid} onBlur={(e) => void savePlacement(p, { min_bid: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Qadam</label>
                <Input type="number" defaultValue={p.bid_step} onBlur={(e) => void savePlacement(p, { bid_step: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">O'rinlar</label>
                <Input type="number" defaultValue={p.slots} onBlur={(e) => void savePlacement(p, { slots: Number(e.target.value) })} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalAdsModule;
