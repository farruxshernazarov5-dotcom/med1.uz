import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw, RotateCcw } from "lucide-react";

const SANDBOX_ORDER_IDS = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
  "10000000-0000-4000-8000-000000000004",
] as const;

interface SandboxOrderRow {
  id: string;
  amount: number;
  status: string;
  provider_transaction_id: string | null;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  paid: "default",
  completed: "default",
  refunded: "outline",
  cancelled: "destructive",
};

export default function UzumSandboxOrdersPanel() {
  const [orders, setOrders] = useState<SandboxOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | "all" | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_payments")
      .select("id, amount, status, provider_transaction_id")
      .in("id", [...SANDBOX_ORDER_IDS])
      .order("id");
    if (error) {
      toast.error(error.message);
    } else {
      setOrders((data ?? []) as SandboxOrderRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleReset = async (orderId?: string) => {
    setResettingId(orderId ?? "all");
    try {
      const { error } = await supabase.rpc(
        "reset_uzum_sandbox_test_orders",
        orderId ? { _order_id: orderId } : {},
      );
      if (error) throw error;
      toast.success(
        orderId
          ? "Test buyurtma pending holatiga qaytarildi"
          : "Barcha 4 ta Uzum test buyurtmasi pending holatiga qaytarildi",
      );
      await loadOrders();
    } catch (e: any) {
      toast.error(e?.message || "Qayta tiklab bo'lmadi");
    } finally {
      setResettingId(null);
    }
  };

  const copyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    toast.success("order_id nusxalandi");
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">Uzum Bank Sandbox test buyurtmalari</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Service ID: 10324 · Confirm yoki reverse bo‘lgan buyurtmalarni bir bosishda pending holatiga qaytaring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadOrders()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Yangilash
          </Button>
          <Button size="sm" onClick={() => void handleReset()} disabled={resettingId !== null}>
            {resettingId === "all" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            )}
            Barchasini pending qilish
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-xs"
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <code className="font-mono text-[11px] break-all">{order.id}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => void copyId(order.id)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-muted-foreground">
                {Number(order.amount).toLocaleString("uz-UZ")} UZS ({(Number(order.amount) * 100).toLocaleString("uz-UZ")} tiyin)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>{order.status}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleReset(order.id)}
                disabled={resettingId !== null}
              >
                {resettingId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Pending"}
              </Button>
            </div>
          </div>
        ))}
        {!loading && orders.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Test buyurtmalari topilmadi — “Barchasini pending qilish” tugmasi ularni qayta yaratadi.
          </p>
        )}
      </CardContent>
    </Card>
  );
}