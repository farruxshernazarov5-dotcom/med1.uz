import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2, XCircle, ShieldAlert, Loader2, Ticket, Settings2, Gift,
  TrendingUp, AlertTriangle, Users, Plus, Trash2, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const sb = supabase as any;
const COLORS = ["#2F80ED", "#7B61FF", "#22D3EE", "#10B981", "#F59E0B", "#EF4444"];

type Referral = {
  id: string;
  code_text: string | null;
  referrer_id: string;
  referred_user_id: string | null;
  referred_email: string | null;
  referred_org_role: string | null;
  status: string;
  subscription_tier: string | null;
  reward_credits: number;
  reward_months: number;
  reward_ai_credits: number;
  created_at: string;
};

type PromoCode = {
  id: string;
  code: string;
  discount_pct: number;
  bonus_months: number;
  bonus_credits: number;
  applicable_tiers: any;
  max_uses: number | null;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
};

type Settings = {
  id: number;
  base_reward_basic: any;
  base_reward_premium: any;
  base_reward_ai: any;
  auto_approve: boolean;
  block_self_referral: boolean;
  ip_device_limit: number;
  min_subscription_amount?: number;
  qualify_within_days?: number;
  reward_hold_days?: number;
  cancel_on_refund?: boolean;
  cancel_on_unsubscribe_days?: number;
};

type FraudLog = {
  id: string;
  referral_id: string | null;
  kind: string;
  severity: string;
  notes: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  registered: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  subscribed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  fraud: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function ReferralAdmin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState<Referral[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fraud, setFraud] = useState<FraudLog[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        sb.from("referrals").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("referral_promo_codes").select("*").order("created_at", { ascending: false }),
        sb.from("referral_settings").select("*").eq("id", 1).maybeSingle(),
        sb.from("referral_fraud_log").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      setRefs(r1.data ?? []);
      setPromos(r2.data ?? []);
      setSettings(r3.data);
      setFraud(r4.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const updateRefStatus = async (id: string, status: "approved" | "rejected" | "fraud") => {
    const patch: any = { status, updated_at: new Date().toISOString() };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    const { error } = await sb.from("referrals").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Xato", description: error.message, variant: "destructive" });
      return;
    }
    // Trigger reward apply when approved
    if (status === "approved") {
      await sb.rpc("apply_referral_reward", { _referral_id: id });
    }
    if (status === "fraud") {
      await sb.from("referral_fraud_log").insert({
        referral_id: id, kind: "manual_flag", severity: "high", notes: "Admin marked as fraud",
      });
    }
    toast({ title: "Holat yangilandi", description: `Referral ${status}` });
    reload();
  };

  // ───────── filter referrals
  const filteredRefs = refs.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (q) {
      const s = q.toLowerCase();
      return (
        (r.referred_email ?? "").toLowerCase().includes(s) ||
        (r.code_text ?? "").toLowerCase().includes(s) ||
        (r.referred_org_role ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  // ───────── analytics
  const buildDaily = () => {
    const map: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map[`${d.getDate()}/${d.getMonth() + 1}`] = 0;
    }
    refs.forEach((r) => {
      const d = new Date(r.created_at);
      const k = `${d.getDate()}/${d.getMonth() + 1}`;
      if (k in map) map[k] += 1;
    });
    return Object.entries(map).map(([name, qiymat]) => ({ name, qiymat }));
  };
  const funnel = [
    { name: "Pending", value: refs.filter((r) => r.status === "pending").length },
    { name: "Registered", value: refs.filter((r) => r.status === "registered").length },
    { name: "Subscribed", value: refs.filter((r) => r.status === "subscribed").length },
    { name: "Approved", value: refs.filter((r) => r.status === "approved").length },
  ];
  const topReferrers = (() => {
    const map: Record<string, number> = {};
    refs.forEach((r) => { map[r.referrer_id] = (map[r.referrer_id] ?? 0) + 1; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, v]) => ({ name: id.slice(0, 8) + "…", value: v }));
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🎁 Referral & Reward Admin</h2>
          <p className="text-sm text-muted-foreground">Referrallarni tasdiqlash, promo kodlar, sozlamalar va fraud monitoring</p>
        </div>
        <Button variant="outline" size="sm" onClick={reload}>
          <RefreshCw className="w-3 h-3 mr-1.5" /> Yangilash
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Jami referral</p><p className="text-2xl font-bold mt-1">{refs.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tasdiqlash kutmoqda</p><p className="text-2xl font-bold mt-1 text-yellow-500">{refs.filter(r => r.status === "subscribed").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tasdiqlangan</p><p className="text-2xl font-bold mt-1 text-emerald-500">{refs.filter(r => r.status === "approved").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Fraud signali</p><p className="text-2xl font-bold mt-1 text-rose-500">{fraud.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="referrals">
        <TabsList>
          <TabsTrigger value="referrals"><Users className="w-4 h-4 mr-1.5" />Referrallar</TabsTrigger>
          <TabsTrigger value="promos"><Ticket className="w-4 h-4 mr-1.5" />Promo kodlar</TabsTrigger>
          <TabsTrigger value="settings"><Settings2 className="w-4 h-4 mr-1.5" />Sozlamalar</TabsTrigger>
          <TabsTrigger value="fraud"><ShieldAlert className="w-4 h-4 mr-1.5" />Fraud log</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="w-4 h-4 mr-1.5" />Analitika</TabsTrigger>
        </TabsList>

        {/* ─── REFERRALS ─── */}
        <TabsContent value="referrals" className="space-y-3 mt-4">
          <div className="flex flex-wrap gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="subscribed">Subscribed (tasdiqlash kutmoqda)</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fraud">Fraud</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Email, kod yoki rol qidirish…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs h-9" />
            <Badge variant="secondary" className="self-center">{filteredRefs.length} ta</Badge>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">Sana</th>
                    <th className="px-3 py-2 text-left">Kod</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Rol</th>
                    <th className="px-3 py-2 text-left">Tier</th>
                    <th className="px-3 py-2 text-left">Reward</th>
                    <th className="px-3 py-2 text-left">Holat</th>
                    <th className="px-3 py-2 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefs.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Hech narsa topilmadi</td></tr>
                  )}
                  {filteredRefs.map((r) => (
                    <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("uz-UZ")}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.code_text || "—"}</td>
                      <td className="px-3 py-2 text-xs">{r.referred_email || "—"}</td>
                      <td className="px-3 py-2 text-xs">{r.referred_org_role || "—"}</td>
                      <td className="px-3 py-2 text-xs">{r.subscription_tier || "—"}</td>
                      <td className="px-3 py-2 text-xs tabular-nums">{r.reward_credits} cr / {r.reward_months} oy</td>
                      <td className="px-3 py-2"><Badge variant="outline" className={STATUS_COLORS[r.status] ?? ""}>{r.status}</Badge></td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          {r.status !== "approved" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-500" onClick={() => updateRefStatus(r.id, "approved")} title="Tasdiqlash">
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          {r.status !== "rejected" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500" onClick={() => updateRefStatus(r.id, "rejected")} title="Rad etish">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {r.status !== "fraud" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-rose-500" onClick={() => updateRefStatus(r.id, "fraud")} title="Fraud sifatida belgilash">
                              <ShieldAlert className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── PROMO ─── */}
        <TabsContent value="promos" className="mt-4">
          <PromoManager promos={promos} reload={reload} />
        </TabsContent>

        {/* ─── SETTINGS ─── */}
        <TabsContent value="settings" className="mt-4">
          <SettingsForm settings={settings} reload={reload} />
        </TabsContent>

        {/* ─── FRAUD ─── */}
        <TabsContent value="fraud" className="mt-4 space-y-2">
          {fraud.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Fraud signali yo'q</p>}
          {fraud.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{f.kind}</p>
                    <Badge variant="outline" className="text-[10px]">{f.severity}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleString("uz-UZ")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.notes || "—"}</p>
                  {f.referral_id && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">ref:{f.referral_id.slice(0, 8)}…</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ─── ANALYTICS ─── */}
        <TabsContent value="analytics" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Oxirgi 14 kun (yangi referrallar)</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={buildDaily()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="qiymat" stroke="#2F80ED" fill="#2F80ED" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Conversion funnel</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="#7B61FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">Top 5 referrer (anonim)</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topReferrers} dataKey="value" nameKey="name" outerRadius={80} label>
                    {topReferrers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════ PROMO MANAGER ═══════════
function PromoManager({ promos, reload }: { promos: PromoCode[]; reload: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", discount_pct: 0, bonus_months: 0, bonus_credits: 0,
    max_uses: "", valid_until: "",
  });

  const create = async () => {
    if (!form.code) { toast({ title: "Kod kerak", variant: "destructive" }); return; }
    const { error } = await sb.from("referral_promo_codes").insert({
      code: form.code.toUpperCase().trim(),
      discount_pct: Number(form.discount_pct) || 0,
      bonus_months: Number(form.bonus_months) || 0,
      bonus_credits: Number(form.bonus_credits) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      valid_until: form.valid_until || null,
      is_active: true,
    });
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Promo kod yaratildi" });
    setOpen(false);
    setForm({ code: "", discount_pct: 0, bonus_months: 0, bonus_credits: 0, max_uses: "", valid_until: "" });
    reload();
  };

  const toggle = async (p: PromoCode) => {
    await sb.from("referral_promo_codes").update({ is_active: !p.is_active }).eq("id", p.id);
    reload();
  };
  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await sb.from("referral_promo_codes").delete().eq("id", id);
    toast({ title: "🗑 O'chirildi" });
    reload();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{promos.length} ta promo kod</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Yangi promo kod</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi promo kod</DialogTitle>
              <DialogDescription>Chegirma yoki bonus berib obunaga jalb qiling.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Kod (masalan: SUMMER25)</label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs">Chegirma %</label><Input type="number" value={form.discount_pct} onChange={(e) => setForm({ ...form, discount_pct: Number(e.target.value) })} className="mt-1" /></div>
                <div><label className="text-xs">Bonus oylar</label><Input type="number" value={form.bonus_months} onChange={(e) => setForm({ ...form, bonus_months: Number(e.target.value) })} className="mt-1" /></div>
                <div><label className="text-xs">Bonus credits</label><Input type="number" value={form.bonus_credits} onChange={(e) => setForm({ ...form, bonus_credits: Number(e.target.value) })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs">Maks foydalanish</label><Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="mt-1" placeholder="∞" /></div>
                <div><label className="text-xs">Amal qilish muddati</label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
              <Button onClick={create}>Yaratish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Kod</th>
              <th className="px-3 py-2 text-left">Chegirma</th>
              <th className="px-3 py-2 text-left">Bonus</th>
              <th className="px-3 py-2 text-left">Foydalanildi</th>
              <th className="px-3 py-2 text-left">Muddat</th>
              <th className="px-3 py-2 text-left">Holat</th>
              <th className="px-3 py-2 text-right">Amal</th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Promo kodlar yo'q</td></tr>}
            {promos.map((p) => (
              <tr key={p.id} className="border-t border-border/60">
                <td className="px-3 py-2 font-mono">{p.code}</td>
                <td className="px-3 py-2">{p.discount_pct}%</td>
                <td className="px-3 py-2 text-xs">{p.bonus_months} oy / {p.bonus_credits} cr</td>
                <td className="px-3 py-2 text-xs">{p.used_count}{p.max_uses ? `/${p.max_uses}` : ""}</td>
                <td className="px-3 py-2 text-xs">{p.valid_until ? new Date(p.valid_until).toLocaleDateString("uz-UZ") : "∞"}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className={p.is_active ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground"}>
                    {p.is_active ? "Faol" : "Nofaol"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => toggle(p)}>{p.is_active ? "Off" : "On"}</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-rose-500" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════ SETTINGS FORM ═══════════
function SettingsForm({ settings, reload }: { settings: Settings | null; reload: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<any>(() => settings ?? {
    id: 1,
    base_reward_basic: { credits: 50000, months: 1, ai_credits: 0 },
    base_reward_premium: { credits: 100000, months: 2, ai_credits: 100 },
    base_reward_ai: { credits: 0, months: 0, ai_credits: 500 },
    auto_approve: false,
    block_self_referral: true,
    ip_device_limit: 3,
  });

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const save = async () => {
    const { error } = await sb.from("referral_settings").upsert({
      id: 1,
      base_reward_basic: form.base_reward_basic,
      base_reward_premium: form.base_reward_premium,
      base_reward_ai: form.base_reward_ai,
      auto_approve: form.auto_approve,
      block_self_referral: form.block_self_referral,
      ip_device_limit: Number(form.ip_device_limit) || 3,
      min_subscription_amount: Number(form.min_subscription_amount) || 0,
      qualify_within_days: Number(form.qualify_within_days) || 0,
      reward_hold_days: Number(form.reward_hold_days) || 0,
      cancel_on_refund: !!form.cancel_on_refund,
      cancel_on_unsubscribe_days: Number(form.cancel_on_unsubscribe_days) || 0,
      updated_at: new Date().toISOString(),
    });
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Sozlamalar saqlandi" });
    reload();
  };

  const releaseHeld = async () => {
    const { data, error } = await sb.rpc("release_held_referral_rewards");
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: `✅ ${data ?? 0} ta hold ostidagi bonus faollashtirildi` });
    reload();
  };

  const updateBase = (tier: "basic" | "premium" | "ai", key: string, val: number) => {
    const k = `base_reward_${tier}`;
    setForm({ ...form, [k]: { ...(form[k] ?? {}), [key]: val } });
  };

  const TierRow = ({ tier, label }: { tier: "basic" | "premium" | "ai"; label: string }) => {
    const v = form[`base_reward_${tier}`] ?? {};
    return (
      <div className="grid grid-cols-4 gap-2 items-center">
        <p className="text-sm font-medium">{label}</p>
        <div><label className="text-[10px] text-muted-foreground">Credits</label><Input type="number" value={v.credits ?? 0} onChange={(e) => updateBase(tier, "credits", Number(e.target.value))} /></div>
        <div><label className="text-[10px] text-muted-foreground">Oylar</label><Input type="number" value={v.months ?? 0} onChange={(e) => updateBase(tier, "months", Number(e.target.value))} /></div>
        <div><label className="text-[10px] text-muted-foreground">AI credits</label><Input type="number" value={v.ai_credits ?? 0} onChange={(e) => updateBase(tier, "ai_credits", Number(e.target.value))} /></div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Gift className="w-4 h-4" /> Asosiy bonus matritsasi (har bir tier uchun)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <TierRow tier="basic" label="Basic" />
          <TierRow tier="premium" label="Premium" />
          <TierRow tier="ai" label="AI / Pro" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings2 className="w-4 h-4" /> Bonus hisoblash qoidalari</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Minimal obuna summasi (UZS)</label>
              <Input type="number" min={0} className="mt-1" value={form.min_subscription_amount ?? 0}
                onChange={(e) => setForm({ ...form, min_subscription_amount: Number(e.target.value) })} />
              <p className="text-[10px] text-muted-foreground mt-1">Shu summadan kam to'lov bonusga sabab bo'lmaydi (0 = limit yo'q)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Konversiya vaqti limiti (kun)</label>
              <Input type="number" min={0} className="mt-1" value={form.qualify_within_days ?? 30}
                onChange={(e) => setForm({ ...form, qualify_within_days: Number(e.target.value) })} />
              <p className="text-[10px] text-muted-foreground mt-1">Ro'yxatdan o'tgandan keyin shu kun ichida obuna bo'lmasa — `expired`</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bonus hold muddati (kun)</label>
              <Input type="number" min={0} className="mt-1" value={form.reward_hold_days ?? 0}
                onChange={(e) => setForm({ ...form, reward_hold_days: Number(e.target.value) })} />
              <p className="text-[10px] text-muted-foreground mt-1">Hamyonga o'tishdan oldin necha kun "hold" bo'lib turadi (chargeback himoyasi)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Avto-bekor: obunadan chiqish oynasi (kun)</label>
              <Input type="number" min={0} className="mt-1" value={form.cancel_on_unsubscribe_days ?? 0}
                onChange={(e) => setForm({ ...form, cancel_on_unsubscribe_days: Number(e.target.value) })} />
              <p className="text-[10px] text-muted-foreground mt-1">Shu muddat ichida obuna bekor qilinsa — bonus revoke qilinadi (0 = o'chiq)</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.cancel_on_refund} onChange={(e) => setForm({ ...form, cancel_on_refund: e.target.checked })} />
              To'lov qaytarilsa (refund/chargeback) — bonusni avtomatik bekor qilish
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.auto_approve} onChange={(e) => setForm({ ...form, auto_approve: e.target.checked })} />
              Avtomatik tasdiqlash (subscribed bo'lgach reward darhol beriladi)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.block_self_referral} onChange={(e) => setForm({ ...form, block_self_referral: e.target.checked })} />
              Self-referralni bloklash
            </label>
            <div>
              <label className="text-xs text-muted-foreground">Bir IP/device dan maksimal referrals</label>
              <Input type="number" className="mt-1 w-32" value={form.ip_device_limit ?? 3} onChange={(e) => setForm({ ...form, ip_device_limit: Number(e.target.value) })} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save}>Saqlash</Button>
            <Button variant="outline" onClick={releaseHeld}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Hold ostidagilarni faollashtirish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
