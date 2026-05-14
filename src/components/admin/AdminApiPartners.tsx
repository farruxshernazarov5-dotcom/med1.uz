import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, XCircle, Key, Copy, Power, RefreshCw, Building2,
  Activity, AlertTriangle, Plug,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ALL_SCOPES = [
  "clinic:read", "doctor:read", "diagnostics:read", "pharmacy:read",
  "booking:write", "emr:read", "ai:chat", "payment:write",
];

interface Application {
  id: string;
  user_id: string;
  org_name: string;
  org_type: string;
  contact_email: string;
  contact_phone: string | null;
  inn: string | null;
  website: string | null;
  use_case: string;
  requested_scopes: string[];
  status: string;
  review_notes: string | null;
  created_at: string;
}

interface Partner {
  id: string;
  owner_user_id: string;
  org_name: string;
  org_type: string;
  contact_email: string;
  status: string;
  tier: string;
  ip_whitelist: string[];
  allowed_domains: string[];
  created_at: string;
}

interface ApiKey {
  id: string;
  partner_id: string;
  name: string;
  key_prefix: string;
  environment: string;
  scopes: string[];
  rate_limit_per_min: number;
  rate_limit_per_day: number;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateRawKey(env: "live" | "test") {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes).map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
  return `mall_${env}_${body}`;
}

export default function AdminApiPartners() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [newKeyName, setNewKeyName] = useState("Default key");
  const [newKeyEnv, setNewKeyEnv] = useState<"live" | "test">("live");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [usage, setUsage] = useState<Record<string, { total: number; errors: number }>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    const [a, p, k] = await Promise.all([
      supabase.from("api_partner_applications").select("*").order("created_at", { ascending: false }),
      supabase.from("api_partners").select("*").order("created_at", { ascending: false }),
      supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
    ]);
    if (a.data) setApps(a.data as Application[]);
    if (p.data) setPartners(p.data as Partner[]);
    if (k.data) setKeys(k.data as ApiKey[]);

    // Load 7-day usage per partner
    if (p.data?.length) {
      const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
      const { data: logs } = await supabase
        .from("api_request_logs")
        .select("partner_id, status_code")
        .gte("created_at", since);
      const map: Record<string, { total: number; errors: number }> = {};
      (logs || []).forEach((l: any) => {
        if (!l.partner_id) return;
        map[l.partner_id] = map[l.partner_id] || { total: 0, errors: 0 };
        map[l.partner_id].total++;
        if (l.status_code >= 400) map[l.partner_id].errors++;
      });
      setUsage(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const approveApplication = async (app: Application) => {
    const { data: partner, error: pErr } = await supabase
      .from("api_partners")
      .insert({
        owner_user_id: app.user_id,
        org_name: app.org_name,
        org_type: app.org_type,
        contact_email: app.contact_email,
        contact_phone: app.contact_phone,
        inn: app.inn,
        website: app.website,
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      })
      .select()
      .single();

    if (pErr || !partner) {
      toast({ title: "Xato", description: pErr?.message || "Hamkor yaratilmadi", variant: "destructive" });
      return;
    }

    await supabase
      .from("api_partner_applications")
      .update({
        status: "approved",
        partner_id: partner.id,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", app.id);

    toast({ title: "Tasdiqlandi", description: `${app.org_name} hamkor sifatida ro'yxatdan o'tdi` });
    reload();
  };

  const rejectApplication = async (app: Application) => {
    const notes = prompt("Rad etish sababi (ixtiyoriy):") || null;
    await supabase
      .from("api_partner_applications")
      .update({
        status: "rejected",
        review_notes: notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", app.id);
    toast({ title: "Rad etildi" });
    reload();
  };

  const togglePartnerStatus = async (p: Partner) => {
    const next = p.status === "approved" ? "suspended" : "approved";
    await supabase.from("api_partners").update({ status: next }).eq("id", p.id);
    toast({ title: next === "approved" ? "Faollashtirildi" : "To'xtatildi" });
    reload();
  };

  const openKeyDialog = (p: Partner) => {
    setSelectedPartner(p);
    setNewKeyScopes(["clinic:read", "doctor:read"]);
    setNewKeyName("Default key");
    setNewKeyEnv("live");
    setGeneratedKey(null);
    setKeyDialogOpen(true);
  };

  const createKey = async () => {
    if (!selectedPartner) return;
    const raw = generateRawKey(newKeyEnv);
    const hash = await sha256Hex(raw);
    const prefix = raw.slice(0, 16);
    const { error } = await supabase.from("api_keys").insert({
      partner_id: selectedPartner.id,
      name: newKeyName || "Default key",
      key_prefix: prefix,
      key_hash: hash,
      environment: newKeyEnv,
      scopes: newKeyScopes,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Xato", description: error.message, variant: "destructive" });
      return;
    }
    setGeneratedKey(raw);
    reload();
  };

  const revokeKey = async (k: ApiKey) => {
    if (!confirm(`"${k.name}" kalitini o'chirishni tasdiqlaysizmi?`)) return;
    await supabase.from("api_keys").update({ is_active: false, revoked_at: new Date().toISOString() }).eq("id", k.id);
    toast({ title: "Kalit bekor qilindi" });
    reload();
  };

  const copyKey = (k: string) => {
    navigator.clipboard.writeText(k);
    toast({ title: "Nusxalandi" });
  };

  const pending = apps.filter((a) => a.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plug className="w-5 h-5 text-[#2F80ED]" />
            API Hamkorlar boshqaruvi
          </h2>
          <p className="text-white/50 text-xs mt-1">Hamkor tashkilotlar, API kalitlar va integratsiya monitoringi</p>
        </div>
        <Button size="sm" variant="outline" onClick={reload} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Kutmoqda" value={pending.length} icon={AlertTriangle} color="text-amber-400" />
        <StatCard label="Faol hamkorlar" value={partners.filter((p) => p.status === "approved").length} icon={CheckCircle2} color="text-emerald-400" />
        <StatCard label="API kalitlar" value={keys.filter((k) => k.is_active).length} icon={Key} color="text-[#2F80ED]" />
        <StatCard label="So'rovlar (7k)" value={Object.values(usage).reduce((s, u) => s + u.total, 0)} icon={Activity} color="text-violet-400" />
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="applications">Arizalar {pending.length > 0 && <Badge className="ml-2 bg-amber-500">{pending.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="partners">Hamkorlar ({partners.length})</TabsTrigger>
          <TabsTrigger value="keys">Kalitlar ({keys.length})</TabsTrigger>
        </TabsList>

        {/* APPLICATIONS */}
        <TabsContent value="applications" className="space-y-3 mt-4">
          {apps.length === 0 ? (
            <EmptyState text="Hozircha arizalar yo'q" />
          ) : apps.map((a) => (
            <Card key={a.id} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Building2 className="w-4 h-4 text-[#2F80ED]" />
                      <h3 className="font-semibold text-white">{a.org_name}</h3>
                      <Badge variant="outline" className="text-[10px]">{a.org_type}</Badge>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-white/60 mt-1">{a.contact_email} · {a.contact_phone || "—"} · INN: {a.inn || "—"}</p>
                    {a.website && <p className="text-xs text-[#2F80ED] mt-0.5">{a.website}</p>}
                    <p className="text-sm text-white/80 mt-2 leading-relaxed">{a.use_case}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.requested_scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                    {a.review_notes && (
                      <p className="text-xs text-amber-300 mt-2 italic">Eslatma: {a.review_notes}</p>
                    )}
                  </div>
                  {a.status === "pending" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => approveApplication(a)}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Tasdiqlash
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectApplication(a)}>
                        <XCircle className="w-4 h-4 mr-1" /> Rad etish
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* PARTNERS */}
        <TabsContent value="partners" className="space-y-3 mt-4">
          {partners.length === 0 ? (
            <EmptyState text="Tasdiqlangan hamkorlar yo'q" />
          ) : partners.map((p) => {
            const u = usage[p.id] || { total: 0, errors: 0 };
            const partnerKeys = keys.filter((k) => k.partner_id === p.id);
            return (
              <Card key={p.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-semibold text-white">{p.org_name}</h3>
                        <Badge variant="outline" className="text-[10px]">{p.org_type}</Badge>
                        <StatusBadge status={p.status} />
                        <Badge className="text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30">{p.tier}</Badge>
                      </div>
                      <p className="text-xs text-white/60 mt-1">{p.contact_email}</p>
                      <div className="flex gap-4 mt-3 text-xs">
                        <span className="text-white/70"><Activity className="w-3 h-3 inline mr-1" />{u.total} so'rov / 7 kun</span>
                        <span className={u.errors > 0 ? "text-red-400" : "text-white/40"}>
                          {u.errors} xato
                        </span>
                        <span className="text-white/70">{partnerKeys.filter((k) => k.is_active).length} faol kalit</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" className="bg-[#2F80ED] hover:bg-[#2F80ED]/90" onClick={() => openKeyDialog(p)}>
                        <Key className="w-4 h-4 mr-1" /> Yangi kalit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => togglePartnerStatus(p)}>
                        <Power className="w-4 h-4 mr-1" />
                        {p.status === "approved" ? "To'xtatish" : "Faollashtirish"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* KEYS */}
        <TabsContent value="keys" className="space-y-2 mt-4">
          {keys.length === 0 ? (
            <EmptyState text="API kalitlar yo'q" />
          ) : keys.map((k) => {
            const partner = partners.find((p) => p.id === k.partner_id);
            return (
              <Card key={k.id} className="bg-white/5 border-white/10">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Key className={`w-4 h-4 ${k.is_active ? "text-emerald-400" : "text-white/30"}`} />
                        <code className="text-xs text-white font-mono">{k.key_prefix}…</code>
                        <Badge variant="outline" className="text-[10px]">{k.environment}</Badge>
                        {!k.is_active && <Badge variant="destructive" className="text-[10px]">Bekor qilingan</Badge>}
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        {partner?.org_name || "—"} · {k.scopes.length} scope · so'nggi: {k.last_used_at ? new Date(k.last_used_at).toLocaleString("uz-UZ") : "hech qachon"}
                      </p>
                    </div>
                    {k.is_active && (
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => revokeKey(k)}>
                        Bekor qilish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* CREATE KEY DIALOG */}
      <Dialog open={keyDialogOpen} onOpenChange={(o) => { setKeyDialogOpen(o); if (!o) setGeneratedKey(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{generatedKey ? "Kalit yaratildi" : "Yangi API kalit"}</DialogTitle>
            <DialogDescription>
              {generatedKey
                ? "Kalitni hozir nusxalang — qaytadan ko'rsatilmaydi."
                : `Hamkor: ${selectedPartner?.org_name}`}
            </DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                <code className="text-xs font-mono break-all text-emerald-900">{generatedKey}</code>
              </div>
              <Button onClick={() => copyKey(generatedKey)} className="w-full">
                <Copy className="w-4 h-4 mr-2" /> Nusxalash
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Nomi</Label>
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
              </div>
              <div>
                <Label>Muhit</Label>
                <div className="flex gap-2 mt-1">
                  {(["live", "test"] as const).map((env) => (
                    <Button key={env} size="sm" variant={newKeyEnv === env ? "default" : "outline"}
                      onClick={() => setNewKeyEnv(env)} className="flex-1">{env}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Ruxsatlar (scopes)</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {ALL_SCOPES.map((s) => {
                    const active = newKeyScopes.includes(s);
                    return (
                      <button key={s} type="button"
                        onClick={() => setNewKeyScopes((prev) => active ? prev.filter((x) => x !== s) : [...prev, s])}
                        className={`text-xs px-2 py-1 rounded border transition ${active
                          ? "bg-[#2F80ED] text-white border-[#2F80ED]"
                          : "bg-white/5 text-white/60 border-white/10 hover:border-white/30"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {generatedKey ? (
              <Button onClick={() => setKeyDialogOpen(false)}>Yopish</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>Bekor qilish</Button>
                <Button onClick={createKey} disabled={newKeyScopes.length === 0}>Yaratish</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/50 uppercase">{label}</p>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    suspended: "bg-red-500/20 text-red-300 border-red-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return <Badge className={`text-[10px] ${map[status] || ""}`}>{status}</Badge>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center py-12 text-white/40 text-sm">{text}</p>;
}
