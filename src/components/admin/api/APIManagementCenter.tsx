import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Activity, Key, Layers, ShieldAlert, Webhook, LineChart as LineChartIcon,
  FileCode, Download, Beaker, Rocket, Search, RefreshCw, Copy, Plus, Trash2,
  Smartphone, Globe, Handshake, Cpu, Lock, BookOpen, Users, ScrollText, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

type Endpoint = { id: string; path: string; method: string; category: string; scope: string; title: string; description: string | null; is_deprecated: boolean; is_public: boolean; version: string };
type ApiKey = { id: string; partner_id: string; name: string; environment: string; scopes: string[]; rate_limit_per_min: number; rate_limit_per_day: number; is_active: boolean; last_used_at: string | null; expires_at: string | null; created_at: string; key_prefix: string };
type Partner = { id: string; name: string; status: string; tier: string; owner_email: string | null; created_at: string };
type OAuthClient = { id: string; client_id: string; client_name: string; scopes: string[]; is_active: boolean; created_at: string; last_used_at: string | null };
type SdkLinkStatus = "unchecked" | "available" | "missing" | "error" | "not_configured";
type SdkVersion = {
  id: string;
  language: string;
  version: string;
  is_latest: boolean;
  changelog: string | null;
  download_url: string | null;
  repository_url: string | null;
  released_at: string;
  download_status?: SdkLinkStatus | null;
  download_status_code?: number | null;
  download_checked_at?: string | null;
  download_error?: string | null;
  repository_status?: SdkLinkStatus | null;
  repository_status_code?: number | null;
  repository_checked_at?: string | null;
  repository_error?: string | null;
  next_retry_at?: string | null;
};
type AlertRule = { id: string; name: string; metric: string; operator: string; threshold: number; window_minutes: number; is_active: boolean; last_triggered_at: string | null; trigger_count: number; notify_email: string | null; notify_telegram_chat_id: string | null };
type LogRow = { id: string; created_at: string; endpoint: string; method: string; status_code: number; response_time_ms: number; ip_address: string; error_message: string | null; partner_id: string | null };
type Webhook = { id: string; partner_id: string; url: string; events: string[]; is_active: boolean; created_at: string };

const CATEGORY_ICONS: Record<string, any> = {
  mobile: Smartphone, web: Globe, hambi: Handshake, partner: Users,
  ai: Cpu, auth: Lock, user: Users, clinics: Layers, appointments: Activity,
  emr: ScrollText, payments: Key, notifications: Webhook, maps: Globe, webhook: Webhook,
};
const STATUS_COLOR = (code: number) => code < 300 ? "bg-emerald-500/15 text-emerald-400" : code < 400 ? "bg-blue-500/15 text-blue-400" : code < 500 ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400";

export default function APIManagementCenter() {
  const [tab, setTab] = useState("dashboard");
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2540] via-[#0F1E3D] to-[#0A2540] text-white p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Rocket className="w-7 h-7 text-[#2F80ED]" />
              API Management Center
            </h1>
            <p className="text-sm text-white/60 mt-1">MED1.UZ Mobile / Web / HAMBI / Partner API infratuzilmasini boshqarish</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">v1 · Production</Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">Sandbox mavjud</Badge>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <TabsList className="bg-white/5 border border-white/10 flex-nowrap w-max">
              <TabsTrigger value="dashboard"><Activity className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
              <TabsTrigger value="endpoints"><Layers className="w-4 h-4 mr-1" />Endpoints</TabsTrigger>
              <TabsTrigger value="keys"><Key className="w-4 h-4 mr-1" />API Keys</TabsTrigger>
              <TabsTrigger value="oauth"><Lock className="w-4 h-4 mr-1" />OAuth</TabsTrigger>
              <TabsTrigger value="partners"><Users className="w-4 h-4 mr-1" />Partners</TabsTrigger>
              <TabsTrigger value="mobile"><Smartphone className="w-4 h-4 mr-1" />Mobile</TabsTrigger>
              <TabsTrigger value="hambi"><Handshake className="w-4 h-4 mr-1" />HAMBI</TabsTrigger>
              <TabsTrigger value="ai"><Cpu className="w-4 h-4 mr-1" />AI</TabsTrigger>
              <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-1" />Webhooks</TabsTrigger>
              <TabsTrigger value="monitoring"><ShieldAlert className="w-4 h-4 mr-1" />Monitoring</TabsTrigger>
              <TabsTrigger value="logs"><ScrollText className="w-4 h-4 mr-1" />Logs</TabsTrigger>
              <TabsTrigger value="analytics"><LineChartIcon className="w-4 h-4 mr-1" />Analytics</TabsTrigger>
              <TabsTrigger value="docs"><BookOpen className="w-4 h-4 mr-1" />Docs</TabsTrigger>
              <TabsTrigger value="sdks"><Download className="w-4 h-4 mr-1" />SDKs</TabsTrigger>
              <TabsTrigger value="sandbox"><Beaker className="w-4 h-4 mr-1" />Sandbox</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard"><DashboardPanel /></TabsContent>
          <TabsContent value="endpoints"><EndpointsPanel /></TabsContent>
          <TabsContent value="keys"><KeysPanel /></TabsContent>
          <TabsContent value="oauth"><OAuthPanel /></TabsContent>
          <TabsContent value="partners"><PartnersPanel /></TabsContent>
          <TabsContent value="mobile"><EndpointsPanel filterCategory={["mobile","auth","user","ai","appointments","emr","payments","notifications","maps"]} title="Mobile API (Flutter · Android · iOS)" /></TabsContent>
          <TabsContent value="hambi"><EndpointsPanel filterCategory={["hambi","partner"]} title="HAMBI Partner API" /></TabsContent>
          <TabsContent value="ai"><EndpointsPanel filterCategory={["ai"]} title="AI API — 14 xizmat" /></TabsContent>
          <TabsContent value="webhooks"><WebhooksPanel /></TabsContent>
          <TabsContent value="monitoring"><MonitoringPanel /></TabsContent>
          <TabsContent value="logs"><LogsPanel /></TabsContent>
          <TabsContent value="analytics"><AnalyticsPanel /></TabsContent>
          <TabsContent value="docs"><DocsPanel /></TabsContent>
          <TabsContent value="sdks"><SDKsPanel /></TabsContent>
          <TabsContent value="sandbox"><SandboxPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============ Dashboard ============
function DashboardPanel() {
  const [stats, setStats] = useState({ req24h: 0, err24h: 0, avgLatency: 0, activeKeys: 0, endpoints: 0, partners: 0 });
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [topEndpoints, setTopEndpoints] = useState<any[]>([]);

  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, []);
  const load = async () => {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const [{ data: logs }, { count: keys }, { count: eps }, { count: partners }] = await Promise.all([
      supabase.from("api_request_logs").select("status_code, response_time_ms, endpoint, created_at").gte("created_at", since).limit(5000),
      supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("api_endpoints").select("id", { count: "exact", head: true }),
      supabase.from("api_partners").select("id", { count: "exact", head: true }).eq("status", "approved"),
    ]);
    const l = logs ?? [];
    const err = l.filter((r: any) => r.status_code >= 400).length;
    const avg = l.length ? Math.round(l.reduce((s: number, r: any) => s + (r.response_time_ms || 0), 0) / l.length) : 0;
    setStats({ req24h: l.length, err24h: err, avgLatency: avg, activeKeys: keys ?? 0, endpoints: eps ?? 0, partners: partners ?? 0 });
    // hourly bucket
    const buckets: Record<string, number> = {};
    l.forEach((r: any) => { const h = new Date(r.created_at).toISOString().slice(0, 13); buckets[h] = (buckets[h] || 0) + 1; });
    setTimeSeries(Object.entries(buckets).sort().map(([t, c]) => ({ time: t.slice(11), requests: c })));
    // top endpoints
    const eb: Record<string, number> = {};
    l.forEach((r: any) => { eb[r.endpoint] = (eb[r.endpoint] || 0) + 1; });
    setTopEndpoints(Object.entries(eb).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([endpoint, count]) => ({ endpoint, count })));
  };

  const kpis = [
    { label: "Requests (24h)", value: stats.req24h.toLocaleString(), icon: Activity, color: "text-blue-400" },
    { label: "Xatolar (24h)", value: stats.err24h.toLocaleString(), icon: ShieldAlert, color: "text-red-400" },
    { label: "O'rtacha latency", value: `${stats.avgLatency} ms`, icon: LineChartIcon, color: "text-emerald-400" },
    { label: "Faol API keys", value: stats.activeKeys, icon: Key, color: "text-amber-400" },
    { label: "Endpointlar", value: stats.endpoints, icon: Layers, color: "text-purple-400" },
    { label: "Hamkorlar", value: stats.partners, icon: Users, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="p-4 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <k.icon className={`w-5 h-5 ${k.color}`} />
              <span className="text-xs text-white/50">{k.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{k.value}</div>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-white/5 border-white/10">
          <h3 className="text-sm font-semibold mb-3 text-white/80">Requests / hour (24h)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="time" stroke="#ffffff60" fontSize={11} />
              <YAxis stroke="#ffffff60" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0A2540", border: "1px solid #2F80ED" }} />
              <Line type="monotone" dataKey="requests" stroke="#2F80ED" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 bg-white/5 border-white/10">
          <h3 className="text-sm font-semibold mb-3 text-white/80">Top 10 endpoints</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topEndpoints} layout="vertical">
              <XAxis type="number" stroke="#ffffff60" fontSize={11} />
              <YAxis type="category" dataKey="endpoint" stroke="#ffffff60" fontSize={9} width={140} />
              <Tooltip contentStyle={{ background: "#0A2540", border: "1px solid #2F80ED" }} />
              <Bar dataKey="count" fill="#7B61FF" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ============ Endpoints ============
function EndpointsPanel({ filterCategory, title }: { filterCategory?: string[]; title?: string }) {
  const [items, setItems] = useState<Endpoint[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { load(); }, []);
  const load = async () => {
    let qry = supabase.from("api_endpoints").select("*").order("category").order("path");
    if (filterCategory?.length) qry = qry.in("category", filterCategory);
    const { data } = await qry;
    setItems((data ?? []) as Endpoint[]);
  };
  const filtered = items.filter(e => !q || e.path.toLowerCase().includes(q.toLowerCase()) || e.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">{title || "Barcha API Endpointlar"} <span className="text-white/50 text-sm">({filtered.length})</span></h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/50" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Path yoki nom bo'yicha qidirish..." className="pl-9 bg-white/5 border-white/10 w-72" />
        </div>
      </div>
      <Card className="bg-white/5 border-white/10 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/70">Kategoriya</TableHead>
              <TableHead className="text-white/70">Method</TableHead>
              <TableHead className="text-white/70">Path</TableHead>
              <TableHead className="text-white/70">Sarlavha</TableHead>
              <TableHead className="text-white/70">Scope</TableHead>
              <TableHead className="text-white/70">Kirish</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(e => {
              const Icon = CATEGORY_ICONS[e.category] || Layers;
              return (
                <TableRow key={e.id} className="border-white/5 hover:bg-white/5">
                  <TableCell><Badge variant="outline" className="border-white/20 text-white/80"><Icon className="w-3 h-3 mr-1" />{e.category}</Badge></TableCell>
                  <TableCell><Badge className={e.method === "GET" ? "bg-emerald-500/20 text-emerald-300" : e.method === "POST" ? "bg-blue-500/20 text-blue-300" : e.method === "DELETE" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}>{e.method}</Badge></TableCell>
                  <TableCell className="font-mono text-xs text-white/90">{e.path}</TableCell>
                  <TableCell className="text-white/80 text-sm">{e.title}</TableCell>
                  <TableCell><code className="text-xs text-purple-300">{e.scope}</code></TableCell>
                  <TableCell>{e.is_public ? <Badge className="bg-emerald-500/20 text-emerald-300">Public</Badge> : <Badge className="bg-amber-500/20 text-amber-300">Auth</Badge>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============ API Keys ============
function KeysPanel() {
  const [keys, setKeys] = useState<any[]>([]);
  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("api_keys").select("id, name, environment, scopes, rate_limit_per_min, rate_limit_per_day, is_active, last_used_at, expires_at, created_at, key_prefix, partner_id, api_partners(name)").order("created_at", { ascending: false });
    setKeys(data ?? []);
  };
  const revoke = async (id: string) => {
    const { error } = await supabase.from("api_keys").update({ is_active: false }).eq("id", id);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "Kalit bekor qilindi" }); load(); }
  };
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Keys <span className="text-white/50 text-sm">({keys.length})</span></h2>
        <p className="text-xs text-white/60">Yangi kalitlar hamkor tomonidan Partner Dashboard orqali yaratiladi</p>
      </div>
      <Card className="bg-white/5 border-white/10 overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/70">Hamkor</TableHead>
            <TableHead className="text-white/70">Nomi</TableHead>
            <TableHead className="text-white/70">Muhit</TableHead>
            <TableHead className="text-white/70">Prefix</TableHead>
            <TableHead className="text-white/70">Scopes</TableHead>
            <TableHead className="text-white/70">Rate limit</TableHead>
            <TableHead className="text-white/70">Oxirgi ishlatilgan</TableHead>
            <TableHead className="text-white/70">Amal</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {keys.map(k => (
              <TableRow key={k.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-sm">{k.api_partners?.name || <span className="text-white/40">—</span>}</TableCell>
                <TableCell className="text-sm text-white/90">{k.name}</TableCell>
                <TableCell><Badge className={k.environment === "production" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}>{k.environment}</Badge></TableCell>
                <TableCell className="font-mono text-xs text-white/80">{k.key_prefix}…</TableCell>
                <TableCell className="text-xs text-white/70">{(k.scopes || []).slice(0, 3).join(", ")}{(k.scopes || []).length > 3 ? ` +${k.scopes.length - 3}` : ""}</TableCell>
                <TableCell className="text-xs">{k.rate_limit_per_min}/min · {k.rate_limit_per_day}/day</TableCell>
                <TableCell className="text-xs text-white/60">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "hech qachon"}</TableCell>
                <TableCell>
                  {k.is_active ? <Button size="sm" variant="destructive" onClick={() => revoke(k.id)}><Trash2 className="w-3 h-3" /></Button> : <Badge className="bg-red-500/20 text-red-300">Revoked</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============ OAuth Clients ============
function OAuthPanel() {
  const [items, setItems] = useState<OAuthClient[]>([]);
  const [form, setForm] = useState({ client_name: "", scopes: "user:read,user:write", redirect_uris: "" });
  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("api_oauth_clients").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as OAuthClient[]);
  };
  const create = async () => {
    if (!form.client_name) return toast({ title: "Client nomi kerak", variant: "destructive" });
    const client_id = "med1_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    const secret = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const enc = new TextEncoder().encode(secret);
    const hashBuf = await crypto.subtle.digest("SHA-256", enc);
    const client_secret_hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.from("api_oauth_clients").insert({
      client_id, client_secret_hash, client_name: form.client_name,
      scopes: form.scopes.split(",").map(s => s.trim()).filter(Boolean),
      redirect_uris: form.redirect_uris.split(",").map(s => s.trim()).filter(Boolean),
    });
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    toast({ title: "OAuth client yaratildi", description: `Secret (bir marta): ${secret}`, duration: 30000 });
    navigator.clipboard.writeText(`client_id: ${client_id}\nclient_secret: ${secret}`);
    setForm({ client_name: "", scopes: "user:read,user:write", redirect_uris: "" });
    load();
  };
  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4 bg-white/5 border-white/10">
        <h3 className="font-semibold mb-3">Yangi OAuth 2.0 Client</h3>
        <div className="grid md:grid-cols-4 gap-2">
          <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Client nomi" className="bg-white/5 border-white/10" />
          <Input value={form.scopes} onChange={e => setForm({ ...form, scopes: e.target.value })} placeholder="scopes (vergul bilan)" className="bg-white/5 border-white/10" />
          <Input value={form.redirect_uris} onChange={e => setForm({ ...form, redirect_uris: e.target.value })} placeholder="redirect URIs (vergul bilan)" className="bg-white/5 border-white/10" />
          <Button onClick={create} className="bg-[#2F80ED] hover:bg-[#2F80ED]/80"><Plus className="w-4 h-4 mr-1" />Yaratish</Button>
        </div>
      </Card>
      <Card className="bg-white/5 border-white/10 overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="border-white/10">
            <TableHead className="text-white/70">Client Name</TableHead>
            <TableHead className="text-white/70">Client ID</TableHead>
            <TableHead className="text-white/70">Scopes</TableHead>
            <TableHead className="text-white/70">Status</TableHead>
            <TableHead className="text-white/70">Yaratilgan</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map(c => (
              <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-sm">{c.client_name}</TableCell>
                <TableCell className="font-mono text-xs">{c.client_id} <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.client_id); toast({ title: "Nusxa olindi" }); }}><Copy className="w-3 h-3" /></Button></TableCell>
                <TableCell className="text-xs">{c.scopes.join(", ")}</TableCell>
                <TableCell>{c.is_active ? <Badge className="bg-emerald-500/20 text-emerald-300">Faol</Badge> : <Badge className="bg-red-500/20 text-red-300">Nofaol</Badge>}</TableCell>
                <TableCell className="text-xs text-white/60">{new Date(c.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============ Partners ============
function PartnersPanel() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("api_partners").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  return (
    <Card className="bg-white/5 border-white/10 overflow-x-auto mt-4">
      <Table>
        <TableHeader><TableRow className="border-white/10">
          <TableHead className="text-white/70">Hamkor</TableHead>
          <TableHead className="text-white/70">Status</TableHead>
          <TableHead className="text-white/70">Tier</TableHead>
          <TableHead className="text-white/70">Email</TableHead>
          <TableHead className="text-white/70">IP Whitelist</TableHead>
          <TableHead className="text-white/70">Domains</TableHead>
          <TableHead className="text-white/70">Yaratilgan</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {items.map(p => (
            <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="text-sm font-medium">{p.name}</TableCell>
              <TableCell><Badge className={p.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : p.status === "pending" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}>{p.status}</Badge></TableCell>
              <TableCell><Badge variant="outline" className="border-white/20">{p.tier}</Badge></TableCell>
              <TableCell className="text-xs">{p.email}</TableCell>
              <TableCell className="text-xs">{(p.ip_whitelist || []).length || "—"}</TableCell>
              <TableCell className="text-xs">{(p.allowed_domains || []).length || "—"}</TableCell>
              <TableCell className="text-xs text-white/60">{new Date(p.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ============ Webhooks ============
function WebhooksPanel() {
  const [hooks, setHooks] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const [{ data: h }, { data: d }] = await Promise.all([
      supabase.from("api_webhooks").select("*, api_partners(name)").order("created_at", { ascending: false }),
      supabase.from("api_webhook_deliveries").select("id, webhook_id, event, status, attempts, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    setHooks(h ?? []); setDeliveries(d ?? []);
  })(); }, []);
  return (
    <div className="space-y-4 mt-4">
      <Card className="bg-white/5 border-white/10 overflow-x-auto">
        <div className="p-3 text-sm font-semibold text-white/80">Webhooks ({hooks.length})</div>
        <Table>
          <TableHeader><TableRow className="border-white/10">
            <TableHead className="text-white/70">Hamkor</TableHead>
            <TableHead className="text-white/70">URL</TableHead>
            <TableHead className="text-white/70">Events</TableHead>
            <TableHead className="text-white/70">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {hooks.map(h => (
              <TableRow key={h.id} className="border-white/5"><TableCell className="text-sm">{h.api_partners?.name}</TableCell><TableCell className="text-xs font-mono">{h.url}</TableCell><TableCell className="text-xs">{h.events?.join(", ")}</TableCell><TableCell>{h.is_active ? <Badge className="bg-emerald-500/20 text-emerald-300">Faol</Badge> : <Badge className="bg-red-500/20 text-red-300">Nofaol</Badge>}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card className="bg-white/5 border-white/10 overflow-x-auto">
        <div className="p-3 text-sm font-semibold text-white/80">So'nggi 50 ta yetkazish</div>
        <Table>
          <TableHeader><TableRow className="border-white/10">
            <TableHead className="text-white/70">Event</TableHead>
            <TableHead className="text-white/70">Status</TableHead>
            <TableHead className="text-white/70">Urinishlar</TableHead>
            <TableHead className="text-white/70">Vaqt</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {deliveries.map(d => (
              <TableRow key={d.id} className="border-white/5"><TableCell className="text-xs font-mono">{d.event}</TableCell><TableCell><Badge className={d.status === "success" ? "bg-emerald-500/20 text-emerald-300" : d.status === "pending" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}>{d.status}</Badge></TableCell><TableCell className="text-xs">{d.attempts}</TableCell><TableCell className="text-xs text-white/60">{new Date(d.created_at).toLocaleString()}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============ Monitoring ============
function MonitoringPanel() {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [form, setForm] = useState({ name: "", metric: "error_rate", threshold: 5, window_minutes: 5, notify_email: "", notify_telegram_chat_id: "" });
  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("api_monitoring_alerts").select("*").order("created_at", { ascending: false });
    setAlerts((data ?? []) as AlertRule[]);
  };
  const create = async () => {
    if (!form.name) return toast({ title: "Alert nomi kerak", variant: "destructive" });
    const { error } = await supabase.from("api_monitoring_alerts").insert({ ...form, threshold: Number(form.threshold), window_minutes: Number(form.window_minutes) });
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    toast({ title: "Alert qo'shildi" });
    setForm({ name: "", metric: "error_rate", threshold: 5, window_minutes: 5, notify_email: "", notify_telegram_chat_id: "" });
    load();
  };
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("api_monitoring_alerts").update({ is_active: !active }).eq("id", id);
    load();
  };
  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4 bg-white/5 border-white/10">
        <h3 className="font-semibold mb-3">Yangi monitoring alert</h3>
        <div className="grid md:grid-cols-6 gap-2">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Alert nomi" className="bg-white/5 border-white/10" />
          <select value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })} className="bg-white/5 border border-white/10 rounded px-2 text-sm">
            <option value="error_rate">Xato foizi (%)</option>
            <option value="latency_p95">Latency P95 (ms)</option>
            <option value="request_volume">Requests</option>
            <option value="rate_limit_hits">Rate limit hits</option>
            <option value="auth_failures">Auth failures</option>
          </select>
          <Input type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: Number(e.target.value) })} placeholder="Threshold" className="bg-white/5 border-white/10" />
          <Input type="number" value={form.window_minutes} onChange={e => setForm({ ...form, window_minutes: Number(e.target.value) })} placeholder="Window (min)" className="bg-white/5 border-white/10" />
          <Input value={form.notify_email} onChange={e => setForm({ ...form, notify_email: e.target.value })} placeholder="Email" className="bg-white/5 border-white/10" />
          <Button onClick={create} className="bg-[#2F80ED] hover:bg-[#2F80ED]/80"><Plus className="w-4 h-4 mr-1" />Qo'shish</Button>
        </div>
      </Card>
      <Card className="bg-white/5 border-white/10 overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="border-white/10">
            <TableHead className="text-white/70">Nomi</TableHead>
            <TableHead className="text-white/70">Metric</TableHead>
            <TableHead className="text-white/70">Threshold</TableHead>
            <TableHead className="text-white/70">Window</TableHead>
            <TableHead className="text-white/70">Ishga tushgan</TableHead>
            <TableHead className="text-white/70">Notify</TableHead>
            <TableHead className="text-white/70">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {alerts.map(a => (
              <TableRow key={a.id} className="border-white/5">
                <TableCell className="text-sm">{a.name}</TableCell>
                <TableCell><code className="text-xs text-purple-300">{a.metric}</code></TableCell>
                <TableCell className="text-xs">{a.operator} {a.threshold}</TableCell>
                <TableCell className="text-xs">{a.window_minutes} min</TableCell>
                <TableCell className="text-xs">{a.trigger_count} marta{a.last_triggered_at ? ` · ${new Date(a.last_triggered_at).toLocaleDateString()}` : ""}</TableCell>
                <TableCell className="text-xs">{a.notify_email || a.notify_telegram_chat_id || "—"}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => toggle(a.id, a.is_active)}>{a.is_active ? <Badge className="bg-emerald-500/20 text-emerald-300">ON</Badge> : <Badge className="bg-white/10">OFF</Badge>}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============ Logs ============
function LogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState({ status: "", endpoint: "" });
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    let qry = supabase.from("api_request_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter.status) qry = qry.gte("status_code", Number(filter.status)).lt("status_code", Number(filter.status) + 100);
    if (filter.endpoint) qry = qry.ilike("endpoint", `%${filter.endpoint}%`);
    const { data } = await qry;
    setLogs(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); const t = setInterval(load, 15_000); return () => clearInterval(t); }, [filter.status, filter.endpoint]);
  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-2 flex-wrap">
        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="bg-white/5 border border-white/10 rounded px-2 py-2 text-sm">
          <option value="">Barcha status</option>
          <option value="200">2xx Success</option>
          <option value="400">4xx Client error</option>
          <option value="500">5xx Server error</option>
        </select>
        <Input value={filter.endpoint} onChange={e => setFilter({ ...filter, endpoint: e.target.value })} placeholder="Endpoint filter..." className="bg-white/5 border-white/10 w-64" />
        <Button variant="outline" onClick={load} className="border-white/20 text-white"><RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />Yangilash</Button>
        <div className="ml-auto text-xs text-white/50 self-center">Har 15 sekundda avtomatik yangilanadi</div>
      </div>
      <Card className="bg-white/5 border-white/10 overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="border-white/10">
            <TableHead className="text-white/70">Vaqt</TableHead>
            <TableHead className="text-white/70">Method</TableHead>
            <TableHead className="text-white/70">Endpoint</TableHead>
            <TableHead className="text-white/70">Status</TableHead>
            <TableHead className="text-white/70">Latency</TableHead>
            <TableHead className="text-white/70">IP</TableHead>
            <TableHead className="text-white/70">Xato</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {logs.map(l => (
              <TableRow key={l.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-xs text-white/60">{new Date(l.created_at).toLocaleTimeString()}</TableCell>
                <TableCell className="text-xs font-mono">{l.method}</TableCell>
                <TableCell className="text-xs font-mono">{l.endpoint}</TableCell>
                <TableCell><Badge className={STATUS_COLOR(l.status_code)}>{l.status_code}</Badge></TableCell>
                <TableCell className="text-xs">{l.response_time_ms} ms</TableCell>
                <TableCell className="text-xs text-white/60">{l.ip_address}</TableCell>
                <TableCell className="text-xs text-red-300 truncate max-w-[240px]">{l.error_message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============ Analytics ============
function AnalyticsPanel() {
  const [range, setRange] = useState(7);
  const [byChannel, setByChannel] = useState<any[]>([]);
  const [byDay, setByDay] = useState<any[]>([]);
  const [byStatus, setByStatus] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const since = new Date(Date.now() - range * 86400_000).toISOString();
    const { data } = await supabase.from("api_request_logs").select("created_at, endpoint, status_code, user_agent").gte("created_at", since).limit(10000);
    const rows = data ?? [];
    // by day
    const days: Record<string, number> = {};
    rows.forEach((r: any) => { const d = r.created_at.slice(0, 10); days[d] = (days[d] || 0) + 1; });
    setByDay(Object.entries(days).sort().map(([date, count]) => ({ date, count })));
    // by status class
    const st: Record<string, number> = { "2xx": 0, "4xx": 0, "5xx": 0 };
    rows.forEach((r: any) => { const c = r.status_code; st[c < 400 ? "2xx" : c < 500 ? "4xx" : "5xx"]++; });
    setByStatus(Object.entries(st).map(([name, value]) => ({ name, value })));
    // by channel (from user agent)
    const ch: Record<string, number> = { Android: 0, iOS: 0, Web: 0, Other: 0 };
    rows.forEach((r: any) => {
      const ua = (r.user_agent || "").toLowerCase();
      if (ua.includes("android")) ch.Android++;
      else if (ua.includes("iphone") || ua.includes("ios") || ua.includes("ipad")) ch.iOS++;
      else if (ua.includes("mozilla") || ua.includes("chrome")) ch.Web++;
      else ch.Other++;
    });
    setByChannel(Object.entries(ch).map(([name, value]) => ({ name, value })));
  })(); }, [range]);
  const COLORS = ["#2F80ED", "#7B61FF", "#10B981", "#F59E0B", "#EF4444"];
  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-2">
        {[1, 7, 30, 90].map(d => <Button key={d} size="sm" variant={range === d ? "default" : "outline"} onClick={() => setRange(d)} className={range === d ? "bg-[#2F80ED]" : "border-white/20 text-white"}>{d}k</Button>)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-white/5 border-white/10">
          <h3 className="text-sm font-semibold mb-3">Requests / day</h3>
          <ResponsiveContainer width="100%" height={220}><LineChart data={byDay}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" /><XAxis dataKey="date" stroke="#ffffff60" fontSize={10} /><YAxis stroke="#ffffff60" fontSize={10} /><Tooltip contentStyle={{ background: "#0A2540" }} /><Line type="monotone" dataKey="count" stroke="#2F80ED" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </Card>
        <Card className="p-4 bg-white/5 border-white/10">
          <h3 className="text-sm font-semibold mb-3">Kanal bo'yicha</h3>
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={byChannel} dataKey="value" nameKey="name" outerRadius={80} label>{byChannel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "#0A2540" }} /><Legend /></PieChart></ResponsiveContainer>
        </Card>
        <Card className="p-4 bg-white/5 border-white/10 md:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Status class</h3>
          <ResponsiveContainer width="100%" height={200}><BarChart data={byStatus}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" /><XAxis dataKey="name" stroke="#ffffff60" fontSize={11} /><YAxis stroke="#ffffff60" fontSize={11} /><Tooltip contentStyle={{ background: "#0A2540" }} /><Bar dataKey="value" fill="#7B61FF" /></BarChart></ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ============ Docs ============
function DocsPanel() {
  return (
    <Card className="p-6 bg-white/5 border-white/10 mt-4 space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5" />Developer Portal</h2>
      <p className="text-white/70 text-sm">MED1.UZ API to'liq hujjatlari va interaktiv OpenAPI 3.0 tekshirgichi:</p>
      <div className="flex flex-wrap gap-3">
        <a href="/developers" target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#2F80ED] hover:bg-[#2F80ED]/80 text-white text-sm font-medium"><Rocket className="w-4 h-4" />Developer Portal</a>
        <a href="/api-docs" target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-medium"><FileCode className="w-4 h-4" />OpenAPI / Swagger UI</a>
        <a href="/openapi.json" target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-medium"><Download className="w-4 h-4" />openapi.json</a>
      </div>
      <div className="text-xs text-white/50 pt-4 border-t border-white/10">
        Base URL (Production): <code className="text-purple-300">https://med1.uz/api-gateway</code><br />
        Base URL (Sandbox): <code className="text-purple-300">https://med1.uz/api-gateway/sandbox</code><br />
        Auth: <code className="text-purple-300">Authorization: Bearer &lt;JWT&gt;</code> yoki <code className="text-purple-300">X-Api-Key: &lt;key&gt;</code>
      </div>
    </Card>
  );
}

// ============ SDKs ============
function SDKsPanel() {
  const [items, setItems] = useState<SdkVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("api_sdk_versions").select("*").order("language").order("released_at", { ascending: false });
    if (error) {
      toast({ title: "SDK ro'yxatini yuklab bo'lmadi", description: error.message, variant: "destructive" });
    }
    setItems((data ?? []) as SdkVersion[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const syncSdks = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("sdk-sync", { method: "POST" });
      if (error) {
        let details = error.message;
        const context = (error as any).context;
        if (context?.text) details = await context.text();
        throw new Error(details);
      }
      const missing = (data?.items ?? []).filter((item: any) => item.download_status === "missing" || item.download_status === "error").length;
      setSyncMessage(`Sinxronizatsiya tugadi: ${data?.synced ?? 0} SDK, muammoli havola: ${missing}.`);
      toast({ title: "SDK sinxronizatsiya qilindi", description: `${data?.synced ?? 0} ta versiya qayta tekshirildi.` });
      await load();
    } catch (e: any) {
      toast({ title: "SDK sync xatosi", description: e.message, variant: "destructive" });
      setSyncMessage(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const grouped = useMemo(() => {
    const g: Record<string, SdkVersion[]> = {};
    items.forEach(i => { (g[i.language] = g[i.language] || []).push(i); });
    return g;
  }, [items]);
  const installFor = (lang: string, version: string) => {
    const l = lang.toLowerCase();
    if (l === "javascript" || l === "typescript" || l === "nodejs" || l === "react-native")
      return `npm i @med1uz/api@${version}`;
    if (l === "flutter" || l === "dart") return `flutter pub add med1_api:^${version}`;
    if (l === "python") return `pip install med1-api==${version}`;
    if (l === "php" || l === "laravel") return `composer require med1uz/api-php:^${version}`;
    if (l === "kotlin") return `// Add Med1Client.kt to your project (single-file drop-in)`;
    if (l === "swift") return `// Add Med1Client.swift to your Xcode project`;
    if (l === "curl") return `curl -H "x-api-key: $MED1_KEY" https://med1.uz/api-gateway/v1/ping`;
    return "";
  };
  const statusLabel = (status?: SdkLinkStatus | null, code?: number | null) => {
    if (status === "available") return code ? `Mavjud · HTTP ${code}` : "Mavjud";
    if (status === "missing") return code ? `Topilmadi · HTTP ${code}` : "Topilmadi";
    if (status === "error") return "Tekshiruv xatosi";
    if (status === "not_configured") return "Hali ulanmagan";
    return "Tekshirilmagan";
  };
  const statusBadgeClass = (status?: SdkLinkStatus | null) => {
    if (status === "available") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (status === "missing" || status === "error") return "bg-red-500/20 text-red-300 border-red-500/40";
    return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  };
  const formatRetry = (iso?: string | null) => {
    if (!iso) return "24 soat ichida";
    return new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  };

  if (loading) {
    return <Card className="p-4 bg-white/5 border-white/10 mt-4 text-white/70">SDK ro'yxati tekshirilmoqda…</Card>;
  }

  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4 bg-white/5 border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="font-semibold">SDK auto-sync</h3>
          <p className="text-sm text-white/60">Admin panel med1.uz/sdk fayllarini va GitHub repository holatini qayta tekshiradi, DBdagi versiya/download_url qiymatlarini yangilaydi.</p>
          {syncMessage && <p className="text-xs text-white/50 mt-2">{syncMessage}</p>}
        </div>
        <Button onClick={syncSdks} disabled={syncing} className="bg-[#2F80ED] hover:bg-[#2F80ED]/80 shrink-0">
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Tekshirilmoqda" : "SDK sync"}
        </Button>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([lang, versions]) => {
          const latest = versions.find(v => v.is_latest) || versions[0];
          const install = installFor(lang, latest?.version || "0.1.0");
          const downloadOk = latest?.download_status === "available";
          const downloadProblem = latest?.download_status === "missing" || latest?.download_status === "error";
          const repoOk = latest?.repository_url && latest.repository_status === "available";
          return (
            <Card key={lang} className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2 gap-3">
                <h3 className="font-semibold capitalize">{lang} SDK</h3>
                <Badge className="bg-emerald-500/20 text-emerald-300 shrink-0">v{latest?.version}</Badge>
              </div>
              <p className="text-xs text-white/60 mb-3 line-clamp-3">{latest?.changelog}</p>
              {install && (
                <pre className="text-[11px] bg-black/40 rounded p-2 mb-3 overflow-x-auto text-emerald-300">{install}</pre>
              )}

              <div className="space-y-2 mb-3">
                <Badge className={`${statusBadgeClass(latest?.download_status)} border text-[11px]`}>
                  {downloadOk ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                  Download: {statusLabel(latest?.download_status, latest?.download_status_code)}
                </Badge>
                {downloadProblem && (
                  <div className="text-xs text-red-200 bg-red-500/10 border border-red-500/20 rounded p-2">
                    Fayl hozir topilmadi. Qayta tekshiruv: {formatRetry(latest?.next_retry_at)}. Muqobil yo'l: install buyrug'idan foydalaning yoki Developer Portal orqali kodni nusxalang.
                  </div>
                )}
                {!downloadProblem && latest?.download_checked_at && (
                  <div className="text-[11px] text-white/40">Oxirgi tekshiruv: {formatRetry(latest.download_checked_at)}</div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                {latest?.download_url && downloadOk && <a href={latest.download_url} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">Yuklab olish</a>}
                {latest?.download_url && !downloadOk && <span className="text-white/40">Yuklab olish vaqtincha yopiq</span>}
                {repoOk && <a href={latest.repository_url!} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">Repository</a>}
                {!repoOk && <span className="text-white/40">Repository tayyor bo'lgach avtomatik yoqiladi</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============ Sandbox ============
function SandboxPanel() {
  const [tested, setTested] = useState<string>("");
  const [testing, setTesting] = useState(false);
  const testPing = async () => {
    setTesting(true);
    try {
      const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.functions.supabase.co/api-gateway/v1/ping`;
      const r = await fetch(url, { headers: { "x-api-key": "sandbox_test_key" } });
      const text = await r.text();
      setTested(`Status: ${r.status}\n\n${text}`);
    } catch (e: any) {
      setTested(`Error: ${e.message}`);
    }
    setTesting(false);
  };
  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4 bg-white/5 border-white/10">
        <h3 className="font-semibold mb-2">Sandbox muhiti</h3>
        <p className="text-sm text-white/70 mb-4">Test API kalitlar bilan real ma'lumotlarga ta'sir qilmasdan integratsiyani sinang. Sandbox kalitlar Partner Dashboard'da <code className="text-purple-300">environment: sandbox</code> bilan yaratiladi.</p>
        <div className="grid md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded bg-white/5 border border-white/10"><div className="text-white/60 mb-1">Test Med Coin balance</div><div className="font-mono text-emerald-300">10,000 MC</div></div>
          <div className="p-3 rounded bg-white/5 border border-white/10"><div className="text-white/60 mb-1">Test AI limit</div><div className="font-mono text-emerald-300">Unlimited</div></div>
          <div className="p-3 rounded bg-white/5 border border-white/10"><div className="text-white/60 mb-1">Test payment</div><div className="font-mono text-emerald-300">Auto-success</div></div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={testPing} disabled={testing} className="bg-[#2F80ED] hover:bg-[#2F80ED]/80"><Beaker className="w-4 h-4 mr-1" />{testing ? "Testing..." : "Ping /v1/ping"}</Button>
        </div>
        {tested && <pre className="mt-4 p-3 bg-black/40 rounded text-xs text-emerald-300 overflow-x-auto">{tested}</pre>}
      </Card>
    </div>
  );
}
