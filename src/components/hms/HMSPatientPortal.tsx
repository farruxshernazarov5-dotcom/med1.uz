import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, User, FileText, Pill, FlaskConical, Calendar, Activity, CreditCard, Heart, Bell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props { clinicId: string; }
const COLORS = ["hsl(214, 84%, 56%)", "hsl(145, 63%, 42%)", "hsl(32, 87%, 52%)", "hsl(0, 72%, 55%)", "hsl(250, 100%, 69%)"];

const HMSPatientPortal = ({ clinicId }: Props) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"info" | "records" | "prescriptions" | "labs" | "appointments" | "billing">("info");

  const fetchPatients = async () => {
    const { data } = await supabase.from("hms_patients").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("full_name");
    setPatients(data || []);
  };

  const fetchPatientData = async (patientId: string) => {
    const [recRes, presRes, labRes, apptRes, invRes] = await Promise.all([
      supabase.from("hms_medical_records").select("*").eq("clinic_id", clinicId).eq("patient_id", patientId).order("record_date", { ascending: false }),
      supabase.from("hms_prescriptions").select("*, hms_prescription_items(*)").eq("clinic_id", clinicId).eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("hms_lab_orders").select("*, hms_lab_results(*)").eq("clinic_id", clinicId).eq("patient_id", patientId).order("ordered_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("clinic_id", clinicId).eq("patient_id", patientId).order("appointment_date", { ascending: false }).limit(20),
      supabase.from("hms_invoices").select("*").eq("clinic_id", clinicId).eq("patient_id", patientId).order("invoice_date", { ascending: false }),
    ]);
    setRecords(recRes.data || []);
    setPrescriptions(presRes.data || []);
    setLabOrders(labRes.data || []);
    setAppointments(apptRes.data || []);
    setInvoices(invRes.data || []);
  };

  useEffect(() => { fetchPatients(); }, [clinicId]);

  const selectPatient = (p: any) => {
    setSelected(p);
    setTab("info");
    fetchPatientData(p.id);
  };

  const filtered = patients.filter(p => !search || p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search));

  const typeLabels: Record<string, string> = { visit: "Qabul", diagnosis: "Tashxis", procedure: "Protsedura", lab: "Lab", imaging: "Tasvir", referral: "Yo'llama", follow_up: "Qayta" };
  const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };

  // Patient stats
  const totalSpent = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const recordTypeStats = ["visit", "diagnosis", "procedure", "lab"].map(t => ({
    name: typeLabels[t] || t,
    value: records.filter(r => r.record_type === t).length
  })).filter(d => d.value > 0);

  const tabs = [
    { id: "info" as const, label: "Profil", icon: User },
    { id: "records" as const, label: `EMR (${records.length})`, icon: FileText },
    { id: "prescriptions" as const, label: `Retseptlar (${prescriptions.length})`, icon: Pill },
    { id: "labs" as const, label: `Tahlillar (${labOrders.length})`, icon: FlaskConical },
    { id: "appointments" as const, label: `Qabullar (${appointments.length})`, icon: Calendar },
    { id: "billing" as const, label: `To'lovlar (${invoices.length})`, icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Bemor portali</h2>
          <p className="text-xs text-muted-foreground">{patients.length} ta faol bemor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list */}
        <div className="lg:col-span-1">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Bemor qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.map(p => (
              <button key={p.id} onClick={() => selectPatient(p)} className={cn("w-full text-left p-3 rounded-xl transition-all", selected?.id === p.id ? "bg-primary/10 border border-primary/30" : "bg-card border border-border hover:bg-muted")}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{p.phone} {p.blood_group && `• ${p.blood_group}${p.rh_factor || ""}`}</p>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center py-4 text-muted-foreground text-sm">Bemorlar topilmadi</p>}
          </div>
        </div>

        {/* Patient detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="text-center py-16 text-muted-foreground">
              <User className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">Bemorni tanlang</p>
              <p className="text-sm">Chap tarafdan bemorni bosing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-4 py-2 text-sm rounded-lg whitespace-nowrap font-medium transition-all", tab === t.id ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>

              {/* Profile tab */}
              {tab === "info" && (
                <div className="space-y-4">
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold">
                        {selected.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground">{selected.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{selected.phone} • {selected.gender === "male" ? "Erkak" : "Ayol"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {[
                        { label: "Tug'ilgan sana", value: selected.date_of_birth },
                        { label: "Qon guruhi", value: `${selected.blood_group || "—"}${selected.rh_factor || ""}` },
                        { label: "Passport", value: selected.passport_id },
                        { label: "Sug'urta", value: selected.insurance_number },
                        { label: "Manzil", value: selected.address },
                        { label: "Email", value: selected.email },
                        { label: "Shoshilinch aloqa", value: selected.emergency_contact },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-muted-foreground text-xs">{item.label}</p>
                          <p className="font-medium text-foreground">{item.value || "—"}</p>
                        </div>
                      ))}
                    </div>
                    {selected.allergies && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"><p className="text-xs text-muted-foreground">⚠️ Allergiyalar</p><p className="text-sm text-destructive font-medium">{selected.allergies}</p></div>}
                    {selected.chronic_diseases && <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"><p className="text-xs text-muted-foreground">Surunkali kasalliklar</p><p className="text-sm text-foreground">{selected.chronic_diseases}</p></div>}
                  </div>
                  {/* Mini stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-xs text-muted-foreground">Tashriflar</p><p className="text-xl font-bold text-primary">{records.length}</p></div>
                    <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-xs text-muted-foreground">Tahlillar</p><p className="text-xl font-bold text-primary">{labOrders.length}</p></div>
                    <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-xs text-muted-foreground">Retseptlar</p><p className="text-xl font-bold text-primary">{prescriptions.length}</p></div>
                    <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-xs text-muted-foreground">To'lovlar</p><p className="text-xl font-bold text-primary">{(totalSpent / 1e3).toFixed(0)}K</p></div>
                  </div>
                  {recordTypeStats.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border p-5">
                      <h4 className="font-heading font-bold text-sm mb-3">Yozuvlar taqsimoti</h4>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={recordTypeStats} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {recordTypeStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* EMR tab */}
              {tab === "records" && (
                <div className="space-y-3">
                  {records.map(r => (
                    <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{typeLabels[r.record_type] || r.record_type}</Badge>
                          <span className="text-xs text-muted-foreground">{r.record_date}</span>
                        </div>
                        {r.is_confidential && <Badge className="text-[10px] bg-red-100 text-red-800">Maxfiy</Badge>}
                      </div>
                      {r.diagnosis && <p className="text-sm"><strong>Tashxis:</strong> {r.diagnosis}</p>}
                      {r.symptoms && <p className="text-sm text-muted-foreground">Alomatlar: {r.symptoms}</p>}
                      {r.treatment && <p className="text-sm text-muted-foreground">Davolash: {r.treatment}</p>}
                      {r.follow_up_date && <p className="text-xs text-primary mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Qayta qabul: {r.follow_up_date}</p>}
                    </div>
                  ))}
                  {records.length === 0 && <p className="text-center py-8 text-muted-foreground">Tibbiy yozuvlar yo'q</p>}
                </div>
              )}

              {/* Prescriptions tab */}
              {tab === "prescriptions" && (
                <div className="space-y-3">
                  {prescriptions.map(p => (
                    <div key={p.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("uz")}</span>
                        <Badge className={cn("text-[10px]", p.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")}>{p.status}</Badge>
                      </div>
                      {p.diagnosis && <p className="text-sm font-medium text-foreground mb-2">Tashxis: {p.diagnosis}</p>}
                      {(p.hms_prescription_items || []).map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm py-1 border-t border-border">
                          <Pill className="w-3 h-3 text-primary" />
                          <span className="font-medium">{item.drug_name}</span>
                          <span className="text-muted-foreground">{item.dosage} • {item.frequency} • {item.duration}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {prescriptions.length === 0 && <p className="text-center py-8 text-muted-foreground">Retseptlar yo'q</p>}
                </div>
              )}

              {/* Labs tab */}
              {tab === "labs" && (
                <div className="space-y-3">
                  {labOrders.map(l => (
                    <div key={l.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-foreground text-sm">{l.test_name}</span>
                        </div>
                        <Badge className={cn("text-[10px]", l.status === "completed" ? "bg-green-100 text-green-800" : l.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800")}>{l.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{l.test_category} • {new Date(l.ordered_at).toLocaleDateString("uz")}</p>
                      {(l.hms_lab_results || []).map((r: any) => (
                        <div key={r.id} className={cn("flex items-center justify-between text-sm py-1 border-t border-border", r.is_abnormal && "text-destructive")}>
                          <span>{r.parameter_name}</span>
                          <span className="font-medium">{r.value} {r.unit} <span className="text-xs text-muted-foreground">({r.reference_range})</span></span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {labOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Tahlillar yo'q</p>}
                </div>
              )}

              {/* Appointments tab */}
              {tab === "appointments" && (
                <div className="space-y-2">
                  {appointments.map(a => (
                    <div key={a.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.appointment_date} {a.appointment_time?.slice(0, 5)}</p>
                        <p className="text-xs text-muted-foreground">{a.notes || "Qabul"}</p>
                      </div>
                      <Badge className={cn("text-[10px]", statusColors[a.status])}>{a.status}</Badge>
                      {a.total_price > 0 && <span className="text-sm font-bold text-primary">{Number(a.total_price).toLocaleString()}</span>}
                    </div>
                  ))}
                  {appointments.length === 0 && <p className="text-center py-8 text-muted-foreground">Qabullar yo'q</p>}
                </div>
              )}

              {/* Billing tab */}
              {tab === "billing" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-xs text-muted-foreground">Jami to'lovlar</p><p className="text-lg font-bold text-primary">{invoices.length}</p></div>
                    <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-xs text-muted-foreground">To'langan</p><p className="text-lg font-bold text-green-600">{(totalSpent / 1e3).toFixed(0)}K</p></div>
                    <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-xs text-muted-foreground">Qarz</p><p className="text-lg font-bold text-destructive">{(invoices.filter(i => i.status !== "paid").reduce((s, i) => s + Number(i.total_amount || 0) - Number(i.paid_amount || 0), 0) / 1e3).toFixed(0)}K</p></div>
                  </div>
                  {invoices.map(inv => (
                    <div key={inv.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">#{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{inv.invoice_date}</p>
                      </div>
                      <span className="text-sm font-bold">{Number(inv.total_amount || 0).toLocaleString()}</span>
                      <Badge className={cn("text-[10px]", inv.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>{inv.status}</Badge>
                    </div>
                  ))}
                  {invoices.length === 0 && <p className="text-center py-8 text-muted-foreground">To'lovlar yo'q</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HMSPatientPortal;
