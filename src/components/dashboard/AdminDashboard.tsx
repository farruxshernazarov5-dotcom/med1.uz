import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, Calendar, DollarSign, Stethoscope, LogOut, MessageSquare,
  Shield, Activity, Bell, FileText, CheckCircle, XCircle, Clock, Eye,
  Pill, Baby, Sparkles, Droplets, BarChart3, TrendingUp, AlertTriangle,
  Bot, CreditCard, Search, RefreshCw, Monitor, Cpu, Wrench, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";

const COLORS = ["hsl(var(--primary))", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<any>({});
  const [clinics, setClinics] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [aiPayments, setAiPayments] = useState<any[]>([]);
  const [aiSubs, setAiSubs] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [maternity, setMaternity] = useState<any[]>([]);
  const [cosmetology, setCosmetology] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [bloodBanks, setBloodBanks] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  const fetchAll = useCallback(async () => {
    const [
      clinicRes, doctorRes, apptRes, userRes, srvRes,
      msgRes, auditRes, aiPayRes, aiSubRes,
      diagRes, matRes, cosRes, pharmRes, bbRes, vendorRes, aiUsageRes
    ] = await Promise.all([
      supabase.from("registered_clinics").select("*").order("created_at", { ascending: false }),
      supabase.from("doctors").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("*, registered_clinics(name)").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("clinic_services").select("id", { count: "exact" }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_payments").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_diagnostics").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_maternity").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_cosmetology").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_pharmacies").select("*").order("created_at", { ascending: false }),
      supabase.from("blood_banks_registered").select("*").order("created_at", { ascending: false }),
      supabase.from("medtech_vendors").select("*").order("created_at", { ascending: false }),
      supabase.from("ai_usage").select("*").order("used_at", { ascending: false }).limit(500),
    ]);

    const appts = apptRes.data || [];
    const pays = aiPayRes.data || [];
    const msgs = msgRes.data || [];
    const aiUsage = aiUsageRes.data || [];
    const totalRevenue = pays.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
    const apptRevenue = appts.filter(a => a.status === "completed").reduce((s, a) => s + Number(a.total_price || 0), 0);

    setStats({
      users: userRes.count || 0,
      clinics: clinicRes.data?.length || 0,
      activeClinics: clinicRes.data?.filter((c: any) => c.is_active).length || 0,
      doctors: doctorRes.data?.length || 0,
      activeDoctors: doctorRes.data?.filter((d: any) => d.is_active).length || 0,
      services: srvRes.count || 0,
      appointments: appts.length,
      pendingAppts: appts.filter(a => a.status === "pending").length,
      completedAppts: appts.filter(a => a.status === "completed").length,
      messages: msgs.length,
      diagnostics: diagRes.data?.length || 0,
      maternity: matRes.data?.length || 0,
      cosmetology: cosRes.data?.length || 0,
      pharmacies: pharmRes.data?.length || 0,
      bloodBanks: bbRes.data?.length || 0,
      vendors: vendorRes.data?.length || 0,
      aiRevenue: totalRevenue,
      apptRevenue,
      totalRevenue: totalRevenue + apptRevenue,
      aiSubs: aiSubRes.data?.filter(s => s.status === "active").length || 0,
      newMessages: msgs.filter((m: any) => m.status === "new").length || 0,
      aiUsageTotal: aiUsage.length,
    });

    setClinics(clinicRes.data || []);
    setDoctors(doctorRes.data || []);
    setAppointments(appts);
    setMessages(msgs);
    setAuditLogs(auditRes.data || []);
    setAiPayments(pays);
    setAiSubs(aiSubRes.data || []);
    setDiagnostics(diagRes.data || []);
    setMaternity(matRes.data || []);
    setCosmetology(cosRes.data || []);
    setPharmacies(pharmRes.data || []);
    setBloodBanks(bbRes.data || []);
    setVendors(vendorRes.data || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Real-time notifications
  useEffect(() => {
    const channels = [
      supabase.channel("admin-messages")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, (payload) => {
          const msg = payload.new as any;
          setNotifications(prev => [{ id: msg.id, type: "message", title: "Yangi xabar", desc: `${msg.full_name}: ${msg.subject}`, time: new Date() }, ...prev].slice(0, 20));
          setMessages(prev => [msg, ...prev]);
          setStats((prev: any) => ({ ...prev, newMessages: (prev.newMessages || 0) + 1, messages: (prev.messages || 0) + 1 }));
          toast({ title: "📩 Yangi xabar keldi!", description: msg.subject });
        }).subscribe(),
      supabase.channel("admin-appointments")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "appointments" }, (payload) => {
          const appt = payload.new as any;
          setNotifications(prev => [{ id: appt.id, type: "appointment", title: "Yangi qabul", desc: `${appt.patient_name} — ${appt.appointment_date}`, time: new Date() }, ...prev].slice(0, 20));
          toast({ title: "📅 Yangi qabul yozildi!", description: appt.patient_name });
        }).subscribe(),
      supabase.channel("admin-clinics")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "registered_clinics" }, (payload) => {
          const clinic = payload.new as any;
          setNotifications(prev => [{ id: clinic.id, type: "clinic", title: "Yangi klinika", desc: clinic.name, time: new Date() }, ...prev].slice(0, 20));
          toast({ title: "🏥 Yangi klinika ro'yxatdan o'tdi!", description: clinic.name });
        }).subscribe(),
    ];
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [toast]);

  // --- Chart data builders ---
  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const weekdays = ["Du", "Se", "Chor", "Pay", "Ju", "Sha", "Yak"];

  const buildTimeChart = (items: any[], dateField: string, valueField?: string) => {
    if (chartPeriod === "monthly") {
      const map: Record<string, number> = {};
      items.forEach(item => {
        const m = new Date(item[dateField]).getMonth();
        map[months[m]] = (map[months[m]] || 0) + (valueField ? Number(item[valueField] || 0) : 1);
      });
      return months.map(m => ({ name: m, qiymat: map[m] || 0 }));
    } else if (chartPeriod === "weekly") {
      const map: Record<string, number> = {};
      items.forEach(item => {
        const d = new Date(item[dateField]).getDay();
        const day = weekdays[d === 0 ? 6 : d - 1];
        map[day] = (map[day] || 0) + (valueField ? Number(item[valueField] || 0) : 1);
      });
      return weekdays.map(d => ({ name: d, qiymat: map[d] || 0 }));
    } else {
      const map: Record<string, number> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        map[key] = 0;
      }
      items.forEach(item => {
        const d = new Date(item[dateField]);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        if (map[key] !== undefined) map[key] += (valueField ? Number(item[valueField] || 0) : 1);
      });
      return Object.entries(map).map(([name, qiymat]) => ({ name, qiymat }));
    }
  };

  const apptChartData = buildTimeChart(appointments, "appointment_date");
  const revenueChartData = buildTimeChart(
    aiPayments.filter(p => p.status === "paid"), "created_at", "amount"
  );

  const institutionPie = [
    { name: "Klinikalar", value: stats.clinics || 0 },
    { name: "Diagnostika", value: stats.diagnostics || 0 },
    { name: "Tug'ruqxona", value: stats.maternity || 0 },
    { name: "Kosmetologiya", value: stats.cosmetology || 0 },
    { name: "Dorixona", value: stats.pharmacies || 0 },
    { name: "Qon bank", value: stats.bloodBanks || 0 },
    { name: "Med texnika", value: stats.vendors || 0 },
  ].filter(d => d.value > 0);

  const apptStatusPie = [
    { name: "Kutilmoqda", value: stats.pendingAppts || 0 },
    { name: "Tugallangan", value: stats.completedAppts || 0 },
    { name: "Boshqa", value: (stats.appointments || 0) - (stats.pendingAppts || 0) - (stats.completedAppts || 0) },
  ].filter(d => d.value > 0);

  const updateMessageStatus = async (id: string, status: string) => {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    if (status !== "new") setStats((prev: any) => ({ ...prev, newMessages: Math.max(0, (prev.newMessages || 0) - 1) }));
    toast({ title: `Xabar holati: ${status}` });
  };

  const toggleActive = async (table: string, id: string, current: boolean, setter: Function) => {
    await supabase.from(table).update({ is_active: !current }).eq("id", id);
    setter((prev: any[]) => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    toast({ title: !current ? "Faollashtirildi ✅" : "Nofaol qilindi" });
  };

  const tabs = [
    { id: "overview", label: "Umumiy", icon: BarChart3 },
    { id: "notifications", label: `Bildirishnoma${notifications.length > 0 ? ` (${notifications.length})` : ""}`, icon: Bell },
    { id: "messages", label: `Xabarlar${stats.newMessages > 0 ? ` (${stats.newMessages})` : ""}`, icon: MessageSquare },
    { id: "clinics", label: "Klinikalar", icon: Building2 },
    { id: "doctors", label: "Shifokorlar", icon: Stethoscope },
    { id: "appointments", label: "Qabullar", icon: Calendar },
    { id: "institutions", label: "Muassasalar", icon: Building2 },
    { id: "medtech", label: "Med texnika", icon: Wrench },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "ai", label: "AI Monitor", icon: Bot },
    { id: "monitoring", label: "Monitoring", icon: Monitor },
    { id: "audit", label: "Audit", icon: Shield },
  ];

  const ChartPeriodSelector = () => (
    <div className="flex gap-1 bg-muted rounded-lg p-0.5">
      {(["daily", "weekly", "monthly"] as const).map(p => (
        <button key={p} onClick={() => setChartPeriod(p)}
          className={cn("px-2.5 py-1 text-[10px] font-medium rounded-md transition-all",
            chartPeriod === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}>
          {p === "daily" ? "Kunlik" : p === "weekly" ? "Haftalik" : "Oylik"}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Super Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">Med1.uz markaziy boshqaruv paneli</p>
        </div>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" className="relative" onClick={() => setTab("notifications")}>
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center">{notifications.length}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="w-4 h-4 mr-1" /> Yangilash</Button>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Global KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: Users, label: "Foydalanuvchilar", value: stats.users, color: "text-blue-500" },
              { icon: Building2, label: "Faol klinikalar", value: stats.activeClinics, color: "text-green-500" },
              { icon: Stethoscope, label: "Shifokorlar", value: stats.activeDoctors, color: "text-purple-500" },
              { icon: Calendar, label: "Qabullar", value: stats.appointments, color: "text-orange-500" },
              { icon: DollarSign, label: "Jami daromad", value: `${((stats.totalRevenue || 0) / 1e6).toFixed(1)}M`, color: "text-emerald-500" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <s.icon className={cn("w-5 h-5 mb-2", s.color)} />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Institution stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { icon: Building2, label: "Klinikalar", value: stats.clinics },
              { icon: Building2, label: "Diagnostika", value: stats.diagnostics },
              { icon: Baby, label: "Tug'ruqxonalar", value: stats.maternity },
              { icon: Sparkles, label: "Kosmetologiya", value: stats.cosmetology },
              { icon: Pill, label: "Dorixonalar", value: stats.pharmacies },
              { icon: Droplets, label: "Qon banklari", value: stats.bloodBanks },
              { icon: Store, label: "Med texnika", value: stats.vendors },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center">
                <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{s.value || 0}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {stats.newMessages > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">{stats.newMessages} ta yangi xabar!</p>
                <p className="text-xs text-muted-foreground">Foydalanuvchilardan kelgan so'rovlarni ko'rib chiqing</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => setTab("messages")}>Ko'rish</Button>
            </div>
          )}

          {/* Charts Row */}
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-foreground">Statistika grafiklari</h3>
            <ChartPeriodSelector />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments chart */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">Qabullar dinamikasi</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={apptChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="qiymat" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Qabullar" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue chart */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">Daromad dinamikasi</h4>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="qiymat" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Daromad" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Institution distribution */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">Muassasalar taqsimoti</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={institutionPie} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {institutionPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Appointment status */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">Qabul holatlari</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={apptStatusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {apptStatusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ===== NOTIFICATIONS ===== */}
      {tab === "notifications" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Real vaqt bildirishnomalar</h2>
            {notifications.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setNotifications([])}>Barchasini o'chirish</Button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">Hozircha bildirishnomalar yo'q</p>
              <p className="text-xs text-muted-foreground mt-1">Yangi arizalar, qabullar va ro'yxatdan o'tishlar bu yerda ko'rinadi</p>
            </div>
          ) : notifications.map((n, i) => (
            <div key={`${n.id}-${i}`} className={cn("rounded-xl border p-4 flex items-start gap-3",
              n.type === "message" ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800" :
              n.type === "appointment" ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" :
              "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            )}>
              {n.type === "message" ? <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5" /> :
               n.type === "appointment" ? <Calendar className="w-4 h-4 text-blue-600 mt-0.5" /> :
               <Building2 className="w-4 h-4 text-green-600 mt-0.5" />}
              <div>
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{n.time.toLocaleTimeString("uz-UZ")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== MESSAGES ===== */}
      {tab === "messages" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Foydalanuvchi xabarlari</h2>
            <Input placeholder="Qidirish..." className="w-48 h-8 text-xs" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          {messages.filter(m => !searchQ || m.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || m.subject?.toLowerCase().includes(searchQ.toLowerCase())).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Xabarlar yo'q</p>
          ) : messages.filter(m => !searchQ || m.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || m.subject?.toLowerCase().includes(searchQ.toLowerCase())).map(m => (
            <div key={m.id} className={cn("bg-card rounded-xl border p-4 space-y-2",
              m.status === "new" ? "border-yellow-300 dark:border-yellow-700" : "border-border"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">{m.phone} • {m.email || "—"} • {new Date(m.created_at).toLocaleString("uz-UZ")}</p>
                </div>
                <Badge className={cn("text-[10px]",
                  m.status === "new" ? "bg-yellow-100 text-yellow-800" :
                  m.status === "responded" ? "bg-green-100 text-green-800" :
                  m.status === "closed" ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-800"
                )}>{m.status}</Badge>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-primary mb-1">{m.subject}</p>
                <p className="text-sm text-foreground">{m.message}</p>
              </div>
              <div className="flex gap-2">
                {m.status === "new" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => updateMessageStatus(m.id, "in_progress")}>
                      <Eye className="w-3 h-3 mr-1" /> Ko'rib chiqish
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateMessageStatus(m.id, "responded")}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Javob berildi
                    </Button>
                  </>
                )}
                {m.status === "in_progress" && (
                  <Button size="sm" variant="outline" onClick={() => updateMessageStatus(m.id, "responded")}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Javob berildi
                  </Button>
                )}
                {m.status !== "closed" && (
                  <Button size="sm" variant="ghost" onClick={() => updateMessageStatus(m.id, "closed")}>
                    <XCircle className="w-3 h-3 mr-1" /> Yopish
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== CLINICS ===== */}
      {tab === "clinics" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Klinikalar moderatsiyasi ({clinics.length})</h2>
            <Input placeholder="Qidirish..." className="w-48 h-8 text-xs" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          {clinics.filter(c => !searchQ || c.name?.toLowerCase().includes(searchQ.toLowerCase())).map(c => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.address || "—"} • {c.phone || ""} • {c.region || ""}</p>
                <p className="text-xs text-muted-foreground">INN: {c.inn || "—"} • {new Date(c.created_at).toLocaleDateString("uz-UZ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={c.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {c.is_active ? "Faol" : "Nofaol"}
                </Badge>
                <Button size="sm" variant={c.is_active ? "destructive" : "default"}
                  onClick={() => toggleActive("registered_clinics", c.id, c.is_active, setClinics)}>
                  {c.is_active ? "Nofaol qilish" : "Tasdiqlash"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== DOCTORS ===== */}
      {tab === "doctors" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Shifokorlar ({doctors.length})</h2>
            <Input placeholder="Qidirish..." className="w-48 h-8 text-xs" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          {doctors.filter(d => !searchQ || d.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || d.specialty?.toLowerCase().includes(searchQ.toLowerCase())).map(d => (
            <div key={d.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{d.full_name}</p>
                <p className="text-xs text-muted-foreground">{d.specialty} • {d.experience_years || 0} yil tajriba • {d.phone || ""}</p>
                <p className="text-xs text-muted-foreground">Reyting: ⭐ {d.avg_rating || "—"} ({d.review_count || 0} ta sharh)</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={d.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {d.is_active ? "Faol" : "Nofaol"}
                </Badge>
                <Button size="sm" variant={d.is_active ? "destructive" : "default"}
                  onClick={() => toggleActive("doctors", d.id, d.is_active, setDoctors)}>
                  {d.is_active ? "Nofaol" : "Faollashtirish"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== APPOINTMENTS ===== */}
      {tab === "appointments" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Barcha qabullar ({appointments.length})</h2>
            <Input placeholder="Qidirish..." className="w-48 h-8 text-xs" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          {appointments.filter(a => !searchQ || a.patient_name?.toLowerCase().includes(searchQ.toLowerCase())).map(a => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{a.patient_name}</p>
                <p className="text-xs text-muted-foreground">{(a as any).registered_clinics?.name || "—"} • {a.appointment_date} • {a.appointment_time}</p>
                <p className="text-xs text-muted-foreground">{a.patient_phone}</p>
              </div>
              <Badge className={cn("text-[10px]",
                a.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                a.status === "confirmed" ? "bg-green-100 text-green-800" :
                a.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground"
              )}>{a.status}</Badge>
              {a.total_price ? <span className="text-xs font-semibold text-primary">{Number(a.total_price).toLocaleString()} so'm</span> : null}
            </div>
          ))}
        </div>
      )}

      {/* ===== INSTITUTIONS ===== */}
      {tab === "institutions" && (
        <div className="space-y-6">
          {[
            { title: "Diagnostika markazlari", data: diagnostics, icon: Building2, table: "registered_diagnostics", setter: setDiagnostics },
            { title: "Tug'ruqxonalar", data: maternity, icon: Baby, table: "registered_maternity", setter: setMaternity },
            { title: "Kosmetologiya", data: cosmetology, icon: Sparkles, table: "registered_cosmetology", setter: setCosmetology },
            { title: "Dorixonalar", data: pharmacies, icon: Pill, table: "registered_pharmacies", setter: setPharmacies },
            { title: "Qon banklari", data: bloodBanks, icon: Droplets, table: "blood_banks_registered", setter: setBloodBanks },
          ].map(section => (
            <div key={section.title}>
              <h3 className="text-md font-semibold flex items-center gap-2 mb-3">
                <section.icon className="w-4 h-4 text-primary" /> {section.title} ({section.data.length})
              </h3>
              {section.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>
              ) : section.data.map((item: any) => (
                <div key={item.id} className="bg-card rounded-xl border border-border p-3 mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.address || "—"} • {item.phone || ""} • {item.region || ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={item.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {item.is_active ? "Faol" : "Nofaol"}
                    </Badge>
                    <Button size="sm" variant={item.is_active ? "destructive" : "default"}
                      onClick={() => toggleActive(section.table, item.id, item.is_active, section.setter)}>
                      {item.is_active ? "Nofaol" : "Tasdiqlash"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ===== MED TEXNIKA ===== */}
      {tab === "medtech" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Med texnika do'konlari ({vendors.length})</h2>
          {vendors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Med texnika sotuvchilari yo'q</p>
          ) : vendors.map((v: any) => (
            <div key={v.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{v.company_name || v.name}</p>
                <p className="text-xs text-muted-foreground">{v.address || "—"} • {v.phone || ""} • {v.vendor_type || ""}</p>
                <p className="text-xs text-muted-foreground">INN: {v.inn || "—"}</p>
              </div>
              <Badge className={v.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {v.is_active ? "Faol" : "Nofaol"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* ===== BILLING ===== */}
      {tab === "billing" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: "Jami daromad", value: `${(stats.totalRevenue || 0).toLocaleString()} so'm`, color: "text-emerald-500" },
              { icon: Bot, label: "AI daromad", value: `${(stats.aiRevenue || 0).toLocaleString()} so'm`, color: "text-purple-500" },
              { icon: Calendar, label: "Qabullar daromadi", value: `${(stats.apptRevenue || 0).toLocaleString()} so'm`, color: "text-blue-500" },
              { icon: CreditCard, label: "Faol obunalar", value: stats.aiSubs || 0, color: "text-pink-500" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
                <s.icon className={cn("w-5 h-5 mb-2", s.color)} />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Daromad grafigi</h4>
              <ChartPeriodSelector />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="qiymat" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Daromad (so'm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <h3 className="text-md font-semibold">AI to'lovlar tarixi</h3>
          {aiPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">To'lovlar yo'q</p>
          ) : aiPayments.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Invoice: {p.invoice_id}</p>
                <p className="text-xs text-muted-foreground">{p.plan_id} • {p.billing_period} • {new Date(p.created_at).toLocaleDateString("uz-UZ")}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{Number(p.amount).toLocaleString()} so'm</p>
                <Badge className={p.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{p.status}</Badge>
              </div>
            </div>
          ))}

          <h3 className="text-md font-semibold">Faol obunalar</h3>
          {aiSubs.filter(s => s.status === "active").length === 0 ? (
            <p className="text-sm text-muted-foreground">Faol obunalar yo'q</p>
          ) : aiSubs.filter(s => s.status === "active").map(s => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{s.plan_id}</p>
                <p className="text-xs text-muted-foreground">{s.billing_period} • {s.services?.join(", ") || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{s.expires_at ? `Muddat: ${new Date(s.expires_at).toLocaleDateString("uz-UZ")}` : "—"}</p>
                <Badge className="bg-green-100 text-green-800">Faol</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== AI MONITOR ===== */}
      {tab === "ai" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Bot className="w-5 h-5" /> AI Xizmatlar Monitoringi</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Faol obunalar", value: stats.aiSubs || 0 },
              { label: "Jami to'lovlar", value: aiPayments.length },
              { label: "AI daromad", value: `${(stats.aiRevenue || 0).toLocaleString()}` },
              { label: "AI so'rovlar", value: stats.aiUsageTotal || 0 },
              { label: "API holati", value: "✅ Faol", isStatus: true },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">AI xizmatlar monetizatsiyasi</h4>
            <div className="space-y-1">
              {[
                { name: "AI Simptom Analiz", slug: "symptom-checker" },
                { name: "AI Doctor Chat", slug: "ai-doctor-chat" },
                { name: "AI Laboratoriya Analiz", slug: "ai-report-analysis" },
                { name: "AI Salomatlik Prognozi", slug: "ai-health-risk" },
                { name: "AI Radiologiya Pro", slug: "ai-radiology" },
                { name: "AI Sog'liq Assistenti", slug: "ai-health-assistant" },
                { name: "AI Homiladorlik", slug: "ai-pregnancy" },
                { name: "AI Bola Parvarishi", slug: "ai-baby-care" },
                { name: "AI Kosmetologiya", slug: "ai-cosmetology" },
                { name: "AI Dietolog", slug: "ai-dietolog" },
                { name: "AI Psixolog", slug: "ai-psixolog" },
                { name: "AI Farmatsevt", slug: "ai-farmatsevt" },
                { name: "AI Fitness Trener", slug: "ai-fitness" },
              ].map(s => (
                <div key={s.slug} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 text-[10px]">Faol</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== MONITORING ===== */}
      {tab === "monitoring" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" /> Platforma Monitoring</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
              <Cpu className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Server</p>
              <Badge className="bg-green-100 text-green-800 text-[10px] mt-1">Faol</Badge>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
              <Bot className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">AI API</p>
              <Badge className="bg-green-100 text-green-800 text-[10px] mt-1">Faol</Badge>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
              <Activity className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Database</p>
              <Badge className="bg-green-100 text-green-800 text-[10px] mt-1">Faol</Badge>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
              <Bell className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Telegram Bot</p>
              <Badge className="bg-green-100 text-green-800 text-[10px] mt-1">Faol</Badge>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">Foydalanuvchi faolligi</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.users || 0}</p>
                <p className="text-xs text-muted-foreground">Jami foydalanuvchilar</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.appointments || 0}</p>
                <p className="text-xs text-muted-foreground">Jami qabullar</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.aiUsageTotal || 0}</p>
                <p className="text-xs text-muted-foreground">AI so'rovlar</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">Edge Functions holati</h4>
            <div className="space-y-1">
              {["telegram-notify", "symptom-checker", "ai-doctor-chat", "ai-report-analysis", "ai-health-risk",
                "ai-radiology", "ai-health-assistant", "ai-pregnancy", "ai-baby-care", "ai-cosmetology",
                "ai-dietolog", "ai-psixolog", "ai-farmatsevt", "ai-fitness", "company-by-inn", "telegram-otp"
              ].map(fn => (
                <div key={fn} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-foreground font-mono">{fn}</span>
                  <Badge className="bg-green-100 text-green-800 text-[10px]">Running</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== AUDIT ===== */}
      {tab === "audit" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5" /> Audit loglar</h2>
          {auditLogs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Audit loglar yo'q</p>
          ) : auditLogs.map(log => (
            <div key={log.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{log.action}</p>
                <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("uz-UZ")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{log.entity_type} • {log.entity_id || "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
