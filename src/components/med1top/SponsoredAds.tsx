import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import AdCard from "./AdCard";
import { fetchTopAds, type AdCampaign, type Lang } from "@/lib/med1Top";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  region?: string;
  specialty?: string;
  entityType?: string;
  limit?: number;
  title?: string;
  className?: string;
}

/**
 * Reusable "Sponsored" strip. Rendered ABOVE organic results and always
 * visually separated so paid placements never blend into organic listings.
 */
const SponsoredAds = ({ region, specialty, entityType, limit = 3, title, className }: Props) => {
  const { lang } = useLanguage();
  const [ads, setAds] = useState<AdCampaign[]>([]);

  useEffect(() => {
    let alive = true;
    fetchTopAds({ region, specialty, entityType, limit, order: "rank" })
      .then((rows) => alive && setAds(rows))
      .catch(() => alive && setAds([]));
    return () => {
      alive = false;
    };
  }, [region, specialty, entityType, limit]);

  if (ads.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3 md:p-4 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5" /> {title || (lang === "ru" ? "Реклама" : lang === "en" ? "Sponsored" : "Reklama")}
        </p>
        <Link to="/med1-top" className="text-xs text-muted-foreground hover:text-primary">
          Med1 TOP →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} lang={lang as Lang} compact showBid={false} />
        ))}
      </div>
    </section>
  );
};

export default SponsoredAds;
