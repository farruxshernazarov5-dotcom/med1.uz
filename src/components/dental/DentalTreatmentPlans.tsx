import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, Clock, Play, ChevronRight, CreditCard, FileText, X, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreatmentStep {
  id: string;
  name: string;
  doctor: string;
  cost: number;
  toothNumber?: number;
  status: "pending" | "in-progress" | "completed";
  order: number;
  date?: string;
  notes?: string;
}

interface TreatmentPlan {
  id: string;
  patientName: string;
  planName: string;
  steps: TreatmentStep[];
  totalCost: number;
  paidAmount: number;
  createdAt: string;
  status: "pending" | "in-progress" | "completed";
}

interface Props {
  patients: any[];
  treatments: any[];
}

const SAMPLE_PLANS: TreatmentPlan[] = [
  {
    id: "1", patientName: "Aliyev Jasur", planName: "Implantatsiya (46-tish)", totalCost: 8500000, paidAmount: 4500000, createdAt: "2026-03-15", status: "in-progress",
    steps: [
      { id: "s1", name: "Konsultatsiya va CT scan", doctor: "Dr. Karimov", cost: 500000, status: "completed", order: 1, toothNumber: 46, date: "2026-03-15" },
      { id: "s2", name: "Suyak tayyorlash", doctor: "Dr. Karimov", cost: 2000000, status: "completed", order: 2, toothNumber: 46, date: "2026-03-20" },
      { id: "s3", name: "Implant o'rnatish", doctor: "Dr. Karimov", cost: 4000000, status: "in-progress", order: 3, toothNumber: 46 },
      { id: "s4", name: "Koronka o'rnatish", doctor: "Dr. Azimov", cost: 2000000, status: "pending", order: 4, toothNumber: 46 },
    ],
  },
  {
    id: "2", patientName: "Rahimova Dilnoza", planName: "Ortodontiya (Breket)", totalCost: 12000000, paidAmount: 6000000, createdAt: "2026-02-01", status: "in-progress",
    steps: [
      { id: "s5", name: "Diagnostika va reja", doctor: "Dr. Sultonov", cost: 1000000, status: "completed", order: 1, date: "2026-02-01" },
      { id: "s6", name: "Breket o'rnatish", doctor: "Dr. Sultonov", cost: 5000000, status: "completed", order: 2, date: "2026-02-10" },
      { id: "s7", name: "Oylik tekshiruv (1-6 oy)", doctor: "Dr. Sultonov", cost: 3000000, status: "in-progress", order: 3 },
      { id: "s8", name: "Breket olib tashlash", doctor: "Dr. Sultonov", cost: 2000000, status: "pending", order: 4 },
      { id: "s9", name: "Reteyner o'rnatish", doctor: "Dr. Sultonov", cost: 1000000, status: "pending", order: 5 },
    ],
  },
  {
    id: "3", patientName: "Toshmatov Rustam", planName: "Ildiz kanali davolash (24-tish)", totalCost: 2500000, paidAmount: 2500000, createdAt: "2026-01-10", status: "completed",
    steps: [
      { id: "s10", name: "Rentgen va diagnostika", doctor: "Dr. Azimov", cost: 300000, status: "completed", order: 1, toothNumber: 24, date: "2026-01-10" },
      { id: "s11", name: "Ildiz kanali tozalash", doctor: "Dr. Azimov", cost: 1200000, status: "completed", order: 2, toothNumber: 24, date: "2026-01-12" },
      { id: "s12", name: "Plomba qo'yish", doctor: "Dr. Azimov", cost: 1000000, status: "completed", order: 3, toothNumber: 24, date: "2026-01-15" },
    ],
  },
];

const statusConfig = {
  pending: { label: "Kutilmoqda", icon: Clock, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
  "in-progress": { label: "Jarayonda", icon: Play, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  completed: { label: "Tugallandi", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
};

const DentalTreatmentPlans = ({ patients, treatments }: Props) => {
  const [plans] = useState<TreatmentPlan[]>(SAMPLE_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [planTab, setPlanTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState("all");
  const [addStepForm, setAddStepForm] = useState({ name: "", doctor: "", cost: "", toothNumber: "" });
  const [showAddStep, setShowAddStep] = useState(false);

  const getProgress = (plan: TreatmentPlan) => {
    const completed = plan.steps.filter(s => s.status === "completed").length;
    return Math.round((completed / plan.steps.length) * 100);
  };

  const filteredPlans = plans.filter(p => filterStatus === "all" || p.status === filterStatus);

  const totalRevenue = plans.reduce((a, p) => a + p.paidAmount, 0);
  const totalDebt = plans.reduce((a, p) => a + (p.totalCost - p.paidAmount), 0);

  if (selectedPlan) {
    const progress = getProgress(selectedPlan);
    const debt = selectedPlan.totalCost - selectedPlan.paidAmount;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedPlan(null); setPlanTab("overview"); setShowAddStep(false); }}>
            <X className="w-4 h-4 mr-1" /> Orqaga
          </Button>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-foreground">{selectedPlan.planName}</h2>
            <p className="text-sm text-muted-foreground">{selectedPlan.patientName} • {selectedPlan.createdAt}</p>
          </div>
          <Badge className={statusConfig[selectedPlan.status].color}>{statusConfig[selectedPlan.status].label}</Badge>
        </div>

        <Tabs value={planTab} onValueChange={setPlanTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="steps">Bosqichlar</TabsTrigger>
            <TabsTrigger value="payments">To'lov</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="files">Fayllar</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="space-y-4">
              {/* Progress */}
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

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Jami summa</p>
                  <p className="text-lg font-bold text-foreground">{selectedPlan.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">To'langan</p>
                  <p className="text-lg font-bold text-green-600">{selectedPlan.paidAmount.toLocaleString()}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Qarz</p>
                  <p className="text-lg font-bold text-red-600">{debt.toLocaleString()}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Bosqichlar</p>
                  <p className="text-lg font-bold text-blue-600">{selectedPlan.steps.filter(s => s.status === "completed").length}/{selectedPlan.steps.length}</p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-3 flex-wrap">
                <Button onClick={() => setPlanTab("steps")}><Plus className="w-4 h-4 mr-1" /> Step qo'shish</Button>
                <Button variant="outline" onClick={() => setPlanTab("payments")}><CreditCard className="w-4 h-4 mr-1" /> To'lov</Button>
                <Button variant="outline"><FileText className="w-4 h-4 mr-1" /> PDF reja</Button>
              </div>
            </div>
          </TabsContent>

          {/* STEPS */}
          <TabsContent value="steps">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-foreground">Davolash bosqichlari</h3>
                <Button size="sm" onClick={() => setShowAddStep(!showAddStep)}>
                  <Plus className="w-4 h-4 mr-1" /> Yangi step
                </Button>
              </div>

              {showAddStep && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Step nomi *" value={addStepForm.name} onChange={e => setAddStepForm(p => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Shifokor" value={addStepForm.doctor} onChange={e => setAddStepForm(p => ({ ...p, doctor: e.target.value }))} />
                    <Input type="number" placeholder="Narx (so'm)" value={addStepForm.cost} onChange={e => setAddStepForm(p => ({ ...p, cost: e.target.value }))} />
                    <Input type="number" placeholder="Tish raqami" value={addStepForm.toothNumber} onChange={e => setAddStepForm(p => ({ ...p, toothNumber: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Qo'shish</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddStep(false)}>Bekor</Button>
                  </div>
                </div>
              )}

              <div className="relative">
                {selectedPlan.steps.map((step, i) => {
                  const cfg = statusConfig[step.status];
                  const Icon = cfg.icon;
                  const isLast = i === selectedPlan.steps.length - 1;
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
                              <p className="font-semibold text-foreground">{step.order}. {step.name}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">👨‍⚕️ {step.doctor}</span>
                                {step.toothNumber && <span className="text-xs text-muted-foreground">🦷 #{step.toothNumber}</span>}
                                {step.date && <span className="text-xs text-muted-foreground">📅 {step.date}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                              <p className="text-sm font-bold text-foreground mt-1">{step.cost.toLocaleString()} so'm</p>
                            </div>
                          </div>
                          {step.status !== "completed" && (
                            <div className="flex gap-2 mt-3">
                              {step.status === "pending" && <Button size="sm" variant="outline" className="text-blue-600"><Play className="w-3 h-3 mr-1" /> Boshlash</Button>}
                              {step.status === "in-progress" && <Button size="sm" variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Tugatish</Button>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* PAYMENTS */}
          <TabsContent value="payments">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Jami</p>
                  <p className="text-lg font-bold text-foreground">{selectedPlan.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 p-4 text-center">
                  <p className="text-xs text-green-600">To'langan</p>
                  <p className="text-lg font-bold text-green-700">{selectedPlan.paidAmount.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 p-4 text-center">
                  <p className="text-xs text-red-600">Qarz</p>
                  <p className="text-lg font-bold text-red-700">{debt.toLocaleString()}</p>
                </div>
              </div>
              {/* Payment progress bar */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">To'lov jarayoni</span>
                  <span className="font-bold text-foreground">{Math.round((selectedPlan.paidAmount / selectedPlan.totalCost) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-green-500 rounded-full h-3 transition-all" style={{ width: `${(selectedPlan.paidAmount / selectedPlan.totalCost) * 100}%` }} />
                </div>
              </div>
              {debt > 0 && (
                <div className="flex gap-3">
                  <Button className="flex-1"><CreditCard className="w-4 h-4 mr-1" /> To'lov qilish</Button>
                  <Button variant="outline">🧾 Invoice</Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline">
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground">Davolash timelini</h3>
              <div className="bg-card rounded-xl border border-border p-4">
                {selectedPlan.steps.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      step.status === "completed" ? "bg-green-500 text-white" :
                      step.status === "in-progress" ? "bg-blue-500 text-white" :
                      "bg-muted text-muted-foreground"
                    )}>{step.order}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", step.status === "completed" ? "text-muted-foreground line-through" : "text-foreground")}>{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.date || "Belgilanmagan"}</p>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{step.cost.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* FILES */}
          <TabsContent value="files">
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-foreground font-medium">Davolash hujjatlari</p>
              <p className="text-sm text-muted-foreground mt-1">Rentgen, before/after rasmlar</p>
              <Button variant="outline" className="mt-4">📤 Fayl yuklash</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📋 Davolash kurslari</h2>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-1" /> Yangi kurs
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Barchasi" },
          { key: "in-progress", label: "🔄 Jarayonda" },
          { key: "completed", label: "✅ Tugallangan" },
          { key: "pending", label: "⏳ Kutilmoqda" },
        ].map(f => (
          <Button key={f.key} size="sm" variant={filterStatus === f.key ? "default" : "outline"} onClick={() => setFilterStatus(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      {showCreate && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-bold text-foreground">Yangi davolash kursi</h3>
          <Input placeholder="Kurs nomi (masalan: Implantatsiya)" />
          <Select>
            <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
            <SelectContent>
              {patients.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button>Yaratish</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Bekor</Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami kurslar", value: plans.length, icon: BarChart3, color: "text-primary" },
          { label: "Jarayonda", value: plans.filter(p => p.status === "in-progress").length, icon: Play, color: "text-blue-600" },
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

      {/* Plans list */}
      {filteredPlans.map(plan => {
        const progress = getProgress(plan);
        const debt = plan.totalCost - plan.paidAmount;
        const cfg = statusConfig[plan.status];
        return (
          <div key={plan.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPlan(plan)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{plan.planName}</p>
                  <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plan.patientName} • {plan.steps.length} bosqich • {plan.createdAt}</p>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-foreground">{plan.totalCost.toLocaleString()} so'm</p>
                {debt > 0 && <p className="text-xs text-red-500">Qarz: {debt.toLocaleString()}</p>}
                <ChevronRight className="w-5 h-5 text-muted-foreground mt-1 ml-auto" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-2.5">
                <div className="bg-primary rounded-full h-2.5 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-bold text-primary">{progress}%</span>
            </div>
          </div>
        );
      })}
      {filteredPlans.length === 0 && <p className="text-center py-8 text-muted-foreground">Kurslar topilmadi</p>}
    </div>
  );
};

export default DentalTreatmentPlans;
