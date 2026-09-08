import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ArrowRight } from "lucide-react";

interface PartnerOrg {
  id: string;
  org_type: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  clinic: "Klinika",
  diagnostics: "Diagnostika",
  pharmacy: "Dorixona",
  dental: "Stomatologiya",
  cosmetology: "Kosmetologiya",
  maternity: "Tug'ruqxona",
  bloodbank: "Qon banki",
};

const PartnerClinics = () => {
  const [orgs, setOrgs] = useState<PartnerOrg[]>([]);

  useEffect(() => {
    (supabase as any)
      .rpc("get_partner_organizations", { _limit: 60 })
      .then(({ data }: any) => {
        if (data) setOrgs(data as PartnerOrg[]);
      });
  }, []);

  if (orgs.length === 0) return null;

  const withLogos = orgs.filter((c) => c.logo_url);
  const display = withLogos.length >= 4 ? orgs : orgs;

  return (
    <section className="py-10 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Hamkor muassasalar
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Med1.uz platformasida ro'yxatdan o'tgan klinikalar, diagnostika markazlari, dorixonalar va boshqalar
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
            {[...display, ...display, ...display].map((c, i) => (
              <div
                key={`${c.id}-${i}`}
                className="flex-shrink-0 w-28 h-32 rounded-2xl bg-background border border-border shadow-sm flex flex-col items-center justify-center p-2 hover:border-primary/40 transition-colors"
              >
                {c.logo_url ? (
                  <img
                    src={c.logo_url}
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
                <span className="mt-1 text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {TYPE_LABEL[c.org_type] || c.org_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerClinics;
