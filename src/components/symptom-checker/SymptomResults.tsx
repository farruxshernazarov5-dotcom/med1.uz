import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, ShieldCheck, Activity, RefreshCcw,
  Stethoscope, Building2, CheckCircle2, Phone, MapPin,
  BookOpen, FlaskConical, ScanLine, ExternalLink, FileText, Microscope
} from "lucide-react";
import type { SymptomAnalysis, DiseaseResult, MedicalKnowledgeResult, PubMedArticle } from "./types";
import RecommendedClinics from "./RecommendedClinics";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  analysis: SymptomAnalysis;
  onReset: () => void;
}

const SymptomResults = ({ analysis, onReset }: Props) => {
  const { t } = useLanguage();
  const riskConfig = {
    high: { label: t("sxResults.riskHigh"), color: "bg-destructive text-destructive-foreground", icon: AlertTriangle, bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
    medium: { label: t("sxResults.riskMedium"), color: "bg-amber-500 text-white", icon: Activity, bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
    low: { label: t("sxResults.riskLow"), color: "bg-secondary text-secondary-foreground", icon: ShieldCheck, bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  } as const;
  const risk = riskConfig[analysis.riskLevel] || riskConfig.low;
  const RiskIcon = risk.icon;
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [medicalKnowledge, setMedicalKnowledge] = useState<MedicalKnowledgeResult | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // Fetch medical references from PubMed/MedlinePlus
  useEffect(() => {
    if (analysis.diseases.length === 0) return;
    const fetchRefs = async () => {
      setLoadingRefs(true);
      try {
        const diseaseNames = analysis.diseases.map(d => d.name);
        const icdCodes = analysis.diseases.map(d => d.icd10Code).filter(Boolean);
        const { data } = await supabase.functions.invoke("medical-knowledge", {
          body: { diseaseNames, icdCodes },
        });
        if (data && !data.error) setMedicalKnowledge(data);
      } catch {
        // silently fail
      } finally {
        setLoadingRefs(false);
      }
    };
    fetchRefs();
  }, [analysis.diseases]);

  return (
    <div className="space-y-6">
      {/* Urgent action banner */}
      {analysis.urgentAction && (
        <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-700 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-destructive text-lg">Tezkor tibbiy yordam talab qilinadi!</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Simptomlaringiz shoshilinch tibbiy yordamni talab qilishi mumkin. Iltimos, darhol shifokorga yoki tez yordamga murojaat qiling.
            </p>
            <a href="tel:103" className="inline-flex items-center gap-2 mt-3 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-semibold text-sm">
              <Phone className="w-4 h-4" /> 103 ga qo'ng'iroq qilish
            </a>
          </div>
        </div>
      )}

      {/* Risk level */}
      <div className={`border rounded-xl p-5 ${risk.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${risk.color}`}>
            <RiskIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Umumiy xavf darajasi</h3>
            <Badge className={risk.color}>{risk.label}</Badge>
          </div>
        </div>
      </div>

      {/* Differential Diagnosis */}
      {analysis.differentialDiagnosis && (
        <div className="bg-card border border-primary/20 rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Microscope className="w-5 h-5 text-primary" />
            Differensial diagnostika
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Asosiy taxmin:</p>
              <Badge className="bg-primary text-primary-foreground mt-1">{analysis.differentialDiagnosis.primarySuspect}</Badge>
            </div>
            {analysis.differentialDiagnosis.clinicalReasoning && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {analysis.differentialDiagnosis.clinicalReasoning}
              </p>
            )}
            {analysis.differentialDiagnosis.ruledOut?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Istisno qilingan:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.differentialDiagnosis.ruledOut.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs line-through opacity-60">{d}</Badge>
                  ))}
                </div>
              </div>
            )}
            {analysis.differentialDiagnosis.needsMoreInfo?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Qo'shimcha ma'lumot kerak:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.differentialDiagnosis.needsMoreInfo.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-300">{d}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diseases */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          Ehtimoliy kasalliklar (ICD-10 asosida)
        </h3>
        <div className="space-y-4">
          {analysis.diseases.map((d, i) => (
            <DiseaseCard key={i} disease={d} rank={i + 1} />
          ))}
          {analysis.diseases.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              AI simptomlaringiz bo'yicha aniq kasallik aniqlay olmadi. Shifokorga murojaat qiling.
            </p>
          )}
        </div>
      </div>

      {/* Suggested Lab Tests */}
      {analysis.suggestedLabTests && analysis.suggestedLabTests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-500" />
            Tavsiya etilgan laboratoriya tahlillari
          </h3>
          <div className="space-y-2">
            {analysis.suggestedLabTests.map((test, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{test.testName}</p>
                  <p className="text-xs text-muted-foreground">{test.purpose}</p>
                </div>
                <Badge variant={test.urgency === "urgent" ? "destructive" : "secondary"} className="text-xs">
                  {test.urgency === "urgent" ? "Shoshilinch" : "Rejalashtirilgan"}
                </Badge>
              </div>
            ))}
          </div>
          <Link to="/diagnostics" className="inline-flex items-center gap-1 text-sm text-primary mt-3 hover:underline">
            Diagnostika markazlarini ko'rish <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Suggested Imaging */}
      {analysis.suggestedImaging && analysis.suggestedImaging.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-500" />
            Tavsiya etilgan tasviriy diagnostika
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {analysis.suggestedImaging.map((img, i) => (
              <div key={i} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{img.type}</Badge>
                  <span className="text-xs text-muted-foreground">{img.bodyPart}</span>
                </div>
                <p className="text-xs text-muted-foreground">{img.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended clinics */}
      {analysis.diseases.length > 0 && (
        <RecommendedClinics diseases={analysis.diseases} userLocation={userLocation} />
      )}

      {/* Recommendations */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-secondary" />
          Tavsiyalar
        </h3>
        <ul className="space-y-2">
          {analysis.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Medical References from PubMed/MedlinePlus */}
      {(medicalKnowledge || analysis.medicalReferences?.length) && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-500" />
            Ilmiy manbalar va tibbiy bazalar
            {loadingRefs && <span className="text-xs text-muted-foreground animate-pulse">yuklanmoqda...</span>}
          </h3>

          {/* AI provided references */}
          {analysis.medicalReferences && analysis.medicalReferences.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">AI tavsiya etgan manbalar:</p>
              <div className="space-y-2">
                {analysis.medicalReferences.map((ref, i) => (
                  <div key={i} className="p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{ref.source}</Badge>
                      <span className="text-sm text-foreground">{ref.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ref.relevance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PubMed articles */}
          {medicalKnowledge?.pubmedArticles && medicalKnowledge.pubmedArticles.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> PubMed ilmiy maqolalar:
              </p>
              <div className="space-y-2">
                {medicalKnowledge.pubmedArticles.map((article) => (
                  <a
                    key={article.pmid}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm text-foreground font-medium leading-tight">{article.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{article.authors}</span>
                      <span>•</span>
                      <span>{article.journal}</span>
                      <span>•</span>
                      <span>{article.pubDate}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                      PMID: {article.pmid} <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* MedlinePlus */}
          {medicalKnowledge?.medlinePlusResults && medicalKnowledge.medlinePlusResults.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">MedlinePlus ma'lumotlar:</p>
              <div className="flex flex-wrap gap-2">
                {medicalKnowledge.medlinePlusResults.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                    {r.title} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ICD references */}
          {medicalKnowledge?.icdReferences && medicalKnowledge.icdReferences.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">ICD-10 havolalar:</p>
              <div className="flex flex-wrap gap-2">
                {medicalKnowledge.icdReferences.map((ref, i) => (
                  <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-muted text-foreground px-3 py-1.5 rounded-full hover:bg-muted/80 transition-colors">
                    {ref.code} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/clinics">
          <Button className="w-full bg-hero-gradient text-primary-foreground" size="lg">
            <Building2 className="w-4 h-4 mr-2" /> Barcha klinikalar
          </Button>
        </Link>
        <Button variant="outline" size="lg" onClick={onReset}>
          <RefreshCcw className="w-4 h-4 mr-2" /> Qaytadan tekshirish
        </Button>
      </div>

      {/* Final disclaimer */}
      <div className="bg-muted rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ Ushbu natijalar tibbiy tashxis emas. AI tahlili ICD-10, SNOMED CT va PubMed ma'lumotlariga asoslangan bo'lsa-da, 
          faqat ma'lumot maqsadida beriladi. Aniq tashxis va davolash uchun malakali shifokorga murojaat qiling.
        </p>
      </div>
    </div>
  );
};

const DiseaseCard = ({ disease, rank }: { disease: DiseaseResult; rank: number }) => {
  const risk = riskConfig[disease.riskLevel] || riskConfig.low;

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{rank}</span>
          <div>
            <h4 className="font-semibold text-foreground">{disease.name}</h4>
            {disease.icd10Code && (
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs font-mono bg-muted/50">
                  ICD-10: {disease.icd10Code}
                </Badge>
                {disease.icd11Code && (
                  <Badge variant="outline" className="text-xs font-mono bg-muted/50">
                    ICD-11: {disease.icd11Code}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <Badge className={risk.color} variant="secondary">{risk.label}</Badge>
      </div>

      <p className="text-sm text-muted-foreground">{disease.description}</p>

      {/* Clinical evidence */}
      {disease.clinicalEvidence && (
        <div className="bg-muted/30 p-2 rounded-lg">
          <p className="text-xs text-muted-foreground italic">
            <BookOpen className="w-3 h-3 inline mr-1" />
            {disease.clinicalEvidence}
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Ehtimollik</span>
          <span className="font-semibold text-foreground">{disease.probability}%</span>
        </div>
        <Progress value={disease.probability} className="h-2" />
      </div>

      {disease.matchingSymptoms.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Mos simptomlar:</p>
          <div className="flex flex-wrap gap-1">
            {disease.matchingSymptoms.map((s) => (
              <Badge key={s} variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {disease.nonMatchingSymptoms && disease.nonMatchingSymptoms.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Mos kelmaydigan simptomlar:</p>
          <div className="flex flex-wrap gap-1">
            {disease.nonMatchingSymptoms.map((s) => (
              <Badge key={s} variant="outline" className="text-xs opacity-50 line-through">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Differential notes */}
      {disease.differentialNotes && (
        <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded">
          <Microscope className="w-3 h-3 inline mr-1 text-primary" />
          {disease.differentialNotes}
        </p>
      )}

      {/* Suggested tests */}
      {disease.suggestedTests && disease.suggestedTests.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground mr-1">Tahlillar:</span>
          {disease.suggestedTests.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-primary">
        <Stethoscope className="w-4 h-4" />
        <span>Tavsiya: <strong>{disease.specialist}</strong></span>
      </div>
    </div>
  );
};

export default SymptomResults;
