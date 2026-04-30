import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, X, FileText, Download, Sparkles, Wand2, Search, AlertCircle, CheckCircle2, ShieldCheck, Clock, XCircle } from "lucide-react";
import { downloadLabReportPDF } from "@/utils/downloadLabReport";

interface LabOrder {
  id: string;
  order_number: string;
  status: string;
  patient_id?: string;
  service_id?: string;
  created_at?: string;
  completed_at?: string | null;
  test_name?: string | null;
  template_id?: string | null;
  approval_status?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_note?: string | null;
}
interface ApprovalLog {
  id: string;
  order_id: string;
  approver_name: string | null;
  status: string;
  note: string | null;
  created_at: string;
}
interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
}
interface Service {
  id: string;
  name: string;
  category?: string;
}
interface Result {
  id: string;
  order_id: string;
  parameter_name: string;
  value: string | null;
  unit: string | null;
  reference_min: string | null;
  reference_max: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
}
interface TemplateParam {
  name: string;
  unit?: string;
  min?: string;
  max?: string;
  avg?: string;
  age_group?: string;
  gender?: string;
}
interface Template {
  id: string;
  name: string;
  category: string;
  parameters: any;
}

interface Props {
  centerId: string;
  results: Result[];
  orders: LabOrder[];
  templates: Template[];
  patients?: Patient[];
  services?: Service[];
  onReload: () => void;
}

const DiagResults = ({ centerId, results, orders, templates, patients = [], services = [], onReload }: Props) => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [rows, setRows] = useState<
    { parameter_name: string; value: string; unit: string; reference_min: string; reference_max: string; reference_avg: string }[]
  >([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterApproval, setFilterApproval] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiText, setAiText] = useState<string>("");
  const [aiOpen, setAiOpen] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);
  const [approverName, setApproverName] = useState("");

  // Load approval logs for currently viewed order
  useEffect(() => {
    if (!viewOrderId) { setApprovalLogs([]); return; }
    (async () => {
      const { data } = await supabase.from("diagnostics_result_approvals" as any)
        .select("*").eq("order_id", viewOrderId).order("created_at", { ascending: false }) as any;
      setApprovalLogs(data || []);
    })();
  }, [viewOrderId]);

  const completedOrders = orders.filter((o) => ["accepted", "in_progress", "completed"].includes(o.status));

  const patientMap = useMemo(() => {
    const m: Record<string, Patient> = {};
    patients.forEach((p) => (m[p.id] = p));
    return m;
  }, [patients]);

  const serviceMap = useMemo(() => {
    const m: Record<string, Service> = {};
    services.forEach((s) => (m[s.id] = s));
    return m;
  }, [services]);

  const orderLabel = (o: LabOrder) => {
    const p = o.patient_id ? patientMap[o.patient_id]?.full_name : "";
    const t = o.test_name || (o.service_id ? serviceMap[o.service_id]?.name : "") || "—";
    return `${o.order_number || o.id.slice(0, 6)} • ${p || "Bemor"} • ${t}`;
  };

  const computeStatus = (val: string, min: string, max: string): string => {
    const v = parseFloat(val);
    const mn = parseFloat(min);
    const mx = parseFloat(max);
    if (isNaN(v)) return "normal";
    if (!isNaN(mx) && v > mx) return "high";
    if (!isNaN(mn) && v < mn) return "low";
    return "normal";
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const params: TemplateParam[] = Array.isArray(tpl.parameters) ? tpl.parameters : [];
    setRows(
      params.map((p) => ({
        parameter_name: p.name || "",
        value: "",
        unit: p.unit || "",
        reference_min: String(p.min ?? ""),
        reference_max: String(p.max ?? ""),
        reference_avg: String(p.avg ?? ""),
      }))
    );
  };

  // AUTO-FILL: bo'sh value larga reference o'rtachasini quyish
  const autoFillEmpty = () => {
    if (rows.length === 0) {
      toast({ title: "Avval shablon tanlang", variant: "destructive" });
      return;
    }
    let filled = 0;
    const next = rows.map((r) => {
      if (r.value && r.value.trim()) return r;
      let v = r.reference_avg;
      if (!v || !v.trim()) {
        const mn = parseFloat(r.reference_min);
        const mx = parseFloat(r.reference_max);
        if (!isNaN(mn) && !isNaN(mx)) v = ((mn + mx) / 2).toFixed(2);
      }
      if (v && v.trim()) {
        filled++;
        return { ...r, value: v };
      }
      return r;
    });
    setRows(next);
    toast({ title: `✨ Auto-fill: ${filled} ta parametr to'ldirildi` });
  };

  const handleSaveResults = async () => {
    if (!selectedOrder) {
      toast({ title: "Buyurtmani tanlang", variant: "destructive" });
      return;
    }
    const valid = rows.filter((r) => r.parameter_name);
    if (valid.length === 0) {
      toast({ title: "Natijalar kiritilmagan", variant: "destructive" });
      return;
    }
    const payload = valid.map((r) => ({
      center_id: centerId,
      order_id: selectedOrder,
      parameter_name: r.parameter_name,
      value: r.value || null,
      unit: r.unit || null,
      reference_min: r.reference_min || null,
      reference_max: r.reference_max || null,
      status: r.value ? computeStatus(r.value, r.reference_min, r.reference_max) : "normal",
    }));
    const { error } = await supabase.from("diagnostics_lab_results" as any).insert(payload as any);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      return;
    }
    // Buyurtmani completed ga o'tkazish va tasdiqlashga yuborish
    await supabase
      .from("diagnostics_lab_orders" as any)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        approval_status: "pending",
        approved_by: null,
        approved_at: null,
        approval_note: null,
      } as any)
      .eq("id", selectedOrder);

    toast({ title: "✅ Saqlandi", description: "Natijalar tasdiqlash uchun yuborildi" });
    setRows([]);
    setSelectedOrder("");
    setSelectedTemplate("");
    onReload();
  };

  // Tasdiqlash / rad etish
  const submitApproval = async (status: "approved" | "rejected") => {
    if (!viewOrderId) return;
    if (status === "rejected" && !approvalNote.trim()) {
      toast({ title: "Rad etish uchun izoh majburiy", variant: "destructive" });
      return;
    }
    const note = approvalNote.trim() || null;
    const name = approverName.trim() || user?.email || "Tasdiqlovchi";

    const { error: e1 } = await supabase.from("diagnostics_lab_orders" as any).update({
      approval_status: status,
      approved_by: user?.id || null,
      approved_at: new Date().toISOString(),
      approval_note: note,
    } as any).eq("id", viewOrderId);
    if (e1) { toast({ title: "Xatolik", description: e1.message, variant: "destructive" }); return; }

    await supabase.from("diagnostics_result_approvals" as any).insert({
      clinic_id: centerId,
      order_id: viewOrderId,
      approver_id: user?.id || null,
      approver_name: name,
      status,
      note,
    });

    toast({ title: status === "approved" ? "✅ Tasdiqlandi" : "❌ Rad etildi" });
    setApprovalNote("");
    const { data } = await supabase.from("diagnostics_result_approvals" as any)
      .select("*").eq("order_id", viewOrderId).order("created_at", { ascending: false }) as any;
    setApprovalLogs(data || []);
    onReload();
  };

  // PDF eksport
  const generatePDF = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const orderResults = results.filter((r) => r.order_id === orderId);
    if (orderResults.length === 0) {
      toast({ title: "Natijalar topilmadi", variant: "destructive" });
      return;
    }
    const patient = order.patient_id ? patientMap[order.patient_id] : undefined;
    const service = order.service_id ? serviceMap[order.service_id] : undefined;

    downloadLabReportPDF({
      testName: order.test_name || service?.name || "Diagnostika natijasi",
      testCategory: service?.category || "Lab",
      patientName: patient?.full_name || "—",
      patientPhone: patient?.phone,
      patientDob: patient?.date_of_birth,
      patientGender: patient?.gender,
      orderedAt: order.created_at || new Date().toISOString(),
      completedAt: order.completed_at || new Date().toISOString(),
      results: orderResults.map((r) => ({
        parameter_name: r.parameter_name,
        value: r.value || "—",
        unit: r.unit || "",
        reference_range: `${r.reference_min || "—"} – ${r.reference_max || "—"}`,
        is_abnormal: r.status !== "normal",
      })),
      verificationCode: order.id.slice(0, 8).toUpperCase(),
    });
    toast({ title: "📄 PDF yuklab olindi" });
  };

  // AI tushuntirish (Gemini)
  const explainWithAI = async (orderId: string) => {
    const orderResults = results.filter((r) => r.order_id === orderId);
    if (orderResults.length === 0) {
      toast({ title: "Natijalar yo'q", variant: "destructive" });
      return;
    }
    const order = orders.find((o) => o.id === orderId);
    const patient = order?.patient_id ? patientMap[order.patient_id] : undefined;
    setAiBusy(true);
    setAiOpen(true);
    setAiText("⏳ AI tahlil qilmoqda...");
    try {
      const summary = orderResults
        .map(
          (r) =>
            `${r.parameter_name}: ${r.value} ${r.unit || ""} (norma: ${r.reference_min || "—"}–${
              r.reference_max || "—"
            }) [${r.status}]`
        )
        .join("\n");

      const { data, error } = await supabase.functions.invoke("diag-ai-workflow", {
        body: {
          mode: "explain_results",
          patient_name: patient?.full_name,
          patient_gender: patient?.gender,
          patient_dob: patient?.date_of_birth,
          test_name: order?.test_name || "Lab tekshiruvi",
          results_summary: summary,
        },
      });
      if (error) throw error;
      setAiText(data?.explanation || data?.text || "AI javob bermadi");
    } catch (e: any) {
      // Fallback: oddiy mahalliy xulosa
      const abnormal = orderResults.filter((r) => r.status !== "normal");
      setAiText(
        abnormal.length === 0
          ? "✅ Barcha parametrlar normal diapazonda. Sog'liq holati yaxshi.\n\n⚠️ Bu AI taxmin — to'liq diagnostika uchun shifokorga murojaat qiling."
          : `⚠️ ${abnormal.length} ta parametr norma chegarasidan tashqarida:\n\n${abnormal
              .map((r) => `• ${r.parameter_name}: ${r.value} ${r.unit || ""} (${r.status === "high" ? "yuqori" : "past"})`)
              .join("\n")}\n\nBu ko'rsatkichlar shifokor maslahatini talab qiladi.`
      );
    } finally {
      setAiBusy(false);
    }
  };

  // Filtered orders for list
  const filteredOrders = completedOrders.filter((o) => {
    const p = o.patient_id ? patientMap[o.patient_id]?.full_name?.toLowerCase() : "";
    const okSearch =
      !search ||
      (o.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (p || "").includes(search.toLowerCase());
    const okStatus = !filterStatus || o.status === filterStatus;
    return okSearch && okStatus;
  });

  // Statistika
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: results.length,
      todayCount: results.filter((r) => r.created_at?.slice(0, 10) === today).length,
      abnormal: results.filter((r) => r.status !== "normal").length,
      ready: orders.filter((o) => o.status === "completed").length,
    };
  }, [results, orders]);

  const orderResults = viewOrderId ? results.filter((r) => r.order_id === viewOrderId) : [];

  return (
    <div className="space-y-4">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Bugungi natijalar</p>
            <p className="text-2xl font-bold text-primary">{stats.todayCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Tayyor buyurtmalar</p>
            <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Abnormal qiymatlar</p>
            <p className="text-2xl font-bold text-red-600">{stats.abnormal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Jami parametr</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      <h3 className="font-heading font-bold text-lg text-foreground">Natijalarni kiritish</h3>

      {/* Add/edit form */}
      <Card className="border-primary/30">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Buyurtma *</Label>
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                <option value="">Tanlang...</option>
                {completedOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {orderLabel(o)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Shablon (avtomatik to'ldirish)</Label>
              <select
                value={selectedTemplate}
                onChange={(e) => applyTemplate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                <option value="">Shablondan yuklash...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {rows.length > 0 && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">
                  {rows.filter((r) => r.value).length} / {rows.length} parametr to'ldirilgan
                </p>
                <Button size="sm" variant="secondary" onClick={autoFillEmpty}>
                  <Wand2 className="w-3.5 h-3.5 mr-1" /> Auto-fill (norma o'rtachasi)
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Parametr</TableHead>
                      <TableHead className="w-[110px]">Natija</TableHead>
                      <TableHead className="w-[80px]">Birlik</TableHead>
                      <TableHead className="w-[80px]">Min</TableHead>
                      <TableHead className="w-[80px]">Max</TableHead>
                      <TableHead className="w-[90px]">Holat</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => {
                      const status = r.value
                        ? computeStatus(r.value, r.reference_min, r.reference_max)
                        : null;
                      return (
                        <TableRow
                          key={i}
                          className={status && status !== "normal" ? "bg-red-50 dark:bg-red-950/20" : ""}
                        >
                          <TableCell>
                            <Input
                              value={r.parameter_name}
                              onChange={(e) => {
                                const n = [...rows];
                                n[i].parameter_name = e.target.value;
                                setRows(n);
                              }}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={r.value}
                              placeholder={r.reference_avg || "—"}
                              onChange={(e) => {
                                const n = [...rows];
                                n[i].value = e.target.value;
                                setRows(n);
                              }}
                              className="h-8 font-semibold"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={r.unit}
                              onChange={(e) => {
                                const n = [...rows];
                                n[i].unit = e.target.value;
                                setRows(n);
                              }}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={r.reference_min}
                              onChange={(e) => {
                                const n = [...rows];
                                n[i].reference_min = e.target.value;
                                setRows(n);
                              }}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={r.reference_max}
                              onChange={(e) => {
                                const n = [...rows];
                                n[i].reference_max = e.target.value;
                                setRows(n);
                              }}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            {status === "high" && <Badge variant="destructive" className="text-[10px]">↑ Yuqori</Badge>}
                            {status === "low" && <Badge className="bg-blue-500 text-[10px]">↓ Past</Badge>}
                            {status === "normal" && <Badge variant="outline" className="text-[10px]">✓ Norma</Badge>}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  { parameter_name: "", value: "", unit: "", reference_min: "", reference_max: "", reference_avg: "" },
                ])
              }
            >
              <Plus className="w-4 h-4 mr-1" /> Qator
            </Button>
            {rows.length > 0 && (
              <Button size="sm" onClick={handleSaveResults}>
                <Save className="w-4 h-4 mr-1" /> Saqlash va yakunlash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* RESULTS LIST */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> Natijalar arxivi
          </CardTitle>
          <div className="flex gap-2 flex-wrap mt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Bemor yoki order qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Barcha holat</option>
              <option value="accepted">Qabul qilingan</option>
              <option value="in_progress">Jarayonda</option>
              <option value="completed">Yakunlangan</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Buyurtmalar topilmadi</p>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((o) => {
                const orRes = results.filter((r) => r.order_id === o.id);
                const abn = orRes.filter((r) => r.status !== "normal").length;
                const patient = o.patient_id ? patientMap[o.patient_id] : undefined;
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-accent/30 transition flex-wrap"
                  >
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{o.order_number || o.id.slice(0, 8)}</p>
                        <Badge variant={o.status === "completed" ? "default" : "outline"} className="text-[10px]">
                          {o.status}
                        </Badge>
                        {abn > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertCircle className="w-3 h-3 mr-1" /> {abn} abnormal
                          </Badge>
                        )}
                        {orRes.length > 0 && abn === 0 && (
                          <Badge className="bg-green-500 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Norma
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {patient?.full_name || "—"} • {orRes.length} parametr •{" "}
                        {o.created_at ? new Date(o.created_at).toLocaleDateString("uz") : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setViewOrderId(o.id)}>
                        <FileText className="w-3.5 h-3.5 mr-1" /> Ko'rish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={orRes.length === 0}
                        onClick={() => generatePDF(o.id)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={orRes.length === 0}
                        onClick={() => explainWithAI(o.id)}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> AI
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View order results dialog */}
      <Dialog open={!!viewOrderId} onOpenChange={() => setViewOrderId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Natijalar tafsiloti</DialogTitle>
          </DialogHeader>
          {orderResults.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Natijalar yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parametr</TableHead>
                  <TableHead>Natija</TableHead>
                  <TableHead>Birlik</TableHead>
                  <TableHead>Norma</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderResults.map((r) => (
                  <TableRow key={r.id} className={r.status !== "normal" ? "bg-red-50 dark:bg-red-950/20" : ""}>
                    <TableCell className="font-medium">{r.parameter_name}</TableCell>
                    <TableCell className="font-bold">{r.value || "—"}</TableCell>
                    <TableCell>{r.unit || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.reference_min || "—"} – {r.reference_max || "—"}
                    </TableCell>
                    <TableCell>
                      {r.status === "high" && <Badge variant="destructive" className="text-[10px]">↑ Yuqori</Badge>}
                      {r.status === "low" && <Badge className="bg-blue-500 text-[10px]">↓ Past</Badge>}
                      {(r.status === "normal" || !r.status) && (
                        <Badge variant="outline" className="text-[10px]">✓ Norma</Badge>
                      )}
                      {r.status === "abnormal" && (
                        <Badge variant="destructive" className="text-[10px]">⚠ Norma emas</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {viewOrderId && orderResults.length > 0 && (
            <div className="flex gap-2 pt-3 border-t">
              <Button size="sm" onClick={() => generatePDF(viewOrderId)}>
                <Download className="w-3.5 h-3.5 mr-1" /> PDF yuklab olish
              </Button>
              <Button size="sm" variant="outline" onClick={() => explainWithAI(viewOrderId)}>
                <Sparkles className="w-3.5 h-3.5 mr-1" /> AI tushuntirish
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> AI tushuntirish
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <pre className="whitespace-pre-wrap text-sm font-sans bg-muted/50 rounded-lg p-3">
              {aiText || (aiBusy ? "⏳ Yuklanmoqda..." : "")}
            </pre>
            <p className="text-[10px] text-muted-foreground italic">
              ⚠️ AI tushuntirish — informatsion maqsadda. To'liq tashxis uchun shifokor maslahati zarur.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagResults;
