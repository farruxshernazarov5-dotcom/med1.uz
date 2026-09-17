import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, Wallet, RefreshCw, AlertTriangle, Ban, Search, Receipt, TrendingUp,
} from "lucide-react";

type PaymentRow = {
  id: string;
  user_id: string | null;
  amount: number;
  currency: string | null;
  status: string;
  purpose: string | null;
  reference_id: string | null;
  provider_transaction_id: string | null;
  metadata: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  is_test: boolean | null;
};

type TxRow = { id: string; payment_id: string; state: number; reason: number | null; amount: number };

type Stats = {
  total: number; paid: number; pending: number; cancelled: number; revenue: number; refunded: number;
};

const STATUS_FILTERS = [
  { value: "all", label: "Barchasi" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "paid", label: "To'langan" },
  { value: "completed", label: "Yetkazilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
  { value: "refunded", label: "Qaytarilgan" },
];

const statusBadge = (s: string) => {
  if (s === "completed") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Yetkazildi</Badge>;
  if (s === "paid") return <Badge className="bg-sky-600 hover:bg-sky-600">To'langan</Badge>;
  if (s === "pending") return <Badge variant="secondary">Kutilmoqda</Badge>;
  if (s === "refunded") return <Badge className="bg-amber-600 hover:bg-amber-600">Qaytarilgan</Badge>;
  if (s === "cancelled" || s === "canceled") return <Badge variant="destructive">Bekor qilingan</Badge>;
  return <Badge variant="outline">{s}</Badge>;
};

const money = (n: number) => `${Number(n || 0).toLocaleString("uz-UZ")} so'm`;
const dt = (s: string | null) => (s ? new Date(s).toLocaleString("uz-UZ") : "—");

export default function PaymeCashierPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState<PaymentRow | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    document.title = "Payme kassa · MED1.UZ";
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAllowed(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setAllowed(Boolean(data));
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("payme-cashier", {
        body: { action: "list", status, search, limit: 150 },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setPayments(data.payments ?? []);
      setTxs(data.transactions ?? []);
      setStats(data.stats ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ma'lumotlarni olishda xatolik");
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  const txByPayment = useMemo(() => {
    const m = new Map<string, TxRow>();
    txs.forEach((t) => m.set(t.payment_id, t));
    return m;
  }, [txs]);

  const doCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const wasPaid = ["paid", "completed"].includes(cancelTarget.status);
      const { data, error } = await supabase.functions.invoke("payme-cashier", {
        body: { action: "cancel", payment_id: cancelTarget.id, note: cancelNote, reason: 5 },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // To'lov qaytarilganda berilgan Med Coin va obuna ham bekor qilinadi
      let reversed = 0;
      if (wasPaid) {
        const { data: rf } = await supabase.functions.invoke("medcoin-admin", {
          body: { action: "refund", payment_id: cancelTarget.id, reason: cancelNote || "Kassada qaytarildi" },
        });
        reversed = Number(rf?.result?.coins_reversed || 0);
      }

      toast.success(data?.remote?.attempted && !data?.remote?.ok
        ? "To'lov bazada bekor qilindi, Payme tomonida tasdiqlanmadi"
        : reversed > 0
          ? `To'lov qaytarildi · ${reversed} Med Coin hisobdan yechildi`
          : "To'lov bekor qilindi");
      setCancelTarget(null);
      setCancelNote("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bekor qilishda xatolik");
    } finally {
      setCancelling(false);
    }
  };

  if (allowed === null) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!allowed) {
    return (
      <main className="container mx-auto p-8">
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="text-xl font-semibold">Kassaga kirish yopiq</h1>
            <p className="text-muted-foreground">Bu bo'lim faqat vakolatli xodimlar uchun.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Wallet className="h-6 w-6" /> Payme kassa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Payme orqali qilingan barcha to'lovlar, holati va bekor qilish amallari.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Yangilash
        </Button>
      </header>

      {stats && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Jami to'lovlar</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">To'langan</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Kutilmoqda / Bekor</p>
            <p className="text-2xl font-bold">{stats.pending} / {stats.cancelled}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="h-3 w-3" /> Tushum</p>
            <p className="text-xl font-bold">{money(stats.revenue)}</p>
            <p className="text-xs text-muted-foreground">Qaytarilgan: {money(stats.refunded)}</p>
          </CardContent></Card>
        </section>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" /> To'lovlar ro'yxati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="To'lov ID, foydalanuvchi ID yoki maqsad"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(); }}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={status === f.value ? "default" : "outline"}
                  onClick={() => setStatus(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : payments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">To'lovlar topilmadi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Sana</th>
                    <th className="py-2 pr-3">To'lov ID</th>
                    <th className="py-2 pr-3">Maqsad</th>
                    <th className="py-2 pr-3">Summa</th>
                    <th className="py-2 pr-3">Holat</th>
                    <th className="py-2 pr-3">Payme tranzaksiya</th>
                    <th className="py-2 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const tx = txByPayment.get(p.id);
                    const canCancel = !["cancelled", "canceled", "refunded"].includes(p.status);
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap">{dt(p.created_at)}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{p.id.slice(0, 8)}…</td>
                        <td className="py-2 pr-3">{p.purpose || "—"}</td>
                        <td className="py-2 pr-3 whitespace-nowrap font-medium">{money(p.amount)}</td>
                        <td className="py-2 pr-3">{statusBadge(p.status)}</td>
                        <td className="py-2 pr-3 font-mono text-xs">
                          {tx ? `${tx.id.slice(0, 10)}… (state ${tx.state})` : "—"}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canCancel}
                            onClick={() => { setCancelTarget(p); setCancelNote(""); }}
                          >
                            <Ban className="mr-1 h-3.5 w-3.5" /> Bekor qilish
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To'lovni bekor qilish</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>
                  {money(cancelTarget.amount)} · {cancelTarget.purpose || "—"} · holat: {cancelTarget.status}
                  <br />
                  To'langan to'lov bekor qilinsa, u "qaytarilgan" holatiga o'tadi.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Bekor qilish sababi (ixtiyoriy)"
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>Yopish</Button>
            <Button variant="destructive" onClick={doCancel} disabled={cancelling}>
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
