import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { esc } from "@/lib/htmlEscape";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Pill, FileText, Printer, Search, AlertTriangle, Sparkles, Send, Clock, CheckCircle2, ShieldCheck, QrCode, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props { clinicId: string; }
interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions?: string; }

// ─── EXPANDED DRUG DATABASE ───
const DRUG_DATABASE: Record<string, { group: string; forms: string[]; contraindications: string[]; sideEffects: string[] }> = {
  "paratsetamol": { group: "Analgezik / Antipiretik", forms: ["Tablet 500mg", "Sirop 120mg/5ml", "Svechi 250mg"], contraindications: ["Jigar yetishmovchiligi", "Alkogolizm"], sideEffects: ["Allergik reaktsiya", "Jigar zararlanishi (yuqori dozada)"] },
  "ibuprofen": { group: "NSAID", forms: ["Tablet 200mg", "Tablet 400mg", "Gel 5%"], contraindications: ["Oshqozon yarasi", "Buyrak yetishmovchiligi", "Homiladorlik (III trimestr)"], sideEffects: ["Oshqozon og'rishi", "Bosh aylanishi"] },
  "aspirin": { group: "NSAID / Antiagregant", forms: ["Tablet 100mg", "Tablet 500mg"], contraindications: ["Hemofilia", "Oshqozon yarasi", "12 yoshdan kichik bolalar"], sideEffects: ["Qon ketish xavfi", "Oshqozon shilliq qavati shikastlanishi"] },
  "amoksitsillin": { group: "Antibiotik (Penitsillin)", forms: ["Kapsul 250mg", "Kapsul 500mg", "Suspenziya"], contraindications: ["Penitsillin allergiyasi", "Mononukleoz"], sideEffects: ["Diareya", "Teri toshmasi", "Disbakterioz"] },
  "azitromitsin": { group: "Antibiotik (Makrolid)", forms: ["Tablet 250mg", "Tablet 500mg", "Suspenziya"], contraindications: ["Jigar yetishmovchiligi"], sideEffects: ["Ko'ngil aynishi", "Diareya", "Bosh og'rishi"] },
  "metformin": { group: "Antidiabetik (Biguanid)", forms: ["Tablet 500mg", "Tablet 850mg", "Tablet 1000mg"], contraindications: ["Buyrak yetishmovchiligi", "Metabolik atsidoz", "Alkogolizm"], sideEffects: ["Ko'ngil aynishi", "Diareya", "Laktik atsidoz (kam)"] },
  "enalapril": { group: "ACE inhibitor", forms: ["Tablet 5mg", "Tablet 10mg", "Tablet 20mg"], contraindications: ["Homiladorlik", "Angionevrotik shish tarixi"], sideEffects: ["Quruq yo'tal", "Bosh aylanishi", "Giperkaliemiya"] },
  "amlodipine": { group: "Kalsiy kanali blokatori", forms: ["Tablet 5mg", "Tablet 10mg"], contraindications: ["Og'ir gipotenziya", "Aorta stenozi"], sideEffects: ["Oyoq shishi", "Bosh og'rishi", "Yuz qizarishi"] },
  "omeprazol": { group: "Proton pompasi inhibitori", forms: ["Kapsul 20mg", "Kapsul 40mg"], contraindications: ["Jigar yetishmovchiligi"], sideEffects: ["Bosh og'rishi", "Qorin og'rishi", "B12 vitamin tanqisligi (uzoq muddatli)"] },
  "diklofenak": { group: "NSAID", forms: ["Tablet 50mg", "Injection 75mg", "Gel 1%"], contraindications: ["Oshqozon yarasi", "Og'ir yurak yetishmovchiligi"], sideEffects: ["Oshqozon muammolari", "Jigar fermentlari oshishi"] },
  "prednizolon": { group: "Kortikosteroid", forms: ["Tablet 5mg", "Injection 30mg"], contraindications: ["Tizimli infeksiya", "Diabet (ehtiyotkorlik)"], sideEffects: ["Vazn oshishi", "Qon bosimi oshishi", "Osteoporoz"] },
  "loratadin": { group: "Antigistamin", forms: ["Tablet 10mg", "Sirop 5mg/5ml"], contraindications: ["Og'ir jigar yetishmovchiligi"], sideEffects: ["Uyqu kelishi", "Og'iz qurishi"] },
  "warfarin": { group: "Antikoagulyant", forms: ["Tablet 2.5mg", "Tablet 5mg"], contraindications: ["Homiladorlik", "Faol qon ketish", "Og'ir gipertoniya"], sideEffects: ["Qon ketish", "Teri nekrozi (kam)"] },
  "insulin": { group: "Antidiabetik", forms: ["Injection 100IU/ml"], contraindications: ["Gipoglikemiya"], sideEffects: ["Gipoglikemiya", "Vazn oshishi", "Lipodistrofiya"] },
  "salbutamol": { group: "Beta-2 agonist", forms: ["Inhaler 100mcg", "Nebulizer 2.5mg/2.5ml"], contraindications: ["Og'ir yurak aritmiyasi"], sideEffects: ["Tremor", "Tachikardiya"] },
};

// Drug-drug interactions
const DRUG_INTERACTIONS: Record<string, { drug: string; severity: "high" | "medium" | "low"; message: string }[]> = {
  "aspirin": [
    { drug: "warfarin", severity: "high", message: "Qon ketish xavfi juda yuqori!" },
    { drug: "ibuprofen", severity: "high", message: "Oshqozon yarasi va qon ketish xavfi oshadi" },
    { drug: "diklofenak", severity: "high", message: "GI traktda qon ketish xavfi" },
  ],
  "warfarin": [
    { drug: "aspirin", severity: "high", message: "Qon ketish xavfi juda yuqori!" },
    { drug: "ibuprofen", severity: "high", message: "Antikoagulyant ta'siri kuchayadi" },
    { drug: "paratsetamol", severity: "medium", message: "INR oshishi mumkin (monitoring kerak)" },
  ],
  "metformin": [
    { drug: "prednizolon", severity: "medium", message: "Glyukoza darajasi oshishi mumkin" },
  ],
  "enalapril": [
    { drug: "diklofenak", severity: "medium", message: "Buyrak funksiyasi yomonlashishi mumkin" },
    { drug: "ibuprofen", severity: "medium", message: "Antihipertenziv ta'sir kamayishi mumkin" },
  ],
};

// ICD-10 codes with prescription protocols
const ICD10_PROTOCOLS: { code: string; name: string; nameUz: string; meds: Medication[] }[] = [
  { code: "J06.9", name: "Acute upper respiratory infection", nameUz: "O'tkir respirator infeksiya", meds: [{ name: "Paratsetamol", dosage: "500mg", frequency: "Kuniga 3 marta", duration: "5 kun" }, { name: "Loratadin", dosage: "10mg", frequency: "Kuniga 1 marta", duration: "5 kun" }] },
  { code: "J18.9", name: "Pneumonia", nameUz: "Pnevmoniya", meds: [{ name: "Amoksitsillin", dosage: "500mg", frequency: "Kuniga 3 marta", duration: "7 kun" }, { name: "Paratsetamol", dosage: "500mg", frequency: "Zarurat bo'yicha", duration: "5 kun" }] },
  { code: "I10", name: "Essential hypertension", nameUz: "Gipertoniya", meds: [{ name: "Enalapril", dosage: "10mg", frequency: "Kuniga 2 marta", duration: "Doimiy" }, { name: "Amlodipine", dosage: "5mg", frequency: "Kuniga 1 marta", duration: "Doimiy" }] },
  { code: "E11", name: "Type 2 diabetes mellitus", nameUz: "2-tur diabet", meds: [{ name: "Metformin", dosage: "500mg", frequency: "Kuniga 2 marta", duration: "Doimiy" }] },
  { code: "K29.7", name: "Gastritis", nameUz: "Gastrit", meds: [{ name: "Omeprazol", dosage: "20mg", frequency: "Kuniga 1 marta ovqatdan oldin", duration: "14 kun" }] },
  { code: "M54.5", name: "Low back pain", nameUz: "Bel og'rishi", meds: [{ name: "Diklofenak", dosage: "50mg", frequency: "Kuniga 2 marta", duration: "5 kun" }, { name: "Paratsetamol", dosage: "500mg", frequency: "Zarurat bo'yicha", duration: "5 kun" }] },
  { code: "J45", name: "Asthma", nameUz: "Bronxial astma", meds: [{ name: "Salbutamol", dosage: "100mcg", frequency: "Zarurat bo'yicha 2 puff", duration: "Doimiy" }] },
  { code: "L30.9", name: "Dermatitis", nameUz: "Dermatit", meds: [{ name: "Loratadin", dosage: "10mg", frequency: "Kuniga 1 marta", duration: "10 kun" }] },
  { code: "K25", name: "Gastric ulcer", nameUz: "Oshqozon yarasi", meds: [{ name: "Omeprazol", dosage: "40mg", frequency: "Kuniga 2 marta", duration: "28 kun" }, { name: "Amoksitsillin", dosage: "1000mg", frequency: "Kuniga 2 marta", duration: "14 kun" }] },
  { code: "N39.0", name: "UTI", nameUz: "Siydik yo'li infeksiyasi", meds: [{ name: "Amoksitsillin", dosage: "500mg", frequency: "Kuniga 3 marta", duration: "7 kun" }] },
];

const VERIFICATION_STATUSES = {
  valid: { label: "Amal qiladi", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  expired: { label: "Muddati o'tgan", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  revoked: { label: "Bekor qilingan", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

const HMSPrescription = ({ clinicId }: Props) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinicName, setClinicName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [viewRx, setViewRx] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ patient_name: "", doctor_id: "", diagnosis: "", icd_code: "", instructions: "", notes: "" });
  const [meds, setMeds] = useState<Medication[]>([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [warnings, setWarnings] = useState<{ drug1: string; drug2: string; severity: string; message: string }[]>([]);
  const [drugSearch, setDrugSearch] = useState("");
  const [icdSearch, setIcdSearch] = useState("");
  const [showDrugDB, setShowDrugDB] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");

  const fetchData = async () => {
    const [rxRes, dRes, cRes] = await Promise.all([
      supabase.from("hms_prescriptions").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(500),
      supabase.from("doctors").select("id, full_name, specialty").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("registered_clinics").select("name").eq("id", clinicId).single(),
    ]);
    setPrescriptions(rxRes.data || []);
    setDoctors(dRes.data || []);
    setClinicName(cRes.data?.name || "");
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  // Check drug interactions
  useEffect(() => {
    const medNames = meds.map(m => m.name.toLowerCase()).filter(Boolean);
    const warns: { drug1: string; drug2: string; severity: string; message: string }[] = [];
    medNames.forEach(drug => {
      const interactions = DRUG_INTERACTIONS[drug];
      if (interactions) {
        interactions.forEach(inter => {
          if (medNames.includes(inter.drug)) {
            const key = [drug, inter.drug].sort().join("-");
            if (!warns.find(w => [w.drug1, w.drug2].sort().join("-") === key)) {
              warns.push({ drug1: drug, drug2: inter.drug, severity: inter.severity, message: inter.message });
            }
          }
        });
      }
    });
    setWarnings(warns);
  }, [meds]);

  const resetForm = () => { setForm({ patient_name: "", doctor_id: "", diagnosis: "", icd_code: "", instructions: "", notes: "" }); setMeds([{ name: "", dosage: "", frequency: "", duration: "" }]); setShowForm(false); setWarnings([]); };

  const handleCreate = async () => {
    if (!form.patient_name || meds.every(m => !m.name)) { toast({ title: "Bemor va dori nomi majburiy!", variant: "destructive" }); return; }
    if (warnings.some(w => w.severity === "high")) {
      const confirmed = window.confirm("⚠️ YUQORI XAVFLI dori o'zaro ta'siri mavjud! Davom etasizmi?");
      if (!confirmed) return;
    }
    const validMeds = meds.filter(m => m.name);
    const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 30);
    const qrCode = `RX-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from("hms_prescriptions").insert([{
      clinic_id: clinicId, patient_name: form.patient_name, doctor_id: form.doctor_id || null,
      diagnosis: form.icd_code ? `[${form.icd_code}] ${form.diagnosis}` : form.diagnosis,
      medications: validMeds as any, instructions: form.instructions,
      notes: form.notes, valid_until: validUntil.toISOString().split("T")[0],
      qr_code: qrCode
    }]);
    toast({ title: "✅ Retsept yaratildi va verifikatsiya kodi berildi", description: `Kod: ${qrCode}` });
    resetForm(); fetchData();
  };

  const applyICD = (protocol: typeof ICD10_PROTOCOLS[0]) => {
    setForm({ ...form, diagnosis: protocol.nameUz, icd_code: protocol.code });
    setMeds(protocol.meds.map(m => ({ ...m, instructions: "" })));
    setIcdSearch("");
    toast({ title: `📋 ICD-10: ${protocol.code} — ${protocol.nameUz}` });
  };

  const addMed = () => setMeds([...meds, { name: "", dosage: "", frequency: "", duration: "" }]);
  const updateMed = (i: number, field: keyof Medication, val: string) => {
    const updated = [...meds]; updated[i] = { ...updated[i], [field]: val }; setMeds(updated);
  };
  const removeMed = (i: number) => setMeds(meds.filter((_, idx) => idx !== i));

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "—";

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("hms_prescriptions").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData(); setViewRx(null);
  };

  const verifyPrescription = () => {
    const found = prescriptions.find(r => r.qr_code === verifyCode);
    if (found) {
      const todayStr = new Date().toISOString().split("T")[0];
      const isExpired = found.valid_until && found.valid_until < todayStr;
      const isRevoked = found.status === "cancelled";
      if (isRevoked) toast({ title: "❌ Bu retsept BEKOR QILINGAN", variant: "destructive" });
      else if (isExpired) toast({ title: "⏰ Bu retseptning muddati O'TGAN", variant: "destructive" });
      else { toast({ title: "✅ Retsept HAQIQIY va AMAL QILADI" }); setViewRx(found); }
    } else {
      toast({ title: "Topilmadi", description: "Noto'g'ri kod kiritildi", variant: "destructive" });
    }
    setVerifyCode("");
  };

  const filtered = prescriptions.filter(r => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch = !search || r.patient_name.toLowerCase().includes(search.toLowerCase()) || r.qr_code?.includes(search) || r.diagnosis?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Stats
  const todayStr = new Date().toISOString().split("T")[0];
  const active = prescriptions.filter(r => r.status === "active").length;
  const today = prescriptions.filter(r => r.prescription_date === todayStr).length;
  const expired = prescriptions.filter(r => r.valid_until && r.valid_until < todayStr && r.status === "active").length;
  const completed = prescriptions.filter(r => r.status === "completed").length;

  // Top medicines
  const medCounts: Record<string, number> = {};
  prescriptions.forEach(r => {
    (Array.isArray(r.medications) ? r.medications : []).forEach((m: any) => {
      medCounts[m.name] = (medCounts[m.name] || 0) + 1;
    });
  });
  const topMeds = Object.entries(medCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  // Monthly stats
  const monthlyData: Record<string, number> = {};
  prescriptions.forEach(r => { const m = r.prescription_date?.slice(0, 7) || ""; monthlyData[m] = (monthlyData[m] || 0) + 1; });
  const monthChart = Object.entries(monthlyData).sort().slice(-6).map(([month, count]) => ({ month: month.slice(5), count }));

  // ICD filtered
  const filteredICD = icdSearch ? ICD10_PROTOCOLS.filter(p =>
    p.code.toLowerCase().includes(icdSearch.toLowerCase()) ||
    p.nameUz.toLowerCase().includes(icdSearch.toLowerCase()) ||
    p.name.toLowerCase().includes(icdSearch.toLowerCase())
  ) : [];

  // Drug DB filtered
  const filteredDrugs = drugSearch ? Object.entries(DRUG_DATABASE).filter(([name]) =>
    name.includes(drugSearch.toLowerCase())
  ) : Object.entries(DRUG_DATABASE);

  const printRx = (rx: any) => {
    const rxMeds = Array.isArray(rx.medications) ? rx.medications : [];
    const html = `<html><head><title>Retsept - ${esc(rx.qr_code)}</title><style>body{font-family:Arial;padding:40px;max-width:700px;margin:auto}h1{color:#1a5f7a;border-bottom:2px solid #1a5f7a;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f0f8ff}.code{font-size:20px;font-weight:bold;color:#1a5f7a;background:#f0f8ff;padding:8px 16px;border-radius:8px;display:inline-block}.footer{margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:12px;color:#666}.verify{background:#e8f5e9;padding:12px;border-radius:8px;margin-top:15px;font-size:13px}</style></head><body>
    <h1>🏥 ${esc(clinicName || "Med1.uz")} — Elektron Retsept</h1><p class="code">🔐 ${esc(rx.qr_code)}</p>
    <p><b>Bemor:</b> ${esc(rx.patient_name)}</p><p><b>Shifokor:</b> Dr. ${esc(getDoctorName(rx.doctor_id))}</p><p><b>Tashxis:</b> ${esc(rx.diagnosis || "—")}</p><p><b>Sana:</b> ${esc(rx.prescription_date)}</p><p><b>Amal qilish:</b> ${esc(rx.valid_until || "—")}</p>
    <table><tr><th>Dori nomi</th><th>Dozasi</th><th>Qabul qilish</th><th>Davomiylik</th></tr>
    ${rxMeds.map((m: any) => `<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.dosage)}</td><td>${esc(m.frequency)}</td><td>${esc(m.duration)}</td></tr>`).join("")}
    </table><p><b>Ko'rsatmalar:</b> ${esc(rx.instructions || "—")}</p>
    <div class="verify"><b>✅ Verifikatsiya:</b> Bu retseptning haqiqiyligini tekshirish uchun <b>${esc(rx.qr_code)}</b> kodini Med1.uz platformasida kiriting.</div>
    <div class="footer"><p>Med1.uz — Tibbiy platforma</p><p>⚠️ Bu retsept faqat ko'rsatilgan muddatgacha amal qiladi. O'z-o'zini davolash xavfli!</p></div>
    </body></html>`;
    const w = window.open("", "_blank"); w?.document.write(html); w?.document.close(); w?.print();
  };

  const reportData: HMSReportData = {
    title: "Retseptlar hisoboti", moduleType: "HMS E-Prescription", clinicName,
    kpiCards: [
      { label: "Jami", value: String(prescriptions.length) },
      { label: "Faol", value: String(active) },
      { label: "Bugun", value: String(today) },
      { label: "Bajarilgan", value: String(completed) },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Smart E-Prescription</h2>
        <div className="flex gap-2">
          <HMSDownloadMenu data={reportData} />
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi retsept</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Jami retseptlar", value: prescriptions.length, icon: FileText, color: "text-foreground" },
          { label: "Faol", value: active, icon: CheckCircle2, color: "text-green-600" },
          { label: "Bugun", value: today, icon: Clock, color: "text-blue-600" },
          { label: "Bajarilgan", value: completed, icon: Pill, color: "text-primary" },
          { label: "Muddati o'tgan", value: expired, icon: AlertTriangle, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-lg mb-4">
          <TabsTrigger value="list">Ro'yxat</TabsTrigger>
          <TabsTrigger value="icd">ICD-10</TabsTrigger>
          <TabsTrigger value="drugs">Dori baza</TabsTrigger>
          <TabsTrigger value="verify">Verifikatsiya</TabsTrigger>
          <TabsTrigger value="analytics">Statistika</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {/* Search & Filter */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Bemor, retsept kodi yoki tashxis..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {[{ id: "all", label: "Barchasi" }, { id: "active", label: "Faol" }, { id: "completed", label: "Bajarilgan" }].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Create Form */}
          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">Yangi retsept</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>

              {/* ICD-10 Smart Search */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> ICD-10 bo'yicha tashxis va dori protokolini tanlang:</p>
                <Input placeholder="ICD-10 kod yoki kasallik nomi..." value={icdSearch} onChange={e => setIcdSearch(e.target.value)} className="mb-2" />
                {filteredICD.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {filteredICD.map((p, i) => (
                      <button key={i} onClick={() => applyICD(p)} className="px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
                        <span className="font-bold">{p.code}</span> — {p.nameUz}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
                  <option value="">Shifokor tanlang</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>)}
                </select>
                <div className="flex gap-2">
                  <Input placeholder="ICD-10" value={form.icd_code} onChange={e => setForm({ ...form, icd_code: e.target.value })} className="w-24" />
                  <Input placeholder="Tashxis" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} className="flex-1" />
                </div>
              </div>

              {/* Drug Interaction Warnings */}
              {warnings.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1 mb-2"><AlertTriangle className="w-4 h-4" /> Dorilar o'zaro ta'sir ogohlantirishlari:</p>
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs mb-1">
                      <Badge className={cn("text-[10px]", w.severity === "high" ? "bg-red-200 text-red-900" : "bg-yellow-200 text-yellow-900")}>
                        {w.severity === "high" ? "YUQORI XAVF" : "O'RTA XAVF"}
                      </Badge>
                      <span className="text-red-600 dark:text-red-300">{w.drug1} + {w.drug2}: {w.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <h4 className="font-semibold text-foreground text-sm mb-2">💊 Dorilar</h4>
              {meds.map((m, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                  <Input placeholder="Dori nomi *" value={m.name} onChange={e => updateMed(i, "name", e.target.value)} list="drug-list" />
                  <Input placeholder="Dozasi" value={m.dosage} onChange={e => updateMed(i, "dosage", e.target.value)} />
                  <Input placeholder="Qabul tartibi" value={m.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} />
                  <Input placeholder="Davomiylik" value={m.duration} onChange={e => updateMed(i, "duration", e.target.value)} />
                  {meds.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeMed(i)}><X className="w-4 h-4 text-destructive" /></Button>}
                </div>
              ))}
              <datalist id="drug-list">
                {Object.keys(DRUG_DATABASE).map(d => <option key={d} value={d.charAt(0).toUpperCase() + d.slice(1)} />)}
              </datalist>
              <Button variant="outline" size="sm" className="mb-3" onClick={addMed}><Plus className="w-3 h-3 mr-1" /> Dori qo'shish</Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Ko'rsatmalar" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
                <Input placeholder="Izoh" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleCreate}>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Yaratish va imzolash
                </Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          {/* Detail View */}
          {viewRx && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" /> Retsept: {viewRx.qr_code}
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => printRx(viewRx)}><Printer className="w-4 h-4 mr-1" /> Chop etish</Button>
                  {viewRx.status === "active" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(viewRx.id, "completed")} className="text-green-600"><CheckCircle2 className="w-4 h-4 mr-1" /> Bajarildi</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(viewRx.id, "cancelled")} className="text-red-600"><Ban className="w-4 h-4 mr-1" /> Bekor</Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setViewRx(null)}><X className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                <p><span className="text-muted-foreground">Bemor:</span> <b>{viewRx.patient_name}</b></p>
                <p><span className="text-muted-foreground">Shifokor:</span> Dr. {getDoctorName(viewRx.doctor_id)}</p>
                <p><span className="text-muted-foreground">Tashxis:</span> {viewRx.diagnosis || "—"}</p>
                <p><span className="text-muted-foreground">Sana:</span> {viewRx.prescription_date}</p>
                <p><span className="text-muted-foreground">Amal qilish:</span> {viewRx.valid_until || "—"}</p>
                <p><span className="text-muted-foreground">Status:</span>{" "}
                  <Badge className={cn("text-[10px]", viewRx.status === "active" ? "bg-green-100 text-green-800" : viewRx.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground")}>
                    {viewRx.status === "active" ? "Faol" : viewRx.status === "completed" ? "Bajarilgan" : viewRx.status === "cancelled" ? "Bekor qilingan" : viewRx.status}
                  </Badge>
                </p>
              </div>
              <div className="border border-border rounded-xl overflow-hidden mb-3">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Dori</TableHead>
                      <TableHead className="text-xs">Doza</TableHead>
                      <TableHead className="text-xs">Qabul</TableHead>
                      <TableHead className="text-xs">Davomiylik</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(viewRx.medications) ? viewRx.medications : []).map((m: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-foreground text-sm"><Pill className="w-3 h-3 inline mr-1 text-primary" />{m.name}</TableCell>
                        <TableCell className="text-sm">{m.dosage}</TableCell>
                        <TableCell className="text-sm">{m.frequency}</TableCell>
                        <TableCell className="text-sm">{m.duration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {viewRx.instructions && <p className="text-sm text-foreground mb-1"><b>Ko'rsatmalar:</b> {viewRx.instructions}</p>}
              {viewRx.notes && <p className="text-sm text-muted-foreground"><b>Izoh:</b> {viewRx.notes}</p>}
            </div>
          )}

          {/* List */}
          <div className="space-y-2">
            {filtered.map(r => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setViewRx(r)}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", r.status === "active" ? "bg-green-100 dark:bg-green-900/30" : r.status === "completed" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted")}>
                    <FileText className={cn("w-5 h-5", r.status === "active" ? "text-green-600" : r.status === "completed" ? "text-blue-600" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{r.patient_name} <span className="text-xs text-muted-foreground ml-2">{r.qr_code}</span></p>
                    <p className="text-xs text-muted-foreground">Dr. {getDoctorName(r.doctor_id)} • {r.prescription_date} • {(Array.isArray(r.medications) ? r.medications : []).length} ta dori</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[10px]", r.status === "active" ? "bg-green-100 text-green-800" : r.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground")}>
                    {r.status === "active" ? "Faol" : r.status === "completed" ? "Bajarilgan" : r.status}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); printRx(r); }}><Printer className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Retseptlar yo'q</p>}
          </div>
        </TabsContent>

        {/* ICD-10 Tab */}
        <TabsContent value="icd">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-foreground mb-2">🏥 ICD-10 Protokollar bazasi</h3>
            <p className="text-xs text-muted-foreground mb-3">Tashxis tanlang — tizim avtomatik dori protokolini taklif qiladi</p>
            <Input placeholder="ICD-10 kod yoki kasallik nomi bo'yicha qidirish..." value={icdSearch} onChange={e => setIcdSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(icdSearch ? filteredICD : ICD10_PROTOCOLS).map((p, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary/10 text-primary border-primary/30 font-mono">{p.code}</Badge>
                  <h4 className="font-bold text-foreground text-sm">{p.nameUz}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{p.name}</p>
                <div className="space-y-1.5 mb-3">
                  {p.meds.map((m, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg p-2">
                      <Pill className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium text-foreground">{m.name}</span>
                      <span className="text-muted-foreground">• {m.dosage} • {m.frequency} • {m.duration}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" onClick={() => { applyICD(p); setShowForm(true); }}>
                  <Sparkles className="w-3 h-3 mr-1" /> Retsept yaratish
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Drug Database Tab */}
        <TabsContent value="drugs">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-foreground mb-2">💊 Dorilar ma'lumotlar bazasi</h3>
            <p className="text-xs text-muted-foreground mb-3">{Object.keys(DRUG_DATABASE).length} ta dori — kontraindikatsiya, yon ta'sir va dori o'zaro ta'sir ma'lumotlari</p>
            <Input placeholder="Dori nomi bo'yicha qidirish..." value={drugSearch} onChange={e => setDrugSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDrugs.map(([name, info]) => (
              <div key={name} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-5 h-5 text-primary" />
                  <h4 className="font-bold text-foreground capitalize">{name}</h4>
                </div>
                <Badge variant="outline" className="text-[10px] mb-3">{info.group}</Badge>
                <div className="space-y-2 text-xs">
                  <div><span className="font-semibold text-foreground">Shakllari:</span> <span className="text-muted-foreground">{info.forms.join(", ")}</span></div>
                  <div>
                    <span className="font-semibold text-red-600">Kontraindikatsiya:</span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {info.contraindications.map((c, i) => <Badge key={i} className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-[10px]">{c}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-600">Yon ta'sirlar:</span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {info.sideEffects.map((s, i) => <Badge key={i} className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  {DRUG_INTERACTIONS[name] && (
                    <div>
                      <span className="font-semibold text-destructive">O'zaro ta'sir:</span>
                      <div className="mt-1 space-y-1">
                        {DRUG_INTERACTIONS[name].map((inter, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Badge className={cn("text-[9px]", inter.severity === "high" ? "bg-red-200 text-red-900" : "bg-yellow-200 text-yellow-900")}>
                              {inter.severity === "high" ? "XAVFLI" : "EHTIYOT"}
                            </Badge>
                            <span className="text-muted-foreground">{inter.drug}: {inter.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verify">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">Retsept verifikatsiyasi</h3>
              <p className="text-sm text-muted-foreground mb-6">Retseptning haqiqiyligini tekshiring</p>
              <div className="flex gap-2 mb-4">
                <Input placeholder="RX-XXXXXXX kodini kiriting" value={verifyCode} onChange={e => setVerifyCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && verifyPrescription()} className="text-center font-mono" />
                <Button onClick={verifyPrescription}><Search className="w-4 h-4 mr-1" /> Tekshirish</Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Retsept chekidan QR kodni skanerlang yoki kodni qo'lda kiriting</p>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {topMeds.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Eng ko'p yozilgan dorilar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={topMeds} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    {topMeds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Oylik retseptlar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthChart}><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {/* ICD Stats */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Tashxis bo'yicha statistika</h3>
            <div className="space-y-2">
              {(() => {
                const diagCounts: Record<string, number> = {};
                prescriptions.forEach(r => {
                  if (r.diagnosis) {
                    const match = r.diagnosis.match(/\[([A-Z]\d+\.?\d*)\]/);
                    const key = match ? match[1] : r.diagnosis.slice(0, 30);
                    diagCounts[key] = (diagCounts[key] || 0) + 1;
                  }
                });
                return Object.entries(diagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([diag, count]) => (
                  <div key={diag} className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                    <span className="text-foreground font-medium">{diag}</span>
                    <Badge variant="outline" className="text-[10px]">{count}</Badge>
                  </div>
                ));
              })()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSPrescription;
