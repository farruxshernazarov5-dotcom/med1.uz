import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, ShieldCheck, Activity, RefreshCcw,
  Stethoscope, Building2, CheckCircle2, Phone, MapPin
} from "lucide-react";
import type { SymptomAnalysis, DiseaseResult } from "./types";
import RecommendedClinics from "./RecommendedClinics";

const riskConfig = {
  high: { label: "Yuqori xavf", color: "bg-destructive text-destructive-foreground", icon: AlertTriangle, bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
  medium: { label: "O'rtacha xavf", color: "bg-amber-500 text-white", icon: Activity, bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  low: { label: "Past xavf", color: "bg-secondary text-secondary-foreground", icon: ShieldCheck, bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
};

interface Props {
  analysis: SymptomAnalysis;
  onReset: () => void;
}

const SymptomResults = ({ analysis, onReset }: Props) => {
  const risk = riskConfig[analysis.riskLevel] || riskConfig.low;
  const RiskIcon = risk.icon;
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      );
    }
  }, []);

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

      {/* Diseases */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          Ehtimoliy kasalliklar
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
          ⚠️ Ushbu natijalar tibbiy tashxis emas. AI tahlili faqat ma'lumot maqsadida beriladi. 
          Aniq tashxis va davolash uchun malakali shifokorga murojaat qiling.
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
          <h4 className="font-semibold text-foreground">{disease.name}</h4>
        </div>
        <Badge className={risk.color} variant="secondary">{risk.label}</Badge>
      </div>

      <p className="text-sm text-muted-foreground">{disease.description}</p>

      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Ehtimollik</span>
          <span className="font-semibold text-foreground">{disease.probability}%</span>
        </div>
        <Progress value={disease.probability} className="h-2" />
      </div>

      {disease.matchingSymptoms.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {disease.matchingSymptoms.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
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
