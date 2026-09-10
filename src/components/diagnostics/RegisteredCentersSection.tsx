import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, MapPin, Phone, Sparkles } from "lucide-react";

export interface RegisteredCenter {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  address: string | null;
  region: string | null;
  city: string | null;
  phone: string | null;
  specialties: string[] | null;
  created_at: string;
}

const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 45 * 24 * 3600 * 1000;

/** Platformada ro'yxatdan o'tgan (real) diagnostika markazlari */
const RegisteredCentersSection = () => {
  const [centers, setCenters] = useState<RegisteredCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase
      .from("registered_diagnostics" as any)
      .select("id,name,logo_url,description,address,region,city,phone,specialties,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }: any) => {
        if (!alive) return;
        setCenters((data || []) as RegisteredCenter[]);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading || centers.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Platformada ro'yxatdan o'tgan markazlar
          </h2>
          <p className="text-sm text-muted-foreground">
            Med1.uz tizimida rasmiy ro'yxatdan o'tgan va tasdiqlangan diagnostika markazlari
          </p>
        </div>
        <Badge variant="outline">{centers.length} ta</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {centers.map((c) => (
          <Card key={c.id} className="p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-3">
              {c.logo_url ? (
                <img
                  src={c.logo_url}
                  alt={`${c.name} logotipi`}
                  loading="lazy"
                  className="w-14 h-14 rounded-xl object-contain bg-muted shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-heading font-bold text-foreground truncate">{c.name}</p>
                  {isNew(c.created_at) && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">Yangi</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {[c.city, c.region].filter(Boolean).join(", ") || "Manzil ko'rsatilmagan"}
                </p>
              </div>
            </div>

            {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}

            {c.specialties && c.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {c.specialties.slice(0, 4).map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-auto pt-1">
              <Button asChild size="sm" className="flex-1">
                <Link to={`/diagnostics/${c.id}`}>
                  Batafsil <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
              {c.phone && (
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${c.phone}`} aria-label={`${c.name} raqamiga qo'ng'iroq`}>
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default RegisteredCentersSection;
