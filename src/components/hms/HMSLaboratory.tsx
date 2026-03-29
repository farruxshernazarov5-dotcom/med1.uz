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
  ArrowLeft, Eye, Printer, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";

interface Props { clinicId: string; }

const CATEGORIES = [
  { value: "blood", label: "Qon tahlili" },
  { value: "urine", label: "Siydik tahlili" },
  { value: "biochemistry", label: "Biokimyoviy" },
  { value: "hormones", label: "Gormonlar" },
  { value: "immunology", label: "Immunologiya" },
  { value: "microbiology", label: "Mikrobiologiya" },
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
  ],
  biochemistry: [
    { name: "Glyukoza", unit: "mmol/L", ref: "3.3-5.5" },
    { name: "ALT", unit: "U/L", ref: "7-56" },
    { name: "AST", unit: "U/L", ref: "10-40" },
    { name: "Umumiy bilrubin", unit: "µmol/L", ref: "3.4-20.5" },
    { name: "Kreatinin", unit: "µmol/L", ref: "44-106" },
    { name: "Mochevina", unit: "mmol/L", ref: "2.5-8.3" },
    { name: "Umumiy oqsil", unit: "g/L", ref: "66-83" },
    { name: "Xolesterin", unit: "mmol/L", ref: "3.6-5.2" },
  ],
  hormones: [
    { name: "TSH", unit: "mIU/L", ref: "0.4-4.0" },
    { name: "T3 (erkin)", unit: "pmol/L", ref: "3.1-6.8" },
    { name: "T4 (erkin)", unit: "pmol/L", ref: "12-22" },
    { name: "Insulin", unit: "µIU/mL", ref: "2.6-24.9" },
    { name: "Kortizol", unit: "nmol/L", ref: "171-536" },
  ],
  urine: [
    { name: "Rang", unit: "", ref: "Sariq" },
    { name: "pH", unit: "", ref: "5.0-7.0" },
    { name: "Zichlik", unit: "", ref: "1.010-1.025" },
    { name: "Oqsil", unit: "g/L", ref: "0-0.033" },
    { name: "Glyukoza", unit: "mmol/L", ref: "0" },
    { name: "Leykotsitlar", unit: "ko'rish maydonida", ref: "0-5" },
    { name: "Eritrotsitlar", unit: "ko'rish maydonida", ref: "0-2" },
  ],
};

const PIE_COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const HMSLaboratory = ({ clinicId }: Props) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [results, setResults] = useState<Record<string, any[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [showResultForm, setShowResultForm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  const [form, setForm] = useState({ patient_id: "", test_name: "", test_category: "blood", priority: "normal", notes: "" });
  const [resultForm, setResultForm] = useState({ parameter_name: "", value: "", unit: "", reference_range: "", is_abnormal: false });

  const fetchData = async () => {
    const [ordersRes, patientsRes] = await Promise.all([
      supabase.from("hms_lab_orders").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name, phone, user_id").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setOrders(ordersRes.data || []);
    setPatients(patientsRes.data || []);

    if (ordersRes.data?.length) {
      const { data: allResults } = await supabase
        .from("hms_lab_results").select("*")
        .in("order_id", ordersRes.data.map((o: any) => o.id));
      const grouped: Record<string, any[]> = {};
      (allResults || []).forEach((r: any) => {
        if (!grouped[r.order_id]) grouped[r.order_id] = [];
        grouped[r.order_id].push(r);
      });
      setResults(grouped);
    }
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const handleCreateOrder = async () => {
    if (!form.patient_id || !form.test_name) {
      toast({ title: "Bemor va tahlil nomi majburiy!", variant: "destructive" });
      return;
    }
    await supabase.from("hms_lab_orders").insert({ ...form, clinic_id: clinicId });
    toast({ title: "✅ Tahlil buyurtmasi yaratildi" });
    setShowForm(false);
    setForm({ patient_id: "", test_name: "", test_category: "blood", priority: "normal", notes: "" });
    fetchData();
  };

  const handleAddResult = async (orderId: string) => {
    if (!resultForm.parameter_name || !resultForm.value) {
      toast({ title: "Parametr va qiymat majburiy!", variant: "destructive" });
      return;
    }
    await supabase.from("hms_lab_results").insert({ ...resultForm, order_id: orderId });
    toast({ title: "✅ Natija qo'shildi" });
    setResultForm({ parameter_name: "", value: "", unit: "", reference_range: "", is_abnormal: false });
    fetchData();
  };

  const handleAddTemplateResults = async (orderId: string, category: string) => {
    const template = LAB_TEMPLATES[category];
    if (!template) return;
    const rows = template
      .filter(t => templateValues[t.name]?.trim())
      .map(t => {
        const val = parseFloat(templateValues[t.name]);
        const ref = t.ref;
        let isAbnormal = false;
        if (!isNaN(val) && ref.includes("-")) {
          const [min, max] = ref.split("-").map(Number);
          if (!isNaN(min) && !isNaN(max)) isAbnormal = val < min || val > max;
        }
        return {
          order_id: orderId,
          parameter_name: t.name,
          value: templateValues[t.name],
          unit: t.unit,
          reference_range: t.ref,
          is_abnormal: isAbnormal,
        };
      });
    if (rows.length === 0) { toast({ title: "Kamida 1 ta qiymat kiriting!", variant: "destructive" }); return; }
    await supabase.from("hms_lab_results").insert(rows);
    toast({ title: `✅ ${rows.length} ta natija qo'shildi` });
    setTemplateValues({});
    setUseTemplate(false);
    setShowResultForm(null);
    fetchData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("hms_lab_orders").update({
      status, completed_at: status === "completed" ? new Date().toISOString() : null
    }).eq("id", id);
    toast({ title: `Status: ${status}` });
    fetchData();
  };

  const handleSendNotification = async (order: any) => {
    setSending(order.id);
    try {
      const patient = patients.find(p => p.id === order.patient_id);
      if (!patient?.user_id) {
        toast({ title: "Bemor user_id topilmadi", variant: "destructive" });
        setSending(null);
        return;
      }
      const { data, error } = await supabase.functions.invoke("lab-result-notify", {
        body: { lab_result_id: order.id, patient_id: patient.user_id, channels: ["telegram"] },
      });
      if (error) throw error;
      toast({ title: "✅ Bildirishnoma yuborildi!" });
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
    title: "Laboratoriya hisoboti",
    moduleType: "HMS Laboratoriya",
    kpiCards: [
      { label: "Jami buyurtmalar", value: String(stats.total) },
      { label: "Kutilmoqda", value: String(stats.pending) },
      { label: "Jarayonda", value: String(stats.inProgress) },
      { label: "Tayyor", value: String(stats.completed) },
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

    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
        </Button>

        <div className="bg-card rounded-2xl border border-border p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                {order.test_name}
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

          {/* Patient & Doctor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">BEMOR MA'LUMOTI</h4>
              <p className="text-sm font-medium text-foreground">{patient?.full_name || "—"}</p>
              {patient?.phone && <p className="text-xs text-muted-foreground">{patient.phone}</p>}
            </div>
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">TAHLIL TAFSILOTI</h4>
              <p className="text-xs text-muted-foreground">Buyurtma: {new Date(order.ordered_at).toLocaleString("uz")}</p>
              {order.completed_at && <p className="text-xs text-muted-foreground">Tayyor: {new Date(order.completed_at).toLocaleString("uz")}</p>}
              {order.notes && <p className="text-xs text-muted-foreground mt-1">Izoh: {order.notes}</p>}
            </div>
          </div>

          {/* Results */}
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
                      <TableRow key={r.id} className={r.is_abnormal ? "bg-red-50/50 dark:bg-red-900/10" : ""}>
                        <TableCell className="text-xs font-medium py-2">{r.parameter_name}</TableCell>
                        <TableCell className={cn("text-xs py-2 font-bold", r.is_abnormal ? "text-destructive" : "text-foreground")}>{r.value}</TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{r.unit}</TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{r.reference_range}</TableCell>
                        <TableCell className="text-xs py-2">
                          {r.is_abnormal ? (
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

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {order.status === "completed" && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleSendNotification(order)} disabled={sending === order.id}>
                  <Send className="w-3.5 h-3.5 mr-1" /> {sending === order.id ? "Yuborilmoqda..." : "Telegramga yuborish"}
                </Button>
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

        {/* Add results with template */}
        {order.status !== "completed" && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-foreground">Natija kiritish</h4>
              {LAB_TEMPLATES[order.test_category] && (
                <Button size="sm" variant={useTemplate ? "default" : "outline"} onClick={() => setUseTemplate(!useTemplate)}>
                  <FileText className="w-3.5 h-3.5 mr-1" /> {useTemplate ? "Shablon yopish" : "Shablondan foydalanish"}
                </Button>
              )}
            </div>

            {useTemplate && LAB_TEMPLATES[order.test_category] ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {LAB_TEMPLATES[order.test_category].map(t => (
                    <div key={t.name} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                      <span className="text-xs font-medium text-foreground min-w-[140px]">{t.name}</span>
                      <Input
                        placeholder={`Norma: ${t.ref}`}
                        value={templateValues[t.name] || ""}
                        onChange={e => setTemplateValues({ ...templateValues, [t.name]: e.target.value })}
                        className="text-xs h-8 flex-1"
                      />
                      <span className="text-[10px] text-muted-foreground min-w-[60px]">{t.unit}</span>
                    </div>
                  ))}
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Laboratoriya</h2>
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
              { label: "Normadan tashqari", value: stats.abnormalResults, icon: AlertTriangle, color: "text-orange-500" },
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
              <h3 className="text-sm font-semibold text-foreground mb-3">So'nggi buyurtmalar</h3>
              <div className="space-y-2">
                {orders.slice(0, 6).map(o => (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                  <option value="">Bemorni tanlang *</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
                <Input placeholder="Tahlil nomi *" value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.test_category} onChange={(e) => setForm({ ...form, test_category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
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
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleSendNotification(order); }} disabled={sending === order.id}>
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
          <h3 className="text-sm font-semibold text-foreground mb-4">Standart analiz shablonlari</h3>
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
                <div className="space-y-1">
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
