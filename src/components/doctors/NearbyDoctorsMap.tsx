import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const docIcon = L.divIcon({
  className: "",
  html: `<div style="background:linear-gradient(135deg,#2F80ED,#7B61FF);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">D</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

interface DocPoint {
  id: string; slug: string; name: string;
  latitude: number; longitude: number;
  primary_specialty?: string | null; rating?: number | null;
}

interface Props {
  specialty?: string;
  height?: number;
  radiusKm?: number;
}

/** Uses geolocation (or Tashkent fallback) + doctor lat/lng, else clinic lat/lng. */
export default function NearbyDoctorsMap({ specialty, height = 380, radiusKm = 10 }: Props) {
  const [center, setCenter] = useState<[number, number]>([41.3111, 69.2797]);
  const [docs, setDocs] = useState<DocPoint[]>([]);
  const [hasLoc, setHasLoc] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => { setCenter([p.coords.latitude, p.coords.longitude]); setHasLoc(true); },
      () => null,
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    (async () => {
      const latDelta = (radiusKm * 1000) / 111000;
      const lonDelta = (radiusKm * 1000) / (111000 * Math.cos((center[0] * Math.PI) / 180));

      // 1) Doctors with own coordinates
      let q = supabase
        .from("doctors_external")
        .select("id,slug,name,latitude,longitude,primary_specialty,rating")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .gte("latitude", center[0] - latDelta).lte("latitude", center[0] + latDelta)
        .gte("longitude", center[1] - lonDelta).lte("longitude", center[1] + lonDelta)
        .limit(40);
      if (specialty) q = q.eq("primary_specialty", specialty);
      const { data: own } = await q;

      // 2) Doctors linked to clinics with coordinates (fallback)
      let cq = supabase
        .from("registered_clinics")
        .select("id, latitude, longitude")
        .eq("is_active", true)
        .not("latitude", "is", null).not("longitude", "is", null)
        .gte("latitude", center[0] - latDelta).lte("latitude", center[0] + latDelta)
        .gte("longitude", center[1] - lonDelta).lte("longitude", center[1] + lonDelta)
        .limit(60);
      const { data: clinics } = await cq;
      let linked: DocPoint[] = [];
      if (clinics && clinics.length) {
        let dq = supabase
          .from("doctors_external")
          .select("id,slug,name,primary_specialty,rating,clinic_id")
          .in("clinic_id", clinics.map(c => c.id))
          .limit(40);
        if (specialty) dq = dq.eq("primary_specialty", specialty);
        const { data: linkedDocs } = await dq;
        const cmap = new Map(clinics.map(c => [c.id, c]));
        linked = (linkedDocs || []).map(d => {
          const c: any = cmap.get((d as any).clinic_id);
          return c ? {
            id: d.id, slug: d.slug, name: d.name,
            latitude: c.latitude, longitude: c.longitude,
            primary_specialty: (d as any).primary_specialty,
            rating: (d as any).rating,
          } : null;
        }).filter(Boolean) as DocPoint[];
      }

      const merged = [...((own as any as DocPoint[]) || []), ...linked]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .slice(0, 60);
      setDocs(merged);
    })();
  }, [center, specialty, radiusKm]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height }}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 flex items-center gap-2 text-white">
        <MapPin className="w-4 h-4" />
        <p className="text-sm font-bold">Sizga yaqin shifokorlar {specialty ? `— ${specialty}` : ""}</p>
        <span className="ml-auto text-xs opacity-80">{docs.length} ta</span>
      </div>
      <MapContainer center={center} zoom={hasLoc ? 13 : 11} style={{ height: height - 40, width: "100%" }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {hasLoc && (
          <>
            <Marker position={center}><Popup>Siz shu yerdasiz</Popup></Marker>
            <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "#2F80ED", fillOpacity: 0.04 }} />
          </>
        )}
        {docs.map(d => (
          <Marker key={d.id} position={[d.latitude, d.longitude]} icon={docIcon}>
            <Popup>
              <div className="text-xs" style={{ minWidth: 160 }}>
                <p className="font-bold flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {d.name}</p>
                {d.primary_specialty && <p className="text-muted-foreground">{d.primary_specialty}</p>}
                {d.rating != null && d.rating > 0 && <p>★ {Number(d.rating).toFixed(1)}</p>}
                <Link to={`/doctors/ext/${d.slug}`} className="text-primary underline">Profil →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {docs.length === 0 && (
        <div className="p-3 text-xs text-muted-foreground text-center">
          Bu radiusda koordinatali shifokorlar topilmadi — filtrni kengaytiring yoki boshqa mutaxassislik tanlang.
        </div>
      )}
    </div>
  );
}
