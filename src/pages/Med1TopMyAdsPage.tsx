import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Eye, MousePointerClick, Loader2, Plus, RefreshCw, Trash2, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { type AdCampaign, formatSum, statusTone } from "@/lib/med1Top";

const FILTERS = ["all", "active", "pending", "pending_payment", "expired"] as const;

const Med1TopMyAdsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("med1_ad_campaigns")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Yuklashda xato", description: error.message, variant: "destructive" });
    setRows((data as unknown as AdCampaign[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  const totals = useMemo(
    () => ({
      spent: rows.reduce((s, r) => s + Number(r.paid_amount || 0), 0),
      views: rows.reduce((s, r) => s + Number(r.impressions || 0), 0),
      clicks: rows.reduce((s, r) => s + Number(r.clicks || 0), 0),
      active: rows.filter((r) => r.status === "active").length,
    }),
    [rows],
  );

  const pay = async (ad: AdCampaign) => {
    setBusy(ad.id);
    try {
      const { data, error } = await supabase.functions.invoke("click-create-invoice", {
        body: {
          amount: Number(ad.bid_amount),
          purpose: "med1_ad",
          reference_id: ad.id,
          return_url: `${window.location.origin}/med1-top/my`,
        },
      });
      if (error) throw error;
      if (data?.checkout_url) window.location.href = data.checkout_url as string;
    } catch (e) {
      toast({ title: "To'lov xatoligi", description: e instanceof Error ? e.message : "Xatolik", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const toggleRenew = async (ad: AdCampaign) => {
    const { error } = await supabase
      .from("med1_ad_campaigns")
      .update({ auto_renew: !ad.auto_renew })
      .eq("id", ad.id);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else void load();
  };

  const remove = async (ad: AdCampaign) => {
    const { error } = await supabase.from("med1_ad_campaigns").delete().eq("id", ad.id);
    if (error) toast({ title: "O'chirib bo'lmadi", description: error.message, variant: "destructive" });
    else void load();
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Reklamalaringizni ko'rish uchun tizimga kiring.</p>
          <Button asChild><Link to="/auth">Kirish</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Reklamalarim — Med1 TOP kabineti" description="Med1 TOP reklama kampaniyalaringiz, takliflar, to'lovlar va real-time statistika." path="/med1-top/my" noindex />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">Reklamalarim</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-1" /> Yangilash</Button>
            <Button asChild size="sm"><Link to="/med1-top/new"><Plus className="w-4 h-4 mr-1" /> Yangi reklama</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Faol reklamalar", value: String(totals.active), icon: BarChart3 },
            { label: "Ko'rishlar", value: totals.views.toLocaleString("ru-RU"), icon: Eye },
            { label: "Kliklar", value: totals.clicks.toLocaleString("ru-RU"), icon: MousePointerClick },
            { label: "Sarflangan", value: formatSum(totals.spent), icon: Wallet },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <s.icon className="w-4 h-4 text-primary mb-2" />
              <p className="font-heading text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="shrink-0">
              {f}
            </Button>
          ))}
        </div>

        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">Reklama topilmadi.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((ad) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
              const daysLeft = ad.end_date ? Math.max(0, Math.ceil((new Date(ad.end_date).getTime() - Date.now()) / 86400000)) : null;
              return (
                <div key={ad.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-foreground">{ad.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[ad.specialty, ad.region].filter(Boolean).join(" · ")} · {formatSum(ad.bid_amount)}
                        {ad.top_rank ? ` · TOP-${ad.top_rank}` : ""}
                        {daysLeft !== null ? ` · ${daysLeft} kun qoldi` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusTone(ad.status)}>{ad.status}</Badge>
                  </div>

                  {ad.moderation_notes ? (
                    <p className="text-xs text-destructive mt-2">Moderator: {ad.moderation_notes}</p>
                  ) : null}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                    <div className="rounded-lg bg-muted/40 p-2"><span className="text-xs text-muted-foreground block">Ko'rishlar</span>{ad.impressions}</div>
                    <div className="rounded-lg bg-muted/40 p-2"><span className="text-xs text-muted-foreground block">Kliklar</span>{ad.clicks}</div>
                    <div className="rounded-lg bg-muted/40 p-2"><span className="text-xs text-muted-foreground block">CTR</span>{ctr}%</div>
                    <div className="rounded-lg bg-muted/40 p-2"><span className="text-xs text-muted-foreground block">To'langan</span>{formatSum(ad.paid_amount)}</div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {ad.status === "pending_payment" ? (
                      <Button size="sm" onClick={() => void pay(ad)} disabled={busy === ad.id}>
                        {busy === ad.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wallet className="w-3.5 h-3.5 mr-1" />}
                        To'lash
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => void toggleRenew(ad)}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Auto-renew: {ad.auto_renew ? "yoqilgan" : "o'chiq"}
                    </Button>
                    {["draft", "pending_payment", "rejected", "expired"].includes(ad.status) ? (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void remove(ad)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> O'chirish
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Med1TopMyAdsPage;
