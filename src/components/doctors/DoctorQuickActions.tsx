import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Scale, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMobileFavorites } from "@/hooks/useMobileFavorites";
import { useDoctorCompare } from "@/hooks/useDoctorFavorites";

interface Props {
  doctorId: string;
  name: string;
  route: string;
  specialty?: string | null;
  photoUrl?: string | null;
  className?: string;
}

/** Favorite (account-backed), compare and share actions for any doctor profile. */
export default function DoctorQuickActions({ doctorId, name, route, specialty, photoUrl, className }: Props) {
  const navigate = useNavigate();
  const fav = useMobileFavorites();
  const cmp = useDoctorCompare();
  const [busy, setBusy] = useState(false);
  const isFav = fav.has("doctor", doctorId);
  const inCompare = cmp.has(doctorId);

  const toggleFav = async () => {
    setBusy(true);
    const res = await fav.toggle({
      entity_type: "doctor",
      entity_id: doctorId,
      label: name,
      route,
      metadata: { specialty: specialty ?? null, photo_url: photoUrl ?? null },
    });
    setBusy(false);
    if (res.needsAuth) {
      toast({ title: "Tizimga kiring", description: "Sevimlilar hisobingizda saqlanadi" });
      navigate(`/auth?redirect=${encodeURIComponent(route)}`);
      return;
    }
    if (res.error) { toast({ title: "Saqlanmadi", description: "Qayta urinib ko‘ring", variant: "destructive" }); return; }
    toast({ title: isFav ? "Sevimlilardan olib tashlandi" : "Sevimlilarga qo‘shildi ❤️" });
  };

  const toggleCompare = () => {
    cmp.toggle(doctorId);
    toast({ title: inCompare ? "Taqqoslashdan olib tashlandi" : "Taqqoslashga qo‘shildi", description: inCompare ? undefined : "Pastdagi “Taqqoslash” tugmasini bosing (4 tagacha)" });
  };

  const share = async () => {
    const url = `https://med1.uz${route}`;
    try {
      if (navigator.share) await navigator.share({ title: name, text: `${name} — ${specialty ?? "shifokor"} | Med1.uz`, url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Havola nusxalandi" }); }
    } catch { /* user cancelled */ }
  };

  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:flex sm:flex-wrap", className)}>
      <Button type="button" variant={isFav ? "default" : "outline"} size="sm" className="min-h-11 gap-1.5" onClick={toggleFav} disabled={busy || fav.loading} aria-pressed={isFav}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", isFav && "fill-current")} />}
        <span className="text-xs sm:text-sm">{isFav ? "Sevimli" : "Sevimliga"}</span>
      </Button>
      <Button type="button" variant={inCompare ? "default" : "outline"} size="sm" className="min-h-11 gap-1.5" onClick={toggleCompare} aria-pressed={inCompare}>
        <Scale className="h-4 w-4" />
        <span className="text-xs sm:text-sm">{inCompare ? "Tanlandi" : "Taqqoslash"}</span>
      </Button>
      <Button type="button" variant="outline" size="sm" className="min-h-11 gap-1.5" onClick={share}>
        <Share2 className="h-4 w-4" />
        <span className="text-xs sm:text-sm">Ulashish</span>
      </Button>
    </div>
  );
}
