import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Crown, Megaphone, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdCard from "./AdCard";
import { useLanguage } from "@/hooks/useLanguage";
import {
  type AdCampaign,
  type AuctionState,
  type Lang,
  fetchAuctionState,
  fetchTopAds,
  formatSum,
  placementName,
} from "@/lib/med1Top";

/** Bosh sahifadagi Med1 TOP auksion bloki — faqat real reklama beruvchilar. */
const Med1TopHomeSection = () => {
  const { lang } = useLanguage();
  const L = lang as Lang;
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [auction, setAuction] = useState<AuctionState[]>([]);

  useEffect(() => {
    fetchTopAds({ order: "rank", limit: 3 }).then(setAds).catch(() => setAds([]));
    fetchAuctionState().then(setAuction).catch(() => setAuction([]));
  }, []);

  const top = auction.slice(0, 3);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <Badge variant="outline" className="mb-2 border-primary/40 text-primary">
              <Megaphone className="w-3.5 h-3.5 mr-1" /> Med1 TOP
            </Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">
              Tibbiy reklama auksioni
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mt-1">
              Yuqoriroq taklif — yuqoriroq o'rin va ko'proq bemor. Har bir e'lon ko'rishlar, kliklar va CTR bo'yicha
              real vaqtda hisoblanadi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/med1-top">
                Auksionga kirish <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/med1-top/guide">
                <BookOpen className="w-4 h-4 mr-1" /> Tariflar va qo'llanma
              </Link>
            </Button>
          </div>
        </div>

        {top.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {top.map((p) => (
              <div key={p.placement_id} className="rounded-2xl border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-primary" /> {placementName(p, L)}
                </p>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {p.slots} o'rin · {p.active_ads} faol
                </p>
                <p className="text-xs text-muted-foreground">Keyingi minimal taklif</p>
                <p className="font-heading font-bold text-primary">{formatSum(p.next_min_bid)}</p>
              </div>
            ))}
          </div>
        ) : null}

        {ads.length > 0 ? (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Reklama · TOP brendlar
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ads.map((a) => (
                <AdCard key={a.id} ad={a} lang={L} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="font-heading font-bold text-foreground mb-1">TOP-1 o'rin hozircha bo'sh</p>
            <p className="text-sm text-muted-foreground mb-3">
              Birinchi bo'lib joylashtiring — brendingiz barcha bo'limlarda birinchi ko'rinadi.
            </p>
            <Button asChild size="sm">
              <Link to="/med1-top/new">Reklama berish</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Med1TopHomeSection;
