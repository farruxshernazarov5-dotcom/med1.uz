import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Calendar, Phone, Clock, Search, Filter, CalendarDays,
  PlayCircle, CheckCircle2, XCircle, Stethoscope, FlaskConical, Pill,
  ChevronLeft, ChevronRight, AlertCircle, TrendingUp,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props { doctorId: string }

const STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Belgilangan", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  pending:   { label: "Kutilmoqda", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  confirmed: { label: "Tasdiqlangan", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  waiting:   { label: "Kutyapti", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  active:    { label: "Jarayonda", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  completed: { label: "Tugallangan", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  cancelled: { label: "Bekor", color: "bg-muted text-muted-foreground border-border" },
};

type TabKey = "today" | "upcoming" | "past" | "all";
type View = "list" | "calendar";
type QuickType = null | "diagnosis" | "lab" | "rx";

const todayStr = () => new Date().toISOString().split("T")[0];

const DocAppointments = ({ doctorId }: Props) => {
  const { user } = useAuth();
  const [appts, setAppts] = useState<any[]>([]);
  const [tab, setTab] = useState<TabKey>("today");
  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Quick actions
  const [activeAppt, setActiveAppt] = useState<any>(null);
  const [quick, setQuick] = useState<QuickType>(null);
  const [diagForm, setDiagForm] = useState({ diagnosis: "", icd_code: "", symptoms: "", notes: "" });
  const [labForm, setLabForm] = useState({ tests: "", urgency: "normal" });
  const [rxForm, setRxForm] = useState({ medication: "", dosage: "", duration: "", instructions: "" });

  const load = async () => {
    const { data } = await supabase.from("appointments").select("*")
      .eq("doctor_id", doctorId).order("appointment_date", { ascending: false }).limit(200);
    setAppts(data || []);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase.channel(`user:${user.id}:doc-appts:${doctorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${doctorId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [doctorId, user?.id]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else toast({ title: "Status yangilandi" });
  };

  // Stats
  const stats = useMemo(() => {
    const t = todayStr();
    const today = appts.filter((a) => a.appointment_date === t);
    const waiting = today.filter((a) => ["scheduled", "pending", "confirmed", "waiting"].includes(a.status));
    const completed = today.filter((a) => a.status === "completed");
    // Late = today, scheduled time passed, not started
    const now = new Date();
    const late = today.filter((a) => {
      if (!["scheduled", "pending", "confirmed", "waiting"].includes(a.status)) return false;
      const [h, m] = (a.appointment_time || "00:00").split(":").map(Number);
      const apptDt = new Date(); apptDt.setHours(h, m, 0, 0);
      return now.getTime() - apptDt.getTime() > 15 * 60 * 1000;
    });
    return { today: today.length, waiting: waiting.length, completed: completed.length, late: late.length };
  }, [appts]);

  // Filtered list
  const filtered = useMemo(() => {
    const t = todayStr();
    let list = appts;
    if (tab === "today") list = list.filter((a) => a.appointment_date === t);
    else if (tab === "upcoming") list = list.filter((a) => a.appointment_date > t);
    else if (tab === "past") list = list.filter((a) => a.appointment_date < t);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.patient_name?.toLowerCase().includes(q) || a.patient_phone?.includes(search));
    }
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    // Today: sort by time asc; others: by date desc
    return tab === "today"
      ? [...list].sort((a, b) => (a.appointment_time || "").localeCompare(b.appointment_time || ""))
      : list;
  }, [appts, tab, search, statusFilter]);

  // Quick Action submitters
  const openQuick = (type: QuickType, appt: any) => {
    setActiveAppt(appt);
    setDiagForm({ diagnosis: "", icd_code: "", symptoms: "", notes: "" });
    setLabForm({ tests: "", urgency: "normal" });
    setRxForm({ medication: "", dosage: "", duration: "", instructions: "" });
    setQuick(type);
  };

  // resolve patient_id from doctor_patients by phone
  const findPatientId = async (phone: string): Promise<string | null> => {
    const { data } = await supabase.from("doctor_patients").select("id").eq("doctor_id", doctorId).eq("phone", phone).maybeSingle();
    return data?.id || null;
  };

  const submitDiagnosis = async () => {
    if (!diagForm.diagnosis.trim()) { toast({ title: "Tashxis majburiy", variant: "destructive" }); return; }
    const pid = await findPatientId(activeAppt.patient_phone);
    if (!pid) { toast({ title: "Bemor topilmadi", description: "Avval qabulni tugating", variant: "destructive" }); return; }
    const { error } = await supabase.from("doctor_records").insert({
      doctor_id: doctorId, patient_id: pid,
      diagnosis: diagForm.diagnosis, icd_code: diagForm.icd_code,
      symptoms: diagForm.symptoms, notes: diagForm.notes,
      record_date: todayStr(),
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Tashxis saqlandi" }); setQuick(null); }
  };

  const submitLab = async () => {
    if (!labForm.tests.trim()) { toast({ title: "Tahlillar kiriting", variant: "destructive" }); return; }
    const pid = await findPatientId(activeAppt.patient_phone);
    if (!pid) { toast({ title: "Bemor topilmadi", variant: "destructive" }); return; }
    const { error } = await supabase.from("doctor_lab_orders").insert({
      doctor_id: doctorId, patient_id: pid, patient_name: activeAppt.patient_name,
      tests: labForm.tests.split(",").map((t) => t.trim()).filter(Boolean),
      status: "pending", urgency: labForm.urgency,
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Analiz buyurtma qilindi" }); setQuick(null); }
  };

  const submitRx = async () => {
    if (!rxForm.medication.trim()) { toast({ title: "Dori nomi majburiy", variant: "destructive" }); return; }
    const pid = await findPatientId(activeAppt.patient_phone);
    if (!pid) { toast({ title: "Bemor topilmadi", variant: "destructive" }); return; }
    const { error } = await supabase.from("doctor_treatment_plans").insert({
      doctor_id: doctorId, patient_id: pid,
      diagnosis: `Retsept: ${rxForm.medication}`,
      description: `${rxForm.dosage} | ${rxForm.duration}\n${rxForm.instructions}`,
      status: "active",
    } as any);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Retsept saqlandi" }); setQuick(null); }
  };

  // Calendar grid
  const calDays = useMemo(() => {
    const first = new Date(calMonth);
    const startWeekday = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null; iso: string; count: number }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, iso: "", count: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(first.getFullYear(), first.getMonth(), d);
      const iso = date.toISOString().split("T")[0];
      const count = appts.filter((a) => a.appointment_date === iso).length;
      cells.push({ date, iso, count });
    }
    return cells;
  }, [appts, calMonth]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Qabullar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Smart Appointment System</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Ro'yxat</button>
          <button onClick={() => setView("calendar")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === "calendar" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Kalendar</button>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 text-blue-600 text-xs"><CalendarDays className="w-3 h-3" /> Bugun</div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.today}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 text-amber-600 text-xs"><Clock className="w-3 h-3" /> Kutyapti</div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.waiting}</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 text-rose-600 text-xs"><AlertCircle className="w-3 h-3" /> Kechikkan</div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.late}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 text-emerald-600 text-xs"><TrendingUp className="w-3 h-3" /> Tugallandi</div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.completed}</p>
        </div>
      </div>

      {view === "list" ? (
        <>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList>
              <TabsTrigger value="today">Bugun</TabsTrigger>
              <TabsTrigger value="upcoming">Kelajak</TabsTrigger>
              <TabsTrigger value="past">O'tgan</TabsTrigger>
              <TabsTrigger value="all">Barchasi</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid sm:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Ism yoki telefon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm">
                <option value="all">Barcha statuslar</option>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" /> Qabullar topilmadi
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => {
                const s = STATUS[a.status] || STATUS.scheduled;
                const canStart = ["scheduled", "pending", "confirmed", "waiting"].includes(a.status);
                const canFinish = ["active", "scheduled", "pending", "confirmed", "waiting"].includes(a.status);
                return (
                  <div key={a.id} className="bg-card rounded-xl border border-border p-4 hover:border-secondary/40 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{a.patient_name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.appointment_date).toLocaleDateString("uz-UZ")}</span>
                          <span className="flex items-center gap-1 font-semibold text-foreground"><Clock className="w-3 h-3" />{a.appointment_time}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.patient_phone}</span>
                          {a.total_price && <span className="text-emerald-600 font-medium">{Number(a.total_price).toLocaleString()} so'm</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className={s.color}>{s.label}</Badge>
                    </div>
                    {a.notes && <p className="text-sm text-muted-foreground mb-2">{a.notes}</p>}

                    {/* Status actions */}
                    <div className="flex gap-2 flex-wrap">
                      {canStart && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "active")}>
                          <PlayCircle className="w-3 h-3 mr-1" /> Boshlash
                        </Button>
                      )}
                      {canFinish && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus(a.id, "completed")}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Yakunlash
                        </Button>
                      )}
                      {a.status !== "cancelled" && a.status !== "completed" && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(a.id, "cancelled")}>
                          <XCircle className="w-3 h-3 mr-1" /> Bekor
                        </Button>
                      )}
                    </div>

                    {/* Quick actions inside appointment */}
                    {a.status !== "cancelled" && (
                      <div className="flex gap-2 flex-wrap mt-2 pt-2 border-t border-border">
                        <Button size="sm" variant="ghost" className="text-secondary h-7 text-xs" onClick={() => openQuick("diagnosis", a)}>
                          <Stethoscope className="w-3 h-3 mr-1" /> + Tashxis
                        </Button>
                        <Button size="sm" variant="ghost" className="text-secondary h-7 text-xs" onClick={() => openQuick("lab", a)}>
                          <FlaskConical className="w-3 h-3 mr-1" /> + Analiz
                        </Button>
                        <Button size="sm" variant="ghost" className="text-secondary h-7 text-xs" onClick={() => openQuick("rx", a)}>
                          <Pill className="w-3 h-3 mr-1" /> + Retsept
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // Calendar view
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <Button size="sm" variant="ghost" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="font-semibold text-foreground">
              {calMonth.toLocaleDateString("uz-UZ", { month: "long", year: "numeric" })}
            </p>
            <Button size="sm" variant="ghost" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
            {["Du","Se","Cho","Pa","Ju","Sha","Ya"].map((d) => <div key={d} className="py-1 font-medium">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((c, i) => {
              if (!c.date) return <div key={i} />;
              const isToday = c.iso === todayStr();
              return (
                <button
                  key={i}
                  onClick={() => { setSearch(""); setStatusFilter("all"); setView("list"); setTab(c.iso === todayStr() ? "today" : c.iso > todayStr() ? "upcoming" : "past"); }}
                  className={`aspect-square rounded-lg border p-1 text-left transition-colors ${
                    isToday ? "border-secondary bg-secondary/10" : "border-border hover:bg-muted"
                  }`}
                >
                  <div className={`text-xs ${isToday ? "font-bold text-secondary" : "text-foreground"}`}>{c.date.getDate()}</div>
                  {c.count > 0 && (
                    <div className="mt-1">
                      <Badge className="text-[9px] h-4 px-1 bg-secondary/20 text-secondary border-0">{c.count}</Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick action dialogs */}
      <Dialog open={quick === "diagnosis"} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>+ Tashxis — {activeAppt?.patient_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Tashxis *</Label><Input value={diagForm.diagnosis} onChange={(e) => setDiagForm({ ...diagForm, diagnosis: e.target.value })} /></div>
            <div><Label className="text-xs">ICD-10</Label><Input value={diagForm.icd_code} onChange={(e) => setDiagForm({ ...diagForm, icd_code: e.target.value })} placeholder="J06.9" /></div>
            <div><Label className="text-xs">Simptomlar</Label><Textarea rows={2} value={diagForm.symptoms} onChange={(e) => setDiagForm({ ...diagForm, symptoms: e.target.value })} /></div>
            <div><Label className="text-xs">Xulosa</Label><Textarea rows={2} value={diagForm.notes} onChange={(e) => setDiagForm({ ...diagForm, notes: e.target.value })} /></div>
            <Button onClick={submitDiagnosis} className="w-full">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quick === "lab"} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>+ Analiz — {activeAppt?.patient_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Tahlillar (vergul bilan)</Label><Textarea rows={3} value={labForm.tests} onChange={(e) => setLabForm({ ...labForm, tests: e.target.value })} placeholder="UAQ, biokimyo, TSH" /></div>
            <div>
              <Label className="text-xs">Tezlik</Label>
              <select value={labForm.urgency} onChange={(e) => setLabForm({ ...labForm, urgency: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="normal">Oddiy</option>
                <option value="urgent">Shoshilinch</option>
                <option value="cito">CITO</option>
              </select>
            </div>
            <Button onClick={submitLab} className="w-full">Yuborish</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quick === "rx"} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>+ Retsept — {activeAppt?.patient_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Dori *</Label><Input value={rxForm.medication} onChange={(e) => setRxForm({ ...rxForm, medication: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Doza</Label><Input value={rxForm.dosage} onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })} placeholder="500mg, 2x" /></div>
              <div><Label className="text-xs">Davomiyligi</Label><Input value={rxForm.duration} onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })} placeholder="7 kun" /></div>
            </div>
            <div><Label className="text-xs">Ko'rsatma</Label><Textarea rows={2} value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })} /></div>
            <Button onClick={submitRx} className="w-full">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocAppointments;
