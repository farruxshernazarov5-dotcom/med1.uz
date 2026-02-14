import { useState } from "react";
import { Link } from "react-router-dom";
import SectionLayout from "@/components/SectionLayout";
import { FileText, ArrowRight, Search, X } from "lucide-react";
import { articleCategories, totalArticleCategories } from "@/data/articles";

const ArticlesPage = () => {
  const [search, setSearch] = useState("");

  const filtered = search
    ? articleCategories.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.article.title.toLowerCase().includes(search.toLowerCase())
      )
    : articleCategories;

  return (
    <SectionLayout
      title="Maqolalar bo'limi"
      subtitle={`${totalArticleCategories} ta yo'nalish bo'yicha ilmiy maqolalar`}
      icon={<FileText className="w-7 h-7 text-primary-foreground" />}
    >
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Maqola yoki bo'lim nomi izlash..."
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((cat, i) => (
          <Link
            key={cat.id}
            to={`/articles/${cat.id}/${cat.article.slug}`}
            className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </div>
            <div className="p-4">
              <h3 className="font-heading font-semibold text-foreground text-base mb-1">{cat.title}</h3>
              {cat.quote && (
                <p className="text-[11px] text-primary/70 italic leading-relaxed mb-2 line-clamp-2">{cat.quote}</p>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{cat.article.title}</p>
              <div className="flex items-center text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Maqolani o'qish <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            "{search}" bo'yicha natija topilmadi
          </div>
        )}
      </div>
    </SectionLayout>
  );
};

export default ArticlesPage;
