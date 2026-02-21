import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { medTechCategories, medTechEquipment } from "@/data/medtech";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wrench, Search, ArrowRight, Globe, Award, Cpu, ChevronRight, Zap } from "lucide-react";
import AdBanner from "@/components/AdBanner";

const MedTechPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredEquipment = useMemo(() => {
    return medTechEquipment.filter((eq) => {
      const matchSearch =
        !search ||
        eq.name.toLowerCase().includes(search.toLowerCase()) ||
        eq.description.toLowerCase().includes(search.toLowerCase()) ||
        eq.manufacturer.toLowerCase().includes(search.toLowerCase());
      const matchCat = !activeCategory || eq.categoryId === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  const stats = [
    { icon: Cpu, value: "200+", label: "Texnika modellari" },
    { icon: Globe, value: "15+", label: "Ishlab chiqaruvchi davlatlar" },
    { icon: Award, value: "CE/FDA", label: "Sertifikatlar" },
    { icon: Zap, value: "8", label: "Kategoriyalar" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-hero-gradient py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-4 mb-6 animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Wrench className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary-foreground">
                Med Texnika
              </h1>
              <p className="text-primary-foreground/70 text-lg mt-1">
                Jahon tibbiy texnologiyalari — batafsil ma'lumotlar bazasi
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {stats.map((s) => (
              <div key={s.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-primary-foreground/10">
                <s.icon className="w-6 h-6 text-primary-foreground mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary-foreground">{s.value}</div>
                <div className="text-sm text-primary-foreground/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 bg-muted/50 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="relative max-w-xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Texnika nomi, ishlab chiqaruvchi yoki kalit so'z..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-xl text-base"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => setActiveCategory(null)}
            >
              Barchasi
            </Badge>
            {medTechCategories.map((cat) => (
              <Badge
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      {!activeCategory && !search && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Texnika <span className="text-gradient">kategoriyalari</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {medTechCategories.map((cat, i) => (
                <Card
                  key={cat.id}
                  className="group cursor-pointer overflow-hidden border-border hover:border-primary/30 transition-all hover:shadow-card-hover animate-fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-3xl">{cat.icon}</span>
                    </div>
                    <Badge className="absolute top-3 right-3" variant="secondary">
                      {cat.equipmentCount} texnika
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-heading font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{cat.description}</p>
                    <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Ko'rish <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Equipment List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {(activeCategory || search) && (
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {activeCategory
                  ? medTechCategories.find((c) => c.id === activeCategory)?.name
                  : "Qidiruv natijalari"}
                <span className="text-muted-foreground text-lg font-normal ml-2">
                  ({filteredEquipment.length})
                </span>
              </h2>
              {activeCategory && (
                <Badge
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setActiveCategory(null)}
                >
                  ✕ Filterni tozalash
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEquipment.map((eq, i) => (
              <Link
                key={eq.id}
                to={`/med-tech/${eq.id}`}
                className="group animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <Card className="overflow-hidden border-border hover:border-primary/30 transition-all hover:shadow-card-hover h-full">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                      <img
                        src={eq.image}
                        alt={eq.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                        {eq.country}
                      </Badge>
                    </div>
                    <CardContent className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <Badge variant="outline" className="mb-2 text-xs">
                          {eq.category}
                        </Badge>
                        <h3 className="font-heading font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                          {eq.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {eq.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {eq.specs.slice(0, 3).map((s) => (
                            <span key={s} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{eq.manufacturer}</span>
                        <div className="flex items-center text-primary text-sm font-medium">
                          Batafsil <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {filteredEquipment.length === 0 && (
            <div className="text-center py-16">
              <Wrench className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Natija topilmadi</h3>
              <p className="text-muted-foreground">Boshqa kalit so'z bilan qidirib ko'ring</p>
            </div>
          )}
        </div>
      </section>

      {/* Ad Banners */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdBanner variant={0} />
            <AdBanner variant={1} />
            <AdBanner variant={2} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MedTechPage;
