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

/**
 * "Sog'liq Tangalari" (Health Coins) — marketing rebrand of credits.
 * Costs lowered with anchor (originalCost) to create discount perception,
 * while server-side maxTokens are capped low to keep token spend in plus.
 */
export const COIN_LABEL = "tanga";
export const COIN_LABEL_PLURAL = "tanga";
export const COIN_LABEL_FULL = "Sog'liq Tangasi";

export const AI_SERVICE_TARIFFS = [
  { id: "symptom-checker",    name: "AI Erta Diagnostika",      icon: Stethoscope,       creditCost: 2,  originalCost: 5,  costTier: "mid" as const },
  { id: "ai-doctor-chat",     name: "AI Shifokor Chat",         icon: Bot,               creditCost: 1,  originalCost: 5,  costTier: "low" as const },
  { id: "ai-report-analysis", name: "Analiz Tahlili",           icon: FileText,          creditCost: 10, originalCost: 25, costTier: "high" as const },
  { id: "ai-health-risk",     name: "Sog'liq Xavfi Prognozi",   icon: HeartPulse,        creditCost: 2,  originalCost: 5,  costTier: "mid" as const },
  { id: "ai-radiology",       name: "AI Radiologiya Pro",       icon: Eye,               creditCost: 10, originalCost: 25, costTier: "high" as const },
  { id: "ai-health-assistant",name: "AI Sog'liq Assistent",     icon: UserCheck,         creditCost: 1,  originalCost: 1,  costTier: "low" as const },
  { id: "ai-pregnancy",       name: "AI Homiladorlik",          icon: Baby,              creditCost: 2,  originalCost: 5,  costTier: "mid" as const },
  { id: "ai-baby-care",       name: "AI Bola Parvarishi",       icon: Baby,              creditCost: 1,  originalCost: 1,  costTier: "low" as const },
  { id: "ai-cosmetology",     name: "AI Kosmetologiya",         icon: Palette,           creditCost: 10, originalCost: 25, costTier: "high" as const },
  { id: "ai-dietolog",        name: "AI Dietolog",              icon: UtensilsCrossed,   creditCost: 1,  originalCost: 1,  costTier: "low" as const },
  { id: "ai-psixolog",        name: "AI Psixolog",              icon: Heart,             creditCost: 2,  originalCost: 5,  costTier: "mid" as const },
  { id: "ai-farmatsevt",      name: "AI Farmatsevt",            icon: Pill,              creditCost: 1,  originalCost: 1,  costTier: "low" as const },
  { id: "ai-fitness",         name: "AI Fitness Trener",        icon: Dumbbell,          creditCost: 1,  originalCost: 1,  costTier: "low" as const },
  { id: "ai-vital-signs",     name: "AI Vital Signs",           icon: Activity,          creditCost: 10, originalCost: 25, costTier: "high" as const },
] as const;

/* ─── Credit Packages (Health Coins) ─── */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus: number;
  price: number;
  popular?: boolean;
  tagline?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "lite",     name: "Lite",     credits: 40,  bonus: 0,   price: 15000,  tagline: "40 ta AI maslahati — eng hamyonbop profilaktika" },
  { id: "standard", name: "Standard", credits: 150, bonus: 50,  price: 60000,  popular: true, tagline: "150 + 50 BONUS Tanga — oila uchun smart-shifokor" },
  { id: "premium",  name: "Premium",  credits: 350, bonus: 150, price: 120000, tagline: "350 + 150 Bepul Tanga — 360° toʻliq tibbiy nazorat" },
];

/* ─── Cost tier → model mapping ─── */
export const COST_TIER_MODEL: Record<string, string> = {
  low: "google/gemini-2.5-flash",
  mid: "google/gemini-2.5-flash",
  high: "google/gemini-2.5-pro",
};

export const COST_TIER_LABEL: Record<string, string> = {
  low: "⚡ Tezkor",
  mid: "🧠 Chuqur tahlil",
  high: "👁️ Vizual tahlil",
};

export function getServiceCreditCost(serviceId: string): number {
  const s = AI_SERVICE_TARIFFS.find(t => t.id === serviceId);
  return s?.creditCost ?? 2;
}

export function getServiceOriginalCost(serviceId: string): number {
  const s = AI_SERVICE_TARIFFS.find(t => t.id === serviceId);
  return s?.originalCost ?? s?.creditCost ?? 2;
}

export function getServiceDiscountPct(serviceId: string): number {
  const s = AI_SERVICE_TARIFFS.find(t => t.id === serviceId);
  if (!s || !s.originalCost || s.originalCost <= s.creditCost) return 0;
  return Math.round(((s.originalCost - s.creditCost) / s.originalCost) * 100);
}

export function getServiceModel(serviceId: string): string {
  const s = AI_SERVICE_TARIFFS.find(t => t.id === serviceId);
  return COST_TIER_MODEL[s?.costTier ?? "mid"] ?? COST_TIER_MODEL.mid;
}
