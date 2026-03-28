import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, FlaskConical, Clock, CheckCircle2, X, AlertTriangle,
  Search, TrendingUp, BarChart3, Zap, Send, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
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

  const [form, setForm] = useState({ patient_id: "", test_name: "", test_category: "blood", priority: "normal", notes: "" });
  const [resultForm, setResultForm] = useState({ parameter_name: "", value: "", unit: "", reference_range: "", is_abnormal: false });

  const fetchData = async () => {
    const [ordersRes, patientsRes] = await Promise.all([
      supabase.from("hms_lab_orders").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
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

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("hms_lab_orders").update({
      status, completed_at: status === "completed" ? new Date().toISOString() : null
    }).eq("id", id);
    toast({ title: `Status: ${status}` });
    fetchData();
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
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard">
          {/* KPI Cards */}
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

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-foreground">{o.test_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{getPatientName(o.patient_id)}</span>
                    </div>
                    <Badge className={cn("text-[10px]", statusColors[o.status] || "")}>{o.status}</Badge>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ORDERS TAB */}
        <TabsContent value="orders">
          {/* Filters */}
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

          {/* Create Order Form */}
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

          <p className="text-sm text-muted-foreground mb-3">Jami: {filteredOrders.length} buyurtma</p>

          {/* Orders List */}
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <FlaskConical className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{order.test_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Bemor: {getPatientName(order.patient_id)} • {new Date(order.ordered_at).toLocaleDateString("uz")}
                      {" • "}{CATEGORIES.find(c => c.value === order.test_category)?.label || order.test_category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.priority === "urgent" && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">Shoshilinch</Badge>}
                    {order.priority === "critical" && <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]">Juda shoshilinch</Badge>}
                    <Badge className={cn("text-[10px]", statusColors[order.status] || "bg-muted text-muted-foreground")}>{order.status}</Badge>
                    {order.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "in_progress")}>
                        <Clock className="w-3 h-3 mr-1" /> Boshlash
                      </Button>
                    )}
                    {order.status === "in_progress" && (
                      <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "completed")}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Tayyor
                      </Button>
                    )}
                  </div>
                </div>

                {/* Results Table */}
                {results[order.id]?.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 mb-2">
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
                        {results[order.id].map((r: any) => (
                          <TableRow key={r.id} className={r.is_abnormal ? "text-destructive" : ""}>
                            <TableCell className="text-xs py-1">{r.parameter_name} {r.is_abnormal && <AlertTriangle className="w-3 h-3 inline" />}</TableCell>
                            <TableCell className="text-xs py-1 font-medium">{r.value}</TableCell>
                            <TableCell className="text-xs py-1">{r.unit}</TableCell>
                            <TableCell className="text-xs py-1">{r.reference_range}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Add Result Form */}
                {showResultForm === order.id ? (
                  <div className="bg-muted/20 rounded-lg p-3 mt-2">
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
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleAddResult(order.id)}>Qo'shish</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowResultForm(null)}>Yopish</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setShowResultForm(order.id)} className="text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Natija qo'shish
                  </Button>
                )}
              </div>
            ))}
            {filteredOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Tahlil buyurtmalari topilmadi</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSLaboratory;
