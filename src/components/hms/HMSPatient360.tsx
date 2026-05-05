import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { esc } from "@/lib/htmlEscape";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  User, Activity, FileText, TestTube, Pill, Calendar, ClipboardList,
  Image as ImageIcon, DollarSign, Phone, Mail, MapPin, Heart, AlertCircle, Plus, Download
} from "lucide-react";

interface Props {
  clinicId: string;
  patient: any;
  onBack: () => void;
}

const HMSPatient360 = ({ clinicId, patient, onBack }: Props) => {
  const [tab, setTab] = useState("overview");
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick add states
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [rec, rx, lab, appts, fls, inv, docs] = await Promise.all([
      supabase.from("hms_medical_records").select("*").eq("clinic_id", clinicId).eq("patient_id", patient.id).order("record_date", { ascending: false }),
      supabase.from("hms_prescriptions").select("*").eq("clinic_id", clinicId).eq("patient_id", patient.id).order("prescription_date", { ascending: false }),
      supabase.from("hms_lab_orders").select("*").eq("clinic_id", clinicId).eq("patient_id", patient.id).order("ordered_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("clinic_id", clinicId).eq("patient_phone", patient.phone).order("appointment_date", { ascending: false }),
      supabase.from("hms_files").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(50),
      supabase.from("hms_invoices").select("*").eq("clinic_id", clinicId).eq("patient_id", patient.id).order("invoice_date", { ascending: false }),
      supabase.from("doctors").select("id, full_name, specialty").eq("clinic_id", clinicId),
    ]);
    setRecords(rec.data || []);
    setPrescriptions(rx.data || []);
    setLabOrders(lab.data || []);
    setAppointments(appts.data || []);
    setFiles((fls.data || []).filter((f: any) => f.notes?.includes(patient.id) || f.notes?.includes(patient.full_name)));
    setInvoices(inv.data || []);
    setDoctors(docs.data || []);

    // Lab results
    if ((lab.data || []).length) {
      const ids = (lab.data || []).map((o: any) => o.id);
      const { data: res } = await supabase.from("hms_lab_results").select("*").in("order_id", ids);
      setLabResults(res || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [patient.id]);

  const docName = (id: string) => doctors.find((d) => d.id === id)?.full_name || "—";

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const totalBilled = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const balance = totalBilled - totalPaid;

  const saveQuickNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    const { error } = await supabase.from("hms_medical_records").insert({
      clinic_id: clinicId,
      patient_id: patient.id,
      record_date: new Date().toISOString().split("T")[0],
      record_type: "visit",
      notes: noteText.trim(),
    });
    setSavingNote(false);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Yozuv saqlandi" });
      setNoteText("");
      fetchAll();
    }
  };

  const exportPatientPdf = () => {
    const html = `
      <html><head><meta charset="utf-8"><title>EMR — ${patient.full_name}</title>
      <style>body{font-family:Arial;padding:24px;color:#0A2540}h1{color:#2F80ED}h2{border-bottom:2px solid #2F80ED;padding-bottom:4px;margin-top:24px}table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #ddd;padding:6px;font-size:12px;text-align:left}</style>
      </head><body>
      <h1>📋 Elektron tibbiy karta (EMR)</h1>
      <p><b>${esc(patient.full_name)}</b> · ${esc(patient.phone)} · ${patient.gender === "male" ? "Erkak" : "Ayol"}${age ? ` · ${age} yosh` : ""}</p>
      <p>Manzil: ${esc(patient.address || "—")} · Qon guruhi: ${esc(patient.blood_group || "—")}${esc(patient.rh_factor || "")}</p>
      <p>Allergiya: ${esc(patient.allergies || "—")}</p>
      <p>Surunkali: ${esc(patient.chronic_diseases || "—")}</p>

      <h2>Tibbiy yozuvlar (${records.length})</h2>
      <table><tr><th>Sana</th><th>Tur</th><th>Tashxis</th><th>Davolash</th></tr>
      ${records.map(r => `<tr><td>${esc(r.record_date)}</td><td>${esc(r.record_type)}</td><td>${esc(r.diagnosis || "—")}</td><td>${esc(r.treatment || "—")}</td></tr>`).join("")}
      </table>

      <h2>Retseptlar (${prescriptions.length})</h2>
      <table><tr><th>Sana</th><th>Tashxis</th><th>Status</th></tr>
      ${prescriptions.map(p => `<tr><td>${esc(p.prescription_date)}</td><td>${esc(p.diagnosis || "—")}</td><td>${esc(p.status)}</td></tr>`).join("")}
      </table>

      <h2>Laboratoriya (${labOrders.length})</h2>
      <table><tr><th>Sana</th><th>Test</th><th>Status</th></tr>
      ${labOrders.map(l => `<tr><td>${esc((l.ordered_at || "").slice(0,10))}</td><td>${esc(l.test_name)}</td><td>${esc(l.status)}</td></tr>`).join("")}
      </table>

      <h2>To'lovlar</h2>
      <p>Jami: <b>${totalBilled.toLocaleString()} so'm</b> · To'langan: <b>${totalPaid.toLocaleString()} so'm</b> · Qarzdorlik: <b>${balance.toLocaleString()} so'm</b></p>
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>← Bemorlar ro'yxati</Button>
        <Button size="sm" variant="outline" onClick={exportPatientPdf}>
          <Download className="w-4 h-4 mr-1" /> EMR Eksport (PDF)
        </Button>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-2xl border border-border p-6 mb-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="font-heading text-2xl font-bold text-foreground">{patient.full_name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              {age !== null && <span>{age} yosh</span>}
              <span>{patient.gender === "male" ? "Erkak" : "Ayol"}</span>
              {patient.blood_group && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" /> {patient.blood_group}{patient.rh_factor}
                </span>
              )}
              {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span>}
              {patient.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {patient.email}</span>}
              {patient.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {patient.address}</span>}
            </div>
            {(patient.allergies || patient.chronic_diseases) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {patient.allergies && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" /> Allergiya: {patient.allergies}
                  </Badge>
                )}
                {patient.chronic_diseases && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    Surunkali: {patient.chronic_diseases}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <KPI label="Yozuvlar" value={records.length} icon={FileText} />
          <KPI label="Retseptlar" value={prescriptions.length} icon={Pill} />
          <KPI label="Laboratoriya" value={labOrders.length} icon={TestTube} />
          <KPI label="Qabullar" value={appointments.length} icon={Calendar} />
          <KPI label={`Qarz (so'm)`} value={balance.toLocaleString()} icon={DollarSign} highlight={balance > 0} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto justify-start gap-1">
          <TabsTrigger value="overview"><Activity className="w-3.5 h-3.5 mr-1" /> Umumiy</TabsTrigger>
          <TabsTrigger value="history"><FileText className="w-3.5 h-3.5 mr-1" /> Tarix</TabsTrigger>
          <TabsTrigger value="notes"><ClipboardList className="w-3.5 h-3.5 mr-1" /> Yozuvlar</TabsTrigger>
          <TabsTrigger value="lab"><TestTube className="w-3.5 h-3.5 mr-1" /> Lab</TabsTrigger>
          <TabsTrigger value="rx"><Pill className="w-3.5 h-3.5 mr-1" /> Retsept</TabsTrigger>
          <TabsTrigger value="appts"><Calendar className="w-3.5 h-3.5 mr-1" /> Qabullar</TabsTrigger>
          <TabsTrigger value="files"><ImageIcon className="w-3.5 h-3.5 mr-1" /> Fayllar</TabsTrigger>
          <TabsTrigger value="billing"><DollarSign className="w-3.5 h-3.5 mr-1" /> To'lovlar</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground mb-3">⚡ Tezkor yozuv (SOAP)</h3>
            <Textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Shifokor yozuvi: shikoyat, ko'rik, taxminiy tashxis, reja..."
            />
            <Button size="sm" className="mt-2" disabled={savingNote || !noteText.trim()} onClick={saveQuickNote}>
              <Plus className="w-4 h-4 mr-1" /> {savingNote ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-bold text-foreground mb-3">📋 So'nggi 5 yozuv</h3>
              {records.slice(0, 5).map((r) => (
                <div key={r.id} className="py-2 border-b last:border-0 border-border">
                  <div className="flex justify-between text-xs">
                    <Badge variant="outline" className="text-[10px]">{r.record_type}</Badge>
                    <span className="text-muted-foreground">{r.record_date}</span>
                  </div>
                  {r.diagnosis && <p className="text-sm text-foreground mt-1">{r.diagnosis}</p>}
                  {r.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.notes}</p>}
                </div>
              ))}
              {records.length === 0 && <p className="text-sm text-muted-foreground">Yozuvlar yo'q</p>}
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-bold text-foreground mb-3">💊 Faol retseptlar</h3>
              {prescriptions.filter(p => p.status === "active").slice(0, 5).map((p) => (
                <div key={p.id} className="py-2 border-b last:border-0 border-border">
                  <p className="text-sm font-medium text-foreground">{p.diagnosis || "Retsept"}</p>
                  <p className="text-xs text-muted-foreground">{p.prescription_date} · Dr. {docName(p.doctor_id)}</p>
                </div>
              ))}
              {prescriptions.filter(p => p.status === "active").length === 0 && <p className="text-sm text-muted-foreground">Faol retseptlar yo'q</p>}
            </div>
          </div>
        </TabsContent>

        {/* History — Timeline */}
        <TabsContent value="history">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground mb-4">📜 Tibbiy tarix (Timeline)</h3>
            {loading ? <p className="text-muted-foreground">Yuklanmoqda...</p> : (
              <div className="space-y-3">
                {records.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="w-px flex-1 bg-border mt-1" />
                    </div>
                    <div className="flex-1 bg-muted/30 rounded-xl p-3 mb-2">
                      <div className="flex justify-between">
                        <Badge variant="outline">{r.record_type}</Badge>
                        <span className="text-xs text-muted-foreground">{r.record_date}</span>
                      </div>
                      {r.diagnosis && <p className="text-sm font-medium mt-1">🔬 {r.diagnosis}</p>}
                      {r.symptoms && <p className="text-xs text-muted-foreground mt-1">🤒 {r.symptoms}</p>}
                      {r.treatment && <p className="text-xs text-primary mt-1">💊 {r.treatment}</p>}
                      {r.notes && <p className="text-xs text-muted-foreground mt-1">📝 {r.notes}</p>}
                      {r.doctor_id && <p className="text-[10px] text-muted-foreground mt-2">Dr. {docName(r.doctor_id)}</p>}
                    </div>
                  </div>
                ))}
                {records.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Yozuvlar yo'q</p>}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notes (clinical) */}
        <TabsContent value="notes">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-bold text-foreground">📝 Klinik yozuvlar</h3>
            {records.filter(r => r.notes).map((r) => (
              <div key={r.id} className="border border-border rounded-xl p-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{r.record_date} · Dr. {docName(r.doctor_id)}</span>
                  <Badge variant="outline" className="text-[10px]">{r.record_type}</Badge>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{r.notes}</p>
              </div>
            ))}
            {records.filter(r => r.notes).length === 0 && <p className="text-sm text-muted-foreground">Yozuvlar yo'q</p>}
          </div>
        </TabsContent>

        {/* Lab */}
        <TabsContent value="lab">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground mb-3">🧪 Laboratoriya & Diagnostika</h3>
            <div className="space-y-3">
              {labOrders.map((o) => {
                const res = labResults.filter(r => r.order_id === o.id);
                return (
                  <div key={o.id} className="border border-border rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm text-foreground">{o.test_name}</p>
                        <p className="text-xs text-muted-foreground">{(o.ordered_at || "").slice(0, 10)} · {o.test_category}</p>
                      </div>
                      <Badge className={o.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{o.status}</Badge>
                    </div>
                    {res.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {res.map((r) => (
                          <div key={r.id} className="text-xs flex justify-between bg-muted/40 rounded px-2 py-1">
                            <span>{r.parameter_name}</span>
                            <span className={r.is_abnormal ? "text-red-600 font-bold" : "text-foreground"}>
                              {r.value} {r.unit} {r.reference_range && `(${r.reference_range})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {labOrders.length === 0 && <p className="text-sm text-muted-foreground">Laboratoriya buyurtmalari yo'q</p>}
            </div>
          </div>
        </TabsContent>

        {/* Rx */}
        <TabsContent value="rx">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-bold text-foreground">💊 Retseptlar</h3>
            {prescriptions.map((p) => (
              <div key={p.id} className="border border-border rounded-xl p-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.diagnosis || "Retsept"}</p>
                    <p className="text-xs text-muted-foreground">{p.prescription_date} · Dr. {docName(p.doctor_id)}</p>
                  </div>
                  <Badge className={p.status === "active" ? "bg-green-100 text-green-800" : "bg-muted"}>{p.status}</Badge>
                </div>
                {Array.isArray(p.medications) && p.medications.length > 0 && (
                  <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4">
                    {p.medications.map((m: any, i: number) => (
                      <li key={i}>{m.name} — {m.dosage} · {m.frequency} · {m.duration}</li>
                    ))}
                  </ul>
                )}
                {p.instructions && <p className="text-xs italic mt-1 text-muted-foreground">{p.instructions}</p>}
              </div>
            ))}
            {prescriptions.length === 0 && <p className="text-sm text-muted-foreground">Retseptlar yo'q</p>}
          </div>
        </TabsContent>

        {/* Appointments */}
        <TabsContent value="appts">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-2">
            <h3 className="font-bold text-foreground mb-2">📅 Qabullar tarixi</h3>
            {appointments.map((a) => (
              <div key={a.id} className="flex justify-between items-center border border-border rounded-xl p-3">
                <div>
                  <p className="text-sm font-medium">{a.appointment_date} · {a.appointment_time}</p>
                  <p className="text-xs text-muted-foreground">Dr. {docName(a.doctor_id)} · {Number(a.total_price).toLocaleString()} so'm</p>
                </div>
                <Badge variant="outline">{a.status}</Badge>
              </div>
            ))}
            {appointments.length === 0 && <p className="text-sm text-muted-foreground">Qabullar yo'q</p>}
          </div>
        </TabsContent>

        {/* Files */}
        <TabsContent value="files">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground mb-3">📸 Fayllar va tasvirlar</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {files.map((f) => (
                <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="block border border-border rounded-xl overflow-hidden hover:border-primary">
                  {f.file_type?.startsWith("image") ? (
                    <img src={f.file_url} alt={f.file_name} className="w-full h-24 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center bg-muted"><FileText className="w-8 h-8 text-muted-foreground" /></div>
                  )}
                  <p className="text-xs p-2 truncate">{f.file_name}</p>
                </a>
              ))}
            </div>
            {files.length === 0 && <p className="text-sm text-muted-foreground">Fayllar yo'q. HMS → Fayllar bo'limidan yuklang.</p>}
          </div>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground mb-3">💰 To'lovlar va hisob-faktura</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Stat label="Jami" value={`${totalBilled.toLocaleString()}`} />
              <Stat label="To'langan" value={`${totalPaid.toLocaleString()}`} highlight="text-green-600" />
              <Stat label="Qarz" value={`${balance.toLocaleString()}`} highlight={balance > 0 ? "text-red-600" : "text-foreground"} />
            </div>
            <div className="space-y-2">
              {invoices.map((i) => (
                <div key={i.id} className="border border-border rounded-xl p-3 flex justify-between">
                  <div>
                    <p className="text-sm font-medium">{i.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{i.invoice_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{Number(i.total_amount).toLocaleString()} so'm</p>
                    <Badge className={i.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{i.status}</Badge>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-sm text-muted-foreground">Hisob-fakturalar yo'q</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const KPI = ({ label, value, icon: Icon, highlight }: any) => (
  <div className={`bg-card rounded-xl border p-3 ${highlight ? "border-red-300" : "border-border"}`}>
    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
    <p className={`text-lg font-bold ${highlight ? "text-red-600" : "text-foreground"}`}>{value}</p>
  </div>
);

const Stat = ({ label, value, highlight = "text-foreground" }: any) => (
  <div className="bg-muted/40 rounded-xl p-3 text-center">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-lg font-bold ${highlight}`}>{value}</p>
  </div>
);

export default HMSPatient360;
