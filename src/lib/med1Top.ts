import { supabase } from "@/integrations/supabase/client";

export type Lang = "uz" | "ru" | "en";

export type AdStatus =
  | "draft"
  | "pending_payment"
  | "pending"
  | "ai_flagged"
  | "approved"
  | "active"
  | "rejected"
  | "paused"
  | "expired";

export interface AdPlacement {
  id: string;
  code: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  category: string;
  region: string | null;
  specialty: string | null;
  slots: number;
  min_bid: number;
  bid_step: number;
  is_active: boolean;
  sort_order: number;
}

export interface AuctionState {
  placement_id: string;
  code: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  category: string;
  region: string | null;
  specialty: string | null;
  slots: number;
  min_bid: number;
  bid_step: number;
  active_ads: number;
  current_top_bid: number;
  next_min_bid: number;
}

export interface AdCampaign {
  id: string;
  owner_id: string;
  placement_id: string | null;
  entity_type: string;
  entity_id: string | null;
  title: string;
  brand_name: string | null;
  logo_url: string | null;
  website_url: string | null;
  telegram_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  phone: string | null;
  address: string | null;
  region: string | null;
  specialty: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  bid_amount: number;
  top_rank: number | null;
  status: AdStatus;
  moderation_notes: string | null;
  ai_score: number | null;
  ai_flags: unknown;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  paid_amount: number;
  impressions: number;
  clicks: number;
  created_at: string;
}

export const AD_EVENTS = [
  "impression",
  "click",
  "call",
  "map",
  "book",
  "profile",
  "social",
] as const;
export type AdEventType = (typeof AD_EVENTS)[number];

export const ENTITY_TYPES = [
  "clinic",
  "doctor",
  "lab",
  "pharmacy",
  "maternity",
  "cosmetology",
  "service",
  "brand",
] as const;

export const AD_REGIONS = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Qashqadaryo",
  "Qoraqalpog'iston",
  "Jizzax",
  "Surxondaryo",
  "Navoiy",
  "Sirdaryo",
  "Xorazm",
];

export const formatSum = (n: number) =>
  `${Math.round(Number(n) || 0).toLocaleString("ru-RU").replace(/\u00A0/g, " ")} so'm`;

export const placementName = (p: { name_uz: string; name_ru: string; name_en: string }, lang: Lang) =>
  lang === "ru" ? p.name_ru : lang === "en" ? p.name_en : p.name_uz;

export const statusTone = (s: AdStatus) => {
  switch (s) {
    case "active":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    case "approved":
      return "bg-sky-500/15 text-sky-500 border-sky-500/30";
    case "pending":
    case "pending_payment":
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "ai_flagged":
      return "bg-orange-500/15 text-orange-500 border-orange-500/30";
    case "rejected":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

/** Non-blocking analytics tracking through a SECURITY DEFINER RPC. */
export const trackAdEvent = (campaignId: string, event: AdEventType) => {
  void supabase.rpc("med1_ads_track", {
    _campaign_id: campaignId,
    _event_type: event,
    _meta: {},
  } as never);
};

export const fetchAuctionState = async (): Promise<AuctionState[]> => {
  const { data, error } = await supabase.rpc("med1_ads_auction_state" as never);
  if (error) throw error;
  return (data as unknown as AuctionState[]) ?? [];
};

export interface TopAdsFilter {
  placementCode?: string;
  region?: string;
  specialty?: string;
  entityType?: string;
  limit?: number;
  order?: "rank" | "new" | "views" | "clicks" | "bid";
}

export const fetchTopAds = async (f: TopAdsFilter = {}): Promise<AdCampaign[]> => {
  let q = supabase
    .from("med1_ad_campaigns")
    .select("*, med1_ad_placements(code, name_uz, name_ru, name_en, category)")
    .eq("status", "active");

  if (f.region) q = q.eq("region", f.region);
  if (f.specialty) q = q.eq("specialty", f.specialty);
  if (f.entityType) q = q.eq("entity_type", f.entityType);

  switch (f.order) {
    case "new":
      q = q.order("created_at", { ascending: false });
      break;
    case "views":
      q = q.order("impressions", { ascending: false });
      break;
    case "clicks":
      q = q.order("clicks", { ascending: false });
      break;
    case "bid":
      q = q.order("bid_amount", { ascending: false });
      break;
    default:
      q = q.order("top_rank", { ascending: true, nullsFirst: false }).order("bid_amount", { ascending: false });
  }

  const { data, error } = await q.limit(f.limit ?? 60);
  if (error) throw error;
  let rows = (data as unknown as (AdCampaign & { med1_ad_placements?: { code?: string } })[]) ?? [];
  if (f.placementCode) rows = rows.filter((r) => r.med1_ad_placements?.code === f.placementCode);
  return rows;
};

/** Public brand metadata preview from a URL — favicon + domain based guesses only. */
export const previewBrandFromUrl = (raw: string) => {
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  const base = host.split(".")[0];
  const brand = base.charAt(0).toUpperCase() + base.slice(1);
  const social = /t\.me|telegram/.test(host)
    ? "telegram"
    : /instagram/.test(host)
      ? "instagram"
      : /youtube|youtu\.be/.test(host)
        ? "youtube"
        : "website";
  return {
    url: url.toString(),
    host,
    brand,
    social,
    logo: `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
    isHttps: url.protocol === "https:",
  };
};

/** Basic client-side pre-check; the authoritative check runs server-side (AI + admin). */
export const RISKY_CLAIM_PATTERNS = [
  /100\s*%\s*(davolay|garant|излеч|cure)/i,
  /kafolatlangan\s+natija/i,
  /гарантированн/i,
  /guaranteed\s+(cure|result)/i,
  /мгновенн(ое|ый)\s+излечен/i,
  /tez\s+va\s+butunlay\s+davolay/i,
  /онколог.*излечива/i,
];

export const localPreCheck = (text: string) =>
  RISKY_CLAIM_PATTERNS.filter((r) => r.test(text)).map((r) => r.source);

export const T = {
  title: { uz: "Med1 TOP", ru: "Med1 ТОП", en: "Med1 TOP" },
  subtitle: {
    uz: "Tibbiy reklama auksioni — yuqoriroq taklif, yuqoriroq ko'rinish, ko'proq mijoz",
    ru: "Аукцион медицинской рекламы — выше ставка, выше видимость, больше пациентов",
    en: "Medical ad auction — higher bid, higher visibility, more patients",
  },
  createAd: {
    uz: "Brendingizni TOPga olib chiqing",
    ru: "Выведите бренд в ТОП",
    en: "Bring your brand to the TOP",
  },
  myAds: { uz: "Reklamalarim", ru: "Мои рекламы", en: "My ads" },
  currentBid: { uz: "Joriy taklif", ru: "Текущая ставка", en: "Current bid" },
  nextBid: { uz: "Keyingi minimal taklif", ru: "Следующая мин. ставка", en: "Next minimum bid" },
  sponsored: { uz: "Reklama", ru: "Реклама", en: "Sponsored" },
  details: { uz: "Batafsil", ru: "Подробнее", en: "Details" },
  book: { uz: "Qabulga yozilish", ru: "Записаться", en: "Book" },
  call: { uz: "Qo'ng'iroq qilish", ru: "Позвонить", en: "Call" },
  route: { uz: "Yo'nalish olish", ru: "Маршрут", en: "Directions" },
  all: { uz: "Barchasi", ru: "Все", en: "All" },
  newest: { uz: "Yangi qo'shilganlar", ru: "Новые", en: "Newest" },
  mostViewed: { uz: "Eng ko'p ko'rilganlar", ru: "Самые просматриваемые", en: "Most viewed" },
  mostClicked: { uz: "Eng ko'p bosilganlar", ru: "Самые кликаемые", en: "Most clicked" },
  topBids: { uz: "Eng ko'p taklif berilganlar", ru: "Наивысшие ставки", en: "Top bids" },
} as const;

export const tr = (key: keyof typeof T, lang: Lang) => T[key][lang] ?? T[key].uz;
