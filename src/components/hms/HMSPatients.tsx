import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, User, Phone, Calendar, Edit2, Trash2, X, ChevronLeft,
  Activity, FlaskConical, FileText, CreditCard, Heart, Pill, AlertTriangle,
  Users, UserCheck, UserX, TrendingUp, QrCode, Download, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";
import { writeAuditLog } from "@/utils/auditLog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

interface Props { clinicId: string; }

const LAB_CATEGORIES = [
  { value: "blood", label: "Qon tahlili" },
  { value: "urine", label: "Siydik tahlili" },
  { value: "biochemistry", label: "Biokimyoviy" },
  { value: "hormones", label: "Gormonlar" },
  { value: "immunology", label: "Immunologiya" },
  { value: "microbiology", label: "Mikrobiologiya" },
  { value: "coagulation", label: "Koagulyatsiya" },
  { value: "other", label: "Boshqa" },
];

const HMSPatients = ({ clinicId }: Props) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientTab, setPatientTab] = useState("profile");
  const [filterGender, setFilterGender] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [showLabModal, setShowLabModal] = useState<any>(null);
  const [labForm, setLabForm] = useState({ test_name: "", test_category: "blood", priority: "normal", notes: "" });

  // Patient detail data
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<Record<string, any[]>>({});
  const [medRecords, setMedRecords] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const [form, setForm] = useState({
    full_name: "", phone: "", date_of_birth: "", gender: "male",
    blood_group: "", address: "", passport_id: "", emergency_contact: "",
    allergies: "", chronic_diseases: "", notes: "", email: "", insurance_number: "",
  });

  const fetchPatients = async () => {
    const { data } = await supabase
      .from("hms_patients").select("*").eq("clinic_id", clinicId)
      .eq("is_active", filterStatus === "active")
      .order("created_at", { ascending: false });
    setPatients(data || []);
  };

  useEffect(() => { fetchPatients(); }, [clinicId, filterStatus]);

  const fetchPatientDetails = async (patient: any) => {
    const [labRes, medRes, invRes, prescRes] = await Promise.all([
      supabase.from("hms_lab_orders").select("*").eq("patient_id", patient.id).order("ordered_at", { ascending: false }),
      supabase.from("hms_medical_records").select("*").eq("patient_id", patient.id).order("record_date", { ascending: false }),
      supabase.from("hms_invoices").select("*").eq("patient_id", patient.id).order("invoice_date", { ascending: false }),
      supabase.from("hms_prescriptions").select("*").eq("patient_id", patient.id).order("prescription_date", { ascending: false }),
    ]);
    setLabOrders(labRes.data || []);
    setMedRecords(medRes.data || []);
    setInvoices(invRes.data || []);
    setPrescriptions(prescRes.data || []);

    if (labRes.data?.length) {
      const { data: results } = await supabase
        .from("hms_lab_results").select("*")
        .in("order_id", labRes.data.map((o: any) => o.id));
      const grouped: Record<string, any[]> = {};
      (results || []).forEach((r: any) => {
        if (!grouped[r.order_id]) grouped[r.order_id] = [];
        grouped[r.order_id].push(r);
      });
      setLabResults(grouped);
    }
  };

  const openPatient = (p: any) => {
    setSelectedPatient(p);
    setPatientTab("profile");
    fetchPatientDetails(p);
  };

  const handleSendToLab = async (patient: any) => {
    const testName = prompt("Tahlil nomini kiriting (masalan: Umumiy qon tahlili):");
    if (!testName) return;
    const { error } = await supabase.from("hms_lab_orders").insert({
      clinic_id: clinicId,
      patient_id: patient.id,
      test_name: testName,
      test_category: "blood",
      priority: "normal",
      status: "pending",
    });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      return;
    }
    await writeAuditLog({ action: "create", entity_type: "lab_order", module: "patients", details: { patient_name: patient.full_name, test_name: testName } });
    toast({ title: "✅ Laboratoriyaga yuborildi", description: `${patient.full_name} — ${testName}` });
    if (selectedPatient?.id === patient.id) fetchPatientDetails(patient);
  };

  const resetForm = () => {
    setForm({ full_name: "", phone: "", date_of_birth: "", gender: "male", blood_group: "", address: "", passport_id: "", emergency_contact: "", allergies: "", chronic_diseases: "", notes: "", email: "", insurance_number: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone) {
      toast({ title: "Ism va telefon majburiy!", variant: "destructive" });
      return;
    }
    const payload = { ...form, clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_patients").update(payload).eq("id", editing.id);
      await writeAuditLog({ action: "update", entity_type: "patient", entity_id: editing.id, module: "patients", details: { full_name: form.full_name } });
      toast({ title: "✅ Bemor yangilandi" });
    } else {
      const { data } = await supabase.from("hms_patients").insert(payload).select("id").single();
      await writeAuditLog({ action: "create", entity_type: "patient", entity_id: data?.id, module: "patients", details: { full_name: form.full_name } });
      toast({ title: "✅ Bemor qo'shildi" });
    }
    resetForm();
    fetchPatients();
  };

  const handleEdit = (p: any) => {
    setForm({
      full_name: p.full_name, phone: p.phone, date_of_birth: p.date_of_birth || "",
      gender: p.gender || "male", blood_group: p.blood_group || "", address: p.address || "",
      passport_id: p.passport_id || "", emergency_contact: p.emergency_contact || "",
      allergies: p.allergies || "", chronic_diseases: p.chronic_diseases || "",
      notes: p.notes || "", email: p.email || "", insurance_number: p.insurance_number || "",
    });
    setEditing(p);
    setShowForm(true);
    setSelectedPatient(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_patients").update({ is_active: false }).eq("id", id);
    toast({ title: "Bemor o'chirildi" });
    fetchPatients();
    if (selectedPatient?.id === id) setSelectedPatient(null);
  };

  const filtered = useMemo(() => patients.filter((p) => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search);
    const matchGender = filterGender === "all" || p.gender === filterGender;
    return matchSearch && matchGender;
  }), [patients, search, filterGender]);

  const stats = useMemo(() => ({
    total: patients.length,
    male: patients.filter(p => p.gender === "male").length,
    female: patients.filter(p => p.gender === "female").length,
    withAllergies: patients.filter(p => p.allergies).length,
  }), [patients]);

  const getAge = (dob: string) => {
    if (!dob) return "—";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31557600000);
  };

  // Report data
  const reportData: HMSReportData = {
    title: "Bemorlar ro'yxati",
    moduleType: "HMS Bemorlar",
    kpiCards: [
      { label: "Jami bemorlar", value: String(stats.total) },
      { label: "Erkaklar", value: String(stats.male) },
      { label: "Ayollar", value: String(stats.female) },
      { label: "Allergiyali", value: String(stats.withAllergies) },
    ],
    tables: patients.length > 0 ? [{
      title: "Bemorlar ma'lumotlari",
      table: {
        headers: ["Ism", "Telefon", "Tug'ilgan sana", "Yosh", "Jins", "Qon guruhi"],
        rows: patients.slice(0, 100).map(p => [
          p.full_name, p.phone, p.date_of_birth || "-",
          String(getAge(p.date_of_birth)),
          p.gender === "male" ? "Erkak" : "Ayol",
          p.blood_group || "-"
        ])
      }
    }] : undefined,
  };

  // ============ PATIENT DETAIL VIEW ============
  if (selectedPatient) {
    const p = selectedPatient;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Orqaga
        </Button>

        {/* Patient Header Card */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{p.full_name}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{p.phone}</span>
                {p.date_of_birth && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{p.date_of_birth} ({getAge(p.date_of_birth)} yosh)</span>}
                {p.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{p.email}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {p.blood_group && <Badge variant="outline" className="text-sm">{p.blood_group}{p.rh_factor || ""}</Badge>}
              <Badge variant="outline">{p.gender === "male" ? "Erkak" : "Ayol"}</Badge>
              <Button size="sm" variant="outline" onClick={() => handleSendToLab(p)}><FlaskConical className="w-3.5 h-3.5 mr-1" /> Laboratoriyaga</Button>
              <Button size="sm" variant="outline" onClick={() => handleEdit(p)}><Edit2 className="w-3.5 h-3.5 mr-1" /> Tahrirlash</Button>
            </div>
          </div>
        </div>

        {/* Patient Tabs */}
        <Tabs value={patientTab} onValueChange={setPatientTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="profile" className="text-xs"><User className="w-3.5 h-3.5 mr-1" />Profil</TabsTrigger>
            <TabsTrigger value="history" className="text-xs"><Heart className="w-3.5 h-3.5 mr-1" />Tibbiy tarix</TabsTrigger>
            <TabsTrigger value="lab" className="text-xs"><FlaskConical className="w-3.5 h-3.5 mr-1" />Analizlar</TabsTrigger>
            <TabsTrigger value="prescriptions" className="text-xs"><Pill className="w-3.5 h-3.5 mr-1" />Retseptlar</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs"><CreditCard className="w-3.5 h-3.5 mr-1" />To'lovlar</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Shaxsiy ma'lumotlar</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Pasport:</span><br/>{p.passport_id || "—"}</div>
                  <div><span className="text-muted-foreground">Manzil:</span><br/>{p.address || "—"}</div>
                  <div><span className="text-muted-foreground">Favqulodda aloqa:</span><br/>{p.emergency_contact || "—"}</div>
                  <div><span className="text-muted-foreground">Sug'urta:</span><br/>{p.insurance_number || "—"}</div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Tibbiy ma'lumotlar</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Allergiyalar:</span><br/><span className={p.allergies ? "text-destructive font-medium" : ""}>{p.allergies || "Yo'q"}</span></div>
                  <div><span className="text-muted-foreground">Surunkali kasalliklar:</span><br/>{p.chronic_diseases || "Yo'q"}</div>
                  <div><span className="text-muted-foreground">Izoh:</span><br/>{p.notes || "—"}</div>
                </div>
              </div>
            </div>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { label: "Qabullar", value: medRecords.length, icon: FileText, color: "text-blue-500" },
                { label: "Analizlar", value: labOrders.length, icon: FlaskConical, color: "text-green-500" },
                { label: "Retseptlar", value: prescriptions.length, icon: Pill, color: "text-purple-500" },
                { label: "Invoicelar", value: invoices.length, icon: CreditCard, color: "text-orange-500" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-3 text-center">
                  <s.icon className={cn("w-5 h-5 mx-auto mb-1", s.color)} />
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* MEDICAL HISTORY TAB */}
          <TabsContent value="history" className="mt-4 space-y-3">
            {medRecords.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Tibbiy yozuvlar topilmadi</p>
            ) : medRecords.map((r: any) => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1">{r.record_type || "Qabul"}</Badge>
                    <p className="text-sm font-medium text-foreground">{r.diagnosis || "Tashxis ko'rsatilmagan"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(r.record_date).toLocaleDateString("uz")}</span>
                </div>
                {r.symptoms && <p className="text-xs text-muted-foreground"><strong>Alomatlar:</strong> {r.symptoms}</p>}
                {r.treatment && <p className="text-xs text-muted-foreground"><strong>Davolash:</strong> {r.treatment}</p>}
                {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
              </div>
            ))}
          </TabsContent>

           {/* LAB RESULTS TAB */}
          <TabsContent value="lab" className="mt-4 space-y-3">
            <div className="flex justify-end mb-2">
              <Button size="sm" onClick={() => handleSendToLab(p)}>
                <FlaskConical className="w-3.5 h-3.5 mr-1" /> Laboratoriyaga yuborish
              </Button>
            </div>
            {labOrders.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Analizlar topilmadi</p>
            ) : labOrders.map((order: any) => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm text-foreground">{order.test_name}</span>
                    {order.priority === "urgent" && <Badge className="bg-orange-100 text-orange-800 text-[10px]">Shoshilinch</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px]",
                      order.status === "completed" ? "bg-green-100 text-green-800" :
                      order.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                    )}>{order.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(order.ordered_at).toLocaleDateString("uz")}</span>
                  </div>
                </div>
                {labResults[order.id]?.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Parametr</TableHead>
                        <TableHead className="text-xs">Qiymat</TableHead>
                        <TableHead className="text-xs">Birlik</TableHead>
                        <TableHead className="text-xs">Norma</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labResults[order.id].map((r: any) => (
                        <TableRow key={r.id} className={r.is_abnormal ? "text-destructive" : ""}>
                          <TableCell className="text-xs py-1">{r.parameter_name} {r.is_abnormal && <AlertTriangle className="w-3 h-3 inline" />}</TableCell>
                          <TableCell className="text-xs py-1 font-medium">{r.value}</TableCell>
                          <TableCell className="text-xs py-1">{r.unit}</TableCell>
                          <TableCell className="text-xs py-1">{r.reference_range}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </TabsContent>

          {/* PRESCRIPTIONS TAB */}
          <TabsContent value="prescriptions" className="mt-4 space-y-3">
            {prescriptions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Retseptlar topilmadi</p>
            ) : prescriptions.map((rx: any) => (
              <div key={rx.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-foreground">{rx.diagnosis || "Tashxis"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(rx.prescription_date).toLocaleDateString("uz")}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{rx.status || "active"}</Badge>
                </div>
                {rx.instructions && <p className="text-xs text-muted-foreground">{rx.instructions}</p>}
              </div>
            ))}
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing" className="mt-4">
            {invoices.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Invoicelar topilmadi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Invoice №</TableHead>
                    <TableHead className="text-xs">Sana</TableHead>
                    <TableHead className="text-xs">Summa</TableHead>
                    <TableHead className="text-xs">To'langan</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-xs font-mono">{inv.invoice_number}</TableCell>
                      <TableCell className="text-xs">{new Date(inv.invoice_date).toLocaleDateString("uz")}</TableCell>
                      <TableCell className="text-xs font-medium">{(inv.total_amount || 0).toLocaleString()} so'm</TableCell>
                      <TableCell className="text-xs">{(inv.paid_amount || 0).toLocaleString()} so'm</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px]",
                          inv.status === "paid" ? "bg-green-100 text-green-800" :
                          inv.status === "partial" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        )}>{inv.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ============ PATIENTS LIST VIEW ============
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Jami bemorlar", value: stats.total, icon: Users, color: "text-primary" },
          { label: "Erkaklar", value: stats.male, icon: UserCheck, color: "text-blue-500" },
          { label: "Ayollar", value: stats.female, icon: UserX, color: "text-pink-500" },
          { label: "Allergiyali", value: stats.withAllergies, icon: AlertTriangle, color: "text-orange-500" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("w-4 h-4", s.color)} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Bemorlar kartasi</h2>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full sm:w-52" />
          </div>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
            <option value="all">Barcha jins</option>
            <option value="male">Erkak</option>
            <option value="female">Ayol</option>
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
          <HMSDownloadMenu data={reportData} />
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Yangi bemor
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">
              {editing ? "Bemorni tahrirlash" : "Yangi bemor qo'shish"}
            </h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="To'liq ism *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input placeholder="Telefon (+998) *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">Erkak</option>
              <option value="female">Ayol</option>
            </select>
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
              <option value="">Qon guruhi</option>
              {["I(O)", "II(A)", "III(B)", "IV(AB)"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <Input placeholder="Pasport raqami" value={form.passport_id} onChange={(e) => setForm({ ...form, passport_id: e.target.value })} />
            <Input placeholder="Sug'urta raqami" value={form.insurance_number} onChange={(e) => setForm({ ...form, insurance_number: e.target.value })} />
            <Input placeholder="Favqulodda aloqa" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
            <Input placeholder="Manzil" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
            <Input placeholder="Allergiyalar" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
            <Input placeholder="Surunkali kasalliklar" value={form.chronic_diseases} onChange={(e) => setForm({ ...form, chronic_diseases: e.target.value })} />
            <Input placeholder="Izoh" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button variant="outline" onClick={resetForm}>Bekor qilish</Button>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-3">Jami: {filtered.length} bemor</p>

      {/* Patients Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Bemor</TableHead>
              <TableHead className="text-xs">Telefon</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Yosh</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Qon guruhi</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Allergiya</TableHead>
              <TableHead className="text-xs text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openPatient(p)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{p.full_name}</p>
                      <Badge variant="outline" className="text-[9px]">{p.gender === "male" ? "Erkak" : "Ayol"}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs">{p.phone}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{getAge(p.date_of_birth)}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{p.blood_group || "—"}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">
                  {p.allergies ? <span className="text-destructive">{p.allergies.substring(0, 30)}</span> : "—"}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Bemorlar topilmadi</p>}
      </div>
    </div>
  );
};

export default HMSPatients;
