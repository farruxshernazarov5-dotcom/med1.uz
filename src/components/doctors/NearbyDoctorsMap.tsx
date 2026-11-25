import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Supercluster from "supercluster";
import "leaflet/dist/leaflet.css";
import "./doctorMap.css";
import { MapPin, LocateFixed, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDoctorLocation } from "@/hooks/useDoctorLocation";
import { loadDirectoryDoctors, hasCoordinates, sortByPatientDistance, type DirectoryDoctor, type DoctorFilters, type PatientLocation } from "@/lib/doctorDirectory";
import { doctorRegionBounds } from "@/lib/doctorRegionBounds";
import DoctorAvatar from "./DoctorAvatar";
import { doctorPhotoCandidates } from "@/lib/doctorPhotos";

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
const safeUrl = (u?: string | null) => u && /^https:\/\//i.test(u) ? u : null;
const icons = new Map<string, L.DivIcon>();
function doctorIcon(photo: string | null, name: string) {
  const key = `${name}|${photo}`;
  const cached = icons.get(key);
  if (cached) return cached;
  const candidates = doctorPhotoCandidates(name, photo);
  const fallback = candidates[1];
  const icon = L.divIcon({ className: "doctor-photo-marker", html: `<div class="doctor-photo-ring"><span aria-hidden="true">${esc(name.trim().slice(0, 1))}</span>${candidates[0] ? `<img src="${esc(candidates[0])}" alt="${esc(name)}" referrerpolicy="no-referrer" onerror="${fallback ? `this.onerror=function(){this.remove()};this.src='${esc(fallback)}'` : "this.remove()"}"/>` : ""}</div>`, iconSize: [44, 52], iconAnchor: [22, 52], popupAnchor: [0, -48] });
  icons.set(key, icon);
  return icon;
}
interface Props {
  specialty?: string; region?: string; height?: number; radiusKm?: number;
  filters?: DoctorFilters; patientLocation?: PatientLocation | null; onLocate?: () => void; locating?: boolean; focusLocation?: PatientLocation | null;
}
function MapFrame({ region, position, focus }: { region?: string; position: PatientLocation | null; focus?: PatientLocation | null }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (region) map.fitBounds(doctorRegionBounds(region), { padding: [16, 16], animate: false });
    else if (focus || position) { const center = focus ?? position; if (center) map.setView([center.latitude, center.longitude], 14, { animate: false }); }
    else map.fitBounds(doctorRegionBounds(), { padding: [16, 16], animate: false });
  }, [map, region, position, focus]);
  return null;
}
function DoctorMarkers({ doctors }: { doctors: DirectoryDoctor[] }) {
  const map = useMap();
  const [, refresh] = useState(0);
  const popupOpen = useRef(false);
  useMapEvents({
    popupopen: () => { popupOpen.current = true; },
    popupclose: () => { popupOpen.current = false; refresh(n => n + 1); },
    moveend: () => { if (!popupOpen.current) refresh(n => n + 1); },
    zoomend: () => { if (!popupOpen.current) refresh(n => n + 1); },
  });
  const index = useMemo(() => {
    const cluster = new Supercluster<{ doctorIndex: number }>({ radius: 55, maxZoom: 19 });
    cluster.load(doctors.filter(hasCoordinates).map((d, doctorIndex) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [Number(d.longitude), Number(d.latitude)] }, properties: { doctorIndex } })));
    return cluster;
  }, [doctors]);
  const located = useMemo(() => doctors.filter(hasCoordinates), [doctors]);
  const bounds = map.getBounds();
  const clusters = index.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], Math.floor(map.getZoom()));
  return <>{clusters.map(point => {
    const [longitude, latitude] = point.geometry.coordinates;
    const p = point.properties;
    if ("cluster" in p && p.cluster) {
      const icon = L.divIcon({ className: "doctor-cluster-marker", html: `<span>${p.point_count}</span>`, iconSize: [44, 44] });
      return <Marker key={`cluster-${p.cluster_id}`} position={[latitude, longitude]} icon={icon}>
        <Popup minWidth={210} maxWidth={260} maxHeight={240} autoPanPadding={[16, 16]}><div className="space-y-2">
          <Button size="sm" variant="outline" onClick={() => map.setView([latitude, longitude], Math.min(index.getClusterExpansionZoom(p.cluster_id), 19))}>Yaqinlashtirish</Button>
          {index.getLeaves(p.cluster_id, Infinity).map(leaf => {
            const d = located[leaf.properties.doctorIndex];
            return d ? <Link className="flex items-center gap-2 text-primary" key={d.id} to={`/doctors/ext/${d.slug}`}><DoctorAvatar name={d.name} photoUrl={d.photo_url} className="w-9 h-9" /><span className="min-w-0 break-words">{d.name}</span></Link> : null;
          })}
        </div></Popup>
      </Marker>;
    }
    const d = located[p.doctorIndex];
    if (!d || !hasCoordinates(d)) return null;
    const photo = safeUrl(d.photo_url);
    const gis = `https://2gis.uz/geo/${d.longitude},${d.latitude}`;
    const yandex = `https://yandex.uz/maps/?rtext=~${d.latitude},${d.longitude}&rtt=auto`;
    return <Marker key={d.id} position={[d.latitude, d.longitude]} icon={doctorIcon(photo, d.name)}>
              <Popup minWidth={210} maxWidth={260} autoPanPadding={[16, 16]} className="doctor-map-popup">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <DoctorAvatar name={d.name} photoUrl={photo} rounded="rounded-full" className="w-12 h-12 border-2 border-primary" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight text-foreground break-words">{d.name}</p>
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
                  {d.distance_km != null && <p className="text-primary font-semibold">Sizdan {d.distance_km.toFixed(1)} km · to‘g‘ri chiziq</p>}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <a href={gis} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-2 py-1.5 text-center font-semibold !text-foreground no-underline">🚗 2GIS</a>
                    <a href={yandex} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-2 py-1.5 text-center font-semibold !text-foreground no-underline">🚕 Yandeks</a>
                    <Link to={`/doctors/ext/${d.slug}`} className="col-span-2 rounded-lg bg-primary px-2 py-1.5 text-center font-semibold !text-primary-foreground no-underline">📅 Qabulga yozilish</Link>
                  </div>
                </div>
              </Popup>
    </Marker>;
  })}</>;
}
export default function NearbyDoctorsMap({ specialty, region, height = 380, filters, patientLocation, onLocate, locating, focusLocation }: Props) {
  const geo = useDoctorLocation(!onLocate);
  const position = onLocate ? patientLocation ?? null : geo.position;
  const [docs, setDocs] = useState<DirectoryDoctor[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [gpsView, setGpsView] = useState(false);
  useEffect(() => setGpsView(false), [region, focusLocation]);
  const filterKey = JSON.stringify({ ...filters, specialty: specialty ?? filters?.specialty, region: region ?? filters?.region });
  useEffect(() => {
    let active = true; setLoading(true); setError(false);
    void loadDirectoryDoctors(JSON.parse(filterKey)).then(data => {
      if (active) setDocs(data);
    }).catch(() => { if (active) { setDocs([]); setError(true); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filterKey, retry]);
  const ordered = useMemo(() => position ? sortByPatientDistance(docs, position) : docs, [docs, position]);
  const located = ordered.filter(hasCoordinates);
  return <div className="overflow-hidden rounded-lg border border-border bg-background">
    <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
      <MapPin className="h-4 w-4 text-primary shrink-0" />
      <p className="text-sm font-semibold min-w-0 break-words">{region || "O‘zbekiston shifokorlari"}</p>
      <span className="ml-auto text-xs text-muted-foreground shrink-0" role="status">{loading ? "Yuklanmoqda…" : `${located.length} ta`}</span>
      <Button size="icon" variant="ghost" title="Joylashuvim" aria-label="Joylashuvim" disabled={locating ?? geo.locating} onClick={() => { setGpsView(true); (onLocate ?? geo.request)(); }}><LocateFixed className="h-4 w-4" /></Button>
    </div>
    <MapContainer center={[41.3, 64.5]} zoom={5} maxZoom={19} zoomControl={false} style={{ height: height - 48, width: "100%" }} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap · geoBoundaries' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapFrame region={gpsView ? undefined : region} position={position} focus={gpsView ? null : focusLocation} />
      <ZoomControl position="bottomright" />
      {position && <Marker position={[position.latitude, position.longitude]} icon={L.divIcon({ className: "patient-map-marker", html: "<span></span>", iconSize: [18, 18] })}><Popup>Siz shu yerdasiz</Popup></Marker>}
      <DoctorMarkers doctors={ordered} />
    </MapContainer>
    {error && <div className="flex gap-2 items-center p-3 text-sm text-destructive" role="alert">Shifokorlar yuklanmadi.<Button variant="ghost" size="sm" onClick={() => setRetry(n => n + 1)}><RefreshCw className="h-4 w-4 mr-1" />Qayta urinish</Button></div>}
    {!loading && !error && docs.length === 0 && <p className="p-3 text-xs text-muted-foreground">Bu hudud va filtr bo‘yicha shifokor topilmadi.</p>}
    {!loading && !error && docs.length > located.length && <p className="p-3 text-xs text-muted-foreground">{docs.length - located.length} ta shifokorning aniq koordinatasi yo‘q; ular ro‘yxatda saqlanadi.</p>}
    {!onLocate && geo.error && <p role="alert" className="p-3 text-xs text-destructive">{geo.error}</p>}
  </div>;
}
