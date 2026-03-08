import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, MapPin, Star, Clock, Phone, Brain, Building2, Stethoscope,
  AlertTriangle, ArrowRight, Loader2, Filter, SlidersHorizontal,
  Navigation, Activity, Pill, ChevronRight, Sparkles, History, X, Heart, Mic, MicOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  aiAnalysis: {
    searchType: string;
    keywords: string[];
    matchedSpecialties: string[];
    matchedServices: string[];
    possibleConditions: string[];
    recommendedSpecialist: string;
    urgencyLevel: string;
    searchSuggestions: string[];
    aiSummary: string;
  };
  clinics: any[];
  doctors: any[];
  diagnosticsServices: any[];
  clinicServices: any[];
  totalResults: number;
}

const SmartSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("med1_search_history") || "[]");
    setSearchHistory(history);
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Geolokatsiya ruxsat berilmadi")
      );
    }
  }, []);

  // Auto-search if query param exists
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  const saveToHistory = (q: string) => {
    const history = JSON.parse(localStorage.getItem("med1_search_history") || "[]") as string[];
    const updated = [q, ...history.filter((h) => h !== q)].slice(0, 10);
    localStorage.setItem("med1_search_history", JSON.stringify(updated));
    setSearchHistory(updated);
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q || q.length < 2) return;

    setIsSearching(true);
    setResult(null);
    setSearchParams({ q });
    saveToHistory(q);

    try {
      const { data, error } = await supabase.functions.invoke("ai-smart-search", {
        body: {
          query: q,
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Xatolik", description: data.error, variant: "destructive" });
        return;
      }

      setResult(data);
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Qidiruv amalga oshmadi", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("med1_search_history");
    setSearchHistory([]);
  };

  const urgencyBadge = (level: string) => {
    const config: Record<string, { color: string; label: string }> = {
      high: { color: "bg-destructive text-destructive-foreground", label: "⚠️ Shoshilinch" },
      medium: { color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400", label: "⚡ O'rtacha" },
      low: { color: "bg-primary/10 text-primary", label: "✅ Past" },
    };
    const c = config[level] || config.low;
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
  };

  const popularSearches = [
    "Bosh og'rig'i", "Tish og'rig'i", "Ko'z tekshiruvi", "MRT", "UZI",
    "Kardiolog", "Dermatolog", "Laboratoriya", "Stomatologiya", "Pediatr",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Search */}
      <section className="bg-hero-gradient py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground">
                AI Aqlli Qidiruv
              </h1>
            </div>
            <p className="text-primary-foreground/70 text-sm md:text-base">
              Simptom, xizmat yoki klinika nomini yozing — AI sizga eng mos natijalarni topadi
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Masalan: bosh og'rig'i, MRT, kardiolog..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm shadow-lg"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={isSearching || query.trim().length < 2}
                className="px-6 py-4 h-auto rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium shadow-lg"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Qidirish"}
              </Button>
            </div>

            {/* Location indicator */}
            {userLocation && (
              <div className="flex items-center gap-1 mt-3 text-primary-foreground/60 text-xs">
                <Navigation className="w-3 h-3" />
                <span>Geolokatsiya aniqlandi — yaqin klinikalar birinchi ko'rsatiladi</span>
              </div>
            )}

            {/* Popular searches */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {popularSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); handleSearch(s); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/30 transition-colors backdrop-blur-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {/* Search History */}
        {!result && !isSearching && searchHistory.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <History className="w-4 h-4" /> Oxirgi qidiruvlar
              </h3>
              <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">
                Tozalash
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(h); handleSearch(h); }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <History className="w-3 h-3" /> {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <Brain className="w-12 h-12 text-primary animate-pulse" />
              <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 animate-bounce" />
            </div>
            <p className="mt-4 text-muted-foreground text-sm">AI tahlil qilmoqda...</p>
          </div>
        )}

        {/* Results */}
        {result && !isSearching && (
          <div className="space-y-6">
            {/* AI Analysis Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-heading font-semibold text-foreground">AI Tahlil natijasi</h3>
                      {urgencyBadge(result.aiAnalysis.urgencyLevel)}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      {result.aiAnalysis.aiSummary}
                    </p>

                    {result.aiAnalysis.urgencyLevel === "high" && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">
                            Shoshilinch holat! Tez yordam: 103
                          </span>
                          <a href="tel:103" className="ml-auto">
                            <Button size="sm" variant="destructive" className="h-7 text-xs">
                              <Phone className="w-3 h-3 mr-1" /> 103 ga qo'ng'iroq
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {result.aiAnalysis.possibleConditions?.map((c: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Activity className="w-3 h-3 mr-1" /> {c}
                        </Badge>
                      ))}
                      {result.aiAnalysis.recommendedSpecialist && (
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                          <Stethoscope className="w-3 h-3 mr-1" /> {result.aiAnalysis.recommendedSpecialist}
                        </Badge>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground/60 mt-3 italic">
                      ⚠️ AI tahlili tibbiy maslahat o'rnini bosmaydi. Shifokorga murojaat qiling.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{result.totalResults}</span> ta natija topildi
              </p>
            </div>

            {/* Tabbed Results */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all" className="text-xs">
                  Barchasi ({result.totalResults})
                </TabsTrigger>
                <TabsTrigger value="clinics" className="text-xs">
                  <Building2 className="w-3 h-3 mr-1" /> Klinikalar ({result.clinics.length})
                </TabsTrigger>
                <TabsTrigger value="doctors" className="text-xs">
                  <Stethoscope className="w-3 h-3 mr-1" /> Shifokorlar ({result.doctors.length})
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs">
                  <Pill className="w-3 h-3 mr-1" /> Xizmatlar ({(result.diagnosticsServices?.length || 0) + (result.clinicServices?.length || 0)})
                </TabsTrigger>
              </TabsList>

              {/* All results */}
              <TabsContent value="all" className="space-y-4 mt-4">
                {result.clinics.length > 0 && (
                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> Klinikalar
                    </h3>
                    <div className="grid gap-3">
                      {result.clinics.slice(0, 5).map((clinic: any) => (
                        <ClinicCard key={clinic.id} clinic={clinic} />
                      ))}
                    </div>
                    {result.clinics.length > 5 && (
                      <Button variant="ghost" size="sm" className="mt-2 text-primary" onClick={() => setActiveTab("clinics")}>
                        Barchasini ko'rish ({result.clinics.length}) <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}

                {result.doctors.length > 0 && (
                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary" /> Shifokorlar
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {result.doctors.slice(0, 4).map((doc: any) => (
                        <DoctorCard key={doc.id} doctor={doc} />
                      ))}
                    </div>
                  </div>
                )}

                {(result.diagnosticsServices?.length > 0 || result.clinicServices?.length > 0) && (
                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-primary" /> Xizmatlar
                    </h3>
                    <div className="grid gap-2">
                      {[...(result.diagnosticsServices || []), ...(result.clinicServices || [])].slice(0, 5).map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                          </div>
                          {s.price > 0 && (
                            <span className="text-sm font-semibold text-primary">{Number(s.price).toLocaleString()} so'm</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.totalResults === 0 && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Natija topilmadi</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Boshqa so'z bilan qidirib ko'ring</p>
                  </div>
                )}
              </TabsContent>

              {/* Clinics tab */}
              <TabsContent value="clinics" className="space-y-3 mt-4">
                {result.clinics.map((clinic: any) => (
                  <ClinicCard key={clinic.id} clinic={clinic} />
                ))}
                {result.clinics.length === 0 && <EmptyState />}
              </TabsContent>

              {/* Doctors tab */}
              <TabsContent value="doctors" className="mt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {result.doctors.map((doc: any) => (
                    <DoctorCard key={doc.id} doctor={doc} />
                  ))}
                </div>
                {result.doctors.length === 0 && <EmptyState />}
              </TabsContent>

              {/* Services tab */}
              <TabsContent value="services" className="space-y-2 mt-4">
                {[...(result.diagnosticsServices || []), ...(result.clinicServices || [])].map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                      {s.description && <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{s.description}</p>}
                    </div>
                    {s.price > 0 && (
                      <span className="text-sm font-semibold text-primary whitespace-nowrap ml-3">{Number(s.price).toLocaleString()} so'm</span>
                    )}
                  </div>
                ))}
                {(result.diagnosticsServices?.length || 0) + (result.clinicServices?.length || 0) === 0 && <EmptyState />}
              </TabsContent>
            </Tabs>

            {/* AI Suggestions */}
            {result.aiAnalysis.searchSuggestions?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Qo'shimcha qidiruvlar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.aiAnalysis.searchSuggestions.map((s: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(s); handleSearch(s); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                    >
                      {s} <ArrowRight className="w-3 h-3 inline ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state - no search yet */}
        {!result && !isSearching && !initialQuery && (
          <div className="text-center py-16">
            <Brain className="w-16 h-16 text-primary/20 mx-auto mb-4" />
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              Nimani qidiryapsiz?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Simptomlaringiz, kerakli xizmat yoki mutaxassislik nomini yozing — AI sizga eng mos natijalarni topadi.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

// Clinic Card Component
const ClinicCard = ({ clinic }: { clinic: any }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {clinic.logo_url || clinic.logo_external_url ? (
            <img
              src={clinic.logo_url || clinic.logo_external_url}
              alt={clinic.name}
              className="w-10 h-10 rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Building2 className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground line-clamp-1">{clinic.name}</h4>
              {clinic.category && (
                <p className="text-xs text-muted-foreground">{clinic.category}</p>
              )}
            </div>
            {clinic.distance != null && (
              <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                <MapPin className="w-3 h-3 mr-1" /> {clinic.distance.toFixed(1)} km
              </Badge>
            )}
          </div>
          {clinic.address && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {clinic.address}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
                <Phone className="w-3 h-3" /> Qo'ng'iroq
              </a>
            )}
            <Link to={`/clinics/${clinic.id}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
              Batafsil <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Doctor Card Component
const DoctorCard = ({ doctor }: { doctor: any }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {doctor.photo_url ? (
            <img src={doctor.photo_url} alt={doctor.full_name} className="w-full h-full object-cover" />
          ) : (
            <Stethoscope className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground line-clamp-1">{doctor.full_name}</h4>
          <p className="text-xs text-primary">{doctor.specialty}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {doctor.experience_years > 0 && <span>{doctor.experience_years} yil tajriba</span>}
            {doctor.avg_rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {Number(doctor.avg_rating).toFixed(1)}
              </span>
            )}
          </div>
          {doctor.consultation_price > 0 && (
            <p className="text-xs font-semibold text-primary mt-1">
              {Number(doctor.consultation_price).toLocaleString()} so'm
            </p>
          )}
          <Link to={`/doctors/${doctor.id}`} className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
            Profil <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </CardContent>
  </Card>
);

const EmptyState = () => (
  <div className="text-center py-8">
    <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
    <p className="text-sm text-muted-foreground">Bu bo'limda natija topilmadi</p>
  </div>
);

export default SmartSearchPage;
