import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, FlaskConical, Clock, CheckCircle2, X, AlertTriangle,
  Search, TrendingUp, BarChart3, Zap, Send, FileText, Download,
  ArrowLeft, Eye, Printer, ChevronRight, UserPlus, Activity,
  Phone, Mail, MessageCircle, Stethoscope, QrCode, ShieldCheck, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";
import { downloadLabReportPDF } from "@/utils/downloadLabReport";
import { writeAuditLog } from "@/utils/auditLog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from "recharts";

interface Props { clinicId: string; }

const CATEGORIES = [
  { value: "blood", label: "Qon tahlili" },
  { value: "urine", label: "Siydik tahlili" },
  { value: "biochemistry", label: "Biokimyoviy" },
  { value: "hormones", label: "Gormonlar" },
  { value: "immunology", label: "Immunologiya" },
  { value: "microbiology", label: "Mikrobiologiya" },
  { value: "coagulation", label: "Koagulyatsiya" },
  { value: "other", label: "Boshqa" },
];

const LAB_TEMPLATES: Record<string, Array<{ name: string; unit: string; ref: string }>> = {
  blood: [
    { name: "Gemoglobin (Hb)", unit: "g/L", ref: "120-160" },
    { name: "Eritrotsitlar (RBC)", unit: "×10¹²/L", ref: "3.8-5.5" },
    { name: "Leykotsitlar (WBC)", unit: "×10⁹/L", ref: "4.0-9.0" },
    { name: "Trombotsitlar (PLT)", unit: "×10⁹/L", ref: "150-400" },
    { name: "ESR", unit: "mm/soat", ref: "2-15" },
    { name: "Gematokrit (Hct)", unit: "%", ref: "36-48" },
    { name: "MCV", unit: "fL", ref: "80-100" },
    { name: "MCH", unit: "pg", ref: "27-33" },
    { name: "MCHC", unit: "g/dL", ref: "32-36" },
    { name: "Neytrofillar", unit: "%", ref: "45-70" },
    { name: "Limfotsitlar", unit: "%", ref: "20-40" },
    { name: "Monotsitlar", unit: "%", ref: "2-8" },
    { name: "Eozinofillar", unit: "%", ref: "1-5" },
    { name: "Bazofillar", unit: "%", ref: "0-1" },
  ],
  biochemistry: [
    { name: "Glyukoza", unit: "mmol/L", ref: "3.3-5.5" },
    { name: "ALT", unit: "U/L", ref: "7-56" },
    { name: "AST", unit: "U/L", ref: "10-40" },
    { name: "Umumiy bilrubin", unit: "µmol/L", ref: "3.4-20.5" },
    { name: "To'g'ri bilrubin", unit: "µmol/L", ref: "0-5.1" },
    { name: "Kreatinin", unit: "µmol/L", ref: "44-106" },
    { name: "Mochevina", unit: "mmol/L", ref: "2.5-8.3" },
    { name: "Umumiy oqsil", unit: "g/L", ref: "66-83" },
    { name: "Albumin", unit: "g/L", ref: "35-52" },
    { name: "Xolesterin", unit: "mmol/L", ref: "3.6-5.2" },
    { name: "Triglitseridlar", unit: "mmol/L", ref: "0.5-1.7" },
    { name: "HDL", unit: "mmol/L", ref: "1.0-1.9" },
    { name: "LDL", unit: "mmol/L", ref: "0-3.4" },
    { name: "Siydik kislotasi", unit: "µmol/L", ref: "150-420" },
    { name: "GGT", unit: "U/L", ref: "9-48" },
    { name: "Ishqoriy fosfataza", unit: "U/L", ref: "44-147" },
    { name: "LDH", unit: "U/L", ref: "140-280" },
    { name: "Temir", unit: "µmol/L", ref: "9-30" },
    { name: "Ferritin", unit: "ng/mL", ref: "12-300" },
    { name: "CRP", unit: "mg/L", ref: "0-5" },
  ],
  hormones: [
    { name: "TSH", unit: "mIU/L", ref: "0.4-4.0" },
    { name: "T3 (erkin)", unit: "pmol/L", ref: "3.1-6.8" },
    { name: "T4 (erkin)", unit: "pmol/L", ref: "12-22" },
    { name: "Insulin", unit: "µIU/mL", ref: "2.6-24.9" },
    { name: "Kortizol", unit: "nmol/L", ref: "171-536" },
    { name: "Prolaktin", unit: "mIU/L", ref: "86-324" },
    { name: "Testosteron", unit: "nmol/L", ref: "8.6-29" },
    { name: "Estradiol", unit: "pmol/L", ref: "73-206" },
    { name: "Progesteron", unit: "nmol/L", ref: "0.6-4.7" },
    { name: "HbA1c", unit: "%", ref: "4.0-5.6" },
    { name: "Vitamin D (25-OH)", unit: "ng/mL", ref: "30-100" },
    { name: "Vitamin B12", unit: "pg/mL", ref: "200-900" },
  ],
  urine: [
    { name: "Rang", unit: "", ref: "Sariq" },
    { name: "Tiniqlik", unit: "", ref: "Tiniq" },
    { name: "pH", unit: "", ref: "5.0-7.0" },
    { name: "Zichlik", unit: "", ref: "1.010-1.025" },
    { name: "Oqsil", unit: "g/L", ref: "0-0.033" },
    { name: "Glyukoza", unit: "mmol/L", ref: "0" },
    { name: "Ketonlar", unit: "", ref: "Salbiy" },
    { name: "Bilrubin", unit: "", ref: "Salbiy" },
    { name: "Urobilinogen", unit: "", ref: "Normal" },
    { name: "Leykotsitlar", unit: "ko'rish maydonida", ref: "0-5" },
    { name: "Eritrotsitlar", unit: "ko'rish maydonida", ref: "0-2" },
    { name: "Epiteliy hujayralari", unit: "ko'rish maydonida", ref: "0-5" },
  ],
  immunology: [
    { name: "IgA", unit: "g/L", ref: "0.7-4.0" },
    { name: "IgG", unit: "g/L", ref: "7.0-16.0" },
    { name: "IgM", unit: "g/L", ref: "0.4-2.3" },
    { name: "IgE (umumiy)", unit: "IU/mL", ref: "0-100" },
    { name: "ANA", unit: "", ref: "Salbiy" },
    { name: "RF (Revmatoid faktor)", unit: "IU/mL", ref: "0-14" },
    { name: "Anti-CCP", unit: "U/mL", ref: "0-17" },
    { name: "Komplement C3", unit: "g/L", ref: "0.9-1.8" },
    { name: "Komplement C4", unit: "g/L", ref: "0.1-0.4" },
  ],
  coagulation: [
    { name: "PT (Protrombin vaqti)", unit: "sek", ref: "11-13.5" },
    { name: "INR", unit: "", ref: "0.8-1.1" },
    { name: "APTT", unit: "sek", ref: "25-35" },
    { name: "Fibrinogen", unit: "g/L", ref: "2.0-4.0" },
    { name: "D-dimer", unit: "ng/mL", ref: "0-500" },
    { name: "Qon ketish vaqti", unit: "min", ref: "1-4" },
  ],
  microbiology: [
    { name: "Ekilma natijasi", unit: "", ref: "Salbiy" },
    { name: "Koloniya soni", unit: "CFU/mL", ref: "<10000" },
    { name: "Antibiotikga sezgirlik", unit: "", ref: "—" },
    { name: "Mikroskopiya", unit: "", ref: "—" },
  ],
};

const PIE_COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const SPECIALIST_RECOMMENDATIONS: Record<string, { specialist: string; reason: string }[]> = {
  blood: [{ specialist: "Gematolog", reason: "Qon ko'rsatkichlari normadan tashqari" }],
  biochemistry: [{ specialist: "Terapevt", reason: "Bioximik ko'rsatkichlarni baholash" }, { specialist: "Endokrinolog", reason: "Glyukoza yoki gormon bilan bog'liq" }],
  hormones: [{ specialist: "Endokrinolog", reason: "Gormon balansini tekshirish" }],
  urine: [{ specialist: "Urolog / Nefrolog", reason: "Siydik tahlili natijalarini baholash" }],
  immunology: [{ specialist: "Immunolog / Revmatolog", reason: "Immunologik ko'rsatkichlar" }],
  coagulation: [{ specialist: "Gematolog", reason: "Qon ivish tizimi" }],
  microbiology: [{ specialist: "Infektsionist", reason: "Infektsiya aniqlash va davolash" }],
};

const HMSLaboratory = ({ clinicId }: Props) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [results, setResults] = useState<Record<string, any[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [showQuickPatient, setShowQuickPatient] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [showSendModal, setShowSendModal] = useState<any>(null);
  const [sendChannels, setSendChannels] = useState<string[]>(["telegram"]);
  const [verificationData, setVerificationData] = useState<Record<string, any>>({});

  const [form, setForm] = useState({ patient_id: "", test_name: "", test_category: "blood", priority: "normal", notes: "" });
  const [resultForm, setResultForm] = useState({ parameter_name: "", value: "", unit: "", reference_range: "", is_abnormal: false });
  const [quickPatient, setQuickPatient] = useState({ full_name: "", phone: "", date_of_birth: "", national_id: "" });

  const PATIENT_FIELDS = "id, full_name, phone, user_id, date_of_birth, gender, allergies, blood_group, national_id, address, passport_id, emergency_contact, chronic_diseases, email, insurance_number";

  const fetchData = async () => {
    const [ordersRes, patientsRes] = await Promise.all([
      supabase.from("hms_lab_orders").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_patients").select(PATIENT_FIELDS).eq("clinic_id", clinicId).neq("is_active", false),
    ]);
    const fetchedOrders = ordersRes.data || [];
    let fetchedPatients = patientsRes.data || [];
    setOrders(fetchedOrders);

    // Always check for missing patients referenced by orders
    if (fetchedOrders.length > 0) {
      const orderPatientIds = [...new Set(fetchedOrders.map((o: any) => o.patient_id).filter(Boolean))];
      const loadedIds = new Set(fetchedPatients.map(p => p.id));
      const missingIds = orderPatientIds.filter(id => !loadedIds.has(id));
      if (missingIds.length > 0) {
        const { data: extraPatients } = await supabase
          .from("hms_patients")
          .select(PATIENT_FIELDS)
          .in("id", missingIds as string[]);
        if (extraPatients?.length) {
          fetchedPatients = [...fetchedPatients, ...extraPatients];
        }
      }
    }
    setPatients(fetchedPatients);

    if (fetchedOrders.length > 0) {
      const ids = fetchedOrders.map((o: any) => o.id);
      const [resultsRes, verRes] = await Promise.all([
        supabase.from("hms_lab_results").select("*").in("order_id", ids),
        supabase.from("document_verifications").select("*").in("document_id", ids).eq("document_type", "lab_result"),
      ]);
      const grouped: Record<string, any[]> = {};
      (resultsRes.data || []).forEach((r: any) => {
        if (!grouped[r.order_id]) grouped[r.order_id] = [];
        grouped[r.order_id].push(r);
      });
      setResults(grouped);
      const verMap: Record<string, any> = {};
      (verRes.data || []).forEach((v: any) => { verMap[v.document_id] = v; });
      setVerificationData(verMap);
    }
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  // Auto-open template when selecting an order with no results
  // Also fetch patient if not found in local state
  useEffect(() => {
    if (selectedOrder) {
      if (!results[selectedOrder.id]?.length && selectedOrder.status !== "completed") {
        setUseTemplate(true);
        setTemplateValues({});
      }
      // Fetch patient if missing from local state
      const patientExists = patients.find(p => p.id === selectedOrder.patient_id);
      if (!patientExists && selectedOrder.patient_id) {
        supabase.from("hms_patients")
          .select("id, full_name, phone, user_id, date_of_birth, gender, allergies, blood_group, national_id, address, passport_id, emergency_contact, chronic_diseases, email, insurance_number")
          .eq("id", selectedOrder.patient_id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setPatients(prev => [...prev, data]);
          });
      }
    }
  }, [selectedOrder?.id]);

  // Quick Patient Create
  const handleQuickPatient = async () => {
    if (!quickPatient.full_name || !quickPatient.phone) {
      toast({ title: "Ism va telefon majburiy!", variant: "destructive" }); return;
    }
    const payload: any = {
      clinic_id: clinicId, full_name: quickPatient.full_name, phone: quickPatient.phone,
      date_of_birth: quickPatient.date_of_birth || null,
    };
    // Only set national_id if actually provided (to avoid unique constraint on empty strings)
    if (quickPatient.national_id?.trim()) payload.national_id = quickPatient.national_id.trim();
    const { data, error } = await supabase.from("hms_patients").insert(payload).select("id, full_name, phone").single();
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Bemor yaratildi" });
    setForm({ ...form, patient_id: data.id });
    setQuickPatient({ full_name: "", phone: "", date_of_birth: "", national_id: "" });
    setShowQuickPatient(false);
    fetchData();
  };

  const handleCreateOrder = async () => {
    if (!form.patient_id || !form.test_name) {
      toast({ title: "Bemor va tahlil nomi majburiy!", variant: "destructive" }); return;
    }
    const { data } = await supabase.from("hms_lab_orders").insert({ ...form, clinic_id: clinicId }).select("id").single();
    await writeAuditLog({ action: "create", entity_type: "lab_order", entity_id: data?.id, module: "laboratory", details: { test_name: form.test_name, patient_id: form.patient_id } });
    toast({ title: "✅ Tahlil buyurtmasi yaratildi" });
    setShowForm(false);
    setForm({ patient_id: "", test_name: "", test_category: "blood", priority: "normal", notes: "" });
    fetchData();
  };

  const handleAddResult = async (orderId: string) => {
    if (!resultForm.parameter_name || !resultForm.value) {
      toast({ title: "Parametr va qiymat majburiy!", variant: "destructive" }); return;
    }
    await supabase.from("hms_lab_results").insert({ ...resultForm, order_id: orderId });
    toast({ title: "✅ Natija qo'shildi" });
    setResultForm({ parameter_name: "", value: "", unit: "", reference_range: "", is_abnormal: false });
    fetchData();
  };

  const handleAddTemplateResults = async (orderId: string, category: string) => {
    const template = LAB_TEMPLATES[category];
    if (!template) return;
    const filledCount = template.filter(t => templateValues[t.name]?.trim()).length;
    if (filledCount === 0) { toast({ title: "Kamida 1 ta qiymat kiriting!", variant: "destructive" }); return; }
    // Save ALL template fields - filled ones with values, unfilled with "—"
    const rows = template.map(t => {
      const rawVal = templateValues[t.name]?.trim() || "";
      const val = parseFloat(rawVal);
      const ref = t.ref;
      let isAbnormal = false;
      if (rawVal && !isNaN(val) && ref.includes("-")) {
        const [min, max] = ref.split("-").map(Number);
        if (!isNaN(min) && !isNaN(max)) isAbnormal = val < min || val > max;
      }
      return {
        order_id: orderId, parameter_name: t.name, value: rawVal || "—",
        unit: t.unit, reference_range: t.ref, is_abnormal: isAbnormal,
      };
    });
    await supabase.from("hms_lab_results").insert(rows);
    const abnormalCount = rows.filter(r => r.is_abnormal).length;
    toast({ title: `✅ ${rows.length} ta natija qo'shildi (${filledCount} to'ldirilgan)`, description: abnormalCount > 0 ? `⚠️ ${abnormalCount} ta normadan tashqari` : undefined });
    setTemplateValues({});
    setUseTemplate(false);
    fetchData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("hms_lab_orders").update({
      status, completed_at: status === "completed" ? new Date().toISOString() : null
    }).eq("id", id);
    const order = orders.find(o => o.id === id);
    // Create QR verification record + auto-invoice when completed
    if (status === "completed") {
      const patient = patients.find(p => p.id === order?.patient_id);
      await supabase.from("document_verifications").insert({
        document_id: id,
        document_type: "lab_result",
        clinic_id: clinicId,
        patient_name: patient?.full_name || "",
        metadata: { test_name: order?.test_name, test_category: order?.test_category },
      } as any);

      // Auto-create invoice for this lab order
      if (order?.patient_id) {
        const invoiceNumber = `LAB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
        const categoryLabel = CATEGORIES.find(c => c.value === order.test_category)?.label || order.test_category;
        await supabase.from("hms_invoices").insert({
          clinic_id: clinicId,
          patient_id: order.patient_id,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split("T")[0],
          items: JSON.stringify([{ name: `${order.test_name} (${categoryLabel})`, qty: 1, price: 0 }]),
          total_amount: 0,
          status: "pending",
          notes: `Laboratoriya tahlili: ${order.test_name}`,
        });
        // Also record in hms_finance
        await supabase.from("hms_finance").insert({
          clinic_id: clinicId,
          transaction_type: "income",
          category: "service",
          amount: 0,
          description: `Lab: ${order.test_name} — ${patient?.full_name || ""}`,
          reference_id: id,
          payment_method: "pending",
          transaction_date: new Date().toISOString().split("T")[0],
        });
      }
    }
    await writeAuditLog({ action: "status_change", entity_type: "lab_order", entity_id: id, module: "laboratory", details: { status, test_name: order?.test_name } });
    toast({ title: `Status: ${status}` });
    fetchData();
  };

  const handleSendNotification = async (order: any, channels: string[] = ["telegram"]) => {
    setSending(order.id);
    try {
      const patient = patients.find(p => p.id === order.patient_id);
      if (!patient) {
        toast({ title: "Bemor topilmadi", variant: "destructive" }); setSending(null); return;
      }

      // If patient has user_id, use profile-based notify
      if (patient.user_id) {
        const { error } = await supabase.functions.invoke("lab-result-notify", {
          body: { lab_result_id: order.id, patient_id: patient.user_id, channels },
        });
        if (error) throw error;
      } else {
        // Fallback: use phone to find telegram chat_id from telegram_otp table
        if (channels.includes("telegram") && patient.phone) {
          const { data: otpRecord } = await supabase
            .from("telegram_otp")
            .select("chat_id")
            .eq("phone", patient.phone)
            .maybeSingle();

          if (otpRecord?.chat_id) {
            const orderResults = results[order.id] || [];
            const abnormalCount = orderResults.filter((r: any) => r.is_abnormal).length;
            const message = `🧾 <b>ANALIZ NATIJASI TAYYOR</b>\n\n` +
              `👤 <b>Bemor:</b> ${patient.full_name}\n` +
              `🧪 <b>Tahlil:</b> ${order.test_name}\n` +
              `📅 <b>Sana:</b> ${new Date().toISOString().slice(0, 10)}\n` +
              `📊 <b>Natijalar:</b> ${orderResults.length} parametr\n` +
              (abnormalCount > 0 ? `⚠️ <b>Normadan tashqari:</b> ${abnormalCount} ta\n` : `✅ <b>Barcha ko'rsatkichlar normal</b>\n`) +
              `\n🔗 <b>Natijani ko'rish:</b> https://med1-uz.lovable.app/dashboard\n\n` +
              `⚠️ <i>Bu xabar avtomatik yuborilgan.</i>`;

            await supabase.functions.invoke("telegram-notify", {
              body: {
                type: "lab_result_direct",
                data: { chat_id: otpRecord.chat_id, message },
              },
            });
          } else {
            toast({ title: "⚠️ Telegram chat_id topilmadi", description: "Bemor Telegram botga ulanmagan. Telefon: " + patient.phone, variant: "destructive" });
            setSending(null);
            return;
          }
        }
        // SMS / email can be added here
      }
      toast({ title: "✅ Bildirishnoma yuborildi!", description: `Kanallar: ${channels.join(", ")}` });
      setShowSendModal(null);
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    }
    setSending(null);
  };

  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.full_name || "—";

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    inProgress: orders.filter(o => o.status === "in_progress").length,
    completed: orders.filter(o => o.status === "completed").length,
    urgent: orders.filter(o => o.priority === "urgent" || o.priority === "critical").length,
    abnormalResults: Object.values(results).flat().filter((r: any) => r.is_abnormal).length,
  }), [orders, results]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.test_category] = (map[o.test_category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({
      name: CATEGORIES.find(c => c.value === name)?.label || name, value
    }));
  }, [orders]);

  // Monthly trend
  const monthlyData = useMemo(() => {
    const map: Record<string, { total: number; abnormal: number }> = {};
    orders.forEach(o => {
      const m = o.ordered_at?.slice(0, 7) || "";
      if (!map[m]) map[m] = { total: 0, abnormal: 0 };
      map[m].total++;
      const r = results[o.id] || [];
      map[m].abnormal += r.filter((x: any) => x.is_abnormal).length;
    });
    return Object.entries(map).sort().slice(-6).map(([month, d]) => ({ month: month.slice(5), ...d }));
  }, [orders, results]);

  const filteredOrders = useMemo(() => orders.filter(o => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchCategory = filterCategory === "all" || o.test_category === filterCategory;
    const matchSearch = !search || o.test_name.toLowerCase().includes(search.toLowerCase()) ||
      getPatientName(o.patient_id).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchCategory && matchSearch;
  }), [orders, filterStatus, filterCategory, search, patients]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  const reportData: HMSReportData = {
    title: "Laboratoriya hisoboti", moduleType: "HMS Laboratoriya",
    kpiCards: [
      { label: "Jami buyurtmalar", value: String(stats.total) },
      { label: "Kutilmoqda", value: String(stats.pending) },
      { label: "Jarayonda", value: String(stats.inProgress) },
      { label: "Tayyor", value: String(stats.completed) },
      { label: "Normadan tashqari", value: String(stats.abnormalResults) },
    ],
    tables: orders.length > 0 ? [{
      title: "Tahlil buyurtmalari",
      table: {
        headers: ["Bemor", "Tahlil", "Kategoriya", "Status", "Sana"],
        rows: orders.slice(0, 50).map(o => [
          getPatientName(o.patient_id), o.test_name, o.test_category, o.status,
          new Date(o.ordered_at).toLocaleDateString("uz")
        ])
      }
    }] : undefined,
  };

  // ─── DETAIL VIEW ───
  if (selectedOrder) {
    const order = selectedOrder;
    const orderResults = results[order.id] || [];
    const patient = patients.find(p => p.id === order.patient_id);
    const abnormalCount = orderResults.filter((r: any) => r.is_abnormal).length;
    const template = LAB_TEMPLATES[order.test_category];
    const autoTemplate = template && orderResults.length === 0 && order.status !== "completed";
    const verification = verificationData[order.id];
    const specialists = SPECIALIST_RECOMMENDATIONS[order.test_category] || [];

    const handleDownloadPDF = () => {
      downloadLabReportPDF({
        testName: order.test_name,
        testCategory: CATEGORIES.find(c => c.value === order.test_category)?.label || order.test_category,
        patientName: patient?.full_name || "Noma'lum",
        patientPhone: patient?.phone || undefined,
        patientDob: patient?.date_of_birth || undefined,
        patientGender: patient?.gender || undefined,
        patientBloodGroup: patient?.blood_group || undefined,
        patientAllergies: patient?.allergies || undefined,
        orderedAt: order.ordered_at,
        completedAt: order.completed_at,
        results: orderResults,
        verificationCode: verification?.verification_code,
      });
    };

    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
        </Button>

        {/* Send Notification Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSendModal(null)}>
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">📤 Natijani yuborish</h3>
              <p className="text-xs text-muted-foreground mb-4">Bemor: <strong>{patient?.full_name}</strong></p>
              
              <div className="space-y-3 mb-4">
                {[
                  { key: "telegram", icon: MessageCircle, label: "Telegram", desc: "Telefon raqam orqali chat_id aniqlanadi", color: "text-blue-500" },
                  { key: "sms", icon: Phone, label: "SMS", desc: patient?.phone || "Telefon kiritilmagan", color: "text-green-500" },
                  { key: "email", icon: Mail, label: "Email", desc: "Email orqali yuborish", color: "text-orange-500" },
                ].map(ch => (
                  <label key={ch.key} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                    sendChannels.includes(ch.key) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  )}>
                    <input
                      type="checkbox"
                      checked={sendChannels.includes(ch.key)}
                      onChange={(e) => {
                        if (e.target.checked) setSendChannels([...sendChannels, ch.key]);
                        else setSendChannels(sendChannels.filter(c => c !== ch.key));
                      }}
                      className="rounded"
                    />
                    <ch.icon className={cn("w-5 h-5", ch.color)} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{ch.label}</p>
                      <p className="text-[10px] text-muted-foreground">{ch.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={sendChannels.length === 0 || sending === showSendModal.id}
                  onClick={() => handleSendNotification(showSendModal, sendChannels)}
                >
                  <Send className="w-4 h-4 mr-1" />
                  {sending === showSendModal.id ? "Yuborilmoqda..." : "Yuborish"}
                </Button>
                <Button variant="outline" onClick={() => setShowSendModal(null)}>Bekor</Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" /> {order.test_name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {CATEGORIES.find(c => c.value === order.test_category)?.label} • {new Date(order.ordered_at).toLocaleDateString("uz")}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={cn("text-xs", statusColors[order.status] || "bg-muted text-muted-foreground")}>
                {order.status === "pending" ? "Kutilmoqda" : order.status === "in_progress" ? "Jarayonda" : "Tayyor"}
              </Badge>
              {order.priority !== "normal" && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
                  {order.priority === "urgent" ? "Shoshilinch" : "Juda shoshilinch"}
                </Badge>
              )}
            </div>
          </div>

          {/* Patient Info - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <User className="w-3 h-3" /> BEMOR MA'LUMOTI
              </h4>
              {patient ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{patient.full_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</p>
                  {patient.date_of_birth && (
                    <p className="text-xs text-muted-foreground">
                      🎂 {patient.date_of_birth} ({Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000)} yosh)
                    </p>
                  )}
                  {patient.gender && <p className="text-xs text-muted-foreground">👤 {patient.gender === "male" ? "Erkak" : patient.gender === "female" ? "Ayol" : patient.gender}</p>}
                  {patient.blood_group && <p className="text-xs text-muted-foreground">🩸 Qon guruhi: {patient.blood_group}</p>}
                  {patient.national_id && <p className="text-xs text-muted-foreground">🆔 ID: {patient.national_id}</p>}
                  {patient.address && <p className="text-xs text-muted-foreground">📍 {patient.address}</p>}
                  {patient.email && <p className="text-xs text-muted-foreground">✉️ {patient.email}</p>}
                  {patient.allergies && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] mt-1">
                      <AlertTriangle className="w-3 h-3 mr-0.5" /> Allergiya: {patient.allergies}
                    </Badge>
                  )}
                  {patient.chronic_diseases && (
                    <p className="text-xs text-muted-foreground mt-1">⚕️ Surunkali: {patient.chronic_diseases}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Bemor ma'lumotlari topilmadi (ID: {order.patient_id?.slice(0, 8)}...)</p>
              )}
            </div>
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">TAHLIL TAFSILOTI</h4>
              <p className="text-xs text-muted-foreground">Buyurtma: {new Date(order.ordered_at).toLocaleString("uz")}</p>
              {order.completed_at && <p className="text-xs text-muted-foreground">Tayyor: {new Date(order.completed_at).toLocaleString("uz")}</p>}
              {order.notes && <p className="text-xs text-muted-foreground mt-1">Izoh: {order.notes}</p>}
              <p className="text-xs text-muted-foreground mt-1">Natijalar: {orderResults.length} parametr</p>
              {abnormalCount > 0 && <p className="text-xs text-destructive font-medium mt-1">⚠️ {abnormalCount} ta normadan tashqari</p>}
            </div>
          </div>

          {/* Results Table */}
          {orderResults.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">Natijalar ({orderResults.length})</h4>
                {abnormalCount > 0 && (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {abnormalCount} normadan tashqari
                  </Badge>
                )}
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold">Parametr</TableHead>
                      <TableHead className="text-xs font-semibold">Qiymat</TableHead>
                      <TableHead className="text-xs font-semibold">Birlik</TableHead>
                      <TableHead className="text-xs font-semibold">Norma</TableHead>
                      <TableHead className="text-xs font-semibold">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderResults.map((r: any) => (
                      <TableRow key={r.id} className={r.is_abnormal ? "bg-red-50/50 dark:bg-red-900/10" : r.value === "—" ? "opacity-50" : ""}>
                        <TableCell className="text-xs font-medium py-2">{r.parameter_name}</TableCell>
                        <TableCell className={cn("text-xs py-2 font-bold", r.is_abnormal ? "text-destructive" : r.value === "—" ? "text-muted-foreground italic" : "text-foreground")}>{r.value}</TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{r.unit}</TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{r.reference_range}</TableCell>
                        <TableCell className="text-xs py-2">
                          {r.value === "—" ? (
                            <Badge className="bg-muted text-muted-foreground text-[10px]">Kiritilmagan</Badge>
                          ) : r.is_abnormal ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-0.5" /> Normadan tashqari
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Normal
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Specialist Recommendation */}
          {order.status === "completed" && abnormalCount > 0 && specialists.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4" /> Mutaxassisga murojaat tavsiya etiladi
              </h4>
              <div className="space-y-1.5">
                {specialists.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 text-[10px]">{s.specialist}</Badge>
                    <span className="text-amber-700 dark:text-amber-300">{s.reason}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 italic">
                ⚠️ Bu tavsiya avtomatik tizim tomonidan berilgan. Aniq tashxis uchun shifokor bilan maslahatlashing.
              </p>
            </div>
          )}

          {/* DMED-style Verification Block */}
          {order.status === "completed" && verification && (
            <div className="bg-muted/30 border border-border rounded-xl p-4 mb-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span className="font-heading font-bold text-foreground text-sm">MED1.UZ</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                    Hujjat Med1.uz yagona tibbiy axborot tizimida yaratilgan. Hujjatning haqqoniyligini{" "}
                    <a href={`https://med1-uz.lovable.app/verify/${verification.verification_code}`} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                      https://med1-uz.lovable.app/verify
                    </a>{" "}
                    saytida hujjatning ID kodini kiritish, yoki QR-kod orqali tekshirish mumkin.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    <strong>Hujjat ID:</strong> {verification.verification_code}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    <strong>Yaratish sanasi:</strong> {new Date(verification.created_at).toLocaleString("uz")}
                  </p>
                </div>
                <div className="shrink-0 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{verification.scanned_count || 0}</div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://med1-uz.lovable.app/verify/${verification.verification_code}`)}`}
                    alt="QR Verification"
                    className="w-20 h-20 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {order.status === "completed" && (
              <>
                <Button size="sm" variant="outline" onClick={() => { setShowSendModal(order); setSendChannels(["telegram"]); }}>
                  <Send className="w-3.5 h-3.5 mr-1" /> Natijani yuborish
                </Button>
                {orderResults.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF yuklab olish
                  </Button>
                )}
              </>
            )}
            {order.status === "pending" && (
              <Button size="sm" onClick={() => { updateOrderStatus(order.id, "in_progress"); setSelectedOrder({ ...order, status: "in_progress" }); }}>
                <Clock className="w-3.5 h-3.5 mr-1" /> Boshlash
              </Button>
            )}
            {order.status === "in_progress" && (
              <Button size="sm" onClick={() => { updateOrderStatus(order.id, "completed"); setSelectedOrder({ ...order, status: "completed" }); }}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Tayyor
              </Button>
            )}
          </div>
        </div>

        {/* Add results */}
        {order.status !== "completed" && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-foreground">Natija kiritish</h4>
              {template && (
                <Button size="sm" variant={useTemplate || autoTemplate ? "default" : "outline"} onClick={() => setUseTemplate(!useTemplate)}>
                  <FileText className="w-3.5 h-3.5 mr-1" /> {useTemplate || autoTemplate ? "Yopish" : "Shablondan"}
                </Button>
              )}
            </div>

            {(useTemplate || autoTemplate) && template ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {template.map(t => {
                    const val = parseFloat(templateValues[t.name] || "");
                    let flag = "";
                    if (!isNaN(val) && t.ref.includes("-")) {
                      const [min, max] = t.ref.split("-").map(Number);
                      if (!isNaN(min) && !isNaN(max)) {
                        if (val < min) flag = "low";
                        else if (val > max) flag = "high";
                      }
                    }
                    return (
                      <div key={t.name} className={cn("flex items-center gap-2 rounded-lg p-2", flag === "low" ? "bg-blue-50 dark:bg-blue-900/10" : flag === "high" ? "bg-red-50 dark:bg-red-900/10" : "bg-muted/30")}>
                        <span className="text-xs font-medium text-foreground min-w-[140px]">{t.name}</span>
                        <Input
                          placeholder={`${t.ref}`}
                          value={templateValues[t.name] || ""}
                          onChange={e => setTemplateValues({ ...templateValues, [t.name]: e.target.value })}
                          className="text-xs h-8 flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground min-w-[50px]">{t.unit}</span>
                        {flag && (
                          <Badge className={cn("text-[9px]", flag === "high" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")}>
                            {flag === "high" ? "↑" : "↓"}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button size="sm" onClick={() => handleAddTemplateResults(order.id, order.test_category)}>
                  Barchasini saqlash
                </Button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Input placeholder="Parametr *" value={resultForm.parameter_name} onChange={(e) => setResultForm({ ...resultForm, parameter_name: e.target.value })} className="text-xs" />
                  <Input placeholder="Qiymat *" value={resultForm.value} onChange={(e) => setResultForm({ ...resultForm, value: e.target.value })} className="text-xs" />
                  <Input placeholder="Birlik" value={resultForm.unit} onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })} className="text-xs" />
                  <Input placeholder="Norma" value={resultForm.reference_range} onChange={(e) => setResultForm({ ...resultForm, reference_range: e.target.value })} className="text-xs" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={resultForm.is_abnormal} onChange={(e) => setResultForm({ ...resultForm, is_abnormal: e.target.checked })} />
                    Normadan tashqari
                  </label>
                </div>
                <Button size="sm" className="mt-2" onClick={() => handleAddResult(order.id)}>Qo'shish</Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Send Notification Modal (global) */}
      {showSendModal && !selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSendModal(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">📤 Natijani yuborish</h3>
            <p className="text-xs text-muted-foreground mb-4">Bemor: <strong>{getPatientName(showSendModal.patient_id)}</strong></p>
            <div className="space-y-3 mb-4">
              {[
                { key: "telegram", icon: MessageCircle, label: "Telegram", color: "text-blue-500" },
                { key: "sms", icon: Phone, label: "SMS", color: "text-green-500" },
                { key: "email", icon: Mail, label: "Email", color: "text-orange-500" },
              ].map(ch => (
                <label key={ch.key} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                  sendChannels.includes(ch.key) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                )}>
                  <input type="checkbox" checked={sendChannels.includes(ch.key)} onChange={(e) => {
                    if (e.target.checked) setSendChannels([...sendChannels, ch.key]);
                    else setSendChannels(sendChannels.filter(c => c !== ch.key));
                  }} className="rounded" />
                  <ch.icon className={cn("w-5 h-5", ch.color)} />
                  <span className="text-sm font-medium text-foreground">{ch.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" disabled={sendChannels.length === 0 || sending === showSendModal.id} onClick={() => handleSendNotification(showSendModal, sendChannels)}>
                <Send className="w-4 h-4 mr-1" /> {sending === showSendModal.id ? "Yuborilmoqda..." : "Yuborish"}
              </Button>
              <Button variant="outline" onClick={() => setShowSendModal(null)}>Bekor</Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Laboratoriya (LIS)</h2>
        <div className="flex gap-2">
          <HMSDownloadMenu data={reportData} />
          <Button onClick={() => { setShowForm(true); setActiveTab("orders"); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Yangi tahlil
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard"><BarChart3 className="w-3.5 h-3.5 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="orders"><FlaskConical className="w-3.5 h-3.5 mr-1" />Buyurtmalar</TabsTrigger>
          <TabsTrigger value="completed"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Tayyor</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="w-3.5 h-3.5 mr-1" />Shablonlar</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Jami", value: stats.total, icon: FlaskConical, color: "text-primary" },
              { label: "Kutilmoqda", value: stats.pending, icon: Clock, color: "text-yellow-500" },
              { label: "Jarayonda", value: stats.inProgress, icon: TrendingUp, color: "text-blue-500" },
              { label: "Tayyor", value: stats.completed, icon: CheckCircle2, color: "text-green-500" },
              { label: "Shoshilinch", value: stats.urgent, icon: Zap, color: "text-red-500" },
              { label: "Abnormal", value: stats.abnormalResults, icon: AlertTriangle, color: "text-orange-500" },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={cn("w-4 h-4", s.color)} />
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Kategoriya bo'yicha</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryStats} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {categoryStats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Oylik trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Jami" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  <Bar dataKey="abnormal" name="Abnormal" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Recent */}
          <div className="bg-card rounded-xl border border-border p-4 mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">So'nggi buyurtmalar</h3>
            <div className="space-y-2">
              {orders.slice(0, 8).map(o => (
                <div key={o.id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/30 rounded-lg p-1.5 -mx-1.5" onClick={() => setSelectedOrder(o)}>
                  <div>
                    <span className="font-medium text-foreground">{o.test_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{getPatientName(o.patient_id)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px]", statusColors[o.status] || "")}>{o.status}</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>}
            </div>
          </div>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Barcha status</option>
              <option value="pending">Kutilmoqda</option>
              <option value="in_progress">Jarayonda</option>
              <option value="completed">Tayyor</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">Barcha kategoriya</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">Yangi tahlil buyurtmasi</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>

              {/* Quick Patient Create */}
              {showQuickPatient ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <UserPlus className="w-4 h-4 text-primary" /> Tezkor bemor yaratish
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <Input placeholder="Ism Familiya *" value={quickPatient.full_name} onChange={e => setQuickPatient({ ...quickPatient, full_name: e.target.value })} />
                    <Input placeholder="Telefon (+998) *" value={quickPatient.phone} onChange={e => setQuickPatient({ ...quickPatient, phone: e.target.value })} />
                    <Input type="date" placeholder="Tug'ilgan sana" value={quickPatient.date_of_birth} onChange={e => setQuickPatient({ ...quickPatient, date_of_birth: e.target.value })} />
                    <Input placeholder="JSHSHIR / ID" value={quickPatient.national_id} onChange={e => setQuickPatient({ ...quickPatient, national_id: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleQuickPatient}><UserPlus className="w-3.5 h-3.5 mr-1" /> Yaratish</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowQuickPatient(false)}>Bekor</Button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="relative">
                    <Input
                      placeholder="Bemor qidirish (ism yoki telefon)..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="mb-1 text-sm"
                    />
                  </div>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  >
                    <option value="">Bemorni tanlang * ({patients.filter(p => {
                      if (!patientSearch) return true;
                      const q = patientSearch.toLowerCase();
                      return p.full_name?.toLowerCase().includes(q) || p.phone?.includes(q);
                    }).length} ta)</option>
                    {patients
                      .filter(p => {
                        if (!patientSearch) return true;
                        const q = patientSearch.toLowerCase();
                        return p.full_name?.toLowerCase().includes(q) || p.phone?.includes(q);
                      })
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name} — {p.phone}</option>
                      ))}
                  </select>
                  {!showQuickPatient && (
                    <button className="text-xs text-primary mt-1 hover:underline flex items-center gap-1" onClick={() => setShowQuickPatient(true)}>
                      <UserPlus className="w-3 h-3" /> Yangi bemor qo'shish
                    </button>
                  )}
                </div>
                <div>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm mb-1"
                    value={form.test_category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const label = CATEGORIES.find(c => c.value === cat)?.label || "";
                      setForm({ ...form, test_category: cat, test_name: form.test_name || label });
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <p className="text-[10px] text-muted-foreground">Kategoriya tanlang → shablon avtomatik yuklanadi</p>
                </div>
                <Input placeholder="Tahlil nomi *" value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="normal">Oddiy</option>
                  <option value="urgent">Shoshilinch</option>
                  <option value="critical">Juda shoshilinch</option>
                </select>
                <Input placeholder="Izoh" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
              </div>
              <Button onClick={handleCreateOrder} className="mt-4">Buyurtma berish</Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-3">Jami: {filteredOrders.filter(o => o.status !== "completed").length} buyurtma</p>
          <div className="space-y-3">
            {filteredOrders.filter(o => o.status !== "completed").map((order) => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedOrder(order)}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <FlaskConical className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{order.test_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPatientName(order.patient_id)} • {new Date(order.ordered_at).toLocaleDateString("uz")}
                      {" • "}{CATEGORIES.find(c => c.value === order.test_category)?.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.priority !== "normal" && <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]">{order.priority === "urgent" ? "Shoshilinch" : "Juda shoshilinch"}</Badge>}
                    <Badge className={cn("text-[10px]", statusColors[order.status])}>{order.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
            {filteredOrders.filter(o => o.status !== "completed").length === 0 && <p className="text-center py-8 text-muted-foreground">Tahlil buyurtmalari topilmadi</p>}
          </div>
        </TabsContent>

        {/* COMPLETED */}
        <TabsContent value="completed">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tayyor natijalar ({orders.filter(o => o.status === "completed").length})</h3>
          <div className="space-y-3">
            {orders.filter(o => o.status === "completed").map(order => {
              const orderResults = results[order.id] || [];
              const abnormal = orderResults.filter((r: any) => r.is_abnormal).length;
              return (
                <div key={order.id} className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedOrder(order)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{order.test_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getPatientName(order.patient_id)} • {new Date(order.completed_at || order.ordered_at).toLocaleDateString("uz")}
                        • {orderResults.length} parametr
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {abnormal > 0 && <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]"><AlertTriangle className="w-3 h-3 mr-0.5" /> {abnormal}</Badge>}
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setShowSendModal(order); setSendChannels(["telegram"]); }}>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
            {orders.filter(o => o.status === "completed").length === 0 && <p className="text-center py-8 text-muted-foreground">Tayyor natijalar yo'q</p>}
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates">
          <h3 className="text-sm font-semibold text-foreground mb-4">Standart analiz shablonlari ({Object.keys(LAB_TEMPLATES).length} kategoriya)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(LAB_TEMPLATES).map(([cat, params]) => (
              <div key={cat} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  <h4 className="font-heading font-bold text-foreground text-sm">
                    {CATEGORIES.find(c => c.value === cat)?.label || cat}
                  </h4>
                  <Badge variant="outline" className="text-[10px]">{params.length} parametr</Badge>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {params.map(p => (
                    <div key={p.name} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                      <span className="text-foreground font-medium">{p.name}</span>
                      <span className="text-muted-foreground">{p.ref} {p.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSLaboratory;
