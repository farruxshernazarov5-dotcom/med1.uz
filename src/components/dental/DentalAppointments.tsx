import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, Search, CheckCircle, XCircle, Play, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalAppointmentsProps {
  appointments: any[];
  patients: any[];
  services: any[];
  onAddAppointment?: (form: any) => Promise<void>;
  onUpdateStatus?: (id: string, status: string) => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: "Rejalashtirilgan", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", icon: Clock },
  confirmed: { label: "Tasdiqlangan", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30", icon: CheckCircle },
  "in-progress": { label: "Jarayonda", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30", icon: Play },
  completed: { label: "Tugallandi", color: "text-green-600 bg-green-50 dark:bg-green-950/30", icon: CheckCircle },
  cancelled: { label: "Bekor qilindi", color: "text-red-600 bg-red-50 dark:bg-red-950/30", icon: XCircle },
};

const DentalAppointments = ({ appointments, patients, services, onAddAppointment, onUpdateStatus }: DentalAppointmentsProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"list" | "today">("today");
  const [form, setForm] = useState({ patient_id: "", appointment_date: "", appointment_time: "", doctor_name: "", notes: "" });

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.appointment_date === today);

  const filtered = appointments.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchSearch = !search || a.doctor_name?.toLowerCase().includes(search.toLowerCase()) || a.notes?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const displayList = view === "today" ? todayAppts : filtered;

  const handleAdd = async () => {
    if (onAddAppointment) await onAddAppointment(form);
    setForm({ patient_id: "", appointment_date: "", appointment_time: "", doctor_name: "", notes: "" });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📅 Qabullar</h2>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-1" /> Yangi qabul</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Jami", value: appointments.length, color: "text-primary" },
          { label: "Bugungi", value: todayAppts.length, color: "text-blue-600" },
          { label: "Tugallangan", value: appointments.filter(a => a.status === "completed").length, color: "text-green-600" },
          { label: "Kutilmoqda", value: appointments.filter(a => a.status === "scheduled").length, color: "text-yellow-600" },
          { label: "Bekor", value: appointments.filter(a => a.status === "cancelled").length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-foreground">Yangi qabul</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={form.patient_id} onValueChange={v => setForm(p => ({ ...p, patient_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
              <SelectContent>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={form.appointment_date} onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))} />
            <Input type="time" value={form.appointment_time} onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))} />
            <Input placeholder="Shifokor" value={form.doctor_name} onChange={e => setForm(p => ({ ...p, doctor_name: e.target.value }))} />
          </div>
          <Input placeholder="Izoh" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Saqlash</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
          </div>
        </div>
      )}

      {/* View toggle + search */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          <Button size="sm" variant={view === "today" ? "default" : "outline"} onClick={() => setView("today")}>
            <Calendar className="w-4 h-4 mr-1" /> Bugungi
          </Button>
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            <Users className="w-4 h-4 mr-1" /> Barcha
          </Button>
        </div>
        {view === "list" && (
          <>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <Button key={k} size="sm" variant={statusFilter === k ? "default" : "outline"} onClick={() => setStatusFilter(statusFilter === k ? "all" : k)}>
                {v.label}
              </Button>
            ))}
          </>
        )}
      </div>

      {/* Appointments list */}
      {displayList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{view === "today" ? "Bugun qabul yo'q" : "Qabullar topilmadi"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map(a => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.scheduled;
            const patient = patients.find(p => p.id === a.patient_id);
            return (
              <div key={a.id} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="font-mono text-lg font-bold text-foreground">{a.appointment_time}</p>
                      <p className="text-xs text-muted-foreground">{a.appointment_date}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{patient?.full_name || "Bemor"}</p>
                      <p className="text-xs text-muted-foreground">{a.doctor_name || "Shifokor"} {a.notes && `• ${a.notes}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cfg.color}>{cfg.label}</Badge>
                    {a.status === "scheduled" && onUpdateStatus && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => onUpdateStatus(a.id, "completed")}>✅</Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => onUpdateStatus(a.id, "cancelled")}>❌</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DentalAppointments;
