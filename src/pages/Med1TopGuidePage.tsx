import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Sparkles, Tag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreativeGuide from "@/components/med1top/CreativeGuide";
import ShowcaseBrandCard from "@/components/med1top/ShowcaseBrandCard";
import { SHOWCASE_BRANDS } from "@/data/med1TopShowcase";
import { useLanguage } from "@/hooks/useLanguage";
import {
  type AuctionState,
  type Lang,
  fetchAuctionState,
  formatSum,
  placementName,
} from "@/lib/med1Top";

const Med1TopGuidePage = () => {
  const { lang } = useLanguage();
  const L = lang as Lang;
  const [auction, setAuction] = useState<AuctionState[]>([]);

  useEffect(() => {
    fetchAuctionState().then(setAuction).catch(() => setAuction([]));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Med1 TOP tariflar va kreativ qo'llanma — reklama narxlari"
        description="Med1 TOP reklama auksioni tariflari, TOP o'rinlar narxi, banner va matn talablari hamda kreativ qo'llanma: nima ishlaydi, nimadan qochish kerak."
        path="/med1-top/guide"
        ogType="article"
      />
      <Header />

      <main>
        <section className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
          <div className="container mx-auto px-4 py-10">
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
              <Link to="/med1-top">
                <ArrowLeft className="w-4 h-4 mr-1" /> Med1 TOP auksioni
              </Link>
            </Button>
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Tariflar va qo'llanma
            </Badge>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              Med1 TOP — tariflar va kreativ qo'llanma
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-6">
              Reklama o'rinlari narxi, yo'nalishlar bo'yicha talab va e'lon tayyorlash bo'yicha to'liq qo'llanma.
              Shu sahifadagi ma'lumotlar asosida bir necha daqiqada professional e'lon tayyorlaysiz.
            </p>
            <Button asChild size="lg">
              <Link to="/med1-top/new">Reklama berish</Link>
            </Button>
          </div>
        </section>

        {/* Tariffs */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" /> Tariflar — TOP o'rinlar narxi
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-medium">O'rin</th>
                  <th className="text-left p-3 font-medium">Slotlar</th>
                  <th className="text-left p-3 font-medium">Boshlang'ich</th>
                  <th className="text-left p-3 font-medium">Qadam</th>
                  <th className="text-left p-3 font-medium">Keyingi min. taklif</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {auction.map((p) => (
                  <tr key={p.placement_id} className="border-t border-border">
                    <td className="p-3 font-semibold text-foreground">{placementName(p, L)}</td>
                    <td className="p-3 text-muted-foreground">{p.slots} ({p.active_ads} faol)</td>
                    <td className="p-3 text-muted-foreground">{formatSum(p.min_bid)}</td>
                    <td className="p-3 text-muted-foreground">{formatSum(p.bid_step)}</td>
                    <td className="p-3 font-semibold text-primary">{formatSum(p.next_min_bid)}</td>
                    <td className="p-3">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/med1-top/new?placement=${p.code}`}>Tanlash</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {auction.length === 0 ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={6}>Tariflar yuklanmoqda...</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Narxlar 30 kunlik joylashuv uchun. Auksion: yuqori taklif bergan brend yuqoriroq o'rinda ko'rinadi.
          </p>
        </section>

        {/* Directions showcase */}
        <section className="container mx-auto px-4 py-8 border-t border-border">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" /> 24 tibbiy yo'nalish — bo'sh o'rinlar
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Har bir yo'nalish bo'yicha auditoriya, oylik qidiruv talabi va boshlang'ich taklif. “Batafsil” tugmasi
            orqali to'liq brend brifini ko'ring. Bular namuna — real reklama emas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {SHOWCASE_BRANDS.map((b) => (
              <ShowcaseBrandCard key={b.code} brand={b} />
            ))}
          </div>
        </section>

        <CreativeGuide />
      </main>

      <Footer />
    </div>
  );
};

export default Med1TopGuidePage;
