import { Link } from "react-router-dom";
import { FileText, ArrowRight, BookOpen, Stethoscope } from "lucide-react";
import { articleCategories } from "@/data/articles";
import { extraArticleCategories } from "@/data/extraArticles";

const HomeArticlesPreview = () => {
  const featured = articleCategories.slice(0, 6);
  const extra = extraArticleCategories.slice(0, 3);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((cat) => (
            <Link
              key={cat.id}
              to={`/articles/${cat.id}`}
              className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {cat.title}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {cat.article.title}
                </h3>
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
            <span className="text-sm font-medium text-secondary">Yangi maqolalar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {extra.map((cat) => (
             <Link
                key={cat.id}
                to={`/articles/${cat.id}`}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-secondary/90 text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      {cat.title}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-2 line-clamp-2">
                    {cat.article.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cat.article.summary}</p>
                  
                  {/* Cross-links to diseases and encyclopedia */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Link
                      to={`/diseases`}
                      className="inline-flex items-center gap-1 text-[10px] font-medium bg-medical-red/10 text-medical-red px-2 py-0.5 rounded-full hover:bg-medical-red/20 transition-colors"
                      style={{ color: 'hsl(var(--medical-red))' }}
                    >
                      <Stethoscope className="w-2.5 h-2.5" />
                      Kasalliklar
                    </Link>
                    {cat.linkedEncyclopediaTerms.slice(0, 2).map((term) => (
                      <Link
                        key={term}
                        to={`/medicine?term=${encodeURIComponent(term)}`}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        {term}
                      </Link>
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
