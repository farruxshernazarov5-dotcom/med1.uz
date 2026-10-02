import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Clock3,
  Cross,
  FilterX,
  LocateFixed,
  Map,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Rows3,
  Stethoscope,
  X,
} from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { hapticTap } from "@/lib/nativeApp";
import { cn } from "@/lib/utils";

type Place = {
  id: string;
  org_type: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
  working_hours?: string | null;
};

const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];
const CACHE_KEY = "med1_mobile_nearby_cache_v1";
const FILTERS = [
  { id: "all", label: "Barchasi", types: [] },
  { id: "clinic", label: "Klinikalar", types: ["clinic"] },
  { id: "doctor", label: "Shifokorlar", types: ["doctor"] },
  { id: "pharmacy", label: "Dorixonalar", types: ["pharmacy"] },
  { id: "diagnostics", label: "Diagnostika", types: ["diagnostics"] },
  { id: "dental", label: "Stomatologiya", types: ["dental"] },
  { id: "open", label: "Hozir ochiq 24/7", types: [] },
  { id: "near", label: "Yaqinlar", types: [] },
] as const;

const CITIES = [
  { city: "Toshkent shahri", district: "Markaz", center: DEFAULT_CENTER },
  { city: "Samarqand", district: "Shahar markazi", center: [39.6542, 66.9597] as [number, number] },
  { city: "Buxoro", district: "Shahar markazi", center: [39.7681, 64.4556] as [number, number] },
  { city: "Farg‘ona", district: "Shahar markazi", center: [40.3894, 71.7870] as [number, number] },
] as const;

const markerIcon = L.divIcon({
  className: "mobile-service-marker",
  html: "<span></span>",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const Recenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
};

const isAlwaysOpen = (place: Place) => /24\s*\/\s*7/i.test(place.working_hours ?? "");
const detailPath = (place: Place) => {
  const prefix: Record<string, string> = { clinic: "/clinics", doctor: "/doctors", diagnostics: "/diagnostics", dental: "/dental" };
  return `${prefix[place.org_type] ?? "/clinics"}/${place.id}`;
};

const MobileServicesPage = () => {
  const [mode, setMode] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [city, setCity] = useState("Toshkent shahri");
  const [radius, setRadius] = useState(10);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { setPlaces(JSON.parse(cached) as Place[]); } catch { localStorage.removeItem(CACHE_KEY); }
    }
    navigator.geolocation?.getCurrentPosition(
      (position) => setCenter([position.coords.latitude, position.coords.longitude]),
      () => setLocationOpen(true),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 8_000 },
    );
    (async () => {
      const { data, error } = await (supabase as any).rpc("get_nearby_medical_services", {
        _lat: center[0], _lng: center[1], _radius_km: radius, _limit: 150,
      });
      if (!active) return;
      if (!error && data) {
        const next = (data as Place[]).filter((place) => place.latitude && place.longitude);
        setPlaces(next);
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [center[0], center[1], radius]);

  const visible = useMemo(() => {
    const config = FILTERS.find((item) => item.id === filter);
    let result = config?.types.length ? places.filter((place) => config.types.includes(place.org_type as never)) : places;
    if (filter === "open") result = result.filter(isAlwaysOpen);
    if (filter === "near") result = result.filter((place) => place.distance_km <= 5);
    return [...result].sort((a, b) => a.distance_km - b.distance_km);
  }, [filter, places]);

  const choosePlace = (place: Place) => {
    void hapticTap();
    setSelected(place);
    setPlaceOpen(true);
  };

  const resetFilters = () => setFilter("all");

  return (
    <main className="min-h-screen bg-background pb-24 lg:hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-primary">Med1.uz</p>
            <h1 className="text-xl font-bold text-foreground">Xizmatlar</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocationOpen(true)}>
            <MapPin className="h-4 w-4" /> {city}
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 rounded-lg bg-muted p-1" aria-label="Ko‘rinish turi">
          <Button variant={mode === "list" ? "default" : "ghost"} size="sm" onClick={() => setMode("list")}>
            <Rows3 /> Ro‘yxat
          </Button>
          <Button variant={mode === "map" ? "default" : "ghost"} size="sm" onClick={() => setMode("map")}>
            <Map /> Xarita
          </Button>
        </div>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            variant={filter === item.id ? "default" : "outline"}
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {mode === "map" && (
        <section className="relative h-[calc(100dvh-13.5rem)] min-h-[420px] border-y border-border" aria-label="Tibbiy xizmatlar xaritasi">
          <MapContainer center={center} zoom={13} className="h-full w-full" zoomControl={false}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Recenter center={center} />
            {visible.map((place) => (
              <Marker key={`${place.org_type}-${place.id}`} position={[place.latitude, place.longitude]} icon={markerIcon} eventHandlers={{ click: () => choosePlace(place) }} />
            ))}
          </MapContainer>
          <Button size="icon" className="absolute bottom-4 right-4 z-[400] shadow-card" aria-label="Joylashuvimga qaytish" onClick={() => {
            navigator.geolocation?.getCurrentPosition((p) => setCenter([p.coords.latitude, p.coords.longitude]), () => setLocationOpen(true));
          }}>
            <LocateFixed />
          </Button>
        </section>
      )}

      {mode === "list" && (
        <section className="space-y-3 px-4 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{loading ? "Xizmatlar yuklanmoqda…" : `${visible.length} ta xizmat • ${radius} km`}</span>
            {filter !== "all" && <Button variant="ghost" size="sm" onClick={resetFilters}><FilterX /> Tozalash</Button>}
          </div>
          {visible.map((place) => (
            <article key={`${place.org_type}-${place.id}`} className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {place.org_type === "doctor" ? <Stethoscope /> : place.org_type === "pharmacy" ? <Cross /> : <Building2 />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-bold text-foreground">{place.name}</h2>
                    <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold", isAlwaysOpen(place) ? "bg-medical-green/10 text-medical-green" : "bg-muted text-muted-foreground")}>{isAlwaysOpen(place) ? "24/7" : "Jadval bo‘yicha"}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{place.address ?? place.city ?? city}</p>
                  <p className="mt-1 text-xs font-medium text-primary">{place.distance_km.toFixed(1)} km</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => choosePlace(place)}>Batafsil</Button>
                <Button size="sm" asChild><Link to={`/booking?clinic=${place.id}`}>Qabulga yozilish</Link></Button>
              </div>
            </article>
          ))}
          {!loading && visible.length === 0 && (
            <div className="py-16 text-center">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-3 text-lg font-bold text-foreground">Hech narsa topilmadi</h2>
              <p className="mt-1 text-sm text-muted-foreground">Radiusni kengaytiring yoki filtrlarni tozalang.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button onClick={() => setRadius((value) => value + 10)}><Plus /> Radius +10 km</Button>
                <Button variant="outline" onClick={resetFilters}><FilterX /> Tozalash</Button>
              </div>
            </div>
          )}
        </section>
      )}

      <Drawer open={locationOpen} onOpenChange={setLocationOpen} shouldScaleBackground={false}>
        <DrawerContent className="lg:hidden rounded-t-3xl bg-card">
          <DrawerHeader className="text-left">
            <DrawerTitle>Hududni tanlang</DrawerTitle>
            <DrawerDescription>GPS ishlamasa, sizga yaqin xizmatlar shu markazdan hisoblanadi.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {CITIES.map((item) => (
              <Button key={item.city} variant={city === item.city ? "default" : "outline"} className="h-auto w-full justify-start py-3" onClick={() => {
                setCity(item.city); setCenter(item.center); setLocationOpen(false);
              }}>
                <MapPin /> <span className="text-left"><span className="block">{item.city}</span><span className="block text-xs opacity-70">{item.district}</span></span>
              </Button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={placeOpen} onOpenChange={setPlaceOpen} snapPoints={[0.25, 0.75, 1]} shouldScaleBackground={false}>
        <DrawerContent className="lg:hidden min-h-[25dvh] max-h-[92dvh] rounded-t-3xl bg-card">
          {selected && (
            <>
              <DrawerHeader className="relative text-left">
                <DrawerTitle>{selected.name}</DrawerTitle>
                <DrawerDescription>{selected.address ?? selected.city ?? "Manzil ko‘rsatilmagan"}</DrawerDescription>
                <DrawerClose asChild><Button variant="ghost" size="icon" className="absolute right-3 top-2" aria-label="Muassasa oynasini yopish"><X /></Button></DrawerClose>
              </DrawerHeader>
              <div className="space-y-4 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{selected.distance_km.toFixed(1)} km</span>
                  <span className={cn("rounded-full px-2.5 py-1 font-medium", isAlwaysOpen(selected) ? "bg-medical-green/10 text-medical-green" : "bg-muted text-muted-foreground")}><Clock3 className="mr-1 inline h-3 w-3" />{isAlwaysOpen(selected) ? "24/7 shoshilinch" : "Hozir yopiq bo‘lishi mumkin"}</span>
                </div>
                {selected.phone && <Button variant="outline" className="w-full" asChild><a href={`tel:${selected.phone}`}><Phone /> {selected.phone}</a></Button>}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" asChild><a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`} target="_blank" rel="noreferrer"><Navigation /> Marshrut</a></Button>
                  <Button asChild><Link to={`/booking?clinic=${selected.id}`}>Qabulga yozilish</Link></Button>
                </div>
                <Button variant="ghost" className="w-full" asChild><Link to={detailPath(selected)}>To‘liq profilni ochish</Link></Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </main>
  );
};

export default MobileServicesPage;