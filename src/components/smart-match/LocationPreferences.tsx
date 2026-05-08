import { useState } from "react";
import { Navigation, MapPin, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocationPrefs } from "@/hooks/useLocationPrefs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "compact" | "inline";
  className?: string;
}

export function LocationPreferences({ variant = "compact", className }: Props) {
  const { prefs, save, detect, loading } = useLocationPrefs();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(prefs.city);
  const [radius, setRadius] = useState(prefs.radius_km);

  const handleDetect = async () => {
    try {
      const next = await detect();
      toast({ title: "📍 Joylashuv aniqlandi", description: `${next.latitude?.toFixed(3)}, ${next.longitude?.toFixed(3)}` });
    } catch (e: any) {
      toast({ title: "Xatolik", description: e?.message || "Joylashuv aniqlanmadi", variant: "destructive" });
    }
  };

  const apply = async () => {
    await save({ city: city.trim(), radius_km: radius });
    toast({ title: "✅ Saqlandi" });
    setOpen(false);
  };

  const summary = prefs.latitude
    ? `${prefs.city || "Joriy joylashuv"} • ${prefs.radius_km} km`
    : prefs.city ? `${prefs.city} • ${prefs.radius_km} km` : "Joylashuvni sozlang";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors",
            variant === "inline" && "w-full justify-between",
            className
          )}
        >
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium truncate max-w-[180px]">{summary}</span>
          <Settings className="w-3 h-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <p className="font-bold text-sm">Joylashuv preferensiyalari</p>
            <p className="text-[11px] text-muted-foreground">Smart Match natijalari shu radiusda saralanadi.</p>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={handleDetect} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Navigation className="w-3 h-3 mr-2" />}
            Joriy joylashuvni aniqlash
          </Button>

          <div>
            <Label className="text-xs">Shahar / hudud</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Toshkent" className="mt-1 h-9" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Radius</Label>
              <span className="text-xs font-bold text-primary">{radius} km</span>
            </div>
            <Slider value={[radius]} onValueChange={(v) => setRadius(v[0])} min={1} max={100} step={1} className="mt-2" />
          </div>

          {prefs.latitude && (
            <p className="text-[10px] text-muted-foreground">
              📍 {prefs.latitude.toFixed(4)}, {prefs.longitude?.toFixed(4)}
            </p>
          )}

          <Button onClick={apply} size="sm" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">Saqlash</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
