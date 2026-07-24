import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Stethoscope, ArrowRight } from "lucide-react";

interface Props {
  clinicId?: string | null;
  clinicName?: string | null;
  city?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CITY_TO_REGION: Record<string, string> = {
  "Toshkent": "г. Ташкент", "Tashkent": "г. Ташкент", "Ташкент": "г. Ташкент",
  "Samarqand": "Самаркандская область", "Buxoro": "Бухарская область",
  "Andijon": "Андижанская область", "Farg'ona": "Ферганская область",
  "Namangan": "Наманганская область", "Xorazm": "Хорезмская область",
};

export default function ClinicDoctorsSection({ clinicId, clinicName, city }: Props) {
  const [docs, setDocs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [mode, setMode] = useState<"clinic" | "region">("region");

  useEffect(() => {
    (async () => {
      const isUuid = clinicId && UUID_RE.test(clinicId);
      if (isUuid) {
        const { data, count } = await supabase.from("doctors_external")
          .select("id,slug,name,photo_url,rating,reviews_count,primary_specialty,experience", { count: "exact" })
          .eq("clinic_id", clinicId!)
          .order("rating", { ascending: false })
          .limit(8);
        setDocs(data || []); setTotal(count || 0); setMode("clinic");
        return;
      }
      const region = city ? CITY_TO_REGION[city] : null;
      if (!region) { setDocs([]); return; }
      const { data, count } = await supabase.from("doctors_external")
        .select("id,slug,name,photo_url,rating,reviews_count,primary_specialty,experience", { count: "exact" })
        .eq("primary_region", region)
        .order("rating", { ascending: false })
        .limit(8);
      setDocs(data || []); setTotal(count || 0); setMode("region");
    })();
  }, [clinicId, city]);

  if (docs.length === 0) return null;

  const allHref = mode === "clinic"
    ? `/doctors?clinic=${clinicId}&clinic_name=${encodeURIComponent(clinicName || "")}`
    : `/doctors?region=${encodeURIComponent(CITY_TO_REGION[city || ""] || "")}`;

  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            {mode === "clinic" ? "Klinika shifokorlari" : "Ushbu hududdagi shifokorlar"}
          </h3>
          <Link to={allHref} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            Barchasi ({total}) <ArrowRight className="w-3 h-3" />
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
                </div>
              </div>
            </Link>
          ))}
        </div>
        {mode === "region" && (
          <p className="text-[11px] text-muted-foreground mt-3">
            Ushbu klinika hali shifokorlar katalogi bilan bevosita bog'lanmagan — bu ro'yxat hudud bo'yicha tanlab olindi.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
