import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Star, MapPin, Clock, Stethoscope, Filter, X,
  ChevronDown, Phone, Globe, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

const SPECIALTIES = [
  "Kardiolog", "Stomatolog", "Pediatr", "Nevrolog", "Ortoped",
  "Ginekolog", "Urolog", "Oftalmolog", "LOR", "Dermatolog",
  "Endokrinolog", "Gastroenterolog", "Pulmonolog", "Onkolog",
  "Travmatolog", "Jarroh", "Terapevt", "Mammolog", "Psixiatr",
  "Allergolog", "Proktolog", "Revmatolog",
];

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from("doctors")
        .select("*, registered_clinics(name, address)")
        .eq("is_active", true)
        .order("avg_rating", { ascending: false });
      setDoctors(data || []);
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchSearch =
        !search ||
        d.full_name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase());
      const matchSpec = !selectedSpec || d.specialty === selectedSpec;
      const matchOnline = !onlineOnly || d.online_consultation;
      return matchSearch && matchSpec && matchOnline;
    });
  }, [doctors, search, selectedSpec, onlineOnly]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              Shifokorlar
            </h1>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              O'zbekistonning eng yaxshi mutaxassislarini toping va qabulga yoziling
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Shifokor ismi yoki mutaxassisligini qidiring..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl text-base bg-card border-border shadow-card"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtr
              </Button>
            </div>

            {showFilters && (
              <div className="mt-3 p-4 bg-card rounded-xl border border-border shadow-card space-y-3 animate-fade-in">
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Mutaxassislik</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant={!selectedSpec ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedSpec("")}
                    >
                      Barchasi
                    </Badge>
                    {SPECIALTIES.map((s) => (
                      <Badge
                        key={s}
                        variant={selectedSpec === s ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setSelectedSpec(selectedSpec === s ? "" : s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlineOnly}
                    onChange={(e) => setOnlineOnly(e.target.checked)}
                    className="rounded"
                  />
                  Onlayn konsultatsiya mavjud
                </label>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {loading ? "Yuklanmoqda..." : `${filtered.length} ta shifokor topildi`}
            </p>
            {(selectedSpec || onlineOnly) && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedSpec(""); setOnlineOnly(false); }}>
                <X className="w-3 h-3 mr-1" /> Filtrni tozalash
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Stethoscope className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground">Shifokor topilmadi</p>
              <p className="text-muted-foreground mt-1">Qidiruv so'zini o'zgartiring yoki filtrni tozalang</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((doc, idx) => (
                <Link
                  key={doc.id}
                  to={`/doctors/${doc.id}`}
                  className="group bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 overflow-hidden opacity-0 animate-fade-up"
                  style={{ animationDelay: `${Math.min(idx * 50, 300)}ms`, animationFillMode: "forwards" }}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {doc.photo_url ? (
                        <img
                          src={doc.photo_url}
                          alt={doc.full_name}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-border group-hover:border-primary/30 transition-colors"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-7 h-7 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {doc.full_name}
                        </h3>
                        <p className="text-sm text-primary font-medium">{doc.specialty}</p>
                        {doc.experience_years > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {doc.experience_years} yil tajriba
                          </p>
                        )}
                      </div>
                    </div>

                    {doc.bio && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{doc.bio}</p>
                    )}

                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
                      {doc.avg_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold text-foreground">
                            {Number(doc.avg_rating).toFixed(1)}
                          </span>
                          {doc.review_count > 0 && (
                            <span className="text-xs text-muted-foreground">({doc.review_count})</span>
                          )}
                        </div>
                      )}

                      {doc.consultation_price > 0 && (
                        <span className="text-sm font-bold text-primary ml-auto">
                          {Number(doc.consultation_price).toLocaleString()} so'm
                        </span>
                      )}
                    </div>

                    {/* Clinic info */}
                    {doc.registered_clinics && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{doc.registered_clinics.name}</span>
                      </div>
                    )}

                    {doc.online_consultation && (
                      <Badge className="mt-2 text-[10px] bg-medical-green/10 text-medical-green border-medical-green/20">
                        <Globe className="w-3 h-3 mr-1" /> Onlayn konsultatsiya
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DoctorsPage;
