import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Brain, AlertTriangle, Shield, Activity } from "lucide-react";
import AIServiceUsageGuide from "@/components/AIServiceUsageGuide";
import AIAccessBanner from "@/components/ai/AIAccessBanner";
import AIServiceHero from "@/components/AIServiceHero";
import aiSymptomImg from "@/assets/ai-symptom-checker.jpg";
import SymptomInput from "@/components/symptom-checker/SymptomInput";
import SymptomResults from "@/components/symptom-checker/SymptomResults";
import FollowUpQuestions from "@/components/symptom-checker/FollowUpQuestions";
import type { SymptomAnalysis, PatientInfo } from "@/components/symptom-checker/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { withLang } from "@/lib/aiLang";

const SymptomCheckerPage = () => {
  const { t } = useTranslation();
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
        body: withLang({
          ...patientInfo,
          followUpAnswers: answers,
        }),
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
        { label: t("common.home"), href: "/" },
        { label: "Xizmatlar", href: "/services" },
        { label: t("aiPages.symptom-checker.breadcrumb") },
      ]} />

      <AIServiceHero
        image={aiSymptomImg}
        title={t("ai.services.symptom-checker.title")}
        subtitle={t("aiPages.symptom-checker.subtitle")}
        description={t("aiPages.symptom-checker.description")}
        icon={<Brain className="w-4 h-4" />}
        gradient="from-primary/90 to-blue-900/80"
        features={[
          { icon: <Shield className="w-3.5 h-3.5" />, text: t("aiPages.symptom-checker.f1") },
          { icon: <Activity className="w-3.5 h-3.5" />, text: t("aiPages.symptom-checker.f2") },
          { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: t("aiPages.symptom-checker.f3") },
        ]}
      />

      {/* Main content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <AIAccessBanner serviceId="symptom-checker" serviceName={t("ai.services.symptom-checker.title")} />
          {/* Usage Guide */}
          <div className="mb-6">
            <AIServiceUsageGuide
              serviceName={t("ai.services.symptom-checker.title")}
              steps={[
                { title: t("aiPages.symptom-checker.s1t"), desc: t("aiPages.symptom-checker.s1d") },
                { title: t("aiPages.symptom-checker.s2t"), desc: t("aiPages.symptom-checker.s2d") },
                { title: t("aiPages.symptom-checker.s3t"), desc: t("aiPages.symptom-checker.s3d") },
              ]}
            />
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
