import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, Calendar, DollarSign, Stethoscope, LogOut, MessageSquare,
  Shield, Activity, Bell, FileText, CheckCircle, XCircle, Clock, Eye,
  Pill, Baby, Sparkles, Droplets, BarChart3, TrendingUp, AlertTriangle,
  Bot, CreditCard, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [
      clinicRes, doctorRes, apptRes, userRes, srvRes,
      msgRes, auditRes, aiPayRes, aiSubRes,
      diagRes, matRes, cosRes, pharmRes, bbRes
    ] = await Promise.all([
      supabase.from("registered_clinics").select("*").order("created_at", { ascending: false }),
      supabase.from("doctors").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("*, registered_clinics(name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("clinic_services").select("id", { count: "exact" }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_payments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_diagnostics").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_maternity").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_cosmetology").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_pharmacies").select("*").order("created_at", { ascending: false }),
      supabase.from("blood_banks_registered").select("*").order("created_at", { ascending: false }),
    ]);

    const appts = apptRes.data || [];
    const pays = aiPayRes.data || [];
    const totalRevenue = pays.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
    const apptRevenue = appts.filter(a => a.status === "completed").reduce((s, a) => s + Number(a.total_price || 0), 0);

    setStats({
      users: userRes.count || 0,
      clinics: clinicRes.data?.length || 0,
      doctors: doctorRes.data?.length || 0,
      services: srvRes.count || 0,
      appointments: appts.length,
      messages: msgRes.data?.length || 0,
      diagnostics: diagRes.data?.length || 0,
      maternity: matRes.data?.length || 0,
      cosmetology: cosRes.data?.length || 0,
      pharmacies: pharmRes.data?.length || 0,
      bloodBanks: bbRes.data?.length || 0,
      aiRevenue: totalRevenue,
      apptRevenue: apptRevenue,
      totalRevenue: totalRevenue + apptRevenue,
      aiSubs: aiSubRes.data?.filter(s => s.status === "active").length || 0,
      newMessages: msgRes.data?.filter((m: any) => m.status === "new").length || 0,
    });

    setClinics(clinicRes.data || []);
    setDoctors(doctorRes.data || []);
    setAppointments(appts);
    setMessages(msgRes.data || []);
    setAuditLogs(auditRes.data || []);
    setAiPayments(pays);
    setAiSubs(aiSubRes.data || []);
    setDiagnostics(diagRes.data || []);
    setMaternity(matRes.data || []);
    setCosmetology(cosRes.data || []);
    setPharmacies(pharmRes.data || []);
    setBloodBanks(bbRes.data || []);
  };

  const updateMessageStatus = async (id: string, status: string) => {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    toast({ title: `Xabar holati: ${status}` });
  };

  const toggleClinicActive = async (id: string, current: boolean) => {
    await supabase.from("registered_clinics").update({ is_active: !current }).eq("id", id);
    setClinics(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    toast({ title: !current ? "Klinika faollashtirildi" : "Klinika nofaol qilindi" });
  };

  const tabs = [
    { id: "overview", label: "Umumiy", icon: BarChart3 },
    { id: "messages", label: `Xabarlar ${stats.newMessages > 0 ? `(${stats.newMessages})` : ""}`, icon: MessageSquare },
    { id: "clinics", label: "Klinikalar", icon: Building2 },
    { id: "doctors", label: "Shifokorlar", icon: Stethoscope },
    { id: "appointments", label: "Qabullar", icon: Calendar },
    { id: "institutions", label: "Muassasalar", icon: Building2 },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "ai", label: "AI Monitor", icon: Bot },
    { id: "audit", label: "Audit", icon: Shield },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Super Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">Med1.uz markaziy boshqaruv paneli</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}><Activity className="w-4 h-4 mr-1" /> Yangilash</Button>
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

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Users, label: "Foydalanuvchilar", value: stats.users, color: "text-blue-500" },
              { icon: Building2, label: "Klinikalar", value: stats.clinics, color: "text-green-500" },
              { icon: Stethoscope, label: "Shifokorlar", value: stats.doctors, color: "text-purple-500" },
              { icon: Calendar, label: "Qabullar", value: stats.appointments, color: "text-orange-500" },
              { icon: Bot, label: "AI Obunalar", value: stats.aiSubs, color: "text-pink-500" },
              { icon: DollarSign, label: "Daromad", value: `${(stats.totalRevenue || 0).toLocaleString()} so'm`, color: "text-emerald-500" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <s.icon className={cn("w-5 h-5 mb-2", s.color)} />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Muassasalar qisqacha */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: Building2, label: "Diagnostika", value: stats.diagnostics },
              { icon: Baby, label: "Tug'ruqxonalar", value: stats.maternity },
              { icon: Sparkles, label: "Kosmetologiya", value: stats.cosmetology },
              { icon: Pill, label: "Dorixonalar", value: stats.pharmacies },
              { icon: Droplets, label: "Qon banklari", value: stats.bloodBanks },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center">
                <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{s.value || 0}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Yangi xabarlar */}
          {stats.newMessages > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-foreground">{stats.newMessages} ta yangi xabar!</p>
                <p className="text-xs text-muted-foreground">Foydalanuvchilardan kelgan xabarlarni ko'rib chiqing</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setTab("messages")}>Ko'rish</Button>
            </div>
          )}
        </div>
      )}

      {/* MESSAGES */}
      {tab === "messages" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Foydalanuvchi xabarlari</h2>
          {messages.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Xabarlar yo'q</p>
          ) : messages.map(m => (
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

      {/* CLINICS MODERATION */}
      {tab === "clinics" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Klinikalar moderatsiyasi</h2>
          {clinics.map(c => (
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
                <Button size="sm" variant={c.is_active ? "destructive" : "default"} onClick={() => toggleClinicActive(c.id, c.is_active)}>
                  {c.is_active ? "Nofaol qilish" : "Tasdiqlash"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCTORS */}
      {tab === "doctors" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Shifokorlar ro'yxati</h2>
          {doctors.map(d => (
            <div key={d.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{d.full_name}</p>
                <p className="text-xs text-muted-foreground">{d.specialty} • {d.experience_years || 0} yil tajriba • {d.phone || ""}</p>
              </div>
              <Badge className={d.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {d.is_active ? "Faol" : "Nofaol"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* APPOINTMENTS */}
      {tab === "appointments" && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Barcha qabullar</h2>
          {appointments.map(a => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{a.patient_name}</p>
                <p className="text-xs text-muted-foreground">{a.registered_clinics?.name || "—"} • {a.appointment_date} • {a.appointment_time}</p>
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

      {/* INSTITUTIONS */}
      {tab === "institutions" && (
        <div className="space-y-6">
          {[
            { title: "Diagnostika markazlari", data: diagnostics, icon: Building2 },
            { title: "Tug'ruqxonalar", data: maternity, icon: Baby },
            { title: "Kosmetologiya", data: cosmetology, icon: Sparkles },
            { title: "Dorixonalar", data: pharmacies, icon: Pill },
            { title: "Qon banklari", data: bloodBanks, icon: Droplets },
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
                    <p className="text-xs text-muted-foreground">{item.address || "—"} • {item.phone || ""}</p>
                  </div>
                  <Badge className={item.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {item.is_active ? "Faol" : "Nofaol"}
                  </Badge>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* BILLING */}
      {tab === "billing" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">{(stats.totalRevenue || 0).toLocaleString()} so'm</p>
              <p className="text-xs text-muted-foreground">Jami daromad</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <Bot className="w-5 h-5 text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">{(stats.aiRevenue || 0).toLocaleString()} so'm</p>
              <p className="text-xs text-muted-foreground">AI xizmatlar daromadi</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <Calendar className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">{(stats.apptRevenue || 0).toLocaleString()} so'm</p>
              <p className="text-xs text-muted-foreground">Qabullar daromadi</p>
            </div>
          </div>

          <h3 className="text-md font-semibold">AI To'lovlar tarixi</h3>
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
                <Badge className={p.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {p.status}
                </Badge>
              </div>
            </div>
          ))}

          <h3 className="text-md font-semibold">Faol AI obunalar</h3>
          {aiSubs.filter(s => s.status === "active").length === 0 ? (
            <p className="text-sm text-muted-foreground">Faol obunalar yo'q</p>
          ) : aiSubs.filter(s => s.status === "active").map(s => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{s.plan_id}</p>
                <p className="text-xs text-muted-foreground">{s.billing_period} • {s.services?.join(", ") || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{s.expires_at ? `Amal qilish: ${new Date(s.expires_at).toLocaleDateString("uz-UZ")}` : "—"}</p>
                <Badge className="bg-green-100 text-green-800">Faol</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI MONITOR */}
      {tab === "ai" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Bot className="w-5 h-5" /> AI Xizmatlar Monitoringi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.aiSubs || 0}</p>
              <p className="text-xs text-muted-foreground">Faol obunalar</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{aiPayments.length}</p>
              <p className="text-xs text-muted-foreground">Jami to'lovlar</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{(stats.aiRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">AI daromad (so'm)</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">API holati: Faol</p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-2">AI xizmatlar ro'yxati</h4>
            {["symptom-checker","ai-doctor-chat","ai-report-analysis","ai-health-risk","ai-radiology","ai-health-assistant","ai-pregnancy","ai-baby-care","ai-cosmetology","ai-dietolog","ai-psixolog","ai-farmatsevt","ai-fitness"].map(s => (
              <div key={s} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{s}</span>
                <Badge className="bg-green-100 text-green-800 text-[10px]">Faol</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT */}
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
