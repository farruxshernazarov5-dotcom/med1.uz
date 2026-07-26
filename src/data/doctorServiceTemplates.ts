/**
 * Fallback service & package catalogue for external doctors that have no
 * explicit rows in `doctor_ext_services` yet. Prices are indicative (UZS)
 * and shown as "boshlang'ich narx" in the UI.
 */
export interface ServiceTemplate {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_package?: boolean;
  sessions_count?: number;
}

const BASE: ServiceTemplate[] = [
  { name: "Birinchi konsultatsiya", description: "Shikoyatni tinglash, ko'rik va dastlabki tashxis", price: 120000, duration_minutes: 30 },
  { name: "Takroriy qabul", description: "Tahlil natijalarini ko'rib chiqish va davolashni tuzatish", price: 80000, duration_minutes: 20 },
  { name: "Onlayn video konsultatsiya", description: "Masofadan video aloqa orqali maslahat", price: 90000, duration_minutes: 25 },
  { name: "Kuzatuv paketi (3 qabul)", description: "1 oy ichida 3 marta qabul + xabar orqali savol-javob", price: 250000, duration_minutes: 30, is_package: true, sessions_count: 3 },
];

const BY_SPECIALTY: Record<string, ServiceTemplate[]> = {
  Stomatolog: [
    { name: "Ko'rik va davolash rejasi", description: "Tishlar ko'rigi, rentgen tahlili, reja tuzish", price: 100000, duration_minutes: 30 },
    { name: "Professional gigiyena", description: "Tosh olish, sayqallash, ftorlash", price: 350000, duration_minutes: 60 },
    { name: "Kariyes davolash (1 tish)", description: "Anesteziya, tozalash, kompozit plomba", price: 400000, duration_minutes: 60 },
    { name: "Implant paketi", description: "Konsultatsiya, KT, implantatsiya va nazorat", price: 6500000, duration_minutes: 90, is_package: true, sessions_count: 4 },
  ],
  Kardiolog: [
    { name: "Kardiolog konsultatsiyasi", description: "Ko'rik, bosim va yurak tinglash", price: 150000, duration_minutes: 30 },
    { name: "EKG + izoh", description: "Elektrokardiogramma va shifokor xulosasi", price: 90000, duration_minutes: 20 },
    { name: "Yurak EXO (UZI)", description: "ExoKG tekshiruvi va yozma xulosa", price: 250000, duration_minutes: 40 },
    { name: "Gipertoniya nazorat paketi", description: "3 oylik kuzatuv: 3 qabul + EKG + tavsiyalar", price: 550000, duration_minutes: 30, is_package: true, sessions_count: 3 },
  ],
  Kosmetolog: [
    { name: "Teri diagnostikasi", description: "Teri tipini aniqlash va parvarish rejasi", price: 80000, duration_minutes: 25 },
    { name: "Yuz tozalash", description: "Kombinatsiyalangan chuqur tozalash", price: 300000, duration_minutes: 60 },
    { name: "Mezoterapiya kursi", description: "4 seansdan iborat kurs", price: 1200000, duration_minutes: 45, is_package: true, sessions_count: 4 },
  ],
  Pediatr: [
    { name: "Bola ko'rigi", description: "Umumiy holat, o'sish va rivojlanish baholash", price: 100000, duration_minutes: 30 },
    { name: "Emlash oldidan ko'rik", description: "Emlashga tayyorlik va tavsiyalar", price: 70000, duration_minutes: 20 },
    { name: "Yillik kuzatuv paketi", description: "4 marta profilaktik qabul", price: 350000, duration_minutes: 30, is_package: true, sessions_count: 4 },
  ],
  Ginekolog: [
    { name: "Ginekolog ko'rigi", description: "Ko'rik, smear olish, maslahat", price: 150000, duration_minutes: 30 },
    { name: "UZI (kichik tos)", description: "Ultratovush tekshiruvi va xulosa", price: 200000, duration_minutes: 30 },
    { name: "Homiladorlik kuzatuvi", description: "Trimestr bo'ylab 3 qabul + UZI", price: 750000, duration_minutes: 40, is_package: true, sessions_count: 3 },
  ],
};

export function getServiceTemplates(specialty?: string | null): ServiceTemplate[] {
  if (!specialty) return BASE;
  const key = Object.keys(BY_SPECIALTY).find((k) => specialty.toLowerCase().includes(k.toLowerCase()));
  return key ? BY_SPECIALTY[key] : BASE;
}

export const formatUzs = (v: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(v)) + " so'm";
