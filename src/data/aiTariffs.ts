import {
  Stethoscope,
  Bot,
  FileText,
  HeartPulse,
  Eye,
  UserCheck,
  Baby,
  Palette,
  UtensilsCrossed,
  Heart,
  Pill,
  Dumbbell,
  Activity,
} from "lucide-react";

export const AI_SERVICE_TARIFFS = [
  { id: "symptom-checker", name: "AI Erta Diagnostika", icon: Stethoscope, creditCost: 5, costTier: "mid" as const },
  { id: "ai-doctor-chat", name: "AI Shifokor Chat", icon: Bot, creditCost: 5, costTier: "mid" as const },
  { id: "ai-report-analysis", name: "Analiz Tahlili", icon: FileText, creditCost: 25, costTier: "high" as const },
  { id: "ai-health-risk", name: "Sog'liq Xavfi Prognozi", icon: HeartPulse, creditCost: 5, costTier: "mid" as const },
  { id: "ai-radiology", name: "AI Radiologiya Pro", icon: Eye, creditCost: 25, costTier: "high" as const },
  { id: "ai-health-assistant", name: "AI Sog'liq Assistent", icon: UserCheck, creditCost: 1, costTier: "low" as const },
  { id: "ai-pregnancy", name: "AI Homiladorlik", icon: Baby, creditCost: 5, costTier: "mid" as const },
  { id: "ai-baby-care", name: "AI Bola Parvarishi", icon: Baby, creditCost: 1, costTier: "low" as const },
  { id: "ai-cosmetology", name: "AI Kosmetologiya", icon: Palette, creditCost: 25, costTier: "high" as const },
  { id: "ai-dietolog", name: "AI Dietolog", icon: UtensilsCrossed, creditCost: 1, costTier: "low" as const },
  { id: "ai-psixolog", name: "AI Psixolog", icon: Heart, creditCost: 5, costTier: "mid" as const },
  { id: "ai-farmatsevt", name: "AI Farmatsevt", icon: Pill, creditCost: 1, costTier: "low" as const },
  { id: "ai-fitness", name: "AI Fitness Trener", icon: Dumbbell, creditCost: 1, costTier: "low" as const },
  { id: "ai-vital-signs", name: "AI Vital Signs", icon: Activity, creditCost: 25, costTier: "high" as const },
] as const;

/* ─── Credit Packages ─── */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus: number;
  price: number;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "lite",      name: "Lite",       credits: 100,  bonus: 0,   price: 15000 },
  { id: "standard",  name: "Standard",   credits: 500,  bonus: 50,  price: 60000, popular: true },
  { id: "premium",   name: "Premium",    credits: 1200, bonus: 150, price: 120000 },
];

/* ─── Cost tier → model mapping ─── */
export const COST_TIER_MODEL: Record<string, string> = {
  low: "google/gemini-3-flash-preview",
  mid: "google/gemini-3.1-pro-preview",
  high: "google/gemini-3-pro-image-preview",
};

export const COST_TIER_LABEL: Record<string, string> = {
  low: "⚡ Tezkor",
  mid: "🧠 Chuqur tahlil",
  high: "👁️ Vizual tahlil",
};

export function getServiceCreditCost(serviceId: string): number {
  const s = AI_SERVICE_TARIFFS.find(t => t.id === serviceId);
  return s?.creditCost ?? 5;
}

export function getServiceModel(serviceId: string): string {
  const s = AI_SERVICE_TARIFFS.find(t => t.id === serviceId);
  return COST_TIER_MODEL[s?.costTier ?? "mid"] ?? COST_TIER_MODEL.mid;
}
