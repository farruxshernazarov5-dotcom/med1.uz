import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Heart, Crown, MapPin, Sparkles, ShieldCheck, ArrowLeft, Users, Quote, Briefcase } from "lucide-react";
import Header from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import SponsorApplyDialog from "@/components/sponsors/SponsorApplyDialog";
import useCountUp from "@/hooks/useCountUp";

const Footer = lazy(() => import("@/components/Footer"));

export interface PublicSponsor {
  id: string;
  slug: string | null;
  display_name: string;
  region: string | null;
  amount: number;
  message: string | null;
  bio: string | null;
  occupation: string | null;
  website_url: string | null;
  is_anonymous: boolean;
  created_at: string;
}

const fmt = (n: number) => n.toLocaleString("uz-UZ");

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

const SponsorsPage = () => {
  const [sponsors, setSponsors] = useState<PublicSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_public_sponsors", { _limit: 200 });
      if (!cancelled) {
        setSponsors((data as PublicSponsor[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const total = useMemo(() => sponsors.reduce((s, x) => s + Number(x.amount), 0), [sponsors]);
  const animatedTotal = useCountUp(total);
  const animatedCount = useCountUp(sponsors.length, 900);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Med1.uz homiylari",
    numberOfItems: sponsors.length,
    itemListElement: sponsors.slice(0, 50).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.display_name,
      ...(s.slug ? { url: `https://www.med1.uz/sponsors/${s.slug}` } : {}),
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Med1.uz homiylari — loyihaga hissa qo'shganlar"
        description="Med1.uz tibbiy platformasi rivojiga hissa qo'shgan tasdiqlangan homiylar ro'yxati: profil kartalari, hudud va qisqa bio ma'lumotlari."
        path="/sponsors"
        jsonLd={jsonLd}
      />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifa
        </Link>

        <header className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-primary/20">
            <Heart className="w-4 h-4" /> Homiylar zali
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-black mb-3">
            Loyihaga hissa qo'shgan <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">insonlar</span>
          </h1>
          <p className="text-muted-foreground">
            Har bir tasdiqlangan homiy uchun alohida profil kartasi. Shaxsiy ma'lumotlar (to'liq ism, telefon) hech qachon ochilmaydi.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-6">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-2xl font-black text-primary tabular-nums">{fmt(animatedTotal)}</p>
              <p className="text-xs text-muted-foreground">so'm to'plandi</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-2xl font-black text-emerald-600 tabular-nums">{animatedCount}</p>
              <p className="text-xs text-muted-foreground">tasdiqlangan homiy</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <Button onClick={() => setShowApply(true)} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <Heart className="w-4 h-4 mr-2" /> Hissa qo'shish
            </Button>
            <Button asChild variant="outline">
              <Link to="/transparency"><ShieldCheck className="w-4 h-4 mr-2" /> Shaffoflik hisoboti</Link>
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            Hozircha tasdiqlangan homiylar yo'q. Birinchi bo'ling!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsors.map((s, i) => {
              const card = (
                <article className="h-full rounded-2xl border bg-card p-5 hover:border-primary/40 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shrink-0
                      ${i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                        : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500"
                        : i === 2 ? "bg-gradient-to-br from-amber-500 to-orange-600"
                        : "bg-gradient-to-br from-primary to-secondary"}`}>
                      {s.is_anonymous ? "🎭" : initials(s.display_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {i < 3 && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
                        <h2 className="font-bold truncate">{s.display_name}</h2>
                      </div>
                      {s.occupation && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {s.occupation}
                        </p>
                      )}
                      {s.region && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {s.region}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-bold">#{i + 1}</Badge>
                  </div>

                  {s.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{s.bio}</p>}
                  {!s.bio && s.message && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2 italic flex gap-1">
                      <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-50" />{s.message}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-lg font-black text-primary tabular-nums">{fmt(Number(s.amount))}</span>
                    <span className="text-xs text-muted-foreground">so'm</span>
                  </div>
                </article>
              );
              return s.slug
                ? <Link key={s.id} to={`/sponsors/${s.slug}`} className="block h-full">{card}</Link>
                : <div key={s.id}>{card}</div>;
            })}
          </div>
        )}
      </main>

      <SponsorApplyDialog open={showApply} onOpenChange={setShowApply} />
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default SponsorsPage;
