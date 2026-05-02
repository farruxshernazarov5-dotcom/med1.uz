import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Megaphone, Target, Send, Tag, Bot, TrendingUp, Eye, MousePointerClick,
  DollarSign, Users, Sparkles, Plus, Power, Trash2, Mail, MessageCircle, Bell
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#2F80ED", "#27AE60", "#F2994A", "#EB5757", "#7B61FF", "#06b6d4"];

interface Campaign {
  id: string;
  name: string;
  channel: string;
  segment: string;
  budget: number;
  reach: number;
  clicks: number;
  conversions: number;
  status: "active" | "paused" | "ended";
  created_at: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  usage_count: number;
  max_uses: number;
  active: boolean;
}

const AdminMarketingModule = () => {
  const { toast } = useToast();
  const [section, setSection] = useState<"dashboard" | "campaigns" | "ads" | "notifications" | "promos" | "ai">("dashboard");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalAppts: 0, totalRevenue: 0, totalAiSubs: 0 });

  const [campName, setCampName] = useState("");
  const [campChannel, setCampChannel] = useState("push");
  const [campSegment, setCampSegment] = useState("all");
  const [campBudget, setCampBudget] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoMax, setPromoMax] = useState("");

  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifChannel, setNotifChannel] = useState("push");

  useEffect(() => { void fetchStats(); }, []);

  const fetchStats = async () => {
    const [u, a, p, s] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id, total_price, status"),
      supabase.from("ai_payments").select("amount, status").eq("status", "paid"),
      supabase.from("ai_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);
    const apptRev = (a.data || []).filter(x => x.status === "completed").reduce((s, x) => s + Number(x.total_price || 0), 0);
    const aiRev = (p.data || []).reduce((s, x) => s + Number(x.amount || 0), 0);
    setStats({
      totalUsers: u.count || 0,
      totalAppts: a.data?.length || 0,
      totalRevenue: apptRev + aiRev,
      totalAiSubs: s.count || 0,
    });
  };

  const trafficData = [
    { name: "Du", visits: 1240, conversions: 86 },
    { name: "Se", visits: 1480, conversions: 102 },
    { name: "Chor", visits: 1320, conversions: 91 },
    { name: "Pay", visits: 1620, conversions: 124 },
    { name: "Ju", visits: 1890, conversions: 156 },
    { name: "Sha", visits: 1450, conversions: 98 },
    { name: "Yak", visits: 1180, conversions: 74 },
  ];

  const channelData = [
    { name: "Organic", value: 45 },
    { name: "Telegram", value: 25 },
    { name: "Push", value: 18 },
    { name: "Email", value: 12 },
  ];

  const handleCreateCampaign = () => {
    if (!campName || !campBudget) {
      toast({ title: "Kampaniya nomi va byudjetni kiriting", variant: "destructive" });
      return;
    }
    const newCamp: Campaign = {
      id: Date.now().toString(),
      name: campName,
      channel: campChannel,
      segment: campSegment,
      budget: Number(campBudget),
      reach: 0,
      clicks: 0,
      conversions: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };
    setCampaigns(prev => [newCamp, ...prev]);
    setCampName(""); setCampBudget("");
    toast({ title: "✅ Kampaniya yaratildi", description: campName });
  };

  const handleCreatePromo = () => {
    if (!promoCode || !promoDiscount) {
      toast({ title: "Promo kod va chegirmani kiriting", variant: "destructive" });
      return;
    }
    setPromos(prev => [{
      id: Date.now().toString(),
      code: promoCode.toUpperCase(),
      discount: Number(promoDiscount),
      usage_count: 0,
      max_uses: Number(promoMax) || 100,
      active: true,
    }, ...prev]);
    setPromoCode(""); setPromoDiscount(""); setPromoMax("");
    toast({ title: "🎁 Promo kod yaratildi" });
  };

  const handleSendNotification = async () => {
    if (!notifTitle || !notifBody) {
      toast({ title: "Sarlavha va matnni kiriting", variant: "destructive" });
      return;
    }
    if (notifChannel === "telegram") {
      try {
        await supabase.functions.invoke("telegram-notify", {
          body: { type: "marketing", title: notifTitle, message: notifBody },
        });
      } catch (e) { /* ignore */ }
    }
    toast({ title: "📢 Yuborildi", description: `${notifChannel.toUpperCase()} orqali` });
    setNotifTitle(""); setNotifBody("");
  };

  const sections = [
    { id: "dashboard", label: "📊 Dashboard", icon: TrendingUp },
    { id: "campaigns", label: "📣 Kampaniyalar", icon: Megaphone },
    { id: "ads", label: "💰 Reklama", icon: Tag },
    { id: "notifications", label: "📩 Xabarnomalar", icon: Send },
    { id: "promos", label: "🎁 Promo kodlar", icon: Sparkles },
    { id: "ai", label: "🤖 AI Marketing", icon: Bot },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Marketing Boshqaruvi</h2>
          <p className="text-xs text-muted-foreground">Kampaniyalar, reklama va konversiya</p>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id as any)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              section === s.id ? "bg-[#2F80ED] text-white shadow" : "text-muted-foreground hover:bg-muted"
            )}>
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {section === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Eye, label: "Trafik (haftalik)", value: trafficData.reduce((s, d) => s + d.visits, 0).toLocaleString(), gradient: "from-blue-500 to-blue-600" },
              { icon: Users, label: "Foydalanuvchilar", value: stats.totalUsers.toLocaleString(), gradient: "from-emerald-500 to-emerald-600" },
              { icon: MousePointerClick, label: "Konversiya", value: trafficData.reduce((s, d) => s + d.conversions, 0).toLocaleString(), gradient: "from-purple-500 to-purple-600" },
              { icon: DollarSign, label: "Daromad", value: `${(stats.totalRevenue / 1e6).toFixed(1)}M`, gradient: "from-pink-500 to-pink-600" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", s.gradient)}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardContent className="p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">📈 Trafik & Konversiya</h4>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="visits" stroke="#2F80ED" fill="#2F80ED" fillOpacity={0.15} name="Tashriflar" />
                  <Area type="monotone" dataKey="conversions" stroke="#27AE60" fill="#27AE60" fillOpacity={0.2} name="Konversiya" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">📊 Trafik manbasi</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* CAMPAIGNS */}
      {section === "campaigns" && (
        <div className="space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-foreground flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Yangi kampaniya</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Kampaniya nomi" value={campName} onChange={e => setCampName(e.target.value)} />
              <Input type="number" placeholder="Byudjet (so'm)" value={campBudget} onChange={e => setCampBudget(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center">Kanal:</span>
              {["push", "email", "telegram", "banner"].map(c => (
                <button key={c} onClick={() => setCampChannel(c)}
                  className={cn("px-3 py-1 rounded-lg text-xs border transition", campChannel === c ? "border-primary bg-primary/10 text-primary" : "border-border")}>
                  {c}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center">Segment:</span>
              {["all", "patients", "clinics", "doctors", "regions"].map(s => (
                <button key={s} onClick={() => setCampSegment(s)}
                  className={cn("px-3 py-1 rounded-lg text-xs border transition", campSegment === s ? "border-primary bg-primary/10 text-primary" : "border-border")}>
                  {s}
                </button>
              ))}
            </div>
            <Button className="bg-[#2F80ED] hover:bg-[#2F80ED]/90" onClick={handleCreateCampaign}>
              <Plus className="w-4 h-4 mr-1" /> Kampaniya yaratish
            </Button>
          </CardContent></Card>

          <div className="space-y-2">
            {campaigns.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Hali kampaniyalar yo'q</p>
            ) : campaigns.map(c => (
              <Card key={c.id}><CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{c.name}</p>
                    <Badge className={cn("text-[10px]", c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted")}>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.channel} • {c.segment} • Byudjet: {c.budget.toLocaleString()} so'm</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Erishish: {c.reach} • Clicks: {c.clicks} • Konversiya: {c.conversions}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: x.status === "active" ? "paused" : "active" } : x))}>
                    <Power className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setCampaigns(prev => prev.filter(x => x.id !== c.id))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {/* ADS */}
      {section === "ads" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Premium listing", price: "500K/oy", desc: "Klinikani ro'yxatda yuqorida ko'rsatish", icon: TrendingUp },
              { title: "Banner reklama", price: "200K/hafta", desc: "Bosh sahifada banner", icon: Tag },
              { title: "AI Promotion", price: "1M/oy", desc: "AI tavsiyalarda ustunlik", icon: Bot },
            ].map(t => (
              <Card key={t.title}><CardContent className="p-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3">
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-foreground">{t.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{t.desc}</p>
                <Badge className="bg-primary/10 text-primary">{t.price}</Badge>
              </CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-5">
            <h4 className="font-semibold text-foreground mb-3">📊 Reklama samaradorligi (CTR)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: "Banner A", ctr: 3.4 },
                { name: "Banner B", ctr: 5.1 },
                { name: "Push", ctr: 8.2 },
                { name: "Email", ctr: 4.6 },
                { name: "Telegram", ctr: 12.3 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="ctr" fill="#F2994A" radius={[6, 6, 0, 0]} name="CTR %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {section === "notifications" && (
        <Card><CardContent className="p-5 space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Marketing xabarnoma yuborish</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: "push", label: "Push", icon: Bell },
              { id: "email", label: "Email", icon: Mail },
              { id: "telegram", label: "Telegram", icon: MessageCircle },
            ].map(c => (
              <button key={c.id} onClick={() => setNotifChannel(c.id)}
                className={cn("p-4 rounded-xl border-2 transition flex flex-col items-center gap-2",
                  notifChannel === c.id ? "border-primary bg-primary/5" : "border-border")}>
                <c.icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{c.label}</span>
              </button>
            ))}
          </div>
          <Input placeholder="Sarlavha" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
          <textarea
            placeholder="Xabar matni..." rows={4} value={notifBody} onChange={e => setNotifBody(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <Button className="bg-[#2F80ED] hover:bg-[#2F80ED]/90" onClick={handleSendNotification}>
            <Send className="w-4 h-4 mr-1" /> Yuborish
          </Button>
        </CardContent></Card>
      )}

      {/* PROMOS */}
      {section === "promos" && (
        <div className="space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-foreground flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Yangi promo kod</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="PROMO2026" value={promoCode} onChange={e => setPromoCode(e.target.value)} />
              <Input type="number" placeholder="Chegirma %" value={promoDiscount} onChange={e => setPromoDiscount(e.target.value)} />
              <Input type="number" placeholder="Maks. foydalanish" value={promoMax} onChange={e => setPromoMax(e.target.value)} />
            </div>
            <Button className="bg-[#2F80ED] hover:bg-[#2F80ED]/90" onClick={handleCreatePromo}>
              <Plus className="w-4 h-4 mr-1" /> Promo yaratish
            </Button>
          </CardContent></Card>
          <div className="space-y-2">
            {promos.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Hali promo kodlar yo'q</p>
            ) : promos.map(p => (
              <Card key={p.id}><CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-lg text-primary">{p.code}</p>
                  <p className="text-xs text-muted-foreground">Chegirma: {p.discount}% • Foydalanildi: {p.usage_count}/{p.max_uses}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={p.active ? "bg-emerald-100 text-emerald-700" : "bg-muted"}>{p.active ? "Faol" : "Nofaol"}</Badge>
                  <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setPromos(prev => prev.filter(x => x.id !== p.id))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {/* AI MARKETING */}
      {section === "ai" && (
        <Card><CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AI Marketing tavsiyalari</h3>
              <p className="text-xs text-muted-foreground">Avtomatik kampaniya optimizatsiyasi</p>
            </div>
          </div>
          {[
            { icon: TrendingUp, title: "📈 Telegram kanali eng samarali", desc: "CTR 12.3% — byudjetni 30% ga oshirishni tavsiya etamiz" },
            { icon: Users, title: "🎯 Toshkent regionidagi bemorlar", desc: "AI obunalar 45% ga oshdi — ko'proq targeting" },
            { icon: Sparkles, title: "🎁 Promo kod ta'siri", desc: "WELCOME20 kodi 3.2x konversiyani oshirdi" },
            { icon: DollarSign, title: "💰 ROI optimallashtirish", desc: "Email kampaniyalar ROI: 4.6x — yangi segmentlar qo'shing" },
          ].map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
              <rec.icon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rec.desc}</p>
              </div>
            </div>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
};

export default AdminMarketingModule;
