import raw from "./dental-clinics.json";

export interface DentalClinic {
  slug: string;
  city: string;
  name: string;
  fullTitle: string | null;
  address: string;
  phones: string[];
  websites: string[];
  socials: Record<string, string> | null;
  emails: string[] | null;
  schedule: string | null;
  rating: number;
  reviewsCount: number;
  photosCount: number;
  description: string;
  /** Inferred service direction tags (Uzbek) */
  tags: string[];
  /** true when the clinic works 24/7 */
  is24h: boolean;
}

interface RawDentalClinic {
  slug: string;
  city: string;
  name: string;
  full_title: string | null;
  address: string;
  phones: string[] | null;
  websites: string[] | null;
  socials: Record<string, string> | null;
  emails: string[] | null;
  schedule: string | null;
  rating: number | null;
  reviews_count: number | null;
  photos_count: number | null;
  description: string | null;
}

const TAG_RULES: [string, string[]][] = [
  ["Implantologiya", ["implant", "имплант"]],
  ["Ortodontiya", ["ortodont", "breket", "ортодонт", "брекет", "kapa", "aligner"]],
  ["Estetik stomatologiya", ["estetik", "vinir", "эстетич", "винир", "tabassum", "oqartir", "отбелив"]],
  ["Bolalar stomatologiyasi", ["bolalar", "детск", "child", "kids"]],
  ["Ortopediya (protezlash)", ["protez", "ortoped", "коронк", "протез", "koronka"]],
  ["Jarrohlik", ["jarroh", "xirurg", "хирург", "implantatsiya", "olib tashlash"]],
  ["Terapiya", ["terapi", "davolash", "karies", "кариес", "kanal"]],
  ["Gigiyena va profilaktika", ["gigiyena", "profilaktik", "гигиен", "tozalash", "чистка"]],
  ["Diagnostika (rentgen/KT)", ["rentgen", "рентген", "kt", "3d", "opg", "panoram"]],
];

function inferTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags = TAG_RULES.filter(([, kws]) => kws.some((k) => t.includes(k))).map(([tag]) => tag);
  return tags.length ? tags : ["Umumiy stomatologiya"];
}

function mapClinic(r: RawDentalClinic): DentalClinic {
  const description = (r.description || "Stomatologiya klinikasi").trim();
  const schedule = r.schedule || null;
  return {
    slug: r.slug,
    city: r.city || "Toshkent",
    name: (r.name || "").replace(/\s+/g, " ").trim(),
    fullTitle: r.full_title,
    address: r.address || "",
    phones: (r.phones || []).filter(Boolean),
    websites: (r.websites || []).filter((w) => w && !w.includes("med1.uz")),
    socials: r.socials || null,
    emails: r.emails && r.emails.length ? r.emails : null,
    schedule,
    rating: r.rating ?? 0,
    reviewsCount: r.reviews_count ?? 0,
    photosCount: r.photos_count ?? 0,
    description,
    tags: inferTags(`${r.name} ${description}`),
    is24h: !!schedule && /24\/7|kechayu kunduz|круглосуточ/i.test(schedule),
  };
}

export const dentalClinics: DentalClinic[] = (raw as RawDentalClinic[])
  .map(mapClinic)
  .filter((c) => c.name && c.slug)
  .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount || a.name.localeCompare(b.name, "uz"));

export const dentalCities: string[] = Array.from(new Set(dentalClinics.map((c) => c.city))).sort((a, b) =>
  a.localeCompare(b, "uz"),
);

export const dentalTags: string[] = Array.from(new Set(dentalClinics.flatMap((c) => c.tags))).sort((a, b) =>
  a.localeCompare(b, "uz"),
);

export const getDentalClinic = (slug: string): DentalClinic | undefined =>
  dentalClinics.find((c) => c.slug === slug);

/** Region label used in doctors_external (Russian) for a given clinic city. */
export const cityToDoctorRegion: Record<string, string> = {
  Toshkent: "Ташкент",
  Samarqand: "Самарканд",
  Andijon: "Андижан",
  Namangan: "Наманган",
  "Farg'ona": "Фергана",
  "Qo'qon": "Коканд",
  Navoiy: "Навои",
  Qarshi: "Карши",
  Termiz: "Термез",
  Urganch: "Ургенч",
  Chirchiq: "Чирчик",
};

export const DENTAL_DOCTOR_SPECIALTIES = [
  "Стоматолог",
  "Стоматолог-терапевт",
  "Стоматолог-хирург",
  "Стоматолог-ортодонт",
  "Стоматолог-ортопед",
  "Стоматолог-гигиенист",
  "Стоматолог-имплантолог",
  "Стоматолог-пародонтолог",
  "Детские стоматологи",
];
