import { MapPin, X, Navigation, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export interface GeoMatch {
  promo_id: string;
  clinic_id: string;
  clinic_name: string;
  clinic_lat?: number;
  clinic_lng?: number;
  distance_m: number;
  title: string;
  description?: string;
  discount_percent?: number;
  image_url?: string;
  message: string;
}

interface Props { match: GeoMatch; onClose: () => void; }

export function GeoPromoPopup({ match, onClose }: Props) {
  const directionsUrl = match.clinic_lat && match.clinic_lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${match.clinic_lat},${match.clinic_lng}`
    : null;

  const trackClick = async () => {
    await supabase.from("geo_notifications").update({ opened: true, converted: true })
      .eq("promo_id", match.promo_id).order("sent_at", { ascending: false }).limit(1);
    const { data } = await supabase.from("promotions").select("click_count, conversion_count").eq("id", match.promo_id).single();
    await supabase.from("promotions").update({
      click_count: (data?.click_count || 0) + 1,
      conversion_count: (data?.conversion_count || 0) + 1,
    }).eq("id", match.promo_id);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-[70] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in">
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 p-4 text-white">
        <button onClick={onClose} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" /> AI GEO TAVSIYA
        </div>
        <p className="text-sm leading-snug">{match.message}</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">{match.clinic_name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {match.distance_m}m uzoqlikda
            </p>
          </div>
          {match.discount_percent ? (
            <div className="text-right">
              <p className="text-2xl font-extrabold text-primary">-{match.discount_percent}%</p>
              <p className="text-[10px] text-muted-foreground uppercase">chegirma</p>
            </div>
          ) : null}
        </div>
        <div>
          <p className="font-semibold text-sm">{match.title}</p>
          {match.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{match.description}</p>}
        </div>
        <div className="flex gap-2">
          {directionsUrl && (
            <a href={directionsUrl} target="_blank" rel="noreferrer" onClick={trackClick} className="flex-1">
              <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                <Navigation className="w-3.5 h-3.5 mr-1" /> Yo'l
              </Button>
            </a>
          )}
          <Button size="sm" variant="outline" onClick={() => { trackClick(); onClose(); }}>Yozilish</Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Keyinroq</Button>
        </div>
      </div>
    </div>
  );
}
