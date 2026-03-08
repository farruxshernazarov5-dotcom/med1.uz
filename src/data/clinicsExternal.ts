import rawClinics from "./clinics-external.json";
import rawClinics2 from "./clinics-external-2.json";
import rawClinics3 from "./clinics-external-3.json";
import { type Clinic } from "./clinics";

interface RawClinic {
  id: string;
  external_id?: number | null;
  name: string;
  rating: number | null;
  reviews_count: number | null;
  address: string;
  district: string | null;
  landmark: string | null;
  working_hours: string | null;
  phone: string | null;
  description: string | null;
  specialties: string[];
  services: string[];
  website: string | null;
  clinic_type: string | null;
  source: string;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  socials: Record<string, string | null> | null;
  doctors_count: number | null;
  service_count: number | null;
  category?: string | null;
  legal_name?: string | null;
  email?: string | null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\[.*?\]\s*/g, "")
    .replace(/[^a-zA-Z0-9\u0400-\u04FFа-яёА-ЯЁ\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function cleanName(name: string): string {
  return name.replace(/^\[\d+\]\s*/, "").replace(/\u200B/g, "").trim();
}

function mapClinicType(type: string | null, category?: string | null): Clinic["type"] {
  const t = (type || category || "").toLowerCase();
  if (t.includes("davlat") || t.includes("государственн")) return "davlat";
  if (t.includes("poliklinika") || t.includes("поликлиника")) return "poliklinika";
  if (t.includes("103") || t.includes("tez yordam") || t.includes("скорая")) return "103";
  return "xususiy";
}

/** Map category/specialties to standardized medical direction tags */
function inferDirectionTags(specialties: string[], category?: string | null): string[] {
  const text = [...specialties, category || ""].join(" ").toLowerCase();
  const tags: string[] = [];
  const rules: [string, string[]][] = [
    ["Stomatologiya", ["стомат", "dental", "tish", "stomatolog"]],
    ["Pediatriya", ["детск", "pediatr", "bolalar", "педиатр"]],
    ["Ginekologiya", ["гинекол", "ginekolog", "акушер", "akusher"]],
    ["Kardiologiya", ["кардиол", "kardiolog", "yurak"]],
    ["Nevrologiya", ["невролог", "nevrolog", "asab"]],
    ["Oftalmologiya", ["офтальм", "глаз", "oftalmolog", "ko'z"]],
    ["Urologiya", ["уролог", "urolog"]],
    ["Otorinolaringologiya", ["лор", "lor", "отоларинг", "otorinolaringolog"]],
    ["Endokrinologiya", ["эндокрин", "endokrinolog"]],
    ["Dermatologiya", ["дерматол", "dermatolog", "teri"]],
    ["Gastroenterologiya", ["гастро", "gastroenterolog"]],
    ["Ortopediya", ["ортопед", "ortoped", "травмат", "travmatolog"]],
    ["Onkologiya", ["онколог", "onkolog"]],
    ["Pulmonologiya", ["пульмонол", "pulmonolog", "o'pka"]],
    ["Diagnostika", ["диагност", "diagnostik", "mrt", "мрт", "узи", "uzi", "kt", "кт", "лаборатор", "laborator"]],
    ["Reabilitatsiya", ["реабилит", "reabilitatsiya", "fizioterapi", "физиотерап"]],
    ["Psixiatriya", ["психиатр", "psixiatr", "психолог", "psixolog"]],
    ["Xirurgiya", ["хирург", "xirurg", "jarrohlik"]],
    ["Kosmetologiya", ["косметолог", "kosmetolog", "эстетич"]],
    ["Narkologiya", ["нарколог", "narkolog"]],
    ["Allergologiya", ["аллерг", "allergolog"]],
    ["Andrologiya", ["андролог", "androlog"]],
    ["Proktologiya", ["проктолог", "proktolog"]],
    ["Mammologiya", ["маммолог", "mammolog"]],
    ["Tibbiy markaz", ["медицинск", "tibbiyot markaz", "med center", "med centre", "med klinik"]],
  ];
  for (const [tag, keywords] of rules) {
    if (keywords.some(kw => text.includes(kw))) tags.push(tag);
  }
  if (tags.length === 0) tags.push("Umumiy amaliyot");
  return tags;
}

function mapRawClinic(raw: RawClinic, index: number): Clinic {
  const cleanedName = cleanName(raw.name);
  const slug = slugify(cleanedName) || `clinic-${raw.id.slice(0, 8)}-${index}`;

  return {
    id: `ext-${slug}`,
    name: cleanedName,
    type: mapClinicType(raw.clinic_type, raw.category),
    region: "Toshkent shahri",
    city: "Toshkent",
    district: raw.district || "",
    address: raw.address || "",
    landmark: raw.landmark || "",
    phone: raw.phone ? [raw.phone] : [],
    specialties: raw.specialties || [],
    amenities: [],
    workingHours: raw.working_hours || "Ma'lumot yo'q",
    description: raw.description ? stripHtml(raw.description) : `${cleanedName} — tibbiyot markazi.`,
    rating: raw.rating || 0,
    reviewCount: raw.reviews_count || 0,
    logo: cleanedName.slice(0, 3).toUpperCase(),
    image: "",
    specialists: [],
    reviews: [],
    coordinates: raw.latitude && raw.longitude ? { lat: raw.latitude, lng: raw.longitude } : undefined,
    website: raw.socials?.Website || raw.website || undefined,
    services: raw.services || [],
    logoUrl: raw.logo_url || undefined,
    socialLinks: raw.socials || undefined,
    directionTags: inferDirectionTags(raw.specialties, raw.category),
  };
}

// Merge all datasets and deduplicate by name (normalized)
const allRaw = [
  ...(rawClinics as RawClinic[]),
  ...(rawClinics2 as RawClinic[]),
  ...(rawClinics3 as RawClinic[]),
];

const seen = new Set<string>();
const uniqueRaw: RawClinic[] = [];
for (const raw of allRaw) {
  const key = cleanName(raw.name).toLowerCase().replace(/\s+/g, "");
  if (!seen.has(key)) {
    seen.add(key);
    uniqueRaw.push(raw);
  }
}

export const externalClinics: Clinic[] = uniqueRaw
  .map((raw, i) => mapRawClinic(raw, i))
  .sort((a, b) => {
    // Sort by first direction tag alphabetically
    const tagA = (a.directionTags?.[0] || "").toLowerCase();
    const tagB = (b.directionTags?.[0] || "").toLowerCase();
    if (tagA !== tagB) return tagA.localeCompare(tagB, "uz");
    return a.name.localeCompare(b.name, "uz");
  });
