import { MOBILE_AI_SERVICES } from "./mobileAiCatalog";
import {
  Activity, Apple, Baby, BadgeCheck, Bone, Bot, Brain, BriefcaseBusiness,
  Building2, CircleDot, Droplets, Dumbbell, FileCheck2, FileScan,
  GraduationCap, HeartHandshake, HeartPulse, Megaphone,
  Microscope, Newspaper, Pill, Ribbon, Salad, ScanLine, ShieldCheck,
  Smile, Sparkles, Stethoscope, UserRoundPlus, UsersRound, Wind, Wrench,
  type LucideIcon,
  CalendarCheck, Clapperboard,
} from "lucide-react";
import { MOBILE_SERVICE_IMAGES } from "@/data/mobileServiceImages";
import { MOBILE_SERVICE_STORIES, type MobileServiceStory } from "@/data/mobileServiceStories";

export type MobileServiceCategory = "care" | "ai" | "knowledge" | "publications" | "business" | "cabinet";
export type MobileServiceBadge = "Ommabop" | "Yangi" | "24/7";

export type MobileServiceItem = {
  id: string;
  title: string;
  description: string;
  path: string;
  category: MobileServiceCategory;
  icon: LucideIcon;
  image?: string;
  story?: MobileServiceStory;
  tone: string;
  badge?: MobileServiceBadge;
  featured?: boolean;
  aiGroup?: "main" | "radiology" | "special";
};

export const MOBILE_CATEGORY_LABELS: Record<MobileServiceCategory, string> = {
  care: "Tibbiy xizmatlar",
  ai: "Med AI",
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

export { MOBILE_AI_SERVICES } from "./mobileAiCatalog";

const knowledge: MobileServiceItem[] = [
  { id: "diseases", title: "Kasalliklar va ICD-10", description: "Kasalliklar tasnifi va tushuntirishlar", path: "/diseases", category: "knowledge", icon: ShieldCheck, tone: "bg-destructive/10 text-destructive" },
  { id: "medicine", title: "Dori vositalari", description: "Dorilar va tibbiy atamalar bazasi", path: "/medicine", category: "knowledge", icon: Pill, tone: "bg-medical-green/10 text-medical-green" },
  { id: "knowledge", title: "Tibbiy ensiklopediya", description: "Ishonchli tibbiy bilimlar kutubxonasi", path: "/knowledge", category: "knowledge", icon: GraduationCap, tone: "bg-primary/10 text-primary" },
  { id: "articles", title: "Tibbiy maqolalar", description: "Mutaxassislar tayyorlagan maqolalar", path: "/articles", category: "knowledge", icon: Newspaper, tone: "bg-secondary/10 text-secondary" },
  { id: "reels", title: "Med Reels", description: "Shifokor va mutaxassislarning foto-video materiallari", path: "/reels", category: "knowledge", icon: Clapperboard, tone: "bg-ai-purple/10 text-ai-purple", badge: "Yangi", featured: true },
  { id: "tips", title: "Foydali maslahatlar", description: "Kasalliklar, ensiklopediya, maqolalar, yangiliklar va tavsiyalar", path: "/mobile-tips", category: "knowledge", icon: Newspaper, tone: "bg-medical-orange/10 text-medical-orange", badge: "Yangi" },
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
  { id: "appointments", title: "Qabullar", description: "Qabullar, tahlillar va AI xulosalari", path: "/mobile-appointments", category: "cabinet", icon: CalendarCheck, tone: "bg-primary/10 text-primary", featured: true },
  { id: "patient-cabinet", title: "Bemor kabineti", description: "Qabullar, tahlillar va salomatlik tarixi", path: "/dashboard/patient", category: "cabinet", icon: UsersRound, tone: "bg-primary/10 text-primary" },
  { id: "doctor-cabinet", title: "Shifokor kabineti", description: "Qabul va bemorlar boshqaruvi", path: "/dashboard/doctor", category: "cabinet", icon: Stethoscope, tone: "bg-secondary/10 text-secondary" },
  { id: "clinic-cabinet", title: "Klinika kabineti", description: "Klinika ish jarayonlari", path: "/dashboard/clinic", category: "cabinet", icon: Building2, tone: "bg-medical-green/10 text-medical-green" },
  { id: "business-cabinet", title: "Biznes kabineti", description: "Hamkorlik va xizmatlarni boshqarish", path: "/dashboard/vendor", category: "cabinet", icon: BriefcaseBusiness, tone: "bg-ai-purple/10 text-ai-purple" },
];

const withServiceImages = (services: MobileServiceItem[]) => services.map((service) => ({
  ...service,
  image: MOBILE_SERVICE_IMAGES[service.id],
  story: MOBILE_SERVICE_STORIES[service.id],
}));

export const MOBILE_SERVICE_CATALOG = withServiceImages([...care, ...MOBILE_AI_SERVICES, ...knowledge, ...publications, ...business, ...cabinets]);
export const MOBILE_AI_SERVICES_WITH_IMAGES = MOBILE_SERVICE_CATALOG.filter((service) => service.category === "ai");
export const MOBILE_QUICK_SERVICES = MOBILE_SERVICE_CATALOG.filter((service) => service.category === "care" && service.featured);
