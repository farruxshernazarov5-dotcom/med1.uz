import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Calendar, Clock, CheckCircle, XCircle, Search, Users, TrendingUp, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props { clinicId: string; }

const HMSAppointmentPortal = ({ clinicId }: Props) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [form, setForm] = useState({
    patient_name: "", patient_phone: "", doctor_id: "", service_id: "",
    appointment_date: "", appointment_time: "", notes: ""
  });

  const fetchData = async () => {
    const [apptRes, docRes, srvRes] = await Promise.all([
      supabase.from("appointments").select("*").eq("clinic_id", clinicId).order("appointment_date", { ascending: false }).limit(500),
      supabase.from("doctors").select("id, full_name, specialty").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("clinic_services").select("id, name, price, duration_minutes").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setAppointments(apptRes.data || []);
    setDoctors(docRes.data || []);
    setServices(srvRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ patient_name: "", patient_phone: "", doctor_id: "", service_id: "", appointment_date: "", appointment_time: "", notes: "" }); setShowForm(false); };

  const handleCreate = async () => {
    if (!form.patient_name || !form.appointment_date || !form.appointment_time) {
      toast({ title: "Ism, sana va vaqt majburiy!", variant: "destructive" }); return;
    }
    if (form.patient_phone && !form.patient_phone.startsWith("+998")) {
      toast({ title: "Telefon +998 bilan boshlanishi kerak!", variant: "destructive" }); return;
    }
    const service = services.find(s => s.id === form.service_id);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("appointments").insert({
      ...form, clinic_id: clinicId, patient_id: user?.id || clinicId,
      doctor_id: form.doctor_id || null, service_id: form.service_id || null,
      total_price: service?.price || 0, status: "confirmed"
    });
    toast({ title: "✅ Qabul yaratildi" }); resetForm(); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData();
  };

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "";
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || "";

  const filtered = appointments.filter(a => {
    const matchFilter = filter === "all" || a.status === filter;
    const matchSearch = !search || a.patient_name.toLowerCase().includes(search.toLowerCase()) || a.patient_phone?.includes(search);
    return matchFilter && matchSearch;
  });

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.appointment_date === today);
  const totalRevenue = appointments.filter(a => a.status === "completed").reduce((s, a) => s + (Number(a.total_price) || 0), 0);

  // Doctor workload chart
  const doctorLoad = doctors.map(d => ({
    name: d.full_name?.split(" ").slice(0, 2).join(" ") || "",
    qabullar: appointments.filter(a => a.doctor_id === d.id).length
  })).filter(d => d.qabullar > 0).sort((a, b) => b.qabullar - a.qabullar).slice(0, 8);

  // Calendar view helpers
  const calMonth = calendarDate.getMonth();
  const calYear = calendarDate.getFullYear();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const calDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    return { day: i + 1, date: dateStr, count: appointments.filter(a => a.appointment_date === dateStr).length };
  });

  const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
  const statusLabels: Record<string, string> = { pending: "Kutilmoqda", confirmed: "Tasdiqlangan", completed: "Tugallangan", cancelled: "Bekor qilingan" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Onlayn qabul boshqaruvi</h2>
            <p className="text-xs text-muted-foreground">Bugun: {todayAppts.length} ta qabul</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>Ro'yxat</Button>
          <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>Kalendar</Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi qabul</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Calendar, label: "Bugun", value: todayAppts.length, color: "from-blue-500 to-blue-600" },
          { icon: Clock, label: "Kutilmoqda", value: appointments.filter(a => a.status === "pending").length, color: "from-yellow-500 to-yellow-600" },
          { icon: CheckCircle, label: "Tasdiqlangan", value: appointments.filter(a => a.status === "confirmed").length, color: "from-indigo-500 to-indigo-600" },
          { icon: TrendingUp, label: "Tugallangan", value: appointments.filter(a => a.status === "completed").length, color: "from-green-500 to-green-600" },
          { icon: Users, label: "Daromad", value: `${(totalRevenue / 1e6).toFixed(1)}M`, color: "from-purple-500 to-purple-600" },
        ].map(k => (
          <div key={k.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${k.color} p-4 text-white shadow-lg`}>
            <k.icon className="w-5 h-5 text-white/80 mb-1" />
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-white/70">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Doctor workload */}
      {doctorLoad.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground text-sm mb-3">Shifokorlar yuklamasi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={doctorLoad}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} />
              <Tooltip />
              <Bar dataKey="qabullar" name="Qabullar" fill="hsl(214, 84%, 56%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calendar view */}
      {view === "calendar" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date(calYear, calMonth - 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <h3 className="font-heading font-bold text-foreground">
              {calendarDate.toLocaleString("uz", { month: "long", year: "numeric" })}
            </h3>
            <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date(calYear, calMonth + 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
            {Array.from({ length: (firstDayOfWeek + 6) % 7 }).map((_, i) => <div key={`e${i}`} />)}
            {calDays.map(d => (
              <div key={d.day} className={cn("text-center p-2 rounded-lg text-sm cursor-pointer hover:bg-muted/50", d.date === today && "bg-primary/10 font-bold", d.count > 0 && "font-semibold")}>
                <span className={d.date === today ? "text-primary" : ""}>{d.day}</span>
                {d.count > 0 && <div className="text-[10px] text-primary font-bold">{d.count}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Bemor qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {[{ id: "all", label: "Barchasi" }, { id: "pending", label: "Kutilmoqda" }, { id: "confirmed", label: "Tasdiqlangan" }, { id: "completed", label: "Tugallangan" }, { id: "cancelled", label: "Bekor" }].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
              ))}
            </div>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">Yangi qabul yaratish</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
                <Input placeholder="Telefon (+998...)" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
                  <option value="">Shifokor tanlang</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.service_id} onChange={e => setForm({ ...form, service_id: e.target.value })}>
                  <option value="">Xizmat tanlang</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({Number(s.price).toLocaleString()} so'm)</option>)}
                </select>
                <Input type="date" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} />
                <Input type="time" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} />
                <Input placeholder="Izoh" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="md:col-span-3" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleCreate}>Yaratish</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(a => (
              <div key={a.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{a.patient_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                      {a.patient_phone && <><Phone className="w-3 h-3" />{a.patient_phone}</>}
                      <span>• {a.appointment_date} {a.appointment_time?.slice(0, 5)}</span>
                      {getDoctorName(a.doctor_id) && <span>• Dr. {getDoctorName(a.doctor_id)}</span>}
                      {getServiceName(a.service_id) && <span>• {getServiceName(a.service_id)}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.total_price > 0 && <span className="text-sm font-bold text-primary">{Number(a.total_price).toLocaleString()}</span>}
                  <Badge className={cn("text-[10px]", statusColors[a.status] || "bg-muted text-muted-foreground")}>{statusLabels[a.status] || a.status}</Badge>
                  {a.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "confirmed")}><CheckCircle className="w-4 h-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "cancelled")}><XCircle className="w-4 h-4 text-destructive" /></Button>
                    </>
                  )}
                  {a.status === "confirmed" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(a.id, "completed")}>Tugallash</Button>}
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Qabullar yo'q</p>}
        </>
      )}
    </div>
  );
};

export default HMSAppointmentPortal;
