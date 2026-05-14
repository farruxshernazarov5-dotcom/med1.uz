import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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
  Activity,
  Cpu,
  Cloud,
  Sparkles,
  ArrowRight,
  Terminal,
  GitBranch,
  Lock,
  Layers,
  Gauge,
  Bell,
  CreditCard,
  Search,
  Radio,
  Stethoscope,
  Pill,
  TestTube2,
  Brain,
  HeartPulse,
} from "lucide-react";
import FuturisticBg from "@/components/developers/FuturisticBg";
import NetworkFlow from "@/components/developers/NetworkFlow";

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

const NAV = [
  { id: "overview", label: "Dashboard", icon: Layers },
  { id: "apis", label: "API Catalog", icon: Cloud },
  { id: "docs", label: "Documentation", icon: BookOpen },
  { id: "examples", label: "SDK & Examples", icon: Terminal },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "security", label: "Security", icon: Shield },
  { id: "limits", label: "Rate Limits", icon: Gauge },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "guide", label: "Developer Guide", icon: GitBranch },
  { id: "apply", label: "Apply for Access", icon: Send },
];

const API_CATALOG = [
  { icon: Stethoscope, name: "EMR API", desc: "Patient records, encounters, prescriptions", status: "live", color: "from-emerald-400 to-cyan-400" },
  { icon: Brain, name: "AI API", desc: "Diagnostics, chat, vital signs analysis", status: "live", color: "from-violet-400 to-fuchsia-400" },
  { icon: Pill, name: "Pharmacy API", desc: "Inventory, e-prescriptions, deliveries", status: "live", color: "from-emerald-400 to-lime-400" },
  { icon: TestTube2, name: "Diagnostics API", desc: "Lab orders, results, OCR reports", status: "live", color: "from-sky-400 to-blue-500" },
  { icon: HeartPulse, name: "Insurance API", desc: "Policies, claims, eligibility", status: "beta", color: "from-rose-400 to-orange-400" },
  { icon: Building2, name: "Clinics API", desc: "Directory, doctors, services, slots", status: "live", color: "from-cyan-400 to-teal-400" },
];

const LIVE_EVENTS = [
  { type: "success", icon: CheckCircle2, msg: "Webhook delivered → partner_42", time: "2s" },
  { type: "info", icon: KeyRound, msg: "API key rotated for clinic_217", time: "14s" },
  { type: "warn", icon: Gauge, msg: "Rate limit 80% reached on clinic:read", time: "36s" },
  { type: "success", icon: Sparkles, msg: "New partner approved · Mediqom Group", time: "1m" },
  { type: "info", icon: Radio, msg: "v1/ai/chat · 18 req/min sustained", time: "2m" },
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
    document.title = "Developers — MED-ALL AI Healthcare API";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "MED-ALL AI Enterprise Healthcare API. Klinikalar, shifokorlar, diagnostika, AI xizmatlarini integratsiya qiling."
    );
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", "https://med1.uz/developers");
  }, []);

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
    toast.success("Arizangiz qabul qilindi.");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Nusxalandi");
  };

  const StatusDot = ({ ok = true }: { ok?: boolean }) => (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
    </span>
  );

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <FuturisticBg />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(213,73%,8%)]/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#7B61FF] flex items-center justify-center shadow-[0_0_24px_rgba(123,97,255,0.5)]">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-none">MED-ALL AI</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">Developer Platform</div>
            </div>
          </Link>

          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                placeholder="Search APIs, endpoints, docs…"
                className="w-full h-9 pl-9 pr-16 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/60 focus:border-transparent"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">⌘K</kbd>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl border border-emerald-400/30 bg-emerald-400/10">
              <StatusDot />
              <span className="text-xs text-emerald-300 font-medium">API · 99.98%</span>
            </div>
            <Link to="/partner">
              <Button size="sm" className="bg-gradient-to-r from-[#2F80ED] to-[#7B61FF] hover:opacity-90 border-0 shadow-[0_0_20px_rgba(47,128,237,0.4)]">
                Partner Console <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-60 shrink-0">
            <nav className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-2">
              {NAV.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group relative ${
                      active
                        ? "bg-gradient-to-r from-[#2F80ED]/30 to-[#7B61FF]/20 text-white shadow-[inset_0_0_0_1px_rgba(123,97,255,0.4)]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-gradient-to-b from-cyan-400 to-violet-500 shadow-[0_0_10px_rgba(123,97,255,0.7)]" />
                    )}
                    <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-cyan-300" : "group-hover:text-cyan-300 transition-colors"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* MAIN */}
          <main className="flex-1 min-w-0 space-y-8">
            {tab === "overview" && (
              <>
                {/* HERO */}
                <section className="relative">
                  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-xl p-8 md:p-12 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#7B61FF]/30 blur-3xl" />
                    <Badge className="bg-white/10 text-cyan-300 border-cyan-400/30 mb-5 backdrop-blur">
                      <Sparkles className="w-3 h-3 mr-1" /> Enterprise Healthcare Infrastructure
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.05]">
                      Build the future of{" "}
                      <span className="bg-gradient-to-r from-cyan-300 via-[#2F80ED] to-[#7B61FF] bg-clip-text text-transparent">
                        digital medicine
                      </span>
                    </h1>
                    <p className="text-lg text-white/70 mb-8 max-w-2xl">
                      Connect to Uzbekistan's largest medical ecosystem — clinics, doctors, diagnostics,
                      pharmacies and AI services through one secure, real-time API.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="lg"
                        onClick={() => setTab("apply")}
                        className="bg-gradient-to-r from-[#2F80ED] to-[#7B61FF] border-0 shadow-[0_0_30px_rgba(47,128,237,0.45)] hover:shadow-[0_0_40px_rgba(123,97,255,0.6)] transition-shadow"
                      >
                        <Send className="w-4 h-4 mr-2" /> Request API Access
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setTab("docs")}
                        className="bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white"
                      >
                        <BookOpen className="w-4 h-4 mr-2" /> Read the Docs
                      </Button>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
                      {[
                        { icon: Shield, t: "Secure", d: "API key + scopes + IP whitelist" },
                        { icon: Zap, t: "Fast", d: "p95 < 200ms" },
                        { icon: Globe, t: "Global", d: "REST + Webhooks" },
                        { icon: Webhook, t: "Realtime", d: "HMAC-signed events" },
                      ].map((f, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:border-cyan-400/40 hover:bg-white/[0.06] transition-all group"
                        >
                          <f.icon className="w-5 h-5 text-cyan-300 mb-2 group-hover:scale-110 transition-transform" />
                          <div className="font-semibold text-sm">{f.t}</div>
                          <div className="text-xs text-white/50">{f.d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* NETWORK + LIVE EVENTS */}
                <section className="grid lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2">
                    <NetworkFlow />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="text-xs uppercase tracking-[0.2em] text-violet-300/80 font-semibold">
                        Live Events
                      </div>
                      <Bell className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div className="space-y-2">
                      {LIVE_EVENTS.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/[0.03] hover:border-white/15 transition-colors"
                          style={{ animation: `fade-in 0.5s ease-out ${i * 0.08}s both` }}
                        >
                          <div
                            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                              e.type === "success"
                                ? "bg-emerald-400/15 text-emerald-300"
                                : e.type === "warn"
                                  ? "bg-amber-400/15 text-amber-300"
                                  : "bg-cyan-400/15 text-cyan-300"
                            }`}
                          >
                            <e.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-white/85 leading-snug truncate">{e.msg}</div>
                            <div className="text-[10px] text-white/40 mt-0.5 font-mono">{e.time} ago</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* API CATALOG PREVIEW */}
                <section>
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">API Catalog</h2>
                      <p className="text-sm text-white/50">Production-grade modules ready to integrate</p>
                    </div>
                    <button
                      onClick={() => setTab("apis")}
                      className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {API_CATALOG.map((a, i) => (
                      <ApiCard key={i} {...a} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {tab === "apis" && (
              <section>
                <PageTitle title="API Catalog" sub="All endpoints powering the MED-ALL AI ecosystem" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {API_CATALOG.map((a, i) => (
                    <ApiCard key={i} {...a} />
                  ))}
                </div>
              </section>
            )}

            {tab === "docs" && (
              <section className="space-y-5">
                <PageTitle title="Documentation" sub="Authentication, endpoints, response shape" />

                <Glass>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Lock className="w-4 h-4 text-cyan-300" /> Authentication
                  </h3>
                  <p className="text-sm text-white/60 mb-3">
                    Send your API key in the <code className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">x-api-key</code>{" "}
                    header (or <code className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">Authorization: Bearer …</code>).
                  </p>
                  <CodeBlock>{`x-api-key: mall_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</CodeBlock>
                </Glass>

                <Glass>
                  <h3 className="font-semibold mb-3 text-white">Endpoints</h3>
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                          <th className="py-2 px-2">Method</th>
                          <th className="py-2 px-2">Path</th>
                          <th className="py-2 px-2">Scope</th>
                          <th className="py-2 px-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ENDPOINTS.map((e) => (
                          <tr key={e.path} className="border-t border-white/5 hover:bg-white/[0.03]">
                            <td className="py-2.5 px-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                  e.method === "GET"
                                    ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                                    : "bg-violet-400/15 text-violet-300 border border-violet-400/30"
                                }`}
                              >
                                {e.method}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 font-mono text-xs text-cyan-300">{e.path}</td>
                            <td className="py-2.5 px-2 font-mono text-xs text-white/60">{e.scope}</td>
                            <td className="py-2.5 px-2 text-white/70">{e.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Glass>

                <Glass>
                  <h3 className="font-semibold mb-3 text-white">Response format</h3>
                  <CodeBlock>
{`{
  "success": true,
  "data": [ ... ],
  "error": null,
  "request_id": "req_..."
}`}
                  </CodeBlock>
                </Glass>
              </section>
            )}

            {tab === "examples" && (
              <section className="space-y-5">
                <PageTitle title="SDK & Examples" sub="Copy-paste snippets for any stack" />

                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CODE_EXAMPLES) as Array<keyof typeof CODE_EXAMPLES>).map((k) => (
                    <button
                      key={k}
                      onClick={() => setCodeLang(k)}
                      className={`px-3 h-8 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                        codeLang === k
                          ? "bg-gradient-to-r from-[#2F80ED] to-[#7B61FF] text-white shadow-[0_0_15px_rgba(123,97,255,0.4)]"
                          : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl overflow-hidden border border-white/10 bg-[hsl(213,73%,5%)]/80 backdrop-blur-xl">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.03]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                      <span className="ml-3 text-xs font-mono text-white/40">{codeLang}.example</span>
                    </div>
                    <button
                      onClick={() => copy(CODE_EXAMPLES[codeLang])}
                      className="text-xs text-white/60 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <pre className="p-5 text-xs text-cyan-100 overflow-x-auto leading-relaxed">
                    <code>{CODE_EXAMPLES[codeLang]}</code>
                  </pre>
                </div>
              </section>
            )}

            {tab === "webhooks" && (
              <section className="space-y-5">
                <PageTitle title="Webhooks" sub="HMAC-signed real-time events delivered to your URL" />
                <Glass>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Webhook className="w-4 h-4 text-violet-300" /> Verify the signature
                  </h3>
                  <CodeBlock>
{`// Node.js
import crypto from "crypto";
const ts  = req.headers["x-webhook-timestamp"];
const sig = req.headers["x-webhook-signature"]; // sha256=...
const exp = "sha256=" + crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(\`\${ts}.\${rawBody}\`)
  .digest("hex");
if (!crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(sig))) {
  return res.status(401).end();
}`}
                  </CodeBlock>
                </Glass>
                <Glass>
                  <h3 className="font-semibold mb-3 text-white">Available events</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "appointment.created", "appointment.updated", "patient.created",
                      "payment.paid", "lab.result.ready", "ai.report.generated",
                    ].map((e) => (
                      <code
                        key={e}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300"
                      >
                        {e}
                      </code>
                    ))}
                  </div>
                </Glass>
              </section>
            )}

            {tab === "analytics" && <Placeholder title="Analytics" icon={Activity} desc="Live request volume, latency heatmaps and geographic traffic — coming for approved partners in Partner Console." />}
            {tab === "security" && <Placeholder title="Security" icon={Shield} desc="HMAC signing, scoped tokens, IP allow-listing, audit logs and key rotation. Configure from Partner Console." />}
            {tab === "limits" && <Placeholder title="Rate Limits" icon={Gauge} desc="Per-minute and per-day quotas by tier. Exceed → HTTP 429. Upgrade in Billing." />}
            {tab === "billing" && <Placeholder title="Billing" icon={CreditCard} desc="Usage-based invoicing in UZS. Stripe & Click supported." />}
            {tab === "notifications" && <Placeholder title="Notifications" icon={Bell} desc="Email + Telegram alerts for webhook failures, quota warnings and key events." />}
            {tab === "guide" && <Placeholder title="Developer Guide" icon={GitBranch} desc="Step-by-step onboarding wizard, sandbox → production migration, and best practices." />}

            {tab === "apply" && (
              <section className="space-y-5">
                <PageTitle title="Apply for API access" sub="Approved within 1–3 business days" />
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 max-w-2xl">
                  {submitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-emerald-400/15 border border-emerald-400/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                        <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-white">Application received</h3>
                      <p className="text-white/60">Our team will review and email you within 1–3 business days.</p>
                    </div>
                  ) : (
                    <>
                      {!user && (
                        <div className="p-3 mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 text-sm text-amber-200">
                          Please <Link to="/auth" className="underline text-amber-100">sign in</Link> to submit an application.
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <FieldDark label="Organization name *">
                          <Input value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                        </FieldDark>
                        <FieldDark label="Type *">
                          <select
                            className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/15 text-white text-sm"
                            value={form.org_type}
                            onChange={(e) => setForm({ ...form, org_type: e.target.value })}
                          >
                            <option value="clinic">Clinic</option>
                            <option value="hospital">Hospital</option>
                            <option value="diagnostics">Diagnostics</option>
                            <option value="pharmacy">Pharmacy</option>
                            <option value="insurance">Insurance</option>
                            <option value="startup">Startup</option>
                            <option value="government">Government</option>
                            <option value="other">Other</option>
                          </select>
                        </FieldDark>
                        <FieldDark label="Email *">
                          <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="bg-white/5 border-white/15 text-white" />
                        </FieldDark>
                        <FieldDark label="Phone">
                          <Input placeholder="+998" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                        </FieldDark>
                        <FieldDark label="INN (9 digits)">
                          <Input maxLength={9} value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value.replace(/\D/g, "") })} className="bg-white/5 border-white/15 text-white" />
                        </FieldDark>
                        <FieldDark label="Website">
                          <Input placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                        </FieldDark>
                      </div>
                      <FieldDark label="Use case *" className="mt-4">
                        <Textarea rows={4} placeholder="What product, what flow, expected volume?" value={form.use_case} onChange={(e) => setForm({ ...form, use_case: e.target.value })} className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                      </FieldDark>
                      <div className="mt-4">
                        <Label className="mb-2 block text-white/80">Requested scopes *</Label>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {ALL_SCOPES.map((s) => {
                            const checked = form.requested_scopes.includes(s.id);
                            return (
                              <label
                                key={s.id}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  checked
                                    ? "border-violet-400/50 bg-violet-400/10 shadow-[0_0_15px_rgba(123,97,255,0.2)]"
                                    : "border-white/10 bg-white/[0.03] hover:bg-white/5"
                                }`}
                              >
                                <Checkbox checked={checked} onCheckedChange={() => toggleScope(s.id)} />
                                <span className="text-sm text-white/80">
                                  <code className="text-xs text-cyan-300">{s.id}</code> — {s.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <Button
                        className="mt-6 w-full bg-gradient-to-r from-[#2F80ED] to-[#7B61FF] border-0 shadow-[0_0_25px_rgba(123,97,255,0.4)] hover:shadow-[0_0_35px_rgba(123,97,255,0.6)]"
                        size="lg"
                        onClick={submitApplication}
                        disabled={submitting || !user}
                      >
                        {submitting ? "Submitting…" : "Submit application"}
                      </Button>
                      <p className="text-xs text-white/40 mt-3 text-center">
                        By submitting you accept our{" "}
                        <Link to="/terms" className="underline hover:text-white/70">Terms</Link> and{" "}
                        <Link to="/privacy" className="underline hover:text-white/70">Privacy Policy</Link>.
                      </p>
                    </>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      <footer className="border-t border-white/10 mt-16 py-6 text-center text-xs text-white/40 bg-[hsl(213,73%,8%)]/60 backdrop-blur">
        MED-ALL AI SYSTEM MCHJ © 2018–2026 · Enterprise Healthcare Infrastructure
      </footer>
    </div>
  );
}

/* ---------- shared bits ---------- */

const PageTitle = ({ title, sub }: { title: string; sub: string }) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold text-white">{title}</h1>
    <p className="text-sm text-white/50 mt-1">{sub}</p>
  </div>
);

const Glass = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
    {children}
  </div>
);

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre className="bg-[hsl(213,73%,5%)]/80 border border-white/10 p-3 rounded-lg text-xs text-cyan-100 overflow-x-auto">
    {children}
  </pre>
);

const FieldDark = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <Label className="text-white/70 mb-1.5 block">{label}</Label>
    {children}
  </div>
);

const Placeholder = ({ title, icon: Icon, desc }: { title: string; icon: typeof Activity; desc: string }) => (
  <section>
    <PageTitle title={title} sub="Live in Partner Console" />
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-10 text-center">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-[#2F80ED] to-[#7B61FF] flex items-center justify-center shadow-[0_0_30px_rgba(123,97,255,0.4)]">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className="text-white/70 max-w-md mx-auto">{desc}</p>
      <Link to="/partner">
        <Button className="mt-5 bg-white/10 border border-white/15 hover:bg-white/15 text-white">
          Open Partner Console <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  </section>
);

const ApiCard = ({
  icon: Icon, name, desc, status, color,
}: { icon: typeof Stethoscope; name: string; desc: string; status: string; color: string }) => (
  <div className="group relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 overflow-hidden transition-all hover:border-cyan-400/40 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(47,128,237,0.5)]">
    <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
    <div className="relative">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-white">{name}</h3>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
          status === "live"
            ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
            : "bg-amber-400/15 text-amber-300 border border-amber-400/30"
        }`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-white/55">{desc}</p>
    </div>
  </div>
);
