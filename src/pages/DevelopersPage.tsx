import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Code2,
  Shield,
  Zap,
  Globe,
  Webhook,
  KeyRound,
  BookOpen,
  Building2,
  Send,
  Copy,
  CheckCircle2,
} from "lucide-react";

const ALL_SCOPES = [
  { id: "clinic:read", label: "Klinikalar (read)" },
  { id: "doctor:read", label: "Shifokorlar (read)" },
  { id: "diagnostics:read", label: "Diagnostika (read)" },
  { id: "pharmacy:read", label: "Dorixonalar (read)" },
  { id: "emr:read", label: "EMR (read)" },
  { id: "ai:chat", label: "AI Chat" },
  { id: "payment:read", label: "To'lovlar (read)" },
];

const CODE_EXAMPLES: Record<string, string> = {
  curl: `curl -H "x-api-key: mall_live_xxxxxxxxxxxx" \\
  https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway/v1/clinics`,
  js: `const res = await fetch(
  "https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway/v1/clinics",
  { headers: { "x-api-key": "mall_live_xxxxxxxxxxxx" } }
);
const { data } = await res.json();`,
  python: `import requests
r = requests.get(
  "https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway/v1/clinics",
  headers={"x-api-key": "mall_live_xxxxxxxxxxxx"},
)
print(r.json())`,
  flutter: `final res = await http.get(
  Uri.parse('https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway/v1/clinics'),
  headers: {'x-api-key': 'mall_live_xxxxxxxxxxxx'},
);`,
  php: `$ch = curl_init("https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway/v1/clinics");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["x-api-key: mall_live_xxxxxxxxxxxx"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);`,
};

const ENDPOINTS = [
  { method: "GET", path: "/v1/ping", scope: "—", desc: "Health check (public)" },
  { method: "GET", path: "/v1/clinics", scope: "clinic:read", desc: "Klinikalar ro'yxati" },
  { method: "GET", path: "/v1/doctors", scope: "doctor:read", desc: "Shifokorlar ro'yxati" },
  { method: "GET", path: "/v1/diagnostics", scope: "diagnostics:read", desc: "Diagnostika markazlari" },
  { method: "GET", path: "/v1/pharmacies", scope: "pharmacy:read", desc: "Dorixonalar" },
  { method: "POST", path: "/v1/ai/chat", scope: "ai:chat", desc: "AI chat completions" },
];

export default function DevelopersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [codeLang, setCodeLang] = useState<keyof typeof CODE_EXAMPLES>("curl");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    org_name: "",
    org_type: "clinic",
    contact_email: "",
    contact_phone: "",
    inn: "",
    website: "",
    use_case: "",
    requested_scopes: [] as string[],
  });

  useEffect(() => {
    if (user?.email && !form.contact_email) {
      setForm((f) => ({ ...f, contact_email: user.email! }));
    }
  }, [user]);

  const toggleScope = (s: string) =>
    setForm((f) => ({
      ...f,
      requested_scopes: f.requested_scopes.includes(s)
        ? f.requested_scopes.filter((x) => x !== s)
        : [...f.requested_scopes, s],
    }));

  const submitApplication = async () => {
    if (!user) {
      toast.error("Iltimos, avval tizimga kiring");
      return;
    }
    if (!form.org_name || !form.contact_email || !form.use_case) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }
    if (form.requested_scopes.length === 0) {
      toast.error("Kamida bitta scope tanlang");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("api_partner_applications").insert({
      user_id: user.id,
      ...form,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubmitted(true);
    toast.success("Arizangiz qabul qilindi. Ko'rib chiqilgach email yuboramiz.");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Nusxalandi");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Developers — MED-ALL AI Healthcare API</title>
        <meta
          name="description"
          content="MED-ALL AI Enterprise Healthcare API. Klinikalar, shifokorlar, diagnostika, AI xizmatlarini integratsiya qiling."
        />
        <link rel="canonical" href="https://med1.uz/developers" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">Enterprise Healthcare API</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              MED-ALL AI <span className="text-primary">Developer Platform</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              O'zbekistondagi eng yirik tibbiy ekotizimga ulang: klinikalar, shifokorlar,
              diagnostika, dorixonalar va AI xizmatlari — bitta xavfsiz API orqali.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setTab("apply")}>
                <Send className="w-4 h-4 mr-2" /> Hamkorlik uchun ariza
              </Button>
              <Button size="lg" variant="outline" onClick={() => setTab("docs")}>
                <BookOpen className="w-4 h-4 mr-2" /> Hujjatlar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { icon: Shield, t: "Xavfsiz", d: "API key + scope + IP whitelist" },
              { icon: Zap, t: "Tezkor", d: "p95 < 200ms" },
              { icon: Globe, t: "Global", d: "REST + Webhooks" },
              { icon: Webhook, t: "Realtime", d: "HMAC-signed events" },
            ].map((f, i) => (
              <Card key={i} className="p-4">
                <f.icon className="w-6 h-6 text-primary mb-2" />
                <div className="font-semibold">{f.t}</div>
                <div className="text-sm text-muted-foreground">{f.d}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="examples">Misollar</TabsTrigger>
            <TabsTrigger value="apply">Ariza</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-8 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Building2, t: "Klinika integratsiyasi", d: "EMR, qabullar, hisob-kitob va laboratoriya ma'lumotlarini ulang." },
                { icon: KeyRound, t: "API kalitlari", d: "Sandbox (mall_test_) va Production (mall_live_) — scope va rate-limit bilan." },
                { icon: Webhook, t: "Webhooklar", d: "Tadbirlar (appointment.created, payment.paid) HMAC bilan imzolangan." },
              ].map((c, i) => (
                <Card key={i} className="p-6">
                  <c.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{c.t}</h3>
                  <p className="text-sm text-muted-foreground">{c.d}</p>
                </Card>
              ))}
            </div>
            <Card className="p-6 bg-muted/30">
              <h3 className="font-semibold mb-2">Qanday ishlaydi</h3>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Ariza topshiring va MED-ALL AI tasdiqlashini kuting (1–3 ish kuni).</li>
                <li>Tasdiqlangach API kalitlaringizni Partner Dashboard'dan oling.</li>
                <li>API'ni sandbox'da sinab ko'ring, so'ng production'ga o'ting.</li>
                <li>Webhook URL'ingizni qo'shing — eventlar real vaqtda yuboriladi.</li>
              </ol>
            </Card>
          </TabsContent>

          {/* Docs */}
          <TabsContent value="docs" className="mt-8 space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Authentication</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Har bir so'rovda API kalitingizni <code className="px-1 py-0.5 rounded bg-muted">x-api-key</code> header
                yoki <code className="px-1 py-0.5 rounded bg-muted">Authorization: Bearer ...</code> orqali yuboring.
              </p>
              <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto">
{`x-api-key: mall_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
              </pre>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">Endpointlar</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Method</th>
                      <th className="py-2 pr-4">Path</th>
                      <th className="py-2 pr-4">Scope</th>
                      <th className="py-2">Tavsif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENDPOINTS.map((e) => (
                      <tr key={e.path} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <Badge variant={e.method === "GET" ? "secondary" : "default"}>{e.method}</Badge>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{e.path}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{e.scope}</td>
                        <td className="py-2 text-muted-foreground">{e.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">Response format</h3>
              <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "data": [ ... ],
  "error": null,
  "request_id": "req_..."
}`}
              </pre>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">Rate limits</h3>
              <p className="text-sm text-muted-foreground">
                Tier'ga qarab daqiqa va kun bo'yicha cheklov qo'llanadi. Limitdan oshganda{" "}
                <code className="px-1 py-0.5 rounded bg-muted">429 Too Many Requests</code> qaytariladi.
              </p>
            </Card>
          </TabsContent>

          {/* Examples */}
          <TabsContent value="examples" className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CODE_EXAMPLES) as Array<keyof typeof CODE_EXAMPLES>).map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={codeLang === k ? "default" : "outline"}
                  onClick={() => setCodeLang(k)}
                >
                  {k.toUpperCase()}
                </Button>
              ))}
            </div>
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <span className="text-xs font-mono text-muted-foreground">{codeLang}</span>
                <Button size="sm" variant="ghost" onClick={() => copy(CODE_EXAMPLES[codeLang])}>
                  <Copy className="w-3 h-3 mr-1" /> Nusxa
                </Button>
              </div>
              <pre className="p-4 text-xs overflow-x-auto bg-background">
                <code>{CODE_EXAMPLES[codeLang]}</code>
              </pre>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Webhook className="w-4 h-4" /> Webhook signature tekshiruvi
              </h3>
              <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto">
{`// Node.js
import crypto from "crypto";
const sig = req.headers["x-mall-signature"];
const expected = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest("hex");
if (sig !== expected) return res.status(401).end();`}
              </pre>
            </Card>
          </TabsContent>

          {/* Apply */}
          <TabsContent value="apply" className="mt-8">
            <Card className="p-6 max-w-2xl">
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Arizangiz yuborildi</h3>
                  <p className="text-muted-foreground">
                    Jamoamiz 1–3 ish kuni ichida ko'rib chiqib email orqali javob beradi.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-1">Hamkorlik uchun ariza</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Tasdiqlangach API kalitlari Partner Dashboard'da paydo bo'ladi.
                  </p>

                  {!user && (
                    <div className="p-3 mb-4 rounded border border-amber-500/30 bg-amber-500/10 text-sm">
                      Ariza topshirish uchun{" "}
                      <Link to="/auth" className="text-primary underline">
                        tizimga kiring
                      </Link>
                      .
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tashkilot nomi *</Label>
                      <Input
                        value={form.org_name}
                        onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tashkilot turi *</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border bg-background"
                        value={form.org_type}
                        onChange={(e) => setForm({ ...form, org_type: e.target.value })}
                      >
                        <option value="clinic">Klinika</option>
                        <option value="hospital">Shifoxona</option>
                        <option value="diagnostics">Diagnostika</option>
                        <option value="pharmacy">Dorixona</option>
                        <option value="insurance">Sug'urta</option>
                        <option value="startup">Startup</option>
                        <option value="government">Davlat</option>
                        <option value="other">Boshqa</option>
                      </select>
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={form.contact_email}
                        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        placeholder="+998"
                        value={form.contact_phone}
                        onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>INN (9 raqam)</Label>
                      <Input
                        maxLength={9}
                        value={form.inn}
                        onChange={(e) => setForm({ ...form, inn: e.target.value.replace(/\D/g, "") })}
                      />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input
                        placeholder="https://"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Foydalanish maqsadi *</Label>
                    <Textarea
                      rows={4}
                      placeholder="Qaysi mahsulotda, qanday qilib ishlatmoqchisiz?"
                      value={form.use_case}
                      onChange={(e) => setForm({ ...form, use_case: e.target.value })}
                    />
                  </div>

                  <div className="mt-4">
                    <Label className="mb-2 block">Talab qilinadigan scopes *</Label>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {ALL_SCOPES.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/30"
                        >
                          <Checkbox
                            checked={form.requested_scopes.includes(s.id)}
                            onCheckedChange={() => toggleScope(s.id)}
                          />
                          <span className="text-sm">
                            <code className="text-xs">{s.id}</code> — {s.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="mt-6 w-full"
                    size="lg"
                    onClick={submitApplication}
                    disabled={submitting || !user}
                  >
                    {submitting ? "Yuborilmoqda..." : "Arizani yuborish"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Yuborish orqali siz{" "}
                    <Link to="/terms" className="underline">Foydalanish shartlari</Link> va{" "}
                    <Link to="/privacy" className="underline">Maxfiylik siyosati</Link>ga rozilik bildirasiz.
                  </p>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
