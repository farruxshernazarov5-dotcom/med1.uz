import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, Clock, Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreatmentPlan {
  id: string;
  patientName: string;
  planName: string;
  steps: TreatmentStep[];
  totalCost: number;
  createdAt: string;
}

interface TreatmentStep {
  id: string;
  name: string;
  doctor: string;
  cost: number;
  status: "pending" | "in-progress" | "completed";
  order: number;
}

interface Props {
  patients: any[];
  treatments: any[];
}

const SAMPLE_PLANS: TreatmentPlan[] = [
  {
    id: "1",
    patientName: "Aliyev Jasur",
    planName: "Implantatsiya (46-tish)",
    totalCost: 8500000,
    createdAt: "2026-03-15",
    steps: [
      { id: "s1", name: "Konsultatsiya va CT scan", doctor: "Dr. Karimov", cost: 500000, status: "completed", order: 1 },
      { id: "s2", name: "Suyak tayyorlash", doctor: "Dr. Karimov", cost: 2000000, status: "completed", order: 2 },
      { id: "s3", name: "Implant o'rnatish", doctor: "Dr. Karimov", cost: 4000000, status: "in-progress", order: 3 },
      { id: "s4", name: "Koronka o'rnatish", doctor: "Dr. Azimov", cost: 2000000, status: "pending", order: 4 },
    ],
  },
  {
    id: "2",
    patientName: "Rahimova Dilnoza",
    planName: "Ortodontiya (Breket tizimi)",
    totalCost: 12000000,
    createdAt: "2026-02-01",
    steps: [
      { id: "s5", name: "Diagnostika va reja tuzish", doctor: "Dr. Sultonov", cost: 1000000, status: "completed", order: 1 },
      { id: "s6", name: "Breket o'rnatish", doctor: "Dr. Sultonov", cost: 5000000, status: "completed", order: 2 },
      { id: "s7", name: "Oylik tekshiruv (1-6 oy)", doctor: "Dr. Sultonov", cost: 3000000, status: "in-progress", order: 3 },
      { id: "s8", name: "Breket olib tashlash", doctor: "Dr. Sultonov", cost: 2000000, status: "pending", order: 4 },
      { id: "s9", name: "Reteyner o'rnatish", doctor: "Dr. Sultonov", cost: 1000000, status: "pending", order: 5 },
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

  const getProgress = (plan: TreatmentPlan) => {
    const completed = plan.steps.filter(s => s.status === "completed").length;
    return Math.round((completed / plan.steps.length) * 100);
  };

  if (selectedPlan) {
    const progress = getProgress(selectedPlan);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedPlan(null)}>← Orqaga</Button>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">{selectedPlan.planName}</h2>
            <p className="text-sm text-muted-foreground">{selectedPlan.patientName}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Umumiy progress</p>
            <p className="text-sm font-bold text-primary">{progress}%</p>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Jami: {selectedPlan.totalCost.toLocaleString()} so'm
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-6">Davolash bosqichlari</h3>
          <div className="relative">
            {selectedPlan.steps.map((step, i) => {
              const cfg = statusConfig[step.status];
              const Icon = cfg.icon;
              const isLast = i === selectedPlan.steps.length - 1;
              return (
                <div key={step.id} className="flex gap-4 relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-5 top-10 w-0.5 h-full bg-border" />
                  )}
                  {/* Icon */}
                  <div className={cn("relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0", cfg.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {/* Content */}
                  <div className={cn("flex-1 pb-8 border-b border-border", isLast && "border-0 pb-0")}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{step.order}. {step.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">👨‍⚕️ {step.doctor}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{step.cost.toLocaleString()} so'm</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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

      {showCreate && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
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
          { label: "Jami kurslar", value: plans.length, color: "text-primary" },
          { label: "Jarayonda", value: plans.filter(p => p.steps.some(s => s.status === "in-progress")).length, color: "text-blue-600" },
          { label: "Tugallangan", value: plans.filter(p => p.steps.every(s => s.status === "completed")).length, color: "text-green-600" },
          { label: "Umumiy summa", value: `${(plans.reduce((a, p) => a + p.totalCost, 0) / 1000000).toFixed(1)}M`, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Plans list */}
      {plans.map(plan => {
        const progress = getProgress(plan);
        return (
          <div
            key={plan.id}
            className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedPlan(plan)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{plan.planName}</p>
                  <Badge variant="outline">{progress}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plan.patientName} • {plan.steps.length} bosqich</p>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-foreground">{plan.totalCost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">so'm</p>
                <ChevronRight className="w-5 h-5 text-muted-foreground mt-2 ml-auto" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DentalTreatmentPlans;
