import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { HeartPulse, Loader2, AlertTriangle, CheckCircle2, Shield, Activity, RefreshCcw, TrendingUp, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RiskItem {
  disease: string;
  riskPercent: number;
  riskLevel: "high" | "medium" | "low";
  factors: string[];
  prevention: string[];
}

interface HealthRiskResult {
  risks: RiskItem[];
  overallHealth: "good" | "moderate" | "concerning";
  bmi: { value: number; category: string };
  recommendations: string[];
  lifestyleScore: number;
  suggestedCheckups: string[];
}

const healthLabels: Record<string, { label: string; color: string }> = {
  good: { label: "Yaxshi", color: "text-green-600" },
  moderate: { label: "O'rtacha", color: "text-amber-600" },
  concerning: { label: "Xavotirli", color: "text-red-600" },
};

const riskColors: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-amber-500",
  low: "bg-secondary",
};

const AIHealthRiskPage = () => {
  const [step, setStep] = useState<"input" | "results">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HealthRiskResult | null>(null);

  // Form fields
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

  const handleAnalyze = async () => {
    if (!age || !gender) {
      toast({ title: "Xato", description: "Yosh va jinsni kiriting", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-health-risk", {
        body: { age, gender, weight, height, bloodPressure, smoking, alcohol, exercise, existingConditions, familyHistory, diet },
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "AI Xizmatlar", href: "/ai-services" },
        { label: "Sog'liq Prognozi" },
      ]} />

      <section className="relative py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-3">
            <HeartPulse className="w-4 h-4" />
            AI Health Risk Prediction
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
            Sog'liq xavfi <span className="text-primary">prognozi</span>
          </h1>
          <p className="text-muted-foreground text-sm">Ma'lumotlaringizni kiriting — AI kelajakdagi kasallik xavflarini baholab, profilaktika tavsiyalarini beradi</p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ogohlantirish:</strong> Bu prognoz tibbiy tashxis emas. Faqat umumiy baholash va profilaktika maqsadida.
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
                  <label className="text-xs text-muted-foreground mb-1 block">Oilaviy kasalliklar tarixi</label>
                  <Textarea placeholder="Ota-onangiz yoki yaqin oila a'zolaridagi kasalliklar..." value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} rows={2} />
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
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ovqatlanish tarzi</label>
                  <Input placeholder="Masalan: ko'p go'sht, kam sabzavot..." value={diet} onChange={(e) => setDiet(e.target.value)} />
                </div>
              </div>

              <Button onClick={handleAnalyze} disabled={!age || !gender || isLoading}
                className="w-full bg-hero-gradient text-primary-foreground h-12 text-base font-semibold" size="lg">
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Tahlil qilinmoqda...</> : <><HeartPulse className="w-5 h-5 mr-2" /> Xavf prognozini olish</>}
              </Button>
            </div>
          )}

          {step === "results" && result && (
            <div className="space-y-6">
              {/* Overall health & lifestyle score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Umumiy sog'liq</p>
                  <p className={`text-xl font-bold ${healthLabels[result.overallHealth]?.color || "text-foreground"}`}>
                    {healthLabels[result.overallHealth]?.label || result.overallHealth}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">BMI</p>
                  <p className="text-xl font-bold text-foreground">{result.bmi?.value || "—"}</p>
                  <p className="text-xs text-muted-foreground">{result.bmi?.category}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Hayot tarzi bahosi</p>
                  <p className="text-xl font-bold text-primary">{result.lifestyleScore}/100</p>
                  <Progress value={result.lifestyleScore} className="h-2 mt-2" />
                </div>
              </div>

              {/* Risk items */}
              {result.risks.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Kasallik xavfi prognozi
                  </h3>
                  <div className="space-y-4">
                    {result.risks.map((r, i) => (
                      <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground">{r.disease}</h4>
                          <Badge className={`${riskColors[r.riskLevel] || "bg-muted"} text-white`}>
                            {r.riskLevel === "high" ? "Yuqori" : r.riskLevel === "medium" ? "O'rta" : "Past"} xavf
                          </Badge>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Xavf darajasi</span>
                            <span className="font-semibold">{r.riskPercent}%</span>
                          </div>
                          <Progress value={r.riskPercent} className="h-2" />
                        </div>
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
                      </div>
                    ))}
                  </div>
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

              <Button variant="outline" size="lg" onClick={handleReset} className="w-full">
                <RefreshCcw className="w-4 h-4 mr-2" /> Qaytadan tekshirish
              </Button>

              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">⚠️ Bu prognoz tibbiy tashxis emas. Profilaktika maqsadida foydalaning va shifokorga murojaat qiling.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIHealthRiskPage;
