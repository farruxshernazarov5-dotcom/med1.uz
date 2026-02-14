import { useState, useMemo } from "react";
import { Search, BookOpen, ArrowRight, Quote, Sparkles, Filter, Hash, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TermDetailModal from "@/components/TermDetailModal";
import {
  encyclopediaTerms,
  medicalCategories,
  getTermsByLetter,
  searchTerms,
  getTermCountByLetter,
  getTotalTermCount,
  MedicalTerm,
} from "@/data/medicalEncyclopedia";
import medicineHero from "@/assets/medicine-hero.jpg";
import cardiologyImg from "@/assets/cardiology-icon.jpg";
import neurologyImg from "@/assets/neurology-icon.jpg";
import pulmonologyImg from "@/assets/pulmonology-icon.jpg";
import encyclopediaImg from "@/assets/encyclopedia-detail.jpg";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const medicalQuotes = [
  { text: "Tibbiyot — bu ilm va san'atning birlashgan shakli, tabiatning sirlarini ochuvchi kalitdir", author: "Abu Ali Ibn Sino", role: "Buyuk tabib va faylasuf (980-1037)" },
  { text: "Kasallikni davolashdan ko'ra, uni oldini olish afzaldir. Oldini olish — eng buyuk davodir", author: "Gippokrat", role: "Tibbiyot otasi (mil. avv. 460-370)" },
  { text: "Tabibning birinchi dorisi — so'z, ikkinchisi — o'simlik, uchinchisi — pichoqdir", author: "Abu Ali Ibn Sino", role: "\"Tib qonunlari\" muallifi" },
];

const featuredCategories = [
  { name: "Kardiologiya", count: "Yurak-qon tomir", image: cardiologyImg, color: "from-medical-red to-medical-orange" },
  { name: "Nevrologiya", count: "Nerv tizimi", image: neurologyImg, color: "from-primary to-medical-teal" },
  { name: "Pulmonologiya", count: "Nafas tizimi", image: pulmonologyImg, color: "from-medical-teal to-medical-green" },
  { name: "Gastroenterologiya", count: "Ovqat hazm qilish", image: encyclopediaImg, color: "from-medical-orange to-medical-red" },
];

const MedicinePage = () => {
  const [activeLetter, setActiveLetter] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<MedicalTerm | null>(null);
  const [activeQuote, setActiveQuote] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const displayedTerms = useMemo(() => {
    if (searchQuery.length >= 2) {
      return searchTerms(searchQuery);
    }
    if (selectedCategory) {
      return encyclopediaTerms.filter((t) => t.category === selectedCategory);
    }
    return getTermsByLetter(activeLetter);
  }, [activeLetter, searchQuery, selectedCategory]);

  const totalCount = getTotalTermCount();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={medicineHero} alt="Tibbiy entsiklopediya" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-medical-navy/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-medical-navy via-medical-navy/50 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-5 py-2 mb-6 animate-fade-up">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary-foreground/90">A-1 Tibbiyot bo'limi — Entsiklopediya</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Tibbiy <span className="text-gradient">Entsiklopediya</span>
            </h1>

            <p className="text-lg text-primary-foreground/70 mb-2 italic animate-fade-up" style={{ animationDelay: "0.15s" }}>
              "{medicalQuotes[activeQuote].text}"
            </p>
            <p className="text-sm text-primary-foreground/50 mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              — {medicalQuotes[activeQuote].author}, {medicalQuotes[activeQuote].role}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.25s" }}>
              <div className="flex items-center bg-card/95 backdrop-blur-sm rounded-2xl shadow-hero p-1.5">
                <Search className="w-5 h-5 text-muted-foreground ml-4" />
                <input
                  type="text"
                  placeholder={`${totalCount} ta tibbiy atama ichidan qidiring...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 2) setSelectedCategory(null);
                  }}
                  className="flex-1 px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-body"
                />
                <button className="bg-hero-gradient text-primary-foreground border-0 rounded-xl px-6 py-3 font-medium hover:opacity-90 transition-opacity">
                  Qidirish
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              {[
                { value: `${totalCount}+`, label: "Tibbiy atamalar" },
                { value: "A-Z", label: "Qidiruv tizimi" },
                { value: `${medicalCategories.length}`, label: "Tibbiyot sohalari" },
                { value: "3", label: "Tillar" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-heading font-bold text-primary-foreground">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/50 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Quote Carousel */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-card relative overflow-hidden">
              <Quote className="absolute top-4 right-6 w-16 h-16 text-primary/5" />
              <p className="font-heading text-lg md:text-xl text-foreground italic leading-relaxed mb-4">
                "{medicalQuotes[activeQuote].text}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold text-foreground text-sm">{medicalQuotes[activeQuote].author}</p>
                  <p className="text-xs text-muted-foreground">{medicalQuotes[activeQuote].role}</p>
                </div>
                <div className="flex gap-1.5">
                  {medicalQuotes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveQuote(i)}
                      className={`h-2 rounded-full transition-all ${i === activeQuote ? "bg-primary w-6" : "bg-border w-2 hover:bg-muted-foreground"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-bold text-foreground">Asosiy yo'nalishlar</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSearchQuery("");
                }}
                className={`group relative rounded-2xl overflow-hidden h-44 border transition-all ${
                  selectedCategory === cat.name ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-medical-navy/90 via-medical-navy/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-heading font-bold text-primary-foreground text-sm">{cat.name}</h3>
                  <p className="text-primary-foreground/60 text-xs">{cat.count}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Category filter chips */}
          <div className="mt-4">
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <Filter className="w-4 h-4" />
              Barcha yo'nalishlar ({medicalCategories.length})
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllCategories ? "rotate-180" : ""}`} />
            </button>
            {showAllCategories && (
              <div className="flex flex-wrap gap-2 mt-3 animate-fade-up">
                <button
                  onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    !selectedCategory ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Barchasi
                </button>
                {medicalCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSearchQuery(""); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* A-Z Encyclopedia */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-bold text-foreground">
              {searchQuery.length >= 2
                ? `"${searchQuery}" bo'yicha natijalar`
                : selectedCategory
                ? selectedCategory
                : `A-Z Entsiklopediya`}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6 ml-7">
            {displayedTerms.length} ta natija topildi
          </p>

          {/* Alphabet — only show when not filtering */}
          {!searchQuery && !selectedCategory && (
            <div className="flex flex-wrap gap-1 mb-6 bg-card rounded-2xl border border-border p-3 shadow-card">
              {alphabet.map((letter) => {
                const count = getTermCountByLetter(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => setActiveLetter(letter)}
                    className={`relative w-10 h-10 rounded-lg font-heading font-semibold text-sm transition-all ${
                      activeLetter === letter
                        ? "bg-hero-gradient text-primary-foreground shadow-hero scale-110"
                        : count > 0
                        ? "bg-accent text-accent-foreground hover:bg-primary/10"
                        : "bg-muted text-muted-foreground/30"
                    }`}
                  >
                    {letter}
                    {count > 0 && activeLetter !== letter && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedTerms.map((term, i) => (
              <button
                key={term.id}
                onClick={() => setSelectedTerm(term)}
                className="group text-left bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="font-heading font-bold text-primary-foreground">{term.letter}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {term.term}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{term.shortDesc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-md">{term.category}</span>
                      <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Batafsil <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {displayedTerms.length === 0 && (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Natija topilmadi</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Boshqa kalit so'z bilan qidirib ko'ring</p>
            </div>
          )}
        </div>
      </section>

      {/* Info Banner */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-3xl border border-border p-8 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
                  📚 30,000+ tibbiy atamalar bazasi
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Med1.uz entsiklopediyasida tibbiyotning barcha sohalarini qamrab olgan 30,000 dan ortiq tibbiy atama va tushuncha joylashtirilgan. Har bir atama uchun to'liq ta'rif, kelib chiqish sabablari, belgilari, davolash usullari va oldini olish choralari berilgan.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Ochiq manbalar", "Ilmiy asoslangan", "Muntazam yangilanadi", "3 tilda"].map((tag) => (
                    <span key={tag} className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block">
                <img src={encyclopediaImg} alt="Tibbiy entsiklopediya" className="rounded-2xl shadow-card w-full h-48 object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Detail Modal */}
      {selectedTerm && (
        <TermDetailModal term={selectedTerm} onClose={() => setSelectedTerm(null)} />
      )}
    </div>
  );
};

export default MedicinePage;
