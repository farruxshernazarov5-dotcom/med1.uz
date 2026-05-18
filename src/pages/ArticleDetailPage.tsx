import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { findArticle, getCategoryArticleCount, getAllArticlesForCategory, articleCategories, getCategoryIdForArticle } from "@/data/articles";
import { newArticles } from "@/data/new_articles/allArticles";
import { newsItems } from "@/data/news";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";
import ArticleContent from "@/components/ArticleContent";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ArrowLeft, ArrowRight, User, Calendar, BookOpen, Newspaper, Stethoscope, ChevronRight } from "lucide-react";

const ArticleDetailPage = () => {
  const { categoryId, slug } = useParams();
  const result = findArticle(categoryId || "", slug || "");

  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Maqola topilmadi</h1>
          <Link to="/articles" className="text-primary hover:underline">Maqolalar bo'limiga qaytish</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { category, article } = result;
  const relatedNews = newsItems.slice(0, 3);

  // Get related articles from same category (excluding current)
  const categoryArticles = getAllArticlesForCategory(categoryId || "")
    .filter((a) => a.slug !== slug)
    .slice(0, 4);

  // Get current article index for prev/next navigation
  const allCatArticles = getAllArticlesForCategory(categoryId || "");
  const currentIndex = allCatArticles.findIndex((a) => a.slug === slug);
  const prevArticle = currentIndex > 0 ? allCatArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < allCatArticles.length - 1 ? allCatArticles[currentIndex + 1] : null;

  // Recommended articles from other categories
  const recommended = newArticles
    .filter((a) => a.category !== (article.category || categoryId) && a.slug !== slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-hero-gradient py-12 md:py-16 overflow-hidden">
        <AnimatedBackground variant="dna" />
        <div className="container mx-auto px-4 relative">
          <Link
            to={getCategoryArticleCount(categoryId || "") > 1 ? `/articles/${categoryId}` : "/articles"}
            className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {getCategoryArticleCount(categoryId || "") > 1 ? category.title : "Maqolalar bo'limi"}
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-white/20 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              {category.title}
            </span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground animate-fade-up max-w-3xl">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {article.author}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {article.date}</span>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 max-w-5xl mx-auto">
          {/* Main content */}
          <div>
            <div className="rounded-2xl overflow-hidden mb-8 border border-border">
              <img src={article.image} alt={article.title} className="w-full h-64 object-cover" loading="lazy" />
            </div>
            <p className="text-muted-foreground italic mb-8 text-lg">{article.summary}</p>

            <ArticleContent content={article.content} />

            <ShareButton title={article.title} className="mt-8" />

            {/* Doctor consultation notice */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-accent to-muted border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                <h4 className="font-heading font-semibold text-foreground">Shifokorga murojaat qilish kerakmi?</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Agar ushbu maqoladagi belgilar sizda kuzatilsa, o'z-o'zini davolashdan saqlaning va mutaxassis shifokorga murojaat qiling. Shoshilinch holatlarda 103 raqamiga qo'ng'iroq qiling.
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Ma'lumot manbasi: med1.uz — {new Date().getFullYear()}
              </p>
            </div>

            {/* Prev/Next navigation */}
            {(prevArticle || nextArticle) && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevArticle ? (
                  <Link
                    to={`/articles/${categoryId}/${prevArticle.slug}`}
                    className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Oldingi</span>
                    <p className="text-sm font-medium text-foreground mt-1 line-clamp-2 group-hover:text-primary transition-colors">{prevArticle.title}</p>
                  </Link>
                ) : <div />}
                {nextArticle && (
                  <Link
                    to={`/articles/${categoryId}/${nextArticle.slug}`}
                    className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-right"
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">Keyingi <ArrowRight className="w-3 h-3" /></span>
                    <p className="text-sm font-medium text-foreground mt-1 line-clamp-2 group-hover:text-primary transition-colors">{nextArticle.title}</p>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - related articles */}
          <aside className="space-y-6">
            {categoryArticles.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Shu mavzuda
                </h3>
                <div className="space-y-3">
                  {categoryArticles.map((a) => (
                    <Link
                      key={a.id}
                      to={`/articles/${categoryId}/${a.slug}`}
                      className="group flex gap-3 items-start"
                    >
                      <img src={a.image} alt={a.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {recommended.length > 0 && (
              <div className="rounded-2xl border border-border bg-gradient-to-b from-accent/50 to-card p-5">
                <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" /> Tavsiya etiladi
                </h3>
                <div className="space-y-3">
                  {recommended.map((a) => {
                    const catId = getCategoryIdForArticle(a);
                    return (
                      <Link
                        key={a.id}
                        to={`/articles/${catId}/${a.slug}`}
                        className="group block p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                      >
                        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{a.title}</p>
                        <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          Batafsil <ChevronRight className="w-3 h-3" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Related news */}
      <section className="relative overflow-hidden py-12 border-t border-border">
        <AnimatedBackground variant="heartbeat" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Newspaper className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">So'nggi tibbiy yangiliklar</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedNews.map((news) => (
                <Link
                  key={news.id}
                  to={`/news/${news.id}`}
                  className="group rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                >
                  <img src={news.image} alt={news.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{news.date}</p>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{news.title}</h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-medium">
                      O'qish <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ArticleDetailPage;
