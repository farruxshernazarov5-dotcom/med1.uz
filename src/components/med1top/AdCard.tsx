import { useEffect, useRef, useState } from "react";
import { Phone, MapPin, CalendarCheck, ExternalLink, Navigation, Star, Send, Info, Eye, MousePointerClick, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdDetailDialog from "./AdDetailDialog";
import { type AdCampaign, type Lang, formatSum, trackAdEvent, tr } from "@/lib/med1Top";

interface Props {
  ad: AdCampaign;
  lang: Lang;
  compact?: boolean;
  showBid?: boolean;
}

const rankTone = (rank: number | null) => {
  if (rank === 1) return "bg-amber-400/20 text-amber-400 border-amber-400/40";
  if (rank && rank <= 3) return "bg-slate-300/20 text-slate-300 border-slate-300/40";
  return "bg-primary/10 text-primary border-primary/30";
};

const AdCard = ({ ad, lang, compact = false, showBid = true }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  const [detail, setDetail] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !seen.current) {
            seen.current = true;
            trackAdEvent(ad.id, "impression");
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ad.id]);

  const mapsUrl = ad.lat && ad.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${ad.lat},${ad.lng}`
    : ad.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ad.address)}`
      : null;

  return (
    <div
      ref={ref}
      className="relative bg-card rounded-2xl border border-border p-4 md:p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {ad.logo_url ? (
            <img
              src={ad.logo_url}
              alt={`${ad.brand_name || ad.title} logotipi`}
              loading="lazy"
              className="w-12 h-12 rounded-xl object-cover border border-border bg-muted shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-heading font-bold text-foreground truncate">{ad.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[ad.specialty, ad.region].filter(Boolean).join(" · ") || ad.entity_type}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {tr("sponsored", lang)}
          </Badge>
          {ad.top_rank ? (
            <Badge variant="outline" className={rankTone(ad.top_rank)}>TOP-{ad.top_rank}</Badge>
          ) : null}
        </div>
      </div>

      {!compact && ad.description ? (
        <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
      ) : null}

      {!compact && ad.address ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{ad.address}</span>
        </p>
      ) : null}

      {showBid ? (
        <p className="text-xs text-muted-foreground">
          {tr("currentBid", lang)}: <span className="font-semibold text-foreground">{formatSum(ad.bid_amount)}</span>
        </p>
      ) : null}

      {/* Live performance — ko'rishlar / kliklar / CTR */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2 text-center">
        <div>
          <Eye className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{Number(ad.impressions || 0).toLocaleString("ru-RU")}</p>
          <p className="text-[10px] text-muted-foreground">{lang === "ru" ? "Показы" : lang === "en" ? "Views" : "Ko'rishlar"}</p>
        </div>
        <div>
          <MousePointerClick className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{Number(ad.clicks || 0).toLocaleString("ru-RU")}</p>
          <p className="text-[10px] text-muted-foreground">{lang === "ru" ? "Клики" : lang === "en" ? "Clicks" : "Kliklar"}</p>
        </div>
        <div>
          <BarChart3 className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
          <p className="text-sm font-semibold text-primary">
            {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0"}%
          </p>
          <p className="text-[10px] text-muted-foreground">CTR</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-1">
        <Button size="sm" variant="secondary" onClick={() => setDetail(true)}>
          <Info className="w-3.5 h-3.5 mr-1" />
          {lang === "ru" ? "Подробная информация" : lang === "en" ? "Full details" : "Batafsil ma'lumot"}
        </Button>
        {ad.website_url ? (
          <Button asChild size="sm" variant="default" onClick={() => trackAdEvent(ad.id, "click")}>
            <a href={ad.website_url} target="_blank" rel="nofollow noopener noreferrer">
              {tr("details", lang)} <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </Button>
        ) : null}
        {ad.phone ? (
          <Button asChild size="sm" variant="outline" onClick={() => trackAdEvent(ad.id, "call")}>
            <a href={`tel:${ad.phone}`}>
              <Phone className="w-3.5 h-3.5 mr-1" /> {tr("call", lang)}
            </a>
          </Button>
        ) : null}
        {mapsUrl ? (
          <Button asChild size="sm" variant="outline" onClick={() => trackAdEvent(ad.id, "map")}>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="w-3.5 h-3.5 mr-1" /> {tr("route", lang)}
            </a>
          </Button>
        ) : null}
        {ad.telegram_url ? (
          <Button asChild size="sm" variant="ghost" onClick={() => trackAdEvent(ad.id, "social")}>
            <a href={ad.telegram_url} target="_blank" rel="nofollow noopener noreferrer">
              <Send className="w-3.5 h-3.5 mr-1" /> Telegram
            </a>
          </Button>
        ) : null}
        {ad.entity_id && ad.entity_type === "clinic" ? (
          <Button asChild size="sm" variant="secondary" onClick={() => trackAdEvent(ad.id, "book")}>
            <a href={`/clinics/${ad.entity_id}`}>
              <CalendarCheck className="w-3.5 h-3.5 mr-1" /> {tr("book", lang)}
            </a>
          </Button>
        ) : null}
      </div>

      <AdDetailDialog ad={ad} lang={lang} open={detail} onOpenChange={setDetail} />
    </div>
  );
};

export default AdCard;
