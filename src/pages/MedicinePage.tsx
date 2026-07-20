import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Search, BookOpen, Brain, Heart, Microscope, Dna, ArrowRight, Quote, Sparkles } from "lucide-react";
import DiseaseClassification from "@/components/DiseaseClassification";
import Header from "@/components/Header";
import BackToHome from "@/components/BackToHome";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import Breadcrumb from "@/components/Breadcrumb";
import MedicalTermModal from "@/components/MedicalTermModal";
import { termsByLetter, alphabet, totalTermsCount, medicalQuotes, type MedicalTerm } from "@/data/medicalTerms";
import medicineHero from "@/assets/medicine-hero.webp";
import anatomyImg from "@/assets/medicine-anatomy.webp";
import researchImg from "@/assets/medicine-research.webp";
import pillsImg from "@/assets/medicine-pills.webp";
import { SEO } from "@/components/SEO";

const categories = [
  { icon: Brain, title: "Nevrologiya", count: "2,400+", desc: "Nerv tizimi va miya kasalliklari", image: anatomyImg },
  { icon: Heart, title: "Kardiologiya", count: "1,800+", desc: "Yurak va qon tomir tizimlari", image: researchImg },
  { icon: Microscope, title: "Farmakologiya", count: "3,200+", desc: "Dori vositalari va ta'sirlari", image: pillsImg },
  { icon: Dna, title: "Genetika", count: "1,500+", desc: "Irsiyat va genetik kasalliklar", image: anatomyImg },
];

const MedicinePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeLetter, setActiveLetter] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuote, setActiveQuote] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<MedicalTerm | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentTerms = termsByLetter[activeLetter] || [];
  const allTermsFlat = useMemo(() => Object.values(termsByLetter).flat(), []);
  const filteredTerms = searchQuery
    ? allTermsFlat.filter(
        (t) =>
          t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentTerms;

  useEffect(() => {
    const termFromUrl = searchParams.get("term");
    if (!termFromUrl) return;

    const decoded = decodeURIComponent(termFromUrl).toLowerCase();
    const matched = allTermsFlat.find((t) => t.term.toLowerCase() === decoded);
    if (!matched) return;

    const firstLetter = matched.term.charAt(0).toUpperCase();
    setActiveLetter(firstLetter);
    setSelectedTerm(matched);
    setModalOpen(true);
  }, [allTermsFlat, searchParams]);

  const handleTermClick = (term: MedicalTerm) => {
    setSearchParams({ term: term.term });
    setSelectedTerm(term);
    setModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("term");
        return next;
      });
    }
  };

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
              <span className="text-sm font-medium text-primary-foreground/90">A-1 Tibbiyot bo'limi</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Tibbiy <span className="text-gradient">Entsiklopediya</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 mb-4 leading-relaxed animate-fade-up italic" style={{ animationDelay: "0.15s" }}>
              "Ilm o'rganish har bir musulmon erkak va ayolga farzdir"
            </p>
            <p className="text-sm text-primary-foreground/50 mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>— Hadis sharif</p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.25s" }}>
              <div className="flex items-center bg-card/95 backdrop-blur-sm rounded-2xl shadow-hero p-1.5">
                <Search className="w-5 h-5 text-muted-foreground ml-4" />
                <input
                  type="text"
                  placeholder={`${totalTermsCount}+ tibbiy atamalar ichidan qidiring...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-body"
                />
                <button className="bg-hero-gradient text-primary-foreground border-0 rounded-xl px-6 py-3 font-medium hover:opacity-90 transition-opacity">
                  Qidirish
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mt-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              {[
                { value: `${totalTermsCount}+`, label: "Tibbiy atamalar" },
                { value: "A-Z", label: "Qidiruv tizimi" },
                { value: "28+", label: "Tibbiyot sohalari" },
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

      {/* Breadcrumb + Quotes */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <Breadcrumb items={[{ label: "Tibbiyot" }]} />
          <BackToHome current="Tibbiyot" />
          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-3xl border border-border p-8 md:p-10 shadow-card relative overflow-hidden">
              <div className="absolute top-6 right-8 text-primary/10"><Quote className="w-20 h-20" /></div>
              <div className="relative">
                <p className="font-heading text-xl md:text-2xl text-foreground italic leading-relaxed mb-6">
                  "{medicalQuotes[activeQuote].text}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-semibold text-foreground">{medicalQuotes[activeQuote].author}</p>
                    <p className="text-sm text-muted-foreground">{medicalQuotes[activeQuote].role}</p>
                  </div>
                  <div className="flex gap-2">
                    {medicalQuotes.map((_, i) => (
                      <button key={i} onClick={() => setActiveQuote(i)}
                        className={`w-3 h-3 rounded-full transition-all ${i === activeQuote ? "bg-primary w-8" : "bg-border hover:bg-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Asosiy <span className="text-gradient">yo'nalishlar</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat, i) => (
              <div key={cat.title} className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="relative h-40 overflow-hidden">
                  <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">{cat.count} atama</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <cat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground">{cat.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{cat.desc}</p>
                  <div className="flex items-center text-primary text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Batafsil <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disease Classification A/B/C/D */}
      <DiseaseClassification />


      {/* A-Z Encyclopedia */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              A-Z <span className="text-gradient">Entsiklopediya</span>
            </h2>
          </div>
          <p className="text-muted-foreground mb-8 ml-9">Harfni tanlang va tibbiy atamalarni o'rganing</p>

          {/* Alphabet */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-1.5 mb-8 bg-card rounded-2xl border border-border p-4 shadow-card">
              {alphabet.map((letter) => {
                const hasTerms = !!termsByLetter[letter];
                return (
                  <button key={letter} onClick={() => { setActiveLetter(letter); setSearchQuery(""); }}
                    className={`w-11 h-11 rounded-xl font-heading font-semibold text-sm transition-all duration-200 ${
                      activeLetter === letter
                        ? "bg-hero-gradient text-primary-foreground shadow-hero scale-110"
                        : hasTerms
                        ? "bg-accent text-accent-foreground hover:bg-primary/10 hover:text-primary"
                        : "bg-muted text-muted-foreground/40 cursor-default"
                    }`}>
                    {letter}
                  </button>
                );
              })}
            </div>
          )}

          {/* Results header */}
          <div className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-hero-gradient flex items-center justify-center">
                  <span className="font-heading font-bold text-primary-foreground text-xl">
                    {searchQuery ? "🔍" : activeLetter}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {searchQuery ? `"${searchQuery}" bo'yicha natijalar` : `"${activeLetter}" harfi bo'yicha atamalar`}
                  </h3>
                  <p className="text-sm text-muted-foreground">{filteredTerms.length} ta natija topildi</p>
                </div>
              </div>
            </div>

            {filteredTerms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTerms.map((item, i) => (
                  <div key={item.id} onClick={() => handleTermClick(item)}
                    className="group flex items-start gap-4 p-4 rounded-2xl bg-accent/30 hover:bg-accent border border-transparent hover:border-primary/20 cursor-pointer transition-all duration-200 animate-fade-up"
                    style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">{item.term}</h4>
                      <p className="text-xs text-primary/70 font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{item.shortDesc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? `"${searchQuery}" bo'yicha natija topilmadi` : `"${activeLetter}" harfi bo'yicha atamalar hozircha yuklanmoqda...`}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">Bilasizmi?</h2>
              <div className="space-y-4">
                {[
                  "Inson tanasida 206 ta suyak mavjud",
                  "Miya 86 milliard neyrondan iborat",
                  "Yurak kuniga 100,000 marta uradi",
                  "Inson tanasida 96,000 km uzunlikdagi qon tomirlari bor",
                  "Buyraklar kuniga 180 litr qonni filtrlaydi",
                ].map((fact, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border shadow-card animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center flex-shrink-0">
                      <span className="font-heading font-bold text-primary-foreground text-sm">{i + 1}</span>
                    </div>
                    <p className="text-foreground font-medium">{fact}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src={anatomyImg} alt="Inson anatomiyasi" className="rounded-3xl shadow-hero w-full" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-medical-navy/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-heading text-primary-foreground font-semibold text-lg">"Inson tanasi — eng mukammal laboratoriya"</p>
                <p className="text-primary-foreground/70 text-sm mt-1">Abu Ali Ibn Sino</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banners */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdBanner variant={0} />
            <AdBanner variant={1} />
            <AdBanner variant={2} />
          </div>
        </div>
      </section>

      <Footer />

      {/* Term Detail Modal */}
      <MedicalTermModal term={selectedTerm} open={modalOpen} onOpenChange={handleModalOpenChange} />
    </div>
  );
};

export default MedicinePage;
