import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Newspaper, ArrowRight, Clock, Zap } from "lucide-react";
import { newsItems, newsCategories } from "@/data/news";

const breakingNews = newsItems.filter((n) => n.isBreaking);
const featuredNews = newsItems.filter((n) => n.isFeatured).slice(0, 4);
const latestNews = newsItems.slice(0, 6);

const HomeNewsSection = () => {
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % breakingNews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        {/* Breaking News Ticker */}
        {breakingNews.length > 0 && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-2xl overflow-hidden">
            <div className="flex items-center">
              <div className="bg-destructive px-4 py-3 flex items-center gap-2 flex-shrink-0">
                <Zap className="w-4 h-4 text-destructive-foreground animate-pulse" />
                <span className="text-sm font-heading font-bold text-destructive-foreground whitespace-nowrap">
                  Tezkor xabar
                </span>
              </div>
              <div className="px-4 py-3 overflow-hidden relative flex-1">
                <div
                  key={tickerIndex}
                  className="animate-fade-in"
                >
                  <Link
                    to={`/news/${breakingNews[tickerIndex].id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {breakingNews[tickerIndex].title}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-heading font-bold text-xl text-foreground">
              So'nggi yangiliklar
            </h2>
          </div>
          <Link
            to="/news"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Barchasi <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {latestNews.map((news, i) => {
            const cat = newsCategories.find((c) => c.id === news.categoryId);
            return (
              <Link
                key={news.id}
                to={`/news/${news.id}`}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-all hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {cat && (
                    <span className="absolute top-3 left-3 text-xs font-medium bg-card/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {cat.icon} {cat.title}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {news.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{news.date}</span>
                    <span className="ml-auto text-primary font-medium">{news.source}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeNewsSection;
