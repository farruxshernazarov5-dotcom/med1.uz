import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, CalendarDays, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSSchedule = ({ clinicId }: Props) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
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

  const shiftColors: Record<string, string> = { morning: "bg-blue-100 text-blue-800", afternoon: "bg-orange-100 text-orange-800", night: "bg-purple-100 text-purple-800", full: "bg-green-100 text-green-800" };
  const shiftLabels: Record<string, string> = { morning: "Ertalab", afternoon: "Kunduzi", night: "Tungi", full: "To'liq" };

  const leaveCount = schedules.filter(s => s.status === "leave").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Xodimlar jadvali</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Jadval qo'shish</Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="text-sm font-medium text-foreground">{weekDays[0]} — {weekDays[6]}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Bugun</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Xodimlar</p>
          <p className="text-lg font-bold text-foreground">{staff.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Bu hafta smenalar</p>
          <p className="text-lg font-bold text-primary">{schedules.filter(s => s.status === "scheduled").length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Ta'tillar</p>
          <p className="text-lg font-bold text-orange-600">{leaveCount}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Bugun ishlaydi</p>
          <p className="text-lg font-bold text-green-600">{schedules.filter(s => s.schedule_date === new Date().toISOString().split("T")[0] && s.status === "scheduled").length}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
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
              <option value="morning">Ertalab</option>
              <option value="afternoon">Kunduzi</option>
              <option value="night">Tungi</option>
              <option value="full">To'liq kun</option>
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 text-sm font-semibold text-foreground min-w-[140px]">Xodim</th>
              {weekDays.map((d, i) => {
                const isToday = d === new Date().toISOString().split("T")[0];
                return (
                  <th key={d} className={cn("p-2 text-center text-xs min-w-[90px]", isToday ? "bg-primary/10 rounded-t-lg" : "")}>
                    <div className="font-semibold text-foreground">{dayNames[i]}</div>
                    <div className="text-muted-foreground">{d.slice(5)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-2">
                  <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">{s.role}</p>
                </td>
                {weekDays.map(d => {
                  const daySchedules = getScheduleForDay(s.id, d);
                  const isToday = d === new Date().toISOString().split("T")[0];
                  return (
                    <td key={d} className={cn("p-1 text-center", isToday && "bg-primary/5")}>
                      {daySchedules.length > 0 ? daySchedules.map(sch => (
                        <div key={sch.id} className={cn("rounded-lg px-2 py-1 text-[10px] mb-1 cursor-pointer", sch.status === "leave" || sch.status === "sick" ? "bg-red-100 text-red-800" : shiftColors[sch.shift_type] || "bg-muted text-muted-foreground")} onClick={() => deleteSchedule(sch.id)} title="Bosing o'chirish uchun">
                          {sch.status === "leave" ? "Ta'til" : sch.status === "sick" ? "Kasallik" : shiftLabels[sch.shift_type] || sch.shift_type}
                          <div className="text-[9px] opacity-70">{sch.start_time?.slice(0, 5)}-{sch.end_time?.slice(0, 5)}</div>
                        </div>
                      )) : <span className="text-[10px] text-muted-foreground">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {staff.length === 0 && <p className="text-center py-8 text-muted-foreground">Xodimlar yo'q</p>}
    </div>
  );
};

export default HMSSchedule;
