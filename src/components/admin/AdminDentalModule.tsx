import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Users, Calendar, DollarSign, Heart, Camera,
  TrendingUp, Power, Eye, Activity, Building2
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#2F80ED", "#27AE60", "#F2994A", "#EB5757", "#7B61FF", "#06b6d4"];

const AdminDentalModule = () => {
  const { toast } = useToast();
  const [section, setSection] = useState<"dashboard" | "clinics" | "doctors" | "patients" | "treatments" | "appointments" | "billing" | "imaging">("dashboard");
  const [clinics, setClinics] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState("");

  const fetchAll = useCallback(async () => {
    const [c, p, a, t, st, tr, f, s] = await Promise.all([
      supabase.from("registered_dental_clinics").select("*").order("created_at", { ascending: false }),
      supabase.from("dental_patients").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("dental_appointments").select("*").order("appointment_date", { ascending: false }).limit(500),
      supabase.from("dental_treatments").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("dental_staff").select("*"),
      supabase.from("dental_transactions").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("dental_files").select("*").limit(200),
      supabase.from("dental_services").select("*"),
    ]);
    setClinics(c.data || []);
    setPatients(p.data || []);
    setAppointments(a.data || []);
    setTreatments(t.data || []);
    setStaff(st.data || []);
    setTransactions(tr.data || []);
    setFiles(f.data || []);
    setServices(s.data || []);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const totalRevenue = transactions.filter(t => t.status === "paid").reduce((s, t) => s + Number(t.total_amount || t.amount || 0), 0);
  const activeClinics = clinics.filter(c => c.is_active).length;

  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const apptByMonth = months.map((m, i) => ({
    name: m,
    qabullar: appointments.filter(a => new Date(a.appointment_date).getMonth() === i).length,
  }));

  // Service usage stats
  const serviceCount: Record<string, number> = {};
  treatments.forEach(t => {
    const name = t.service_name || t.procedure_type || "Boshqa";
    serviceCount[name] = (serviceCount[name] || 0) + 1;
  });
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  const toggleClinic = async (id: string, current: boolean) => {
    await supabase.from("registered_dental_clinics").update({ is_active: !current }).eq("id", id);
    setClinics(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    toast({ title: !current ? "✅ Faollashtirildi" : "⛔ Bloklandi" });
  };

  const sections = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "clinics", label: "Klinikalar", icon: Building2 },
    { id: "doctors", label: "Stomatologlar", icon: Stethoscope },
    { id: "patients", label: "Bemorlar", icon: Users },
    { id: "treatments", label: "Davolash", icon: Heart },
    { id: "appointments", label: "Qabullar", icon: Calendar },
    { id: "billing", label: "To'lovlar", icon: DollarSign },
    { id: "imaging", label: "Tasvirlar", icon: Camera },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">🦷 Stomatologiya HMS Boshqaruvi</h2>
          <p className="text-xs text-muted-foreground">Barcha stomatologiya klinikalari ustidan nazorat</p>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: Building2, label: "Klinikalar", value: clinics.length, sub: `${activeClinics} faol`, gradient: "from-blue-500 to-blue-600" },
              { icon: Users, label: "Bemorlar", value: patients.length, gradient: "from-emerald-500 to-emerald-600" },
              { icon: Stethoscope, label: "Stomatologlar", value: staff.length, gradient: "from-purple-500 to-purple-600" },
              { icon: Heart, label: "Davolashlar", value: treatments.length, gradient: "from-pink-500 to-pink-600" },
              { icon: DollarSign, label: "Daromad", value: `${(totalRevenue / 1e6).toFixed(1)}M`, sub: "so'm", gradient: "from-amber-500 to-orange-600" },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4">
                <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", s.gradient)}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label} {s.sub && <span className="text-[10px]">• {s.sub}</span>}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardContent className="p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">📅 Qabullar dinamikasi</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={apptByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="qabullar" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">🦷 Eng ko'p xizmatlar</h4>
              {topServices.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Ma'lumot yo'q</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={topServices} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {topServices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* CLINICS */}
      {section === "clinics" && (
        <div className="space-y-3">
          <Input placeholder="Klinika qidirish..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="max-w-sm" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {clinics.filter(c => !searchQ || c.name?.toLowerCase().includes(searchQ.toLowerCase())).map(c => (
              <Card key={c.id}><CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">🦷 {c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.address || "—"} • {c.phone || "—"}</p>
                    <p className="text-xs text-muted-foreground">{c.region || "—"} • INN: {c.inn || "—"}</p>
                  </div>
                  <Badge className={c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                    {c.is_active ? "Faol" : "Bloklangan"}
                  </Badge>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <Button size="sm" variant={c.is_active ? "destructive" : "default"} className="h-7 text-[11px]" onClick={() => toggleClinic(c.id, c.is_active)}>
                    <Power className="w-3 h-3 mr-1" /> {c.is_active ? "Blok" : "Aktiv"}
                  </Button>
                </div>
              </CardContent></Card>
            ))}
            {clinics.length === 0 && <p className="text-center py-12 text-muted-foreground col-span-2">Stomatologiya klinikalar yo'q</p>}
          </div>
        </div>
      )}

      {/* DOCTORS */}
      {section === "doctors" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{staff.length} ta stomatolog</p>
          {staff.map(s => (
            <Card key={s.id}><CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{s.full_name || s.name}</p>
                <p className="text-xs text-muted-foreground">{s.specialty || s.role || "Stomatolog"} • {s.phone || "—"}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">Klinika: {clinics.find(c => c.id === s.clinic_id)?.name?.slice(0, 20) || "—"}</Badge>
            </CardContent></Card>
          ))}
          {staff.length === 0 && <p className="text-center py-12 text-muted-foreground">Stomatologlar yo'q</p>}
        </div>
      )}

      {/* PATIENTS */}
      {section === "patients" && (
        <div className="space-y-2">
          <Input placeholder="Bemor qidirish..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="max-w-sm" />
          <p className="text-xs text-muted-foreground">{patients.length} ta bemor</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {patients.filter(p => !searchQ || p.full_name?.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 100).map(p => (
              <Card key={p.id}><CardContent className="p-3">
                <p className="font-semibold text-foreground text-sm">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">{p.phone} • {p.gender || "—"} • {p.date_of_birth || "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Klinika: {clinics.find(c => c.id === p.clinic_id)?.name?.slice(0, 30) || "—"}</p>
              </CardContent></Card>
            ))}
          </div>
          {patients.length === 0 && <p className="text-center py-12 text-muted-foreground">Bemorlar yo'q</p>}
        </div>
      )}

      {/* TREATMENTS */}
      {section === "treatments" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{treatments.length} ta davolash</p>
          {treatments.slice(0, 100).map(t => (
            <Card key={t.id}><CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">{t.service_name || t.procedure_type || "Davolash"}</p>
                <p className="text-xs text-muted-foreground">Tish: {t.tooth_number || "—"} • {new Date(t.created_at).toLocaleDateString("uz-UZ")}</p>
              </div>
              <Badge className="bg-cyan-100 text-cyan-700">{Number(t.cost || t.price || 0).toLocaleString()} so'm</Badge>
            </CardContent></Card>
          ))}
          {treatments.length === 0 && <p className="text-center py-12 text-muted-foreground">Davolashlar yo'q</p>}
        </div>
      )}

      {/* APPOINTMENTS */}
      {section === "appointments" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { label: "Jami", value: appointments.length },
              { label: "Bugun", value: appointments.filter(a => a.appointment_date === new Date().toISOString().split("T")[0]).length },
              { label: "Tasdiqlangan", value: appointments.filter(a => a.status === "confirmed").length },
              { label: "Tugallangan", value: appointments.filter(a => a.status === "completed").length },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-3">
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent></Card>
            ))}
          </div>
          {appointments.slice(0, 50).map(a => (
            <Card key={a.id}><CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">{patients.find(p => p.id === a.patient_id)?.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">📅 {a.appointment_date} ⏰ {a.appointment_time} • {a.doctor_name || "—"}</p>
              </div>
              <Badge className={cn("text-[10px]",
                a.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                a.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                a.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              )}>{a.status}</Badge>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* BILLING */}
      {section === "billing" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Jami daromad", value: `${totalRevenue.toLocaleString()} so'm` },
              { label: "To'langan", value: transactions.filter(t => t.status === "paid").length },
              { label: "Qarzdorlik", value: transactions.filter(t => t.status === "unpaid" || t.status === "partial").length },
              { label: "Tranzaksiyalar", value: transactions.length },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-5">
            <h4 className="font-semibold mb-3">📊 To'lovlar tarixi</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.slice(0, 50).map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.invoice_number || t.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("uz-UZ")} • {t.payment_method || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{Number(t.total_amount || t.amount || 0).toLocaleString()} so'm</p>
                    <Badge className={cn("text-[9px]", t.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{t.status}</Badge>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center py-8 text-muted-foreground">To'lovlar yo'q</p>}
            </div>
          </CardContent></Card>
        </div>
      )}

      {/* IMAGING */}
      {section === "imaging" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{files.length} ta tasvir/hujjat</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {files.map(f => (
              <Card key={f.id}><CardContent className="p-3">
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-2">
                  <Camera className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-[10px] font-medium truncate">{f.file_name || f.type || "Tasvir"}</p>
                <p className="text-[9px] text-muted-foreground">{new Date(f.created_at).toLocaleDateString("uz-UZ")}</p>
              </CardContent></Card>
            ))}
            {files.length === 0 && <p className="text-center py-12 text-muted-foreground col-span-full">Tasvirlar yo'q</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDentalModule;
