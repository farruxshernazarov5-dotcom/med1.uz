import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Activity, AlertTriangle, CheckCircle2, Copy, CreditCard, Loader2, PlayCircle,
  RefreshCw, Settings2, TrendingUp, Users, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PREPARE_URL = `${PROJECT_URL}/functions/v1/click-prepare`;
const COMPLETE_URL = `${PROJECT_URL}/functions/v1/click-complete`;

const money = (n: number) => `${Number(n || 0).toLocaleString("uz-UZ")} so'm`;
const dt = (s?: string | null) => (s ? new Date(s).toLocaleString("uz-UZ") : "—");

interface TestResult {
  id: string; name: string; status: "PASS" | "FAILED" | "SKIPPED"; detail: string;
}

const CopyRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium">{label}</p>
    <div className="flex gap-2">
      <Input readOnly value={value} className="font-mono text-xs" />
      <Button
        variant="outline" size="icon"
        onClick={() => { navigator.clipboard.writeText(value); toast({ title: "Nusxalandi" }); }}
      >
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

const PaymentsAdminPage = () => {
  const { userRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, r, pk] = await Promise.all([
      supabase.from("platform_payments").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("payment_refunds").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("payment_packages").select("*").order("sort_order"),
    ]);
    setPayments(p.data ?? []);
    setRefunds(r.data ?? []);
    setPackages(pk.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("admin-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_payments" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  const stats = useMemo(() => {
    const done = payments.filter((p) => ["completed", "paid"].includes(p.status));
    const revenue = done.reduce((s, p) => s + Number(p.amount || 0), 0);
    const failed = payments.filter((p) => ["failed", "cancelled"].includes(p.status)).length;
    const success = payments.length ? Math.round((done.length / payments.length) * 100) : 0;
    const users = new Set(done.map((p) => p.user_id)).size;
    const avg = done.length ? revenue / done.length : 0;

    const byDay = new Map<string, { day: string; revenue: number; count: number }>();
    done.forEach((p) => {
      const day = new Date(p.paid_at || p.created_at).toISOString().slice(0, 10);
      const row = byDay.get(day) ?? { day, revenue: 0, count: 0 };
      row.revenue += Number(p.amount || 0);
      row.count += 1;
      byDay.set(day, row);
    });
    const daily = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-30);

    const byPkg = new Map<string, { name: string; count: number; revenue: number }>();
    done.forEach((p) => {
      const key = p.reference_id || p.purpose || "boshqa";
      const row = byPkg.get(key) ?? { name: key, count: 0, revenue: 0 };
      row.count += 1;
      row.revenue += Number(p.amount || 0);
      byPkg.set(key, row);
    });

    return {
      revenue, failed, success, users, avg, total: payments.length,
      daily, byPkg: [...byPkg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      pending: payments.filter((p) => ["pending", "prepared", "created"].includes(p.status)).length,
    };
  }, [payments]);

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("click-test", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTestResults(data.results ?? []);
      toast({
        title: data.ok ? "Barcha testlar muvaffaqiyatli" : "Ba'zi testlar muvaffaqiyatsiz",
        variant: data.ok ? "default" : "destructive",
      });
      void load();
    } catch (e: any) {
      toast({ title: "Test xatoligi", description: e?.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const refund = async (payment: any) => {
    const reason = window.prompt("Refund sababi:", "Admin tomonidan qaytarildi");
    if (!reason) return;
    setRefundingId(payment.id);
    try {
      const { data, error } = await supabase.rpc("click_refund_payment", {
        p_payment_id: payment.id,
        p_reason: reason,
      });
      if (error) throw error;
      toast({ title: "Refund bajarildi", description: JSON.stringify(data) });
      void load();
    } catch (e: any) {
      toast({ title: "Refund xatoligi", description: e?.message, variant: "destructive" });
    } finally {
      setRefundingId(null);
    }
  };

  if (authLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;
  if (userRole !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Helmet>
        <title>To'lovlar boshqaruvi — Med1.uz Super Admin</title>
        <meta name="description" content="Click to'lov tizimi analitikasi, sozlamalari, test paneli va refund boshqaruvi." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> To'lovlar boshqaruv markazi
          </h1>
          <p className="text-sm text-muted-foreground">Click integratsiyasi: analitika, sozlama, test va refund</p>
        </div>
        <Button variant="outline" onClick={() => void load()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Yangilash
        </Button>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="analytics" className="gap-1"><TrendingUp className="w-4 h-4" />Analitika</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1"><Activity className="w-4 h-4" />Tranzaksiyalar</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1"><Settings2 className="w-4 h-4" />Click sozlamalari</TabsTrigger>
          <TabsTrigger value="test" className="gap-1"><PlayCircle className="w-4 h-4" />Test paneli</TabsTrigger>
          <TabsTrigger value="refunds" className="gap-1"><XCircle className="w-4 h-4" />Refundlar</TabsTrigger>
        </TabsList>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {loading ? <Skeleton className="h-40 rounded-xl" /> : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Umumiy tushum", value: money(stats.revenue), icon: TrendingUp },
                  { label: "Muvaffaqiyat darajasi", value: `${stats.success}%`, icon: CheckCircle2 },
                  { label: "To'lovchi foydalanuvchilar", value: stats.users, icon: Users },
                  { label: "O'rtacha chek", value: money(stats.avg), icon: CreditCard },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <s.icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="mt-2 text-xl font-bold">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Kunlik tushum (30 kun)</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.daily}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip formatter={(v: any) => money(Number(v))} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="Tushum" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Eng ko'p sotilgan paketlar</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.byPkg}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip formatter={(v: any) => money(Number(v))} />
                        <Bar dataKey="revenue" name="Tushum" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Kutilayotgan</p><p className="text-xl font-bold">{stats.pending}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Muvaffaqiyatsiz</p><p className="text-xl font-bold">{stats.failed}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Jami tranzaksiya</p><p className="text-xl font-bold">{stats.total}</p></CardContent></Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* TRANSACTIONS */}
        <TabsContent value="transactions" className="mt-4 space-y-2">
          {payments.slice(0, 100).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="font-medium">{money(p.amount)} · {p.reference_id || p.purpose}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{p.id} · {dt(p.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.is_test && <Badge variant="outline">TEST</Badge>}
                <Badge variant={["completed", "paid"].includes(p.status) ? "default" : p.status === "failed" ? "destructive" : "secondary"}>
                  {p.status}
                </Badge>
                {["completed", "paid"].includes(p.status) && (
                  <Button size="sm" variant="outline" disabled={refundingId === p.id} onClick={() => refund(p)}>
                    {refundingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refund"}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!loading && payments.length === 0 && <p className="text-sm text-muted-foreground">Tranzaksiyalar yo'q</p>}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Click kabinetiga kiritiladigan URL manzillar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <CopyRow label="Prepare URL (to'lovni yaratish)" value={PREPARE_URL} />
              <CopyRow label="Complete URL (to'lovni tasdiqlash)" value={COMPLETE_URL} />
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                Click merchant kabinetida <b>Biznesni tahrirlash → Kassani tahrirlash</b> bo'limiga kiring va yuqoridagi
                ikkita URL ni mos maydonlarga joylashtiring. So'ngra Maxfiy kalit (MK) ni Med1 secretlariga saqlang.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Faol paketlar</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {packages.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{p.name_uz}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.code} · {p.kind}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{money(p.price)}</span>
                    <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "faol" : "o'chiq"}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEST */}
        <TabsContent value="test" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Click integratsiya testi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test real imzo bilan prepare/complete endpointlariga so'rov yuboradi va natijani tekshiradi.
                Yaratilgan to'lovlar <b>TEST</b> deb belgilanadi.
              </p>
              <Button onClick={runTests} disabled={testing} className="gap-2">
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Testlarni ishga tushirish
              </Button>

              <div className="space-y-2">
                {testResults.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {r.status === "PASS" ? <CheckCircle2 className="w-4 h-4 text-primary" />
                          : r.status === "FAILED" ? <XCircle className="w-4 h-4 text-destructive" />
                          : <AlertTriangle className="w-4 h-4 text-muted-foreground" />}
                        {r.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{r.detail}</p>
                    </div>
                    <Badge variant={r.status === "PASS" ? "default" : r.status === "FAILED" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REFUNDS */}
        <TabsContent value="refunds" className="mt-4 space-y-2">
          {refunds.length === 0 && <p className="text-sm text-muted-foreground">Refundlar yo'q</p>}
          {refunds.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <p className="font-medium">{money(r.amount)}</p>
                <p className="text-xs text-muted-foreground">{r.reason} · {dt(r.created_at)}</p>
              </div>
              <Badge variant="outline">{r.status}</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsAdminPage;
