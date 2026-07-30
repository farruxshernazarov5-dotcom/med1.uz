import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Stethoscope, Filter, X, Map as MapIcon, Sparkles, Heart, Building2 } from "lucide-react";
import NearbyDoctorsMap from "@/components/doctors/NearbyDoctorsMap";
import DoctorCard, { DoctorCardData } from "@/components/doctors/DoctorCard";
import CuratedSections from "@/components/doctors/CuratedSections";
import CompareBar from "@/components/doctors/CompareBar";
import AiDoctorFinder from "@/components/doctors/AiDoctorFinder";
import { useDoctorFavorites } from "@/hooks/useDoctorFavorites";

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
const LANGUAGES = ["Ўзбек","Русский","English","Тоҷикӣ","Türkçe","العربية"];
const PAGE_SIZE = 24;
const SELECT = "id,slug,name,rank,experience,photo_url,rating,reviews_count,primary_specialty,primary_region,clinic_id,languages";

const DoctorsPage = () => {
  const [params, setParams] = useSearchParams();
  const clinicIdParam = params.get("clinic") || "";
  const clinicNameParam = params.get("clinic_name") || "";
  const initialSpecialty = params.get("specialty") || "all";
  const initialQ = params.get("q") || "";

  const [doctors, setDoctors] = useState<DoctorCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);
  const [serviceQuery, setServiceQuery] = useState(params.get("service") || "");
  const [specialty, setSpecialty] = useState<string>(initialSpecialty);
  const [region, setRegion] = useState<string>(params.get("region") || "all");
  const [language, setLanguage] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("0");
  const [minExp, setMinExp] = useState<string>("0");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [clinicName, setClinicName] = useState<string>("");
  const [aiFinderOpen, setAiFinderOpen] = useState(false);

  const fav = useDoctorFavorites();

  const filtersActive =
    specialty !== "all" || region !== "all" || language !== "all" ||
    minRating !== "0" || minExp !== "0" ||
    debouncedSearch.length > 0 || serviceQuery.length > 0 || !!clinicIdParam || onlyFavs;

  const isBrowsing = filtersActive; // show list only when user searches/filters

  // Debounce free-text search so each keystroke does not trigger a count query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [debouncedSearch, specialty, region, language, minRating, minExp, serviceQuery, sortBy, clinicIdParam, onlyFavs]);

  useEffect(() => {
    if (!clinicIdParam) { setClinicName(""); return; }
    (async () => {
      const { data } = await supabase.from("registered_clinics")
        .select("name").eq("id", clinicIdParam).maybeSingle();
      setClinicName(data?.name || "");
    })();
  }, [clinicIdParam]);

  useEffect(() => {
    if (!isBrowsing) { setDoctors([]); setTotal(0); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("doctors_external")
        .select(SELECT, { count: "exact" })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (sortBy === "experience")   q = q.order("experience", { ascending: false, nullsFirst: false });
      else if (sortBy === "reviews") q = q.order("reviews_count", { ascending: false, nullsFirst: false });
      else if (sortBy === "name")    q = q.order("name", { ascending: true });
      else q = q.order("rating", { ascending: false, nullsFirst: false }).order("reviews_count", { ascending: false, nullsFirst: false });

      if (clinicIdParam) q = q.eq("clinic_id", clinicIdParam);
      if (specialty !== "all") q = q.eq("primary_specialty", specialty);
      if (region !== "all") q = q.eq("primary_region", region);
      if (language !== "all") q = q.contains("languages", [language]);
      if (onlyFavs) {
        if (fav.ids.length === 0) { setDoctors([]); setTotal(0); setLoading(false); return; }
        q = q.in("id", fav.ids);
      }
      const r = parseFloat(minRating); if (r > 0) q = q.gte("rating", r);
      const e = parseInt(minExp, 10); if (e > 0) q = q.gte("experience", e);
      const s = debouncedSearch.trim();
      if (s.length >= 2) q = q.ilike("name", `%${s}%`);
      const sv = serviceQuery.trim();
      if (sv.length >= 2) q = q.contains("services", [sv]);

      const { data, count } = await q;
      if (!cancelled) {
        setDoctors((data as DoctorCardData[]) || []);
        setTotal(count || 0);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isBrowsing, debouncedSearch, specialty, region, language, minRating, minExp, serviceQuery, sortBy, clinicIdParam, page, onlyFavs, fav.ids]);

  const clearFilters = () => {
    setSearch(""); setSpecialty("all"); setRegion("all"); setLanguage("all");
    setMinRating("0"); setMinExp("0"); setServiceQuery(""); setOnlyFavs(false);
    if (clinicIdParam) { params.delete("clinic"); params.delete("clinic_name"); setParams(params); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Shifokorlar — 4800+ mutaxassisni AI yordamida toping | Med1.uz"
        description="O'zbekistondagi eng yaxshi shifokorlar. Mutaxassislik, tajriba, reyting, hudud va til bo'yicha AI yordamida toping. Onlayn qabulga yozilish."
        path="/doctors"
      />
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-10 md:py-16">
        <div className="absolute inset-0 bg-grid-tech opacity-30 pointer-events-none" />
        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold">Shifokorni toping</h1>
            <p className="text-muted-foreground mt-3 text-base max-w-2xl mx-auto">
              4800+ tasdiqlangan mutaxassis. AI yordamida o'zingizga eng mos shifokorni tanlang, taqqoslang va onlayn qabulga yoziling.
            </p>

            {(clinicName || clinicNameParam) && (
              <div className="mt-4 inline-flex items-center gap-2 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Building2 className="w-3.5 h-3.5" />
                Klinika: <b>{clinicName || clinicNameParam}</b>
                <button onClick={() => { params.delete("clinic"); params.delete("clinic_name"); setParams(params); }}
                  className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Shifokor ismi, mutaxassislik yoki xizmat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-2 h-14 rounded-2xl bg-card shadow-md text-base"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button variant={showMap ? "default" : "ghost"} size="sm" onClick={() => setShowMap(!showMap)} className="hidden sm:flex">
                  <MapIcon className="w-4 h-4 mr-1" /> Xarita
                </Button>
                <Button variant={showFilters ? "default" : "ghost"} size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4 mr-1" /> Filtr
                </Button>
              </div>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <button onClick={() => setAiFinderOpen(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-hero-gradient text-primary-foreground hover:opacity-90 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3" /> AI menga mos shifokorni topsin
              </button>
              <button onClick={() => setOnlyFavs(v => !v)}
                className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-colors ${onlyFavs ? "bg-red-50 text-red-600 border-red-200" : "bg-card hover:bg-accent"}`}>
                <Heart className={`w-3 h-3 ${onlyFavs ? "fill-current" : ""}`} /> Sevimlilar ({fav.ids.length})
              </button>
              {["Кардиолог","Педиатр","Стоматолог","Гинеколог","Невролог"].map(s => (
                <button key={s} onClick={() => setSpecialty(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${specialty === s ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}>
                  {s}
                </button>
              ))}
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-card rounded-2xl border shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger><SelectValue placeholder="Mutaxassislik" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="all">Barcha mutaxassisliklar</SelectItem>
                    {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger><SelectValue placeholder="Hudud" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="all">Barcha hududlar</SelectItem>
                    {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue placeholder="Til" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Har qanday til</SelectItem>
                    {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
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
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue placeholder="Saralash" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Reyting bo'yicha</SelectItem>
                    <SelectItem value="experience">Tajriba bo'yicha</SelectItem>
                    <SelectItem value="reviews">Sharhlar soni</SelectItem>
                    <SelectItem value="name">Alifbo tartibida</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Xizmat (EKG, UZI, MRT...)"
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                  className="md:col-span-2"
                />
                {filtersActive && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" /> Tozalash
                  </Button>
                )}
              </div>
            )}

            {showMap && (
              <div className="mt-4 rounded-2xl overflow-hidden border shadow-lg">
                <NearbyDoctorsMap specialty={specialty !== "all" ? specialty : undefined} height={420} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          {isBrowsing ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  {loading ? "Yuklanmoqda..." : `${total.toLocaleString()} ta shifokor topildi`}
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" /> Filtrni tozalash
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-16">
                  <Stethoscope className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Shifokor topilmadi</p>
                  <p className="text-muted-foreground mt-1">Filtrlarni o'zgartirib qayta urinib ko'ring</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
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
            </>
          ) : (
            <CuratedSections />
          )}
        </div>
      </section>

      <CompareBar />
      <AiDoctorFinder open={aiFinderOpen} onOpenChange={setAiFinderOpen} defaultRegion={region !== "all" ? region : undefined} />
      <Footer />
    </div>
  );
};

export default DoctorsPage;
