import { supabase } from "@/integrations/supabase/client";
import type { DoctorCardData } from "@/components/doctors/DoctorCard";

export type PatientLocation = { latitude: number; longitude: number };
export type DirectoryDoctor = DoctorCardData & {
  latitude: number | null; longitude: number | null; clinic_id?: string | null;
  clinic_name?: string | null; clinic_address?: string | null; distance_km?: number | null;
};
export type DoctorFilters = {
  specialty?: string; region?: string; search?: string; service?: string;
  language?: string; minRating?: number; minExperience?: number; clinicId?: string;
  favoriteIds?: string[];
};
export const DIRECTORY_COLUMNS = "id,slug,name,rank,experience,photo_url,rating,reviews_count,primary_specialty,primary_region,clinic_id,languages,latitude,longitude";

export function hasCoordinates(d: PatientLocation | { latitude: number | null; longitude: number | null }): d is PatientLocation {
  return d.latitude != null && d.longitude != null && Number.isFinite(d.latitude) && Number.isFinite(d.longitude)
    && Math.abs(d.latitude) <= 90 && Math.abs(d.longitude) <= 180;
}
export function distanceKm(a: PatientLocation, b: PatientLocation) {
  const rad = Math.PI / 180;
  const x = Math.sin((b.latitude - a.latitude) * rad / 2) ** 2
    + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin((b.longitude - a.longitude) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
export function sortByPatientDistance<T extends DirectoryDoctor>(doctors: T[], location: PatientLocation): (T & { distance_km: number | null })[] {
  return doctors.map(d => ({ ...d, distance_km: hasCoordinates(d) ? distanceKm(location, d) : null }))
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity) || a.id.localeCompare(b.id));
}

/** Stable pagination: never rank just the first server page by distance. */
export async function collectPages<T>(read: (offset: number, size: number) => Promise<T[]>, size = 500): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; ; offset += size) {
    const page = await read(offset, size);
    result.push(...page);
    if (page.length < size) return result;
  }
}

export async function loadDirectoryDoctors(filters: DoctorFilters = {}): Promise<DirectoryDoctor[]> {
  if (filters.favoriteIds?.length === 0) return [];
  const doctors = await collectPages<DirectoryDoctor>(async (offset, size) => {
    let q = supabase.from("doctors_external").select(DIRECTORY_COLUMNS).order("id").range(offset, offset + size - 1);
    if (filters.region) q = q.eq("primary_region", filters.region);
    if (filters.specialty) q = q.eq("primary_specialty", filters.specialty);
    if (filters.clinicId) q = q.eq("clinic_id", filters.clinicId);
    if (filters.language) q = q.contains("languages", [filters.language]);
    if (filters.favoriteIds) q = q.in("id", filters.favoriteIds);
    if (filters.minRating) q = q.gte("rating", filters.minRating);
    if (filters.minExperience) q = q.gte("experience", filters.minExperience);
    if (filters.search && filters.search.trim().length >= 2) q = q.ilike("name", `%${filters.search.trim()}%`);
    if (filters.service && filters.service.trim().length >= 2) q = q.contains("services", [filters.service.trim()]);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as DirectoryDoctor[];
  });
  const { default: sourceLocations } = await import("@/data/doctorLocationSources.json");
  const locations: Record<string, { latitude: number; longitude: number; clinic_name: string; clinic_address: string }> = sourceLocations;
  const clinicIds = [...new Set(doctors.flatMap(d => d.clinic_id ? [d.clinic_id] : []))];
  const clinics = new Map<string, { name: string; address: string | null; latitude: number | null; longitude: number | null }>();
  for (let i = 0; i < clinicIds.length; i += 100) {
    const { data, error } = await supabase.from("registered_clinics")
      .select("id,name,address,latitude,longitude").eq("is_active", true).in("id", clinicIds.slice(i, i + 100));
    if (error) throw error;
    data?.forEach(c => clinics.set(c.id, c));
  }
  return doctors.map(d => {
    const c = d.clinic_id ? clinics.get(d.clinic_id) : undefined;
    const source = locations[d.id];
    return { ...d, ...(!hasCoordinates(d) ? c && hasCoordinates(c) ? { latitude: c.latitude, longitude: c.longitude } : source ? { latitude: source.latitude, longitude: source.longitude } : {} : {}),
      clinic_name: c?.name ?? source?.clinic_name, clinic_address: c?.address ?? source?.clinic_address };
  });
}