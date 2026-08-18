import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, CreditCard, Crown, Download, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { downloadPaymentReceipt } from "@/utils/downloadPaymentReceipt";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  paid: "default",
  pending: "secondary",
  prepared: "secondary",
  created: "secondary",
  failed: "destructive",
  cancelled: "destructive",
  refunded: "outline",
};

const money = (n: number, c = "UZS") => `${Number(n).toLocaleString("uz-UZ")} ${c === "UZS" ? "so'm" : c}`;
const date = (s?: string | null) => (s ? new Date(s).toLocaleString("uz-UZ") : "—");

const PaymentHistory = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [p, l, i, s] = await Promise.all([
      supabase.from("platform_payments").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("med_coin_ledger").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("payment_invoices").select("*").eq("user_id", user.id)
        .order("issued_at", { ascending: false }).limit(100),
      supabase.from("ai_subscriptions").select("*").eq("user_id", user.id)
        .order("started_at", { ascending: false }).limit(50),
    ]);
    setPayments(p.data ?? []);
    setLedger(l.data ?? []);
    setInvoices(i.data ?? []);
    setSubs(s.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const downloadInvoice = async (inv: any) => {
    try {
      await downloadPaymentReceipt({
        paymentId: inv.payment_id,
        amount: Number(inv.amount),
        currency: inv.currency,
        purpose: inv.package_code || "payment",
        purposeLabel: inv.product_name,
        provider: inv.provider,
        referenceId: inv.invoice_number,
        paidAt: new Date(inv.issued_at),
        payerName: profile?.full_name || user?.email || undefined,
        payerEmail: user?.email || undefined,
        serviceName: inv.product_name,
        format: "a4",
      });
      toast({ title: t("payments.invoiceDownloaded", "Invoice yuklandi") });
    } catch (e: any) {
      toast({ title: "PDF xatolik", description: e?.message, variant: "destructive" });
    }
  };

  if (loading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" /> {t("payments.historyTitle", "To'lovlar va Med Coin")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="payments">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="payments" className="gap-1"><CreditCard className="w-4 h-4" />{t("payments.tabPayments", "To'lovlar")}</TabsTrigger>
            <TabsTrigger value="coins" className="gap-1"><Coins className="w-4 h-4" />Med Coin</TabsTrigger>
            <TabsTrigger value="subs" className="gap-1"><Crown className="w-4 h-4" />{t("payments.tabSubs", "Obunalar")}</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1"><Receipt className="w-4 h-4" />Invoice</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4 space-y-2">
            {payments.length === 0 && <p className="text-sm text-muted-foreground">{t("payments.empty", "Hozircha to'lovlar yo'q")}</p>}
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{money(p.amount, p.currency)}</p>
                  <p className="text-xs text-muted-foreground">{p.provider} · {date(p.created_at)}</p>
                </div>
                <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>{p.status}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="coins" className="mt-4 space-y-2">
            {ledger.length === 0 && <p className="text-sm text-muted-foreground">{t("payments.emptyCoins", "Med Coin harakatlari yo'q")}</p>}
            {ledger.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{l.amount > 0 ? "+" : ""}{l.amount} Med Coin</p>
                  <p className="text-xs text-muted-foreground">{l.description || l.type} · {date(l.created_at)}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <Badge variant="outline">{l.type}</Badge>
                  <p className="mt-1">{l.balance_before} → {l.balance_after}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="subs" className="mt-4 space-y-2">
            {subs.length === 0 && <p className="text-sm text-muted-foreground">{t("payments.emptySubs", "Obunalar yo'q")}</p>}
            {subs.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium uppercase">{s.tier}</p>
                  <p className="text-xs text-muted-foreground">{date(s.started_at)} → {date(s.expires_at)}</p>
                </div>
                <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="invoices" className="mt-4 space-y-2">
            {invoices.length === 0 && <p className="text-sm text-muted-foreground">{t("payments.emptyInvoices", "Invoice yo'q")}</p>}
            {invoices.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.product_name} · {money(inv.amount, inv.currency)} · {date(inv.issued_at)}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => downloadInvoice(inv)}>
                  <Download className="w-4 h-4" /> PDF
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;
