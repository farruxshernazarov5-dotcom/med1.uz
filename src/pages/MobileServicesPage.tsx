import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  AlertCircle,
  Clock3,
  Cross,
  FilterX,
  Heart,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Rows3,
  RotateCw,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { hapticTap } from "@/lib/nativeApp";
import { cn } from "@/lib/utils";
import { useMobileFavorites } from "@/hooks/useMobileFavorites";
import { useAuth } from "@/hooks/useAuth";
import { MobileDoctorSearch } from "@/components/mobile/MobileDoctorSearch";
import { MobileServiceCatalog } from "@/components/mobile/MobileServiceCatalog";
import { getDashboardPath } from "@/lib/dashboard";

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
  services?: string[];
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userRole } = useAuth();
  const favorites = useMobileFavorites();
  const initialView = searchParams.get("view");
  const [section, setSectionState] = useState<"catalog" | "services" | "favorites" | "doctors">(
    initialView === "favorites" || initialView === "doctors" || initialView === "nearby" ? (initialView === "nearby" ? "services" : initialView) : "catalog",
  );
  const [mode, setMode] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [city, setCity] = useState("Toshkent shahri");
  const [radius, setRadius] = useState(10);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { setPlaces(JSON.parse(cached) as Place[]); setUsingCache(true); } catch { localStorage.removeItem(CACHE_KEY); }
    }
    navigator.geolocation?.getCurrentPosition(
      (position) => setCenter([position.coords.latitude, position.coords.longitude]),
      () => setLocationOpen(true),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 8_000 },
    );
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await (supabase as any).rpc("get_nearby_medical_services", {
        _lat: center[0], _lng: center[1], _radius_km: radius, _limit: 150,
      });
      if (!active) return;
      if (!error && data) {
        const nearby = (data as Place[]).filter((place) => place.latitude && place.longitude);
        const clinicIds = nearby.filter((place) => place.org_type === "clinic").map((place) => place.id);
        const clinicDetails = clinicIds.length
          ? await supabase.from("registered_clinics_public").select("id, working_hours, specialties").in("id", clinicIds)
          : { data: [] };
        const detailMap = new globalThis.Map((clinicDetails.data ?? []).map((item) => [item.id, item]));
        const next = nearby.map((place) => {
          const detail = detailMap.get(place.id);
          const hours = detail?.working_hours;
          return {
            ...place,
            working_hours: typeof hours === "string" ? hours : hours && typeof hours === "object" ? Object.values(hours).filter(Boolean).slice(0, 2).join(" • ") : null,
            services: detail?.specialties ?? [],
          };
        });
        setPlaces(next);
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        setUsingCache(false);
      } else if (error) {
        setError(cached ? "Yangi ma’lumotlarni olib bo‘lmadi. Saqlangan ro‘yxat ko‘rsatilmoqda." : "Xizmatlarni yuklab bo‘lmadi. Internetni tekshirib qayta urinib ko‘ring.");
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [center[0], center[1], radius, reloadKey]);

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

  const toggleFavorite = async (place: Place) => {
    if (!user) {
      window.location.assign(`/auth?returnTo=${encodeURIComponent("/mobile-services?view=favorites")}`);
      return;
    }
    await favorites.toggle({
      entity_type: place.org_type === "doctor" ? "doctor" : "clinic",
      entity_id: place.id,
      label: place.name,
      route: detailPath(place),
      metadata: { address: place.address, phone: place.phone, services: place.services ?? [] },
    });
  };

  const setSection = (next: "catalog" | "services" | "favorites" | "doctors") => {
    setSectionState(next);
    const params = new URLSearchParams(searchParams);
    if (next === "catalog") params.delete("view"); else params.set("view", next === "services" ? "nearby" : next);
    setSearchParams(params, { replace: true });
  };

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
        {section === "services" && <div className="mt-3 grid grid-cols-2 rounded-lg bg-muted p-1" aria-label="Ko‘rinish turi">
          <Button variant={mode === "list" ? "default" : "ghost"} size="sm" onClick={() => setMode("list")}>
            <Rows3 /> Ro‘yxat
          </Button>
          <Button variant={mode === "map" ? "default" : "ghost"} size="sm" onClick={() => setMode("map")}>
            <MapIcon /> Xarita
          </Button>
        </div>}
        <div className="mt-2 grid grid-cols-4 gap-1" role="tablist" aria-label="Xizmatlar bo‘limlari">
          {([['catalog', 'Katalog'], ['services', 'Yaqin'], ['doctors', 'Shifokor'], ['favorites', `Sevimli (${favorites.items.length})`]] as const).map(([id, label]) => (
            <Button key={id} role="tab" aria-selected={section === id} variant={section === id ? "secondary" : "ghost"} size="sm" className="px-1 text-xs" onClick={() => setSection(id)}>{label}</Button>
          ))}
        </div>
      </header>

      {section === "catalog" ? (
        <MobileServiceCatalog
          dashboardPath={user ? getDashboardPath(userRole) : "/auth?returnTo=%2Fdashboard"}
          onOpenNearby={() => setSection("services")}
          onOpenDoctors={() => setSection("doctors")}
          onOpenFavorites={() => setSection("favorites")}
        />
      ) : section === "doctors" ? <MobileDoctorSearch /> : section === "favorites" ? (
        <section className="space-y-3 px-4 py-4" aria-labelledby="favorites-title">
          <h2 id="favorites-title" className="text-lg font-bold text-foreground">Sevimlilar</h2>
          {!user ? <div className="py-12 text-center"><Heart className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Sevimlilar barcha qurilmalarda saqlanishi uchun kiring.</p><Button className="mt-4" asChild><Link to="/auth?returnTo=%2Fmobile-services%3Fview%3Dfavorites">Kirish</Link></Button></div>
          : favorites.loading ? <div className="space-y-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-20 w-full" />)}</div>
          : favorites.items.length ? favorites.items.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"><Heart className="h-5 w-5 fill-current text-destructive" /><Link to={item.route} className="min-w-0 flex-1 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{item.label}</Link><Button variant="ghost" size="icon" aria-label={`${item.label}ni sevimlilardan olib tashlash`} onClick={() => void favorites.toggle({ entity_type: item.entity_type, entity_id: item.entity_id, label: item.label, route: item.route, metadata: item.metadata })}><X /></Button></article>)
          : <div className="py-12 text-center"><Heart className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-2 font-semibold">Sevimlilar hali yo‘q</p><Button variant="outline" className="mt-4" onClick={() => setSection("catalog")}>Xizmatlarni ko‘rish</Button></div>}
        </section>
      ) : <>
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

      {error && <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{error}</span><Button variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)}><RotateCw /> Qayta</Button></div>}
      {usingCache && !error && <p className="mx-4 mb-3 text-xs text-muted-foreground" role="status">Saqlangan xizmatlar ko‘rsatilmoqda, yangilanmoqda…</p>}

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
          {loading && <div className="absolute inset-x-4 top-4 z-[400] rounded-lg border border-border bg-card/95 p-3 text-center text-sm text-muted-foreground" role="status">Xarita natijalari yuklanmoqda…</div>}
          {!loading && !error && visible.length === 0 && <div className="absolute inset-x-4 top-4 z-[400] rounded-lg border border-border bg-card/95 p-3 text-center"><p className="font-semibold">Bu hududda natija topilmadi</p><div className="mt-2 flex justify-center gap-2"><Button size="sm" onClick={() => setRadius((value) => value + 10)}>Radius +10 km</Button><Button size="sm" variant="outline" onClick={resetFilters}>Tozalash</Button></div></div>}
        </section>
      )}

      {mode === "list" && (
        <section className="space-y-3 px-4 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{loading ? "Xizmatlar yuklanmoqda…" : `${visible.length} ta xizmat • ${radius} km`}</span>
            {filter !== "all" && <Button variant="ghost" size="sm" onClick={resetFilters}><FilterX /> Tozalash</Button>}
          </div>
          {loading && places.length === 0 && [0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-44 w-full" />)}
          {!loading && visible.map((place) => (
            <article key={`${place.org_type}-${place.id}`} className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {place.org_type === "doctor" ? <Stethoscope /> : place.org_type === "pharmacy" ? <Cross /> : <Building2 />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-bold text-foreground">{place.name}</h2>
                    <Button variant="ghost" size="icon" className="-mr-2 -mt-2" aria-label={favorites.has(place.org_type === "doctor" ? "doctor" : "clinic", place.id) ? `${place.name}ni sevimlilardan olib tashlash` : `${place.name}ni sevimlilarga qo‘shish`} onClick={() => void toggleFavorite(place)}><Heart className={favorites.has(place.org_type === "doctor" ? "doctor" : "clinic", place.id) ? "fill-current text-destructive" : ""} /></Button>
                    <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold", isAlwaysOpen(place) ? "bg-medical-green/10 text-medical-green" : "bg-muted text-muted-foreground")}>{isAlwaysOpen(place) ? "24/7" : "Jadval bo‘yicha"}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{place.address ?? place.city ?? city}</p>
                  <p className="mt-1 text-xs font-medium text-primary">{place.distance_km.toFixed(1)} km</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{place.working_hours || (isAlwaysOpen(place) ? "24/7" : "Ish vaqti profilida")}</p>
                  {place.phone && <a className="mt-1 flex items-center gap-1 text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`tel:${place.phone}`}><Phone className="h-3 w-3" />{place.phone}</a>}
                  {!!place.services?.length && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{place.services.slice(0, 3).join(" • ")}</p>}
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
      </>}

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
                <div><h3 className="text-sm font-semibold text-foreground">Ish vaqti</h3><p className="mt-1 text-sm text-muted-foreground">{selected.working_hours || (isAlwaysOpen(selected) ? "24/7" : "Aniq jadval profil sahifasida")}</p></div>
                {!!selected.services?.length && <div><h3 className="text-sm font-semibold text-foreground">Xizmatlar</h3><div className="mt-2 flex flex-wrap gap-1.5">{selected.services.map((service) => <Button key={service} variant="secondary" size="sm" onClick={() => { void favorites.toggle({ entity_type: "service", entity_id: `${selected.id}:${service}`, label: service, route: `${detailPath(selected)}?service=${encodeURIComponent(service)}`, metadata: { clinic: selected.name } }); }}>{service}{favorites.has("service", `${selected.id}:${service}`) && <Heart className="ml-1 h-3 w-3 fill-current text-destructive" />}</Button>)}</div></div>}
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