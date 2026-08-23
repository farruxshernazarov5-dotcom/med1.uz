import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2, RefreshCw, ExternalLink, ShieldCheck, AlertTriangle, Receipt, PlayCircle, Copy,
} from "lucide-react";

interface Issue { level: "error" | "warn"; message: string }
interface ConfigResp {
  config: {
    service_id: string | null;
    merchant_id: string | null;
    merchant_user_id: string | null;
    secret_key_masked: string;
    secret_key_length: number;
  };
  issues: Issue[];
  endpoints: Record<string, string>;
}

const call = async (fn: string, body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw new Error((data as { error?: string })?.error || error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as Record<string, unknown>;
};

const ClickTestPanel = () => {
  const [cfg, setCfg] = useState<ConfigResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [amount, setAmount] = useState("1000");
  const [lastPaymentId, setLastPaymentId] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [fiscal, setFiscal] = useState<Record<string, unknown>[]>([]);
  const [itemName, setItemName] = useState("MED1.UZ AI xizmati");
  const [spic, setSpic] = useState("10305001001000000");
  const [packageCode, setPackageCode] = useState("1512216");
  const [vat, setVat] = useState("12");
  const [result, setResult] = useState<unknown>(null);
  const [environment, setEnvironment] = useState<"sandbox" | "production">("production");
  const [health, setHealth] = useState<{ ok: boolean; errors: number; checks: HealthCheck[] } | null>(null);
  const [callbackTest, setCallbackTest] = useState<unknown>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      setCfg((await call("click-admin-diag", { action: "config", environment })) as unknown as ConfigResp);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [environment]);

  const loadLogs = useCallback(async () => {
    try {
      const d = await call("click-admin-diag", { action: "logs" });
      setLogs((d.logs as Record<string, unknown>[]) ?? []);
      setPayments((d.payments as Record<string, unknown>[]) ?? []);
      setFiscal((d.fiscal as Record<string, unknown>[]) ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => { loadConfig(); loadLogs(); }, [loadConfig, loadLogs]);


  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  const createCheckout = () => run("checkout", async () => {
    const d = await call("click-admin-diag", { action: "checkout", amount: Number(amount) });
    setLastPaymentId(String(d.payment_id));
    setCheckoutUrl(String(d.checkout_url));
    setResult(d);
    toast.success("Test to'lov yaratildi");
    loadLogs();
  });

  const simulate = () => run("simulate", async () => {
    const d = await call("click-admin-diag", { action: "simulate", payment_id: lastPaymentId });
    setResult(d);
    toast.success("Callback simulyatsiyasi bajarildi");
    loadLogs();
  });

  const sendFiscal = (mode: "test" | "live") => run(`fiscal-${mode}`, async () => {
    const d = await call("click-fiscal", {
      action: "send",
      mode,
      payment_id: lastPaymentId || null,
      click_trans_id: (payments.find((p) => p.id === lastPaymentId)?.provider_transaction_id as string) || null,
      items: [{ Name: itemName, SPIC: spic, PackageCode: packageCode, Price: Number(amount), Units: 1, VATPercent: Number(vat) }],
    });
    setResult(d);
    toast.success(mode === "test" ? "Test chipta tuzildi" : "Chipta Click'ga yuborildi");
    loadLogs();
  });

  const errors = cfg?.issues.filter((i) => i.level === "error") ?? [];
  const warns = cfg?.issues.filter((i) => i.level === "warn") ?? [];

  const activationText = [
    "Assalomu alaykum, Click qo'llab-quvvatlash xizmati!",
    "",
    "MED1.UZ xizmatini production rejimida faollashtirishingizni so'raymiz.",
    "",
    "1) Tashkilot va xizmat",
    "   Tashkilot: MED-ALL AI SYSTEM MCHJ",
    "   Xizmat nomi: MED1.UZ",
    `   Service ID: ${cfg?.config.service_id ?? "—"}`,
    `   Merchant ID: ${cfg?.config.merchant_id ?? "—"}`,
    `   Merchant User ID: ${cfg?.config.merchant_user_id ?? "—"}`,
    "",
    "2) Domenlar",
    "   https://med1.uz",
    "   https://www.med1.uz",
    "",
    "3) Callback URL'lar (metod: POST, protokol: HTTPS, port: 443)",
    `   Prepare (action=0): ${cfg?.endpoints?.prepare_url ?? "—"}`,
    `   Complete (action=1): ${cfg?.endpoints?.complete_url ?? "—"}`,
    `   Return URL: ${cfg?.endpoints?.return_url ?? "https://med1.uz/payment/success"}`,
    "",
    "4) Server / tarmoq ma'lumotlari",
    "   Billing backend: Lovable Cloud (EU Central) edge infratuzilmasi",
    "   Server TAS-IX tarmog'ida EMAS.",
    "   Kafolatlangan statik outbound IP mavjud emas — iltimos, whitelist'ni",
    "   domen (med1.uz, www.med1.uz) bo'yicha amalga oshiring yoki domen orqali",
    "   whitelist qilish imkoniyatini tasdiqlang.",
    "",
    "5) Iltimos, tekshirib bering",
    "   - Service ID Merchant ID bilan to'g'ri bog'langanmi;",
    "   - Xizmat production/active holatdami;",
    "   - Prepare/Complete URL'lar va domen whitelist'ga qo'shilganmi;",
    "   - Hosted checkout havolasida merchant_user_id parametri talab qilinadimi.",
    "",
    "Hozircha hosted checkout \"Yetkazib beruvchidan ma'lumot yetarli emas\" xatosini qaytarmoqda.",
    "",
    "Hurmat bilan, MED1.UZ texnik jamoasi",
  ].join("\n");


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Click konfiguratsiyasi
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadConfig} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4 text-sm">
            <div><div className="text-muted-foreground text-xs">Service ID</div><code>{cfg?.config.service_id ?? "—"}</code></div>
            <div><div className="text-muted-foreground text-xs">Merchant ID</div><code>{cfg?.config.merchant_id ?? "—"}</code></div>
            <div><div className="text-muted-foreground text-xs">Merchant User ID</div><code>{cfg?.config.merchant_user_id ?? "—"}</code></div>
            <div>
              <div className="text-muted-foreground text-xs">Secret Key</div>
              <code>{cfg?.config.secret_key_masked || "—"}</code>{" "}
              <span className="text-xs text-muted-foreground">({cfg?.config.secret_key_length ?? 0} belgi)</span>
            </div>
          </div>

          {errors.map((i) => (
            <div key={i.message} className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {i.message}
            </div>
          ))}
          {warns.map((i) => (
            <div key={i.message} className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" /> {i.message}
            </div>
          ))}
          {cfg && !cfg.issues.length && (
            <Badge variant="secondary">Konfiguratsiya to'liq</Badge>
          )}

          <Separator />
          <div className="space-y-1 text-xs">
            <div className="text-muted-foreground">Click kabinetiga qo'yiladigan URL'lar:</div>
            {Object.entries(cfg?.endpoints ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-28 text-muted-foreground">{k}</span>
                <code className="truncate">{v}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6"
                  onClick={() => { navigator.clipboard.writeText(v); toast.success("Nusxalandi"); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Copy className="h-4 w-4" /> Click'ga yuboriladigan matn
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"
              onClick={() => { navigator.clipboard.writeText(activationText); toast.success("Matn nusxalandi"); }}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Nusxalash
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:support@click.uz?subject=${encodeURIComponent("MED1.UZ xizmatini faollashtirish")}&body=${encodeURIComponent(activationText)}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> Email
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Quyidagi matn joriy konfiguratsiya asosida avtomatik shakllantiriladi. Secret Key hech qachon
            qo'shilmaydi — uni Click'ga yubormang.
          </p>
          <pre className="text-[11px] leading-relaxed bg-muted p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
            {activationText}
          </pre>
        </CardContent>
      </Card>



      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">To'lov testi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="click-amount">Summa (so'm)</Label>
              <Input id="click-amount" type="number" min={1000} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex items-end gap-2">
              <Button onClick={createCheckout} disabled={busy !== null}>
                {busy === "checkout" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                Test to'lov yaratish
              </Button>
              <Button variant="outline" onClick={simulate} disabled={busy !== null || !lastPaymentId}>
                Callback simulyatsiyasi
              </Button>
            </div>
          </div>
          {checkoutUrl && (
            <div className="text-xs break-all space-y-1">
              <div className="text-muted-foreground">Payment ID: <code>{lastPaymentId}</code></div>
              <a href={checkoutUrl} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> {checkoutUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" /> Fiskalizatsiya (chipta)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div><Label>Nomi</Label><Input value={itemName} onChange={(e) => setItemName(e.target.value)} /></div>
            <div><Label>SPIC (IKPU)</Label><Input value={spic} onChange={(e) => setSpic(e.target.value)} /></div>
            <div><Label>Package Code</Label><Input value={packageCode} onChange={(e) => setPackageCode(e.target.value)} /></div>
            <div><Label>QQS %</Label><Input type="number" value={vat} onChange={(e) => setVat(e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => sendFiscal("test")} disabled={busy !== null}>
              {busy === "fiscal-test" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test chipta tuzish
            </Button>
            <Button onClick={() => sendFiscal("live")} disabled={busy !== null}>
              {busy === "fiscal-live" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Click'ga yuborish (live)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Test rejimi chiptani faqat tuzadi va bazaga yozadi. Live rejimi Click Merchant API'ga yuboradi va
            haqiqiy <code>click_trans_id</code> talab qiladi.
          </p>
        </CardContent>
      </Card>

      {result != null && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Oxirgi natija</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-72 bg-muted p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Callback loglari</CardTitle>
          <Button variant="outline" size="sm" onClick={loadLogs}><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr><th className="text-left p-1">Vaqt</th><th className="text-left p-1">Action</th><th className="text-left p-1">Trans ID</th><th className="text-left p-1">Status</th><th className="text-left p-1">Izoh</th></tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={String(l.id)} className="border-t">
                    <td className="p-1">{new Date(String(l.created_at)).toLocaleString("uz-UZ")}</td>
                    <td className="p-1">{String(l.action ?? "")}</td>
                    <td className="p-1">{String(l.click_trans_id ?? "")}</td>
                    <td className="p-1"><Badge variant={String(l.status).startsWith("processed") ? "secondary" : "destructive"}>{String(l.status)}</Badge></td>
                    <td className="p-1 max-w-[240px] truncate">{String(l.error_note ?? "")}</td>
                  </tr>
                ))}
                {!logs.length && <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">Hozircha Click callback'lari yo'q</td></tr>}
              </tbody>
            </table>
          </div>

          <Separator />
          <div className="text-xs text-muted-foreground">Oxirgi Click to'lovlari</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {payments.map((p) => (
                  <tr key={String(p.id)} className="border-t">
                    <td className="p-1">{new Date(String(p.created_at)).toLocaleString("uz-UZ")}</td>
                    <td className="p-1">{Number(p.amount).toLocaleString("uz-UZ")} so'm</td>
                    <td className="p-1">{String(p.purpose ?? "")}</td>
                    <td className="p-1"><Badge variant={p.status === "paid" ? "secondary" : "outline"}>{String(p.status)}</Badge></td>
                    <td className="p-1 truncate max-w-[180px]"><code>{String(p.id)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {fiscal.length > 0 && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground">Fiskal chiptalar</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {fiscal.map((f) => (
                      <tr key={String(f.id)} className="border-t">
                        <td className="p-1">{new Date(String(f.created_at)).toLocaleString("uz-UZ")}</td>
                        <td className="p-1">{String(f.mode)}</td>
                        <td className="p-1"><Badge variant={f.status === "failed" ? "destructive" : "secondary"}>{String(f.status)}</Badge></td>
                        <td className="p-1 truncate max-w-[280px]">{String(f.error_note ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClickTestPanel;
