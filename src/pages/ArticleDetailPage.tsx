import { useParams, Link } from "react-router-dom";
import { findArticle, getCategoryArticleCount } from "@/data/articles";
import { newsItems } from "@/data/news";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";
import ArticleContent from "@/components/ArticleContent";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ArrowLeft, ArrowRight, User, Calendar, BookOpen, Newspaper } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="bg-hero-gradient py-12 md:py-16">
        <div className="container mx-auto px-4">
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
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl overflow-hidden mb-8 border border-border">
            <img src={article.image} alt={article.title} className="w-full h-64 object-cover" loading="lazy" />
          </div>
          <p className="text-muted-foreground italic mb-8 text-lg">{article.summary}</p>

          <ArticleContent content={article.content} />

          <ShareButton title={article.title} className="mt-8" />

          <div className="mt-8 p-4 rounded-xl bg-accent border border-border space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Ushbu maqola faqat ma'lumot berish maqsadida yozilgan. Davolash uchun mutaxassisga murojaat qiling.
            </p>
            <p className="text-xs text-muted-foreground">Ma'lumot manbasi: med1.uz</p>
          </div>
        </div>
      </main>

      <section className="relative overflow-hidden py-12 border-t border-border">
        <AnimatedBackground variant="heartbeat" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Newspaper className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">So‘nggi tibbiy yangiliklar</h2>
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
                      O‘qish <ArrowRight className="w-3 h-3" />
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
