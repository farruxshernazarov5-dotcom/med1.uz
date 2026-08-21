import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, Trophy, MapPin, Globe, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Sponsor = {
  id: string; slug: string; display_name: string; region: string | null; amount: number;
  message: string | null; bio: string | null; occupation: string | null;
  website_url: string | null; created_at: string; rank: number;
};

const SponsorProfilePage = () => {
  const { slug } = useParams();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await supabase.rpc("get_public_sponsor", { _slug: slug });
      setSponsor(((data as Sponsor[]) ?? [])[0] ?? null);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={sponsor ? `${sponsor.display_name} — Med1.uz homiysi` : "Homiy profili — Med1.uz"}
        description={sponsor ? `${sponsor.display_name} Med1.uz loyihasiga ${Number(sponsor.amount).toLocaleString()} so'm hissa qo'shdi.` : "Med1.uz homiysi profili."}
        path={`/sponsor/${slug ?? ""}`}
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Link to="/transparency" className="inline-flex items-center gap-2 text-sm text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Homiylar ro'yxatiga qaytish
        </Link>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !sponsor ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground mb-4">Bunday homiy profili topilmadi.</p>
            <Button asChild><Link to="/transparency">Homiylar sahifasi</Link></Button>
          </div>
        ) : (
          <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Person",
                name: sponsor.display_name,
                address: sponsor.region ?? undefined,
                jobTitle: sponsor.occupation ?? undefined,
                url: sponsor.website_url ?? undefined,
                description: sponsor.bio ?? undefined,
              }),
            }} />
            <article className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-[#0A2540] to-[#1e3a5f] p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto flex items-center justify-center text-4xl font-black text-white border-4 border-white/20">
                  {sponsor.display_name[0]}
                </div>
                <h1 className="text-2xl font-black text-white mt-4">{sponsor.display_name}</h1>
                {sponsor.occupation && <p className="text-white/60 text-sm mt-1">{sponsor.occupation}</p>}
                <Badge className="mt-3 bg-yellow-400/15 text-yellow-300 border-yellow-400/30">
                  <Trophy className="w-3 h-3 mr-1" /> #{sponsor.rank} homiy
                </Badge>
              </div>

              <div className="p-8 space-y-5">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black">
                    <Heart className="w-4 h-4" /> {Number(sponsor.amount).toLocaleString()} so'm
                  </span>
                  {sponsor.region && (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {sponsor.region}
                    </span>
                  )}
                  {sponsor.website_url && (
                    <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary underline">
                      <Globe className="w-4 h-4" /> Veb-sayt
                    </a>
                  )}
                </div>

                {sponsor.bio && <p className="text-sm text-muted-foreground leading-relaxed">{sponsor.bio}</p>}

                {sponsor.message && (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-foreground">
                    “{sponsor.message}”
                  </blockquote>
                )}

                <p className="text-xs text-muted-foreground">
                  Hissa sanasi: {new Date(sponsor.created_at).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            </article>

            <div className="text-center mt-8">
              <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold">
                <Link to="/transparency"><Heart className="w-4 h-4 mr-2" /> Siz ham hissa qo'shing</Link>
              </Button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SponsorProfilePage;
