import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, CalendarDays, Clock, ChevronLeft, ChevronRight, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

interface Props { clinicId: string; }
const COLORS = ["hsl(214, 84%, 56%)", "hsl(32, 87%, 52%)", "hsl(250, 100%, 69%)", "hsl(145, 63%, 42%)"];

const HMSSchedule = ({ clinicId }: Props) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<"week" | "stats">("week");
  const [form, setForm] = useState({
    staff_id: "", schedule_date: "", shift_type: "morning",
    start_time: "08:00", end_time: "17:00", status: "scheduled",
    leave_type: "", leave_reason: "", substitute_id: "", notes: ""
  });

  const getWeekDays = (offset: number) => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };

  const weekDays = getWeekDays(weekOffset);
  const dayNames = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];

  const fetchData = async () => {
    const [schRes, staffRes] = await Promise.all([
      supabase.from("hms_staff_schedule").select("*").eq("clinic_id", clinicId).gte("schedule_date", weekDays[0]).lte("schedule_date", weekDays[6]).order("schedule_date"),
      supabase.from("hms_staff").select("id, full_name, role").eq("clinic_id", clinicId).eq("is_active", true).order("full_name"),
    ]);
    setSchedules(schRes.data || []);
    setStaff(staffRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId, weekOffset]);

  const resetForm = () => { setForm({ staff_id: "", schedule_date: "", shift_type: "morning", start_time: "08:00", end_time: "17:00", status: "scheduled", leave_type: "", leave_reason: "", substitute_id: "", notes: "" }); setShowForm(false); };

  const handleSave = async () => {
    if (!form.staff_id || !form.schedule_date) { toast({ title: "Xodim va sana majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, substitute_id: form.substitute_id || null, clinic_id: clinicId };
    await supabase.from("hms_staff_schedule").insert(payload);
    toast({ title: "✅ Jadval qo'shildi" }); resetForm(); fetchData();
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("hms_staff_schedule").delete().eq("id", id);
    toast({ title: "O'chirildi" }); fetchData();
  };

  const getStaffName = (id: string) => staff.find(s => s.id === id)?.full_name || "";
  const getScheduleForDay = (staffId: string, date: string) => schedules.filter(s => s.staff_id === staffId && s.schedule_date === date);

  const shiftColors: Record<string, string> = { morning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200", afternoon: "bg-orange-100 text-orange-800 dark:bg-orange-900/30", night: "bg-purple-100 text-purple-800 dark:bg-purple-900/30", full: "bg-green-100 text-green-800 dark:bg-green-900/30" };
  const shiftLabels: Record<string, string> = { morning: "Ertalab", afternoon: "Kunduzi", night: "Tungi", full: "To'liq" };

  const leaveCount = schedules.filter(s => s.status === "leave" || s.status === "sick").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayWorking = schedules.filter(s => s.schedule_date === todayStr && s.status === "scheduled").length;

  // Shift distribution chart
  const shiftStats = ["morning", "afternoon", "night", "full"].map(t => ({
    name: shiftLabels[t],
    value: schedules.filter(s => s.shift_type === t && s.status === "scheduled").length
  })).filter(d => d.value > 0);

  // Staff workload
  const staffLoad = staff.map(s => ({
    name: s.full_name?.split(" ").slice(0, 2).join(" ") || "",
    smenalar: schedules.filter(sc => sc.staff_id === s.id && sc.status === "scheduled").length,
    tatillar: schedules.filter(sc => sc.staff_id === s.id && (sc.status === "leave" || sc.status === "sick")).length,
  })).filter(d => d.smenalar > 0 || d.tatillar > 0).sort((a, b) => b.smenalar - a.smenalar).slice(0, 10);

  // Conflicts detection
  const conflicts: string[] = [];
  staff.forEach(s => {
    weekDays.forEach(d => {
      const daySchedules = getScheduleForDay(s.id, d);
      if (daySchedules.length > 1) {
        conflicts.push(`${s.full_name} — ${d}: ${daySchedules.length} smena`);
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Jadvallar boshqaruvi</h2>
            <p className="text-xs text-muted-foreground">Xodimlar ish jadvali va smenalar</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>Haftalik</Button>
          <Button size="sm" variant={view === "stats" ? "default" : "outline"} onClick={() => setView("stats")}>Statistika</Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Jadval</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Xodimlar", value: staff.length, color: "from-blue-500 to-blue-600" },
          { icon: CalendarDays, label: "Bu hafta smenalar", value: schedules.filter(s => s.status === "scheduled").length, color: "from-indigo-500 to-indigo-600" },
          { icon: Clock, label: "Ta'tillar", value: leaveCount, color: "from-orange-500 to-orange-600" },
          { icon: TrendingUp, label: "Bugun ishlaydi", value: todayWorking, color: "from-green-500 to-green-600" },
        ].map(k => (
          <div key={k.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${k.color} p-4 text-white shadow-lg`}>
            <k.icon className="w-5 h-5 text-white/80 mb-1" />
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-white/70">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Jadval konfliktlari ({conflicts.length})</p>
          </div>
          {conflicts.slice(0, 3).map((c, i) => <p key={i} className="text-xs text-yellow-700 dark:text-yellow-300">{c}</p>)}
        </div>
      )}

      {/* Stats view */}
      {view === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {shiftStats.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground text-sm mb-4">Smena taqsimoti</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={shiftStats} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {shiftStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {shiftStats.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d.name}: {d.value}</span>
                ))}
              </div>
            </div>
          )}
          {staffLoad.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground text-sm mb-4">Xodimlar yuklamasi</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={staffLoad}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="smenalar" name="Smenalar" fill="hsl(214, 84%, 56%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tatillar" name="Ta'tillar" fill="hsl(32, 87%, 52%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Week navigation */}
      {view === "week" && (
        <>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="text-sm font-medium text-foreground">{weekDays[0]} — {weekDays[6]}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Bugun</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">Jadval qo'shish</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })}>
                  <option value="">Xodim tanlang *</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
                </select>
                <Input type="date" value={form.schedule_date} onChange={e => setForm({ ...form, schedule_date: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.shift_type} onChange={e => {
                  const times: Record<string, [string, string]> = { morning: ["08:00", "14:00"], afternoon: ["14:00", "20:00"], night: ["20:00", "08:00"], full: ["08:00", "20:00"] };
                  const [s, en] = times[e.target.value] || ["08:00", "17:00"];
                  setForm({ ...form, shift_type: e.target.value, start_time: s, end_time: en });
                }}>
                  <option value="morning">Ertalab (08:00-14:00)</option>
                  <option value="afternoon">Kunduzi (14:00-20:00)</option>
                  <option value="night">Tungi (20:00-08:00)</option>
                  <option value="full">To'liq kun (08:00-20:00)</option>
                </select>
                <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="scheduled">Rejalashtirilgan</option>
                  <option value="leave">Ta'til/Dam</option>
                  <option value="sick">Kasallik</option>
                </select>
                {(form.status === "leave" || form.status === "sick") && (
                  <>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>
                      <option value="">Ta'til turi</option>
                      <option value="annual">Yillik ta'til</option>
                      <option value="sick">Kasallik</option>
                      <option value="personal">Shaxsiy</option>
                      <option value="unpaid">Ish haqisiz</option>
                    </select>
                    <Input placeholder="Sabab" value={form.leave_reason} onChange={e => setForm({ ...form, leave_reason: e.target.value })} />
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.substitute_id} onChange={e => setForm({ ...form, substitute_id: e.target.value })}>
                      <option value="">O'rinbosar</option>
                      {staff.filter(s => s.id !== form.staff_id).map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSave}>Saqlash</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          {/* Weekly grid */}
          <div className="bg-card rounded-2xl border border-border overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-semibold text-foreground min-w-[140px] bg-muted/30">Xodim</th>
                  {weekDays.map((d, i) => {
                    const isToday = d === todayStr;
                    return (
                      <th key={d} className={cn("p-2 text-center text-xs min-w-[90px]", isToday && "bg-primary/10")}>
                        <div className="font-semibold text-foreground">{dayNames[i]}</div>
                        <div className={cn("text-muted-foreground", isToday && "text-primary font-bold")}>{d.slice(5)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                    <td className="p-3">
                      <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.role}</p>
                    </td>
                    {weekDays.map(d => {
                      const daySchedules = getScheduleForDay(s.id, d);
                      const isToday = d === todayStr;
                      return (
                        <td key={d} className={cn("p-1 text-center", isToday && "bg-primary/5")}>
                          {daySchedules.length > 0 ? daySchedules.map(sch => (
                            <div key={sch.id} className={cn("rounded-lg px-2 py-1.5 text-[10px] mb-1 cursor-pointer hover:opacity-80 transition-opacity", sch.status === "leave" || sch.status === "sick" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" : shiftColors[sch.shift_type] || "bg-muted text-muted-foreground")} onClick={() => deleteSchedule(sch.id)} title="O'chirish uchun bosing">
                              <div className="font-semibold">{sch.status === "leave" ? "Ta'til" : sch.status === "sick" ? "Kasallik" : shiftLabels[sch.shift_type] || sch.shift_type}</div>
                              <div className="opacity-70">{sch.start_time?.slice(0, 5)}-{sch.end_time?.slice(0, 5)}</div>
                            </div>
                          )) : <span className="text-[10px] text-muted-foreground/50">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {staff.length === 0 && <p className="text-center py-8 text-muted-foreground">Xodimlar yo'q</p>}
        </>
      )}
    </div>
  );
};

export default HMSSchedule;
