import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, Wallet, RefreshCw, ShieldCheck, AlertTriangle, CheckCircle2,
  ExternalLink, Copy, PlayCircle,
} from "lucide-react";

type Env = "production" | "sandbox";

interface Check { name: string; ok: boolean; status?: number; detail: string }

const PAYME_METHODS = [
  "CheckPerformTransaction", "CreateTransaction", "PerformTransaction",
  "CancelTransaction", "CheckTransaction", "GetStatement",
];

export default function PaymeAdminPanel() {
  const [env, setEnv] = useState<Env>("production");
  const [config, setConfig] = useState<any>(null);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState<string | null>(null);
  const [rpcResult, setRpcResult] = useState<any>(null);

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data: res, error } = await supabase.functions.invoke("payme-admin-diag", {
      body: { action, environment: env, ...extra },
    });
    if (error) throw new Error(error.message);
    if (res?.error) throw new Error(res.error);
    return res;
  }, [env]);

  const loadConfig = useCallback(async () => {
    setBusy("config");
    try {
      const [cfg, logs] = await Promise.all([call("config"), call("logs")]);
      setConfig(cfg);
      setData(logs);
    } catch (e: any) {
      toast.error(e?.message || "Payme konfiguratsiyasini olishda xatolik");
    } finally {
      setBusy(null);
    }
  }, [call]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const runHealthcheck = async () => {
    setBusy("health");
    try {
      const res = await call("healthcheck");
      setChecks(res.checks);
      res.ok ? toast.success("Payme endpointlari to'g'ri ishlayapti")
             : toast.warning(`${res.errors} ta muammo aniqlandi`);
    } catch (e: any) {
      toast.error(e?.message || "Tekshiruv bajarilmadi");
    } finally { setBusy(null); }
  };

  const createTestOrder = async () => {
    setBusy("order");
    try {
      const res = await call("test_order", { amount: Number(amount) });
      setRpcResult(res);
      toast.success(`Test buyurtma yaratildi: ${res.payment_id}`);
      await loadConfig();
    } catch (e: any) {
      toast.error(e?.message || "Buyurtma yaratilmadi");
    } finally { setBusy(null); }
  };

  const runRpc = async (method: string) => {
    setBusy(method);
    try {
      const pid = rpcResult?.payment_id || data?.payments?.[0]?.id;
      const amt = Math.round(Number(rpcResult?.amount || data?.payments?.[0]?.amount || amount) * 100);
      const params: Record<string, unknown> =
        method === "GetStatement"
          ? { from: Date.now() - 86400000, to: Date.now() }
          : method === "CheckPerformTransaction"
            ? { amount: amt, account: { order_id: pid } }
            : method === "CreateTransaction"
              ? { id: `test-${Date.now()}`, time: Date.now(), amount: amt, account: { order_id: pid } }
              : { id: `test-${Date.now()}` };
      const res = await call("rpc", { method, params });
      setRpcResult({ ...res, payment_id: pid });
    } catch (e: any) {
      toast.error(e?.message || "RPC xatolik");
    } finally { setBusy(null); }
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Nusxalandi"); };

  const cfg = config?.config;
  const eps = config?.endpoints;
  const stats = data?.stats;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="w-4 h-4 text-[#33CCCC]" /> Payme (Paycom) boshqaruvi
            <Badge variant={env === "production" ? "default" : "secondary"} className="uppercase">{env}</Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="sm" variant={env === "sandbox" ? "default" : "outline"} onClick={() => setEnv("sandbox")}>Sandbox</Button>
            <Button size="sm" variant={env === "production" ? "default" : "outline"} onClick={() => setEnv("production")}>Production</Button>
            <Button size="icon" variant="ghost" onClick={loadConfig} disabled={busy === "config"}>
              {busy === "config" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {cfg && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Merchant ID</p><p className="font-mono">{cfg.merchant_id_masked || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Secret Key</p><p className="font-mono">{cfg.secret_key_masked || "—"} <span className="text-xs text-muted-foreground">({cfg.secret_key_length} belgi)</span></p></div>
                <div><p className="text-xs text-muted-foreground">Login</p><p className="font-mono">{cfg.login}</p></div>
                <div><p className="text-xs text-muted-foreground">Account parametri</p><p className="font-mono">{cfg.account_param}</p></div>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
                {[
                  { l: "Endpoint (Payme kabinetiga)", v: eps?.endpoint },
                  { l: "Zaxira endpoint", v: eps?.fallback_endpoint },
                  { l: "Checkout host", v: eps?.checkout_host },
                  { l: "Return URL", v: eps?.return_url },
                ].map((r) => (
                  <div key={r.l} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">{r.l}</span>
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-xs truncate">{r.v}</span>
                      {r.v && <button onClick={() => copy(r.v)} className="text-primary shrink-0"><Copy className="w-3 h-3" /></button>}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Whitelist IP: <span className="font-mono">{config?.proxy?.static_ip}</span> · {config?.proxy?.network} · Valyuta: {cfg.currency}
                </p>
              </div>
              {config?.issues?.length > 0 && (
                <div className="space-y-1">
                  {config.issues.map((i: any, n: number) => (
                    <p key={n} className={`text-xs flex items-center gap-1 ${i.level === "error" ? "text-destructive" : "text-amber-600"}`}>
                      <AlertTriangle className="w-3 h-3" /> {i.message}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Jami tranzaksiya", v: stats.total },
            { l: "To'langan", v: stats.paid },
            { l: "Kutilmoqda", v: stats.pending },
            { l: "Tushum", v: `${Number(stats.revenue).toLocaleString("uz-UZ")} so'm` },
          ].map((s) => (
            <Card key={s.l}><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.l}</p>
              <p className="text-lg font-bold">{s.v}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="w-4 h-4" /> Endpoint va 6 metod tekshiruvi</CardTitle>
          <Button size="sm" onClick={runHealthcheck} disabled={busy === "health"}>
            {busy === "health" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />} Tekshirish
          </Button>
        </CardHeader>
        <CardContent>
          {!checks ? <p className="text-sm text-muted-foreground">Tekshiruv hali bajarilmadi.</p> : (
            <div className="space-y-1">
              {checks.map((c) => (
                <div key={c.name} className="flex items-start gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />}
                  <span className="font-mono text-xs w-56 shrink-0">{c.name}</span>
                  <span className={`text-xs ${c.ok ? "text-muted-foreground" : "text-destructive"}`}>{c.detail}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">To'lov testi (Payme)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Summa (so'm)</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" />
            </div>
            <Button onClick={createTestOrder} disabled={busy === "order"}>
              {busy === "order" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <PlayCircle className="w-4 h-4 mr-1" />} Test buyurtma
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {PAYME_METHODS.map((m) => (
              <Button key={m} size="sm" variant="outline" onClick={() => runRpc(m)} disabled={busy === m}>
                {busy === m && <Loader2 className="w-3 h-3 animate-spin mr-1" />}{m}
              </Button>
            ))}
          </div>
          {rpcResult && (
            <div className="space-y-2">
              {rpcResult.checkout_url && (
                <a href={rpcResult.checkout_url} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1 text-sm text-primary underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Payme checkout'ni ochish
                </a>
              )}
              <pre className="text-[11px] bg-muted rounded-lg p-3 overflow-auto max-h-64">{JSON.stringify(rpcResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payme tranzaksiyalari</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {!data?.payments?.length ? <p className="text-sm text-muted-foreground">Tranzaksiyalar yo'q.</p> : (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground">
                <th className="py-1">Vaqt</th><th>Order ID</th><th>Summa</th><th>Maqsad</th><th>Status</th>
              </tr></thead>
              <tbody>
                {data.payments.map((p: any) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-1">{new Date(p.created_at).toLocaleString("uz-UZ")}</td>
                    <td className="font-mono">{String(p.id).slice(0, 8)}…</td>
                    <td>{Number(p.amount).toLocaleString("uz-UZ")}</td>
                    <td>{p.purpose}</td>
                    <td><Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Webhook loglari</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {!data?.logs?.length ? <p className="text-sm text-muted-foreground">Loglar yo'q.</p> : (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground">
                <th className="py-1">Vaqt</th><th>Metod</th><th>Tranzaksiya</th><th>Natija</th>
              </tr></thead>
              <tbody>
                {data.logs.map((l: any) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="py-1">{new Date(l.created_at).toLocaleString("uz-UZ")}</td>
                    <td className="font-mono">{l.method}</td>
                    <td className="font-mono">{l.payme_transaction_id ? String(l.payme_transaction_id).slice(0, 10) + "…" : "—"}</td>
                    <td>{l.status === "ok" ? <span className="text-green-600">OK</span> : <span className="text-destructive">{l.status}{l.error_note ? ` · ${l.error_note}` : ""}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
