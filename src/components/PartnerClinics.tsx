import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ArrowRight } from "lucide-react";

interface PartnerClinic {
  id: string;
  name: string;
  logo_url: string | null;
  logo_external_url: string | null;
  category: string | null;
  specialties: string[] | null;
}

const PartnerClinics = () => {
  const [clinics, setClinics] = useState<PartnerClinic[]>([]);

  useEffect(() => {
    supabase
      .from("registered_clinics")
      .select("id, name, logo_url, logo_external_url, category, specialties")
      .eq("is_active", true)
      .limit(30)
      .then(({ data }) => {
        if (data) setClinics(data as PartnerClinic[]);
      });
  }, []);

  if (clinics.length === 0) return null;

  const logoUrl = (c: PartnerClinic) => c.logo_url || c.logo_external_url;
  const clinicsWithLogos = clinics.filter((c) => logoUrl(c));
  const displayClinics = clinicsWithLogos.length >= 4 ? clinicsWithLogos : clinics;

  return (
    <section className="py-10 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Hamkor klinikalar
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Med1.uz platformasida ro'yxatdan o'tgan tibbiy muassasalar
            </p>
          </div>
          <Link
            to="/clinics"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Barchasi <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Scrolling Ticker */}
        <div className="overflow-hidden rounded-2xl bg-card border border-border p-4">
          <div className="flex animate-scroll gap-6 w-max">
            {[...displayClinics, ...displayClinics, ...displayClinics].map((c, i) => {
              const logo = logoUrl(c);
              return (
                <div
                  key={`${c.id}-${i}`}
                  className="flex-shrink-0 w-28 h-28 rounded-2xl bg-background border border-border shadow-sm flex flex-col items-center justify-center p-2 hover:border-primary/40 transition-colors"
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={c.name}
                      className="w-14 h-14 object-contain rounded-xl mb-1"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                      <span className="text-lg font-bold text-primary">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-2">
                    {c.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerClinics;
