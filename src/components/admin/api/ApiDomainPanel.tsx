import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Globe, RefreshCw, Copy, ExternalLink, Play } from "lucide-react";

export const API_DOMAIN = "https://api.med1.uz";

type CheckResult = {
  name: string;
  url: string;
  method: string;
  status: number | null;
  ok: boolean;
  expected: string;
  body: string;
  ms: number;
};

const CHECKS: Array<{ name: string; path: string; method: string; expected: string; expectStatuses: number[] }> = [
  { name: "Proxy health", path: "/health", method: "GET", expected: "200 + config markeri", expectStatuses: [200] },
  { name: "Root → hujjatlar", path: "/", method: "GET", expected: "302 → med1.uz/api-docs", expectStatuses: [200, 302, 0] },
  { name: "Gateway ping (kalitsiz)", path: "/v1/ping", method: "GET", expected: "401 missing_api_key", expectStatuses: [401] },
  { name: "Noma'lum endpoint", path: "/v1/__unknown", method: "GET", expected: "401/404 (proxy ishlayapti)", expectStatuses: [401, 404] },
  { name: "AI xizmatlari (kalitsiz)", path: "/ai", method: "GET", expected: "401 API kaliti talab qilinadi", expectStatuses: [401] },
];

async function runCheck(c: (typeof CHECKS)[number], apiKey?: string): Promise<CheckResult> {
  const url = `${API_DOMAIN}${c.path}`;
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method: c.method,
      headers: apiKey ? { "x-api-key": apiKey } : undefined,
    });
    const text = (await res.text()).slice(0, 400);
    return {
      name: c.name,
      url,
      method: c.method,
      status: res.status,
      ok: c.expectStatuses.includes(res.status) || (!!apiKey && res.status < 400),
      expected: c.expected,
      body: text,
      ms: Math.round(performance.now() - t0),
    };
  } catch (e) {
    return {
      name: c.name,
      url,
      method: c.method,
      status: null,
      ok: false,
      expected: c.expected,
      body: e instanceof Error ? e.message : "Network error (DNS / SSL / CORS)",
      ms: Math.round(performance.now() - t0),
    };
  }
}

const INSTALL_CMD = `mkdir -p /root/api-vps && \\
curl -fsSL https://med1.uz/deploy/api-vps/install-api.sh -o /root/api-vps/install-api.sh && \\
curl -fsSL https://med1.uz/deploy/api-vps/nginx-api.med1.uz.conf -o /root/api-vps/nginx-api.med1.uz.conf && \\
sudo bash /root/api-vps/install-api.sh`;

export default function ApiDomainPanel() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [liveResult, setLiveResult] = useState<CheckResult | null>(null);

  const runAll = useCallback(async () => {
    setLoading(true);
    const out: CheckResult[] = [];
    for (const c of CHECKS) out.push(await runCheck(c));
    setResults(out);
    setLoading(false);
  }, []);

  useEffect(() => { runAll(); }, [runAll]);

  const runLive = useCallback(async () => {
    if (!apiKey.trim()) {
      toast({ title: "API kalit kerak", description: "Live test uchun haqiqiy kalitni kiriting", variant: "destructive" });
      return;
    }
    setLiveResult(await runCheck({ name: "Live: GET /v1/ping", path: "/v1/ping", method: "GET", expected: "200 success", expectStatuses: [200] }, apiKey.trim()));
  }, [apiKey]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} nusxalandi` });
  };

  const healthy = results.length > 0 && results.every((r) => r.ok);

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-white/5 border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#2F80ED]" />
            <div>
              <h3 className="font-semibold">API domeni — api.med1.uz</h3>
              <p className="text-xs text-white/60">Barcha hamkor va dasturchi so'rovlari shu domen orqali o'tadi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={healthy ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border-amber-500/40"}>
              {loading ? "Tekshirilmoqda…" : healthy ? "Barcha tekshiruvlar OK" : "E'tibor talab qiladi"}
            </Badge>
            <Button size="sm" variant="secondary" onClick={runAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />Qayta tekshirish
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-lg bg-black/20 p-3">
            <p className="text-white/50 text-xs">Base URL</p>
            <p className="font-mono">{API_DOMAIN}/v1</p>
          </div>
          <div className="rounded-lg bg-black/20 p-3">
            <p className="text-white/50 text-xs">AI xizmatlari</p>
            <p className="font-mono">{API_DOMAIN}/ai</p>
          </div>
          <div className="rounded-lg bg-black/20 p-3">
            <p className="text-white/50 text-xs">Autentifikatsiya</p>
            <p className="font-mono">x-api-key: MED1_…</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-white/5 border-white/10">
        <h3 className="font-semibold mb-3">Avtomatik tekshiruvlar</h3>
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.name} className="rounded-lg bg-black/20 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">{r.ms} ms</span>
                  <Badge className={r.ok ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-red-500/20 text-red-300 border-red-500/40"}>
                    {r.status ?? "ERR"}
                  </Badge>
                </div>
              </div>
              <p className="font-mono text-xs text-white/60 mt-1">{r.method} {r.url}</p>
              <p className="text-xs text-white/40">Kutilgan: {r.expected}</p>
              {r.body && <pre className="text-xs text-white/60 mt-1 whitespace-pre-wrap break-all">{r.body}</pre>}
            </div>
          ))}
          {results.length === 0 && <p className="text-sm text-white/50">Tekshiruv natijalari yuklanmoqda…</p>}
        </div>
      </Card>

      <Card className="p-5 bg-white/5 border-white/10">
        <h3 className="font-semibold mb-3">Live integratsiya testi (haqiqiy API kalit bilan)</h3>
        <div className="flex flex-wrap gap-2">
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="MED1_..."
            type="password"
            className="max-w-sm bg-black/20 border-white/10"
          />
          <Button onClick={runLive}><Play className="w-4 h-4 mr-1" />GET /v1/ping</Button>
        </div>
        {liveResult && (
          <div className="rounded-lg bg-black/20 p-3 text-sm mt-3">
            <Badge className={liveResult.ok ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-red-500/20 text-red-300 border-red-500/40"}>
              {liveResult.status ?? "ERR"}
            </Badge>
            <pre className="text-xs text-white/60 mt-2 whitespace-pre-wrap break-all">{liveResult.body}</pre>
          </div>
        )}
        <p className="text-xs text-white/40 mt-2">Kalit hech qayerga saqlanmaydi — faqat shu brauzer so'rovida ishlatiladi.</p>
      </Card>

      <Card className="p-5 bg-white/5 border-white/10">
        <h3 className="font-semibold mb-3">VDS konfiguratsiyasi (89.39.95.5)</h3>
        <pre className="text-xs bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre">{INSTALL_CMD}</pre>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="secondary" onClick={() => copy(INSTALL_CMD, "O'rnatish buyrug'i")}>
            <Copy className="w-4 h-4 mr-1" />Buyruqni nusxalash
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <a href="/developers" target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-1" />Dasturchilar portali</a>
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <a href="/api-docs" target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-1" />OpenAPI / Swagger</a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
