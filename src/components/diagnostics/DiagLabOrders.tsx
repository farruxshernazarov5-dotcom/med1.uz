import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Plus, X, Save, FlaskConical, CheckCircle, Clock, XCircle,
  Search, Sparkles, ScanLine, Image as ImageIcon, AlertTriangle, Activity,
} from "lucide-react";

interface Patient { id: string; full_name: string; phone: string; }
interface Service { id: string; name: string; price: number; category: string; }
interface Staff { id: string; full_name: string; role: string; specialization?: string | null; is_on_duty?: boolean | null; is_active?: boolean; }
interface LabOrder {
  id: string; order_number: string; patient_id: string; service_id: string | null;
  doctor_name: string | null; status: string; priority: string; total_price: number;
  notes: string | null; created_at: string;
  assigned_staff_id?: string | null; order_type?: string | null;
  accepted_at?: string | null; started_at?: string | null; completed_at?: string | null;
  expected_completion_at?: string | null; payment_status?: string | null;
}

interface Props {
  centerId: string;
  orders: LabOrder[];
  patients: Patient[];
  services: Service[];
  staff?: Staff[];
  onReload: () => void;
}

const STATUS_FLOW: Record<string, { label: string; next?: string; color: string; icon: any }> = {
  pending: { label: "Yangi", next: "accepted", color: "bg-slate-500/15 text-slate-700", icon: Clock },
  accepted: { label: "Qabul", next: "in_progress", color: "bg-blue-500/15 text-blue-700", icon: CheckCircle },
  in_progress: { label: "Jarayonda", next: "completed", color: "bg-amber-500/15 text-amber-700", icon: Activity },
  completed: { label: "Tayyor", color: "bg-emerald-500/15 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "Bekor", color: "bg-red-500/15 text-red-700", icon: XCircle },
};

const ORDER_TYPES = [
  { value: "lab", label: "Laboratoriya", icon: FlaskConical },
  { value: "radiology", label: "Radiologiya", icon: ImageIcon },
  { value: "functional", label: "Funksional", icon: Activity },
];

const initialForm = {
  patient_id: "", service_id: "", doctor_name: "",
  priority: "normal", notes: "", order_type: "lab",
  assigned_staff_id: "",
};

const DiagLabOrders = ({ centerId, orders, patients, services, staff = [], onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [aiBusy, setAiBusy] = useState(false);

  const stats = useMemo(() => ({
    new: orders.filter((o) => o.status === "pending").length,
    inProgress: orders.filter((o) => o.status === "in_progress" || o.status === "accepted").length,
    completed: orders.filter((o) => o.status === "completed").length,
    overdue: orders.filter((o) =>
      o.expected_completion_at && o.status !== "completed" && o.status !== "cancelled" &&
      new Date(o.expected_completion_at) < new Date()
    ).length,
  }), [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const p = patients.find((x) => x.id === o.patient_id);
      const matchSearch = !search ||
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        (p?.full_name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const matchType = filterType === "all" || (o.order_type || "lab") === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [orders, patients, search, filterStatus, filterType]);

  const handleSave = async () => {
    if (!form.patient_id) { toast({ title: "Bemorni tanlang", variant: "destructive" }); return; }
    const svc = services.find((s) => s.id === form.service_id);
    const expected = new Date();
    expected.setHours(expected.getHours() + (form.priority === "urgent" ? 2 : form.priority === "critical" ? 1 : 24));

    const { data, error } = await supabase.from("diagnostics_lab_orders" as any).insert({
      center_id: centerId, patient_id: form.patient_id,
      service_id: form.service_id || null, doctor_name: form.doctor_name || null,
      priority: form.priority, notes: form.notes || null,
      total_price: svc?.price || 0,
      order_type: form.order_type,
      assigned_staff_id: form.assigned_staff_id || null,
      expected_completion_at: expected.toISOString(),
    } as any).select().single() as any;

    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }

    // Auto-create radiology study record for radiology orders
    if (form.order_type === "radiology" && data?.id) {
      await supabase.from("diagnostics_radiology_studies" as any).insert({
        center_id: centerId,
        order_id: data.id,
        modality: svc?.category?.toUpperCase() || "UZI",
        body_part: svc?.name || null,
      } as any);
    }

    // Notify assigned staff
    if (form.assigned_staff_id && data?.id) {
      await supabase.from("diagnostics_notifications" as any).insert({
        center_id: centerId,
        staff_id: form.assigned_staff_id,
        type: "new_order",
        title: "Yangi buyurtma biriktirildi",
        body: `Buyurtma ${data.order_number}`,
        related_order_id: data.id,
      } as any);
    }

    toast({ title: "✅ Buyurtma yaratildi" });
    setShowForm(false); setForm(initialForm);
    onReload();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("diagnostics_lab_orders" as any).update({ status } as any).eq("id", id);
    if (error) { toast({ title: "Xatolik", variant: "destructive" }); return; }
    toast({ title: `Holat: ${STATUS_FLOW[status]?.label}` });
    onReload();
  };

  const assignStaff = async (orderId: string, staffId: string) => {
    await supabase.from("diagnostics_lab_orders" as any).update({ assigned_staff_id: staffId } as any).eq("id", orderId);
    await supabase.from("diagnostics_notifications" as any).insert({
      center_id: centerId, staff_id: staffId, type: "assigned",
      title: "Buyurtma biriktirildi", related_order_id: orderId,
    } as any);
    toast({ title: "Xodimga biriktirildi" });
    onReload();
  };

  const createSample = async (orderId: string) => {
    const { error } = await supabase.from("diagnostics_samples" as any).insert({
      center_id: centerId, order_id: orderId, status: "collected",
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "🧫 Sample yaratildi" });
  };

  const aiAutoAssign = async () => {
    const unassigned = orders.filter((o) =>
      !o.assigned_staff_id && (o.status === "pending" || o.status === "accepted")
    );
    if (unassigned.length === 0) { toast({ title: "Biriktirilmagan buyurtma yo'q" }); return; }

    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("diag-ai-workflow", {
        body: {
          action: "auto_assign",
          orders: unassigned.map((o) => ({
            id: o.id, type: o.order_type || "lab", priority: o.priority,
            service: services.find((s) => s.id === o.service_id)?.name,
          })),
          staff: staff.filter((s) => s.is_active !== false).map((s) => ({
            id: s.id, role: s.role, specialization: s.specialization, on_duty: s.is_on_duty,
          })),
        },
      });
      if (error) throw error;

      const assignments: Array<{ order_id: string; staff_id: string }> = data?.assignments || [];
      for (const a of assignments) {
        await supabase.from("diagnostics_lab_orders" as any).update({ assigned_staff_id: a.staff_id } as any).eq("id", a.order_id);
      }
      toast({ title: `🤖 ${assignments.length} ta buyurtma avtomatik taqsimlandi` });
      onReload();
    } catch (e: any) {
      toast({ title: "AI xatolik", description: e.message || "Xatolik", variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };

  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.full_name || "—";
  const getServiceName = (id: string | null) => services.find((s) => s.id === id)?.name || "—";
  const getStaffName = (id: string | null | undefined) => id ? (staff.find((s) => s.id === id)?.full_name || "—") : null;
  const isOverdue = (o: LabOrder) => o.expected_completion_at && o.status !== "completed" && o.status !== "cancelled" && new Date(o.expected_completion_at) < new Date();

  return (
    <div className="space-y-4">
      {/* Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <Clock className="w-5 h-5 text-slate-500 mb-1" />
          <p className="text-2xl font-bold">{stats.new}</p>
          <p className="text-xs text-muted-foreground">Yangi</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Activity className="w-5 h-5 text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{stats.inProgress}</p>
          <p className="text-xs text-muted-foreground">Jarayonda</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <CheckCircle className="w-5 h-5 text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Tayyor</p>
        </CardContent></Card>
        <Card className={stats.overdue > 0 ? "border-red-500/40" : ""}><CardContent className="p-4">
          <AlertTriangle className={`w-5 h-5 mb-1 ${stats.overdue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          <p className="text-2xl font-bold">{stats.overdue}</p>
          <p className="text-xs text-muted-foreground">Kechikkan</p>
        </CardContent></Card>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h3 className="font-heading font-bold text-lg text-foreground">Buyurtmalar</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={aiAutoAssign} disabled={aiBusy}>
            <Sparkles className="w-4 h-4 mr-1" /> {aiBusy ? "AI..." : "AI Auto-Assign"}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Bemor / ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">Barcha statuslar</option>
          {Object.entries(STATUS_FLOW).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">Barcha turlar</option>
          {ORDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Yangi buyurtma</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Bemor *</Label>
                <select value={form.patient_id} onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang...</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name} — {p.phone}</option>)}
                </select>
              </div>
              <div>
                <Label>Buyurtma turi</Label>
                <select value={form.order_type} onChange={(e) => setForm((p) => ({ ...p, order_type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  {ORDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Xizmat</Label>
                <select value={form.service_id} onChange={(e) => setForm((p) => ({ ...p, service_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Tanlang...</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.price.toLocaleString()} so'm</option>)}
                </select>
              </div>
              <div>
                <Label>Xodim biriktirish</Label>
                <select value={form.assigned_staff_id} onChange={(e) => setForm((p) => ({ ...p, assigned_staff_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Avtomatik / keyinroq</option>
                  {staff.filter((s) => s.is_active !== false).map((s) =>
                    <option key={s.id} value={s.id}>{s.full_name} ({s.role}{s.is_on_duty ? " • Ishda" : ""})</option>
                  )}
                </select>
              </div>
              <div><Label>Shifokor</Label><Input value={form.doctor_name} onChange={(e) => setForm((p) => ({ ...p, doctor_name: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>Muhimlik</Label>
                <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="normal">Oddiy (24s)</option>
                  <option value="urgent">Shoshilinch (2s)</option>
                  <option value="critical">Juda muhim (1s)</option>
                </select>
              </div>
            </div>
            <div><Label>Izoh</Label><Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="mt-1" /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Yaratish</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />
          {orders.length === 0 ? "Buyurtmalar yo'q" : "Topilmadi"}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const st = STATUS_FLOW[o.status] || STATUS_FLOW.pending;
            const StatusIcon = st.icon;
            const overdue = isOverdue(o);
            const type = ORDER_TYPES.find((t) => t.value === (o.order_type || "lab"));
            const TypeIcon = type?.icon || FlaskConical;
            return (
              <Card key={o.id} className={overdue ? "border-red-500/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground">{o.order_number}</span>
                        <Badge className={`${st.color} text-[10px]`}><StatusIcon className="w-3 h-3 mr-0.5" />{st.label}</Badge>
                        {o.priority === "urgent" && <Badge className="bg-amber-500/15 text-amber-700 text-[10px]">Shoshilinch</Badge>}
                        {o.priority === "critical" && <Badge className="bg-red-500/15 text-red-700 text-[10px]">Juda muhim</Badge>}
                        {overdue && <Badge className="bg-red-500/15 text-red-700 text-[10px]"><AlertTriangle className="w-3 h-3 mr-0.5" />Kechikdi</Badge>}
                      </div>
                      <p className="font-medium text-foreground">{getPatientName(o.patient_id)}</p>
                      <p className="text-sm text-muted-foreground">{getServiceName(o.service_id)}</p>
                      {o.doctor_name && <p className="text-xs text-muted-foreground mt-1">👨‍⚕️ {o.doctor_name}</p>}
                      {getStaffName(o.assigned_staff_id) && <p className="text-xs text-primary mt-1">🧑‍🔬 {getStaffName(o.assigned_staff_id)}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-semibold text-primary">{o.total_price?.toLocaleString()} so'm</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 min-w-[120px]">
                      {!o.assigned_staff_id && staff.length > 0 && (
                        <select onChange={(e) => e.target.value && assignStaff(o.id, e.target.value)} defaultValue=""
                          className="h-7 text-xs rounded border border-input bg-background px-1">
                          <option value="">Biriktirish...</option>
                          {staff.filter((s) => s.is_active !== false).map((s) =>
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                          )}
                        </select>
                      )}
                      {st.next && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(o.id, st.next!)}>
                          → {STATUS_FLOW[st.next!].label}
                        </Button>
                      )}
                      {(o.order_type === "lab" || !o.order_type) && o.status !== "pending" && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => createSample(o.id)}>
                          <ScanLine className="w-3 h-3 mr-1" /> Sample
                        </Button>
                      )}
                      {o.status === "pending" && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => updateStatus(o.id, "cancelled")}>
                          <XCircle className="w-3 h-3 mr-1" /> Bekor
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiagLabOrders;
