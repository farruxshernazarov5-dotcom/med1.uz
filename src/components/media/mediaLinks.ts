export type MediaKind = "social" | "video";

export interface MediaLink {
  id: string;
  entity_type: string;
  entity_id: string | null;
  staff_id: string | null;
  kind: MediaKind;
  platform: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
}

export const SOCIAL_PLATFORMS = [
  { value: "telegram", label: "Telegram", color: "text-sky-600" },
  { value: "instagram", label: "Instagram", color: "text-pink-600" },
  { value: "facebook", label: "Facebook", color: "text-blue-600" },
  { value: "youtube", label: "YouTube", color: "text-red-600" },
  { value: "tiktok", label: "TikTok", color: "text-foreground" },
  { value: "linkedin", label: "LinkedIn", color: "text-blue-700" },
  { value: "twitter", label: "X (Twitter)", color: "text-foreground" },
  { value: "website", label: "Veb-sayt", color: "text-emerald-600" },
  { value: "other", label: "Boshqa", color: "text-muted-foreground" },
];

export const VIDEO_PLATFORMS = [
  { value: "youtube", label: "YouTube", color: "text-red-600" },
  { value: "instagram", label: "Instagram Reels", color: "text-pink-600" },
  { value: "tiktok", label: "TikTok", color: "text-foreground" },
  { value: "telegram", label: "Telegram", color: "text-sky-600" },
  { value: "vimeo", label: "Vimeo", color: "text-cyan-600" },
  { value: "other", label: "Boshqa", color: "text-muted-foreground" },
];

export const platformLabel = (kind: MediaKind, value: string) =>
  (kind === "video" ? VIDEO_PLATFORMS : SOCIAL_PLATFORMS).find((p) => p.value === value)?.label || value;

export const platformColor = (kind: MediaKind, value: string) =>
  (kind === "video" ? VIDEO_PLATFORMS : SOCIAL_PLATFORMS).find((p) => p.value === value)?.color || "text-muted-foreground";

/** URL bo'yicha platformani avtomatik aniqlash */
export const detectPlatform = (url: string): string => {
  const u = url.toLowerCase();
  if (u.includes("t.me") || u.includes("telegram")) return "telegram";
  if (u.includes("instagram.")) return "instagram";
  if (u.includes("facebook.") || u.includes("fb.")) return "facebook";
  if (u.includes("youtube.") || u.includes("youtu.be")) return "youtube";
  if (u.includes("tiktok.")) return "tiktok";
  if (u.includes("linkedin.")) return "linkedin";
  if (u.includes("twitter.") || u.includes("x.com")) return "twitter";
  if (u.includes("vimeo.")) return "vimeo";
  return "other";
};

export const normalizeUrl = (url: string) => {
  const v = url.trim();
  if (!v) return "";
  if (v.startsWith("@")) return `https://t.me/${v.slice(1)}`;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
};

export const isValidUrl = (url: string) => {
  try {
    const u = new URL(normalizeUrl(url));
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/** YouTube / Vimeo uchun embed havolasi (aks holda null) */
export const getEmbedUrl = (url: string): string | null => {
  try {
    const u = new URL(normalizeUrl(url));
    const host = u.hostname.replace("www.", "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      if (u.pathname.startsWith("/embed/")) return u.toString();
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
};

export const getVideoThumb = (url: string): string | null => {
  const embed = getEmbedUrl(url);
  if (embed?.includes("youtube.com/embed/")) {
    const id = embed.split("/embed/")[1]?.split("?")[0];
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return null;
};
