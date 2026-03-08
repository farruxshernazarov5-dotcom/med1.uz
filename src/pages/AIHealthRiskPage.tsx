import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  HeartPulse, Loader2, AlertTriangle, CheckCircle2, Shield, Activity,
  RefreshCcw, TrendingUp, Stethoscope, Brain, Utensils, Dumbbell,
  Moon, Flame, Eye, Search, Building2, Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { downloadAIReport } from "@/utils/downloadAIReport";

interface RiskItem {
  disease: string;
  category: string;
  riskPercent: number;
  riskLevel: "high" | "medium" | "low";
  riskScore: number;
  factors: string[];
  prevention: string[];
  icd10Code?: string;
  clinicalBasis?: string;
  suggestedSpecialist?: string;
  timeframe?: string;
  modifiable?: boolean;
}

interface HealthIndex {
  cardiovascular: number;
  metabolic: number;
  neurologic: number;
  physical: number;
  overall: number;
}

interface LifestyleBreakdown {
  nutrition: number;
  exercise: number;
  sleep: number;
  stress: number;
  habits: number;
}

interface PreventiveScreening {
  test: string;
  frequency: string;
  reason: string;
  priority?: string;
}

interface HealthRiskResult {
  risks: RiskItem[];
  overallHealth: "good" | "moderate" | "concerning";
  overallRiskScore: number;
  bmi: { value: number; category: string; interpretation?: string };
  healthIndex: HealthIndex;
  recommendations: string[];
  lifestyleScore: number;
  lifestyleBreakdown?: LifestyleBreakdown;
  suggestedCheckups: string[];
  riskFactorAnalysis?: string;
  preventiveScreening?: PreventiveScreening[];
  dietaryAdvice?: string[];
  exerciseAdvice?: string[];
  warningSignsToWatch?: string[];
}

const healthLabels: Record<string, { label: string; color: string; bg: string }> = {
  good: { label: "Yaxshi", color: "text-green-600", bg: "bg-green-500" },
  moderate: { label: "O'rtacha", color: "text-amber-600", bg: "bg-amber-500" },
  concerning: { label: "Xavotirli", color: "text-red-600", bg: "bg-red-500" },
};

const riskColors: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-amber-500",
  low: "bg-secondary",
};

const riskLabels: Record<string, string> = {
  high: "Yuqori xavf",
  medium: "O'rta xavf",
  low: "Past xavf",
};

const categoryIcons: Record<string, string> = {
  cardiovascular: "❤️",
  metabolic: "🔬",
  oncologic: "🎗️",
  neurologic: "🧠",
  respiratory: "🫁",
  digestive: "🏥",
};

const AIHealthRiskPage = () => {
  const [step, setStep] = useState<"input" | "results">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HealthRiskResult | null>(null);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [smoking, setSmoking] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [exercise, setExercise] = useState("");
  const [existingConditions, setExistingConditions] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [diet, setDiet] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [medications, setMedications] = useState("");
  const [labResults, setLabResults] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const handleAnalyze = async () => {
    if (!age || !gender) {
      toast({ title: "Xato", description: "Yosh va jinsni kiriting", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-health-risk", {
        body: { age, gender, weight, height, bloodPressure, smoking, alcohol, exercise, existingConditions, familyHistory, diet, sleepHours, stressLevel, medications, labResults, symptoms },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      setStep("results");
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "Tahlil xatosi", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => { setStep("input"); setResult(null); };

  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return "text-green-600";
    if (score <= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getHealthIndexColor = (val: number) => {
    if (val >= 70) return "bg-green-500";
    if (val >= 40) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "AI Xizmatlar", href: "/ai-services" },
        { label: "Kasallik Prognozi" },
      ]} />

      <section className="relative py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-3">
            <Brain className="w-4 h-4" />
            Predictive Diagnostics AI
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
            AI kasallik <span className="text-primary">prognozlash</span> tizimi
          </h1>
          <p className="text-muted-foreground text-sm">
            Sog'liq ma'lumotlaringiz, simptomlar, analizlar va tibbiy tarixingiz asosida kelajakdagi kasallik xavflarini AI prognoz qiladi
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ogohlantirish:</strong> AI prognozi yakuniy tashxis emas. Aniq tashxis va davolanish uchun shifokorga murojaat qiling.
            </p>
          </div>

          {step === "input" && (
            <div className="space-y-6">
              {/* Basic info */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Asosiy ma'lumotlar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Yosh *</label>
                    <Input type="number" placeholder="30" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Jins *</label>
                    <div className="flex gap-2">
                      {[{ v: "male", l: "Erkak" }, { v: "female", l: "Ayol" }].map((g) => (
                        <Button key={g.v} variant={gender === g.v ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setGender(g.v)}>{g.l}</Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Vazn (kg)</label>
                    <Input type="number" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Bo'y (cm)</label>
                    <Input type="number" placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Health indicators */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-primary" />
                  Sog'liq ko'rsatkichlari
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Qon bosimi</label>
                    <Input placeholder="120/80" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Mavjud kasalliklar</label>
                    <Input placeholder="Diabet, gipertoniya..." value={existingConditions} onChange={(e) => setExistingConditions(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hozirgi simptomlar</label>
                  <Textarea placeholder="Bosh og'rig'i, charchoq, ko'ngil aynishi..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Oilaviy kasalliklar tarixi</label>
                  <Textarea placeholder="Ota-onangiz yoki yaqin oila a'zolaridagi kasalliklar..." value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} rows={2} />
                </div>
              </div>

              {/* Medical data */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Tibbiy ma'lumotlar
                </h3>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Qabul qilayotgan dorilar</label>
                  <Textarea placeholder="Metformin 500mg, Lisinopril 10mg..." value={medications} onChange={(e) => setMedications(e.target.value)} rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Oxirgi analiz natijalari</label>
                  <Textarea placeholder="Glyukoza: 6.5 mmol/L, Xolesterin: 5.8 mmol/L, Gemoglobin: 130 g/L..." value={labResults} onChange={(e) => setLabResults(e.target.value)} rows={2} />
                </div>
              </div>

              {/* Lifestyle */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Hayot tarzi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Chekish</label>
                    <div className="flex flex-col gap-1.5">
                      {["Chekmayman", "Ba'zan", "Har kuni"].map((o) => (
                        <Button key={o} variant={smoking === o ? "default" : "outline"} size="sm" onClick={() => setSmoking(o)} className="justify-start text-xs">{o}</Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Alkogol</label>
                    <div className="flex flex-col gap-1.5">
                      {["Ichmayman", "Kamdan-kam", "Muntazam"].map((o) => (
                        <Button key={o} variant={alcohol === o ? "default" : "outline"} size="sm" onClick={() => setAlcohol(o)} className="justify-start text-xs">{o}</Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Jismoniy faollik</label>
                    <div className="flex flex-col gap-1.5">
                      {["Harakatsiz", "Haftada 1-2 marta", "Muntazam sport"].map((o) => (
                        <Button key={o} variant={exercise === o ? "default" : "outline"} size="sm" onClick={() => setExercise(o)} className="justify-start text-xs">{o}</Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Uyqu (soat/kecha)</label>
                    <Input type="number" placeholder="7" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Stress darajasi</label>
                    <div className="flex gap-1.5">
                      {["Past", "O'rta", "Yuqori"].map((o) => (
                        <Button key={o} variant={stressLevel === o ? "default" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => setStressLevel(o)}>{o}</Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Ovqatlanish</label>
                    <Input placeholder="Ko'p go'sht, kam sabzavot..." value={diet} onChange={(e) => setDiet(e.target.value)} />
                  </div>
                </div>
              </div>

              <Button onClick={handleAnalyze} disabled={!age || !gender || isLoading}
                className="w-full bg-hero-gradient text-primary-foreground h-12 text-base font-semibold" size="lg">
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> AI tahlil qilmoqda...</> : <><Brain className="w-5 h-5 mr-2" /> Kasallik prognozini olish</>}
              </Button>
            </div>
          )}

          {step === "results" && result && (
            <div className="space-y-6">
              {/* Top overview: Risk Score + Health + BMI + Lifestyle */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
                  <p className={`text-2xl font-bold ${getRiskScoreColor(result.overallRiskScore || 50)}`}>
                    {result.overallRiskScore || 50}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">0-100</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Umumiy holat</p>
                  <p className={`text-lg font-bold ${healthLabels[result.overallHealth]?.color || "text-foreground"}`}>
                    {healthLabels[result.overallHealth]?.label || result.overallHealth}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">BMI</p>
                  <p className="text-2xl font-bold text-foreground">{result.bmi?.value || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{result.bmi?.category}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Hayot tarzi</p>
                  <p className="text-2xl font-bold text-primary">{result.lifestyleScore}/100</p>
                  <Progress value={result.lifestyleScore} className="h-1.5 mt-2" />
                </div>
              </div>

              {/* Health Index */}
              {result.healthIndex && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Sog'liq indeksi
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: "cardiovascular", label: "Yurak-qon tomir", icon: "❤️" },
                      { key: "metabolic", label: "Metabolik", icon: "🔬" },
                      { key: "neurologic", label: "Nevrologik", icon: "🧠" },
                      { key: "physical", label: "Jismoniy holat", icon: "💪" },
                      { key: "overall", label: "Umumiy", icon: "⭐" },
                    ].map((item) => {
                      const val = (result.healthIndex as any)[item.key] || 50;
                      return (
                        <div key={item.key} className="flex items-center gap-3">
                          <span className="text-sm w-6">{item.icon}</span>
                          <span className="text-sm text-foreground w-32 flex-shrink-0">{item.label}</span>
                          <div className="flex-1">
                            <Progress value={val} className="h-2.5" />
                          </div>
                          <span className={`text-sm font-bold w-10 text-right ${val >= 70 ? "text-green-600" : val >= 40 ? "text-amber-600" : "text-red-600"}`}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lifestyle Breakdown */}
              {result.lifestyleBreakdown && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Hayot tarzi tahlili
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { key: "nutrition", label: "Ovqatlanish", icon: <Utensils className="w-4 h-4" /> },
                      { key: "exercise", label: "Sport", icon: <Dumbbell className="w-4 h-4" /> },
                      { key: "sleep", label: "Uyqu", icon: <Moon className="w-4 h-4" /> },
                      { key: "stress", label: "Stress", icon: <Flame className="w-4 h-4" /> },
                      { key: "habits", label: "Odatlar", icon: <Shield className="w-4 h-4" /> },
                    ].map((item) => {
                      const val = (result.lifestyleBreakdown as any)?.[item.key] || 50;
                      return (
                        <div key={item.key} className="text-center bg-muted/50 rounded-lg p-3">
                          <div className="flex justify-center text-muted-foreground mb-1">{item.icon}</div>
                          <p className={`text-lg font-bold ${val >= 70 ? "text-green-600" : val >= 40 ? "text-amber-600" : "text-red-600"}`}>{val}</p>
                          <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Risk Factor Analysis */}
              {result.riskFactorAnalysis && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">📊 Xavf omillari tahlili</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.riskFactorAnalysis}</p>
                </div>
              )}

              {/* Risk Items */}
              {result.risks.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Kasallik xavfi prognozi
                  </h3>
                  <div className="space-y-4">
                    {result.risks.map((r, i) => (
                      <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span>{categoryIcons[r.category] || "🏥"}</span>
                            <h4 className="font-semibold text-foreground">{r.disease}</h4>
                            {r.icd10Code && <Badge variant="outline" className="text-[10px]">{r.icd10Code}</Badge>}
                          </div>
                          <Badge className={`${riskColors[r.riskLevel] || "bg-muted"} text-white text-xs`}>
                            {riskLabels[r.riskLevel] || r.riskLevel}
                          </Badge>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Xavf darajasi</span>
                            <span className="font-semibold">{r.riskPercent}%</span>
                          </div>
                          <Progress value={r.riskPercent} className="h-2" />
                        </div>

                        {r.timeframe && (
                          <p className="text-xs text-muted-foreground">⏱️ Prognoz davri: <strong>{r.timeframe}</strong></p>
                        )}

                        {r.clinicalBasis && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">📖 {r.clinicalBasis}</p>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {r.factors.map((f, fi) => (
                            <Badge key={fi} variant="outline" className="text-xs">{f}</Badge>
                          ))}
                        </div>

                        {r.prevention.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1">Oldini olish:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {r.prevention.map((p, pi) => (
                                <li key={pi} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3 h-3 text-secondary flex-shrink-0 mt-0.5" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {r.suggestedSpecialist && (
                          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                            <span className="text-xs text-muted-foreground">👨‍⚕️ Tavsiya: <strong>{r.suggestedSpecialist}</strong></span>
                            <Link to={`/doctors?specialty=${encodeURIComponent(r.suggestedSpecialist)}`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <Search className="w-3 h-3 mr-1" /> Topish
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preventive Screening */}
              {result.preventiveScreening && result.preventiveScreening.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Profilaktik skrining dasturi
                  </h3>
                  <div className="space-y-2">
                    {result.preventiveScreening.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                        <Badge variant={s.priority === "high" ? "destructive" : s.priority === "medium" ? "default" : "secondary"} className="text-[10px] mt-0.5 flex-shrink-0">
                          {s.priority === "high" ? "Shoshilinch" : s.priority === "medium" ? "Muhim" : "Oddiy"}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.test}</p>
                          <p className="text-xs text-muted-foreground">{s.frequency} — {s.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary & Exercise Advice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.dietaryAdvice && result.dietaryAdvice.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-primary" />
                      Ovqatlanish tavsiyalari
                    </h3>
                    <ul className="space-y-1.5">
                      {result.dietaryAdvice.map((a, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.exerciseAdvice && result.exerciseAdvice.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" />
                      Jismoniy mashq tavsiyalari
                    </h3>
                    <ul className="space-y-1.5">
                      {result.exerciseAdvice.map((a, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="text-blue-500 mt-0.5">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Warning Signs */}
              {result.warningSignsToWatch && result.warningSignsToWatch.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Shoshilinch holat belgilari
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">Quyidagi belgilar paydo bo'lsa darhol shifokorga murojaat qiling:</p>
                  <ul className="space-y-1.5">
                    {result.warningSignsToWatch.map((w, i) => (
                      <li key={i} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5">⚠️</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested checkups */}
              {result.suggestedCheckups?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Tavsiya etilgan tekshiruvlar
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestedCheckups.map((c, i) => (
                      <Badge key={i} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  Umumiy tavsiyalar
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick nav to specialists */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3">🏥 Mutaxassis topish</h3>
                <div className="flex flex-wrap gap-2">
                  <Link to="/doctors"><Button variant="outline" size="sm"><Search className="w-3.5 h-3.5 mr-1.5" />Shifokorlar</Button></Link>
                  <Link to="/clinics"><Button variant="outline" size="sm"><Building2 className="w-3.5 h-3.5 mr-1.5" />Klinikalar</Button></Link>
                  <Link to="/diagnostics"><Button variant="outline" size="sm"><Activity className="w-3.5 h-3.5 mr-1.5" />Diagnostika</Button></Link>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => downloadAIReport({
                  title: "Sog'liq Xavfi Prognozi",
                  serviceType: "AI Kasallik Prognozi",
                  riskLevel: result.overallHealth === "concerning" ? "Yuqori" : result.overallHealth === "moderate" ? "O'rtacha" : "Normal",
                  sections: [
                    { heading: "Umumiy holat", content: result.overallHealth === "good" ? "Yaxshi" : result.overallHealth === "moderate" ? "O'rtacha" : "E'tiborli" },
                    { heading: "Xavflar", content: result.risks.map(r => `${r.disease} (${r.category}): ${r.riskPercent}% — ${r.riskLevel}`).join("\n") },
                    { heading: "Tavsiyalar", content: result.recommendations.join("\n") },
                    ...(result.warningSignsToWatch?.length ? [{ heading: "Ogohlantirish belgilari", content: result.warningSignsToWatch.join("\n") }] : []),
                  ],
                })} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" /> Hisobotni yuklab olish
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset} className="flex-1">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Qaytadan tekshirish
                </Button>
              </div>

              <MedicalDisclaimer />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIHealthRiskPage;
