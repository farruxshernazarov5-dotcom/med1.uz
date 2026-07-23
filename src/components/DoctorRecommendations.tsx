import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, Stethoscope, ArrowRight } from "lucide-react";

interface Props {
  /** Russian specialty label as stored in doctors_external.primary_specialty */
  specialty?: string | string[];
  /** Optional list of specialties for OR match */
  region?: string;
  limit?: number;
  title?: string;
}

/**
 * Compact widget that recommends related Med1.uz doctors for AI service pages.
 * Renders nothing if no matches are found.
 */
export default function DoctorRecommendations({ specialty, region, limit = 4, title = "Tavsiya etiladigan shifokorlar" }: Props) {
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabase.from("doctors_external")
        .select("id,slug,name,photo_url,rating,reviews_count,primary_specialty,primary_region,experience")
        .order("rating", { ascending: false })
        .order("reviews_count", { ascending: false })
        .limit(limit);
      if (specialty) {
        const arr = Array.isArray(specialty) ? specialty : [specialty];
        q = q.in("primary_specialty", arr);
      }
      if (region) q = q.eq("primary_region", region);
      const { data } = await q;
      if (!cancelled) setDocs(data || []);
    })();
    return () => { cancelled = true; };
  }, [JSON.stringify(specialty), region, limit]);

  if (docs.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" /> {title}
        </h3>
        <Link to="/doctors" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Barchasi <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map(d => (
          <Link key={d.id} to={`/doctors/ext/${d.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/40 hover:bg-muted/40 transition">
            {d.photo_url ? (
              <img src={d.photo_url} alt={d.name} loading="lazy" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{d.name}</p>
              <p className="text-xs text-primary truncate">{d.primary_specialty}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {d.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {Number(d.rating).toFixed(1)}
                  </span>
                )}
                {d.experience > 0 && <span>{d.experience} yil</span>}
                {d.primary_region && <span className="truncate">· {d.primary_region}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
