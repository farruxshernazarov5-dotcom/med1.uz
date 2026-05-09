import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

// Fix default icon paths (leaflet bundling issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const promoIcon = L.divIcon({
  className: "",
  html: `<div style="background:linear-gradient(135deg,#7B61FF,#2F80ED);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">%</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

interface Clinic { id: string; name: string; latitude: number; longitude: number; address?: string; category?: string; distance_m?: number; }

export function NearbyMap({ height = 360 }: { height?: number }) {
  const [center, setCenter] = useState<[number, number]>([41.3111, 69.2797]); // Tashkent default
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [hasLoc, setHasLoc] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((p) => {
      setCenter([p.coords.latitude, p.coords.longitude]);
      setHasLoc(true);
    }, () => null, { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 });
  }, []);

  useEffect(() => {
    (async () => {
      const latDelta = 5000 / 111000;
      const lonDelta = 5000 / (111000 * Math.cos((center[0] * Math.PI) / 180));
      const { data } = await supabase
        .from("registered_clinics")
        .select("id, name, latitude, longitude, address, category")
        .eq("is_active", true)
        .gte("latitude", center[0] - latDelta).lte("latitude", center[0] + latDelta)
        .gte("longitude", center[1] - lonDelta).lte("longitude", center[1] + lonDelta)
        .limit(50);
      setClinics(((data || []) as Clinic[]).filter(c => c.latitude && c.longitude));
    })();
  }, [center]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height }}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 flex items-center gap-2 text-white">
        <MapPin className="w-4 h-4" />
        <p className="text-sm font-bold">Sizga yaqin tibbiy markazlar</p>
        <span className="ml-auto text-xs opacity-80">{clinics.length} ta</span>
      </div>
      <MapContainer center={center} zoom={hasLoc ? 14 : 12} style={{ height: height - 40, width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasLoc && (
          <>
            <Marker position={center}><Popup>Siz shu yerdasiz</Popup></Marker>
            <Circle center={center} radius={500} pathOptions={{ color: "#2F80ED", fillOpacity: 0.05 }} />
          </>
        )}
        {clinics.map(c => (
          <Marker key={c.id} position={[c.latitude, c.longitude]} icon={promoIcon}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold">{c.name}</p>
                {c.category && <p className="text-muted-foreground">{c.category}</p>}
                {c.address && <p className="text-muted-foreground">{c.address}</p>}
                <a href={`/clinic/${c.id}`} className="text-primary underline">Ko'rish</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
