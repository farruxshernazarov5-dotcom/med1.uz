import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, MapPin, ArrowRight, Sparkles } from "lucide-react";

interface PlatformDoctor {
  id: string;
  full_name: string;
  specialty: string | null;
  city: string | null;
  photo_url: string | null;
  experience_years: number | null;
  created_at: string;
}

const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 45 * 24 * 3600 * 1000;

/** Med1.uz platformasida ro'yxatdan o'tgan shifokorlar */
const NewPlatformDoctors = ({ limit = 12 }: { limit?: number }) => {
  const [docs, setDocs] = useState<PlatformDoctor[]>([]);

  useEffect(() => {
    let alive = true;
    supabase
      .from("doctors")
      .select("id,full_name,specialty,city,photo_url,experience_years,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (alive && data) setDocs(data as PlatformDoctor[]);
      });
    return () => {
      alive = false;
    };
  }, [limit]);

  if (docs.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Yangi qo'shilgan shifokorlar
          </h2>
          <p className="text-sm text-muted-foreground">Med1.uz platformasida ro'yxatdan o'tgan mutaxassislar</p>
        </div>
        <Badge variant="outline">{docs.length} ta</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((d) => (
          <Card key={d.id} className="p-4 flex items-center gap-3 hover:border-primary/50 transition-colors">
            {d.photo_url ? (
              <img
                src={d.photo_url}
                alt={`${d.full_name} fotosi`}
                loading="lazy"
                className="w-14 h-14 rounded-2xl object-cover bg-muted shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground truncate">{d.full_name}</p>
                {isNew(d.created_at) && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">Yangi</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {d.specialty || "Mutaxassislik ko'rsatilmagan"}
                {d.experience_years ? ` • ${d.experience_years} yil tajriba` : ""}
              </p>
              {d.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {d.city}
                </p>
              )}
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to={`/doctors/${d.id}`} aria-label={`${d.full_name} profili`}>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default NewPlatformDoctors;
