import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CreditCard, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";

type Provider = "click" | "payme" | "uzum";

interface ProviderCfg {
  id: Provider;
  name: string;
  invoiceFn: string;
  webhookFn: string;
  live: boolean;
  sandbox: boolean;
}

const PROVIDERS: Omit<ProviderCfg, "live" | "sandbox">[] = [
  { id: "click", name: "Click", invoiceFn: "click-create-invoice", webhookFn: "click-webhook" },
  { id: "payme", name: "Payme (Paycom)", invoiceFn: "payme-create-invoice", webhookFn: "payme-webhook" },
  { id: "uzum", name: "Uzum Bank", invoiceFn: "uzum-create-invoice", webhookFn: "uzum-webhook" },
];

export default function PaymentSandboxPage() {
  const [envMode, setEnvMode] = useState<"sandbox" | "live">("sandbox");
  const [amount, setAmount] = useState("5000");
  const [loading, setLoading] = useState<Provider | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [providers, setProviders] = useState<ProviderCfg[]>(
    PROVIDERS.map((p) => ({ ...p, live: false, sandbox: false })),
  );
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = "Payment Sandbox · MED1.UZ Admin";
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(Boolean(data));
    })();
  }, []);

  const createInvoice = async (provider: Provider) => {
    setLoading(provider);
    setLastResult(null);
    try {
      const fnName = PROVIDERS.find((p) => p.id === provider)!.invoiceFn;
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          amount: Number(amount),
          purpose: "sandbox_test",
          environment: envMode,
          return_url: `${window.location.origin}/payment/success`,
        },
      });
      if (error) throw error;
      setLastResult({ provider, ...data });
      toast.success(`${provider.toUpperCase()} invoice yaratildi (${envMode})`);
    } catch (e: any) {
      toast.error(e?.message || "Invoice yaratib bo'lmadi");
      setLastResult({ provider, error: String(e?.message || e) });
    } finally {
      setLoading(null);
    }
  };

  if (isAdmin === null) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="text-xl font-semibold">Faqat adminlar uchun</h2>
            <p className="text-muted-foreground">Bu sahifa yopiq. Admin roli talab qilinadi.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" /> Payment Sandbox
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Click / Payme / Uzum Bank uchun sinov muhitida invoice yarating va checkout URL'ni tekshiring.
          </p>
        </div>
        <div className="flex items-center gap-3 border rounded-lg p-3 bg-card">
          <Label htmlFor="env-mode" className="text-sm">Sandbox</Label>
          <Switch
            id="env-mode"
            checked={envMode === "live"}
            onCheckedChange={(v) => setEnvMode(v ? "live" : "sandbox")}
          />
          <Label htmlFor="env-mode" className="text-sm">Live</Label>
          <Badge variant={envMode === "live" ? "destructive" : "secondary"}>
            {envMode.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Test invoice parametrlari</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="amount">Summa (so'm)</Label>
            <Input id="amount" type="number" min={1000} max={100000000} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <p className="text-xs text-muted-foreground">
              {envMode === "sandbox"
                ? "Sandbox rejimi: hech qanday real to'lov o'tkazilmaydi. Provider test hostiga yuboriladi."
                : "Live rejimi: real merchant hisobiga yo'naltiradi. Faqat konfiguratsiyani tekshirish uchun kichik summa ishlating."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <Badge variant="outline" className="text-xs">{p.id}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Invoice fn: <code className="text-foreground">{p.invoiceFn}</code></div>
                <div>Webhook fn: <code className="text-foreground">{p.webhookFn}</code></div>
              </div>
              <Button
                className="w-full"
                onClick={() => createInvoice(p.id)}
                disabled={loading !== null}
              >
                {loading === p.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                {envMode === "sandbox" ? "Sandbox invoice" : "Live invoice"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {lastResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Oxirgi natija — {lastResult.provider?.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastResult.checkout_url ? (
              <a href={lastResult.checkout_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline text-sm break-all">
                <ExternalLink className="h-4 w-4" /> {lastResult.checkout_url}
              </a>
            ) : null}
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-72">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Webhook URL'lar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {PROVIDERS.map((p) => {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${p.webhookFn}`;
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{p.name}</Badge>
                <code className="text-[11px] break-all">{url}</code>
              </div>
            );
          })}
          <p className="text-muted-foreground pt-2">
            Bu URL'larni tegishli provider merchant panelida callback sifatida ro'yxatdan o'tkazing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
