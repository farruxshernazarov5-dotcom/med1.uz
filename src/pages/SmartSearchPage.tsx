import { useState, useEffect, useCallback, useMemo } from "react";
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
  Navigation, Activity, Pill, ChevronRight, Sparkles, History, X, Heart, Mic, MicOff,
  BookOpen, HeartPulse, FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { externalClinics } from "@/data/clinicsExternal";
import { clinics as localClinics } from "@/data/clinics";
import { diseaseCategories } from "@/data/diseases";
import { articleCategories, type Article } from "@/data/articles";
import { newArticles } from "@/data/new_articles/allArticles";
import allTerms from "@/data/medicalTerms";

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
  // Local data
  localClinics: any[];
  localArticles: any[];
  localDiseases: any[];
  localTerms: any[];
}

// Local search helper
function searchLocal(query: string, aiKeywords: string[] = [], aiSpecialties: string[] = []) {
  const q = query.toLowerCase();
  const allSearchTerms = [q, ...aiKeywords.map(k => k.toLowerCase()), ...aiSpecialties.map(s => s.toLowerCase())];

  const matchesAny = (text: string) => {
    const t = text.toLowerCase();
    return allSearchTerms.some(term => t.includes(term));
  };

  // Search clinics (external + local)
  const allLocalClinics = [...externalClinics, ...localClinics];
  const matchedClinics = allLocalClinics.filter(c =>
    matchesAny(c.name) ||
    matchesAny(c.description || "") ||
    c.specialties?.some((s: string) => matchesAny(s)) ||
    c.directionTags?.some((t: string) => matchesAny(t)) ||
    matchesAny(c.address || "") ||
    matchesAny(c.region || "") ||
    matchesAny(c.city || "")
  ).slice(0, 30);

  // Search diseases
  const matchedDiseases: { category: string; categoryId: string; name: string; slug: string; desc: string }[] = [];
  for (const cat of diseaseCategories) {
    for (const d of cat.diseases) {
      if (matchesAny(d.name) || matchesAny(d.desc) || matchesAny(d.fullDesc || "") || matchesAny(cat.title)) {
        matchedDiseases.push({
          category: cat.title,
          categoryId: cat.id,
          name: d.name,
          slug: d.slug,
          desc: d.desc,
        });
      }
    }
  }

  // Search articles
  const allArticles: Article[] = [
    ...articleCategories.map(c => c.article),
    ...newArticles,
  ];
  const matchedArticles = allArticles.filter(a =>
    matchesAny(a.title) ||
    matchesAny(a.summary || "") ||
    matchesAny(a.category || "")
  ).slice(0, 20);

  // Search medical terms
  const matchedTerms = allTerms.filter(t =>
    matchesAny(t.term) ||
    matchesAny(t.shortDesc || "") ||
    matchesAny(t.fullDesc || "") ||
    matchesAny(t.category || "")
  ).slice(0, 20);

  return {
    localClinics: matchedClinics,
    localDiseases: matchedDiseases.slice(0, 20),
    localArticles: matchedArticles,
    localTerms: matchedTerms,
  };
}

const SmartSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Xatolik", description: "Brauzeringiz ovozli qidiruvni qo'llab-quvvatlamaydi.", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "uz-UZ";
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Xatolik", description: "Ovoz aniqlanmadi. Qaytadan urinib ko'ring.", variant: "destructive" });
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (event.results[0].isFinal) handleSearch(transcript);
    };
    recognition.start();
  }, [toast]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("med1_search_history") || "[]");
    setSearchHistory(history);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery);
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
      // Run AI analysis + DB search and local search in parallel
      const [aiResult] = await Promise.allSettled([
        supabase.functions.invoke("ai-smart-search", {
          body: { query: q, latitude: userLocation?.lat, longitude: userLocation?.lng },
        }),
      ]);

      let aiData: any = null;
      if (aiResult.status === "fulfilled" && aiResult.value.data && !aiResult.value.data.error) {
        aiData = aiResult.value.data;
      }

      // Default AI analysis if edge function failed
      const aiAnalysis = aiData?.aiAnalysis || {
        searchType: "clinic",
        keywords: [q],
        matchedSpecialties: [],
        matchedServices: [],
        possibleConditions: [],
        recommendedSpecialist: "",
        urgencyLevel: "low",
        searchSuggestions: [],
        aiSummary: `"${q}" bo'yicha qidiruv natijalari`,
      };

      // Local search with AI keywords
      const local = searchLocal(q, aiAnalysis.keywords, aiAnalysis.matchedSpecialties);

      const totalResults =
        (aiData?.clinics?.length || 0) +
        (aiData?.doctors?.length || 0) +
        (aiData?.diagnosticsServices?.length || 0) +
        (aiData?.clinicServices?.length || 0) +
        local.localClinics.length +
        local.localArticles.length +
        local.localDiseases.length +
        local.localTerms.length;

      setResult({
        aiAnalysis,
        clinics: aiData?.clinics || [],
        doctors: aiData?.doctors || [],
        diagnosticsServices: aiData?.diagnosticsServices || [],
        clinicServices: aiData?.clinicServices || [],
        totalResults,
        localClinics: local.localClinics,
        localArticles: local.localArticles,
        localDiseases: local.localDiseases,
        localTerms: local.localTerms,
      });
    } catch (err: any) {
      // Even if AI fails, show local results
      const local = searchLocal(q);
      setResult({
        aiAnalysis: {
          searchType: "clinic", keywords: [q], matchedSpecialties: [], matchedServices: [],
          possibleConditions: [], recommendedSpecialist: "", urgencyLevel: "low",
          searchSuggestions: [], aiSummary: `"${q}" bo'yicha qidiruv natijalari`,
        },
        clinics: [], doctors: [], diagnosticsServices: [], clinicServices: [],
        totalResults: local.localClinics.length + local.localArticles.length + local.localDiseases.length + local.localTerms.length,
        ...local,
      });
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

  // Computed counts
  const allClinicsCount = (result?.clinics?.length || 0) + (result?.localClinics?.length || 0);
  const allServicesCount = (result?.diagnosticsServices?.length || 0) + (result?.clinicServices?.length || 0);

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
                onClick={startVoiceSearch}
                disabled={isListening}
                className={`p-4 h-auto rounded-xl shadow-lg transition-all ${isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"}`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                onClick={() => handleSearch()}
                disabled={isSearching || query.trim().length < 2}
                className="px-6 py-4 h-auto rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium shadow-lg"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Qidirish"}
              </Button>
            </div>

            {userLocation && (
              <div className="flex items-center gap-1 mt-3 text-primary-foreground/60 text-xs">
                <Navigation className="w-3 h-3" />
                <span>Geolokatsiya aniqlandi — yaqin klinikalar birinchi ko'rsatiladi</span>
              </div>
            )}

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
              <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">Tozalash</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((h, i) => (
                <button key={i} onClick={() => { setQuery(h); handleSearch(h); }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
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
                          <span className="text-sm font-medium text-destructive">Shoshilinch holat! Tez yordam: 103</span>
                          <a href="tel:103" className="ml-auto">
                            <Button size="sm" variant="destructive" className="h-7 text-xs">
                              <Phone className="w-3 h-3 mr-1" /> 103
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {result.aiAnalysis.possibleConditions?.map((c, i) => (
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
                  <Building2 className="w-3 h-3 mr-1" /> Klinikalar ({allClinicsCount})
                </TabsTrigger>
                <TabsTrigger value="doctors" className="text-xs">
                  <Stethoscope className="w-3 h-3 mr-1" /> Shifokorlar ({result.doctors.length})
                </TabsTrigger>
                <TabsTrigger value="diseases" className="text-xs">
                  <Virus className="w-3 h-3 mr-1" /> Kasalliklar ({result.localDiseases?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="articles" className="text-xs">
                  <BookOpen className="w-3 h-3 mr-1" /> Maqolalar ({result.localArticles?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="terms" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" /> Atamalar ({result.localTerms?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs">
                  <Pill className="w-3 h-3 mr-1" /> Xizmatlar ({allServicesCount})
                </TabsTrigger>
              </TabsList>

              {/* All results */}
              <TabsContent value="all" className="space-y-6 mt-4">
                {/* DB Clinics */}
                {result.clinics.length > 0 && (
                  <ResultSection title="Ro'yxatdan o'tgan klinikalar" icon={<Building2 className="w-4 h-4 text-primary" />}>
                    <div className="grid gap-3">
                      {result.clinics.slice(0, 5).map((clinic: any) => (
                        <ClinicCard key={clinic.id} clinic={clinic} />
                      ))}
                    </div>
                  </ResultSection>
                )}

                {/* Local Clinics */}
                {result.localClinics.length > 0 && (
                  <ResultSection title="Klinikalar katalogi" icon={<Building2 className="w-4 h-4 text-primary" />}
                    onMore={result.localClinics.length > 5 ? () => setActiveTab("clinics") : undefined}
                    moreCount={result.localClinics.length}>
                    <div className="grid gap-3">
                      {result.localClinics.slice(0, 5).map((clinic: any) => (
                        <LocalClinicCard key={clinic.id} clinic={clinic} />
                      ))}
                    </div>
                  </ResultSection>
                )}

                {/* Doctors */}
                {result.doctors.length > 0 && (
                  <ResultSection title="Shifokorlar" icon={<Stethoscope className="w-4 h-4 text-primary" />}>
                    <div className="grid gap-3 md:grid-cols-2">
                      {result.doctors.slice(0, 4).map((doc: any) => (
                        <DoctorCard key={doc.id} doctor={doc} />
                      ))}
                    </div>
                  </ResultSection>
                )}

                {/* Diseases */}
                {result.localDiseases.length > 0 && (
                  <ResultSection title="Kasalliklar" icon={<Virus className="w-4 h-4 text-primary" />}
                    onMore={result.localDiseases.length > 5 ? () => setActiveTab("diseases") : undefined}
                    moreCount={result.localDiseases.length}>
                    <div className="grid gap-2">
                      {result.localDiseases.slice(0, 5).map((d, i) => (
                        <Link key={i} to={`/diseases/${d.categoryId}/${d.slug}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.category} · {d.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  </ResultSection>
                )}

                {/* Articles */}
                {result.localArticles.length > 0 && (
                  <ResultSection title="Maqolalar" icon={<BookOpen className="w-4 h-4 text-primary" />}
                    onMore={result.localArticles.length > 5 ? () => setActiveTab("articles") : undefined}
                    moreCount={result.localArticles.length}>
                    <div className="grid gap-2">
                      {result.localArticles.slice(0, 5).map((a, i) => (
                        <Link key={i} to={`/articles/${a.slug || a.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{a.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{a.category && `${a.category} · `}{a.summary?.slice(0, 80)}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </ResultSection>
                )}

                {/* Medical terms */}
                {result.localTerms.length > 0 && (
                  <ResultSection title="Tibbiy atamalar" icon={<FileText className="w-4 h-4 text-primary" />}
                    onMore={result.localTerms.length > 5 ? () => setActiveTab("terms") : undefined}
                    moreCount={result.localTerms.length}>
                    <div className="grid gap-2">
                      {result.localTerms.slice(0, 5).map((t, i) => (
                        <Link key={i} to={`/medicine/${encodeURIComponent(t.term)}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{t.term}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{t.category && `${t.category} · `}{t.definition?.slice(0, 80)}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </ResultSection>
                )}

                {/* Services */}
                {allServicesCount > 0 && (
                  <ResultSection title="Xizmatlar" icon={<Pill className="w-4 h-4 text-primary" />}>
                    <div className="grid gap-2">
                      {[...(result.diagnosticsServices || []), ...(result.clinicServices || [])].slice(0, 5).map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
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
                  </ResultSection>
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
                {result.localClinics.map((clinic: any) => (
                  <LocalClinicCard key={clinic.id} clinic={clinic} />
                ))}
                {allClinicsCount === 0 && <EmptyState />}
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

              {/* Diseases tab */}
              <TabsContent value="diseases" className="space-y-2 mt-4">
                {result.localDiseases.map((d, i) => (
                  <Link key={i} to={`/diseases/${d.categoryId}/${d.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.category} · {d.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
                {(result.localDiseases?.length || 0) === 0 && <EmptyState />}
              </TabsContent>

              {/* Articles tab */}
              <TabsContent value="articles" className="space-y-2 mt-4">
                {result.localArticles.map((a, i) => (
                  <Link key={i} to={`/articles/${a.slug || a.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{a.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{a.category && `${a.category} · `}{a.summary?.slice(0, 100)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
                {(result.localArticles?.length || 0) === 0 && <EmptyState />}
              </TabsContent>

              {/* Terms tab */}
              <TabsContent value="terms" className="space-y-2 mt-4">
                {result.localTerms.map((t, i) => (
                  <Link key={i} to={`/medicine/${encodeURIComponent(t.term)}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.term}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{t.category && `${t.category} · `}{t.definition?.slice(0, 100)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
                {(result.localTerms?.length || 0) === 0 && <EmptyState />}
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
                {allServicesCount === 0 && <EmptyState />}
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
                    <button key={i} onClick={() => { setQuery(s); handleSearch(s); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/5 transition-colors">
                      {s} <ArrowRight className="w-3 h-3 inline ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !isSearching && !initialQuery && (
          <div className="text-center py-16">
            <Brain className="w-16 h-16 text-primary/20 mx-auto mb-4" />
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Nimani qidiryapsiz?</h2>
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

// Section wrapper
const ResultSection = ({ title, icon, children, onMore, moreCount }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; onMore?: () => void; moreCount?: number;
}) => (
  <div>
    <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">{icon} {title}</h3>
    {children}
    {onMore && (
      <Button variant="ghost" size="sm" className="mt-2 text-primary" onClick={onMore}>
        Barchasini ko'rish ({moreCount}) <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    )}
  </div>
);

// DB Clinic Card
const ClinicCard = ({ clinic }: { clinic: any }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {clinic.logo_url || clinic.logo_external_url ? (
            <img src={clinic.logo_url || clinic.logo_external_url} alt={clinic.name}
              className="w-10 h-10 rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <Building2 className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground line-clamp-1">{clinic.name}</h4>
              {clinic.category && <p className="text-xs text-muted-foreground">{clinic.category}</p>}
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

// Local Clinic Card
const LocalClinicCard = ({ clinic }: { clinic: any }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {clinic.logoUrl ? (
            <img src={clinic.logoUrl} alt={clinic.name} className="w-10 h-10 rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <span className="text-xs font-bold text-primary">{clinic.logo}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground line-clamp-1">{clinic.name}</h4>
          <p className="text-xs text-muted-foreground">{clinic.region} · {clinic.city}</p>
          {clinic.address && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {clinic.address}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {clinic.rating > 0 && (
              <span className="text-xs flex items-center gap-0.5 text-muted-foreground">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {clinic.rating.toFixed(1)}
              </span>
            )}
            {clinic.phone?.[0] && (
              <a href={`tel:${clinic.phone[0]}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
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

// Doctor Card
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
            <p className="text-xs font-semibold text-primary mt-1">{Number(doctor.consultation_price).toLocaleString()} so'm</p>
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
