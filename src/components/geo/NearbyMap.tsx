import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2 } from "lucide-react";

// Fix default icon paths (leaflet bundling issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TYPE_LABEL: Record<string, string> = {
  clinic: "Klinika",
  diagnostics: "Diagnostika",
  pharmacy: "Dorixona",
  cosmetology: "Kosmetologiya",
  maternity: "Tug'ruqxona",
  bloodbank: "Qon banki",
  doctor: "Shifokor",
};

const TYPE_COLOR: Record<string, string> = {
  clinic: "#2F80ED",
  diagnostics: "#7B61FF",
  pharmacy: "#10B981",
  cosmetology: "#EC4899",
  maternity: "#F59E0B",
  bloodbank: "#EF4444",
  doctor: "#0EA5E9",
};

const DETAIL_PATH: Record<string, string> = {
  clinic: "/clinics",
  diagnostics: "/diagnostics",
  doctor: "/doctors",
};

export interface NearbyPlace {
  id: string;
  org_type: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
}

const makeIcon = (type: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${TYPE_COLOR[type] || "#2F80ED"};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(TYPE_LABEL[type] || "M").slice(0, 1)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const Recenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center[0], center[1]]);
  return null;
};

export function NearbyMap({ height = 360, radiusKm = 15 }: { height?: number; radiusKm?: number }) {
  const [center, setCenter] = useState<[number, number]>([41.3111, 69.2797]); // Tashkent default
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [hasLoc, setHasLoc] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastFetchAt = useRef(0);

  // Real-time joylashuv kuzatuvi
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const onPos = (p: GeolocationPosition) => {
      setCenter([p.coords.latitude, p.coords.longitude]);
      setHasLoc(true);
    };
    navigator.geolocation.getCurrentPosition(onPos, () => null, {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 10000,
    });
    const watchId = navigator.geolocation.watchPosition(onPos, () => null, {
      enableHighAccuracy: true,
      maximumAge: 20000,
      timeout: 20000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const key = `${center[0].toFixed(3)}|${center[1].toFixed(3)}`;

  useEffect(() => {
    let alive = true;
    const now = Date.now();
    if (now - lastFetchAt.current < 5000 && places.length > 0) return;
    lastFetchAt.current = now;
    (async () => {
      const { data, error } = await (supabase as any).rpc("get_nearby_medical_services", {
        _lat: center[0],
        _lng: center[1],
        _radius_km: radiusKm,
        _limit: 150,
      });
      if (!alive) return;
      if (error) console.error("nearby rpc", error);
      setPlaces(((data || []) as NearbyPlace[]).filter((p) => p.latitude && p.longitude));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [key, radiusKm]);

  // Yangi muassasa qo'shilsa jonli yangilanadi
  useEffect(() => {
    const channel = supabase
      .channel("nearby-orgs")
      .on("postgres_changes", { event: "*", schema: "public", table: "registered_clinics" }, () => {
        lastFetchAt.current = 0;
        setCenter((c) => [...c] as [number, number]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "registered_diagnostics" }, () => {
        lastFetchAt.current = 0;
        setCenter((c) => [...c] as [number, number]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => places.length, [places]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height }}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 flex items-center gap-2 text-white">
        <MapPin className="w-4 h-4" />
        <p className="text-sm font-bold">Sizga yaqin tibbiy xizmatlar</p>
        <span className="ml-auto text-xs opacity-80 flex items-center gap-1">
          {loading && <Loader2 className="w-3 h-3 animate-spin" />} {counts} ta
        </span>
      </div>
      <MapContainer center={center} zoom={hasLoc ? 14 : 12} style={{ height: height - 40, width: "100%" }} scrollWheelZoom={false}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter center={center} />
        {hasLoc && (
          <>
            <Marker position={center}>
              <Popup>Siz shu yerdasiz</Popup>
            </Marker>
            <Circle center={center} radius={500} pathOptions={{ color: "#2F80ED", fillOpacity: 0.05 }} />
          </>
        )}
        {places.map((p) => (
          <Marker key={`${p.org_type}-${p.id}`} position={[p.latitude, p.longitude]} icon={makeIcon(p.org_type)}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold">{p.name}</p>
                <p className="text-muted-foreground">{TYPE_LABEL[p.org_type] || p.org_type} • {p.distance_km.toFixed(1)} km</p>
                {p.address && <p className="text-muted-foreground">{p.address}</p>}
                {p.phone && <a href={`tel:${p.phone}`} className="text-primary underline block">{p.phone}</a>}
                {DETAIL_PATH[p.org_type] && (
                  <a href={`${DETAIL_PATH[p.org_type]}/${p.id}`} className="text-primary underline">Batafsil</a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
