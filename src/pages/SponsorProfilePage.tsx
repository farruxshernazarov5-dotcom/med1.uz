import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Crown, MapPin, Briefcase, Globe, Quote, Heart, ShieldCheck, CalendarDays } from "lucide-react";
import Header from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import useCountUp from "@/hooks/useCountUp";

const Footer = lazy(() => import("@/components/Footer"));

interface SponsorProfile {
  id: string;
  slug: string;
  display_name: string;
  region: string | null;
  amount: number;
  message: string | null;
  bio: string | null;
  occupation: string | null;
  website_url: string | null;
  created_at: string;
  rank: number;
}

const fmt = (n: number) => n.toLocaleString("uz-UZ");

const SponsorProfilePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [sponsor, setSponsor] = useState<SponsorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const animatedAmount = useCountUp(Number(sponsor?.amount || 0));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_public_sponsor", { _slug: slug ?? "" });
      const row = Array.isArray(data) ? (data[0] as SponsorProfile | undefined) : null;
      if (!cancelled) {
        setSponsor(row ?? null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto h-64 rounded-3xl border bg-muted/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Homiy topilmadi | Med1.uz" description="So'ralgan homiy profili topilmadi." path={`/sponsors/${slug}`} noindex />
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">Bunday homiy profili topilmadi yoki u anonim ko'rinishni tanlagan.</p>
          <Button asChild><Link to="/sponsors">Homiylar ro'yxati</Link></Button>
        </div>
      </div>
    );
  }

  const desc = (sponsor.bio || sponsor.message || `${sponsor.display_name} — Med1.uz loyihasi rivojiga hissa qo'shgan homiy.`).slice(0, 155);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${sponsor.display_name} — Med1.uz homiysi`}
        description={desc}
        path={`/sponsors/${sponsor.slug}`}
        ogType="profile"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: sponsor.display_name,
          ...(sponsor.occupation ? { jobTitle: sponsor.occupation } : {}),
          ...(sponsor.bio ? { description: sponsor.bio } : {}),
          ...(sponsor.region ? { address: { "@type": "PostalAddress", addressRegion: sponsor.region, addressCountry: "UZ" } } : {}),
          ...(sponsor.website_url ? { url: sponsor.website_url } : {}),
          funding: { "@type": "Organization", name: "Med1.uz", url: "https://www.med1.uz" },
        }}
      />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Link to="/sponsors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Homiylar ro'yxati
        </Link>

        <article className="max-w-2xl mx-auto rounded-3xl border bg-card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary via-secondary to-emerald-500" />
          <div className="px-6 pb-6 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-black text-white border-4 border-card">
              {sponsor.display_name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("")}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <h1 className="font-heading text-2xl font-black">{sponsor.display_name}</h1>
              {Number(sponsor.rank) <= 3 && (
                <Badge className="bg-amber-500 text-white"><Crown className="w-3 h-3 mr-1" /> TOP {sponsor.rank}</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {sponsor.occupation && <span className="inline-flex items-center gap-1"><Briefcase className="w-4 h-4" /> {sponsor.occupation}</span>}
              {sponsor.region && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {sponsor.region}</span>}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-4 h-4" /> {new Date(sponsor.created_at).toLocaleDateString("uz-UZ")}
              </span>
              {sponsor.website_url && (
                <a href={sponsor.website_url} target="_blank" rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Globe className="w-4 h-4" /> Veb-sayt
                </a>
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-primary/5 border border-primary/20 p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Loyihaga qo'shgan hissasi</p>
              <p className="text-3xl font-black text-primary tabular-nums">{fmt(animatedAmount)} <span className="text-base">so'm</span></p>
            </div>

            {sponsor.bio && (
              <section className="mt-5">
                <h2 className="font-bold mb-2">Qisqacha</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{sponsor.bio}</p>
              </section>
            )}

            {sponsor.message && (
              <blockquote className="mt-5 rounded-2xl bg-muted/50 p-4 text-sm italic text-muted-foreground flex gap-2">
                <Quote className="w-4 h-4 shrink-0 opacity-50" /> {sponsor.message}
              </blockquote>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <Link to="/sponsors"><Heart className="w-4 h-4 mr-2" /> Siz ham hissa qo'shing</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/transparency"><ShieldCheck className="w-4 h-4 mr-2" /> Mablag' qayerga sarflanadi</Link>
              </Button>
            </div>
          </div>
        </article>
      </main>

      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default SponsorProfilePage;
