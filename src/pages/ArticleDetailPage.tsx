import { useParams, Link } from "react-router-dom";
import { findArticle, getCategoryArticleCount } from "@/data/articles";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";
import ArticleContent from "@/components/ArticleContent";
import { ArrowLeft, User, Calendar, BookOpen } from "lucide-react";

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
            <img src={article.image} alt={article.title} className="w-full h-64 object-cover" />
          </div>
          <p className="text-muted-foreground italic mb-8 text-lg">{article.summary}</p>
          
          <ArticleContent content={article.content} />

          <ShareButton title={article.title} className="mt-8" />

          <div className="mt-8 p-4 rounded-xl bg-accent border border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Ushbu maqola faqat ma'lumot berish maqsadida yozilgan. Davolash uchun mutaxassisga murojaat qiling.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleDetailPage;
