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
  { id: "symptom-checker", name: "AI Erta Diagnostika", icon: Stethoscope, monthlyPrice: 29000, yearlyPrice: 279000, tier: "standard" as const },
  { id: "ai-doctor-chat", name: "AI Shifokor Chat", icon: Bot, monthlyPrice: 39000, yearlyPrice: 379000, tier: "standard" as const },
  { id: "ai-report-analysis", name: "Analiz Tahlili", icon: FileText, monthlyPrice: 35000, yearlyPrice: 339000, tier: "premium" as const },
  { id: "ai-health-risk", name: "Sog'liq Xavfi Prognozi", icon: HeartPulse, monthlyPrice: 25000, yearlyPrice: 239000, tier: "standard" as const },
  { id: "ai-radiology", name: "AI Radiologiya Pro", icon: Eye, monthlyPrice: 49000, yearlyPrice: 479000, tier: "premium" as const },
  { id: "ai-health-assistant", name: "AI Sog'liq Assistent", icon: UserCheck, monthlyPrice: 45000, yearlyPrice: 429000, tier: "standard" as const },
  { id: "ai-pregnancy", name: "AI Homiladorlik", icon: Baby, monthlyPrice: 35000, yearlyPrice: 339000, tier: "standard" as const },
  { id: "ai-baby-care", name: "AI Bola Parvarishi", icon: Baby, monthlyPrice: 29000, yearlyPrice: 279000, tier: "standard" as const },
  { id: "ai-cosmetology", name: "AI Kosmetologiya", icon: Palette, monthlyPrice: 35000, yearlyPrice: 339000, tier: "standard" as const },
  { id: "ai-dietolog", name: "AI Dietolog", icon: UtensilsCrossed, monthlyPrice: 29000, yearlyPrice: 279000, tier: "lite" as const },
  { id: "ai-psixolog", name: "AI Psixolog", icon: Heart, monthlyPrice: 39000, yearlyPrice: 379000, tier: "standard" as const },
  { id: "ai-farmatsevt", name: "AI Farmatsevt", icon: Pill, monthlyPrice: 25000, yearlyPrice: 239000, tier: "lite" as const },
  { id: "ai-fitness", name: "AI Fitness Trener", icon: Dumbbell, monthlyPrice: 25000, yearlyPrice: 239000, tier: "lite" as const },
  { id: "ai-vital-signs", name: "AI Vital Signs", icon: Activity, monthlyPrice: 35000, yearlyPrice: 339000, tier: "standard" as const },
] as const;

/* ─── Tier definitions ─── */
export type SubscriptionTier = "free" | "lite" | "standard" | "premium" | "custom";

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  dailyTextLimit: number;
  dailyImageLimit: number;
  model: string;
  services: string[];
  popular?: boolean;
}

const LITE_SERVICES = ["ai-dietolog", "ai-farmatsevt", "ai-fitness", "ai-vital-signs"];
const STANDARD_SERVICES = [
  ...LITE_SERVICES,
  "symptom-checker", "ai-doctor-chat", "ai-health-risk", "ai-health-assistant",
  "ai-psixolog", "ai-pregnancy", "ai-baby-care", "ai-cosmetology",
];
const PREMIUM_SERVICES = AI_SERVICE_TARIFFS.map(s => s.id);

export const TIER_CONFIGS: TierConfig[] = [
  {
    id: "free",
    name: "Bepul",
    monthlyPrice: 0,
    yearlyPrice: 0,
    dailyTextLimit: 1,
    dailyImageLimit: 0,
    model: "google/gemini-2.5-flash-lite",
    services: PREMIUM_SERVICES,
  },
  {
    id: "lite",
    name: "Lite",
    monthlyPrice: 35000,
    yearlyPrice: 336000,
    dailyTextLimit: 20,
    dailyImageLimit: 0,
    model: "google/gemini-3-flash-preview",
    services: LITE_SERVICES,
  },
  {
    id: "standard",
    name: "Standard",
    monthlyPrice: 59000,
    yearlyPrice: 566000,
    dailyTextLimit: 50,
    dailyImageLimit: 5,
    model: "google/gemini-3.1-pro-preview",
    services: STANDARD_SERVICES,
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 99000,
    yearlyPrice: 950000,
    dailyTextLimit: 100,
    dailyImageLimit: 15,
    model: "openai/gpt-5.2",
    services: PREMIUM_SERVICES,
  },
];

export const getTierConfig = (tier: SubscriptionTier): TierConfig =>
  TIER_CONFIGS.find(t => t.id === tier) || TIER_CONFIGS[0];
