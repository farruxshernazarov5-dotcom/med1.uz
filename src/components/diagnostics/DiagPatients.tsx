import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, X, Save, Users, FlaskConical, TestTube2, FileText, Send, Sparkles, Eye, Barcode, Clock, CheckCircle2, AlertTriangle, DollarSign, Download } from "lucide-react";
import { downloadLabReportPDF } from "@/utils/downloadLabReport";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string | null;
  email?: string | null;
  notes?: string | null;
  created_at: string;
}

interface Props {
  centerId: string;
  patients: Patient[];
  onReload: () => void;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  collected:  { label: "Olindi",     cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  received:   { label: "Qabul",      cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  processing: { label: "Jarayonda",  cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  completed:  { label: "Tayyor",     cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  rejected:   { label: "Rad etildi", cls: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  pending:    { label: "Kutmoqda",   cls: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

const SAMPLE_TYPES = [
  { value: "blood",  label: "🩸 Qon" },
  { value: "urine",  label: "🧪 Siydik" },
  { value: "stool",  label: "🧫 Najas" },
  { value: "swab",   label: "👅 Surma" },
  { value: "tissue", label: "🧬 To'qima" },
  { value: "other",  label: "📦 Boshqa" },
];

const DiagPatients = ({ centerId, patients, onReload }: Props) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({ full_name: "", phone: "", date_of_birth: "", gender: "male", blood_group: "", address: "", email: "" });
  const [selected, setSelected] = useState<Patient | null>(null);

  // Patient detail data
  const [orders, setOrders] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  // KPI data (all samples for dashboard)
  const [allSamples, setAllSamples] = useState<any[]>([]);

  const sb = supabase as any;

  // === LOAD DASHBOARD DATA ===
  const loadDashboard = async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const [s, t] = await Promise.all([
      sb.from("diagnostics_samples").select("*").eq("center_id", centerId).order("created_at", { ascending: false }).limit(500),
      sb.from("diagnostics_test_templates").select("*").eq("center_id", centerId).eq("is_active", true),
    ]);
    setAllSamples(s.data || []);
    setTemplates(t.data || []);
  };

  useEffect(() => { loadDashboard(); /* eslint-disable-next-line */ }, [centerId]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`user:${user.id}:diag-lis:${centerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "diagnostics_samples", filter: `center_id=eq.${centerId}` }, () => loadDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "diagnostics_lab_orders", filter: `center_id=eq.${centerId}` }, () => loadDashboard())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [centerId, user?.id]);

  // === KPIs ===
  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySamples = allSamples.filter(s => (s.created_at || "").slice(0, 10) === today);
    const ready = allSamples.filter(s => s.status === "completed").length;
    const inProcess = allSamples.filter(s => s.status === "processing" || s.status === "received").length;
    const overdue = allSamples.filter(s => {
      if (s.status === "completed") return false;
      const created = new Date(s.created_at).getTime();
      return Date.now() - created > 24 * 60 * 60 * 1000;
    }).length;
    return {
      todayPatients: new Set(todaySamples.map(s => s.patient_id)).size,
      todaySamples: todaySamples.length,
      ready,
      inProcess,
      overdue,
    };
  }, [allSamples]);

  // === FILTER ===
  const filtered = useMemo(() => {
    let list = patients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        p.phone.includes(search) ||
        p.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      const ids = new Set(allSamples.filter(s => s.status === statusFilter).map(s => s.patient_id));
      list = list.filter(p => ids.has(p.id));
    }
    return list;
  }, [patients, search, statusFilter, allSamples]);

  // === SAVE PATIENT ===
  const handleSave = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "❌ Xatolik", description: "F.I.O. va telefon majburiy", variant: "destructive" });
      return;
    }
    const payload: any = { center_id: centerId, full_name: form.full_name.trim(), phone: form.phone.trim(), gender: form.gender || "male" };
    if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;
    if (form.blood_group) payload.blood_group = form.blood_group;
    if (form.address) payload.address = form.address;
    if (form.email) payload.email = form.email;

    const { error } = await sb.from("diagnostics_patients").insert(payload);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Bemor qo'shildi" });
    setShowForm(false);
    setForm({ full_name: "", phone: "", date_of_birth: "", gender: "male", blood_group: "", address: "", email: "" });
    onReload();
  };

  // === OPEN PROFILE ===
  const openProfile = async (p: Patient) => {
    setSelected(p);
    setAiInsight("");
    const [o, s, r, tx] = await Promise.all([
      sb.from("diagnostics_lab_orders").select("*").eq("patient_id", p.id).order("created_at", { ascending: false }),
      sb.from("diagnostics_samples").select("*").eq("patient_id", p.id).order("created_at", { ascending: false }),
      sb.from("diagnostics_lab_results").select("*, diagnostics_lab_orders!inner(patient_id)").eq("diagnostics_lab_orders.patient_id", p.id).order("created_at", { ascending: false }),
      sb.from("diagnostics_transactions").select("*").eq("patient_id", p.id).order("created_at", { ascending: false }),
    ]);
    setOrders(o.data || []);
    setSamples(s.data || []);
    setResults(r.data || []);
    setTransactions(tx.data || []);
  };

  // === CREATE ORDER + SAMPLE (one-click) ===
  const createOrderWithSample = async (templateId: string, sampleType: string) => {
    if (!selected) return;
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) { toast({ title: "Shablon tanlang", variant: "destructive" }); return; }

    const { data: order, error: oErr } = await sb.from("diagnostics_lab_orders").insert({
      center_id: centerId,
      patient_id: selected.id,
      template_id: templateId,
      test_name: tpl.name,
      status: "pending",
      total_price: 0,
    }).select().single();
    if (oErr) { toast({ title: "Xatolik", description: oErr.message, variant: "destructive" }); return; }

    const { error: sErr } = await sb.from("diagnostics_samples").insert({
      center_id: centerId,
      order_id: order.id,
      patient_id: selected.id,
      sample_type: sampleType,
      status: "collected",
      current_location: "reception",
    });
    if (sErr) { toast({ title: "Xatolik", description: sErr.message, variant: "destructive" }); return; }

    toast({ title: "✅ Buyurtma + namuna yaratildi" });
    openProfile(selected);
  };

  // === UPDATE SAMPLE STATUS ===
  const updateSampleStatus = async (sampleId: string, status: string) => {
    const updates: any = { status, current_location: status === "received" ? "lab" : status === "processing" ? "analyzer" : status === "completed" ? "ready" : "reception" };
    if (status === "received") updates.received_at = new Date().toISOString();
    if (status === "processing") updates.processed_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();
    const { error } = await sb.from("diagnostics_samples").update(updates).eq("id", sampleId);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }

    // Buyurtma statusini ham sinxronlash
    const sample = samples.find(s => s.id === sampleId);
    if (sample?.order_id) {
      const orderStatus = status === "completed" ? "completed" : status === "processing" || status === "received" ? "in_progress" : "pending";
      await sb.from("diagnostics_lab_orders").update({ status: orderStatus }).eq("id", sample.order_id);
    }
    toast({ title: "♻️ Status yangilandi" });
    if (selected) openProfile(selected);
  };

  // === ENTER RESULTS (auto-fill from template) ===
  const [resultDialog, setResultDialog] = useState<{ orderId: string; templateId?: string } | null>(null);
  const [resultValues, setResultValues] = useState<Record<string, string>>({});

  const openResultDialog = (order: any) => {
    const existing = results.filter(r => r.order_id === order.id);
    const initial: Record<string, string> = {};
    existing.forEach(r => { initial[r.parameter_name] = r.value || ""; });
    setResultValues(initial);
    setResultDialog({ orderId: order.id, templateId: order.template_id });
  };

  const saveResults = async () => {
    if (!resultDialog) return;
    const tpl = templates.find(t => t.id === resultDialog.templateId);
    if (!tpl) { toast({ title: "Shablon topilmadi", variant: "destructive" }); return; }
    const params: any[] = Array.isArray(tpl.parameters) ? tpl.parameters : [];

    // Eski natijalarni o'chirish va yangi to'plamni yozish (barcha parametrlar)
    await sb.from("diagnostics_lab_results").delete().eq("order_id", resultDialog.orderId);

    const rows = params.map((p: any) => {
      const value = (resultValues[p.name] || "").trim();
      const min = parseFloat(p.min);
      const max = parseFloat(p.max);
      const numeric = parseFloat(value);
      let status = "normal";
      if (value && !isNaN(numeric) && !isNaN(min) && !isNaN(max)) {
        if (numeric < min) status = "low";
        else if (numeric > max) status = "high";
      } else if (!value) {
        status = "pending";
      }
      return {
        center_id: centerId,
        order_id: resultDialog.orderId,
        parameter_name: p.name,
        value: value || null,
        unit: p.unit || null,
        reference_min: p.min?.toString() || null,
        reference_max: p.max?.toString() || null,
        status,
      };
    });
    const { error } = await sb.from("diagnostics_lab_results").insert(rows);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }

    // Buyurtma + sample tayyor
    await sb.from("diagnostics_lab_orders").update({ status: "completed" }).eq("id", resultDialog.orderId);
    const sample = samples.find(s => s.order_id === resultDialog.orderId);
    if (sample) await updateSampleStatus(sample.id, "completed");

    toast({ title: "✅ Natijalar saqlandi", description: `${rows.length} ta parametr` });
    setResultDialog(null);
    setResultValues({});
    if (selected) openProfile(selected);
  };

  // === DOWNLOAD PDF ===
  const downloadPDF = (order: any) => {
    if (!selected) return;
    const orderResults = results.filter(r => r.order_id === order.id);
    downloadLabReportPDF({
      testName: order.test_name || "Analiz",
      testCategory: "Laboratoriya",
      patientName: selected.full_name,
      patientPhone: selected.phone,
      patientDob: selected.date_of_birth || undefined,
      patientGender: selected.gender || undefined,
      patientBloodGroup: selected.blood_group || undefined,
      orderedAt: order.created_at,
      completedAt: order.status === "completed" ? new Date().toISOString() : undefined,
      results: orderResults.map(r => ({
        parameter_name: r.parameter_name,
        value: r.value || "—",
        unit: r.unit || "",
        reference_range: `${r.reference_min || ""}-${r.reference_max || ""}`,
        is_abnormal: r.status === "high" || r.status === "low",
      })),
    });
  };

  // === SEND TO PATIENT (Telegram + Email) ===
  const sendResults = async (order: any) => {
    const orderResults = results.filter(r => r.order_id === order.id);
    const abnormal = orderResults.filter(r => r.status === "high" || r.status === "low").length;
    try {
      await supabase.functions.invoke("lab-result-notify", {
        body: {
          lab_result_id: order.id,
          patient_id: selected?.id,
          channels: ["telegram", "email"],
          email_data: {
            recipient_email: selected?.email,
            patient_name: selected?.full_name,
            test_name: order.test_name,
            test_category: "Laboratoriya",
            results_count: orderResults.length,
            abnormal_count: abnormal,
            results_summary: orderResults.slice(0, 5).map(r => `${r.parameter_name}: ${r.value || "—"} ${r.unit || ""}`).join("\n"),
            date: new Date().toLocaleDateString("uz-UZ"),
          },
        },
      });
      toast({ title: "📲 Yuborildi", description: "Telegram + Email" });
    } catch (e: any) {
      toast({ title: "Yuborishda xatolik", description: e?.message, variant: "destructive" });
    }
  };

  // === AI INSIGHT ===
  const runAIAnalysis = async () => {
    if (!selected || !results.length) {
      toast({ title: "Avval natija kiriting", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    setAiInsight("");
    try {
      const summary = results.slice(0, 30).map(r =>
        `${r.parameter_name}: ${r.value || "—"} ${r.unit || ""} (norma: ${r.reference_min || "?"}-${r.reference_max || "?"}, ${r.status})`
      ).join("\n");
      const { data, error } = await supabase.functions.invoke("ai-doctor-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Sen tajribali laboratoriya shifokorisan. Quyidagi analiz natijalarini O'zbek tilida tahlil qil:\n\nBemor: ${selected.full_name}, ${selected.gender}, ${selected.date_of_birth || "?"}\n\nNatijalar:\n${summary}\n\n1) Asosiy abnormal ko'rsatkichlar\n2) Ehtimoliy sabab\n3) Qo'shimcha tekshiruvlar tavsiyasi\n4) Ogohlantirish (agar shoshilinch bo'lsa)\n\nQisqa, professional. Diagnoz qo'yma — faqat tahlil va tavsiya.`
          }]
        }
      });
      if (error) throw error;
      setAiInsight(data?.message || data?.content || "AI javob bermadi");
    } catch (e: any) {
      toast({ title: "AI xatolik", description: e?.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // ====== RENDER ======
  return (
    <div className="space-y-4">
      {/* KPI BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="w-3 h-3"/>Bugungi bemor</div><div className="text-2xl font-bold mt-1">{kpis.todayPatients}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><TestTube2 className="w-3 h-3"/>Topshirilgan</div><div className="text-2xl font-bold mt-1">{kpis.todaySamples}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3"/>Jarayonda</div><div className="text-2xl font-bold mt-1 text-amber-600">{kpis.inProcess}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="w-3 h-3"/>Tayyor</div><div className="text-2xl font-bold mt-1 text-emerald-600">{kpis.ready}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="w-3 h-3"/>Kechikkan</div><div className="text-2xl font-bold mt-1 text-rose-600">{kpis.overdue}</div></CardContent></Card>
      </div>

      {/* SEARCH + FILTER + ADD */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Ism, telefon yoki ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">Barcha statuslar</option>
          <option value="collected">Olindi</option>
          <option value="received">Qabul</option>
          <option value="processing">Jarayonda</option>
          <option value="completed">Tayyor</option>
        </select>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Yangi bemor
        </Button>
      </div>

      {/* ADD FORM */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Yangi bemor</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>F.I.O. *</Label><Input value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Telefon *</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998..." className="mt-1" /></div>
              <div><Label>Tug'ilgan sana</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm(p => ({ ...p, date_of_birth: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>Jinsi *</Label>
                <select value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 mt-1 text-sm">
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
              </div>
              <div><Label>Qon guruhi</Label><Input value={form.blood_group} onChange={(e) => setForm(p => ({ ...p, blood_group: e.target.value }))} placeholder="A+, B-..." className="mt-1" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
              <div className="md:col-span-2"><Label>Manzil</Label><Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PATIENTS TABLE */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" />Bemorlar topilmadi</CardContent></Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>F.I.O.</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Jinsi</TableHead>
                <TableHead>Qon</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openProfile(p)}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.gender === "male" ? "Erkak" : p.gender === "female" ? "Ayol" : "—"}</Badge></TableCell>
                  <TableCell>{p.blood_group || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("uz-UZ")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openProfile(p); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* PATIENT PROFILE DIALOG */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary"/> {selected.full_name}
                  <Badge variant="outline" className="ml-2 text-xs">{selected.phone}</Badge>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-2">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="overview">Profil</TabsTrigger>
                  <TabsTrigger value="orders">Buyurtmalar</TabsTrigger>
                  <TabsTrigger value="samples"><Barcode className="w-3 h-3 mr-1"/>Namunalar</TabsTrigger>
                  <TabsTrigger value="results">Natijalar</TabsTrigger>
                  <TabsTrigger value="finance">Moliya</TabsTrigger>
                </TabsList>

                {/* OVERVIEW */}
                <TabsContent value="overview" className="space-y-3">
                  <Card><CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                    <div><div className="text-xs text-muted-foreground">F.I.O.</div><div className="font-medium">{selected.full_name}</div></div>
                    <div><div className="text-xs text-muted-foreground">Telefon</div><div className="font-medium">{selected.phone}</div></div>
                    <div><div className="text-xs text-muted-foreground">Tug'ilgan</div><div className="font-medium">{selected.date_of_birth || "—"}</div></div>
                    <div><div className="text-xs text-muted-foreground">Jinsi</div><div className="font-medium">{selected.gender === "male" ? "Erkak" : "Ayol"}</div></div>
                    <div><div className="text-xs text-muted-foreground">Qon guruhi</div><div className="font-medium">{selected.blood_group || "—"}</div></div>
                    <div><div className="text-xs text-muted-foreground">Email</div><div className="font-medium">{selected.email || "—"}</div></div>
                    <div className="col-span-2"><div className="text-xs text-muted-foreground">Manzil</div><div className="font-medium">{selected.address || "—"}</div></div>
                    <div className="col-span-2"><div className="text-xs text-muted-foreground">ID</div><div className="font-mono text-xs">{selected.id}</div></div>
                  </CardContent></Card>

                  {/* QUICK ORDER */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4"/>Tezkor buyurtma + namuna</CardTitle></CardHeader>
                    <CardContent>
                      {templates.length === 0 ? (
                        <div className="text-xs text-muted-foreground">Avval Templates moduliga shablon qo'shing</div>
                      ) : (
                        <QuickOrderForm templates={templates} onCreate={createOrderWithSample} />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ORDERS */}
                <TabsContent value="orders" className="space-y-2">
                  {orders.length === 0 ? <div className="text-center text-muted-foreground py-6 text-sm">Buyurtmalar yo'q</div> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Analiz</TableHead><TableHead>Status</TableHead><TableHead>Sana</TableHead><TableHead className="text-right">Amallar</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {orders.map(o => {
                          const st = STATUS_LABEL[o.status] || STATUS_LABEL.pending;
                          return (
                            <TableRow key={o.id}>
                              <TableCell className="font-medium">{o.test_name || "—"}</TableCell>
                              <TableCell><Badge className={st.cls}>{st.label}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("uz-UZ")}</TableCell>
                              <TableCell className="text-right space-x-1">
                                {o.template_id && <Button size="sm" variant="outline" onClick={() => openResultDialog(o)}><FileText className="w-3 h-3 mr-1"/>Natija</Button>}
                                {o.status === "completed" && <Button size="sm" variant="outline" onClick={() => downloadPDF(o)}><Download className="w-3 h-3 mr-1"/>PDF</Button>}
                                {o.status === "completed" && <Button size="sm" onClick={() => sendResults(o)}><Send className="w-3 h-3 mr-1"/>Yuborish</Button>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* SAMPLES */}
                <TabsContent value="samples" className="space-y-2">
                  {samples.length === 0 ? <div className="text-center text-muted-foreground py-6 text-sm">Namunalar yo'q</div> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Barcode</TableHead><TableHead>Tur</TableHead><TableHead>Status</TableHead><TableHead>Joylashuv</TableHead><TableHead>Olindi</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {samples.map(s => {
                          const st = STATUS_LABEL[s.status] || STATUS_LABEL.collected;
                          return (
                            <TableRow key={s.id}>
                              <TableCell className="font-mono text-xs flex items-center gap-1"><Barcode className="w-3 h-3"/>{s.sample_code}</TableCell>
                              <TableCell className="text-xs">{SAMPLE_TYPES.find(t => t.value === s.sample_type)?.label || s.sample_type}</TableCell>
                              <TableCell><Badge className={st.cls}>{st.label}</Badge></TableCell>
                              <TableCell className="text-xs">{s.current_location || "—"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{s.collected_at ? new Date(s.collected_at).toLocaleString("uz-UZ") : "—"}</TableCell>
                              <TableCell className="text-right">
                                <select value={s.status} onChange={(e) => updateSampleStatus(s.id, e.target.value)} className="text-xs h-8 rounded border border-input bg-background px-2">
                                  <option value="collected">Olindi</option>
                                  <option value="received">Qabul</option>
                                  <option value="processing">Jarayonda</option>
                                  <option value="completed">Tayyor</option>
                                  <option value="rejected">Rad</option>
                                </select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* RESULTS + AI */}
                <TabsContent value="results" className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">Jami: {results.length} ko'rsatkich</div>
                    <Button size="sm" variant="outline" onClick={runAIAnalysis} disabled={aiLoading}>
                      <Sparkles className="w-3 h-3 mr-1"/>{aiLoading ? "AI tahlil qilmoqda..." : "AI Tushuntirish"}
                    </Button>
                  </div>
                  {aiInsight && (
                    <Card className="border-purple-500/30 bg-purple-500/5">
                      <CardContent className="p-4 text-sm whitespace-pre-wrap">{aiInsight}</CardContent>
                    </Card>
                  )}
                  {results.length === 0 ? <div className="text-center text-muted-foreground py-6 text-sm">Natijalar yo'q</div> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Parametr</TableHead><TableHead>Natija</TableHead><TableHead>Norma</TableHead><TableHead>Holat</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {results.map(r => (
                          <TableRow key={r.id} className={r.status === "high" || r.status === "low" ? "bg-rose-500/5" : ""}>
                            <TableCell className="font-medium text-sm">{r.parameter_name}</TableCell>
                            <TableCell className="font-bold">{r.value || "—"} <span className="text-xs text-muted-foreground font-normal">{r.unit}</span></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.reference_min}-{r.reference_max}</TableCell>
                            <TableCell>
                              <Badge className={
                                r.status === "high" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                                r.status === "low" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                r.status === "normal" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                "bg-slate-500/10 text-slate-600 border-slate-500/20"
                              }>
                                {r.status === "high" ? "↑ Yuqori" : r.status === "low" ? "↓ Past" : r.status === "normal" ? "✓ Normal" : "⏳ Kutmoqda"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* FINANCE */}
                <TabsContent value="finance" className="space-y-2">
                  {transactions.length === 0 ? <div className="text-center text-muted-foreground py-6 text-sm">To'lovlar yo'q</div> : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3"/>Jami to'langan</div><div className="text-xl font-bold mt-1">{transactions.filter(t => t.status === "paid").reduce((a, t) => a + Number(t.amount || 0), 0).toLocaleString()} so'm</div></CardContent></Card>
                        <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Qarz</div><div className="text-xl font-bold mt-1 text-rose-600">{transactions.filter(t => t.status !== "paid").reduce((a, t) => a + Number(t.amount || 0), 0).toLocaleString()} so'm</div></CardContent></Card>
                      </div>
                      <Table>
                        <TableHeader><TableRow><TableHead>Invoys</TableHead><TableHead>Summa</TableHead><TableHead>Usul</TableHead><TableHead>Status</TableHead><TableHead>Sana</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {transactions.map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="font-mono text-xs">{t.invoice_number || "—"}</TableCell>
                              <TableCell className="font-bold">{Number(t.amount).toLocaleString()} so'm</TableCell>
                              <TableCell className="text-xs">{t.payment_method || "—"}</TableCell>
                              <TableCell><Badge variant={t.status === "paid" ? "default" : "outline"}>{t.status}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("uz-UZ")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* RESULT ENTRY DIALOG (auto-fills all template params) */}
      <Dialog open={!!resultDialog} onOpenChange={(o) => !o && setResultDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Natijalarni kiritish</DialogTitle></DialogHeader>
          {resultDialog && (() => {
            const tpl = templates.find(t => t.id === resultDialog.templateId);
            const params: any[] = Array.isArray(tpl?.parameters) ? tpl.parameters : [];
            if (!params.length) return <div className="text-sm text-muted-foreground py-4">Shablon parametrlari topilmadi</div>;
            return (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground mb-2">💡 {params.length} ta parametr — istalgan sonini to'ldiring, qolganlari "kutmoqda" sifatida saqlanadi va PDF da chiqadi</div>
                {params.map((p: any) => (
                  <div key={p.name} className="grid grid-cols-12 gap-2 items-center">
                    <Label className="col-span-5 text-xs">{p.name} <span className="text-muted-foreground">({p.unit})</span></Label>
                    <Input className="col-span-4 h-9" placeholder={`Norma: ${p.min}-${p.max}`} value={resultValues[p.name] || ""} onChange={(e) => setResultValues(v => ({ ...v, [p.name]: e.target.value }))} />
                    <div className="col-span-3 text-xs text-muted-foreground">{p.min}-{p.max}</div>
                  </div>
                ))}
                <div className="flex gap-2 pt-3 border-t mt-3">
                  <Button size="sm" onClick={saveResults}><Save className="w-4 h-4 mr-1"/>Saqlash + Tayyor</Button>
                  <Button size="sm" variant="outline" onClick={() => setResultDialog(null)}>Bekor</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// === Quick order subcomponent ===
const QuickOrderForm = ({ templates, onCreate }: { templates: any[]; onCreate: (tplId: string, sampleType: string) => void }) => {
  const [tpl, setTpl] = useState("");
  const [type, setType] = useState("blood");
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <select value={tpl} onChange={(e) => setTpl(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">Shablon tanlang...</option>
        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
        {SAMPLE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <Button size="sm" onClick={() => tpl && onCreate(tpl, type)} disabled={!tpl}>
        <Plus className="w-4 h-4 mr-1"/>Yaratish
      </Button>
    </div>
  );
};

export default DiagPatients;
