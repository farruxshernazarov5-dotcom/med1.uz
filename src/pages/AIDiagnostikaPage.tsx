import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Stethoscope, FileText, HeartPulse, Shield, Activity,
  AlertTriangle, Bot, ArrowRight, CheckCircle2, Sparkles,
  ClipboardList, Upload, TrendingUp, Users, Building2, Phone
} from "lucide-react";

// Symptom checker imports
import SymptomInput from "@/components/symptom-checker/SymptomInput";
import SymptomResults from "@/components/symptom-checker/SymptomResults";
import FollowUpQuestions from "@/components/symptom-checker/FollowUpQuestions";
import type { SymptomAnalysis, PatientInfo } from "@/components/symptom-checker/types";

// Report analysis - inline mini version
import AIReportMini from "@/components/ai-diagnostika/AIReportMini";
import AIHealthRiskMini from "@/components/ai-diagnostika/AIHealthRiskMini";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { withLang } from "@/lib/aiLang";

const PROCESS_STEPS = [
  { icon: ClipboardList, title: "Simptomlar kiritish", desc: "Simptomlaringizni tanlang yoki yozing" },
  { icon: Upload, title: "Analiz yuklash", desc: "Laboratoriya natijalarini yuklang" },
  { icon: Brain, title: "AI tahlil", desc: "Sun'iy intellekt tahlil qiladi" },
  { icon: TrendingUp, title: "Xavf baholash", desc: "Kasallik xavfi aniqlanadi" },
  { icon: Stethoscope, title: "Shifokor tavsiyasi", desc: "Mos mutaxassis topiladi" },
];

const FEATURES = [
  { icon: Shield, label: "Ma'lumotlar shifrlangan" },
  { icon: Activity, label: "Real vaqt tahlili" },
  { icon: Brain, label: "Gemini AI texnologiyasi" },
  { icon: Users, label: "2,200+ tibbiy atama" },
];

const AIDiagnostikaPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("symptoms");

  // Symptom checker state
  const [symptomStep, setSymptomStep] = useState<"input" | "followup" | "results">("input");
  const [isSymptomLoading, setIsSymptomLoading] = useState(false);
  const [symptomAnalysis, setSymptomAnalysis] = useState<SymptomAnalysis | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);

  const handleSymptomAnalyze = async (info: PatientInfo) => {
    setPatientInfo(info);
    setIsSymptomLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-checker", {
        body: withLang({
          symptoms: info.symptoms,
          age: info.age,
          gender: info.gender,
          duration: info.duration,
          painLevel: info.painLevel,
          existingConditions: info.existingConditions,
          allergies: info.allergies,
        }),
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSymptomAnalysis(data);
      if (data.followUpQuestions?.length > 0) {
        setSymptomStep("followup");
      } else {
        setSymptomStep("results");
      }
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "AI xizmati bilan bog'lanishda xato", variant: "destructive" });
    } finally {
      setIsSymptomLoading(false);
    }
  };

  const handleFollowUpSubmit = async (answers: { question: string; answer: string }[]) => {
    if (!patientInfo) return;
    setIsSymptomLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-checker", {
        body: withLang({ ...patientInfo, followUpAnswers: answers }),
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSymptomAnalysis(data);
      setSymptomStep("results");
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "Tahlil xatosi", variant: "destructive" });
    } finally {
      setIsSymptomLoading(false);
    }
  };

  const handleSymptomReset = () => {
    setSymptomStep("input");
    setSymptomAnalysis(null);
    setPatientInfo(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Erta Diagnostika — Simptom tekshirgich va tahlil | Med1.uz"
        description="Sun'iy intellekt asosida simptomlarni tekshiring, tibbiy hujjatlarni tahlil qiling va sog'liq xavflarini baholang. ICD-10 asosidagi xulosalar."
        path="/ai-diagnostika"
      />
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "AI Xizmatlar", href: "/ai-services" },
        { label: t("aiPages.symptom-checker.breadcrumb") },
      ]} />

      {/* Hero */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-blue-500/5 to-emerald-500/5" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-semibold mb-6 border border-primary/20">
              <Brain className="w-5 h-5" />
              AI Early Diagnosis System
              <Badge variant="secondary" className="ml-1 text-xs">v2.0</Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-5 leading-tight">
              Sun'iy intellekt asosidagi{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                erta diagnostika
              </span>{" "}
              tizimi
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Simptomlaringizni kiriting, analiz natijalarini yuklang — AI tizimi ehtimoliy kasalliklarni aniqlaydi, 
              xavf darajasini baholaydi va mos shifokorni tavsiya qiladi
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm text-muted-foreground">
                  <f.icon className="w-4 h-4 text-primary" />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process steps */}
      <section className="container mx-auto px-4 -mt-4 mb-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {PROCESS_STEPS.map((s, i) => (
              <div key={s.title} className="relative flex flex-col items-center text-center p-4 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors group">
                <div className="absolute -top-3 left-3 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="container mx-auto px-4 mb-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ogohlantirish:</strong> Bu tizim tibbiy tashxis o'rnini bosmaydi. Natijalar faqat ma'lumot maqsadida beriladi. 
              Aniq tashxis va davolash uchun albatta shifokorga murojaat qiling.
            </p>
          </div>
        </div>
      </section>

      {/* Main tabs */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1.5 bg-muted/50">
              <TabsTrigger value="symptoms" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">Simptom Tahlili</span>
                <span className="sm:hidden">Simptom</span>
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Analiz Tahlili</span>
                <span className="sm:hidden">Analiz</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <HeartPulse className="w-4 h-4" />
                <span className="hidden sm:inline">Xavf Prognozi</span>
                <span className="sm:hidden">Xavf</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Symptom Checker */}
            <TabsContent value="symptoms">
              {/* Steps indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {["Simptomlar", "Savollar", "Natijalar"].map((label, i) => {
                  const stepId = i === 0 ? "input" : i === 1 ? "followup" : "results";
                  const isActive = symptomStep === stepId;
                  const isPast = (symptomStep === "followup" && i === 0) || (symptomStep === "results" && i <= 1);
                  return (
                    <div key={label} className="flex items-center gap-2">
                      {i > 0 && <div className={`w-8 h-0.5 ${isPast || isActive ? "bg-primary" : "bg-border"}`} />}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <span>{i + 1}</span>
                        <span className="hidden sm:inline">{label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {symptomStep === "input" && <SymptomInput onAnalyze={handleSymptomAnalyze} isLoading={isSymptomLoading} />}
              {symptomStep === "followup" && symptomAnalysis?.followUpQuestions && (
                <FollowUpQuestions
                  questions={symptomAnalysis.followUpQuestions}
                  onSubmit={handleFollowUpSubmit}
                  onSkip={() => setSymptomStep("results")}
                  isLoading={isSymptomLoading}
                />
              )}
              {symptomStep === "results" && symptomAnalysis && (
                <SymptomResults analysis={symptomAnalysis} onReset={handleSymptomReset} />
              )}
            </TabsContent>

            {/* Tab 2: Report Analysis */}
            <TabsContent value="report">
              <AIReportMini />
            </TabsContent>

            {/* Tab 3: Health Risk */}
            <TabsContent value="risk">
              <AIHealthRiskMini />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Quick links to other AI services */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-6 text-center">
            Boshqa AI xizmatlar
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/ai-doctor-chat" className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">AI Shifokor Chat</h3>
                <p className="text-sm text-muted-foreground">Real vaqtda AI bilan suhbatlashing</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link to="/smart-search" className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Aqlli Qidiruv</h3>
                <p className="text-sm text-muted-foreground">AI yordamida shifokor va klinika toping</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIDiagnostikaPage;
