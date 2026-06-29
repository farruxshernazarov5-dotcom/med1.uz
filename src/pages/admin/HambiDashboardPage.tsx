import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Users, Activity, CreditCard, Wallet, TrendingUp, AlertCircle, FileDown, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

// HAMBI RevShare percent (estimate for the panel — adjust if contract differs)
const HAMBI_REVSHARE = 0.3;
// 1 Med Coin ≈ 1000 UZS estimate for revenue display
const MED_COIN_TO_UZS = 1000;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const startOfDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

type UsageRow = {
  id: string;
  user_id: string;
  service_id: string;
  status: string | null;
  cost_credits: number | null;
  tokens_used: number | null;
  used_at: string;
};

// Today's HAMBI stats
function useHambiToday() {
  return useQuery({
    queryKey: ["hambi-today"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const fromToday = startOfToday();
      const { data, error } = await supabase
        .from("ai_usage")
        .select("id,user_id,service_id,status,cost_credits,tokens_used,used_at")
        .eq("channel", "hambi")
        .gte("used_at", fromToday)
        .limit(5000);
      if (error) throw error;
      const rows = (data ?? []) as UsageRow[];
      const users = new Set(rows.map(r => r.user_id));
      const success = rows.filter(r => r.status === "success").length;
      const errors = rows.filter(r => r.status && r.status !== "success").length;
      const credits = rows.reduce((s, r) => s + (r.cost_credits ?? 0), 0);
      const tokens = rows.reduce((s, r) => s + (r.tokens_used ?? 0), 0);
      return {
        requests: rows.length,
        users: users.size,
        success,
        errors,
        credits,
        tokens,
        revshare_uzs: Math.round(credits * MED_COIN_TO_UZS * HAMBI_REVSHARE),
      };
    },
  });
}

// 7-day trend
function useHambi7d() {
  return useQuery({
    queryKey: ["hambi-7d"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_usage")
        .select("used_at,cost_credits,user_id")
        .eq("channel", "hambi")
        .gte("used_at", startOfDaysAgo(7))
        .limit(20000);
      if (error) throw error;
      const buckets: Record<string, { date: string; requests: number; credits: number; users: Set<string> }> = {};
      for (const r of data ?? []) {
        const d = new Date((r as any).used_at).toISOString().slice(0, 10);
        buckets[d] ??= { date: d, requests: 0, credits: 0, users: new Set() };
        buckets[d].requests++;
        buckets[d].credits += (r as any).cost_credits ?? 0;
        buckets[d].users.add((r as any).user_id);
      }
      return Object.values(buckets)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(b => ({ date: b.date, requests: b.requests, credits: b.credits, users: b.users.size }));
    },
  });
}

// Per-service breakdown today
function useHambiByService() {
  return useQuery({
    queryKey: ["hambi-by-service"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_usage")
        .select("service_id,status,cost_credits")
        .eq("channel", "hambi")
        .gte("used_at", startOfDaysAgo(30))
        .limit(20000);
      if (error) throw error;
      const map: Record<string, { service: string; count: number; success: number; errors: number; credits: number }> = {};
      for (const r of (data ?? []) as any[]) {
        const s = r.service_id || "unknown";
        map[s] ??= { service: s, count: 0, success: 0, errors: 0, credits: 0 };
        map[s].count++;
        if (r.status === "success") map[s].success++;
        else if (r.status) map[s].errors++;
        map[s].credits += r.cost_credits ?? 0;
      }
      return Object.values(map).sort((a, b) => b.count - a.count);
    },
  });
}

// Top HAMBI users (last 30d)
function useHambiTopUsers() {
  return useQuery({
    queryKey: ["hambi-top-users"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data: usage } = await supabase
        .from("ai_usage")
        .select("user_id,cost_credits,used_at")
        .eq("channel", "hambi")
        .gte("used_at", startOfDaysAgo(30))
        .limit(20000);
      const agg: Record<string, { user_id: string; requests: number; credits: number; last: string }> = {};
      for (const r of (usage ?? []) as any[]) {
        agg[r.user_id] ??= { user_id: r.user_id, requests: 0, credits: 0, last: r.used_at };
        agg[r.user_id].requests++;
        agg[r.user_id].credits += r.cost_credits ?? 0;
        if (r.used_at > agg[r.user_id].last) agg[r.user_id].last = r.used_at;
      }
      const top = Object.values(agg).sort((a, b) => b.requests - a.requests).slice(0, 20);
      if (top.length === 0) return [];
      const ids = top.map(t => t.user_id);
      const [{ data: profiles }, { data: credits }, { data: subs }] = await Promise.all([
        supabase.from("profiles").select("user_id,full_name,phone").in("user_id", ids),
        supabase.from("user_credits").select("user_id,balance").in("user_id", ids),
        supabase.from("ai_subscriptions").select("user_id,tier,status,expires_at").in("user_id", ids),
      ]);
      const pmap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      const cmap = new Map((credits ?? []).map((c: any) => [c.user_id, c]));
      const smap = new Map((subs ?? []).map((s: any) => [s.user_id, s]));
      return top.map(t => ({
        ...t,
        profile: pmap.get(t.user_id),
        credits: cmap.get(t.user_id),
        sub: smap.get(t.user_id),
      }));
    },
  });
}

// Subscription tier distribution among HAMBI users
function useHambiSubs() {
  return useQuery({
    queryKey: ["hambi-subs"],
    refetchInterval: 60_000,
    queryFn: async () => {
      // get distinct hambi user ids from last 60d
      const { data: usage } = await supabase
        .from("ai_usage")
        .select("user_id")
        .eq("channel", "hambi")
        .gte("used_at", startOfDaysAgo(60))
        .limit(20000);
      const ids = Array.from(new Set((usage ?? []).map((r: any) => r.user_id)));
      if (ids.length === 0) return { lite: 0, standard: 0, premium: 0, none: 0, expiring: 0 };
      const { data: subs } = await supabase
        .from("ai_subscriptions")
        .select("user_id,tier,status,expires_at")
        .in("user_id", ids);
      const active = (subs ?? []).filter((s: any) => s.status === "active");
      const tier = (t: string) => active.filter((s: any) => (s.tier || "").toLowerCase() === t).length;
      const in7d = new Date(Date.now() + 7 * 86400_000).toISOString();
      const expiring = active.filter((s: any) => s.expires_at && s.expires_at < in7d).length;
      return {
        lite: tier("lite"),
        standard: tier("standard"),
        premium: tier("premium"),
        none: ids.length - active.length,
        expiring,
      };
    },
  });
}

const KpiCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <Card className="bg-white/5 border-white/10 text-white">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/60">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#2F80ED]/20 grid place-items-center">
          <Icon className="w-5 h-5 text-[#2F80ED]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const HambiDashboardPage = () => {
  const { user, loading, userRole } = useAuth();
  const today = useHambiToday();
  const trend = useHambi7d();
  const byService = useHambiByService();
  const topUsers = useHambiTopUsers();
  const subs = useHambiSubs();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A2540]">
        <div className="animate-spin w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "admin") return <Navigate to={`/dashboard/${userRole || "patient"}`} replace />;

  const t = today.data;
  const s = subs.data;

  const exportRevShareExcel = () => {
    const trendRows = (trend.data ?? []).map(d => ({
      Sana: d.date,
      "So'rovlar": d.requests,
      "Foydalanuvchilar": d.users,
      "Med Coin": d.credits,
      "RevShare (so'm)": Math.round(d.credits * MED_COIN_TO_UZS * HAMBI_REVSHARE),
    }));
    const serviceRows = (byService.data ?? []).map(s => ({
      Xizmat: s.service,
      "So'rovlar": s.count,
      "Muvaffaqiyatli": s.success,
      "Xatolik": s.errors,
      "Med Coin": s.credits,
      "RevShare (so'm)": Math.round(s.credits * MED_COIN_TO_UZS * HAMBI_REVSHARE),
    }));
    const summary = [{
      "Bugungi so'rovlar": t?.requests ?? 0,
      "Bugungi foydalanuvchilar": t?.users ?? 0,
      "Bugungi Med Coin": t?.credits ?? 0,
      "Bugungi RevShare (so'm)": t?.revshare_uzs ?? 0,
      "Ulush (%)": HAMBI_REVSHARE * 100,
      "1 Coin = so'm": MED_COIN_TO_UZS,
      "Yaratildi": new Date().toLocaleString(),
    }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Xulosa");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendRows), "7 kunlik trend");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serviceRows), "Xizmatlar (30k)");
    XLSX.writeFile(wb, `hambi-revshare-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportRevSharePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleString();
    doc.setFontSize(16); doc.text("HAMBI RevShare hisoboti", 14, 18);
    doc.setFontSize(9); doc.setTextColor(120); doc.text(`Yaratildi: ${date}`, 14, 24);
    doc.setTextColor(0); doc.setFontSize(11);
    let y = 34;
    doc.text(`Ulush: ${HAMBI_REVSHARE * 100}%   |   1 Med Coin = ${MED_COIN_TO_UZS} so'm`, 14, y); y += 8;
    doc.text("Bugungi koʻrsatkichlar:", 14, y); y += 6;
    doc.setFontSize(10);
    [
      `So'rovlar: ${t?.requests ?? 0}   (muvaffaqiyatli: ${t?.success ?? 0}, xato: ${t?.errors ?? 0})`,
      `Foydalanuvchilar: ${t?.users ?? 0}`,
      `Med Coin sarflandi: ${t?.credits ?? 0}   (${(t?.tokens ?? 0).toLocaleString()} token)`,
      `RevShare (bugun): ${(t?.revshare_uzs ?? 0).toLocaleString()} so'm`,
    ].forEach(line => { doc.text(line, 18, y); y += 6; });

    y += 6; doc.setFontSize(11); doc.text("7 kunlik trend:", 14, y); y += 6;
    doc.setFontSize(9);
    doc.text("Sana        So'rov  User  Med Coin  RevShare (so'm)", 18, y); y += 5;
    (trend.data ?? []).forEach(d => {
      if (y > 280) { doc.addPage(); y = 20; }
      const rev = Math.round(d.credits * MED_COIN_TO_UZS * HAMBI_REVSHARE);
      doc.text(`${d.date}   ${String(d.requests).padStart(5)}  ${String(d.users).padStart(4)}  ${String(d.credits).padStart(7)}  ${rev.toLocaleString().padStart(12)}`, 18, y);
      y += 5;
    });

    y += 6; if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11); doc.text("AI xizmatlar (30 kun):", 14, y); y += 6;
    doc.setFontSize(9);
    (byService.data ?? []).forEach(s => {
      if (y > 280) { doc.addPage(); y = 20; }
      const rev = Math.round(s.credits * MED_COIN_TO_UZS * HAMBI_REVSHARE);
      doc.text(`${s.service.padEnd(22).slice(0,22)}  ${String(s.count).padStart(5)} req   ${s.success}/${s.errors}   ${s.credits} MC   ${rev.toLocaleString()} so'm`, 18, y);
      y += 5;
    });

    doc.save(`hambi-revshare-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0A2540] bg-grid-tech">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-5">
        <Link to="/admin" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Admin paneli
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">HAMBI — Mini boshqaruv paneli</h1>
            <p className="text-sm text-white/60 mt-1">Real vaqt: HAMBI WebView orqali keladigan foydalanuvchilar va AI faolligi</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">channel = hambi</Badge>
            <Button size="sm" variant="outline" className="h-8 border-white/20 text-white/90 hover:bg-white/10" onClick={exportRevShareExcel}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> RevShare · Excel
            </Button>
            <Button size="sm" variant="outline" className="h-8 border-white/20 text-white/90 hover:bg-white/10" onClick={exportRevSharePDF}>
              <FileDown className="w-3.5 h-3.5 mr-1" /> RevShare · PDF
            </Button>
            <Link to="/admin/hambi-partner">
              <Button size="sm" className="h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Integration Audit
              </Button>
            </Link>
          </div>
        </div>


        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={Users} label="Bugungi foydalanuvchilar" value={t?.users ?? "—"} />
          <KpiCard icon={Activity} label="Bugungi AI so'rovlari" value={t?.requests ?? "—"} sub={`${t?.success ?? 0} muvaffaqiyatli`} />
          <KpiCard icon={AlertCircle} label="Xatoliklar (bugun)" value={t?.errors ?? "—"} />
          <KpiCard icon={Wallet} label="Med Coin sarflandi" value={t?.credits ?? "—"} sub={`${(t?.tokens ?? 0).toLocaleString()} token`} />
          <KpiCard icon={TrendingUp} label="HAMBI RevShare (bugun)" value={`${(t?.revshare_uzs ?? 0).toLocaleString()} so'm`} sub={`${HAMBI_REVSHARE * 100}% ulush`} />
          <KpiCard icon={CreditCard} label="Faol obunalar" value={(s?.lite ?? 0) + (s?.standard ?? 0) + (s?.premium ?? 0)} sub={s ? `${s.expiring} muddati tugayotgan` : ""} />
        </div>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="services">AI xizmatlar (30k)</TabsTrigger>
            <TabsTrigger value="trend">7 kunlik trend</TabsTrigger>
            <TabsTrigger value="users">Top foydalanuvchilar</TabsTrigger>
            <TabsTrigger value="subs">Obunalar</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader><CardTitle className="text-base">14 AI xizmat — foydalanish (30 kun)</CardTitle></CardHeader>
              <CardContent>
                {byService.isLoading ? <p className="text-white/50 text-sm">Yuklanmoqda...</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-white/50 text-xs uppercase">
                        <tr>
                          <th className="text-left py-2">Xizmat</th>
                          <th className="text-right">So'rovlar</th>
                          <th className="text-right">Muvaffaqiyatli</th>
                          <th className="text-right">Xatolik</th>
                          <th className="text-right">Med Coin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(byService.data ?? []).map(s => (
                          <tr key={s.service} className="border-t border-white/5">
                            <td className="py-2 font-mono text-xs">{s.service}</td>
                            <td className="text-right">{s.count}</td>
                            <td className="text-right text-emerald-300">{s.success}</td>
                            <td className="text-right text-rose-300">{s.errors}</td>
                            <td className="text-right">{s.credits}</td>
                          </tr>
                        ))}
                        {(byService.data ?? []).length === 0 && (
                          <tr><td colSpan={5} className="text-center py-6 text-white/40">Hozircha HAMBI orqali so'rovlar yo'q</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trend">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader><CardTitle className="text-base">Kunlik trend — oxirgi 7 kun</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(trend.data ?? []).map(d => (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="w-24 text-xs text-white/60">{d.date}</span>
                      <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                        <div className="h-full bg-[#2F80ED]" style={{ width: `${Math.min(100, d.requests / Math.max(...(trend.data ?? []).map(x => x.requests), 1) * 100)}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs">{d.requests} so'rov</span>
                      <span className="w-20 text-right text-xs text-white/60">{d.users} user</span>
                      <span className="w-20 text-right text-xs text-emerald-300">{d.credits} MC</span>
                    </div>
                  ))}
                  {(trend.data ?? []).length === 0 && <p className="text-white/40 text-sm text-center py-6">Ma'lumot yo'q</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader><CardTitle className="text-base">Top HAMBI foydalanuvchilari (30 kun)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-white/50 text-xs uppercase">
                      <tr>
                        <th className="text-left py-2">Foydalanuvchi</th>
                        <th className="text-left">Tel</th>
                        <th className="text-right">So'rovlar</th>
                        <th className="text-right">Med Coin</th>
                        <th className="text-right">Balans</th>
                        <th className="text-right">Obuna</th>
                        <th className="text-right">Oxirgi faollik</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(topUsers.data ?? []).map((u: any) => (
                        <tr key={u.user_id} className="border-t border-white/5">
                          <td className="py-2">{u.profile?.full_name || <span className="font-mono text-xs text-white/50">{u.user_id.slice(0, 8)}</span>}</td>
                          <td className="text-white/60">{u.profile?.phone || "—"}</td>
                          <td className="text-right">{u.requests}</td>
                          <td className="text-right">{u.credits}</td>
                          <td className="text-right">{u.credits?.balance ?? 0}</td>
                          <td className="text-right">
                            {u.sub?.status === "active" ? <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">{u.sub.tier}</Badge> : <span className="text-white/40 text-xs">yo'q</span>}
                          </td>
                          <td className="text-right text-xs text-white/60">{new Date(u.last).toLocaleString()}</td>
                        </tr>
                      ))}
                      {(topUsers.data ?? []).length === 0 && (
                        <tr><td colSpan={7} className="text-center py-6 text-white/40">Foydalanuvchilar yo'q</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <KpiCard icon={CreditCard} label="Lite" value={s?.lite ?? "—"} />
              <KpiCard icon={CreditCard} label="Standard" value={s?.standard ?? "—"} />
              <KpiCard icon={CreditCard} label="Premium" value={s?.premium ?? "—"} />
              <KpiCard icon={Users} label="Obunasiz" value={s?.none ?? "—"} />
              <KpiCard icon={AlertCircle} label="7 kun ichida tugaydigan" value={s?.expiring ?? "—"} />
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-white/40 text-center pt-4">
          RevShare hisobi: 1 Med Coin ≈ {MED_COIN_TO_UZS} so'm × {HAMBI_REVSHARE * 100}% ulush. Yakuniy summa shartnoma bo'yicha tasdiqlanadi.
        </p>
      </div>
    </div>
  );
};

export default HambiDashboardPage;
