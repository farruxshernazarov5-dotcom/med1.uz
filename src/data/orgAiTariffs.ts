import {
  Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Baby,
  Palette, UtensilsCrossed, Heart, Pill, Dumbbell, Building2,
  Microscope, Siren, Sparkles, type LucideIcon,
} from "lucide-react";

// ─── AI service definitions ───
export interface AiService {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

export const ALL_AI_SERVICES: AiService[] = [
  { id: "symptom-checker", name: "AI Erta Diagnostika", icon: Stethoscope, description: "Simptomlarni tahlil qilish" },
  { id: "ai-doctor-chat", name: "AI Shifokor Chat", icon: Bot, description: "AI shifokor bilan suhbat" },
  { id: "ai-report-analysis", name: "Analiz Tahlili", icon: FileText, description: "Laboratoriya natijalarini tahlil" },
  { id: "ai-health-risk", name: "Salomatlik Prognozi", icon: HeartPulse, description: "Sog'liq xavfini baholash" },
  { id: "ai-radiology", name: "AI Radiologiya", icon: Eye, description: "Rentgen/MRT tahlili" },
  { id: "ai-health-assistant", name: "AI Assistent", icon: UserCheck, description: "Umumiy sog'liq maslahat" },
  { id: "ai-pregnancy", name: "AI Homiladorlik", icon: Baby, description: "Homiladorlik monitoringi" },
  { id: "ai-baby-care", name: "AI Bola Parvarishi", icon: Baby, description: "Chaqaloq parvarish maslahati" },
  { id: "ai-cosmetology", name: "AI Kosmetologiya", icon: Palette, description: "Teri va go'zallik tahlili" },
  { id: "ai-dietolog", name: "AI Dietolog", icon: UtensilsCrossed, description: "Ovqatlanish rejasi" },
  { id: "ai-psixolog", name: "AI Psixolog", icon: Heart, description: "Ruhiy salomatlik maslahati" },
  { id: "ai-farmatsevt", name: "AI Farmatsevt", icon: Pill, description: "Dori o'zaro ta'siri tekshiruv" },
  { id: "ai-fitness", name: "AI Fitness", icon: Dumbbell, description: "Mashq rejasi" },
];

// ─── Organization types ───
export interface OrgType {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const ORG_TYPES: OrgType[] = [
  { id: "clinic", name: "Klinikalar", icon: Building2, color: "text-[hsl(214,84%,56%)]", bgColor: "bg-[hsl(214,84%,56%)]/10" },
  { id: "diagnostics", name: "Diagnostika markazlari", icon: Microscope, color: "text-[hsl(180,60%,45%)]", bgColor: "bg-[hsl(180,60%,45%)]/10" },
  { id: "pharmacy", name: "Dorixonalar", icon: Pill, color: "text-[hsl(145,63%,42%)]", bgColor: "bg-[hsl(145,63%,42%)]/10" },
  { id: "emergency", name: "Tez tibbiy yordam", icon: Siren, color: "text-[hsl(0,72%,55%)]", bgColor: "bg-[hsl(0,72%,55%)]/10" },
  { id: "cosmetology", name: "Kosmetologiya", icon: Sparkles, color: "text-[hsl(250,100%,69%)]", bgColor: "bg-[hsl(250,100%,69%)]/10" },
];

// ─── Tariff plan per org type ───
export interface OrgAiTariffPlan {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  dailyLimit: number; // requests per day per service
  services: string[]; // included service IDs
  features: string[];
  highlighted?: boolean;
}

export interface OrgAiTariffs {
  orgType: string;
  plans: OrgAiTariffPlan[];
}

// ─── Clinic AI Tariffs ───
const CLINIC_PLANS: OrgAiTariffPlan[] = [
  {
    id: "clinic-starter",
    name: "Starter",
    monthlyPrice: 149_000,
    yearlyPrice: 1_490_000,
    dailyLimit: 10,
    services: ["symptom-checker", "ai-doctor-chat", "ai-report-analysis"],
    features: [
      "3 ta asosiy AI xizmat",
      "Kuniga 10 ta so'rov",
      "Simptom tekshiruv",
      "Shifokor chat",
      "Analiz tahlili",
    ],
  },
  {
    id: "clinic-pro",
    name: "Professional",
    badge: "Tavsiya etiladi",
    monthlyPrice: 349_000,
    yearlyPrice: 3_490_000,
    dailyLimit: 50,
    highlighted: true,
    services: [
      "symptom-checker", "ai-doctor-chat", "ai-report-analysis",
      "ai-health-risk", "ai-radiology", "ai-health-assistant",
      "ai-farmatsevt",
    ],
    features: [
      "7 ta AI xizmat",
      "Kuniga 50 ta so'rov",
      "Radiologiya AI",
      "Salomatlik prognozi",
      "Dori ta'siri tekshiruv",
      "Sog'liq assistenti",
      "Ustuvor qo'llab-quvvatlash",
    ],
  },
  {
    id: "clinic-enterprise",
    name: "Enterprise",
    badge: "Eng kuchli",
    monthlyPrice: 699_000,
    yearlyPrice: 6_990_000,
    dailyLimit: -1, // unlimited
    services: ALL_AI_SERVICES.map(s => s.id),
    features: [
      "Barcha 13 ta AI xizmat",
      "Cheksiz so'rovlar",
      "AI Homiladorlik & Bola parvarish",
      "AI Psixolog & Dietolog",
      "AI Fitness trener",
      "Shaxsiy menejer",
      "24/7 qo'llab-quvvatlash",
      "API integratsiya",
    ],
  },
];

// ─── Diagnostics AI Tariffs ───
const DIAGNOSTICS_PLANS: OrgAiTariffPlan[] = [
  {
    id: "diag-starter",
    name: "Starter",
    monthlyPrice: 199_000,
    yearlyPrice: 1_990_000,
    dailyLimit: 15,
    services: ["ai-report-analysis", "ai-radiology", "symptom-checker"],
    features: [
      "3 ta diagnostika AI",
      "Kuniga 15 ta so'rov",
      "Analiz tahlili",
      "Radiologiya AI",
      "Simptom checker",
    ],
  },
  {
    id: "diag-pro",
    name: "Professional",
    badge: "Tavsiya etiladi",
    monthlyPrice: 449_000,
    yearlyPrice: 4_490_000,
    dailyLimit: 100,
    highlighted: true,
    services: [
      "ai-report-analysis", "ai-radiology", "symptom-checker",
      "ai-health-risk", "ai-doctor-chat", "ai-health-assistant",
    ],
    features: [
      "6 ta AI xizmat",
      "Kuniga 100 ta so'rov",
      "Salomatlik prognozi",
      "AI Shifokor chat",
      "Sog'liq assistenti",
      "Ustuvor qo'llab-quvvatlash",
    ],
  },
  {
    id: "diag-enterprise",
    name: "Enterprise",
    badge: "Eng kuchli",
    monthlyPrice: 849_000,
    yearlyPrice: 8_490_000,
    dailyLimit: -1,
    services: ALL_AI_SERVICES.map(s => s.id),
    features: [
      "Barcha 13 ta AI xizmat",
      "Cheksiz so'rovlar",
      "Shaxsiy menejer",
      "24/7 qo'llab-quvvatlash",
      "API integratsiya",
      "Maxsus model sozlash",
    ],
  },
];

// ─── Pharmacy AI Tariffs ───
const PHARMACY_PLANS: OrgAiTariffPlan[] = [
  {
    id: "pharm-starter",
    name: "Starter",
    monthlyPrice: 99_000,
    yearlyPrice: 990_000,
    dailyLimit: 20,
    services: ["ai-farmatsevt", "ai-health-assistant"],
    features: [
      "2 ta AI xizmat",
      "Kuniga 20 ta so'rov",
      "Dori o'zaro ta'siri",
      "Sog'liq assistenti",
    ],
  },
  {
    id: "pharm-pro",
    name: "Professional",
    badge: "Tavsiya etiladi",
    monthlyPrice: 249_000,
    yearlyPrice: 2_490_000,
    dailyLimit: 80,
    highlighted: true,
    services: [
      "ai-farmatsevt", "ai-health-assistant", "ai-doctor-chat",
      "ai-dietolog", "symptom-checker",
    ],
    features: [
      "5 ta AI xizmat",
      "Kuniga 80 ta so'rov",
      "AI Dietolog",
      "Simptom tekshiruv",
      "Shifokor chat",
      "Ustuvor qo'llab-quvvatlash",
    ],
  },
  {
    id: "pharm-enterprise",
    name: "Enterprise",
    badge: "Eng kuchli",
    monthlyPrice: 499_000,
    yearlyPrice: 4_990_000,
    dailyLimit: -1,
    services: ALL_AI_SERVICES.map(s => s.id),
    features: [
      "Barcha 13 ta AI xizmat",
      "Cheksiz so'rovlar",
      "Shaxsiy menejer",
      "24/7 qo'llab-quvvatlash",
      "API integratsiya",
    ],
  },
];

// ─── Emergency AI Tariffs ───
const EMERGENCY_PLANS: OrgAiTariffPlan[] = [
  {
    id: "emer-starter",
    name: "Starter",
    monthlyPrice: 199_000,
    yearlyPrice: 1_990_000,
    dailyLimit: 30,
    services: ["symptom-checker", "ai-doctor-chat", "ai-health-risk"],
    features: [
      "3 ta tez yordam AI",
      "Kuniga 30 ta so'rov",
      "Simptom tekshiruv",
      "Shifokor chat",
      "Xavf prognozi",
    ],
  },
  {
    id: "emer-pro",
    name: "Professional",
    badge: "Tavsiya etiladi",
    monthlyPrice: 449_000,
    yearlyPrice: 4_490_000,
    dailyLimit: 150,
    highlighted: true,
    services: [
      "symptom-checker", "ai-doctor-chat", "ai-health-risk",
      "ai-radiology", "ai-report-analysis", "ai-health-assistant",
      "ai-farmatsevt",
    ],
    features: [
      "7 ta AI xizmat",
      "Kuniga 150 ta so'rov",
      "AI Radiologiya",
      "Analiz tahlili",
      "Dori ta'siri tekshiruv",
      "Tezkor AI diagnostika",
      "Ustuvor qo'llab-quvvatlash",
    ],
  },
  {
    id: "emer-enterprise",
    name: "Enterprise",
    badge: "Eng kuchli",
    monthlyPrice: 899_000,
    yearlyPrice: 8_990_000,
    dailyLimit: -1,
    services: ALL_AI_SERVICES.map(s => s.id),
    features: [
      "Barcha 13 ta AI xizmat",
      "Cheksiz so'rovlar",
      "Shaxsiy menejer",
      "24/7 qo'llab-quvvatlash",
      "API integratsiya",
      "Real-time AI monitoring",
    ],
  },
];

// ─── Cosmetology AI Tariffs ───
const COSMETOLOGY_PLANS: OrgAiTariffPlan[] = [
  {
    id: "cosm-starter",
    name: "Starter",
    monthlyPrice: 99_000,
    yearlyPrice: 990_000,
    dailyLimit: 10,
    services: ["ai-cosmetology", "ai-health-assistant"],
    features: [
      "2 ta AI xizmat",
      "Kuniga 10 ta so'rov",
      "AI Kosmetologiya tahlili",
      "Sog'liq assistenti",
    ],
  },
  {
    id: "cosm-pro",
    name: "Professional",
    badge: "Tavsiya etiladi",
    monthlyPrice: 249_000,
    yearlyPrice: 2_490_000,
    dailyLimit: 50,
    highlighted: true,
    services: [
      "ai-cosmetology", "ai-health-assistant", "ai-dietolog",
      "ai-fitness", "ai-doctor-chat",
    ],
    features: [
      "5 ta AI xizmat",
      "Kuniga 50 ta so'rov",
      "AI Dietolog",
      "AI Fitness",
      "Shifokor chat",
      "Ustuvor qo'llab-quvvatlash",
    ],
  },
  {
    id: "cosm-enterprise",
    name: "Enterprise",
    badge: "Eng kuchli",
    monthlyPrice: 499_000,
    yearlyPrice: 4_990_000,
    dailyLimit: -1,
    services: ALL_AI_SERVICES.map(s => s.id),
    features: [
      "Barcha 13 ta AI xizmat",
      "Cheksiz so'rovlar",
      "Shaxsiy menejer",
      "24/7 qo'llab-quvvatlash",
      "API integratsiya",
    ],
  },
];

// ─── Aggregated exports ───
export const ORG_AI_TARIFFS: OrgAiTariffs[] = [
  { orgType: "clinic", plans: CLINIC_PLANS },
  { orgType: "diagnostics", plans: DIAGNOSTICS_PLANS },
  { orgType: "pharmacy", plans: PHARMACY_PLANS },
  { orgType: "emergency", plans: EMERGENCY_PLANS },
  { orgType: "cosmetology", plans: COSMETOLOGY_PLANS },
];

export function getOrgTariffs(orgType: string): OrgAiTariffPlan[] {
  return ORG_AI_TARIFFS.find(t => t.orgType === orgType)?.plans || [];
}

export function getServiceById(id: string): AiService | undefined {
  return ALL_AI_SERVICES.find(s => s.id === id);
}
