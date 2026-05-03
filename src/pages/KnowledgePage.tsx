import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, BookOpen, Globe2, Eye, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Article = {
  id: string;
  language: "uz" | "en";
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  tags: string[] | null;
  view_count: number;
};

const CATEGORIES = [
  { id: "all", label: "Barchasi" },
  { id: "kasallik", label: "Kasalliklar" },
  { id: "simptom", label: "Simptomlar" },
  { id: "davolash", label: "Davolash" },
  { id: "dori", label: "Dorilar" },
  { id: "diagnostika", label: "Diagnostika" },
  { id: "profilaktika", label: "Profilaktika" },
  { id: "anatomiya", label: "Anatomiya" },
  { id: "pediatriya", label: "Pediatriya" },
  { id: "ginekologiya", label: "Ginekologiya" },
  { id: "ensiklopediya", label: "Ensiklopediya" },
];

const PAGE_SIZE = 30;

const KnowledgePage = () => {
  const [params, setParams] = useSearchParams();
  const lang = (params.get("lang") as "uz" | "en") || "uz";
  const category = params.get("cat") || "all";
  const q = params.get("q") || "";
  const [page, setPage] = useState(0);

  const [items, setItems] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(q);

  const setParam = useCallback((k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
    setPage(0);
  }, [params, setParams]);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("knowledge_articles")
        .select("id,language,slug,title,excerpt,category,tags,view_count", { count: "exact" })
        .eq("language", lang)
        .eq("published", true);
      if (category !== "all") query = query.eq("category", category);
      if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
      query = query.order("view_count", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      const { data, count, error } = await query;
      if (canceled) return;
      if (!error) {
        setItems((data || []) as Article[]);
        setTotal(count || 0);
      }
      setLoading(false);
    };
    load();
    return () => { canceled = true; };
  }, [lang, category, q, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Tibbiy Ensiklopediya
          </h1>
          <p className="text-muted-foreground mt-2">12,000+ tibbiy maqola — MedlinePlus & ishonchli manbalar</p>
        </div>

        {/* Search + Lang */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <form
            className="flex-1 relative"
            onSubmit={(e) => { e.preventDefault(); setParam("q", searchInput || null); }}
          >
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Kasallik, simptom, atama qidiring..."
              className="pl-10 h-11"
            />
          </form>
          <div className="flex gap-2">
            <Button
              variant={lang === "uz" ? "default" : "outline"}
              onClick={() => setParam("lang", "uz")}
              className="gap-2"
            ><Globe2 className="w-4 h-4" /> UZ</Button>
            <Button
              variant={lang === "en" ? "default" : "outline"}
              onClick={() => setParam("lang", "en")}
              className="gap-2"
            ><Globe2 className="w-4 h-4" /> EN</Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam("cat", c.id === "all" ? null : c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >{c.label}</button>
          ))}
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          {loading ? "Yuklanmoqda..." : `${total.toLocaleString()} ta maqola topildi`}
        </div>

        {/* Results */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((a) => (
            <Link
              key={a.id}
              to={`/knowledge/${a.language}/${a.slug}`}
              className="group bg-card border border-border rounded-xl p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                {a.category && <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>}
                <span className="flex items-center gap-1 ml-auto"><Eye className="w-3 h-3" />{a.view_count}</span>
              </div>
              <h3 className="font-heading font-semibold text-foreground group-hover:text-primary line-clamp-2 mb-2">
                {a.title}
              </h3>
              {a.excerpt && (
                <p className="text-xs text-muted-foreground line-clamp-3">{a.excerpt}</p>
              )}
              {a.tags && a.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {a.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Natija topilmadi</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Oldingi</Button>
            <span className="text-sm text-muted-foreground px-3">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Keyingi</Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default KnowledgePage;
