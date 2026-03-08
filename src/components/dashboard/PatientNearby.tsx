import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Navigation, Building2, Clock, Filter, Phone, Locate, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { clinics as localClinics } from "@/data/clinics";
import { externalClinics } from "@/data/clinicsExternal";

type ServiceType = "all" | "clinic" | "pharmacy" | "diagnostic" | "lab";

const serviceLabels: Record<ServiceType, string> = {
  all: "Hammasi",
  clinic: "Klinikalar",
  pharmacy: "Dorixonalar",
  diagnostic: "Diagnostika",
  lab: "Laboratoriya",
};

const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Merge all clinic sources into a unified shape
interface UnifiedClinic {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  category: string;
  specialties: string[];
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  working_hours: any;
  source: "registered" | "local" | "external";
  linkTo: string;
}

const PatientNearby = () => {
  const { user } = useAuth();
  const [registeredClinics, setRegisteredClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [filter, setFilter] = useState<ServiceType>("all");
  const [sortBy, setSortBy] = useState<"distance" | "name">("distance");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  useEffect(() => {
    supabase
      .from("registered_clinics")
      .select("id, name, address, phone, category, specialties, amenities, latitude, longitude, working_hours, logo_url")
      .eq("is_active", true)
      .then(({ data }) => {
        setRegisteredClinics(data || []);
        setLoading(false);
      });
  }, []);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setUserLocation({ lat: 41.2995, lng: 69.2401 });
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => { getLocation(); }, []);

  // Merge all sources
  const allClinics = useMemo<UnifiedClinic[]>(() => {
    const result: UnifiedClinic[] = [];

    // Registered clinics (from DB)
    registeredClinics.forEach((c) => {
      result.push({
        id: c.id,
        name: c.name,
        address: c.address || "",
        phone: c.phone,
        category: c.category || "klinika",
        specialties: c.specialties || [],
        latitude: c.latitude,
        longitude: c.longitude,
        logo_url: c.logo_url,
        working_hours: c.working_hours,
        source: "registered",
        linkTo: `/clinics/${c.id}`,
      });
    });

    // Local clinics (from data/clinics.ts)
    localClinics.forEach((c) => {
      result.push({
        id: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone?.[0] || null,
        category: c.type || "klinika",
        specialties: c.specialties || [],
        latitude: c.coordinates?.lat || null,
        longitude: c.coordinates?.lng || null,
        logo_url: c.logoUrl || null,
        working_hours: null,
        source: "local",
        linkTo: `/clinics/${c.id}`,
      });
    });

    // External clinics (from data/clinicsExternal.ts)
    externalClinics.forEach((c) => {
      result.push({
        id: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone?.[0] || null,
        category: c.type || "klinika",
        specialties: c.specialties || [],
        latitude: c.coordinates?.lat || null,
        longitude: c.coordinates?.lng || null,
        logo_url: c.logoUrl || null,
        working_hours: null,
        source: "external",
        linkTo: `/clinics/${c.id}`,
      });
    });

    // Deduplicate by name
    const seen = new Set<string>();
    return result.filter((c) => {
      const key = c.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [registeredClinics]);

  // Collect unique specialties
  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    allClinics.forEach((c) => c.specialties.forEach((s) => set.add(s)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "uz"));
  }, [allClinics]);

  const clinicsWithDistance = useMemo(() => {
    return allClinics
      .filter((c) => {
        if (filter === "all") return true;
        const cat = (c.category || "").toLowerCase();
        if (filter === "clinic") return cat.includes("klinika") || cat.includes("xususiy") || cat.includes("davlat") || !cat;
        if (filter === "pharmacy") return cat.includes("dorixona") || cat.includes("apteka");
        if (filter === "diagnostic") return cat.includes("diagnostika") || cat.includes("markaz");
        if (filter === "lab") return cat.includes("laboratoriya") || cat.includes("lab");
        return true;
      })
      .filter((c) => {
        if (!selectedSpecialty) return true;
        return c.specialties.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));
      })
      .map((c) => ({
        ...c,
        distance: userLocation && c.latitude && c.longitude
          ? calcDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude)
          : 999,
      }))
      .sort((a, b) => sortBy === "distance" ? a.distance - b.distance : a.name.localeCompare(b.name, "uz"));
  }, [allClinics, filter, selectedSpecialty, userLocation, sortBy]);

  const is24h = (wh: any) => {
    if (!wh) return false;
    const mon = wh.mon || wh.monday;
    return mon?.start === "00:00" && mon?.end === "23:59";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">📍 Yaqin atrofdagi xizmatlar</h2>
        <Button variant="outline" size="sm" onClick={getLocation} disabled={locating}>
          <Locate className="w-4 h-4 mr-1" /> {locating ? "Aniqlanmoqda..." : "Joylashuvni yangilash"}
        </Button>
      </div>

      {/* Map */}
      {userLocation && (
        <div className="rounded-2xl overflow-hidden border border-border mb-6 shadow-card">
          <iframe
            src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=klinikalar+dorixonalar&center=${userLocation.lat},${userLocation.lng}&zoom=13`}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(serviceLabels) as ServiceType[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {serviceLabels[key]}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setSortBy(sortBy === "distance" ? "name" : "distance")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:text-foreground"
          >
            <Filter className="w-3 h-3" /> {sortBy === "distance" ? "Masofa" : "Nomi"}
          </button>
        </div>
      </div>

      {/* Specialty filter */}
      {allSpecialties.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Yo'nalish bo'yicha filtrlash:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            <button
              onClick={() => setSelectedSpecialty("")}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                !selectedSpecialty ? "bg-tech-purple text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Hammasi
            </button>
            {allSpecialties.slice(0, 30).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSpecialty(s === selectedSpecialty ? "" : s)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  selectedSpecialty === s ? "bg-tech-purple text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {userLocation && clinicsWithDistance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Jami topildi", value: clinicsWithDistance.length + " ta", sub: "Faol muassasalar", icon: Building2 },
            { label: "Yaqin atrofda", value: clinicsWithDistance.filter((c) => c.distance < 5).length + " ta", sub: "5 km ichida", icon: Navigation },
            { label: "Eng yaqin", value: clinicsWithDistance[0]?.name?.slice(0, 18), sub: `${clinicsWithDistance[0]?.distance < 999 ? clinicsWithDistance[0]?.distance?.toFixed(1) + " km" : "—"}`, icon: MapPin },
            { label: "24/7 xizmatlar", value: clinicsWithDistance.filter((c) => is24h(c.working_hours)).length + " ta", sub: "Doimo ochiq", icon: Clock },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <s.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-lg font-bold text-foreground truncate">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Clinic list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
      ) : clinicsWithDistance.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Bu kategoriyada muassasalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clinicsWithDistance.slice(0, 30).map((c) => (
            <Link
              key={c.id + c.source}
              to={c.linkTo}
              className="block bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground truncate">{c.name}</span>
                    {is24h(c.working_hours) && (
                      <Badge className="bg-green-100 text-green-800 text-[10px]">24/7</Badge>
                    )}
                    {c.source === "registered" && (
                      <Badge className="bg-tech-purple/10 text-tech-purple text-[10px]">✓ Hamkor</Badge>
                    )}
                  </div>
                  {c.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" /> {c.address}
                    </p>
                  )}
                  {c.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.specialties.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                      ))}
                      {c.specialties.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{c.specialties.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {c.distance < 999 && (
                    <p className="text-sm font-bold text-primary">{c.distance.toFixed(1)} km</p>
                  )}
                  {c.phone && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-1">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
          {clinicsWithDistance.length > 30 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              va yana {clinicsWithDistance.length - 30} ta muassasa...
              <Link to="/clinics" className="text-primary ml-1 hover:underline">Barchasini ko'rish →</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientNearby;
