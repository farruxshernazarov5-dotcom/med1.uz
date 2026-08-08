import { Link } from "react-router-dom";
import { DOCTOR_SPECIALTIES, DOCTOR_REGIONS } from "@/data/doctorSpecialties";

/**
 * Internal link hub: gives crawlers a static path to every specialty and
 * region landing page, and helps users browse without filters.
 */
const SpecialtyHubLinks = ({ activeSlug }: { activeSlug?: string }) => (
  <div className="rounded-2xl border bg-card p-6">
    <h2 className="font-heading text-lg font-bold mb-1">Mutaxassislik bo'yicha shifokorlar</h2>
    <p className="text-sm text-muted-foreground mb-4">
      Kerakli yo'nalishni tanlang — har bir bo'limda reyting va tajriba bo'yicha saralangan mutaxassislar.
    </p>
    <div className="flex flex-wrap gap-2">
      {DOCTOR_SPECIALTIES.map((s) => (
        <Link
          key={s.slug}
          to={`/doctors/mutaxassislik/${s.slug}`}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            activeSlug === s.slug ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
          }`}
        >
          {s.uz}
        </Link>
      ))}
    </div>

    <h3 className="font-heading text-sm font-bold mt-6 mb-2">Hudud bo'yicha</h3>
    <div className="flex flex-wrap gap-2">
      {DOCTOR_REGIONS.map((r) => (
        <Link
          key={r.slug}
          to={`/doctors/mutaxassislik/terapevt?hudud=${r.slug}`}
          className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent"
        >
          {r.uz}
        </Link>
      ))}
    </div>
  </div>
);

export default SpecialtyHubLinks;
