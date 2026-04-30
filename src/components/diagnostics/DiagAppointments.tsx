import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Calendar, Clock, User, Phone, Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";

type Props = {
  centerId: string;
  appointments: any[];
  patients: any[];
  services: any[];
  staff: any[];
  onReload: () => void;
};

const STATUS_COLORS: Record<string, string> = {
  waiting: "bg-yellow-500", assigned: "bg-blue-500", in_progress: "bg-purple-500",
  completed: "bg-green-500", cancelled: "bg-red-500", no_show: "bg-gray-500",
};
const STATUS_LABEL: Record<string, string> = {
  waiting: "Kutilmoqda", assigned: "Biriktirilgan", in_progress: "Bajarilmoqda",
  completed: "Tugagan", cancelled: "Bekor qilingan", no_show: "Kelmadi",
};

const DiagAppointments = ({ centerId, appointments, patients, services, staff, onReload }: Props) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [filter, setFilter] = useState<"all" | "today">("today");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    patient_id: "", patient_name: "", patient_phone: "",
    service_id: "", service_name: "",
    staff_id: "", staff_name: "",
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "09:00",
    duration_min: 30,
    appt_source: "internal",
    notes: "",
  });

  const today = new Date().toISOString().split("T")[0];
  const filtered = appointments.filter((a: any) => filter === "all" || a.appointment_date === today);

  const reset = () => {
    setStep(1);
    setForm({ patient_id: "", patient_name: "", patient_phone: "", service_id: "", service_name: "", staff_id: "", staff_name: "", appointment_date: today, appointment_time: "09:00", duration_min: 30, appt_source: "internal", notes: "" });
  };

  const selectPatient = (id: string) => {
    const p = patients.find((x) => x.id === id);
    if (p) setForm({ ...form, patient_id: id, patient_name: p.full_name, patient_phone: p.phone });
  };
  const selectService = (id: string) => {
    const sv = services.find((x) => x.id === id);
    if (sv) setForm({ ...form, service_id: id, service_name: sv.name });
  };
  const selectStaff = (id: string) => {
    const st = staff.find((x) => x.id === id);
    if (st) setForm({ ...form, staff_id: id, staff_name: st.full_name });
  };

  const submit = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("diagnostics_appointments" as any).insert({
      center_id: centerId, ...form, status: "waiting", created_by: u?.user?.id,
    } as any);
    if (error) toast.error("Xatolik: " + error.message);
    else { toast.success("Uchrashuv yaratildi"); setOpen(false); reset(); onReload(); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("diagnostics_appointments" as any).update({ status } as any).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Status yangilandi"); onReload(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6" />Uchrashuvlar</h2>
          <p className="text-muted-foreground text-sm">Bemor oqimi va navbat</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Yangi uchrashuv</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Uchrashuv yaratish — Qadam {step}/4</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {step === 1 && (
                <div className="space-y-3">
                  <Label>Bemor</Label>
                  <Select value={form.patient_id} onValueChange={selectPatient}>
                    <SelectTrigger><SelectValue placeholder="Mavjud bemorni tanlang" /></SelectTrigger>
                    <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name} — {p.phone}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">— yoki yangi bemor —</div>
                  <Input placeholder="Ism Familiya" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_id: "", patient_name: e.target.value })} />
                  <Input placeholder="+998 ..." value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} />
                </div>
              )}
              {step === 2 && (
                <div className="space-y-3">
                  <Label>Xizmat</Label>
                  <Select value={form.service_id} onValueChange={selectService}>
                    <SelectTrigger><SelectValue placeholder="Xizmatni tanlang" /></SelectTrigger>
                    <SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Label>Manba</Label>
                  <Select value={form.appt_source} onValueChange={(v) => setForm({ ...form, appt_source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Ichki (registrator)</SelectItem>
                      <SelectItem value="external">Tashqi (boshqa klinikadan)</SelectItem>
                      <SelectItem value="referral">Yo'naltirish bo'yicha</SelectItem>
                      <SelectItem value="online">Online (bemor o'zi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-3">
                  <Label>Mutaxassis (ixtiyoriy)</Label>
                  <Select value={form.staff_id} onValueChange={selectStaff}>
                    <SelectTrigger><SelectValue placeholder="Xodim tanlang" /></SelectTrigger>
                    <SelectContent>{staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.position || s.role}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Sana</Label><Input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} /></div>
                    <div><Label>Vaqt</Label><Input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} /></div>
                  </div>
                  <div><Label>Davomiylik (daqiqa)</Label><Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) })} /></div>
                  <div><Label>Eslatmalar</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}><ChevronLeft className="w-4 h-4 mr-1" />Orqaga</Button>
                {step < 4 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={(step === 1 && !form.patient_name) || (step === 2 && !form.service_id)}>Keyingisi<ChevronRight className="w-4 h-4 ml-1" /></Button>
                ) : (
                  <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}Yaratish</Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="today">Bugungi ({appointments.filter((a) => a.appointment_date === today).length})</TabsTrigger>
          <TabsTrigger value="all">Barchasi ({appointments.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Uchrashuvlar yo'q</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((a: any) => (
                <div key={a.id} className="border rounded-lg p-3 flex items-center justify-between hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{a.patient_name}</span>
                      <Badge className={`${STATUS_COLORS[a.status]} text-white`}>{STATUS_LABEL[a.status]}</Badge>
                      {a.appt_source && <Badge variant="outline">{a.appt_source}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{a.appointment_date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.appointment_time}</span>
                      {a.patient_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.patient_phone}</span>}
                      {a.service_name && <span>· {a.service_name}</span>}
                      {a.staff_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{a.staff_name}</span>}
                    </div>
                  </div>
                  <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                    <SelectTrigger className="w-36 ml-2"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagAppointments;
