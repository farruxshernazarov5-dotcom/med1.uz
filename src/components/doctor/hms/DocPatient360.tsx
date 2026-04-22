import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Phone, Mail, Calendar, FlaskConical,
  FileText, Pill, ImageIcon, Heart, AlertTriangle, Activity,
  CreditCard, Stethoscope, ClipboardList,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  patient: any | null;
  doctorId: string;
  open: boolean;
  onClose: () => void;
}

type QuickType = null | "diagnosis" | "lab" | "rx" | "appointment" | "payment";

const DocPatient360 = ({ patient, doctorId, open, onClose }: Props) => {
  const [records, setRecords] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick action dialogs
  const [quick, setQuick] = useState<QuickType>(null);
  const [diagForm, setDiagForm] = useState({ diagnosis: "", icd_code: "", symptoms: "", notes: "" });
  const [labForm, setLabForm] = useState({ tests: "", urgency: "normal" });
  const [rxForm, setRxForm] = useState({ medication: "", dosage: "", duration: "", instructions: "" });
  const [apptForm, setApptForm] = useState({ date: "", time: "", notes: "" });
  const [payForm, setPayForm] = useState({ amount: "", service: "", method: "cash" });

  const reload = async () => {
    if (!patient) return;
    const [r, l, p, f, a] = await Promise.all([
      supabase.from("doctor_records").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
      supabase.from("doctor_lab_orders").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
      supabase.from("doctor_treatment_plans").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
      supabase.from("doctor_files").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
      patient.phone ? supabase.from("appointments").select("*").eq("doctor_id", doctorId).eq("patient_phone", patient.phone).order("appointment_date", { ascending: false }).limit(20) : Promise.resolve({ data: [] } as any),
    ]);
    setRecords(r.data || []);
    setLabs(l.data || []);
    setPlans(p.data || []);
    setFiles(f.data || []);
    setAppts(a.data || []);
  };

  useEffect(() => {
    if (!patient || !open) return;
    setLoading(true);
    reload().finally(() => setLoading(false));

    const ch = supabase.channel(`patient360-${patient.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_records", filter: `patient_id=eq.${patient.id}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_lab_orders", filter: `patient_id=eq.${patient.id}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, open, doctorId]);

  const openQuick = (type: QuickType) => {
    setDiagForm({ diagnosis: "", icd_code: "", symptoms: "", notes: "" });
    setLabForm({ tests: "", urgency: "normal" });
    setRxForm({ medication: "", dosage: "", duration: "", instructions: "" });
    setApptForm({ date: new Date().toISOString().split("T")[0], time: "09:00", notes: "" });
    setPayForm({ amount: "", service: "", method: "cash" });
    setQuick(type);
  };

  const submitDiagnosis = async () => {
    if (!diagForm.diagnosis.trim()) { toast({ title: "Tashxis majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("doctor_records").insert({
      doctor_id: doctorId, patient_id: patient.id,
      diagnosis: diagForm.diagnosis, icd_code: diagForm.icd_code,
      symptoms: diagForm.symptoms, notes: diagForm.notes,
      record_date: new Date().toISOString().split("T")[0],
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Tashxis saqlandi" }); setQuick(null); reload(); }
  };

  const submitLab = async () => {
    if (!labForm.tests.trim()) { toast({ title: "Tahlillar kiriting", variant: "destructive" }); return; }
    const { error } = await supabase.from("doctor_lab_orders").insert({
      doctor_id: doctorId, patient_id: patient.id, patient_name: patient.full_name,
      tests: labForm.tests.split(",").map((t) => t.trim()).filter(Boolean),
      status: "pending", urgency: labForm.urgency,
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Analiz buyurtma qilindi" }); setQuick(null); reload(); }
  };

  const submitRx = async () => {
    if (!rxForm.medication.trim()) { toast({ title: "Dori nomi majburiy", variant: "destructive" }); return; }
    // Save as a treatment plan entry (works without dedicated rx table)
    const { error } = await supabase.from("doctor_treatment_plans").insert({
      doctor_id: doctorId, patient_id: patient.id,
      diagnosis: `Retsept: ${rxForm.medication}`,
      description: `${rxForm.dosage} | ${rxForm.duration}\n${rxForm.instructions}`,
      status: "active",
    } as any);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Retsept saqlandi" }); setQuick(null); reload(); }
  };

  const submitAppt = async () => {
    if (!apptForm.date || !apptForm.time) { toast({ title: "Sana va vaqt majburiy", variant: "destructive" }); return; }
    // Try to determine clinic_id from patient appointments
    const clinicId = appts[0]?.clinic_id;
    if (!clinicId) {
      toast({ title: "Klinika topilmadi", description: "Avval bemor bilan qabul yarating", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("appointments").insert({
      doctor_id: doctorId,
      patient_id: patient.patient_user_id || patient.id,
      patient_name: patient.full_name,
      patient_phone: patient.phone,
      clinic_id: clinicId,
      appointment_date: apptForm.date,
      appointment_time: apptForm.time,
      notes: apptForm.notes,
      status: "scheduled",
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Qabul belgilandi" }); setQuick(null); reload(); }
  };

  const submitPayment = async () => {
    const amt = parseFloat(payForm.amount);
    if (!amt || amt <= 0) { toast({ title: "To'g'ri summa kiriting", variant: "destructive" }); return; }
    // Record as a treatment plan note (no doctor_payments table)
    const { error } = await supabase.from("doctor_treatment_plans").insert({
      doctor_id: doctorId, patient_id: patient.id,
      diagnosis: `To'lov: ${payForm.service || "Xizmat"}`,
      description: `Summa: ${amt.toLocaleString()} so'm | Usul: ${payForm.method}`,
      status: "completed",
    } as any);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ To'lov yozildi" }); setQuick(null); reload(); }
  };

  if (!patient) return null;

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-bold text-lg">{patient.full_name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-normal mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patient.phone}</span>
                  {patient.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{patient.email}</span>}
                  {age !== null && <span>{age} yosh</span>}
                  {patient.gender && patient.gender !== "unspecified" && (
                    <span>{patient.gender === "male" ? "Erkak" : "Ayol"}</span>
                  )}
                  {patient.blood_group && <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" />{patient.blood_group}</span>}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Medical alerts */}
          {(patient.allergies || patient.chronic_conditions) && (
            <div className="grid sm:grid-cols-2 gap-2">
              {patient.allergies && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-rose-700">Allergiyalar</p>
                    <p className="text-xs text-foreground mt-0.5">{patient.allergies}</p>
                  </div>
                </div>
              )}
              {patient.chronic_conditions && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                  <Activity className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Surunkali kasalliklar</p>
                    <p className="text-xs text-foreground mt-0.5">{patient.chronic_conditions}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-secondary/10 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">Tashriflar</p>
              <p className="font-bold text-foreground">{patient.total_visits || 0}</p>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">Analizlar</p>
              <p className="font-bold text-foreground">{patient.total_lab_orders || 0}</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">Yozuvlar</p>
              <p className="font-bold text-foreground">{patient.total_records || 0}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">Retseptlar</p>
              <p className="font-bold text-foreground">{patient.total_prescriptions || 0}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-gradient-to-r from-secondary/5 to-accent/5 border border-border rounded-xl p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <ClipboardList className="w-3 h-3" /> TEZKOR AMALLAR
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => openQuick("diagnosis")}>
                <Stethoscope className="w-4 h-4 mr-1" /> + Tashxis
              </Button>
              <Button size="sm" variant="outline" onClick={() => openQuick("lab")}>
                <FlaskConical className="w-4 h-4 mr-1" /> + Analiz
              </Button>
              <Button size="sm" variant="outline" onClick={() => openQuick("rx")}>
                <Pill className="w-4 h-4 mr-1" /> + Retsept
              </Button>
              <Button size="sm" variant="outline" onClick={() => openQuick("appointment")}>
                <Calendar className="w-4 h-4 mr-1" /> + Qabul
              </Button>
              <Button size="sm" variant="outline" onClick={() => openQuick("payment")}>
                <CreditCard className="w-4 h-4 mr-1" /> + To'lov
              </Button>
            </div>
          </div>

          <Tabs defaultValue="timeline" className="mt-2">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="timeline">Tarix</TabsTrigger>
              <TabsTrigger value="records">Tashxislar ({records.length})</TabsTrigger>
              <TabsTrigger value="labs">Analizlar ({labs.length})</TabsTrigger>
              <TabsTrigger value="plans">Davolash/Retsept ({plans.length})</TabsTrigger>
              <TabsTrigger value="appts">Qabullar ({appts.length})</TabsTrigger>
              <TabsTrigger value="files">Fayllar ({files.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-3 mt-4">
              {[...records.map((r) => ({ ...r, _type: "record" })), ...labs.map((l) => ({ ...l, _type: "lab" })), ...appts.map((a) => ({ ...a, _type: "appt" })), ...plans.map((p) => ({ ...p, _type: "plan" }))]
                .sort((a, b) => new Date(b.created_at || b.appointment_date).getTime() - new Date(a.created_at || a.appointment_date).getTime())
                .slice(0, 40)
                .map((item: any) => (
                  <div key={`${item._type}-${item.id}`} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                      {item._type === "record" && <FileText className="w-4 h-4 text-blue-500" />}
                      {item._type === "lab" && <FlaskConical className="w-4 h-4 text-amber-500" />}
                      {item._type === "appt" && <Calendar className="w-4 h-4 text-secondary" />}
                      {item._type === "plan" && <Pill className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item._type === "record" && (item.diagnosis || "Tashxis")}
                        {item._type === "lab" && (item.tests?.join(", ") || "Analiz")}
                        {item._type === "appt" && `Qabul (${item.status})`}
                        {item._type === "plan" && (item.title || "Davolash")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at || item.appointment_date).toLocaleString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                ))}
              {records.length + labs.length + appts.length + plans.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-8 text-sm">Hali yozuvlar yo'q</p>
              )}
            </TabsContent>

            <TabsContent value="records" className="space-y-2 mt-4">
              {records.map((r) => (
                <div key={r.id} className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-sm">{r.diagnosis}</p>
                  {r.icd_code && <Badge variant="outline" className="mt-1 text-xs">ICD: {r.icd_code}</Badge>}
                  {r.symptoms && <p className="text-xs text-muted-foreground mt-1"><strong>Simptom:</strong> {r.symptoms}</p>}
                  {r.notes && <p className="text-xs text-foreground mt-1">{r.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("uz-UZ")}</p>
                </div>
              ))}
              {records.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Tashxislar yo'q</p>}
            </TabsContent>

            <TabsContent value="labs" className="space-y-2 mt-4">
              {labs.map((l) => (
                <div key={l.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{l.tests?.join(", ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <Badge>{l.status}</Badge>
                </div>
              ))}
              {labs.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Analizlar yo'q</p>}
            </TabsContent>

            <TabsContent value="plans" className="space-y-2 mt-4">
              {plans.map((p) => (
                <div key={p.id} className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-sm">{p.title}</p>
                  {p.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{p.description}</p>}
                  <Badge variant="outline" className="mt-1 text-xs">{p.status}</Badge>
                </div>
              ))}
              {plans.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Davolash rejalari yo'q</p>}
            </TabsContent>

            <TabsContent value="appts" className="space-y-2 mt-4">
              {appts.map((a) => (
                <div key={a.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{new Date(a.appointment_date).toLocaleDateString("uz-UZ")} • {a.appointment_time}</p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-0.5">{a.notes}</p>}
                  </div>
                  <Badge>{a.status}</Badge>
                </div>
              ))}
              {appts.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Qabullar yo'q</p>}
            </TabsContent>

            <TabsContent value="files" className="space-y-2 mt-4">
              {files.map((f) => (
                <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" className="block p-3 bg-muted/30 rounded-lg hover:bg-muted transition-colors">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> {f.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{f.category}</p>
                </a>
              ))}
              {files.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Fayllar yo'q</p>}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Quick action dialogs */}
      <Dialog open={quick === "diagnosis"} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>+ Tashxis yozish</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Tashxis *</Label><Input value={diagForm.diagnosis} onChange={(e) => setDiagForm({ ...diagForm, diagnosis: e.target.value })} /></div>
            <div><Label className="text-xs">ICD-10 kodi</Label><Input value={diagForm.icd_code} onChange={(e) => setDiagForm({ ...diagForm, icd_code: e.target.value })} placeholder="J06.9" /></div>
            <div><Label className="text-xs">Simptomlar</Label><Textarea rows={2} value={diagForm.symptoms} onChange={(e) => setDiagForm({ ...diagForm, symptoms: e.target.value })} /></div>
            <div><Label className="text-xs">Xulosa</Label><Textarea rows={2} value={diagForm.notes} onChange={(e) => setDiagForm({ ...diagForm, notes: e.target.value })} /></div>
            <Button onClick={submitDiagnosis} className="w-full">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quick === "lab"} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>+ Analizga yuborish</DialogTitle></DialogHeader>
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
          <DialogHeader><DialogTitle>+ Retsept</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Dori nomi *</Label><Input value={rxForm.medication} onChange={(e) => setRxForm({ ...rxForm, medication: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Doza</Label><Input value={rxForm.dosage} onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })} placeholder="500mg, 2x kunda" /></div>
              <div><Label className="text-xs">Davomiyligi</Label><Input value={rxForm.duration} onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })} placeholder="7 kun" /></div>
            </div>
            <div><Label className="text-xs">Ko'rsatma</Label><Textarea rows={2} value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })} /></div>
            <Button onClick={submitRx} className="w-full">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quick === "appointment"} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>+ Keyingi qabul</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Sana</Label><Input type="date" value={apptForm.date} onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })} /></div>
              <div><Label className="text-xs">Vaqt</Label><Input type="time" value={apptForm.time} onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Izoh</Label><Textarea rows={2} value={apptForm.notes} onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })} /></div>
            <Button onClick={submitAppt} className="w-full">Belgilash</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quick === "payment"} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>+ To'lov</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Xizmat</Label><Input value={payForm.service} onChange={(e) => setPayForm({ ...payForm, service: e.target.value })} placeholder="Konsultatsiya" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Summa (so'm)</Label><Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Usul</Label>
                <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="click">Click</option>
                  <option value="payme">Payme</option>
                </select>
              </div>
            </div>
            <Button onClick={submitPayment} className="w-full">Yozish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocPatient360;
