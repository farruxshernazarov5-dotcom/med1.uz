import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  UserCog, Plus, Trash2, Loader2, Search, Calendar, DollarSign,
  Star, TrendingUp, Sparkles, Edit, Power, Award, Users as UsersIcon,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const ROLES = [
  { value: "cosmetologist", label: "Kosmetolog" },
  { value: "dermatologist", label: "Dermatolog" },
  { value: "injector", label: "Injektor" },
  { value: "receptionist", label: "Administrator" },
  { value: "manager", label: "Menejer" },
];
const DAYS = ["Yak", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
const COLORS = ["hsl(var(--primary))", "#7B61FF", "#10B981", "#F59E0B", "#EF4444"];

const CosStaff = ({ centerId }: { centerId: string }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const [form, setForm] = useState({
    full_name: "", role: "cosmetologist", phone: "", email: "",
    specialization: "", experience_years: "", commission_percent: "",
    salary: "", schedule: "", start_date: "",
  });
  const [serviceForm, setServiceForm] = useState({ service_name: "", price: "", duration_minutes: "30" });
  const [payoutForm, setPayoutForm] = useState({ payout_type: "salary", amount: "", notes: "" });

  const load = async () => {
    const [s, sv, sc, rt, py, tx, ap] = await Promise.all([
      supabase.from("cosmetology_staff" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_staff_services" as any).select("*").eq("center_id", centerId),
      supabase.from("cosmetology_staff_schedule" as any).select("*").eq("center_id", centerId),
      supabase.from("cosmetology_staff_ratings" as any).select("*").eq("center_id", centerId),
      supabase.from("cosmetology_staff_payouts" as any).select("*").eq("center_id", centerId).order("paid_at", { ascending: false }),
      supabase.from("cosmetology_finance" as any).select("*").eq("center_id", centerId).eq("type", "income"),
      supabase.from("cosmetology_appointments" as any).select("*").eq("center_id", centerId),
    ]);
    setStaff((s.data as any[]) || []);
    setServices((sv.data as any[]) || []);
    setSchedule((sc.data as any[]) || []);
    setRatings((rt.data as any[]) || []);
    setPayouts((py.data as any[]) || []);
    setTransactions((tx.data as any[]) || []);
    setAppointments((ap.data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  // KPIs
  const kpis = useMemo(() => {
    const total = staff.length;
    const active = staff.filter(s => s.is_active !== false).length;
    const today = new Date().getDay();
    const todayWorking = staff.filter(s =>
      schedule.some(sc => sc.staff_id === s.id && sc.day_of_week === today && !sc.is_off)
    ).length;
    const avgRating = ratings.length
      ? (ratings.reduce((a, r) => a + (r.rating || 0), 0) / ratings.length).toFixed(1)
      : "—";
    return { total, active, todayWorking, avgRating };
  }, [staff, schedule, ratings]);

  // Workload chart
  const workloadData = useMemo(() => {
    return staff.slice(0, 8).map(s => ({
      name: s.full_name?.split(" ")[0] || "—",
      qabul: appointments.filter(a => a.staff_id === s.id).length,
    }));
  }, [staff, appointments]);

  const roleDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    staff.forEach(s => { map[s.role] = (map[s.role] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [staff]);

  // Filtered staff
  const filtered = useMemo(() => {
    return staff.filter(s => {
      if (filterRole !== "all" && s.role !== filterRole) return false;
      if (filterStatus === "active" && s.is_active === false) return false;
      if (filterStatus === "inactive" && s.is_active !== false) return false;
      if (search && !s.full_name?.toLowerCase().includes(search.toLowerCase()) && !(s.phone || "").includes(search)) return false;
      return true;
    });
  }, [staff, filterRole, filterStatus, search]);

  const resetForm = () => {
    setForm({ full_name: "", role: "cosmetologist", phone: "", email: "", specialization: "", experience_years: "", commission_percent: "", salary: "", schedule: "", start_date: "" });
    setEditing(null);
  };

  const save = async () => {
    if (!form.full_name) { toast({ title: "Ism majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const payload: any = {
      center_id: centerId, ...form,
      experience_years: parseInt(form.experience_years) || null,
      commission_percent: parseFloat(form.commission_percent) || 0,
      salary: parseFloat(form.salary) || 0,
      start_date: form.start_date || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("cosmetology_staff" as any).update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("cosmetology_staff" as any).insert(payload));
    }
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "✅ Yangilandi" : "✅ Xodim qo'shildi" });
    setShowForm(false); resetForm(); load();
  };

  const startEdit = (s: any) => {
    setEditing(s);
    setForm({
      full_name: s.full_name || "", role: s.role || "cosmetologist", phone: s.phone || "",
      email: s.email || "", specialization: s.specialization || "",
      experience_years: String(s.experience_years || ""), commission_percent: String(s.commission_percent || ""),
      salary: String(s.salary || ""), schedule: s.schedule || "", start_date: s.start_date || "",
    });
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirishni tasdiqlang?")) return;
    await supabase.from("cosmetology_staff" as any).delete().eq("id", id);
    toast({ title: "🗑 O'chirildi" });
    load();
  };

  const toggleActive = async (s: any) => {
    await supabase.from("cosmetology_staff" as any).update({ is_active: !(s.is_active !== false) }).eq("id", s.id);
    load();
  };

  const openProfile = (s: any) => { setSelectedStaff(s); setProfileOpen(true); };

  const addService = async () => {
    if (!selectedStaff || !serviceForm.service_name) return;
    await supabase.from("cosmetology_staff_services" as any).insert({
      center_id: centerId, staff_id: selectedStaff.id,
      service_name: serviceForm.service_name,
      price: parseFloat(serviceForm.price) || 0,
      duration_minutes: parseInt(serviceForm.duration_minutes) || 30,
    });
    setServiceForm({ service_name: "", price: "", duration_minutes: "30" });
    toast({ title: "✅ Xizmat qo'shildi" });
    load();
  };

  const removeService = async (id: string) => {
    await supabase.from("cosmetology_staff_services" as any).delete().eq("id", id);
    load();
  };

  const setScheduleDay = async (dow: number, field: "start_time" | "end_time" | "is_off", value: any) => {
    if (!selectedStaff) return;
    const existing = schedule.find(s => s.staff_id === selectedStaff.id && s.day_of_week === dow);
    if (existing) {
      await supabase.from("cosmetology_staff_schedule" as any).update({ [field]: value }).eq("id", existing.id);
    } else {
      await supabase.from("cosmetology_staff_schedule" as any).insert({
        center_id: centerId, staff_id: selectedStaff.id, day_of_week: dow,
        start_time: "09:00", end_time: "18:00", is_off: false,
        [field]: value,
      });
    }
    load();
  };

  const addPayout = async () => {
    if (!selectedStaff || !payoutForm.amount) return;
    await supabase.from("cosmetology_staff_payouts" as any).insert({
      center_id: centerId, staff_id: selectedStaff.id,
      payout_type: payoutForm.payout_type,
      amount: parseFloat(payoutForm.amount) || 0,
      notes: payoutForm.notes,
    });
    setPayoutForm({ payout_type: "salary", amount: "", notes: "" });
    toast({ title: "💰 To'lov yozildi" });
    load();
  };

  // Per-staff stats
  const staffStats = (id: string) => {
    const sv = services.filter(x => x.staff_id === id);
    const apps = appointments.filter(a => a.staff_id === id);
    const completed = apps.filter(a => a.status === "completed").length;
    const rt = ratings.filter(r => r.staff_id === id);
    const avgR = rt.length ? (rt.reduce((a, r) => a + r.rating, 0) / rt.length).toFixed(1) : "—";
    const income = transactions.filter(t => t.staff_id === id).reduce((a, t) => a + Number(t.amount || 0), 0);
    const totalPayouts = payouts.filter(p => p.staff_id === id).reduce((a, p) => a + Number(p.amount || 0), 0);
    return { servicesCount: sv.length, totalAppts: apps.length, completed, avgRating: avgR, income, totalPayouts };
  };

  const aiInsight = useMemo(() => {
    if (!staff.length) return null;
    const overloaded = staff.find(s => appointments.filter(a => a.staff_id === s.id).length > 20);
    const underused = staff.find(s => appointments.filter(a => a.staff_id === s.id).length < 3);
    const top = [...staff].sort((a, b) =>
      appointments.filter(x => x.staff_id === b.id).length - appointments.filter(x => x.staff_id === a.id).length
    )[0];
    return { overloaded, underused, top };
  }, [staff, appointments]);

  return (
    <div className="space-y-4">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><UsersIcon className="w-4 h-4" /> Jami xodimlar</div>
          <p className="text-2xl font-bold mt-1">{kpis.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Power className="w-4 h-4 text-green-500" /> Aktiv</div>
          <p className="text-2xl font-bold mt-1 text-green-500">{kpis.active}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Calendar className="w-4 h-4 text-primary" /> Bugun ishda</div>
          <p className="text-2xl font-bold mt-1 text-primary">{kpis.todayWorking}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Star className="w-4 h-4 text-yellow-500" /> O'rt. reyting</div>
          <p className="text-2xl font-bold mt-1 text-yellow-500">{kpis.avgRating} ⭐</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="list">Xodimlar</TabsTrigger>
          <TabsTrigger value="analytics">Analitika</TabsTrigger>
          <TabsTrigger value="ai">AI Tahlil</TabsTrigger>
        </TabsList>

        {/* LIST TAB */}
        <TabsContent value="list" className="space-y-3 mt-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Ism yoki telefon..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">Barcha rollar</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Hammasi</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Noaktiv</option>
            </select>
            <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}><Plus className="w-4 h-4 mr-1" /> Xodim</Button>
          </div>

          {showForm && (
            <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
              <h4 className="font-semibold">{editing ? "Tahrirlash" : "Yangi xodim"}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Ism *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Lavozim</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
                <div><Label>Mutaxassislik</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="mt-1" /></div>
                <div><Label>Tajriba (yil)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} className="mt-1" /></div>
                <div><Label>Komissiya %</Label><Input type="number" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} className="mt-1" /></div>
                <div><Label>Maosh</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="mt-1" /></div>
                <div><Label>Ish boshlagan sana</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1" /></div>
                <div><Label>Ish jadvali (matn)</Label><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Du-Ju 9:00-18:00" className="mt-1" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Bekor</Button>
              </div>
            </CardContent></Card>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Xodimlar yo'q</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((s) => {
                const st = staffStats(s.id);
                const isActive = s.is_active !== false;
                return (
                  <div key={s.id} className={`p-4 rounded-xl border ${isActive ? "border-border" : "border-destructive/30 opacity-60"} bg-card`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-base font-bold text-primary shrink-0">{s.full_name?.[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => openProfile(s)} className="font-medium text-sm hover:text-primary text-left truncate">{s.full_name}</button>
                          <Badge variant="outline" className="text-xs">{ROLES.find(r => r.value === s.role)?.label || s.role}</Badge>
                          {!isActive && <Badge variant="destructive" className="text-xs">Noaktiv</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{s.specialization} · {s.experience_years || 0} yil</p>
                        <p className="text-xs text-muted-foreground truncate">{s.phone}</p>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div><span className="text-muted-foreground">Qabul:</span> <b>{st.totalAppts}</b></div>
                          <div><span className="text-muted-foreground">⭐</span> <b>{st.avgRating}</b></div>
                          <div><span className="text-muted-foreground">Daromad:</span> <b className="text-green-600">{(st.income / 1000).toFixed(0)}k</b></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => startEdit(s)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => toggleActive(s)}><Power className={`w-3.5 h-3.5 ${isActive ? "text-green-500" : "text-muted-foreground"}`} /></Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => remove(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-3 mt-3">
          <Card><CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Ish yuklamasi</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="qabul" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent></Card>

          <Card><CardContent className="p-4">
            <h4 className="font-semibold mb-3">Lavozim taqsimoti</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roleDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {roleDistribution.map((r, i) => (
                <div key={r.name} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{r.name}: {r.value}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Top xodimlar (daromad)</h4>
            <div className="space-y-2">
              {[...staff].map(s => ({ ...s, ...staffStats(s.id) }))
                .sort((a: any, b: any) => b.income - a.income).slice(0, 5).map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <div className="flex-1"><p className="text-sm font-medium">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.totalAppts} qabul · ⭐ {s.avgRating}</p></div>
                  <p className="text-sm font-bold text-green-600">{Number(s.income).toLocaleString()} so'm</p>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* AI TAB */}
        <TabsContent value="ai" className="space-y-3 mt-3">
          <Card className="border-primary/30 bg-primary/5"><CardContent className="p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI tavsiyalar</h4>
            {aiInsight?.overloaded && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
                ⚠ <b>{aiInsight.overloaded.full_name}</b> haddan ortiq band. Yuklamani qayta taqsimlang.
              </div>
            )}
            {aiInsight?.underused && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
                💡 <b>{aiInsight.underused.full_name}</b>ga ko'proq qabul biriktiring (kam ish yuklamasi).
              </div>
            )}
            {aiInsight?.top && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                🏆 Top xodim: <b>{aiInsight.top.full_name}</b>. Bonus berishni o'ylab ko'ring.
              </div>
            )}
            {!aiInsight?.overloaded && !aiInsight?.underused && (
              <p className="text-sm text-muted-foreground">Ish yuklamasi balanslashgan ✓</p>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* PROFILE DIALOG */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{selectedStaff?.full_name?.[0]}</div>
              {selectedStaff?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="info">Profil</TabsTrigger>
                <TabsTrigger value="services">Xizmatlar</TabsTrigger>
                <TabsTrigger value="schedule">Jadval</TabsTrigger>
                <TabsTrigger value="finance">Moliya</TabsTrigger>
                <TabsTrigger value="ratings">Reyting</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-2 mt-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Lavozim:</span> {ROLES.find(r => r.value === selectedStaff.role)?.label}</div>
                  <div><span className="text-muted-foreground">Telefon:</span> {selectedStaff.phone || "—"}</div>
                  <div><span className="text-muted-foreground">Email:</span> {selectedStaff.email || "—"}</div>
                  <div><span className="text-muted-foreground">Tajriba:</span> {selectedStaff.experience_years || 0} yil</div>
                  <div><span className="text-muted-foreground">Komissiya:</span> {selectedStaff.commission_percent || 0}%</div>
                  <div><span className="text-muted-foreground">Maosh:</span> {Number(selectedStaff.salary || 0).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Boshlagan:</span> {selectedStaff.start_date || "—"}</div>
                  <div><span className="text-muted-foreground">Status:</span> {selectedStaff.is_active !== false ? "✅ Aktiv" : "❌ Noaktiv"}</div>
                </div>
                {(() => { const st = staffStats(selectedStaff.id); return (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="p-2 rounded bg-muted text-center"><p className="text-xs text-muted-foreground">Qabul</p><p className="font-bold">{st.totalAppts}</p></div>
                    <div className="p-2 rounded bg-muted text-center"><p className="text-xs text-muted-foreground">Bajarilgan</p><p className="font-bold">{st.completed}</p></div>
                    <div className="p-2 rounded bg-muted text-center"><p className="text-xs text-muted-foreground">⭐</p><p className="font-bold">{st.avgRating}</p></div>
                  </div>
                );})()}
              </TabsContent>

              <TabsContent value="services" className="space-y-3 mt-3">
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Xizmat nomi" value={serviceForm.service_name} onChange={(e) => setServiceForm({ ...serviceForm, service_name: e.target.value })} />
                  <Input type="number" placeholder="Narx" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} />
                  <Input type="number" placeholder="Daqiqa" value={serviceForm.duration_minutes} onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })} />
                </div>
                <Button size="sm" onClick={addService}><Plus className="w-3 h-3 mr-1" /> Qo'shish</Button>
                <div className="space-y-2">
                  {services.filter(x => x.staff_id === selectedStaff.id).map(sv => (
                    <div key={sv.id} className="flex items-center justify-between p-2 rounded border">
                      <div><p className="text-sm font-medium">{sv.service_name}</p><p className="text-xs text-muted-foreground">{sv.duration_minutes} daq · {Number(sv.price).toLocaleString()} so'm</p></div>
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => removeService(sv.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-2 mt-3">
                {DAYS.map((d, i) => {
                  const sc = schedule.find(x => x.staff_id === selectedStaff.id && x.day_of_week === i);
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded border">
                      <span className="w-10 font-medium text-sm">{d}</span>
                      <Input type="time" className="w-28" value={sc?.start_time || "09:00"} onChange={(e) => setScheduleDay(i, "start_time", e.target.value)} disabled={sc?.is_off} />
                      <span>—</span>
                      <Input type="time" className="w-28" value={sc?.end_time || "18:00"} onChange={(e) => setScheduleDay(i, "end_time", e.target.value)} disabled={sc?.is_off} />
                      <label className="flex items-center gap-1 text-xs ml-auto">
                        <input type="checkbox" checked={sc?.is_off || false} onChange={(e) => setScheduleDay(i, "is_off", e.target.checked)} /> Dam
                      </label>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="finance" className="space-y-3 mt-3">
                <div className="grid grid-cols-3 gap-2">
                  <select className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={payoutForm.payout_type} onChange={(e) => setPayoutForm({ ...payoutForm, payout_type: e.target.value })}>
                    <option value="salary">Maosh</option><option value="bonus">Bonus</option><option value="commission">Komissiya</option>
                  </select>
                  <Input type="number" placeholder="Summa" value={payoutForm.amount} onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })} />
                  <Button size="sm" onClick={addPayout}><DollarSign className="w-3 h-3 mr-1" /> Yozish</Button>
                </div>
                <Textarea rows={2} placeholder="Izoh" value={payoutForm.notes} onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })} />
                <div className="space-y-2">
                  {payouts.filter(p => p.staff_id === selectedStaff.id).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <Badge variant="outline" className="text-xs">{p.payout_type}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(p.paid_at).toLocaleDateString()}</p>
                        {p.notes && <p className="text-xs">{p.notes}</p>}
                      </div>
                      <p className="font-bold text-green-600">{Number(p.amount).toLocaleString()} so'm</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ratings" className="space-y-2 mt-3">
                {ratings.filter(r => r.staff_id === selectedStaff.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sharhlar yo'q</p>
                ) : ratings.filter(r => r.staff_id === selectedStaff.id).map(r => (
                  <div key={r.id} className="p-2 rounded border">
                    <div className="flex items-center gap-1">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />)}</div>
                    {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CosStaff;
