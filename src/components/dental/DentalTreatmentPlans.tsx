import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { Plus, CheckCircle, Clock, Play, ChevronRight, CreditCard, FileText, X, TrendingUp, DollarSign, BarChart3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  patients: any[];
  treatments: any[];
  clinicId: string;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Kutilmoqda", icon: Clock, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
  "in-progress": { label: "Jarayonda", icon: Play, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  partial: { label: "Qisman to'langan", icon: CreditCard, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30" },
  paid: { label: "To'langan", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  completed: { label: "Tugallandi", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
};

const DentalTreatmentPlans = ({ patients, treatments, clinicId }: Props) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [planTab, setPlanTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const [createForm, setCreateForm] = useState({ plan_name: "", patient_id: "", doctor_name: "", notes: "" });
  const [addStepForm, setAddStepForm] = useState({ name: "", doctor_name: "", cost: "", tooth_number: "" });
  const [showAddStep, setShowAddStep] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", payment_method: "cash", notes: "" });

  const fetchPlans = useCallback(async () => {
    const { data } = await supabase
      .from("dental_treatment_plans")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });
    setPlans(data || []);
    setLoading(false);
  }, [clinicId]);

  const fetchSteps = useCallback(async (planId: string) => {
    const { data } = await supabase
      .from("dental_treatment_steps")
      .select("*")
      .eq("plan_id", planId)
      .order("step_order", { ascending: true });
    setSteps(data || []);
  }, []);

  const fetchPayments = useCallback(async (planId: string) => {
    const { data } = await supabase
      .from("dental_plan_payments")
      .select("*")
      .eq("plan_id", planId)
      .order("created_at", { ascending: false });
    setPayments(data || []);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  useEffect(() => {
    if (selectedPlan) {
      fetchSteps(selectedPlan.id);
      fetchPayments(selectedPlan.id);
    }
  }, [selectedPlan, fetchSteps, fetchPayments]);

  const handleCreatePlan = async () => {
    if (!createForm.plan_name || !createForm.patient_id) {
      toast({ title: "Kurs nomi va bemor tanlang", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("dental_treatment_plans").insert({
      clinic_id: clinicId,
      patient_id: createForm.patient_id,
      plan_name: createForm.plan_name,
      doctor_name: createForm.doctor_name || null,
      notes: createForm.notes || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ action: "create", entity_type: "dental_treatment_plan", module: "dental", details: { name: createForm.plan_name } });
    toast({ title: "Kurs yaratildi ✅" });
    setCreateForm({ plan_name: "", patient_id: "", doctor_name: "", notes: "" });
    setShowCreate(false);
    fetchPlans();
  };

  const handleAddStep = async () => {
    if (!addStepForm.name || !selectedPlan) return;
    const cost = Number(addStepForm.cost) || 0;
    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.step_order || 0)) : 0;
    const { error } = await supabase.from("dental_treatment_steps").insert({
      plan_id: selectedPlan.id,
      clinic_id: clinicId,
      name: addStepForm.name,
      doctor_name: addStepForm.doctor_name || null,
      cost,
      tooth_number: addStepForm.tooth_number ? Number(addStepForm.tooth_number) : null,
      step_order: maxOrder + 1,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    // Update total_cost
    await supabase.from("dental_treatment_plans").update({ total_cost: (selectedPlan.total_cost || 0) + cost } as any).eq("id", selectedPlan.id);
    toast({ title: "Bosqich qo'shildi ✅" });
    setAddStepForm({ name: "", doctor_name: "", cost: "", tooth_number: "" });
    setShowAddStep(false);
    fetchSteps(selectedPlan.id);
    fetchPlans();
  };

  const handleStepStatus = async (stepId: string, newStatus: string) => {
    await supabase.from("dental_treatment_steps").update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    } as any).eq("id", stepId);
    toast({ title: newStatus === "completed" ? "Bosqich tugallandi ✅" : "Status yangilandi" });
    fetchSteps(selectedPlan.id);
  };

  const handleDeleteStep = async (stepId: string, cost: number) => {
    await supabase.from("dental_treatment_steps").delete().eq("id", stepId);
    await supabase.from("dental_treatment_plans").update({ total_cost: Math.max(0, (selectedPlan.total_cost || 0) - cost) } as any).eq("id", selectedPlan.id);
    toast({ title: "Bosqich o'chirildi" });
    fetchSteps(selectedPlan.id);
    fetchPlans();
  };

  const handleAddPayment = async () => {
    const amount = Number(payForm.amount);
    if (!amount || amount <= 0 || !selectedPlan) {
      toast({ title: "Summa kiriting", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("dental_plan_payments").insert({
      plan_id: selectedPlan.id,
      clinic_id: clinicId,
      amount,
      payment_method: payForm.payment_method,
      notes: payForm.notes || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    // Also create transaction record
    const patient = patients.find(p => p.id === selectedPlan.patient_id);
    await supabase.from("dental_transactions").insert({
      clinic_id: clinicId,
      patient_id: selectedPlan.patient_id,
      total_amount: amount,
      paid_amount: amount,
      payment_method: payForm.payment_method,
      status: "paid",
      items: [{ name: selectedPlan.plan_name, price: amount }],
      notes: `Davolash kursi to'lovi: ${selectedPlan.plan_name}`,
    } as any);
    toast({ title: "To'lov qo'shildi ✅" });
    setPayForm({ amount: "", payment_method: "cash", notes: "" });
    fetchPayments(selectedPlan.id);
    fetchPlans();
    // Refresh selected plan
    const { data: updated } = await supabase.from("dental_treatment_plans").select("*").eq("id", selectedPlan.id).single();
    if (updated) setSelectedPlan(updated);
  };

  const getPatientName = (pid: string) => patients.find(p => p.id === pid)?.full_name || "Noma'lum";
  const getProgress = (plan: any) => {
    const planSteps = steps.filter(s => s.plan_id === plan.id);
    if (planSteps.length === 0) return 0;
    return Math.round((planSteps.filter(s => s.status === "completed").length / planSteps.length) * 100);
  };

  // DETAIL VIEW
  if (selectedPlan) {
    const progress = steps.length > 0 ? Math.round((steps.filter(s => s.status === "completed").length / steps.length) * 100) : 0;
    const debt = (selectedPlan.total_cost || 0) - (selectedPlan.paid_amount || 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedPlan(null); setPlanTab("overview"); setShowAddStep(false); }}>
            <X className="w-4 h-4 mr-1" /> Orqaga
          </Button>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-foreground">{selectedPlan.plan_name}</h2>
            <p className="text-sm text-muted-foreground">{getPatientName(selectedPlan.patient_id)} • {selectedPlan.created_at?.split("T")[0]}</p>
          </div>
          <Badge className={statusConfig[selectedPlan.status]?.color || statusConfig.pending.color}>
            {statusConfig[selectedPlan.status]?.label || selectedPlan.status}
          </Badge>
        </div>

        <Tabs value={planTab} onValueChange={setPlanTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="steps">Bosqichlar</TabsTrigger>
            <TabsTrigger value="payments">To'lov</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-foreground">Umumiy progress</p>
                  <p className="text-lg font-bold text-primary">{progress}%</p>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div className="bg-primary rounded-full h-4 transition-all flex items-center justify-center" style={{ width: `${progress}%` }}>
                    {progress > 20 && <span className="text-[10px] text-primary-foreground font-bold">{progress}%</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Jami summa", value: (selectedPlan.total_cost || 0).toLocaleString(), color: "text-foreground" },
                  { label: "To'langan", value: (selectedPlan.paid_amount || 0).toLocaleString(), color: "text-green-600" },
                  { label: "Qarz", value: debt.toLocaleString(), color: "text-red-600" },
                  { label: "Bosqichlar", value: `${steps.filter(s => s.status === "completed").length}/${steps.length}`, color: "text-blue-600" },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button onClick={() => { setPlanTab("steps"); setShowAddStep(true); }}><Plus className="w-4 h-4 mr-1" /> Step qo'shish</Button>
                <Button variant="outline" onClick={() => setPlanTab("payments")}><CreditCard className="w-4 h-4 mr-1" /> To'lov</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="steps">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-foreground">Davolash bosqichlari ({steps.length})</h3>
                <Button size="sm" onClick={() => setShowAddStep(!showAddStep)}><Plus className="w-4 h-4 mr-1" /> Yangi step</Button>
              </div>
              {showAddStep && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Step nomi *" value={addStepForm.name} onChange={e => setAddStepForm(p => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Shifokor" value={addStepForm.doctor_name} onChange={e => setAddStepForm(p => ({ ...p, doctor_name: e.target.value }))} />
                    <Input type="number" placeholder="Narx (so'm)" value={addStepForm.cost} onChange={e => setAddStepForm(p => ({ ...p, cost: e.target.value }))} />
                    <Input type="number" placeholder="Tish raqami" value={addStepForm.tooth_number} onChange={e => setAddStepForm(p => ({ ...p, tooth_number: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddStep}>Qo'shish</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddStep(false)}>Bekor</Button>
                  </div>
                </div>
              )}
              <div className="relative">
                {steps.map((step, i) => {
                  const cfg = statusConfig[step.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  const isLast = i === steps.length - 1;
                  return (
                    <div key={step.id} className="flex gap-4 relative">
                      {!isLast && <div className="absolute left-5 top-10 w-0.5 h-full bg-border" />}
                      <div className={cn("relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0", cfg.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className={cn("flex-1 pb-6", !isLast && "border-b border-border")}>
                        <div className="bg-card rounded-xl border border-border p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{step.step_order}. {step.name}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {step.doctor_name && <span className="text-xs text-muted-foreground">👨‍⚕️ {step.doctor_name}</span>}
                                {step.tooth_number && <span className="text-xs text-muted-foreground">🦷 #{step.tooth_number}</span>}
                                {step.completed_at && <span className="text-xs text-muted-foreground">📅 {step.completed_at.split("T")[0]}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                              <p className="text-sm font-bold text-foreground mt-1">{(step.cost || 0).toLocaleString()} so'm</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            {step.status === "pending" && <Button size="sm" variant="outline" className="text-blue-600" onClick={() => handleStepStatus(step.id, "in-progress")}><Play className="w-3 h-3 mr-1" /> Boshlash</Button>}
                            {step.status === "in-progress" && <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStepStatus(step.id, "completed")}><CheckCircle className="w-3 h-3 mr-1" /> Tugatish</Button>}
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteStep(step.id, step.cost || 0)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {steps.length === 0 && <p className="text-center py-8 text-muted-foreground">Bosqichlar yo'q. "Yangi step" tugmasini bosing.</p>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Jami</p>
                  <p className="text-lg font-bold text-foreground">{(selectedPlan.total_cost || 0).toLocaleString()}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 p-4 text-center">
                  <p className="text-xs text-green-600">To'langan</p>
                  <p className="text-lg font-bold text-green-700">{(selectedPlan.paid_amount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 p-4 text-center">
                  <p className="text-xs text-red-600">Qarz</p>
                  <p className="text-lg font-bold text-red-700">{debt.toLocaleString()}</p>
                </div>
              </div>
              {selectedPlan.total_cost > 0 && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">To'lov jarayoni</span>
                    <span className="font-bold text-foreground">{Math.round(((selectedPlan.paid_amount || 0) / selectedPlan.total_cost) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-green-500 rounded-full h-3 transition-all" style={{ width: `${((selectedPlan.paid_amount || 0) / selectedPlan.total_cost) * 100}%` }} />
                  </div>
                </div>
              )}

              {debt > 0 && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
                  <h4 className="font-medium text-foreground">💳 To'lov qilish</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input type="number" placeholder="Summa *" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
                    <Select value={payForm.payment_method} onValueChange={v => setPayForm(p => ({ ...p, payment_method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Naqd</SelectItem>
                        <SelectItem value="card">💳 Karta</SelectItem>
                        <SelectItem value="click">📱 Click</SelectItem>
                        <SelectItem value="payme">📱 Payme</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Izoh" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <Button onClick={handleAddPayment}><CreditCard className="w-4 h-4 mr-1" /> To'lov qo'shish</Button>
                </div>
              )}

              {/* Payment history */}
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">To'lovlar tarixi</h4>
                {payments.map(p => (
                  <div key={p.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{Number(p.amount).toLocaleString()} so'm</p>
                      <p className="text-xs text-muted-foreground">{p.created_at?.split("T")[0]} • {p.payment_method}</p>
                    </div>
                    <Badge variant="outline" className="text-green-600">✅ To'landi</Badge>
                  </div>
                ))}
                {payments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">To'lovlar yo'q</p>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground">Davolash timelini</h3>
              <div className="bg-card rounded-xl border border-border p-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      step.status === "completed" ? "bg-green-500 text-white" :
                      step.status === "in-progress" ? "bg-blue-500 text-white" :
                      "bg-muted text-muted-foreground"
                    )}>{step.step_order}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", step.status === "completed" ? "text-muted-foreground line-through" : "text-foreground")}>{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.completed_at?.split("T")[0] || "Belgilanmagan"}</p>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{(step.cost || 0).toLocaleString()}</p>
                  </div>
                ))}
                {steps.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Bosqichlar yo'q</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // LIST VIEW
  const filteredPlans = plans.filter(p => filterStatus === "all" || p.status === filterStatus);
  const totalRevenue = plans.reduce((a, p) => a + (p.paid_amount || 0), 0);
  const totalDebt = plans.reduce((a, p) => a + ((p.total_cost || 0) - (p.paid_amount || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📋 Davolash kurslari</h2>
        <Button onClick={() => setShowCreate(!showCreate)}><Plus className="w-4 h-4 mr-1" /> Yangi kurs</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Barchasi" },
          { key: "in-progress", label: "🔄 Jarayonda" },
          { key: "completed", label: "✅ Tugallangan" },
          { key: "pending", label: "⏳ Kutilmoqda" },
        ].map(f => (
          <Button key={f.key} size="sm" variant={filterStatus === f.key ? "default" : "outline"} onClick={() => setFilterStatus(f.key)}>{f.label}</Button>
        ))}
      </div>

      {showCreate && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-foreground">Yangi davolash kursi</h3>
          <Input placeholder="Kurs nomi (masalan: Implantatsiya)" value={createForm.plan_name} onChange={e => setCreateForm(p => ({ ...p, plan_name: e.target.value }))} />
          <Select value={createForm.patient_id} onValueChange={v => setCreateForm(p => ({ ...p, patient_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
            <SelectContent>
              {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Shifokor (ixtiyoriy)" value={createForm.doctor_name} onChange={e => setCreateForm(p => ({ ...p, doctor_name: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={handleCreatePlan}>Yaratish</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami kurslar", value: plans.length, icon: BarChart3, color: "text-primary" },
          { label: "Jarayonda", value: plans.filter(p => p.status === "in-progress" || p.status === "partial").length, icon: Play, color: "text-blue-600" },
          { label: "Daromad", value: `${(totalRevenue / 1000000).toFixed(1)}M`, icon: TrendingUp, color: "text-green-600" },
          { label: "Qarzdorlik", value: `${(totalDebt / 1000000).toFixed(1)}M`, icon: DollarSign, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
      ) : filteredPlans.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Kurslar topilmadi</p>
      ) : (
        filteredPlans.map(plan => {
          const cfg = statusConfig[plan.status] || statusConfig.pending;
          const debt = (plan.total_cost || 0) - (plan.paid_amount || 0);
          const payPercent = plan.total_cost > 0 ? Math.round(((plan.paid_amount || 0) / plan.total_cost) * 100) : 0;
          return (
            <div key={plan.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPlan(plan)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{plan.plan_name}</p>
                    <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{getPatientName(plan.patient_id)} • {plan.created_at?.split("T")[0]}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-foreground">{(plan.total_cost || 0).toLocaleString()} so'm</p>
                  {debt > 0 && <p className="text-xs text-red-500">Qarz: {debt.toLocaleString()}</p>}
                  <ChevronRight className="w-5 h-5 text-muted-foreground mt-1 ml-auto" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-2.5">
                  <div className="bg-green-500 rounded-full h-2.5 transition-all" style={{ width: `${payPercent}%` }} />
                </div>
                <span className="text-xs font-bold text-green-600">{payPercent}%</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default DentalTreatmentPlans;
