import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  KeyRound,
  Webhook,
  Activity,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";

const WEBHOOK_EVENTS = [
  "appointment.created",
  "appointment.updated",
  "patient.created",
  "payment.paid",
  "lab.result.ready",
  "ai.report.generated",
];

type Partner = {
  id: string;
  org_name: string;
  org_type: string;
  status: string;
  tier: string;
  contact_email: string;
  ip_whitelist: string[];
  allowed_domains: string[];
  approved_at: string | null;
  created_at: string;
};

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  environment: string;
  scopes: string[];
  rate_limit_per_min: number;
  rate_limit_per_day: number;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

type Application = {
  id: string;
  status: string;
  org_name: string;
  requested_scopes: string[];
  use_case: string;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type WebhookRow = {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_status: string | null;
  last_delivery_at: string | null;
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Ko'rib chiqilmoqda", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  approved: { label: "Tasdiqlangan", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  rejected: { label: "Rad etilgan", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  suspended: { label: "To'xtatilgan", cls: "bg-zinc-500/15 text-zinc-700 border-zinc-500/30" },
};

export default function PartnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [stats, setStats] = useState({ total: 0, errors: 0, avgMs: 0 });

  // Webhook dialog
  const [whOpen, setWhOpen] = useState(false);
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [whSaving, setWhSaving] = useState(false);

  useEffect(() => {
    document.title = "Partner Dashboard — MED-ALL AI";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?redirect=/partner");
      return;
    }
    void loadAll();
  }, [user, authLoading]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data: p } = await supabase
        .from("api_partners")
        .select("*")
        .eq("owner_user_id", user!.id)
        .maybeSingle();

      const { data: app } = await supabase
        .from("api_partner_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setPartner(p as any);
      setApplication(app as any);

      if (p) {
        const [{ data: ks }, { data: whs }, { data: logs }] = await Promise.all([
          supabase
            .from("api_keys")
            .select("*")
            .eq("partner_id", p.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("api_webhooks")
            .select("*")
            .eq("partner_id", p.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("api_request_logs")
            .select("status_code,response_time_ms")
            .eq("partner_id", p.id)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
            .limit(1000),
        ]);
        setKeys((ks as any) || []);
        setWebhooks((whs as any) || []);
        const arr = (logs as any[]) || [];
        const total = arr.length;
        const errors = arr.filter((l) => Number(l.status_code) >= 400).length;
        const avgMs = total
          ? Math.round(arr.reduce((s, l) => s + (Number(l.response_time_ms) || 0), 0) / total)
          : 0;
        setStats({ total, errors, avgMs });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = () =>
    "whsec_" +
    Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const toggleEvt = (e: string) =>
    setWhEvents((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));

  const saveWebhook = async () => {
    if (!partner) return;
    if (!whUrl || !whUrl.startsWith("https://")) {
      toast.error("HTTPS URL kiriting");
      return;
    }
    if (whEvents.length === 0) {
      toast.error("Kamida bitta event tanlang");
      return;
    }
    setWhSaving(true);
    const { error } = await supabase.from("api_webhooks").insert({
      partner_id: partner.id,
      url: whUrl,
      events: whEvents,
      secret: generateSecret(),
    });
    setWhSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Webhook qo'shildi");
    setWhOpen(false);
    setWhUrl("");
    setWhEvents([]);
    void loadAll();
  };

  const toggleWebhook = async (w: WebhookRow) => {
    const { error } = await supabase
      .from("api_webhooks")
      .update({ is_active: !w.is_active })
      .eq("id", w.id);
    if (error) return toast.error(error.message);
    void loadAll();
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm("Webhookni o'chirmoqchimisiz?")) return;
    const { error } = await supabase.from("api_webhooks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("O'chirildi");
    void loadAll();
  };

  const errorRate = useMemo(
    () => (stats.total ? Math.round((stats.errors / stats.total) * 100) : 0),
    [stats]
  );

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No partner & no application — invite to apply
  if (!partner && !application) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <ShieldCheck className="w-12 h-12 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold mb-2">Hamkor hisobi topilmadi</h1>
          <p className="text-muted-foreground mb-6">
            API'dan foydalanish uchun avval Developer Portal'dan ariza topshiring.
          </p>
          <Button asChild size="lg">
            <Link to="/developers">
              <Send className="w-4 h-4 mr-2" /> Ariza topshirish
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Application exists but not yet approved
  if (!partner && application) {
    const sb = STATUS_BADGE[application.status] || STATUS_BADGE.pending;
    return (
      <div className="min-h-screen container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto p-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Ariza statusi</h1>
            <Badge variant="outline" className={sb.cls}>{sb.label}</Badge>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Tashkilot</dt>
              <dd className="font-medium">{application.org_name}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Topshirilgan</dt>
              <dd>{new Date(application.created_at).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Talab qilingan scopes</dt>
              <dd className="font-mono text-xs text-right">
                {application.requested_scopes.join(", ") || "—"}
              </dd>
            </div>
            {application.review_notes && (
              <div className="pt-2">
                <dt className="text-muted-foreground mb-1">Admin izohi</dt>
                <dd className="p-3 rounded bg-muted/40">{application.review_notes}</dd>
              </div>
            )}
          </dl>
          <p className="text-sm text-muted-foreground mt-6 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Odatda 1–3 ish kuni ichida ko'rib chiqamiz va email yuboramiz.
          </p>
        </Card>
      </div>
    );
  }

  // Partner exists
  const sb = STATUS_BADGE[partner!.status] || STATUS_BADGE.pending;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{partner!.org_name}</h1>
            <p className="text-sm text-muted-foreground">
              Partner Dashboard · {partner!.contact_email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={sb.cls}>{sb.label}</Badge>
            <Badge variant="secondary" className="uppercase">{partner!.tier}</Badge>
          </div>
        </div>

        {partner!.status === "suspended" && (
          <Card className="p-4 border-red-500/30 bg-red-500/5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm">
              Hisobingiz vaqtinchalik to'xtatilgan. API so'rovlari rad etilmoqda. Iltimos,{" "}
              <Link to="/contact" className="underline">qo'llab-quvvatlash</Link> bilan bog'laning.
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">7 kunlik so'rovlar</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Xato darajasi</div>
            <div className="text-2xl font-bold mt-1">{errorRate}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">O'rtacha javob</div>
            <div className="text-2xl font-bold mt-1">{stats.avgMs} ms</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Faol kalitlar</div>
            <div className="text-2xl font-bold mt-1">
              {keys.filter((k) => k.is_active).length}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="keys">
          <TabsList>
            <TabsTrigger value="keys"><KeyRound className="w-4 h-4 mr-1" /> API kalitlar</TabsTrigger>
            <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-1" /> Webhooks</TabsTrigger>
            <TabsTrigger value="application"><Activity className="w-4 h-4 mr-1" /> Ariza</TabsTrigger>
          </TabsList>

          {/* Keys */}
          <TabsContent value="keys" className="mt-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">API kalitlar</h2>
                  <p className="text-sm text-muted-foreground">
                    Yangi kalit so'rash uchun{" "}
                    <Link to="/contact" className="underline">qo'llab-quvvatlashga</Link> yozing.
                  </p>
                </div>
              </div>
              {keys.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Hali kalitlar yo'q. Admin tasdiqlagach bu yerda ko'rinadi.
                </div>
              ) : (
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded border"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{k.name}</span>
                          <Badge variant={k.environment === "live" ? "default" : "secondary"}>
                            {k.environment}
                          </Badge>
                          {!k.is_active && <Badge variant="destructive">revoked</Badge>}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground mt-1">
                          {k.key_prefix}••••••••••••
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-muted">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>{k.rate_limit_per_min}/min · {k.rate_limit_per_day}/day</div>
                        <div>
                          Oxirgi: {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Webhooks */}
          <TabsContent value="webhooks" className="mt-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">Webhooks</h2>
                  <p className="text-sm text-muted-foreground">
                    Eventlar HMAC-SHA256 bilan imzolanadi (<code>X-Mall-Signature</code>).
                  </p>
                </div>
                <Button onClick={() => setWhOpen(true)} disabled={partner!.status !== "approved"}>
                  <Plus className="w-4 h-4 mr-1" /> Qo'shish
                </Button>
              </div>
              {webhooks.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Hali webhook yo'q.
                </div>
              ) : (
                <div className="space-y-2">
                  {webhooks.map((w) => (
                    <div key={w.id} className="p-3 rounded border space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-mono text-sm truncate">{w.url}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                            {w.events.map((e) => (
                              <span key={e} className="px-1.5 py-0.5 rounded bg-muted">{e}</span>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Secret: <code>{w.secret.slice(0, 12)}••••</code>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => toggleWebhook(w)}>
                            {w.is_active ? "O'chirish" : "Yoqish"}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteWebhook(w.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-3">
                        <span className="flex items-center gap-1">
                          {w.is_active ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-zinc-500" />
                          )}
                          {w.is_active ? "Faol" : "Nofaol"}
                        </span>
                        {w.last_delivery_at && (
                          <span>
                            Oxirgi: {new Date(w.last_delivery_at).toLocaleString()} ·{" "}
                            {w.last_status || "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Application */}
          <TabsContent value="application" className="mt-4">
            <Card className="p-6 space-y-3">
              <h2 className="font-semibold">Hisob ma'lumotlari</h2>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">Tashkilot turi</dt>
                  <dd className="capitalize">{partner!.org_type}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">Tier</dt>
                  <dd className="uppercase">{partner!.tier}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">Ro'yxatdan o'tgan</dt>
                  <dd>{new Date(partner!.created_at).toLocaleDateString()}</dd>
                </div>
                {partner!.approved_at && (
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-muted-foreground">Tasdiqlangan</dt>
                    <dd>{new Date(partner!.approved_at).toLocaleDateString()}</dd>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">IP whitelist</dt>
                  <dd className="font-mono text-xs">
                    {partner!.ip_whitelist.length ? partner!.ip_whitelist.join(", ") : "Hammasi"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Allowed domains</dt>
                  <dd className="font-mono text-xs">
                    {partner!.allowed_domains.length ? partner!.allowed_domains.join(", ") : "Hammasi"}
                  </dd>
                </div>
              </dl>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Webhook dialog */}
      <Dialog open={whOpen} onOpenChange={setWhOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL (HTTPS)</Label>
              <Input
                placeholder="https://your-domain.com/webhooks/medall"
                value={whUrl}
                onChange={(e) => setWhUrl(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Eventlar</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((e) => (
                  <label
                    key={e}
                    className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/30"
                  >
                    <Checkbox
                      checked={whEvents.includes(e)}
                      onCheckedChange={() => toggleEvt(e)}
                    />
                    <span className="text-xs font-mono">{e}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhOpen(false)}>Bekor</Button>
            <Button onClick={saveWebhook} disabled={whSaving}>
              {whSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
