import {
  Activity, Apple, Baby, BadgeCheck, Bone, Bot, Brain, BriefcaseBusiness,
  Building2, CircleDot, Cross, Droplets, Dumbbell, FileCheck2, FileScan,
  FlaskConical, GraduationCap, HeartHandshake, HeartPulse, Megaphone,
  Microscope, Newspaper, Pill, Ribbon, Salad, ScanLine, ShieldCheck,
  Smile, Sparkles, Stethoscope, UserRoundPlus, UsersRound, Wind, Wrench,
  type LucideIcon,
} from "lucide-react";

export type MobileServiceCategory = "care" | "ai" | "knowledge" | "publications" | "business" | "cabinet";
export type MobileServiceBadge = "Ommabop" | "Yangi" | "24/7";

export type MobileServiceItem = {
  id: string;
  title: string;
  description: string;
  path: string;
  category: MobileServiceCategory;
  icon: LucideIcon;
  tone: string;
  badge?: MobileServiceBadge;
  featured?: boolean;
  aiGroup?: "main" | "radiology" | "special";
};

export const MOBILE_CATEGORY_LABELS: Record<MobileServiceCategory, string> = {
  care: "Tibbiy xizmatlar",
  ai: "Med1 AI",
  knowledge: "Bilim va dorilar",
  publications: "Nashr va tekshiruv",
  business: "Biznes va reklama",
  cabinet: "Kabinetlar",
};

const care: MobileServiceItem[] = [
  { id: "doctors", title: "Shifokorlar", description: "Mutaxassis topish va qabulga yozilish", path: "/doctors", category: "care", icon: Stethoscope, tone: "bg-primary/10 text-primary", badge: "Ommabop", featured: true },
  { id: "clinics", title: "Klinikalar", description: "Klinikalar, manzillar va xizmatlar", path: "/clinics", category: "care", icon: Building2, tone: "bg-secondary/10 text-secondary", badge: "Ommabop", featured: true },
  { id: "diagnostics", title: "Diagnostika", description: "Tahlil va tekshiruv markazlari", path: "/diagnostics", category: "care", icon: Microscope, tone: "bg-ai-purple/10 text-ai-purple", featured: true },
  { id: "pharmacies", title: "Dorixonalar", description: "Dorixona va dori qidirish", path: "/pharmacies", category: "care", icon: Pill, tone: "bg-medical-green/10 text-medical-green", featured: true },
  { id: "blood-banks", title: "Qon banklari", description: "Qon markazlari va donorlik", path: "/blood-banks", category: "care", icon: Droplets, tone: "bg-destructive/10 text-destructive", badge: "24/7", featured: true },
  { id: "maternity", title: "Tug‘ruqxonalar", description: "Tug‘ruq muassasalari katalogi", path: "/maternity", category: "care", icon: Baby, tone: "bg-ai-purple/10 text-ai-purple", featured: true },
  { id: "dental", title: "Stomatologiya", description: "Stomatolog va klinikalar", path: "/dental", category: "care", icon: Smile, tone: "bg-secondary/10 text-secondary", featured: true },
  { id: "med-tech", title: "MedTexnika", description: "Tibbiy uskuna va jihozlar", path: "/med-tech", category: "care", icon: Wrench, tone: "bg-medical-orange/10 text-medical-orange" },
];

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

const knowledge: MobileServiceItem[] = [
  { id: "diseases", title: "Kasalliklar va ICD-10", description: "Kasalliklar tasnifi va tushuntirishlar", path: "/diseases", category: "knowledge", icon: ShieldCheck, tone: "bg-destructive/10 text-destructive" },
  { id: "medicine", title: "Dori vositalari", description: "Dorilar va tibbiy atamalar bazasi", path: "/medicine", category: "knowledge", icon: Pill, tone: "bg-medical-green/10 text-medical-green" },
  { id: "knowledge", title: "Tibbiy ensiklopediya", description: "Ishonchli tibbiy bilimlar kutubxonasi", path: "/knowledge", category: "knowledge", icon: GraduationCap, tone: "bg-primary/10 text-primary" },
  { id: "articles", title: "Tibbiy maqolalar", description: "Mutaxassislar tayyorlagan maqolalar", path: "/articles", category: "knowledge", icon: Newspaper, tone: "bg-secondary/10 text-secondary" },
];

const publications: MobileServiceItem[] = [
  { id: "publications-yunusova", title: "Ilmiy nashrlar", description: "Universitet mualliflari va ilmiy-amaliy ishlar", path: "/otm/samarqand-davlat-tibbiyot-universiteti/yunusova-aziza", category: "publications", icon: GraduationCap, tone: "bg-ai-purple/10 text-ai-purple" },
  { id: "verify", title: "Hujjat tekshiruvi", description: "Hisobot, shartnoma va sertifikatni tekshirish", path: "/verify", category: "publications", icon: FileCheck2, tone: "bg-medical-green/10 text-medical-green", badge: "Ommabop" },
  { id: "legal-center", title: "Legal Center", description: "Huquqiy hujjatlar va roziliklar", path: "/legal-center", category: "publications", icon: BadgeCheck, tone: "bg-primary/10 text-primary" },
];

const business: MobileServiceItem[] = [
  { id: "doctor-register", title: "Shifokorni ro‘yxatdan o‘tkazish", description: "Professional profil ochish", path: "/doctor-register", category: "business", icon: UserRoundPlus, tone: "bg-primary/10 text-primary" },
  { id: "clinic-register", title: "Klinikani ro‘yxatdan o‘tkazish", description: "Muassasani Med1.uz’ga qo‘shish", path: "/clinic-register", category: "business", icon: Building2, tone: "bg-secondary/10 text-secondary" },
  { id: "med1-top", title: "Med1 TOP reklamalari", description: "Alohida belgilangan tibbiy reklama maydoni", path: "/med1-top", category: "business", icon: Megaphone, tone: "bg-medical-orange/10 text-medical-orange", badge: "Ommabop" },
  { id: "med1-top-new", title: "Reklama joylashtirish", description: "Med1 TOP kampaniyasini yaratish", path: "/med1-top/new", category: "business", icon: Sparkles, tone: "bg-ai-purple/10 text-ai-purple" },
  { id: "partnership", title: "Hamkorlik", description: "Klinika va bizneslar uchun hamkorlik", path: "/partnership", category: "business", icon: HeartHandshake, tone: "bg-medical-green/10 text-medical-green" },
];

const cabinets: MobileServiceItem[] = [
  { id: "patient-cabinet", title: "Bemor kabineti", description: "Qabullar, tahlillar va salomatlik tarixi", path: "/dashboard/patient", category: "cabinet", icon: UsersRound, tone: "bg-primary/10 text-primary" },
  { id: "doctor-cabinet", title: "Shifokor kabineti", description: "Qabul va bemorlar boshqaruvi", path: "/dashboard/doctor", category: "cabinet", icon: Stethoscope, tone: "bg-secondary/10 text-secondary" },
  { id: "clinic-cabinet", title: "Klinika kabineti", description: "Klinika ish jarayonlari", path: "/dashboard/clinic", category: "cabinet", icon: Building2, tone: "bg-medical-green/10 text-medical-green" },
  { id: "business-cabinet", title: "Biznes kabineti", description: "Hamkorlik va xizmatlarni boshqarish", path: "/dashboard/vendor", category: "cabinet", icon: BriefcaseBusiness, tone: "bg-ai-purple/10 text-ai-purple" },
];

export const MOBILE_SERVICE_CATALOG = [...care, ...MOBILE_AI_SERVICES, ...knowledge, ...publications, ...business, ...cabinets];
export const MOBILE_QUICK_SERVICES = care.filter((service) => service.featured);
