import { useParams, Link } from "react-router-dom";
import { articleCategories } from "@/data/articles";
import { ophthalmologyArticles } from "@/data/ophthalmologyArticles";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, ArrowRight, User, Calendar, FileText } from "lucide-react";
import type { Article } from "@/data/articles";

const CategoryArticlesPage = () => {
  const { categoryId } = useParams();
  const category = articleCategories.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Bo'lim topilmadi</h1>
          <Link to="/articles" className="text-primary hover:underline">Maqolalar bo'limiga qaytish</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Get articles for this category
  let articles: Article[] = [];
  if (categoryId === "oftalmologiya") {
    articles = ophthalmologyArticles;
  } else {
    articles = [category.article];
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="bg-hero-gradient py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Link to="/articles" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Maqolalar bo'limi
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground animate-fade-up">
              {category.title}
            </h1>
          </div>
          {category.quote && (
            <p className="text-primary-foreground/80 italic text-sm md:text-base max-w-2xl">{category.quote}</p>
          )}
          <p className="text-primary-foreground/60 text-sm mt-2">{articles.length} ta maqola</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <Link
              key={article.id}
              to={`/articles/${categoryId}/${article.slug}`}
              className="group bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="font-heading font-semibold text-foreground text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">{article.summary}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author.split(",")[0]}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
                </div>
                <div className="flex items-center text-primary text-xs font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Maqolani o'qish <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryArticlesPage;
