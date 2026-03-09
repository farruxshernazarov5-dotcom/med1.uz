import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, User, FileText, Pill, FlaskConical, Calendar, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSPatientPortal = ({ clinicId }: Props) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"info" | "records" | "prescriptions" | "labs">("info");

  const fetchPatients = async () => {
    const { data } = await supabase.from("hms_patients").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("full_name");
    setPatients(data || []);
  };

  const fetchPatientData = async (patientId: string) => {
    const [recRes, presRes, labRes] = await Promise.all([
      supabase.from("hms_medical_records").select("*").eq("clinic_id", clinicId).eq("patient_id", patientId).order("record_date", { ascending: false }),
      supabase.from("hms_prescriptions").select("*, hms_prescription_items(*)").eq("clinic_id", clinicId).eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("hms_lab_orders").select("*, hms_lab_results(*)").eq("clinic_id", clinicId).eq("patient_id", patientId).order("ordered_at", { ascending: false }),
    ]);
    setRecords(recRes.data || []);
    setPrescriptions(presRes.data || []);
    setLabOrders(labRes.data || []);
  };

  useEffect(() => { fetchPatients(); }, [clinicId]);

  const selectPatient = (p: any) => {
    setSelected(p);
    setTab("info");
    fetchPatientData(p.id);
  };

  const filtered = patients.filter(p => !search || p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search));

  const typeLabels: Record<string, string> = { visit: "Qabul", diagnosis: "Tashxis", procedure: "Protsedura", lab: "Lab", imaging: "Tasvir", referral: "Yo'llama", follow_up: "Qayta" };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Bemor portali</h2>

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
                <p className="font-semibold text-foreground text-sm">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">{p.phone} {p.blood_group && `• ${p.blood_group}${p.rh_factor}`}</p>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center py-4 text-muted-foreground text-sm">Bemorlar topilmadi</p>}
          </div>
        </div>

        {/* Patient detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="text-center py-16 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Bemorni tanlang</p>
            </div>
          ) : (
            <div>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {[
                  { id: "info" as const, label: "Ma'lumotlar", icon: User },
                  { id: "records" as const, label: `EMR (${records.length})`, icon: FileText },
                  { id: "prescriptions" as const, label: `Retseptlar (${prescriptions.length})`, icon: Pill },
                  { id: "labs" as const, label: `Tahlillar (${labOrders.length})`, icon: FlaskConical },
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-4 py-2 text-sm rounded-lg whitespace-nowrap", tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>

              {tab === "info" && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">{selected.full_name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: "Telefon", value: selected.phone },
                      { label: "Jinsi", value: selected.gender === "male" ? "Erkak" : "Ayol" },
                      { label: "Tug'ilgan sana", value: selected.date_of_birth },
                      { label: "Qon guruhi", value: `${selected.blood_group || "—"}${selected.rh_factor || ""}` },
                      { label: "Passport", value: selected.passport_id || "—" },
                      { label: "Sug'urta", value: selected.insurance_number || "—" },
                      { label: "Manzil", value: selected.address || "—" },
                      { label: "Email", value: selected.email || "—" },
                      { label: "Shoshilinch aloqa", value: selected.emergency_contact || "—" },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-muted-foreground text-xs">{item.label}</p>
                        <p className="font-medium text-foreground">{item.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                  {selected.allergies && <div className="mt-4"><p className="text-xs text-muted-foreground">Allergiyalar</p><p className="text-sm text-destructive font-medium">{selected.allergies}</p></div>}
                  {selected.chronic_diseases && <div className="mt-2"><p className="text-xs text-muted-foreground">Surunkali kasalliklar</p><p className="text-sm text-foreground">{selected.chronic_diseases}</p></div>}
                </div>
              )}

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HMSPatientPortal;
