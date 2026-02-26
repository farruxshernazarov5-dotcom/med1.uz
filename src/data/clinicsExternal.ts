import rawClinics from "./clinics-external.json";
import { type Clinic } from "./clinics";

interface RawClinic {
  id: string;
  external_id: number;
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

function mapClinicType(type: string | null): Clinic["type"] {
  if (!type) return "xususiy";
  const t = type.toLowerCase();
  if (t.includes("davlat") || t.includes("государственн")) return "davlat";
  if (t.includes("poliklinika") || t.includes("поликлиника")) return "poliklinika";
  if (t.includes("103") || t.includes("tez yordam") || t.includes("скорая")) return "103";
  return "xususiy";
}

export const externalClinics: Clinic[] = (rawClinics as RawClinic[]).map((raw) => {
  const cleanedName = cleanName(raw.name);
  const slug = slugify(cleanedName) || `clinic-${raw.external_id}`;
  
  return {
    id: `ext-${slug}`,
    name: cleanedName,
    type: mapClinicType(raw.clinic_type),
    region: "Toshkent shahri",
    city: "Toshkent",
    district: raw.district || "",
    address: raw.address || "",
    landmark: raw.landmark || "",
    phone: raw.phone ? [raw.phone] : [],
    specialties: raw.specialties || [],
    amenities: [],
    workingHours: raw.working_hours || "Ma'lumot yo'q",
    description: raw.description ? stripHtml(raw.description) : `${cleanedName} — Toshkent shahridagi tibbiyot markazi.`,
    rating: raw.rating || 0,
    reviewCount: raw.reviews_count || 0,
    logo: cleanedName.slice(0, 3).toUpperCase(),
    image: "",
    specialists: [],
    reviews: [],
    coordinates: raw.latitude && raw.longitude ? { lat: raw.latitude, lng: raw.longitude } : undefined,
    website: raw.socials?.Website || raw.website || undefined,
    services: raw.services || [],
  };
});
