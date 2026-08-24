import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Megaphone, TrendingUp, MapPin, Search, Trophy, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AdCard from "@/components/med1top/AdCard";
import { useLanguage } from "@/hooks/useLanguage";
import {
  AD_REGIONS,
  type AdCampaign,
  type AuctionState,
  type Lang,
  fetchAuctionState,
  fetchTopAds,
  formatSum,
  placementName,
  tr,
} from "@/lib/med1Top";

type OrderKey = "rank" | "new" | "views" | "clicks" | "bid";

const Med1TopPage = () => {
  const { lang } = useLanguage();
  const L = lang as Lang;
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [auction, setAuction] = useState<AuctionState[]>([]);
  const [order, setOrder] = useState<OrderKey>("rank");
  const [region, setRegion] = useState<string>("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctionState().then(setAuction).catch(() => setAuction([]));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTopAds({ order, region: region || undefined, limit: 90 })
      .then((rows) => alive && setAds(rows))
      .catch(() => alive && setAds([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [order, region]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ads;
    return ads.filter((a) =>
      [a.title, a.brand_name, a.specialty, a.region, a.address, a.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [ads, q]);

  const top1 = filtered.filter((a) => a.top_rank === 1);
  const top3 = filtered.filter((a) => a.top_rank !== null && a.top_rank > 1 && a.top_rank <= 3);
  const top10 = filtered.filter((a) => a.top_rank !== null && a.top_rank > 3 && a.top_rank <= 10);

  const tabs: { key: OrderKey; label: string; icon: typeof Trophy }[] = [
    { key: "rank", label: "TOP", icon: Trophy },
    { key: "new", label: tr("newest", L), icon: Sparkles },
    { key: "views", label: tr("mostViewed", L), icon: TrendingUp },
    { key: "clicks", label: tr("mostClicked", L), icon: TrendingUp },
    { key: "bid", label: tr("topBids", L), icon: Crown },
  ];

  const section = (title: string, items: AdCampaign[], icon: typeof Crown) => {
    const Icon = icon;
    if (items.length === 0) return null;
    return (
      <section className="mb-10">
        <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" /> {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((a) => (
            <AdCard key={a.id} ad={a} lang={L} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Med1 TOP — tibbiy reklama auksioni va TOP reyting"
        description="Klinikalar, shifokorlar, laboratoriyalar va dorixonalar uchun Med1 TOP reklama auksioni: taklif bering, TOP o'ringa chiqing va ko'proq mijoz oling."
        path="/med1-top"
        ogType="website"
      />
      <Header />

      <main>
        <section className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
              <Megaphone className="w-3.5 h-3.5 mr-1" /> {tr("title", L)}
            </Badge>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              MED1 TOP — {lang === "ru" ? "аукцион медицинской рекламы" : lang === "en" ? "medical ad auction" : "tibbiy reklama auksioni"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-6">{tr("subtitle", L)}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/med1-top/new">{tr("createAd", L)}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/med1-top/my">{tr("myAds", L)}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Auction board */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {lang === "ru" ? "Аукцион ТОП-мест" : lang === "en" ? "TOP slots auction" : "TOP o'rinlar auksioni"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {auction.slice(0, 12).map((p) => (
              <div key={p.placement_id} className="bg-card rounded-2xl border border-border p-4">
                <p className="font-heading font-bold text-foreground text-sm mb-1">{placementName(p, L)}</p>
                <p className="text-[11px] text-muted-foreground mb-3">
                  {p.slots} {lang === "ru" ? "мест" : lang === "en" ? "slots" : "o'rin"} · {p.active_ads} {lang === "ru" ? "активных" : lang === "en" ? "active" : "faol"}
                </p>
                <p className="text-xs text-muted-foreground">{tr("currentBid", L)}</p>
                <p className="font-semibold text-foreground mb-2">{formatSum(p.current_top_bid || p.min_bid)}</p>
                <p className="text-xs text-muted-foreground">{tr("nextBid", L)}</p>
                <p className="font-semibold text-primary mb-3">{formatSum(p.next_min_bid)}</p>
                <Button asChild size="sm" className="w-full">
                  <Link to={`/med1-top/new?placement=${p.code}`}>
                    {lang === "ru" ? "Повысить ставку" : lang === "en" ? "Raise bid" : "Taklifni oshirish"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="container mx-auto px-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "ru" ? "Поиск бренда, клиники, врача" : lang === "en" ? "Search brand, clinic, doctor" : "Brend, klinika, shifokor qidirish"} className="pl-9" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button variant={region === "" ? "default" : "outline"} size="sm" onClick={() => setRegion("")}>
                {tr("all", L)}
              </Button>
              {AD_REGIONS.map((r) => (
                <Button key={r} variant={region === r ? "default" : "outline"} size="sm" onClick={() => setRegion(r)} className="shrink-0">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> {r}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
            {tabs.map((t) => (
              <Button key={t.key} size="sm" variant={order === t.key ? "default" : "outline"} onClick={() => setOrder(t.key)} className="shrink-0">
                <t.icon className="w-3.5 h-3.5 mr-1" /> {t.label}
              </Button>
            ))}
          </div>
        </section>

        <div className="container mx-auto px-4 py-6">
          {loading ? (
            <p className="text-muted-foreground text-sm">Yuklanmoqda...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <Megaphone className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="font-heading font-bold text-foreground mb-1">
                {lang === "ru" ? "Пока нет активной рекламы" : lang === "en" ? "No active ads yet" : "Hozircha faol reklama yo'q"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">{tr("createAd", L)}</p>
              <Button asChild>
                <Link to="/med1-top/new">{tr("createAd", L)}</Link>
              </Button>
            </div>
          ) : order === "rank" ? (
            <>
              {section("TOP-1", top1, Crown)}
              {section("TOP-3", top3, Trophy)}
              {section("TOP-10", top10, TrendingUp)}
              {section(
                lang === "ru" ? "Все рекламодатели" : lang === "en" ? "All advertisers" : "Barcha reklama beruvchilar",
                filtered.filter((a) => !a.top_rank || a.top_rank > 10),
                Megaphone,
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a) => (
                <AdCard key={a.id} ad={a} lang={L} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Med1TopPage;
