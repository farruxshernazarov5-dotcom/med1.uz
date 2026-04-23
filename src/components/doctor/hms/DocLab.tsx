import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Plus, FlaskConical, Send, X, Search, FileCheck2, Stethoscope,
  Clock, CheckCircle2, AlertCircle, ExternalLink,
} from "lucide-react";
import TemplatePicker from "./TemplatePicker";
import { LAB_TEMPLATES, LAB_CATEGORIES, DIAGNOSIS_TEMPLATES, DIAG_CATEGORIES } from "./emrTemplates";

interface Props { doctorId: string }

const COMMON_TESTS = [
  "Umumiy qon tahlili (CBC)", "Qand", "Xolesterin", "Kreatinin",
  "TTG", "T3/T4", "AST/ALT", "Umumiy siydik",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Kutilmoqda", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  sent: { label: "Yuborilgan", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  in_progress: { label: "Bajarilmoqda", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  completed: { label: "Natija tayyor", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  reviewed: { label: "Ko'rib chiqilgan", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  cancelled: { label: "Bekor qilingan", color: "bg-muted text-muted-foreground" },
};

type TabKey = "all" | "pending" | "in_progress" | "completed" | "urgent";

const DocLab = ({ doctorId }: Props) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_id: "", tests: [] as string[], clinical_info: "", urgency: "normal",
  });
  const [newTest, setNewTest] = useState("");

  // Result entry modal
  const [resultOpen, setResultOpen] = useState(false);
  const [resultOrder, setResultOrder] = useState<any>(null);
  const [resultForm, setResultForm] = useState({ result_notes: "", result_url: "" });

  // Diagnosis link modal
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagOrder, setDiagOrder] = useState<any>(null);
  const [diagForm, setDiagForm] = useState({
    diagnosis: "", icd_code: "", symptoms: "", notes: "",
  });

  // Filters
  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");

  const load = async () => {
    const [o, p] = await Promise.all([
      supabase
        .from("doctor_lab_orders")
        .select("*, doctor_patients(id, full_name, phone)")
        .eq("doctor_id", doctorId)
        .order("ordered_at", { ascending: false }),
      supabase.from("doctor_patients").select("id, full_name").eq("doctor_id", doctorId),
    ]);
    setOrders(o.data || []);
    setPatients(p.data || []);
  };
  useEffect(() => { load(); }, [doctorId]);

  // ───── helpers
  const addTest = (t: string) => {
    const v = t.trim();
    if (!v || form.tests.includes(v)) return;
    setForm({ ...form, tests: [...form.tests, v] });
    setNewTest("");
  };

  const sendOrder = async () => {
    if (!form.patient_id || form.tests.length === 0) {
      toast({ title: "Bemor va kamida 1 ta tahlil tanlang", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("doctor_lab_orders").insert({
      doctor_id: doctorId,
      patient_id: form.patient_id,
      test_types: form.tests,
      clinical_info: form.clinical_info,
      urgency: form.urgency,
      status: "sent",
    });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Lab buyurtmasi yuborildi" });
      setOpen(false);
      setForm({ patient_id: "", tests: [], clinical_info: "", urgency: "normal" });
      load();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("doctor_lab_orders")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    load();
  };

  const openResult = (o: any) => {
    setResultOrder(o);
    setResultForm({ result_notes: o.result_notes || "", result_url: o.result_url || "" });
    setResultOpen(true);
  };

  const saveResult = async () => {
    if (!resultOrder) return;
    const { error } = await supabase
      .from("doctor_lab_orders")
      .update({
        result_notes: resultForm.result_notes,
        result_url: resultForm.result_url || null,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", resultOrder.id);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Natija saqlandi" });
      setResultOpen(false);
      load();
    }
  };

  const openDiagFromLab = (o: any) => {
    setDiagOrder(o);
    setDiagForm({
      diagnosis: "",
      icd_code: "",
      symptoms: o.clinical_info || "",
      notes: o.result_notes ? `Lab natijasi: ${o.result_notes}` : "",
    });
    setDiagOpen(true);
  };

  const saveDiagnosis = async () => {
    if (!diagOrder || !diagForm.diagnosis.trim()) {
      toast({ title: "Tashxis kiriting", variant: "destructive" });
      return;
    }
    const linkedNotes = `[Lab buyurtma #${diagOrder.id.slice(0, 8)}]\n${diagForm.notes}`;
    const { error } = await supabase.from("doctor_records").insert({
      doctor_id: doctorId,
      patient_id: diagOrder.patient_id,
      diagnosis: diagForm.diagnosis,
      icd_code: diagForm.icd_code || null,
      symptoms: diagForm.symptoms,
      notes: linkedNotes,
    });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      // Mark order as reviewed once diagnosis is linked
      await supabase
        .from("doctor_lab_orders")
        .update({ status: "reviewed" })
        .eq("id", diagOrder.id);
      toast({ title: "✅ Tashxis qo'shildi va natijaga ulandi" });
      setDiagOpen(false);
      load();
    }
  };

  // ───── stats
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => ["pending", "sent", "in_progress"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    urgent: orders.filter((o) => o.urgency === "urgent" && o.status !== "reviewed" && o.status !== "cancelled").length,
  }), [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (tab === "pending" && !["pending", "sent"].includes(o.status)) return false;
      if (tab === "in_progress" && o.status !== "in_progress") return false;
      if (tab === "completed" && !["completed", "reviewed"].includes(o.status)) return false;
      if (tab === "urgent" && o.urgency !== "urgent") return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        const name = (o.doctor_patients?.full_name || "").toLowerCase();
        const phone = (o.doctor_patients?.phone || "").toLowerCase();
        const tests = (o.test_types || []).join(" ").toLowerCase();
        if (!name.includes(s) && !phone.includes(s) && !tests.includes(s)) return false;
      }
      return true;
    });
  }, [orders, tab, q]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Laboratoriya — Workflow</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Doctor → Lab → Diagnosis zanjiri</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-secondary to-accent text-white border-0"
        >
          <Send className="w-4 h-4 mr-1" /> Send to Lab
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard icon={FlaskConical} label="Jami buyurtma" value={stats.total} tone="default" />
        <StatCard icon={Clock} label="Kutilmoqda" value={stats.pending} tone="amber" />
        <StatCard icon={CheckCircle2} label="Natija tayyor" value={stats.completed} tone="emerald" />
        <StatCard icon={AlertCircle} label="Shoshilinch" value={stats.urgent} tone="rose" />
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex flex-wrap gap-1.5">
          {([
            ["all", "Hammasi"], ["pending", "Yuborilgan"], ["in_progress", "Bajarilmoqda"],
            ["completed", "Natija"], ["urgent", "Shoshilinch"],
          ] as [TabKey, string][]).map(([k, l]) => (
            <Badge
              key={k}
              variant={tab === k ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTab(k)}
            >
              {l}
            </Badge>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Bemor / telefon / tahlil..."
            className="h-9 pl-7 text-xs"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          {orders.length === 0 ? "Hali lab buyurtmalari yo'q" : "Filterga mos buyurtma topilmadi"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const s = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
            const hasResult = !!(o.result_notes || o.result_url);
            return (
              <div key={o.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {o.doctor_patients?.full_name || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.ordered_at).toLocaleDateString("uz-UZ")} •{" "}
                      {o.urgency === "urgent" ? "🚨 Shoshilinch" : "Oddiy"}
                      {o.doctor_patients?.phone && <> • {o.doctor_patients.phone}</>}
                    </p>
                  </div>
                  <Badge variant="outline" className={s.color}>{s.label}</Badge>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {(o.test_types || []).map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>

                {o.clinical_info && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">Klinik ma'lumot:</span> {o.clinical_info}
                  </p>
                )}

                {hasResult && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">Natija</span>
                    </div>
                    {o.result_notes && (
                      <p className="text-xs text-foreground whitespace-pre-wrap">{o.result_notes}</p>
                    )}
                    {o.result_url && (
                      <a
                        href={o.result_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-secondary hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Faylni ochish
                      </a>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {["sent", "pending"].includes(o.status) && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "in_progress")}>
                      Bajarilmoqda
                    </Button>
                  )}
                  {["sent", "pending", "in_progress"].includes(o.status) && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      onClick={() => openResult(o)}
                    >
                      <FileCheck2 className="w-3.5 h-3.5 mr-1" /> Natija qo'shish
                    </Button>
                  )}
                  {hasResult && o.status !== "reviewed" && (
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white border-0"
                      onClick={() => openDiagFromLab(o)}
                    >
                      <Stethoscope className="w-3.5 h-3.5 mr-1" /> Tashxis qo'yish
                    </Button>
                  )}
                  {hasResult && (
                    <Button size="sm" variant="ghost" onClick={() => openResult(o)}>
                      Tahrirlash
                    </Button>
                  )}
                  {!["cancelled", "completed", "reviewed"].includes(o.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive ml-auto"
                      onClick={() => updateStatus(o.id, "cancelled")}
                    >
                      Bekor qilish
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New order modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-8">
              <DialogTitle>Yangi laboratoriya buyurtmasi</DialogTitle>
              <TemplatePicker
                templates={LAB_TEMPLATES}
                categories={LAB_CATEGORIES}
                label="Tezkor paket"
                preview={(t) => t.tests.slice(0, 3).join(", ") + (t.tests.length > 3 ? "…" : "")}
                onPick={(t) => setForm((p) => ({
                  ...p,
                  tests: Array.from(new Set([...(p.tests || []), ...t.tests])),
                  urgency: t.urgency,
                  clinical_info: t.clinical_info,
                }))}
              />
            </div>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Bemor *</Label>
              <select
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Tanlang...</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Tahlillar *</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_TESTS.map((t) => (
                  <Badge
                    key={t}
                    variant={form.tests.includes(t) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() =>
                      form.tests.includes(t)
                        ? setForm({ ...form, tests: form.tests.filter((x) => x !== t) })
                        : addTest(t)
                    }
                  >
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTest}
                  onChange={(e) => setNewTest(e.target.value)}
                  placeholder="Boshqa tahlil..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTest(newTest))}
                />
                <Button type="button" size="sm" variant="outline" onClick={() => addTest(newTest)}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {form.tests.filter((t) => !COMMON_TESTS.includes(t)).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.tests.filter((t) => !COMMON_TESTS.includes(t)).map((t) => (
                    <Badge key={t} className="text-[10px] gap-1">
                      {t}
                      <button onClick={() => setForm({ ...form, tests: form.tests.filter((x) => x !== t) })}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Shoshilinchlik</Label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="normal">Oddiy</option>
                <option value="urgent">Shoshilinch</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Klinik ma'lumot</Label>
              <Textarea
                rows={2}
                value={form.clinical_info}
                onChange={(e) => setForm({ ...form, clinical_info: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button onClick={sendOrder} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">
              <Send className="w-4 h-4 mr-2" /> Yuborish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result entry modal */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Lab natijasi
            </DialogTitle>
          </DialogHeader>
          {resultOrder && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 text-xs">
                <p className="font-semibold text-foreground">
                  {resultOrder.doctor_patients?.full_name}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(resultOrder.test_types || []).map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Natija matni *</Label>
                <Textarea
                  rows={6}
                  value={resultForm.result_notes}
                  onChange={(e) => setResultForm({ ...resultForm, result_notes: e.target.value })}
                  placeholder="Hb: 13.5 g/dL\nLeykositlar: 6.2 ×10⁹/L\n..."
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Fayl URL (ixtiyoriy)</Label>
                <Input
                  value={resultForm.result_url}
                  onChange={(e) => setResultForm({ ...resultForm, result_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <Button onClick={saveResult} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                Saqlash va tugallash
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diagnosis from lab modal */}
      <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-8">
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-violet-600" />
                Tashxis qo'yish
              </DialogTitle>
              <TemplatePicker
                templates={DIAGNOSIS_TEMPLATES}
                categories={DIAG_CATEGORIES}
                label="Shablon"
                preview={(t) => `${t.icd_code} • ${t.diagnosis}`}
                onPick={(t) => setDiagForm((p) => ({
                  ...p,
                  diagnosis: t.diagnosis,
                  icd_code: t.icd_code,
                  symptoms: p.symptoms || t.symptoms,
                  notes: p.notes ? `${p.notes}\n\n${t.notes}` : t.notes,
                }))}
              />
            </div>
          </DialogHeader>
          {diagOrder && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-xs">
                <p className="text-muted-foreground">Bemor:</p>
                <p className="font-semibold text-foreground">
                  {diagOrder.doctor_patients?.full_name}
                </p>
                {diagOrder.result_notes && (
                  <p className="mt-2 text-foreground line-clamp-3">
                    <span className="font-medium">Natija:</span> {diagOrder.result_notes}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs">Tashxis *</Label>
                  <Input
                    value={diagForm.diagnosis}
                    onChange={(e) => setDiagForm({ ...diagForm, diagnosis: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">ICD-10</Label>
                  <Input
                    value={diagForm.icd_code}
                    onChange={(e) => setDiagForm({ ...diagForm, icd_code: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Simptomlar</Label>
                <Textarea
                  rows={2}
                  value={diagForm.symptoms}
                  onChange={(e) => setDiagForm({ ...diagForm, symptoms: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Izoh</Label>
                <Textarea
                  rows={3}
                  value={diagForm.notes}
                  onChange={(e) => setDiagForm({ ...diagForm, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button onClick={saveDiagnosis} className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0">
                Tashxisni saqlash va natijaga ulash
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({
  icon: Icon, label, value, tone,
}: {
  icon: any; label: string; value: number;
  tone: "default" | "amber" | "emerald" | "rose";
}) => {
  const tones = {
    default: "bg-card text-foreground border-border",
    amber: "bg-amber-500/5 text-amber-700 border-amber-500/20",
    emerald: "bg-emerald-500/5 text-emerald-700 border-emerald-500/20",
    rose: "bg-rose-500/5 text-rose-700 border-rose-500/20",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default DocLab;
