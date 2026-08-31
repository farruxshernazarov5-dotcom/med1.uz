import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  Eye,
  ExternalLink,
  Globe,
  Instagram,
  MapPin,
  MousePointerClick,
  Navigation,
  Phone,
  Send,
  ShieldCheck,
  Star,
  Youtube,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { type AdCampaign, type Lang, formatSum, trackAdEvent, tr } from "@/lib/med1Top";

interface Props {
  ad: AdCampaign;
  lang: Lang;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const L = {
  about: { uz: "Reklama beruvchi haqida", ru: "О рекламодателе", en: "About the advertiser" },
  stats: { uz: "Reklama statistikasi", ru: "Статистика рекламы", en: "Ad performance" },
  views: { uz: "Ko'rishlar", ru: "Показы", en: "Views" },
  clicks: { uz: "Kliklar", ru: "Клики", en: "Clicks" },
  ctr: { uz: "CTR", ru: "CTR", en: "CTR" },
  rank: { uz: "TOP o'rin", ru: "ТОП место", en: "TOP rank" },
  contacts: { uz: "Aloqa", ru: "Контакты", en: "Contacts" },
  live: { uz: "Real vaqt", ru: "Реальное время", en: "Live" },
  moderated: {
    uz: "Med1 moderatsiyasidan o'tgan",
    ru: "Прошло модерацию Med1",
    en: "Passed Med1 moderation",
  },
} as const;

const t = (k: keyof typeof L, lang: Lang) => L[k][lang] ?? L[k].uz;

const AdDetailDialog = ({ ad, lang, open, onOpenChange }: Props) => {
  const [live, setLive] = useState({ impressions: ad.impressions, clicks: ad.clicks });

  useEffect(() => {
    if (!open) return;
    trackAdEvent(ad.id, "profile");
    let alive = true;
    void supabase
      .from("med1_ad_campaigns")
      .select("impressions, clicks")
      .eq("id", ad.id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive && data) setLive({ impressions: Number(data.impressions) || 0, clicks: Number(data.clicks) || 0 });
      });
    return () => {
      alive = false;
    };
  }, [open, ad.id]);

  const ctr = live.impressions > 0 ? ((live.clicks / live.impressions) * 100).toFixed(1) : "0.0";

  const mapsUrl = ad.lat && ad.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${ad.lat},${ad.lng}`
    : ad.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ad.address)}`
      : null;

  const socials = [
    { url: ad.website_url, icon: Globe, label: "Website", ev: "click" as const },
    { url: ad.telegram_url, icon: Send, label: "Telegram", ev: "social" as const },
    { url: ad.instagram_url, icon: Instagram, label: "Instagram", ev: "social" as const },
    { url: ad.youtube_url, icon: Youtube, label: "YouTube", ev: "social" as const },
  ].filter((s) => !!s.url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 text-left pr-6">
            {ad.logo_url ? (
              <img
                src={ad.logo_url}
                alt={`${ad.brand_name || ad.title} logotipi`}
                className="w-12 h-12 rounded-xl object-cover border border-border bg-muted shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <DialogTitle className="truncate">{ad.brand_name || ad.title}</DialogTitle>
              <p className="text-xs text-muted-foreground truncate">
                {[ad.specialty, ad.region, ad.entity_type].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] uppercase">{tr("sponsored", lang)}</Badge>
          {ad.top_rank ? <Badge variant="outline" className="border-amber-400/40 text-amber-400">TOP-{ad.top_rank}</Badge> : null}
          <Badge variant="outline" className="text-[10px] gap-1">
            <ShieldCheck className="w-3 h-3" /> {t("moderated", lang)}
          </Badge>
        </div>

        {ad.title ? <p className="font-semibold text-foreground">{ad.title}</p> : null}
        {ad.description ? <p className="text-sm text-muted-foreground whitespace-pre-line">{ad.description}</p> : null}

        {/* Live performance */}
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" /> {t("stats", lang)}
            <span className="ml-auto text-[10px] font-normal text-emerald-500">● {t("live", lang)}</span>
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <Eye className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
              <p className="font-heading font-bold text-foreground">{live.impressions.toLocaleString("ru-RU")}</p>
              <p className="text-[10px] text-muted-foreground">{t("views", lang)}</p>
            </div>
            <div>
              <MousePointerClick className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
              <p className="font-heading font-bold text-foreground">{live.clicks.toLocaleString("ru-RU")}</p>
              <p className="text-[10px] text-muted-foreground">{t("clicks", lang)}</p>
            </div>
            <div>
              <BarChart3 className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
              <p className="font-heading font-bold text-primary">{ctr}%</p>
              <p className="text-[10px] text-muted-foreground">{t("ctr", lang)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-muted/40 p-2">
            <p className="text-muted-foreground">{tr("currentBid", lang)}</p>
            <p className="font-semibold text-foreground">{formatSum(ad.bid_amount)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-2">
            <p className="text-muted-foreground">{t("rank", lang)}</p>
            <p className="font-semibold text-foreground">{ad.top_rank ? `TOP-${ad.top_rank}` : "—"}</p>
          </div>
        </div>

        {ad.address ? (
          <p className="text-sm text-muted-foreground flex items-start gap-1.5">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {ad.address}
          </p>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">{t("contacts", lang)}</p>
          <div className="flex flex-wrap gap-2">
            {ad.phone ? (
              <Button asChild size="sm" onClick={() => trackAdEvent(ad.id, "call")}>
                <a href={`tel:${ad.phone}`}>
                  <Phone className="w-3.5 h-3.5 mr-1" /> {ad.phone}
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
            {socials.map((s) => (
              <Button key={s.label} asChild size="sm" variant="outline" onClick={() => trackAdEvent(ad.id, s.ev)}>
                <a href={s.url as string} target="_blank" rel="nofollow noopener noreferrer">
                  <s.icon className="w-3.5 h-3.5 mr-1" /> {s.label}
                  <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                </a>
              </Button>
            ))}
            {ad.entity_id && ad.entity_type === "clinic" ? (
              <Button asChild size="sm" variant="secondary" onClick={() => trackAdEvent(ad.id, "book")}>
                <a href={`/clinics/${ad.entity_id}`}>
                  <CalendarCheck className="w-3.5 h-3.5 mr-1" /> {tr("book", lang)}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdDetailDialog;
