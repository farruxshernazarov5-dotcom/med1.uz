import { useParams, Link } from "react-router-dom";
import { newsItems, newsCategories } from "@/data/news";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Clock, ExternalLink, BookOpen, Share2, ArrowRight } from "lucide-react";

const NewsDetailPage = () => {
  const { newsId } = useParams();
  const item = newsItems.find((n) => n.id === newsId);

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Yangilik topilmadi</h1>
          <Link to="/news" className="text-primary hover:underline">Yangiliklar sahifasiga qaytish</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const category = newsCategories.find((c) => c.id === item.categoryId);
  const related = newsItems.filter((n) => n.categoryId === item.categoryId && n.id !== item.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="bg-hero-gradient py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Link to="/news" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Yangiliklar
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-white/20 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              {category?.icon} {category?.title}
            </span>
            {item.isBreaking && (
              <span className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
                TEZKOR
              </span>
            )}
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground animate-fade-up max-w-3xl">
            {item.title}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {item.date}</span>
            <span className="flex items-center gap-1"><ExternalLink className="w-4 h-4" /> {item.source}</span>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl overflow-hidden mb-8 border border-border">
            <img src={item.image} alt={item.title} className="w-full h-64 md:h-80 object-cover" />
          </div>
          <p className="text-muted-foreground italic mb-8 text-lg">{item.summary}</p>
          <div className="space-y-5">
            {item.content.map((paragraph, i) => (
              <p key={i} className="text-foreground leading-relaxed">{paragraph}</p>
            ))}
          </div>

          {/* Share */}
          <div className="mt-8 flex items-center gap-3">
            <Share2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Ulashish:</span>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(item.title)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-accent px-3 py-1 rounded-full hover:bg-primary/10 transition-colors">
              Telegram
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-accent px-3 py-1 rounded-full hover:bg-primary/10 transition-colors">
              Twitter
            </a>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-accent border border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Manba: {item.source}. Ushbu yangilik faqat ma'lumot berish maqsadida taqdim etilgan.
            </p>
          </div>

          {/* Related News */}
          {related.length > 0 && (
            <div className="mt-12">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">O'xshash yangiliklar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/news/${rel.id}`}
                    className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <img src={rel.image} alt={rel.title} className="w-full h-28 object-cover" loading="lazy" />
                    <div className="p-3">
                      <h4 className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{rel.title}</h4>
                      <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        {rel.date} <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewsDetailPage;
