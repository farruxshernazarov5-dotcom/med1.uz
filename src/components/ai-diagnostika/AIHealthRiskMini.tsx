import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HeartPulse, Loader2, RefreshCcw, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RiskItem {
  disease: string;
  category?: string;
  riskPercent: number;
  riskLevel: "high" | "medium" | "low";
  factors: string[];
  prevention: string[];
  icd10Code?: string;
  suggestedSpecialist?: string;
}

interface HealthRiskResult {
  risks: RiskItem[];
  overallHealth: "good" | "moderate" | "concerning";
  overallRiskScore?: number;
  bmi: { value: number; category: string };
  healthIndex?: { cardiovascular: number; metabolic: number; neurologic: number; physical: number; overall: number };
  recommendations: string[];
  lifestyleScore: number;
  suggestedCheckups: string[];
  warningSignsToWatch?: string[];
}

const healthLabels: Record<string, { label: string; color: string }> = {
  good: { label: "Yaxshi", color: "text-green-600" },
  moderate: { label: "O'rtacha", color: "text-amber-600" },
  concerning: { label: "Xavotirli", color: "text-red-600" },
};

const riskColors: Record<string, string> = {
  high: "bg-destructive", medium: "bg-amber-500", low: "bg-secondary",
};

const AIHealthRiskMini = () => {
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
  const [symptoms, setSymptoms] = useState("");

  const handleAnalyze = async () => {
    if (!age || !gender) {
      toast({ title: "Xato", description: "Yosh va jinsni kiriting", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-health-risk", {
        body: { age, gender, weight, height, bloodPressure, smoking, alcohol, exercise, existingConditions, familyHistory, diet, sleepHours, stressLevel, symptoms },
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

  const handleReset = () => { setStep("input"); setResult(null); setAge(""); setGender(""); setWeight(""); setHeight(""); };

  if (step === "results" && result) {
    const health = healthLabels[result.overallHealth] || healthLabels.moderate;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
            <p className="text-xl font-bold text-foreground">{result.overallRiskScore || "—"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Holat</p>
            <p className={`text-lg font-bold ${health.color}`}>{health.label}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">BMI</p>
            <p className="text-xl font-bold text-foreground">{result.bmi.value}</p>
            <p className="text-[10px] text-muted-foreground">{result.bmi.category}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Hayot tarzi</p>
            <p className="text-xl font-bold text-foreground">{result.lifestyleScore}/100</p>
            <Progress value={result.lifestyleScore} className="mt-1 h-1.5" />
          </div>
        </div>

        {result.healthIndex && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Sog'liq indeksi</h3>
            {[
              { key: "cardiovascular", label: "Yurak", icon: "❤️" },
              { key: "metabolic", label: "Metabolik", icon: "🔬" },
              { key: "neurologic", label: "Nevrologik", icon: "🧠" },
              { key: "physical", label: "Jismoniy", icon: "💪" },
              { key: "overall", label: "Umumiy", icon: "⭐" },
            ].map((item) => {
              const val = (result.healthIndex as any)[item.key] || 50;
              return (
                <div key={item.key} className="flex items-center gap-2 text-sm">
                  <span className="w-5">{item.icon}</span>
                  <span className="w-20 text-foreground">{item.label}</span>
                  <Progress value={val} className="flex-1 h-2" />
                  <span className={`w-8 text-right font-bold text-xs ${val >= 70 ? "text-green-600" : val >= 40 ? "text-amber-600" : "text-red-600"}`}>{val}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Kasallik xavflari</h3>
          {result.risks.map((risk, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{risk.disease}</span>
                  {risk.icd10Code && <Badge variant="outline" className="text-[10px]">{risk.icd10Code}</Badge>}
                </div>
                <Badge className={`${riskColors[risk.riskLevel]} text-white`}>{risk.riskPercent}%</Badge>
              </div>
              <Progress value={risk.riskPercent} className="h-2 mb-3" />
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Xavf omillari:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {risk.factors.map((f, j) => <li key={j}>{f}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Oldini olish:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {risk.prevention.map((p, j) => <li key={j}>{p}</li>)}
                  </ul>
                </div>
              </div>
              {risk.suggestedSpecialist && (
                <p className="text-xs text-muted-foreground mt-2">👨‍⚕️ Tavsiya: <strong>{risk.suggestedSpecialist}</strong></p>
              )}
            </div>
          ))}
        </div>

        {result.warningSignsToWatch && result.warningSignsToWatch.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-2 text-sm">⚠️ Shoshilinch belgilar</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {result.warningSignsToWatch.map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-2 text-sm">💡 Tavsiyalar</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        {result.suggestedCheckups.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-2 text-sm">🏥 Tekshiruvlar</h3>
            <div className="flex flex-wrap gap-2">
              {result.suggestedCheckups.map((c, i) => <Badge key={i} variant="outline">{c}</Badge>)}
            </div>
          </div>
        )}

        <Button onClick={handleReset} variant="outline"><RefreshCcw className="w-4 h-4 mr-2" />Qayta baholash</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Sog'liq ma'lumotlaringizni kiriting — AI tizimi kelajakdagi kasallik xavflarini prognoz qiladi.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Yosh *</label>
          <Input value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" type="number" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Jins *</label>
          <div className="flex gap-2">
            {[{ v: "male", l: "Erkak" }, { v: "female", l: "Ayol" }].map((g) => (
              <Button key={g.v} variant={gender === g.v ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setGender(g.v)}>{g.l}</Button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Vazn (kg)</label>
          <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" type="number" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Bo'y (cm)</label>
          <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" type="number" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Qon bosimi</label>
          <Input value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} placeholder="120/80" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Uyqu (soat)</label>
          <Input value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="7" type="number" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Chekish</label>
          <select value={smoking} onChange={(e) => setSmoking(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Tanlang</option>
            <option value="Chekmayman">Chekmayman</option>
            <option value="Ba'zan">Ba'zan</option>
            <option value="Har kuni">Har kuni</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Alkogol</label>
          <select value={alcohol} onChange={(e) => setAlcohol(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Tanlang</option>
            <option value="Ichmayman">Ichmayman</option>
            <option value="Kamdan-kam">Kamdan-kam</option>
            <option value="Muntazam">Muntazam</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Sport</label>
          <select value={exercise} onChange={(e) => setExercise(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Tanlang</option>
            <option value="Harakatsiz">Harakatsiz</option>
            <option value="Haftada 1-2">Haftada 1-2</option>
            <option value="Muntazam">Muntazam</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Stress darajasi</label>
        <div className="flex gap-2">
          {["Past", "O'rta", "Yuqori"].map((o) => (
            <Button key={o} variant={stressLevel === o ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setStressLevel(o)}>{o}</Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Mavjud kasalliklar</label>
        <Textarea value={existingConditions} onChange={(e) => setExistingConditions(e.target.value)} placeholder="Diabet, gipertoniya..." className="min-h-[60px]" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Hozirgi simptomlar</label>
        <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Bosh og'rig'i, charchoq..." className="min-h-[60px]" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Oilaviy kasallik tarixi</label>
        <Textarea value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} placeholder="Ota-ona yoki yaqinlaridagi kasalliklar..." className="min-h-[60px]" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Ovqatlanish tarzi</label>
        <Textarea value={diet} onChange={(e) => setDiet(e.target.value)} placeholder="Kundalik ovqatlanish tarzi..." className="min-h-[60px]" />
      </div>

      <Button onClick={handleAnalyze} disabled={isLoading || !age || !gender} className="w-full" size="lg">
        {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Tahlil qilinmoqda...</> : <><Brain className="w-5 h-5 mr-2" />Kasallik prognozi</>}
      </Button>
    </div>
  );
};

export default AIHealthRiskMini;
