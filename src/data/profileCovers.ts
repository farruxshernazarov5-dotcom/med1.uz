import mountains from "@/assets/profile-covers/mountains.jpg";
import sea from "@/assets/profile-covers/sea.jpg";
import flowers from "@/assets/profile-covers/flowers.jpg";
import samarkand from "@/assets/profile-covers/samarkand.jpg";
import abstract from "@/assets/profile-covers/abstract.jpg";
import forest from "@/assets/profile-covers/forest.jpg";

/** Recommended profile backgrounds. `profiles.cover_url` stores `preset:<id>` or an uploaded image URL. */
export const PROFILE_COVERS = [
  { id: "mountains", title: "Tog‘ ko‘li", src: mountains },
  { id: "sea", title: "Dengiz", src: sea },
  { id: "flowers", title: "Bahor bog‘i", src: flowers },
  { id: "samarkand", title: "Samarqand", src: samarkand },
  { id: "forest", title: "O‘rmon", src: forest },
  { id: "abstract", title: "Abstrakt", src: abstract },
] as const;

export function coverSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("preset:")) return PROFILE_COVERS.find((c) => c.id === value.slice(7))?.src ?? null;
  return /^https:\/\//.test(value) ? value : null;
}
