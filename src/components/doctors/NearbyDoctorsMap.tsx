import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const safeUrl = (u?: string | null) => (u && /^https:\/\//i.test(u) ? u : null);
const STETHO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg>`;

const iconCache = new Map<string, L.DivIcon>();
function doctorIcon(photo: string | null, name: string) {
  const key = photo || "none";
  const hit = iconCache.get(key);
  if (hit) return hit;
  const inner = photo
    ? `<img src="${esc(photo)}" alt="${esc(name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.remove()"/>`
    : STETHO;
  const icon = L.divIcon({
    className: "",
    html: `<div style="width:44px;height:44px;border-radius:50%;padding:2px;background:linear-gradient(135deg,#2F80ED,#7B61FF);box-shadow:0 4px 12px rgba(10,37,64,.35)"><div style="width:100%;height:100%;border-radius:50%;border:2px solid #fff;overflow:hidden;background:linear-gradient(135deg,#2F80ED,#7B61FF);display:flex;align-items:center;justify-content:center">${inner}</div></div><div style="width:0;height:0;margin:-2px auto 0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #7B61FF"></div>`,
    iconSize: [44, 52], iconAnchor: [22, 52], popupAnchor: [0, -50],
  });
  iconCache.set(key, icon);
  return icon;
}

interface DocPoint {
  id: string; slug: string; name: string;
  latitude: number; longitude: number;
  primary_specialty?: string | null; rating?: number | null;
  photo_url?: string | null; experience?: number | null; reviews_count?: number | null;
  clinic_name?: string | null; clinic_address?: string | null;
}

interface Props { specialty?: string; height?: number; radiusKm?: number; }

const DOC_COLS = "id,slug,name,primary_specialty,rating,photo_url,experience,reviews_count,clinic_id";

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

      let q = supabase.from("doctors_external").select(`${DOC_COLS},latitude,longitude`)
        .not("latitude", "is", null).not("longitude", "is", null)
        .gte("latitude", center[0] - latDelta).lte("latitude", center[0] + latDelta)
        .gte("longitude", center[1] - lonDelta).lte("longitude", center[1] + lonDelta)
        .limit(40);
      if (specialty) q = q.eq("primary_specialty", specialty);
      const { data: own } = await q;

      const { data: clinics } = await supabase.from("registered_clinics")
        .select("id,name,address,latitude,longitude").eq("is_active", true)
        .not("latitude", "is", null).not("longitude", "is", null)
        .gte("latitude", center[0] - latDelta).lte("latitude", center[0] + latDelta)
        .gte("longitude", center[1] - lonDelta).lte("longitude", center[1] + lonDelta)
        .limit(60);
      const cmap = new Map<string, any>((clinics || []).map((c: any) => [c.id, c]));

      let linked: DocPoint[] = [];
      if (cmap.size) {
        let dq = supabase.from("doctors_external").select(DOC_COLS).in("clinic_id", [...cmap.keys()]).limit(40);
        if (specialty) dq = dq.eq("primary_specialty", specialty);
        const { data: linkedDocs } = await dq;
        linked = (linkedDocs || []).map((d: any) => {
          const c = cmap.get(d.clinic_id);
          return c ? { ...d, latitude: c.latitude, longitude: c.longitude } : null;
        }).filter(Boolean) as DocPoint[];
      }

      // Clinic names for doctors with their own coordinates
      const ownList = ((own as any[]) || []);
      const missing = ownList.map((d) => d.clinic_id).filter((id) => id && !cmap.has(id));
      if (missing.length) {
        const { data: extra } = await supabase.from("registered_clinics").select("id,name,address").in("id", [...new Set(missing)]);
        (extra || []).forEach((c: any) => cmap.set(c.id, c));
      }

      const merged = [...ownList, ...linked]
        .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
        .slice(0, 60)
        .map((d: any) => {
          const c = d.clinic_id ? cmap.get(d.clinic_id) : null;
          return { ...d, clinic_name: c?.name ?? null, clinic_address: c?.address ?? null } as DocPoint;
        });
      setDocs(merged);
    })();
  }, [center, specialty, radiusKm]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height }}>
      <div className="bg-gradient-to-r from-primary to-accent px-4 py-2 flex items-center gap-2 text-primary-foreground">
        <MapPin className="w-4 h-4" />
        <p className="text-sm font-bold truncate">Sizga yaqin shifokorlar {specialty ? `— ${specialty}` : ""}</p>
        <span className="ml-auto text-xs opacity-80 shrink-0">{docs.length} ta</span>
      </div>
      <MapContainer center={center} zoom={hasLoc ? 13 : 11} zoomControl={false} style={{ height: height - 40, width: "100%" }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        {hasLoc && (
          <>
            <Marker position={center}><Popup>Siz shu yerdasiz</Popup></Marker>
            <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "#2F80ED", fillOpacity: 0.04 }} />
          </>
        )}
        {docs.map((d) => {
          const photo = safeUrl(d.photo_url);
          const gis = `https://2gis.uz/geo/${d.longitude},${d.latitude}`;
          const yandex = `https://yandex.uz/maps/?rtext=~${d.latitude},${d.longitude}&rtt=auto`;
          return (
            <Marker key={d.id} position={[d.latitude, d.longitude]} icon={doctorIcon(photo, d.name)}>
              <Popup minWidth={240} maxWidth={280}>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {photo ? (
                      <img src={photo} alt={d.name} loading="lazy" className="w-12 h-12 rounded-full object-cover border-2 border-primary shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight text-foreground">{d.name}</p>
                      {d.primary_specialty && <p className="text-primary font-medium">{d.primary_specialty}</p>}
                      {d.experience ? <p className="text-muted-foreground">{d.experience} yillik tajriba</p> : null}
                    </div>
                  </div>
                  {d.rating != null && Number(d.rating) > 0 && (
                    <p className="font-semibold text-foreground">★ {Number(d.rating).toFixed(1)}{d.reviews_count ? <span className="text-muted-foreground font-normal"> ({d.reviews_count} ta sharh)</span> : null}</p>
                  )}
                  {(d.clinic_name || d.clinic_address) && (
                    <p className="text-muted-foreground leading-snug">🏥 {d.clinic_name}{d.clinic_address ? `, ${d.clinic_address}` : ""}</p>
                  )}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <a href={gis} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-2 py-1.5 text-center font-semibold !text-foreground no-underline">🚗 2GIS</a>
                    <a href={yandex} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-2 py-1.5 text-center font-semibold !text-foreground no-underline">🚕 Yandeks</a>
                    <Link to={`/doctors/ext/${d.slug}`} className="col-span-2 rounded-lg bg-primary px-2 py-1.5 text-center font-semibold !text-primary-foreground no-underline">📅 Qabulga yozilish</Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {docs.length === 0 && (
        <div className="p-3 text-xs text-muted-foreground text-center">
          Bu radiusda koordinatali shifokorlar topilmadi — filtrni kengaytiring yoki boshqa mutaxassislik tanlang.
        </div>
      )}
    </div>
  );
}
