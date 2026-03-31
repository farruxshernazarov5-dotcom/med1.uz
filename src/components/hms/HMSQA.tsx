import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Trash2, ShieldCheck, Star, MessageSquare, TrendingUp, AlertTriangle, BarChart3, CheckCircle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";

interface Props { clinicId: string; }
const COLORS = ["hsl(0, 72%, 55%)", "hsl(32, 87%, 52%)", "hsl(145, 63%, 42%)", "hsl(214, 84%, 56%)", "hsl(250, 100%, 69%)"];

const HMSQA = ({ clinicId }: Props) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("open");
  const [tab, setTab] = useState<"complaints" | "kpi" | "audit">("complaints");
  const [form, setForm] = useState({
    patient_name: "", patient_phone: "", complaint_type: "service",
    department_id: "", staff_id: "", subject: "", description: "", severity: "medium", rating: 0
  });

  const fetchData = async () => {
    const [cRes, sRes, dRes] = await Promise.all([
      supabase.from("hms_complaints").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_staff").select("id, full_name, role").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setComplaints(cRes.data || []);
    setStaff(sRes.data || []);
    setDepartments(dRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => {
    setForm({ patient_name: "", patient_phone: "", complaint_type: "service", department_id: "", staff_id: "", subject: "", description: "", severity: "medium", rating: 0 });
    setEditing(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.subject) { toast({ title: "Mavzu majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, department_id: form.department_id || null, staff_id: form.staff_id || null, rating: Number(form.rating), clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_complaints").update(payload).eq("id", editing.id);
      toast({ title: "✅ Yangilandi" });
    } else {
      await supabase.from("hms_complaints").insert(payload);
      toast({ title: "✅ Shikoyat qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const resolveComplaint = async (id: string, resolution: string) => {
    await supabase.from("hms_complaints").update({ status: "resolved", resolution, resolved_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "✅ Hal qilindi" }); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("hms_complaints").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_complaints").delete().eq("id", id);
    toast({ title: "O'chirildi" }); fetchData();
  };

  const getStaffName = (id: string) => staff.find(s => s.id === id)?.full_name || "";
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || "";
  const filtered = filter === "all" ? complaints : complaints.filter(c => c.status === filter);

  const avgRating = complaints.filter(c => c.rating > 0).length > 0 ? (complaints.filter(c => c.rating > 0).reduce((s, c) => s + c.rating, 0) / complaints.filter(c => c.rating > 0).length) : 0;
  const openCount = complaints.filter(c => c.status === "open").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;
  const resolveRate = complaints.length > 0 ? Math.round((resolvedCount / complaints.length) * 100) : 0;

  // Resolve time calculation
  const resolvedWithTime = complaints.filter(c => c.status === "resolved" && c.resolved_at);
  const avgResolveHours = resolvedWithTime.length > 0
    ? Math.round(resolvedWithTime.reduce((s, c) => s + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / 3600000, 0) / resolvedWithTime.length)
    : 0;

  // Chart data
  const typeStats = ["service", "staff", "wait_time", "cleanliness", "billing", "other"].map(t => ({
    name: t === "service" ? "Xizmat" : t === "staff" ? "Xodim" : t === "wait_time" ? "Kutish" : t === "cleanliness" ? "Tozalik" : t === "billing" ? "Hisob" : "Boshqa",
    value: complaints.filter(c => c.complaint_type === t).length
  })).filter(d => d.value > 0);

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString("uz", { month: "short" });
    const count = complaints.filter(c => { const cd = new Date(c.created_at); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }).length;
    return { name: month, shikoyatlar: count };
  });

  const deptStats = departments.map(d => ({
    name: d.name.slice(0, 12),
    shikoyatlar: complaints.filter(c => c.department_id === d.id).length,
    reyting: (() => { const dc = complaints.filter(c => c.department_id === d.id && c.rating > 0); return dc.length > 0 ? +(dc.reduce((s, c) => s + c.rating, 0) / dc.length).toFixed(1) : 0; })()
  })).filter(d => d.shikoyatlar > 0);

  const severityColors: Record<string, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800" };
  const statusColors: Record<string, string> = { open: "bg-red-100 text-red-800", investigating: "bg-yellow-100 text-yellow-800", resolved: "bg-green-100 text-green-800", closed: "bg-muted text-muted-foreground" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Sifat boshqaruvi (QMS)</h2>
            <p className="text-xs text-muted-foreground">Shikoyatlar, audit va KPI nazorati</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi shikoyat</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: MessageSquare, label: "Jami shikoyatlar", value: complaints.length, color: "from-blue-500 to-blue-600" },
          { icon: AlertTriangle, label: "Ochiq muammolar", value: openCount, color: "from-red-500 to-red-600" },
          { icon: CheckCircle, label: "Hal qilingan", value: resolvedCount, color: "from-green-500 to-green-600" },
          { icon: Target, label: "Hal qilish %", value: `${resolveRate}%`, color: "from-purple-500 to-purple-600" },
          { icon: Star, label: "O'rtacha baho", value: avgRating > 0 ? avgRating.toFixed(1) : "—", color: "from-yellow-500 to-yellow-600" },
        ].map(k => (
          <div key={k.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${k.color} p-4 text-white shadow-lg`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-4 translate-x-4" />
            <k.icon className="w-5 h-5 text-white/80 mb-1" />
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-white/70">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: "complaints" as const, label: "Shikoyatlar" },
          { id: "kpi" as const, label: "KPI va analitika" },
          { id: "audit" as const, label: "Audit" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap", tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{t.label}</button>
        ))}
      </div>

      {/* KPI Tab */}
      {tab === "kpi" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground text-sm mb-4">Shikoyat turlari</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={typeStats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {typeStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {typeStats.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d.name}: {d.value}</span>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground text-sm mb-4">Oylik trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="gradQA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="shikoyatlar" stroke="hsl(0, 72%, 55%)" strokeWidth={2} fill="url(#gradQA)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {deptStats.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground text-sm mb-4">Bo'limlar bo'yicha</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="shikoyatlar" name="Shikoyatlar" fill="hsl(0, 72%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">KPI ko'rsatkichlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground">O'rtacha hal qilish vaqti</p><p className="text-2xl font-bold text-foreground">{avgResolveHours} soat</p></div>
              <div className="p-4 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground">Kritik shikoyatlar</p><p className="text-2xl font-bold text-destructive">{complaints.filter(c => c.severity === "critical").length}</p></div>
              <div className="p-4 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground">Bu oy yangi</p><p className="text-2xl font-bold text-foreground">{complaints.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {tab === "audit" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Sifat audit checklist</h3>
            <div className="space-y-2">
              {[
                { item: "Sterilizatsiya nazorati", status: "pass" },
                { item: "Bemor xavfsizligi protokollari", status: "pass" },
                { item: "Dori-darmonlar saqlash", status: "warning" },
                { item: "Infektsiya nazorati", status: "pass" },
                { item: "Tibbiy hujjatlar to'liqligi", status: "warning" },
                { item: "Avariya javob berish tayyorligi", status: "pass" },
                { item: "Xodimlar malaka darajasi", status: "pass" },
                { item: "Jihozlar texnik holati", status: "fail" },
              ].map(a => (
                <div key={a.item} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm">{a.item}</span>
                  <Badge className={cn("text-xs", a.status === "pass" ? "bg-green-100 text-green-800" : a.status === "warning" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800")}>
                    {a.status === "pass" ? "✅ O'tdi" : a.status === "warning" ? "⚠️ Ogohlantirish" : "❌ O'tmadi"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Complaints Tab */}
      {tab === "complaints" && (
        <>
          <div className="flex gap-2 overflow-x-auto">
            {[{ id: "open", label: "Ochiq" }, { id: "investigating", label: "Tekshiruvda" }, { id: "resolved", label: "Hal qilingan" }, { id: "all", label: "Barchasi" }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
            ))}
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">{editing ? "Tahrirlash" : "Yangi shikoyat/baho"}</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Bemor ismi" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
                <Input placeholder="Telefon" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.complaint_type} onChange={e => setForm({ ...form, complaint_type: e.target.value })}>
                  <option value="service">Xizmat sifati</option>
                  <option value="staff">Xodim munosabati</option>
                  <option value="wait_time">Kutish vaqti</option>
                  <option value="cleanliness">Tozalik</option>
                  <option value="billing">Hisob-kitob</option>
                  <option value="other">Boshqa</option>
                </select>
                <Input placeholder="Mavzu *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">Bo'lim</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })}>
                  <option value="">Xodim</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                  <option value="low">Past</option>
                  <option value="medium">O'rtacha</option>
                  <option value="high">Yuqori</option>
                  <option value="critical">Kritik</option>
                </select>
                <Input placeholder="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Baho:</span>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm({ ...form, rating: n })} className={cn("w-8 h-8 rounded-full text-sm font-bold", form.rating >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-heading font-bold text-foreground text-sm">{c.subject}</h3>
                      <p className="text-xs text-muted-foreground">{c.patient_name} {c.complaint_type && `• ${c.complaint_type}`} {getDeptName(c.department_id) && `• ${getDeptName(c.department_id)}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.rating > 0 && <span className="flex items-center gap-1 text-sm"><Star className="w-3 h-3 text-yellow-500" /> {c.rating}/5</span>}
                    <Badge className={cn("text-[10px]", severityColors[c.severity])}>{c.severity}</Badge>
                    <Badge className={cn("text-[10px]", statusColors[c.status])}>{c.status}</Badge>
                  </div>
                </div>
                {c.description && <p className="text-xs text-muted-foreground mt-2">{c.description}</p>}
                {c.resolution && <p className="text-xs text-green-700 mt-1">✅ {c.resolution}</p>}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("uz")}</span>
                  {getStaffName(c.staff_id) && <Badge variant="outline" className="text-[10px]">{getStaffName(c.staff_id)}</Badge>}
                  <div className="ml-auto flex gap-1">
                    {c.status === "open" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(c.id, "investigating")}>Tekshirish</Button>}
                    {(c.status === "open" || c.status === "investigating") && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                        const resolution = prompt("Yechim:");
                        if (resolution) resolveComplaint(c.id, resolution);
                      }}>Hal qilish</Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setForm({ patient_name: c.patient_name, patient_phone: c.patient_phone || "", complaint_type: c.complaint_type, department_id: c.department_id || "", staff_id: c.staff_id || "", subject: c.subject, description: c.description || "", severity: c.severity, rating: c.rating || 0 }); setShowForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Shikoyatlar yo'q</p>}
        </>
      )}
    </div>
  );
};

export default HMSQA;
