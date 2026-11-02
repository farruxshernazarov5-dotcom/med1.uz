import { Activity, Apple, Baby, Bone, Bot, Brain, CircleDot, Dumbbell, FileScan, HeartHandshake, HeartPulse, Pill, Ribbon, Salad, ScanLine, Sparkles, Stethoscope, Wind } from "lucide-react";
import type { MobileServiceItem } from "./mobileServiceCatalog";

export const MOBILE_AI_SERVICES: MobileServiceItem[] = [
  { id: "symptom-checker", title: "Simptom tekshirgich", description: "Belgilar bo‘yicha xavfni baholash", path: "/symptom-checker", category: "ai", aiGroup: "main", icon: Activity, badge: "Ommabop", featured: true, tone: "bg-destructive/10 text-destructive" },
  { id: "ai-doctor-chat", title: "AI Shifokor chati", description: "Tibbiy savollarga tezkor javob", path: "/ai-doctor-chat", category: "ai", aiGroup: "main", icon: Bot, badge: "Ommabop", featured: true, tone: "bg-primary/10 text-primary" },
  { id: "ai-report-analysis", title: "Laboratoriya tahlili OCR", description: "Analiz varaqasini suratdan o‘qish", path: "/ai-report-analysis", category: "ai", aiGroup: "main", icon: FileScan, badge: "Ommabop", featured: true, tone: "bg-medical-green/10 text-medical-green" },
  { id: "ai-health-risk", title: "Salomatlik xavfi", description: "Shaxsiy xavf omillarini hisoblash", path: "/ai-health-risk", category: "ai", aiGroup: "main", icon: HeartPulse, tone: "bg-destructive/10 text-destructive" },
  { id: "ai-radiology", title: "Radiologiya AI", description: "Rentgen, MRT va KT tasvirlari", path: "/ai-radiology", category: "ai", aiGroup: "main", icon: ScanLine, badge: "Ommabop", featured: true, tone: "bg-ai-purple/10 text-ai-purple" },
  { id: "ai-health-assistant", title: "Salomatlik assistenti", description: "Kundalik sog‘liq bo‘yicha ko‘mak", path: "/ai-health-assistant", category: "ai", aiGroup: "main", icon: Stethoscope, tone: "bg-primary/10 text-primary" },
  { id: "ai-pregnancy", title: "Homiladorlik AI", description: "Homiladorlik davri bo‘yicha yordam", path: "/ai-pregnancy", category: "ai", aiGroup: "main", icon: HeartHandshake, tone: "bg-destructive/10 text-destructive" },
  { id: "ai-baby-care", title: "Bolalar parvarishi AI", description: "Bola salomatligi va parvarishi", path: "/ai-baby-care", category: "ai", aiGroup: "main", icon: Baby, tone: "bg-primary/10 text-primary" },
  { id: "ai-cosmetology", title: "Kosmetologiya AI", description: "Teri holati va parvarish tavsiyalari", path: "/ai-cosmetology", category: "ai", aiGroup: "main", icon: Sparkles, tone: "bg-ai-purple/10 text-ai-purple" },
  { id: "ai-dietolog", title: "AI Dietolog", description: "Ovqatlanish rejasi va tavsiyalar", path: "/ai-dietolog", category: "ai", aiGroup: "main", icon: Salad, tone: "bg-medical-green/10 text-medical-green" },
  { id: "ai-psixolog", title: "AI Psixolog", description: "Ruhiy holat bo‘yicha suhbat", path: "/ai-psixolog", category: "ai", aiGroup: "main", icon: Brain, tone: "bg-ai-purple/10 text-ai-purple" },
  { id: "ai-farmatsevt", title: "AI Farmatsevt", description: "Dorilar va o‘zaro ta’sir ma’lumoti", path: "/ai-farmatsevt", category: "ai", aiGroup: "main", icon: Pill, tone: "bg-primary/10 text-primary" },
  { id: "ai-fitness", title: "AI Fitnes", description: "Shaxsiy mashq va faollik rejasi", path: "/ai-fitness", category: "ai", aiGroup: "main", icon: Dumbbell, tone: "bg-medical-green/10 text-medical-green" },
  { id: "ai-vital-signs", title: "Vital ko‘rsatkichlar", description: "Puls, bosim va SpO₂ monitoringi", path: "/ai-vital-signs", category: "ai", aiGroup: "main", icon: Activity, badge: "Yangi", featured: true, tone: "bg-destructive/10 text-destructive" },
  { id: "radiology-pulmonology", title: "Pulmonologiya", description: "Chest X-ray + CT", path: "/ai-radiology/pulmonology", category: "ai", aiGroup: "radiology", icon: Wind, badge: "Yangi", tone: "bg-primary/10 text-primary" },
  { id: "radiology-brain", title: "Miya / Brain", description: "MRI / CT · ASPECTS", path: "/ai-radiology/brain", category: "ai", aiGroup: "radiology", icon: Brain, tone: "bg-ai-purple/10 text-ai-purple" },
  { id: "radiology-bone", title: "Suyak-Skelet", description: "AO/OTA · Fracture", path: "/ai-radiology/bone", category: "ai", aiGroup: "radiology", icon: Bone, tone: "bg-primary/10 text-primary" },
  { id: "radiology-chest-ct", title: "Ko‘krak KT", description: "HRCT · Lung-RADS", path: "/ai-radiology/chest-ct", category: "ai", aiGroup: "radiology", icon: ScanLine, tone: "bg-medical-green/10 text-medical-green" },
  { id: "radiology-mammography", title: "Mammografiya", description: "BI-RADS 0–6", path: "/ai-radiology/mammography", category: "ai", aiGroup: "radiology", icon: Ribbon, tone: "bg-destructive/10 text-destructive" },
  { id: "radiology-abdomen", title: "Qorin bo‘shlig‘i", description: "LI-RADS · Abdomen", path: "/ai-radiology/abdomen", category: "ai", aiGroup: "radiology", icon: Apple, tone: "bg-medical-green/10 text-medical-green" },
  { id: "radiology-spine", title: "Umurtqa / Spine", description: "Pfirrmann · MRI", path: "/ai-radiology/spine", category: "ai", aiGroup: "radiology", icon: Bone, tone: "bg-ai-purple/10 text-ai-purple" },
  { id: "ai-oncology", title: "AI Onkologiya", description: "Onkologik holat bo‘yicha yordam", path: "/ai-oncology", category: "ai", aiGroup: "special", icon: Ribbon, badge: "Yangi", featured: true, tone: "bg-destructive/10 text-destructive" },
  { id: "ai-diabetes", title: "AI Qandli Diabet", description: "Glyukoza va diabet nazorati", path: "/ai-diabetes", category: "ai", aiGroup: "special", icon: CircleDot, badge: "Yangi", tone: "bg-medical-green/10 text-medical-green" },
];

