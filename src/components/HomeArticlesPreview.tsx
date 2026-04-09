import { Link } from "react-router-dom";
import { FileText, ArrowRight, BookOpen, Stethoscope, TrendingUp, Clock, Star } from "lucide-react";
import { articleCategories } from "@/data/articles";
import { extraArticleCategories } from "@/data/extraArticles";
import { newArticles } from "@/data/new_articles/allArticles";

const HomeArticlesPreview = () => {
  const featured = articleCategories.slice(0, 6);
  const extra = extraArticleCategories.slice(0, 3);

  // Latest added articles (last 6)
  const latestArticles = [...newArticles].reverse().slice(0, 6);

  // "Popular" articles (deterministic pick from spread of articles)
  const popularArticles = newArticles.filter((_, i) => [5, 25, 50, 100, 150, 200].includes(i)).slice(0, 4);

  // Recommended (different category mix)
  const recommendedArticles = newArticles.filter((_, i) => [10, 60, 120, 180].includes(i)).slice(0, 4);

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Ilmiy maqolalar</span>
            </div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground">
              So'nggi <span className="text-gradient">maqolalar</span>
            </h2>
          </div>
          <Link to="/articles" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Barchasi <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Latest articles */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-accent border border-border rounded-full px-4 py-1.5 mb-5">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Yangi qo'shilgan maqolalar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestArticles.map((art) => {
              const cat = articleCategories.find(c => c.id === art.category) || articleCategories[0];
              return (
                <Link
                  key={art.id}
                  to={`/articles/${cat.id}/${art.slug}`}
                  className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        {cat.title}
                      </span>
                      <span className="bg-accent text-foreground text-xs font-semibold px-2 py-1 rounded-full border border-border">
                        Yangi
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-sm text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{art.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{art.summary}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{art.date}</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        O'qish <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Popular & Recommended row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Popular */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Eng ko'p o'qilgan</span>
            </div>
            <div className="space-y-3">
              {popularArticles.map((art, i) => {
                const cat = articleCategories.find(c => c.id === art.category) || articleCategories[0];
                return (
                  <Link
                    key={art.id}
                    to={`/articles/${cat.id}/${art.slug}`}
                    className="group flex gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                  >
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{art.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cat.title}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recommended */}
          <div>
            <div className="inline-flex items-center gap-2 bg-accent border border-border rounded-full px-4 py-1.5 mb-5">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Tavsiya etiladi</span>
            </div>
            <div className="space-y-3">
              {recommendedArticles.map((art) => {
                const cat = articleCategories.find(c => c.id === art.category) || articleCategories[0];
                return (
                  <Link
                    key={art.id}
                    to={`/articles/${cat.id}/${art.slug}`}
                    className="group flex gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                  >
                    <img src={art.image} alt={art.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{art.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cat.title} • {art.date}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((cat) => (
            <Link
              key={cat.id}
              to={`/articles/${cat.id}`}
              className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-40 overflow-hidden">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">{cat.title}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{cat.article.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cat.article.summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{cat.article.author.split(",")[0]}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    O'qish <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Extra articles with cross-links */}
        <div className="mt-8">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-4 py-1.5 mb-5">
            <BookOpen className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Qo'shimcha maqolalar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {extra.map((cat) => (
             <Link
                key={cat.id}
                to={`/articles/${cat.id}`}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-36 overflow-hidden">
                  <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-secondary/90 text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full">{cat.title}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-2 line-clamp-2">{cat.article.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cat.article.summary}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/diseases'; }}
                      className="inline-flex items-center gap-1 text-[10px] font-medium bg-medical-red/10 text-medical-red px-2 py-0.5 rounded-full hover:bg-medical-red/20 transition-colors cursor-pointer"
                      style={{ color: 'hsl(var(--medical-red))' }}
                    >
                      <Stethoscope className="w-2.5 h-2.5" />
                      Kasalliklar
                    </span>
                    {cat.linkedEncyclopediaTerms.slice(0, 2).map((term) => (
                      <span
                        key={term}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/medicine?term=${encodeURIComponent(term)}`; }}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        {term}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{cat.article.author.split(",")[0]}</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      O'qish <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mt-6 md:hidden">
          <Link to="/articles" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Barcha maqolalar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeArticlesPreview;
