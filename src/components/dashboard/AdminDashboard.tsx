import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, Calendar, DollarSign, Stethoscope, LogOut, MessageSquare,
  Shield, Activity, Bell, FileText, CheckCircle, XCircle, Clock, Eye,
  Pill, Baby, Sparkles, Droplets, BarChart3, TrendingUp, AlertTriangle,
  Bot, CreditCard, Search, RefreshCw, Monitor, Cpu, Wrench, Store, Plus,
  ChevronLeft, ChevronRight, Home, UserCog, Trash2, Edit, Power,
  Settings, Database, Wifi, Heart, Microscope, Menu, Crown, Megaphone
} from "lucide-react";
import SaaSAdminManager from "@/components/admin/SaaSAdminManager";
import AdminMarketingModule from "@/components/admin/AdminMarketingModule";
import AdminDentalModule from "@/components/admin/AdminDentalModule";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

const COLORS = ["#2F80ED", "#27AE60", "#F2994A", "#EB5757", "#7B61FF", "#06b6d4", "#ec4899", "#eab308"];

// ─── Sidebar Nav Items ───
const sidebarSections = [
  {
    label: "Asosiy", items: [
      { id: "overview", label: "Bosh sahifa", icon: Home },
      { id: "notifications", label: "Bildirishnomalar", icon: Bell },
      { id: "messages", label: "Xabarlar", icon: MessageSquare },
    ]
  },
  {
    label: "Muassasalar", items: [
      { id: "clinics", label: "Klinikalar", icon: Building2 },
      { id: "doctors", label: "Shifokorlar", icon: Stethoscope },
      { id: "diagnostics_tab", label: "Diagnostika", icon: Microscope },
      { id: "maternity_tab", label: "Tug'ruqxonalar", icon: Baby },
      { id: "cosmetology_tab", label: "Kosmetologiya", icon: Sparkles },
      { id: "pharmacies_tab", label: "Dorixonalar", icon: Pill },
      { id: "bloodbanks_tab", label: "Qon banklari", icon: Droplets },
      { id: "medtech", label: "Med texnika", icon: Wrench },
    ]
  },
  {
    label: "Tizim", items: [
      { id: "appointments", label: "Qabullar", icon: Calendar },
      { id: "billing", label: "Hisob-kitob", icon: CreditCard },
      { id: "saas", label: "SaaS Boshqaruv", icon: Crown },
      { id: "ai", label: "AI Monitor", icon: Bot },
      { id: "announcements", label: "E'lonlar", icon: Bell },
      { id: "promotions", label: "Aksiyalar", icon: Heart },
      { id: "admin_users", label: "Adminlar", icon: UserCog },
      { id: "monitoring", label: "Monitoring", icon: Monitor },
      { id: "audit", label: "Audit log", icon: Shield },
    ]
  },
];

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; table: string; id: string; name: string }>({ open: false, table: "", id: "", name: "" });
  const [editDialog, setEditDialog] = useState<{ open: boolean; item: any; table: string; fields: string[] }>({ open: false, item: null, table: "", fields: [] });
  const [editValues, setEditValues] = useState<any>({});
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annTarget, setAnnTarget] = useState("all");
  const [annChannel, setAnnChannel] = useState("push");
  const [promoName, setPromoName] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoExpiry, setPromoExpiry] = useState("");
  const [promoCategory, setPromoCategory] = useState("general");
  const [promos, setPromos] = useState<any[]>([]);

  // ─── Fetch All Data ───
  const fetchAll = useCallback(async () => {
    const [
      clinicRes, doctorRes, apptRes, userRes, srvRes,
      msgRes, auditRes, aiPayRes, aiSubRes,
      diagRes, matRes, cosRes, pharmRes, bbRes, vendorRes, aiUsageRes, adminRes
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
      supabase.from("user_roles").select("*, profiles(full_name, phone)").eq("role", "admin"),
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
    setAdminUsers(adminRes.data || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Real-time ───
  useEffect(() => {
    const channels = [
      supabase.channel("admin-messages")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, (payload) => {
          const msg = payload.new as any;
          setNotifications(prev => [{ id: msg.id, type: "message", title: "📩 Yangi xabar", desc: `${msg.full_name}: ${msg.subject}`, time: new Date() }, ...prev].slice(0, 30));
          setMessages(prev => [msg, ...prev]);
          setStats((prev: any) => ({ ...prev, newMessages: (prev.newMessages || 0) + 1, messages: (prev.messages || 0) + 1 }));
          toast({ title: "📩 Yangi xabar keldi!", description: msg.subject });
        }).subscribe(),
      supabase.channel("admin-appointments")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "appointments" }, (payload) => {
          const appt = payload.new as any;
          setNotifications(prev => [{ id: appt.id, type: "appointment", title: "📅 Yangi qabul", desc: `${appt.patient_name} — ${appt.appointment_date}`, time: new Date() }, ...prev].slice(0, 30));
          setAppointments(prev => [appt, ...prev]);
          toast({ title: "📅 Yangi qabul yozildi!", description: appt.patient_name });
        }).subscribe(),
      supabase.channel("admin-clinics")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "registered_clinics" }, (payload) => {
          const clinic = payload.new as any;
          setNotifications(prev => [{ id: clinic.id, type: "clinic", title: "🏥 Yangi klinika", desc: clinic.name, time: new Date() }, ...prev].slice(0, 30));
          setClinics(prev => [clinic, ...prev]);
          toast({ title: "🏥 Yangi klinika ro'yxatdan o'tdi!", description: clinic.name });
        }).subscribe(),
    ];
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [toast]);

  // ─── Chart builders ───
  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const weekdays = ["Du", "Se", "Chor", "Pay", "Ju", "Sha", "Yak"];

  const buildTimeChart = (items: any[], dateField: string, valueField?: string) => {
    if (chartPeriod === "monthly") {
      const map: Record<string, number> = {};
      items.forEach(item => { const m = new Date(item[dateField]).getMonth(); map[months[m]] = (map[months[m]] || 0) + (valueField ? Number(item[valueField] || 0) : 1); });
      return months.map(m => ({ name: m, qiymat: map[m] || 0 }));
    } else if (chartPeriod === "weekly") {
      const map: Record<string, number> = {};
      items.forEach(item => { const d = new Date(item[dateField]).getDay(); const day = weekdays[d === 0 ? 6 : d - 1]; map[day] = (map[day] || 0) + (valueField ? Number(item[valueField] || 0) : 1); });
      return weekdays.map(d => ({ name: d, qiymat: map[d] || 0 }));
    } else {
      const map: Record<string, number> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); map[`${d.getDate()}/${d.getMonth() + 1}`] = 0; }
      items.forEach(item => { const d = new Date(item[dateField]); const key = `${d.getDate()}/${d.getMonth() + 1}`; if (map[key] !== undefined) map[key] += (valueField ? Number(item[valueField] || 0) : 1); });
      return Object.entries(map).map(([name, qiymat]) => ({ name, qiymat }));
    }
  };

  const apptChartData = buildTimeChart(appointments, "appointment_date");
  const revenueChartData = buildTimeChart(aiPayments.filter(p => p.status === "paid"), "created_at", "amount");

  const institutionPie = [
    { name: "Klinikalar", value: stats.clinics || 0 },
    { name: "Diagnostika", value: stats.diagnostics || 0 },
    { name: "Tug'ruqxona", value: stats.maternity || 0 },
    { name: "Kosmetologiya", value: stats.cosmetology || 0 },
    { name: "Dorixona", value: stats.pharmacies || 0 },
    { name: "Qon bank", value: stats.bloodBanks || 0 },
    { name: "Med texnika", value: stats.vendors || 0 },
  ].filter(d => d.value > 0);

  // ─── CRUD Actions ───
  const updateMessageStatus = async (id: string, status: string) => {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    if (status !== "new") setStats((prev: any) => ({ ...prev, newMessages: Math.max(0, (prev.newMessages || 0) - 1) }));
    toast({ title: `Xabar holati: ${status}` });
  };

  const toggleActive = async (table: string, id: string, current: boolean, setter: Function) => {
    await (supabase.from(table as any) as any).update({ is_active: !current }).eq("id", id);
    setter((prev: any[]) => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    toast({ title: !current ? "✅ Faollashtirildi" : "⛔ Nofaol qilindi" });
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    await (supabase.from(deleteDialog.table as any) as any).delete().eq("id", deleteDialog.id);
    // Remove from local state
    const setterMap: Record<string, Function> = {
      registered_clinics: setClinics, doctors: setDoctors, registered_diagnostics: setDiagnostics,
      registered_maternity: setMaternity, registered_cosmetology: setCosmetology,
      registered_pharmacies: setPharmacies, blood_banks_registered: setBloodBanks, medtech_vendors: setVendors,
    };
    setterMap[deleteDialog.table]?.((prev: any[]) => prev.filter(i => i.id !== deleteDialog.id));
    setDeleteDialog({ open: false, table: "", id: "", name: "" });
    toast({ title: "🗑️ O'chirildi", description: deleteDialog.name });
  };

  const handleEditSave = async () => {
    if (!editDialog.item) return;
    await (supabase.from(editDialog.table as any) as any).update(editValues).eq("id", editDialog.item.id);
    const setterMap: Record<string, Function> = {
      registered_clinics: setClinics, doctors: setDoctors, registered_diagnostics: setDiagnostics,
      registered_maternity: setMaternity, registered_cosmetology: setCosmetology,
      registered_pharmacies: setPharmacies, blood_banks_registered: setBloodBanks, medtech_vendors: setVendors,
    };
    setterMap[editDialog.table]?.((prev: any[]) => prev.map(i => i.id === editDialog.item.id ? { ...i, ...editValues } : i));
    setEditDialog({ open: false, item: null, table: "", fields: [] });
    toast({ title: "✅ Saqlandi" });
  };

  const openEdit = (item: any, table: string, fields: string[]) => {
    const vals: any = {};
    fields.forEach(f => vals[f] = item[f] || "");
    setEditValues(vals);
    setEditDialog({ open: true, item, table, fields });
  };

  const ChartPeriodSelector = () => (
    <div className="flex gap-1 bg-[#0A2540]/10 rounded-lg p-0.5">
      {(["daily", "weekly", "monthly"] as const).map(p => (
        <button key={p} onClick={() => setChartPeriod(p)}
          className={cn("px-3 py-1 text-[11px] font-medium rounded-md transition-all",
            chartPeriod === p ? "bg-[#2F80ED] text-white shadow" : "text-muted-foreground hover:text-foreground"
          )}>
          {p === "daily" ? "Kunlik" : p === "weekly" ? "Haftalik" : "Oylik"}
        </button>
      ))}
    </div>
  );

  // ─── Institution Card Component ───
  const InstitutionCard = ({ item, table, setter, nameField = "name", extraInfo }: any) => (
    <div className="group bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all hover:border-[#2F80ED]/30">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{item[nameField] || item.company_name || "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.address || "—"} • {item.phone || "—"}</p>
          <p className="text-xs text-muted-foreground">{item.region || "—"} • INN: {item.inn || "—"}</p>
          {extraInfo && <p className="text-xs text-muted-foreground">{extraInfo}</p>}
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <Badge className={cn("text-[10px]", item.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
            {item.is_active ? "Faol" : "Nofaol"}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant={item.is_active ? "destructive" : "default"} className="h-7 text-[11px]"
          onClick={() => toggleActive(table, item.id, item.is_active, setter)}>
          <Power className="w-3 h-3 mr-1" /> {item.is_active ? "Nofaol" : "Tasdiqlash"}
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px]"
          onClick={() => openEdit(item, table, ["name", "phone", "address", "region"])}>
          <Edit className="w-3 h-3 mr-1" /> Tahrir
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:text-destructive"
          onClick={() => setDeleteDialog({ open: true, table, id: item.id, name: item[nameField] || item.company_name || "" })}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  // ─── Section Header ───
  const SectionHeader = ({ icon: Icon, title, count, children }: any) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#2F80ED]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#2F80ED]" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {count !== undefined && <Badge variant="secondary" className="text-[10px]">{count}</Badge>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Input placeholder="Qidirish..." className="w-44 h-8 text-xs" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>
    </div>
  );

  const notifCount = notifications.length;
  const msgCount = stats.newMessages || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2540] via-[#0f2d4a] to-[#0A2540] flex">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen z-50 bg-[#0A2540]/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300",
        sidebarOpen ? "w-60" : "w-16"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-white font-bold text-lg">MED1.UZ</h1>
              <p className="text-white/40 text-[10px]">Super Admin Panel</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition">
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {sidebarSections.map(section => (
            <div key={section.label}>
              {sidebarOpen && <p className="text-white/30 text-[10px] uppercase tracking-wider px-2 mb-1">{section.label}</p>}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = tab === item.id;
                  const badge = item.id === "notifications" && notifCount > 0 ? notifCount :
                                item.id === "messages" && msgCount > 0 ? msgCount : null;
                  return (
                    <button key={item.id} onClick={() => setTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all relative",
                        isActive
                          ? "bg-[#2F80ED] text-white shadow-lg shadow-[#2F80ED]/20"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                      {badge && (
                        <span className={cn(
                          "flex items-center justify-center text-[9px] font-bold rounded-full",
                          sidebarOpen ? "ml-auto w-5 h-5" : "absolute -top-1 -right-1 w-4 h-4",
                          "bg-red-500 text-white"
                        )}>{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin Info */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#7B61FF] flex items-center justify-center text-white text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.email || "Admin"}</p>
                <p className="text-white/40 text-[10px]">Super Admin</p>
              </div>
              <button onClick={signOut} className="text-white/40 hover:text-red-400 transition p-1"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={signOut} className="text-white/40 hover:text-red-400 transition p-1 mx-auto block"><LogOut className="w-4 h-4" /></button>
          )}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-60" : "ml-16")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f2d4a]/95 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 rounded-md hover:bg-muted">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-foreground text-lg">
                {sidebarSections.flatMap(s => s.items).find(i => i.id === tab)?.label || "Dashboard"}
              </h2>
              <p className="text-muted-foreground text-xs">Med1.uz markaziy boshqaruv paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifCount > 0 && (
              <Button variant="outline" size="sm" className="relative" onClick={() => setTab("notifications")}>
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{notifCount}</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="w-4 h-4 mr-1" /> Yangilash</Button>
          </div>
        </header>

        <div className="p-6">

          {/* ═══ OVERVIEW ═══ */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { icon: Users, label: "Foydalanuvchilar", value: stats.users, gradient: "from-blue-500 to-blue-600" },
                  { icon: Building2, label: "Faol klinikalar", value: stats.activeClinics, gradient: "from-emerald-500 to-emerald-600" },
                  { icon: Stethoscope, label: "Shifokorlar", value: stats.activeDoctors, gradient: "from-purple-500 to-purple-600" },
                  { icon: Calendar, label: "Qabullar", value: stats.appointments, gradient: "from-orange-500 to-orange-600" },
                  { icon: DollarSign, label: "Jami daromad", value: `${((stats.totalRevenue || 0) / 1e6).toFixed(1)}M`, gradient: "from-pink-500 to-pink-600" },
                ].map(s => (
                  <div key={s.label} className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 hover:shadow-lg transition-shadow">
                    <div className={cn("absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-gradient-to-br opacity-10", s.gradient)} />
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", s.gradient)}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{s.value ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Institution Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { icon: Building2, label: "Klinikalar", value: stats.clinics, color: "#2F80ED" },
                  { icon: Microscope, label: "Diagnostika", value: stats.diagnostics, color: "#7B61FF" },
                  { icon: Baby, label: "Tug'ruqxonalar", value: stats.maternity, color: "#ec4899" },
                  { icon: Sparkles, label: "Kosmetologiya", value: stats.cosmetology, color: "#F2994A" },
                  { icon: Pill, label: "Dorixonalar", value: stats.pharmacies, color: "#27AE60" },
                  { icon: Droplets, label: "Qon banklari", value: stats.bloodBanks, color: "#EB5757" },
                  { icon: Store, label: "Med texnika", value: stats.vendors, color: "#06b6d4" },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center hover:shadow-md transition cursor-pointer"
                    onClick={() => setTab(s.label === "Klinikalar" ? "clinics" : s.label === "Diagnostika" ? "diagnostics_tab" : s.label === "Tug'ruqxonalar" ? "maternity_tab" : s.label === "Kosmetologiya" ? "cosmetology_tab" : s.label === "Dorixonalar" ? "pharmacies_tab" : s.label === "Qon banklari" ? "bloodbanks_tab" : "medtech")}>
                    <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <p className="text-lg font-bold text-foreground">{s.value || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {(stats.newMessages > 0 || notifications.length > 0) && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{stats.newMessages || 0} ta yangi xabar, {notifications.length} ta bildirishnoma</p>
                    <p className="text-xs text-muted-foreground">Foydalanuvchilardan kelgan so'rovlarni ko'rib chiqing</p>
                  </div>
                  <Button size="sm" className="ml-auto shrink-0 bg-[#2F80ED] hover:bg-[#2F80ED]/90" onClick={() => setTab("messages")}>Ko'rish</Button>
                </div>
              )}

              {/* Charts */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Statistika grafiklari</h3>
                <ChartPeriodSelector />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-3">📅 Qabullar dinamikasi</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={apptChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="qiymat" fill="#2F80ED" radius={[6, 6, 0, 0]} name="Qabullar" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-3">💰 Daromad dinamikasi</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="qiymat" stroke="#7B61FF" fill="#7B61FF" fillOpacity={0.15} name="Daromad" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-3">🏥 Muassasalar taqsimoti</h4>
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
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-3">📊 Qabul holatlari</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={[
                        { name: "Kutilmoqda", value: stats.pendingAppts || 0 },
                        { name: "Tugallangan", value: stats.completedAppts || 0 },
                        { name: "Boshqa", value: Math.max(0, (stats.appointments || 0) - (stats.pendingAppts || 0) - (stats.completedAppts || 0)) },
                      ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {[0, 1, 2].map(i => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ═══ NOTIFICATIONS ═══ */}
          {tab === "notifications" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-[#2F80ED]" /> Real vaqt bildirishnomalar</h2>
                {notifications.length > 0 && <Button size="sm" variant="ghost" onClick={() => setNotifications([])}>Tozalash</Button>}
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-16"><Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" /><p className="text-muted-foreground">Hozircha bildirishnomalar yo'q</p></div>
              ) : notifications.map((n, i) => (
                <div key={`${n.id}-${i}`} className={cn("rounded-xl border p-4 flex items-start gap-3",
                  n.type === "message" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" :
                  n.type === "appointment" ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" :
                  "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                )}>
                  {n.type === "message" ? <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5" /> :
                   n.type === "appointment" ? <Calendar className="w-4 h-4 text-blue-600 mt-0.5" /> :
                   <Building2 className="w-4 h-4 text-emerald-600 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{n.time.toLocaleTimeString("uz-UZ")}</span>
                </div>
              ))}
            </div>
          )}

          {/* ═══ MESSAGES ═══ */}
          {tab === "messages" && (
            <div className="space-y-3">
              <SectionHeader icon={MessageSquare} title="Foydalanuvchi xabarlari" count={messages.length} />
              {messages.filter(m => !searchQ || m.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || m.subject?.toLowerCase().includes(searchQ.toLowerCase())).map(m => (
                <div key={m.id} className={cn("bg-card rounded-xl border p-4 space-y-2 hover:shadow-md transition",
                  m.status === "new" ? "border-amber-300 dark:border-amber-700" : "border-border"
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">{m.phone} • {m.email || "—"} • {new Date(m.created_at).toLocaleString("uz-UZ")}</p>
                    </div>
                    <Badge className={cn("text-[10px]",
                      m.status === "new" ? "bg-amber-100 text-amber-800" :
                      m.status === "responded" ? "bg-emerald-100 text-emerald-800" :
                      m.status === "closed" ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-800"
                    )}>{m.status}</Badge>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-[#2F80ED] mb-1">{m.subject}</p>
                    <p className="text-sm text-foreground">{m.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {m.status === "new" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => updateMessageStatus(m.id, "in_progress")}>
                          <Eye className="w-3 h-3 mr-1" /> Ko'rib chiqish
                        </Button>
                        <Button size="sm" className="h-7 text-[11px] bg-[#27AE60] hover:bg-[#27AE60]/90" onClick={() => updateMessageStatus(m.id, "responded")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Javob berildi
                        </Button>
                      </>
                    )}
                    {m.status === "in_progress" && (
                      <Button size="sm" className="h-7 text-[11px] bg-[#27AE60] hover:bg-[#27AE60]/90" onClick={() => updateMessageStatus(m.id, "responded")}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Javob berildi
                      </Button>
                    )}
                    {m.status !== "closed" && (
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => updateMessageStatus(m.id, "closed")}>
                        <XCircle className="w-3 h-3 mr-1" /> Yopish
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center py-12 text-muted-foreground">Xabarlar yo'q</p>}
            </div>
          )}

          {/* ═══ CLINICS ═══ */}
          {tab === "clinics" && (
            <div className="space-y-3">
              <SectionHeader icon={Building2} title="Klinikalar" count={clinics.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {clinics.filter(c => !searchQ || c.name?.toLowerCase().includes(searchQ.toLowerCase())).map(c => (
                  <InstitutionCard key={c.id} item={c} table="registered_clinics" setter={setClinics} />
                ))}
              </div>
            </div>
          )}

          {/* ═══ DOCTORS ═══ */}
          {tab === "doctors" && (
            <div className="space-y-3">
              <SectionHeader icon={Stethoscope} title="Shifokorlar" count={doctors.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {doctors.filter(d => !searchQ || d.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || d.specialty?.toLowerCase().includes(searchQ.toLowerCase())).map(d => (
                  <div key={d.id} className="group bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all hover:border-[#7B61FF]/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{d.full_name}</p>
                        <p className="text-xs text-muted-foreground">{d.specialty} • {d.experience_years || 0} yil • {d.phone || "—"}</p>
                        <p className="text-xs text-muted-foreground">⭐ {d.avg_rating || "—"} ({d.review_count || 0} sharh) • {d.consultation_price?.toLocaleString() || "—"} so'm</p>
                      </div>
                      <Badge className={cn("text-[10px]", d.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                        {d.is_active ? "Faol" : "Nofaol"}
                      </Badge>
                    </div>
                    <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant={d.is_active ? "destructive" : "default"} className="h-7 text-[11px]"
                        onClick={() => toggleActive("doctors", d.id, d.is_active, setDoctors)}>
                        <Power className="w-3 h-3 mr-1" /> {d.is_active ? "Nofaol" : "Faollashtirish"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]"
                        onClick={() => openEdit(d, "doctors", ["full_name", "specialty", "phone", "consultation_price"])}>
                        <Edit className="w-3 h-3 mr-1" /> Tahrir
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, table: "doctors", id: d.id, name: d.full_name })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ INSTITUTION TABS (Diagnostics, Maternity, Cosmetology, Pharmacies, Blood Banks) ═══ */}
          {tab === "diagnostics_tab" && (
            <div className="space-y-3">
              <SectionHeader icon={Microscope} title="Diagnostika markazlari" count={diagnostics.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {diagnostics.filter(d => !searchQ || d.name?.toLowerCase().includes(searchQ.toLowerCase())).map(d => (
                  <InstitutionCard key={d.id} item={d} table="registered_diagnostics" setter={setDiagnostics} />
                ))}
              </div>
              {diagnostics.length === 0 && <p className="text-center py-12 text-muted-foreground">Ma'lumot yo'q</p>}
            </div>
          )}

          {tab === "maternity_tab" && (
            <div className="space-y-3">
              <SectionHeader icon={Baby} title="Tug'ruqxonalar" count={maternity.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {maternity.filter(m => !searchQ || m.name?.toLowerCase().includes(searchQ.toLowerCase())).map(m => (
                  <InstitutionCard key={m.id} item={m} table="registered_maternity" setter={setMaternity} />
                ))}
              </div>
              {maternity.length === 0 && <p className="text-center py-12 text-muted-foreground">Ma'lumot yo'q</p>}
            </div>
          )}

          {tab === "cosmetology_tab" && (
            <div className="space-y-3">
              <SectionHeader icon={Sparkles} title="Kosmetologiya markazlari" count={cosmetology.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {cosmetology.filter(c => !searchQ || c.name?.toLowerCase().includes(searchQ.toLowerCase())).map(c => (
                  <InstitutionCard key={c.id} item={c} table="registered_cosmetology" setter={setCosmetology} />
                ))}
              </div>
              {cosmetology.length === 0 && <p className="text-center py-12 text-muted-foreground">Ma'lumot yo'q</p>}
            </div>
          )}

          {tab === "pharmacies_tab" && (
            <div className="space-y-3">
              <SectionHeader icon={Pill} title="Dorixonalar" count={pharmacies.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pharmacies.filter(p => !searchQ || p.name?.toLowerCase().includes(searchQ.toLowerCase())).map(p => (
                  <InstitutionCard key={p.id} item={p} table="registered_pharmacies" setter={setPharmacies} />
                ))}
              </div>
              {pharmacies.length === 0 && <p className="text-center py-12 text-muted-foreground">Ma'lumot yo'q</p>}
            </div>
          )}

          {tab === "bloodbanks_tab" && (
            <div className="space-y-3">
              <SectionHeader icon={Droplets} title="Qon banklari" count={bloodBanks.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {bloodBanks.filter(b => !searchQ || b.name?.toLowerCase().includes(searchQ.toLowerCase())).map(b => (
                  <InstitutionCard key={b.id} item={b} table="blood_banks_registered" setter={setBloodBanks} />
                ))}
              </div>
              {bloodBanks.length === 0 && <p className="text-center py-12 text-muted-foreground">Ma'lumot yo'q</p>}
            </div>
          )}

          {/* ═══ MED TEXNIKA ═══ */}
          {tab === "medtech" && (
            <div className="space-y-3">
              <SectionHeader icon={Wrench} title="Med texnika do'konlari" count={vendors.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {vendors.filter(v => !searchQ || (v.company_name || v.name || "").toLowerCase().includes(searchQ.toLowerCase())).map(v => (
                  <InstitutionCard key={v.id} item={v} table="medtech_vendors" setter={setVendors} nameField="company_name"
                    extraInfo={`Turi: ${v.vendor_type || "—"}`} />
                ))}
              </div>
              {vendors.length === 0 && <p className="text-center py-12 text-muted-foreground">Ma'lumot yo'q</p>}
            </div>
          )}

          {/* ═══ APPOINTMENTS (ENHANCED) ═══ */}
          {tab === "appointments" && (
            <div className="space-y-4">
              <SectionHeader icon={Calendar} title="Barcha qabullar" count={appointments.length}>
                <div className="flex gap-1">
                  {["all", "pending", "confirmed", "completed", "cancelled"].map(s => (
                    <button key={s} onClick={() => setSearchQ(s === "all" ? "" : s)}
                      className={cn("px-3 py-1 text-[11px] font-medium rounded-lg transition-all",
                        (s === "all" && !searchQ) || searchQ === s ? "bg-[#2F80ED] text-white" : "text-muted-foreground hover:bg-muted"
                      )}>
                      {s === "all" ? "Barchasi" : s === "pending" ? "Kutilmoqda" : s === "confirmed" ? "Tasdiqlangan" : s === "completed" ? "Tugallangan" : "Bekor"}
                    </button>
                  ))}
                </div>
              </SectionHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Jami", value: appointments.length, icon: Calendar, color: "from-blue-500 to-blue-600" },
                  { label: "Kutilmoqda", value: appointments.filter(a => a.status === "pending").length, icon: Clock, color: "from-amber-500 to-amber-600" },
                  { label: "Tasdiqlangan", value: appointments.filter(a => a.status === "confirmed").length, icon: CheckCircle, color: "from-emerald-500 to-emerald-600" },
                  { label: "Daromad", value: `${appointments.filter(a => a.status === "completed").reduce((s, a) => s + Number(a.total_price || 0), 0).toLocaleString()}`, icon: DollarSign, color: "from-purple-500 to-purple-600" },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-4">
                    <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", s.color)}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {appointments.filter(a => {
                  if (searchQ && ["pending","confirmed","completed","cancelled"].includes(searchQ)) return a.status === searchQ;
                  if (searchQ) return a.patient_name?.toLowerCase().includes(searchQ.toLowerCase());
                  return true;
                }).map(a => (
                  <div key={a.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/20 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-foreground">{a.patient_name}</p>
                          <Badge className={cn("text-[10px]",
                            a.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                            a.status === "confirmed" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                            a.status === "completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          )}>{a.status === "pending" ? "Kutilmoqda" : a.status === "confirmed" ? "Tasdiqlangan" : a.status === "completed" ? "Tugallangan" : "Bekor"}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          <div className="text-xs"><span className="text-muted-foreground">🏥 </span><span className="text-foreground">{(a as any).registered_clinics?.name || "—"}</span></div>
                          <div className="text-xs"><span className="text-muted-foreground">📅 </span><span className="text-foreground">{a.appointment_date}</span></div>
                          <div className="text-xs"><span className="text-muted-foreground">⏰ </span><span className="text-foreground">{a.appointment_time}</span></div>
                          <div className="text-xs"><span className="text-muted-foreground">📞 </span><span className="text-foreground">{a.patient_phone}</span></div>
                        </div>
                        {a.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2">📝 {a.notes}</p>}
                      </div>
                      <div className="text-right ml-4">
                        {a.total_price ? (
                          <p className="text-sm font-black text-[#2F80ED]">{Number(a.total_price).toLocaleString()} <span className="text-[10px] font-normal">so'm</span></p>
                        ) : <p className="text-xs text-muted-foreground">—</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {appointments.length === 0 && <p className="text-center py-12 text-muted-foreground">Qabullar yo'q</p>}
            </div>
          )}

          {/* ═══ BILLING ═══ */}
          {tab === "billing" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { icon: DollarSign, label: "Jami daromad", value: `${(stats.totalRevenue || 0).toLocaleString()} so'm`, gradient: "from-emerald-500 to-emerald-600" },
                  { icon: Bot, label: "AI daromad", value: `${(stats.aiRevenue || 0).toLocaleString()} so'm`, gradient: "from-purple-500 to-purple-600" },
                  { icon: Calendar, label: "Qabullar daromadi", value: `${(stats.apptRevenue || 0).toLocaleString()} so'm`, gradient: "from-blue-500 to-blue-600" },
                  { icon: CreditCard, label: "Faol obunalar", value: stats.aiSubs || 0, gradient: "from-pink-500 to-pink-600" },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", s.gradient)}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">💰 Daromad grafigi</h4>
                  <ChartPeriodSelector />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="qiymat" stroke="#7B61FF" fill="#7B61FF" fillOpacity={0.15} name="Daromad (so'm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">AI to'lovlar tarixi (Cheklar)</h3>
                <Badge variant="secondary" className="text-[10px]">{aiPayments.length} ta chek</Badge>
              </div>
              {aiPayments.map(p => (
                <div key={p.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/20 transition-all mb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-primary" />
                        <p className="text-sm font-bold text-foreground">Invoice: {p.invoice_id}</p>
                        <Badge className={cn("text-[10px]",
                          p.status === "paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        )}>{p.status === "paid" ? "✅ To'langan" : "⏳ Kutilmoqda"}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        <div className="text-xs"><span className="text-muted-foreground">📦 Plan: </span><span className="text-foreground font-medium">{p.plan_id}</span></div>
                        <div className="text-xs"><span className="text-muted-foreground">📅 Muddat: </span><span className="text-foreground font-medium">{p.billing_period}</span></div>
                        <div className="text-xs"><span className="text-muted-foreground">🕐 Sana: </span><span className="text-foreground font-medium">{new Date(p.created_at).toLocaleDateString("uz-UZ")}</span></div>
                        <div className="text-xs"><span className="text-muted-foreground">💳 Usul: </span><span className="text-foreground font-medium">{p.payment_method || "—"}</span></div>
                      </div>
                      {p.services && p.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(p.services as string[]).map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[9px]">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-black text-[#2F80ED]">{Number(p.amount).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">so'm</p>
                      {p.paid_at && <p className="text-[10px] text-emerald-600 mt-1">✅ {new Date(p.paid_at).toLocaleDateString("uz-UZ")}</p>}
                    </div>
                  </div>
                </div>
              ))}
              {aiPayments.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">To'lovlar yo'q</p>}
            </div>
          )}

          {/* ═══ AI MONITOR (ENHANCED) ═══ */}
          {tab === "ai" && (
            <div className="space-y-6">
              <SectionHeader icon={Bot} title="AI Xizmatlar Monitoringi" count={undefined} />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Faol obunalar", value: stats.aiSubs || 0, icon: CreditCard, gradient: "from-purple-500 to-purple-600" },
                  { label: "Jami to'lovlar", value: aiPayments.length, icon: FileText, gradient: "from-blue-500 to-blue-600" },
                  { label: "AI daromad", value: `${((stats.aiRevenue || 0) / 1000).toFixed(0)}K`, icon: DollarSign, gradient: "from-emerald-500 to-emerald-600" },
                  { label: "AI so'rovlar", value: stats.aiUsageTotal || 0, icon: Activity, gradient: "from-amber-500 to-amber-600" },
                  { label: "API holati", value: "✅ Faol", icon: Cpu, gradient: "from-pink-500 to-pink-600" },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center hover:shadow-md transition">
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-2 mx-auto", s.gradient)}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* AI Revenue Chart */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">🤖 AI daromad grafigi</h4>
                  <ChartPeriodSelector />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="qiymat" stroke="#7B61FF" fill="#7B61FF" fillOpacity={0.15} name="AI daromad" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* AI Services Status */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3">🤖 14 ta AI xizmat holati</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { name: "AI Simptom Analiz", fn: "symptom-checker" },
                    { name: "AI Doctor Chat", fn: "ai-doctor-chat" },
                    { name: "AI Laboratoriya Analiz", fn: "ai-report-analysis" },
                    { name: "AI Salomatlik Prognozi", fn: "ai-health-risk" },
                    { name: "AI Radiologiya Pro", fn: "ai-radiology" },
                    { name: "AI Sog'liq Assistenti", fn: "ai-health-assistant" },
                    { name: "AI Homiladorlik", fn: "ai-pregnancy" },
                    { name: "AI Bola Parvarishi", fn: "ai-baby-care" },
                    { name: "AI Kosmetologiya", fn: "ai-cosmetology" },
                    { name: "AI Dietolog", fn: "ai-dietolog" },
                    { name: "AI Psixolog", fn: "ai-psixolog" },
                    { name: "AI Farmatsevt", fn: "ai-farmatsevt" },
                    { name: "AI Fitness Trener", fn: "ai-fitness" },
                    { name: "AI Vital Signs", fn: "ai-vital-signs" },
                  ].map(s => (
                    <div key={s.name} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-foreground font-medium">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">{s.fn}</span>
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">Faol</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Payments / Invoices List */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">🧾 AI cheklar (Invoices)</h4>
                  <Badge variant="secondary" className="text-[10px]">{aiPayments.length} ta</Badge>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {aiPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                          p.status === "paid" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                        )}>
                          <FileText className={cn("w-4 h-4", p.status === "paid" ? "text-emerald-600" : "text-amber-600")} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{p.invoice_id}</p>
                          <p className="text-[10px] text-muted-foreground">{p.plan_id} • {p.billing_period} • {new Date(p.created_at).toLocaleDateString("uz-UZ")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground text-sm">{Number(p.amount).toLocaleString()} so'm</p>
                        <Badge className={cn("text-[9px]", p.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{p.status === "paid" ? "To'langan" : "Kutilmoqda"}</Badge>
                      </div>
                    </div>
                  ))}
                  {aiPayments.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">AI to'lovlar yo'q</p>}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ADMIN USERS ═══ */}
          {tab === "admin_users" && (
            <div className="space-y-4">
              <SectionHeader icon={UserCog} title="Adminlar boshqaruvi" count={adminUsers.length} />
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-sm text-muted-foreground mb-4">Hozirgi Super Admin: <strong className="text-foreground">{user?.email}</strong></p>
                <h4 className="text-sm font-semibold text-foreground mb-3">Admin ro'yxati</h4>
                {adminUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Admin topilmadi</p>
                ) : adminUsers.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#7B61FF] flex items-center justify-center text-white text-sm font-bold">
                        {(a.profiles?.full_name || "A").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{a.profiles?.full_name || "Noma'lum"}</p>
                        <p className="text-xs text-muted-foreground">ID: {a.user_id?.slice(0, 8)}... • {a.profiles?.phone || "—"}</p>
                      </div>
                    </div>
                    <Badge className="bg-[#7B61FF]/10 text-[#7B61FF]">{a.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ MONITORING ═══ */}
          {tab === "monitoring" && (
            <div className="space-y-6">
              <SectionHeader icon={Monitor} title="Platforma Monitoring" count={undefined} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Cpu, label: "Server", status: "Faol" },
                  { icon: Bot, label: "AI API", status: "Faol" },
                  { icon: Database, label: "Database", status: "Faol" },
                  { icon: Wifi, label: "Telegram Bot", status: "Faol" },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                      <s.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-foreground">{s.label}</p>
                    <Badge className="bg-emerald-100 text-emerald-700 mt-2">{s.status}</Badge>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3">📊 Foydalanuvchi faolligi</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-xl">
                    <p className="text-2xl font-bold text-foreground">{stats.users || 0}</p>
                    <p className="text-xs text-muted-foreground">Jami foydalanuvchilar</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-xl">
                    <p className="text-2xl font-bold text-foreground">{stats.appointments || 0}</p>
                    <p className="text-xs text-muted-foreground">Jami qabullar</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-xl">
                    <p className="text-2xl font-bold text-foreground">{stats.aiUsageTotal || 0}</p>
                    <p className="text-xs text-muted-foreground">AI so'rovlar</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3">⚡ Edge Functions holati</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {["telegram-notify", "symptom-checker", "ai-doctor-chat", "ai-report-analysis", "ai-health-risk",
                    "ai-radiology", "ai-health-assistant", "ai-pregnancy", "ai-baby-care", "ai-cosmetology",
                    "ai-dietolog", "ai-psixolog", "ai-farmatsevt", "ai-fitness", "company-by-inn", "telegram-otp"
                  ].map(fn => (
                    <div key={fn} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition">
                      <span className="text-sm text-foreground font-mono">{fn}</span>
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Running</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ANNOUNCEMENTS (ENHANCED) ═══ */}
          {tab === "announcements" && (
            <div className="space-y-6">
              <SectionHeader icon={Bell} title="E'lonlar boshqaruvi" count={undefined} />

              {/* Send channels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Bell, title: "Push notification", desc: "Platformadagi barcha foydalanuvchilarga", color: "from-blue-500 to-blue-600", channel: "push" },
                  { icon: MessageSquare, title: "Email xabar", desc: "Email orqali segment bo'yicha yuborish", color: "from-emerald-500 to-emerald-600", channel: "email" },
                  { icon: Activity, title: "Telegram xabar", desc: "Telegram bot orqali ommaviy xabar", color: "from-purple-500 to-purple-600", channel: "telegram" },
                ].map(ch => (
                  <div key={ch.channel} onClick={() => setAnnChannel(ch.channel)}
                    className={cn("bg-card rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md",
                      annChannel === ch.channel ? "border-primary shadow-lg" : "border-border"
                    )}>
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", ch.color)}>
                      <ch.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm mb-1">{ch.title}</h3>
                    <p className="text-xs text-muted-foreground">{ch.desc}</p>
                    {annChannel === ch.channel && <Badge className="mt-2 bg-primary/10 text-primary text-[10px]">Tanlangan</Badge>}
                  </div>
                ))}
              </div>

              {/* Compose form */}
              <Card><CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Yangi e'lon yaratish</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Maqsadli segment</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "all", label: "Hammaga" },
                      { id: "clinics", label: "🏥 Klinikalar" },
                      { id: "doctors", label: "👨‍⚕️ Shifokorlar" },
                      { id: "patients", label: "👤 Bemorlar" },
                      { id: "diagnostics", label: "🔬 Diagnostika" },
                      { id: "pharmacies", label: "💊 Dorixonalar" },
                    ].map(seg => (
                      <button key={seg.id} onClick={() => setAnnTarget(seg.id)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          annTarget === seg.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                        )}>{seg.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">E'lon sarlavhasi</label>
                  <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Masalan: Yangi xizmat ishga tushdi!" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Xabar matni</label>
                  <textarea value={annContent} onChange={e => setAnnContent(e.target.value)}
                    placeholder="E'lon matni..." rows={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex gap-2">
                  <Button className="bg-[#2F80ED] hover:bg-[#2F80ED]/90" onClick={() => {
                    toast({ title: "📢 E'lon yuborildi!", description: `${annTarget === "all" ? "Barcha foydalanuvchilarga" : annTarget} — ${annChannel} orqali` });
                    setAnnTitle(""); setAnnContent("");
                  }}>
                    <Bell className="w-4 h-4 mr-1" /> Yuborish
                  </Button>
                  <Button variant="outline" onClick={() => { setAnnTitle(""); setAnnContent(""); }}>Tozalash</Button>
                </div>
              </CardContent></Card>

              {/* History */}
              <Card><CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3">📜 E'lonlar tarixi</h3>
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground text-sm">Hali e'lonlar yuborilmagan</p>
                  <p className="text-xs text-muted-foreground mt-1">Yangi e'lon yuborilganda bu yerda ko'rinadi</p>
                </div>
              </CardContent></Card>
            </div>
          )}

          {/* ═══ PROMOTIONS (ENHANCED) ═══ */}
          {tab === "promotions" && (
            <div className="space-y-6">
              <SectionHeader icon={Heart} title="Aksiyalar boshqaruvi" count={promos.length} />

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Faol aksiyalar", value: promos.filter(p => p.active).length, icon: Heart, gradient: "from-emerald-500 to-emerald-600" },
                  { label: "Tugagan", value: promos.filter(p => !p.active).length, icon: XCircle, gradient: "from-red-500 to-red-600" },
                  { label: "Jami aksiyalar", value: promos.length, icon: FileText, gradient: "from-blue-500 to-blue-600" },
                  { label: "O'rt. chegirma", value: promos.length > 0 ? `${Math.round(promos.reduce((s, p) => s + p.discount, 0) / promos.length)}%` : "0%", icon: DollarSign, gradient: "from-purple-500 to-purple-600" },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition">
                    <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", s.gradient)}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Create promo form */}
              <Card><CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> Yangi aksiya yaratish
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Aksiya nomi</label>
                    <Input value={promoName} onChange={e => setPromoName(e.target.value)} placeholder="Masalan: Yoz chegirmasi" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Chegirma foizi (%)</label>
                    <Input type="number" value={promoDiscount} onChange={e => setPromoDiscount(e.target.value)} placeholder="20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Amal qilish muddati</label>
                    <Input type="date" value={promoExpiry} onChange={e => setPromoExpiry(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Kategoriya</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "general", label: "🌐 Umumiy" },
                        { id: "clinic", label: "🏥 Klinikalar" },
                        { id: "ai", label: "🤖 AI xizmat" },
                        { id: "pharmacy", label: "💊 Dorixona" },
                      ].map(c => (
                        <button key={c.id} onClick={() => setPromoCategory(c.id)}
                          className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                            promoCategory === c.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                          )}>{c.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button className="bg-[#2F80ED] hover:bg-[#2F80ED]/90" onClick={() => {
                  if (!promoName || !promoDiscount) {
                    toast({ title: "Aksiya nomi va chegirma foizini kiriting", variant: "destructive" });
                    return;
                  }
                  const newPromo = {
                    id: Date.now().toString(), name: promoName, discount: Number(promoDiscount),
                    expiry: promoExpiry, category: promoCategory, active: true, createdAt: new Date().toISOString()
                  };
                  setPromos(prev => [newPromo, ...prev]);
                  setPromoName(""); setPromoDiscount(""); setPromoExpiry("");
                  toast({ title: "✅ Aksiya yaratildi!", description: promoName });
                }}>
                  <Plus className="w-4 h-4 mr-1" /> Aksiya yaratish
                </Button>
              </CardContent></Card>

              {/* Promos list */}
              <Card><CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3">📋 Aksiyalar ro'yxati</h3>
                {promos.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-muted-foreground text-sm">Hali aksiyalar yaratilmagan</p>
                    <p className="text-xs text-muted-foreground mt-1">Yuqoridagi forma orqali yangi aksiya yarating</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {promos.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                            p.active ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                          )}>
                            <Heart className={cn("w-5 h-5", p.active ? "text-emerald-600" : "text-red-500")} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {p.category === "clinic" ? "🏥 Klinikalar" : p.category === "ai" ? "🤖 AI" : p.category === "pharmacy" ? "💊 Dorixona" : "🌐 Umumiy"}
                              {p.expiry && ` • Muddati: ${p.expiry}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary font-bold text-sm">-{p.discount}%</Badge>
                          <Button size="sm" variant={p.active ? "destructive" : "default"} className="h-7 text-[10px]"
                            onClick={() => setPromos(prev => prev.map(pr => pr.id === p.id ? { ...pr, active: !pr.active } : pr))}>
                            <Power className="w-3 h-3 mr-1" /> {p.active ? "Nofaol" : "Faol"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive"
                            onClick={() => setPromos(prev => prev.filter(pr => pr.id !== p.id))}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent></Card>
            </div>
          )}

          {/* ═══ AUDIT ═══ */}
          {tab === "saas" && <SaaSAdminManager />}

          {tab === "audit" && (
            <div className="space-y-3">
              <SectionHeader icon={Shield} title="Audit loglar" count={auditLogs.length} />
              {auditLogs.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Audit loglar yo'q</p>
              ) : auditLogs.map(log => (
                <div key={log.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{log.action}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString("uz-UZ")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{log.entity_type} • {log.entity_id || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ═══ DELETE DIALOG ═══ */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
            <DialogDescription>
              <strong>"{deleteDialog.name}"</strong> ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, table: "", id: "", name: "" })}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleDelete}>O'chirish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT DIALOG ═══ */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ma'lumotlarni tahrirlash</DialogTitle>
            <DialogDescription>Kerakli maydonlarni o'zgartiring va saqlang.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {editDialog.fields.map(field => (
              <div key={field}>
                <label className="text-xs font-medium text-muted-foreground capitalize">{field.replace(/_/g, " ")}</label>
                <Input value={editValues[field] || ""} onChange={e => setEditValues((prev: any) => ({ ...prev, [field]: e.target.value }))} className="mt-1" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, item: null, table: "", fields: [] })}>Bekor qilish</Button>
            <Button className="bg-[#2F80ED] hover:bg-[#2F80ED]/90" onClick={handleEditSave}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
