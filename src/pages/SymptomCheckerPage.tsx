import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Brain, AlertTriangle, Shield, Activity } from "lucide-react";
import SymptomInput from "@/components/symptom-checker/SymptomInput";
import SymptomResults from "@/components/symptom-checker/SymptomResults";
import FollowUpQuestions from "@/components/symptom-checker/FollowUpQuestions";
import type { SymptomAnalysis, PatientInfo } from "@/components/symptom-checker/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SymptomCheckerPage = () => {
  const [step, setStep] = useState<"input" | "followup" | "results">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<{ question: string; answer: string }[]>([]);

  const handleAnalyze = async (info: PatientInfo) => {
    setPatientInfo(info);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-checker", {
        body: {
          symptoms: info.symptoms,
          age: info.age,
          gender: info.gender,
          duration: info.duration,
          painLevel: info.painLevel,
          existingConditions: info.existingConditions,
          allergies: info.allergies,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis(data);
      if (data.followUpQuestions?.length > 0) {
        setStep("followup");
      } else {
        setStep("results");
      }
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "AI xizmati bilan bog'lanishda xato", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = async (answers: { question: string; answer: string }[]) => {
    setFollowUpAnswers(answers);
    if (!patientInfo) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-checker", {
        body: {
          ...patientInfo,
          followUpAnswers: answers,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data);
      setStep("results");
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "Tahlil xatosi", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("input");
    setAnalysis(null);
    setPatientInfo(null);
    setFollowUpAnswers([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "Xizmatlar", href: "/services" },
        { label: "AI Diagnostika" },
      ]} />

      {/* Hero */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Brain className="w-4 h-4" />
              AI Symptom Checker
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Sun'iy intellekt asosidagi <span className="text-primary">erta diagnostika</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Simptomlaringizni kiriting — AI tizimi ehtimoliy kasalliklar, xavf darajasi va mos shifokor tavsiyasini beradi
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Shield className="w-4 h-4 text-secondary" />
                Ma'lumotlar maxfiy
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Activity className="w-4 h-4 text-primary" />
                Real vaqt tahlili
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Tibbiy maslahat emas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ogohlantirish:</strong> Bu tizim tibbiy tashxis o'rnini bosmaydi. Natijalar faqat ma'lumot maqsadida beriladi. 
              Aniq tashxis va davolash uchun albatta shifokorga murojaat qiling.
            </p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {["Simptomlar", "Savollar", "Natijalar"].map((label, i) => {
              const stepIndex = i === 0 ? "input" : i === 1 ? "followup" : "results";
              const isActive = step === stepIndex;
              const isPast = (step === "followup" && i === 0) || (step === "results" && i <= 1);
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

          {step === "input" && <SymptomInput onAnalyze={handleAnalyze} isLoading={isLoading} />}
          {step === "followup" && analysis?.followUpQuestions && (
            <FollowUpQuestions
              questions={analysis.followUpQuestions}
              onSubmit={handleFollowUpSubmit}
              onSkip={() => setStep("results")}
              isLoading={isLoading}
            />
          )}
          {step === "results" && analysis && (
            <SymptomResults analysis={analysis} onReset={handleReset} />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SymptomCheckerPage;
