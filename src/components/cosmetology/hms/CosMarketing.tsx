import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Megaphone, Plus, Send, Tag, Loader2, Users, TrendingUp, Gift,
  Bot, Sparkles, Cake, Repeat, Zap, BarChart3, Target, Award,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const SOURCES = [
  { value: "instagram", label: "Instagram", color: "#E1306C" },
  { value: "telegram", label: "Telegram", color: "#0088cc" },
  { value: "facebook", label: "Facebook", color: "#1877F2" },
  { value: "google", label: "Google Ads", color: "#4285F4" },
  { value: "referral", label: "Tavsiya", color: "#10B981" },
  { value: "walk-in", label: "Tashqaridan", color: "#F59E0B" },
  { value: "other", label: "Boshqa", color: "#6B7280" },
];

const LEAD_STATUSES = [
  { value: "new", label: "Yangi", color: "bg-blue-500" },
  { value: "contacted", label: "Bog'lanildi", color: "bg-yellow-500" },
  { value: "interested", label: "Qiziqyapti", color: "bg-purple-500" },
  { value: "converted", label: "Mijoz bo'ldi", color: "bg-green-500" },
  { value: "lost", label: "Yo'qotildi", color: "bg-red-500" },
];

const AUTO_TEMPLATES = [
  { rule_name: "🎂 Tug'ilgan kun tabrigi", trigger_type: "birthday", channel: "sms", days_offset: 0, message_template: "Tug'ilgan kuningiz bilan! 🎉 Sizga maxsus 20% chegirma. Kelib o'zingizga sovg'a qiling!" },
  { rule_name: "🔁 30 kun ichida qaytmagan", trigger_type: "inactive", channel: "sms", days_offset: 30, message_template: "Sizni sog'indik! Qaytib keling - sizga maxsus taklif tayyorladik 💝" },
  { rule_name: "✨ Birinchi tashrif keyingi", trigger_type: "first_visit", channel: "sms", days_offset: 7, message_template: "Birinchi tashrifingiz uchun rahmat! Keyingi muolaja uchun 15% chegirma." },
  { rule_name: "💎 VIP mijoz e'tibori", trigger_type: "vip", channel: "telegram", days_offset: 14, message_template: "Aziz VIP mijozimiz, siz uchun maxsus yangi xizmat tayyor. Bron qiling!" },
];

const CosMarketing = ({ centerId }: { centerId: string }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [autoRules, setAutoRules] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [showCamp, setShowCamp] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [showAuto, setShowAuto] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [saving, setSaving] = useState(false);

  const [campForm, setCampForm] = useState({ name: "", channel: "sms", message: "", target_segment: "all" });
  const [promoForm, setPromoForm] = useState({ code: "", description: "", discount_type: "percent", discount_value: "", max_uses: "", valid_until: "" });
  const [leadForm, setLeadForm] = useState({ full_name: "", phone: "", source: "instagram", interested_service: "", notes: "" });
  const [autoForm, setAutoForm] = useState({ rule_name: "", trigger_type: "birthday", channel: "sms", message_template: "", days_offset: 0 });
  const [refForm, setRefForm] = useState({ referrer_client_id: "", referral_code: "", bonus_amount: "50000", notes: "" });

  const load = async () => {
    const [c, p, l, r, a, cl] = await Promise.all([
      supabase.from("cosmetology_marketing_campaigns" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_promo_codes" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_leads" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_referrals" as any).select("*, referrer:referrer_client_id(full_name), referred:referred_client_id(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_auto_marketing" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_clients" as any).select("id, full_name, phone, loyalty_points, total_spent").eq("center_id", centerId).limit(500),
    ]);
    setCampaigns((c.data as any[]) || []);
    setPromos((p.data as any[]) || []);
    setLeads((l.data as any[]) || []);
    setReferrals((r.data as any[]) || []);
    setAutoRules((a.data as any[]) || []);
    setClients((cl.data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  // ===== KPI hisoblash =====
  const kpi = useMemo(() => {
    const newLeads = leads.filter((l) => l.status === "new").length;
    const converted = leads.filter((l) => l.status === "converted").length;
    const conversionRate = leads.length ? Math.round((converted / leads.length) * 100) : 0;
    const totalCampaigns = campaigns.length;
    const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
    const totalReferralBonus = referrals.reduce((s, r) => s + Number(r.bonus_amount || 0), 0);
    return { newLeads, converted, conversionRate, totalCampaigns, totalSent, totalReferralBonus };
  }, [leads, campaigns, referrals]);

  // ===== Lead manbalari diagrammasi =====
  const sourceChart = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => { map[l.source] = (map[l.source] || 0) + 1; });
    return SOURCES.map((s) => ({ name: s.label, value: map[s.value] || 0, color: s.color })).filter((x) => x.value > 0);
  }, [leads]);

  // ===== Oxirgi 30 kunlik lead trendi =====
  const trend = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(5, 10);
      days[k] = 0;
    }
    leads.forEach((l) => {
      const k = (l.created_at as string).slice(5, 10);
      if (k in days) days[k]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [leads]);

  // ===== Mijoz segmentatsiyasi =====
  const segments = useMemo(() => {
    const vip = clients.filter((c) => Number(c.total_spent || 0) >= 5000000).length;
    const active = clients.filter((c) => Number(c.total_spent || 0) > 0 && Number(c.total_spent || 0) < 5000000).length;
    const inactive = clients.filter((c) => !c.total_spent || Number(c.total_spent) === 0).length;
    return { vip, active, inactive, total: clients.length };
  }, [clients]);

  // ===== Saqlash funksiyalari =====
  const saveCamp = async () => {
    if (!campForm.name || !campForm.message) { toast({ title: "Nom va xabar majburiy", variant: "destructive" }); return; }
    setSaving(true);
    // Recipients ni segmentga qarab hisoblaymiz
    let recipients = clients.length;
    if (campForm.target_segment === "vip") recipients = segments.vip;
    else if (campForm.target_segment === "active") recipients = segments.active;
    const { error } = await supabase.from("cosmetology_marketing_campaigns" as any).insert({
      center_id: centerId, ...campForm, recipients_count: recipients, status: "scheduled",
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Kampaniya yaratildi", description: `${recipients} ta mijozga rejalashtirildi` });
    setShowCamp(false);
    setCampForm({ name: "", channel: "sms", message: "", target_segment: "all" });
    load();
  };

  const sendCampaign = async (camp: any) => {
    const { error } = await supabase.from("cosmetology_marketing_campaigns" as any)
      .update({ status: "sent", sent_at: new Date().toISOString(), sent_count: camp.recipients_count || 0 } as any)
      .eq("id", camp.id);
    if (error) { toast({ title: "Xatolik", variant: "destructive" }); return; }
    toast({ title: "📤 Yuborildi", description: `${camp.recipients_count} mijozga yuborildi` });
    load();
  };

  const savePromo = async () => {
    if (!promoForm.code || !promoForm.discount_value) { toast({ title: "Kod va chegirma majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_promo_codes" as any).insert({
      center_id: centerId, code: promoForm.code.toUpperCase(), description: promoForm.description,
      discount_type: promoForm.discount_type, discount_value: parseFloat(promoForm.discount_value),
      max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
      valid_until: promoForm.valid_until || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Promo kod yaratildi" });
    setShowPromo(false);
    setPromoForm({ code: "", description: "", discount_type: "percent", discount_value: "", max_uses: "", valid_until: "" });
    load();
  };

  const saveLead = async () => {
    if (!leadForm.full_name) { toast({ title: "Ism majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_leads" as any).insert({ center_id: centerId, ...leadForm } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Lead qo'shildi" });
    setShowLead(false);
    setLeadForm({ full_name: "", phone: "", source: "instagram", interested_service: "", notes: "" });
    load();
  };

  const updateLeadStatus = async (id: string, status: string) => {
    await supabase.from("cosmetology_leads" as any).update({ status } as any).eq("id", id);
    toast({ title: "Status yangilandi" });
    load();
  };

  const convertLead = async (lead: any) => {
    // Lead ni mijozga aylantirish
    const { data: client, error } = await supabase.from("cosmetology_clients" as any).insert({
      center_id: centerId, full_name: lead.full_name, phone: lead.phone || "",
    } as any).select().single();
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await supabase.from("cosmetology_leads" as any)
      .update({ status: "converted", converted_client_id: (client as any).id } as any).eq("id", lead.id);
    toast({ title: "🎉 Mijozga aylantirildi!" });
    load();
  };

  const saveAuto = async (template?: any) => {
    const data = template || autoForm;
    if (!data.rule_name || !data.message_template) { toast({ title: "Nom va xabar majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_auto_marketing" as any).insert({ center_id: centerId, ...data } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Avtomatik qoida qo'shildi" });
    setShowAuto(false);
    setAutoForm({ rule_name: "", trigger_type: "birthday", channel: "sms", message_template: "", days_offset: 0 });
    load();
  };

  const toggleAuto = async (id: string, is_active: boolean) => {
    await supabase.from("cosmetology_auto_marketing" as any).update({ is_active: !is_active } as any).eq("id", id);
    load();
  };

  const saveReferral = async () => {
    if (!refForm.referrer_client_id || !refForm.referral_code) { toast({ title: "Mijoz va kod majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_referrals" as any).insert({
      center_id: centerId, referrer_client_id: refForm.referrer_client_id,
      referral_code: refForm.referral_code.toUpperCase(),
      bonus_amount: parseFloat(refForm.bonus_amount), notes: refForm.notes,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Referral kod yaratildi" });
    setShowRef(false);
    setRefForm({ referrer_client_id: "", referral_code: "", bonus_amount: "50000", notes: "" });
    load();
  };

  const fmt = (n: any) => new Intl.NumberFormat("uz-UZ").format(Number(n) || 0);

  return (
    <div className="space-y-6">
      {/* ===== KPI Dashboard ===== */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="p-3">
            <Users className="w-4 h-4 text-blue-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">Yangi leadlar</p>
            <p className="text-xl font-bold">{kpi.newLeads}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="p-3">
            <TrendingUp className="w-4 h-4 text-green-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">Konversiya</p>
            <p className="text-xl font-bold">{kpi.conversionRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent">
          <CardContent className="p-3">
            <Megaphone className="w-4 h-4 text-purple-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">Kampaniyalar</p>
            <p className="text-xl font-bold">{kpi.totalCampaigns}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardContent className="p-3">
            <Send className="w-4 h-4 text-orange-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">Xabarlar</p>
            <p className="text-xl font-bold">{fmt(kpi.totalSent)}</p>
          </CardContent>
        </Card>
        <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-transparent">
          <CardContent className="p-3">
            <Award className="w-4 h-4 text-pink-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">VIP mijozlar</p>
            <p className="text-xl font-bold">{segments.vip}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent">
          <CardContent className="p-3">
            <Gift className="w-4 h-4 text-yellow-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">Referal bonus</p>
            <p className="text-sm font-bold">{fmt(kpi.totalReferralBonus)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="leads"><Users className="w-3 h-3 mr-1" />Leadlar</TabsTrigger>
          <TabsTrigger value="campaigns"><Megaphone className="w-3 h-3 mr-1" />Kampaniya</TabsTrigger>
          <TabsTrigger value="promos"><Tag className="w-3 h-3 mr-1" />Promo</TabsTrigger>
          <TabsTrigger value="auto"><Bot className="w-3 h-3 mr-1" />Auto</TabsTrigger>
          <TabsTrigger value="referrals"><Gift className="w-3 h-3 mr-1" />Referral</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="w-3 h-3 mr-1" />Analitika</TabsTrigger>
        </TabsList>

        {/* ===== LEADLAR ===== */}
        <TabsContent value="leads" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold">Lead Management</h3>
            <Button size="sm" onClick={() => setShowLead(!showLead)}><Plus className="w-4 h-4 mr-1" />Yangi lead</Button>
          </div>
          {showLead && (
            <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ism *</Label><Input value={leadForm.full_name} onChange={(e) => setLeadForm({ ...leadForm, full_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Telefon</Label><Input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} className="mt-1" /></div>
                <div>
                  <Label>Manba</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}>
                    {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div><Label>Qiziqish</Label><Input placeholder="Masalan: Botoks" value={leadForm.interested_service} onChange={(e) => setLeadForm({ ...leadForm, interested_service: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label>Izoh</Label><Textarea rows={2} value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} className="mt-1" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveLead} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowLead(false)}>Bekor</Button>
              </div>
            </CardContent></Card>
          )}
          <div className="space-y-2">
            {leads.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Hali leadlar yo'q</p>}
            {leads.map((l) => {
              const st = LEAD_STATUSES.find((x) => x.value === l.status) || LEAD_STATUSES[0];
              const src = SOURCES.find((x) => x.value === l.source);
              return (
                <Card key={l.id} className="border-border">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{l.full_name}</p>
                          <Badge className={`text-[10px] text-white ${st.color}`}>{st.label}</Badge>
                          <Badge variant="outline" className="text-[10px]" style={{ borderColor: src?.color, color: src?.color }}>{src?.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{l.phone} {l.interested_service && `• ${l.interested_service}`}</p>
                        {l.notes && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{l.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        <select className="h-8 text-xs rounded border border-input bg-background px-2" value={l.status} onChange={(e) => updateLeadStatus(l.id, e.target.value)}>
                          {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {l.status !== "converted" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => convertLead(l)}>
                            <Sparkles className="w-3 h-3 mr-1" />Mijoz qil
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ===== KAMPANIYALAR ===== */}
        <TabsContent value="campaigns" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold">Reklama kampaniyalari</h3>
            <Button size="sm" onClick={() => setShowCamp(!showCamp)}><Plus className="w-4 h-4 mr-1" />Kampaniya</Button>
          </div>
          {showCamp && (
            <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nom *</Label><Input value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} className="mt-1" /></div>
                <div>
                  <Label>Kanal</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={campForm.channel} onChange={(e) => setCampForm({ ...campForm, channel: e.target.value })}>
                    <option value="sms">📱 SMS</option><option value="telegram">✈️ Telegram</option><option value="email">📧 Email</option>
                  </select>
                </div>
                <div>
                  <Label>Segment</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={campForm.target_segment} onChange={(e) => setCampForm({ ...campForm, target_segment: e.target.value })}>
                    <option value="all">Barcha ({clients.length})</option>
                    <option value="active">Faol ({segments.active})</option>
                    <option value="vip">VIP ({segments.vip})</option>
                    <option value="inactive">Yo'qotilgan ({segments.inactive})</option>
                  </select>
                </div>
              </div>
              <div><Label>Xabar *</Label><Textarea rows={3} value={campForm.message} onChange={(e) => setCampForm({ ...campForm, message: e.target.value })} className="mt-1" placeholder="Aziz mijoz! Bizda yangi aksiya..." /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveCamp} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" />Yaratish</>}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowCamp(false)}>Bekor</Button>
              </div>
            </CardContent></Card>
          )}
          <div className="space-y-2">
            {campaigns.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Kampaniyalar yo'q</p>}
            {campaigns.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{c.name}</p>
                        <Badge variant="outline" className="text-[10px]">{c.channel}</Badge>
                        <Badge className="text-[10px]">{c.target_segment}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">📊 {c.recipients_count || 0} qabul / {c.sent_count || 0} yuborilgan</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant={c.status === "sent" ? "default" : "secondary"}>{c.status}</Badge>
                      {c.status !== "sent" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => sendCampaign(c)}>
                          <Send className="w-3 h-3 mr-1" />Yubor
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ===== PROMO ===== */}
        <TabsContent value="promos" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold">Promo kodlar</h3>
            <Button size="sm" onClick={() => setShowPromo(!showPromo)}><Plus className="w-4 h-4 mr-1" />Promo</Button>
          </div>
          {showPromo && (
            <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Kod *</Label><Input value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} className="mt-1 uppercase" placeholder="SUMMER25" /></div>
                <div><Label>Tavsif</Label><Input value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} className="mt-1" /></div>
                <div>
                  <Label>Tur</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={promoForm.discount_type} onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}>
                    <option value="percent">Foiz (%)</option><option value="fixed">So'm</option>
                  </select>
                </div>
                <div><Label>Qiymat *</Label><Input type="number" value={promoForm.discount_value} onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })} className="mt-1" /></div>
                <div><Label>Maks foydalanish</Label><Input type="number" value={promoForm.max_uses} onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })} className="mt-1" /></div>
                <div><Label>Amal qiladi</Label><Input type="date" value={promoForm.valid_until} onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={savePromo} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowPromo(false)}>Bekor</Button>
              </div>
            </CardContent></Card>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {promos.length === 0 && <p className="text-sm text-muted-foreground text-center py-6 col-span-full">Promo kodlar yo'q</p>}
            {promos.map((p) => (
              <div key={p.id} className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex justify-between items-start"><p className="font-mono font-bold text-primary">{p.code}</p><Badge className="text-xs">{p.discount_type === "percent" ? `-${p.discount_value}%` : `-${fmt(p.discount_value)}`}</Badge></div>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{p.used_count || 0}/{p.max_uses || "∞"} foydalangan</p>
                {p.valid_until && <p className="text-[10px] text-orange-500">⏰ {new Date(p.valid_until).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ===== AUTO MARKETING ===== */}
        <TabsContent value="auto" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Bot className="w-4 h-4" />Auto Marketing</h3>
            <Button size="sm" onClick={() => setShowAuto(!showAuto)}><Plus className="w-4 h-4 mr-1" />Qoida</Button>
          </div>

          {/* Tezkor shablonlar */}
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="p-3">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Zap className="w-3 h-3" />Tezkor shablonlar</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {AUTO_TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => saveAuto(t)} className="text-left p-2 rounded border border-border hover:border-primary bg-background transition-colors">
                    <p className="text-xs font-medium">{t.rule_name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{t.message_template}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {showAuto && (
            <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Qoida nomi *</Label><Input value={autoForm.rule_name} onChange={(e) => setAutoForm({ ...autoForm, rule_name: e.target.value })} className="mt-1" /></div>
                <div>
                  <Label>Trigger</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={autoForm.trigger_type} onChange={(e) => setAutoForm({ ...autoForm, trigger_type: e.target.value })}>
                    <option value="birthday">🎂 Tug'ilgan kun</option>
                    <option value="inactive">😴 Faol bo'lmagan</option>
                    <option value="first_visit">✨ Birinchi tashrif</option>
                    <option value="vip">💎 VIP eslatma</option>
                  </select>
                </div>
                <div>
                  <Label>Kanal</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={autoForm.channel} onChange={(e) => setAutoForm({ ...autoForm, channel: e.target.value })}>
                    <option value="sms">SMS</option><option value="telegram">Telegram</option>
                  </select>
                </div>
                <div><Label>Kunlar oralig'i</Label><Input type="number" value={autoForm.days_offset} onChange={(e) => setAutoForm({ ...autoForm, days_offset: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
              </div>
              <div><Label>Xabar shabloni *</Label><Textarea rows={3} value={autoForm.message_template} onChange={(e) => setAutoForm({ ...autoForm, message_template: e.target.value })} className="mt-1" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveAuto()} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAuto(false)}>Bekor</Button>
              </div>
            </CardContent></Card>
          )}

          <div className="space-y-2">
            {autoRules.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Avtomatik qoidalar yo'q. Yuqoridagi shablonlardan tanlang.</p>}
            {autoRules.map((r) => (
              <Card key={r.id} className={r.is_active ? "border-green-500/30" : "border-border opacity-60"}>
                <CardContent className="p-3 flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {r.trigger_type === "birthday" && <Cake className="w-4 h-4 text-pink-500" />}
                      {r.trigger_type === "inactive" && <Repeat className="w-4 h-4 text-blue-500" />}
                      {r.trigger_type === "first_visit" && <Sparkles className="w-4 h-4 text-purple-500" />}
                      {r.trigger_type === "vip" && <Award className="w-4 h-4 text-yellow-500" />}
                      <p className="font-medium text-sm">{r.rule_name}</p>
                      <Badge variant="outline" className="text-[10px]">{r.channel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.message_template}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">📤 Yuborilgan: {r.total_sent || 0} • {r.days_offset} kun</p>
                  </div>
                  <Button size="sm" variant={r.is_active ? "default" : "outline"} className="h-7 text-xs" onClick={() => toggleAuto(r.id, r.is_active)}>
                    {r.is_active ? "Faol" : "O'chiq"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ===== REFERRAL ===== */}
        <TabsContent value="referrals" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Gift className="w-4 h-4" />Referal tizimi</h3>
            <Button size="sm" onClick={() => setShowRef(!showRef)}><Plus className="w-4 h-4 mr-1" />Referal kod</Button>
          </div>
          {showRef && (
            <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mijoz *</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={refForm.referrer_client_id} onChange={(e) => setRefForm({ ...refForm, referrer_client_id: e.target.value })}>
                    <option value="">— Tanlang —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
                <div><Label>Referal kod *</Label><Input value={refForm.referral_code} onChange={(e) => setRefForm({ ...refForm, referral_code: e.target.value.toUpperCase() })} className="mt-1 uppercase" placeholder="FRIEND-AYDA" /></div>
                <div><Label>Bonus (so'm)</Label><Input type="number" value={refForm.bonus_amount} onChange={(e) => setRefForm({ ...refForm, bonus_amount: e.target.value })} className="mt-1" /></div>
                <div><Label>Izoh</Label><Input value={refForm.notes} onChange={(e) => setRefForm({ ...refForm, notes: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveReferral} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowRef(false)}>Bekor</Button>
              </div>
            </CardContent></Card>
          )}
          <div className="space-y-2">
            {referrals.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Referallar yo'q</p>}
            {referrals.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-mono font-bold text-primary text-sm">{r.referral_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.referrer?.full_name || "—"} → {r.referred?.full_name || "Hali ishlatilmagan"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{fmt(r.bonus_amount)} so'm</p>
                    <Badge variant={r.bonus_status === "paid" ? "default" : "secondary"} className="text-[10px]">{r.bonus_status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ===== ANALITIKA ===== */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1"><TrendingUp className="w-4 h-4" />30 kunlik leadlar trendi</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="colorLead" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#colorLead)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1"><Target className="w-4 h-4" />Lead manbalari</p>
                {sourceChart.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">Ma'lumot yo'q</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={sourceChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.name}: ${e.value}`}>
                        {sourceChart.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1"><Users className="w-4 h-4" />Mijoz segmentatsiyasi</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-muted-foreground">💎 VIP</p>
                    <p className="text-2xl font-bold text-yellow-600">{segments.vip}</p>
                    <p className="text-[10px] text-muted-foreground">5M+ so'm xarid</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs text-muted-foreground">✅ Faol</p>
                    <p className="text-2xl font-bold text-green-600">{segments.active}</p>
                    <p className="text-[10px] text-muted-foreground">Doimiy mijoz</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-xs text-muted-foreground">😴 Yo'qotilgan</p>
                    <p className="text-2xl font-bold text-red-600">{segments.inactive}</p>
                    <p className="text-[10px] text-muted-foreground">Qaytarish kerak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CosMarketing;
