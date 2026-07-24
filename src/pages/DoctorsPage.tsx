import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Star, Stethoscope, Filter, X, Award, MapPin, Building2, Map as MapIcon } from "lucide-react";
import NearbyDoctorsMap from "@/components/doctors/NearbyDoctorsMap";

const SPECIALTIES = [
  "Гинеколог","Кардиолог","ЛОР (Отоларинголог)","УЗИ-специалист","Хирург",
  "Невропатолог","Стоматолог","Педиатр","Уролог","Эндокринолог","Офтальмолог",
  "Невролог","Ортопед","Гастроэнтеролог","Дерматолог","Лаборант","Реаниматолог",
  "Радиолог","Терапевт","Пульмонолог",
];
const REGIONS = [
  "г. Ташкент","Самаркандская область","Бухарская область","Ташкентская область",
  "Кашкадарьинская область","Андижанская область","Сырдарьинская область",
  "Наманганская область","Хорезмская область","Джизакская область",
  "Ферганская область","Каракалпакстан","Навоийская область","Сурхандарьинская область",
];
const PAGE_SIZE = 60;

interface Doctor {
  id: string; slug: string; name: string; rank: string | null;
  experience: number | null; photo_url: string | null;
  rating: number | null; reviews_count: number | null;
  primary_specialty: string | null; primary_region: string | null;
  clinic_id: string | null;
}

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("0");
  const [minExp, setMinExp] = useState<string>("0");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setPage(0); }, [search, specialty, region, minRating, minExp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("doctors_external")
        .select("id,slug,name,rank,experience,photo_url,rating,reviews_count,primary_specialty,primary_region,clinic_id", { count: "exact" })
        .order("rating", { ascending: false })
        .order("reviews_count", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (specialty !== "all") q = q.eq("primary_specialty", specialty);
      if (region !== "all") q = q.eq("primary_region", region);
      const r = parseFloat(minRating); if (r > 0) q = q.gte("rating", r);
      const e = parseInt(minExp, 10); if (e > 0) q = q.gte("experience", e);
      const s = search.trim();
      if (s.length >= 2) q = q.ilike("name", `%${s}%`);

      const { data, count } = await q;
      if (!cancelled) {
        setDoctors((data as Doctor[]) || []);
        setTotal(count || 0);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search, specialty, region, minRating, minExp, page]);

  const clearFilters = () => {
    setSearch(""); setSpecialty("all"); setRegion("all"); setMinRating("0"); setMinExp("0");
  };
  const filtersActive = specialty !== "all" || region !== "all" || minRating !== "0" || minExp !== "0" || search.length > 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Shifokorlar katalogi — 4800+ mutaxassis | Med1.uz"
        description="O'zbekiston bo'ylab tasdiqlangan shifokorlar. Mutaxassislik, region, reyting va tajriba bo'yicha filtrlab toping."
        path="/doctors"
      />
      <Header />

      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold">Shifokorlar</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Med1.uz — {total.toLocaleString()} ta mutaxassis, filtr va batafsil ma'lumot
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Shifokor ismi bo'yicha qidiring..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-card"
              />
              <Button
                variant="ghost" size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" /> Filtr
              </Button>
            </div>

            {showFilters && (
              <div className="mt-3 p-4 bg-card rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger><SelectValue placeholder="Mutaxassislik" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="all">Barcha mutaxassisliklar</SelectItem>
                    {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="all">Barcha regionlar</SelectItem>
                    {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger><SelectValue placeholder="Reyting" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Har qanday reyting</SelectItem>
                    <SelectItem value="3">3.0+ ★</SelectItem>
                    <SelectItem value="4">4.0+ ★</SelectItem>
                    <SelectItem value="4.5">4.5+ ★</SelectItem>
                    <SelectItem value="4.8">4.8+ ★</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={minExp} onValueChange={setMinExp}>
                  <SelectTrigger><SelectValue placeholder="Tajriba" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Har qanday tajriba</SelectItem>
                    <SelectItem value="3">3+ yil</SelectItem>
                    <SelectItem value="5">5+ yil</SelectItem>
                    <SelectItem value="10">10+ yil</SelectItem>
                    <SelectItem value="20">20+ yil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {loading ? "Yuklanmoqda..." : `${total.toLocaleString()} ta shifokor topildi`}
            </p>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" /> Filtrni tozalash
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-16">
              <Stethoscope className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-semibold">Shifokor topilmadi</p>
              <p className="text-muted-foreground mt-1">Filtrlarni o'zgartiring</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((d) => (
                  <Link
                    key={d.id}
                    to={`/doctors/ext/${d.slug}`}
                    className="group bg-card rounded-2xl border hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {d.photo_url ? (
                          <img
                            src={d.photo_url} alt={d.name} loading="lazy"
                            className="w-16 h-16 rounded-xl object-cover border-2"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                            <Stethoscope className="w-7 h-7 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-heading font-bold text-base group-hover:text-primary transition-colors line-clamp-2">
                            {d.name}
                          </h3>
                          <p className="text-sm text-primary font-medium mt-0.5">{d.primary_specialty}</p>
                          {d.rank && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Award className="w-3 h-3" /> {d.rank}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-3 mt-4 pt-3 border-t text-sm">
                        {d.rating != null && d.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold">{Number(d.rating).toFixed(1)}</span>
                            {d.reviews_count != null && d.reviews_count > 0 && (
                              <span className="text-xs text-muted-foreground">({d.reviews_count})</span>
                            )}
                          </div>
                        )}
                        {d.experience != null && d.experience > 0 && (
                          <span className="text-xs text-muted-foreground">{d.experience} yil tajriba</span>
                        )}
                      </div>

                      {d.primary_region && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{d.primary_region}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}>
                    ← Oldingi
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    {page + 1} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page + 1 >= totalPages}
                    onClick={() => setPage(p => p + 1)}>
                    Keyingi →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DoctorsPage;
