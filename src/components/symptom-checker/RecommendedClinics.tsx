import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Building2, Star, MapPin, Phone as PhoneIcon, ArrowRight } from "lucide-react";
import { clinics } from "@/data/clinics";
import { externalClinics } from "@/data/clinicsExternal";
import type { Clinic } from "@/data/clinics";
import type { DiseaseResult } from "./types";

// Specialist name → clinic specialty keyword mapping
const SPECIALIST_MAP: Record<string, string[]> = {
  "kardiolog": ["kardiolog", "kardio", "yurak"],
  "nevropatolog": ["nevro", "nevrolog"],
  "nevrolog": ["nevro", "nevrolog"],
  "pulmonolog": ["pulmonolog", "o'pka"],
  "gastroenterolog": ["gastro", "oshqozon"],
  "endokrinolog": ["endokrin", "diabet", "qalqonsimon"],
  "dermatolog": ["dermatolog", "teri"],
  "otorinolaringolog": ["lor", "quloq", "burun", "tomoq"],
  "lor": ["lor", "quloq", "burun", "tomoq"],
  "oftalmolog": ["oftalm", "ko'z"],
  "ko'z shifokori": ["oftalm", "ko'z"],
  "urolog": ["urolog"],
  "ginekolog": ["ginekolog", "ayollar"],
  "ortoped": ["ortoped", "travmatolog"],
  "travmatolog": ["ortoped", "travmatolog"],
  "onkolog": ["onkolog"],
  "stomatolog": ["stomatolog", "tish"],
  "pediatr": ["pediatr", "bolalar"],
  "terapevt": ["terapevt", "umumiy"],
  "jarroh": ["jarroh", "xirurg"],
  "xirurg": ["jarroh", "xirurg"],
  "allergolog": ["allergo"],
  "psixiatr": ["psixiatr", "ruhiy"],
  "mammolog": ["mammolog"],
  "proktolog": ["proktolog"],
  "revmatolog": ["revmatolog"],
  "gemato": ["gematolog"],
};

function getSpecialtyKeywords(specialist: string): string[] {
  const lower = specialist.toLowerCase();
  for (const [key, keywords] of Object.entries(SPECIALIST_MAP)) {
    if (lower.includes(key)) return keywords;
  }
  return [lower.split(" ")[0]];
}

function clinicMatchesSpecialty(clinic: Clinic, keywords: string[]): boolean {
  const text = [
    ...clinic.specialties,
    ...(clinic.services || []),
    ...(clinic.directionTags || []),
  ].join(" ").toLowerCase();
  return keywords.some((kw) => text.includes(kw));
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  diseases: DiseaseResult[];
  userLocation: { lat: number; lng: number } | null;
}

const RecommendedClinics = ({ diseases, userLocation }: Props) => {
  const recommended = useMemo(() => {
    // Collect unique specialist keywords from all diseases
    const allKeywords = new Set<string>();
    diseases.forEach((d) => {
      getSpecialtyKeywords(d.specialist).forEach((kw) => allKeywords.add(kw));
    });
    const keywords = Array.from(allKeywords);
    if (keywords.length === 0) return [];

    // Merge all clinics
    const allClinics = [...clinics, ...externalClinics];

    // Filter matching clinics
    let matched = allClinics.filter((c) => clinicMatchesSpecialty(c, keywords));

    // Sort by distance if location available, else by rating
    if (userLocation) {
      matched = matched
        .map((c) => {
          const dist = c.coordinates
            ? haversineDistance(userLocation.lat, userLocation.lng, c.coordinates.lat, c.coordinates.lng)
            : 9999;
          return { ...c, distance: dist };
        })
        .sort((a, b) => (a as any).distance - (b as any).distance);
    } else {
      matched.sort((a, b) => b.rating - a.rating);
    }

    return matched.slice(0, 5);
  }, [diseases, userLocation]);

  if (recommended.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        Tavsiya etilgan klinikalar
      </h3>
      {!userLocation && (
        <p className="text-xs text-muted-foreground mb-3">
          📍 Joylashuvingizni aniqlash uchun brauzer ruxsatini bering — yaqin klinikalar birinchi ko'rsatiladi.
        </p>
      )}
      <div className="space-y-3">
        {recommended.map((clinic) => (
          <Link
            key={clinic.id}
            to={`/clinics/${clinic.id}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {clinic.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Star className="w-3 h-3 fill-current" />
                  {clinic.rating.toFixed(1)}
                </div>
                {(clinic as any).distance && (clinic as any).distance < 9999 && (
                  <span className="text-xs text-muted-foreground">
                    ~{(clinic as any).distance.toFixed(1)} km
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {clinic.address}
              </div>
              {clinic.phone.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <PhoneIcon className="w-3 h-3 flex-shrink-0" />
                  {clinic.phone[0]}
                </div>
              )}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {clinic.specialties.slice(0, 3).map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                ))}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendedClinics;
