/**
 * Admin dashboard for HAMBI/UNITEL Web-View partner integration.
 * Shows visit funnel, conversions, and RevShare totals.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MousePointerClick, TrendingUp, Wallet } from "lucide-react";

interface Stats {
  visits: number;
  signups: number;
  subscriptions: number;
  revenue: number;
  revshare: number;
}

interface ConversionRow {
  id: string;
  created_at: string;
  conversion_type: string;
  module: string | null;
  tier: string | null;
  amount: number;
  revshare_amount: number;
  currency: string;
  status: string;
}

const HambiPartnerAdminPage = () => {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? "hambi";
  const [stats, setStats] = useState<Stats>({ visits: 0, signups: 0, subscriptions: 0, revenue: 0, revshare: 0 });
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ count: visits }, { data: convs }] = await Promise.all([
        supabase.from("partner_visits").select("id", { count: "exact", head: true }).eq("source_slug", slug),
        supabase
          .from("partner_conversions")
          .select("id,created_at,conversion_type,module,tier,amount,revshare_amount,currency,status")
          .eq("source_slug", slug)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (cancelled) return;

      const list = (convs ?? []) as ConversionRow[];
      const signups = list.filter((c) => c.conversion_type === "signup").length;
      const subscriptions = list.filter((c) => c.conversion_type.includes("subscription")).length;
      const revenue = list.reduce((s, c) => s + Number(c.amount || 0), 0);
      const revshare = list.reduce((s, c) => s + Number(c.revshare_amount || 0), 0);

      setStats({ visits: visits ?? 0, signups, subscriptions, revenue, revshare });
      setConversions(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const tiles = [
    { label: "Ziyoratlar", value: stats.visits, icon: MousePointerClick, tone: "text-blue-600" },
    { label: "Ro'yxatdan o'tish", value: stats.signups, icon: Users, tone: "text-emerald-600" },
    { label: "Obunalar", value: stats.subscriptions, icon: TrendingUp, tone: "text-purple-600" },
    { label: "RevShare (UZS)", value: stats.revshare.toLocaleString("uz-UZ"), icon: Wallet, tone: "text-amber-600" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin"><ArrowLeft className="w-4 h-4 mr-2" /> Admin panelga qaytish</Link>
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {slug.toUpperCase()} — Partner Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Web-View integratsiyasi orqali kelgan trafik, konversiya va RevShare hisobi.
          </p>
        </div>
        <Badge variant="secondary" className="hidden md:inline-flex">slug: {slug}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <t.icon className={`w-4 h-4 ${t.tone}`} />
              </div>
              <p className="text-2xl font-bold">{loading ? "…" : t.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oxirgi konversiyalar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
          ) : conversions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hozircha konversiyalar yo'q.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-3">Sana</th>
                    <th className="py-2 pr-3">Turi</th>
                    <th className="py-2 pr-3">Modul / Tarif</th>
                    <th className="py-2 pr-3 text-right">Summa</th>
                    <th className="py-2 pr-3 text-right">RevShare</th>
                    <th className="py-2 pr-3">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleString("uz-UZ")}
                      </td>
                      <td className="py-2 pr-3">{c.conversion_type}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {[c.module, c.tier].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td className="py-2 pr-3 text-right font-medium">
                        {Number(c.amount).toLocaleString("uz-UZ")} {c.currency}
                      </td>
                      <td className="py-2 pr-3 text-right text-amber-600">
                        {Number(c.revshare_amount).toLocaleString("uz-UZ")}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant={c.status === "confirmed" ? "default" : "secondary"}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HambiPartnerAdminPage;
