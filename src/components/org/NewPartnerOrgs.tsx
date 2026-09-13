import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, MapPin, Sparkles } from "lucide-react";

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

const DETAIL: Record<string, string> = {
  clinic: "/clinics",
  diagnostics: "/diagnostics",
  dental: "/dental",
};

const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 45 * 24 * 3600 * 1000;

/** Platformada yangi ro'yxatdan o'tgan hamkor muassasalar */
const NewPartnerOrgs = ({
  types,
  title = "Yangi qo'shilgan hamkorlar",
  limit = 24,
}: {
  types?: string[];
  title?: string;
  limit?: number;
}) => {
  const [orgs, setOrgs] = useState<PartnerOrg[]>([]);

  useEffect(() => {
    let alive = true;
    (supabase as any).rpc("get_partner_organizations", { _limit: 100 }).then(({ data }: any) => {
      if (!alive || !data) return;
      const rows = (data as PartnerOrg[]).filter((o) => !types || types.includes(o.org_type));
      setOrgs(rows.slice(0, limit));
    });
    return () => {
      alive = false;
    };
  }, [types?.join(","), limit]);

  if (orgs.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> {title}
          </h2>
          <p className="text-sm text-muted-foreground">Med1.uz tizimida rasmiy ro'yxatdan o'tgan muassasalar</p>
        </div>
        <Badge variant="outline">{orgs.length} ta</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgs.map((o) => (
          <Card key={`${o.org_type}-${o.id}`} className="p-4 flex items-center gap-3 hover:border-primary/50 transition-colors">
            {o.logo_url ? (
              <img src={o.logo_url} alt={`${o.name} logotipi`} loading="lazy" className="w-12 h-12 rounded-xl object-contain bg-muted shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground truncate">{o.name}</p>
                {isNew(o.created_at) && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">Yangi</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {o.city || "Manzil ko'rsatilmagan"} • {TYPE_LABEL[o.org_type] || o.org_type}
              </p>
            </div>
            {DETAIL[o.org_type] && (
              <Button asChild size="sm" variant="outline">
                <Link to={`${DETAIL[o.org_type]}/${o.id}`} aria-label={`${o.name} batafsil`}>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
};

export default NewPartnerOrgs;
