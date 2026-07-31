import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionLayout from "@/components/SectionLayout";
import { Newspaper, Search, X, ArrowRight, Clock, ExternalLink, Flame, TrendingUp } from "lucide-react";
import { newsCategories, newsItems, totalNewsItems, totalNewsCategories } from "@/data/news";

const NewsPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = newsItems.filter((item) => {
    const matchesSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || item.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const breaking = newsItems.filter((n) => n.isBreaking);
  const featured = newsItems.filter((n) => n.isFeatured);

  return (
    <>
      <SEO
        title="Tibbiy yangiliklar — jahon va O'zbekiston tibbiyoti | Med1.uz"
        description="Eng so'nggi tibbiy yangiliklar: ilmiy izlanishlar, AI tibbiyoti, vaktsinalar, transplantatsiya va sog'liqni saqlash innovatsiyalari."
        path="/news"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Tibbiy yangiliklar",
          url: "https://med1.uz/news",
          numberOfItems: totalNewsItems,
        }}
      />
    <SectionLayout
      title="Tibbiy Yangiliklar"
      subtitle={`${totalNewsCategories} ta yo'nalish, ${totalNewsItems} ta yangilik — jahon tibbiyotining eng so'nggi yangiliklari`}
      icon={<Newspaper className="w-7 h-7 text-primary-foreground" />}
    >
      {/* Breaking News Ticker */}
      {breaking.length > 0 && (
        <div className="mb-8 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-destructive animate-pulse" />
            <span className="text-sm font-bold text-destructive uppercase tracking-wider">Tezkor xabar</span>
          </div>
          <div className="space-y-2">
            {breaking.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.id}`}
                className="block text-sm text-foreground hover:text-primary transition-colors"
              >
                • {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search + Category Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Yangilik izlash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              !activeCategory
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            Barchasi
          </button>
          {newsCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {cat.icon} {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Featured News - Hero Grid */}
      {!search && !activeCategory && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {featured.slice(0, 2).map((item, i) => {
            const cat = newsCategories.find((c) => c.id === item.categoryId);
            return (
              <Link
                key={item.id}
                to={`/news/${item.id}`}
                className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img loading="lazy" decoding="async"
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {item.isBreaking && (
                      <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3" /> TEZKOR
                      </span>
                    )}
                    <span className="bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-1 rounded-full">
                      {cat?.icon} {cat?.title}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-heading font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.date}</span>
                      <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {item.source}</span>
                    </div>
                    <span className="text-primary text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Batafsil <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Trending Section */}
      {!search && !activeCategory && (
        <div className="mb-10">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Trendda
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {newsItems.slice(0, 4).map((item, i) => {
              const cat = newsCategories.find((c) => c.id === item.categoryId);
              return (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="group flex gap-3 bg-card rounded-xl border border-border p-3 hover:border-primary/30 transition-all animate-fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className="text-2xl font-black text-primary/20 group-hover:text-primary/40 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-primary font-medium">{cat?.icon} {cat?.title}</span>
                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All News Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((item, i) => {
          const cat = newsCategories.find((c) => c.id === item.categoryId);
          return (
            <Link
              key={item.id}
              to={`/news/${item.id}`}
              className="group bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${cat?.color} text-foreground backdrop-blur-sm border border-border/50`}>
                    {cat?.icon} {cat?.title}
                  </span>
                </div>
                {item.isBreaking && (
                  <div className="absolute top-2 right-2">
                    <Flame className="w-4 h-4 text-destructive animate-pulse" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{item.summary}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.date}</span>
                  <span>{item.source}</span>
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            "{search || activeCategory}" bo'yicha natija topilmadi
          </div>
        )}
      </div>
    </SectionLayout>
    </>
  );
};

export default NewsPage;
