import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, BookOpen, Globe2, Eye, TrendingUp, ArrowDownAZ, X } from "lucide-react";
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

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PAGE_SIZE = 30;

const cleanTitle = (t: string) =>
  t.replace(/\*+/g, "").replace(/^[#\s\-•]+/, "").replace(/\s+/g, " ").trim();

const KnowledgePage = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = (params.get("lang") as "uz" | "en") || "uz";
  const category = params.get("cat") || "all";
  const q = params.get("q") || "";
  const letter = params.get("letter") || "";
  const sort = params.get("sort") || (letter ? "az" : "popular");
  const [page, setPage] = useState(0);

  const [items, setItems] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [showSug, setShowSug] = useState(false);
  const sugTimer = useRef<number | null>(null);

  const setParam = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v); else next.delete(k);
    });
    setParams(next, { replace: true });
    setPage(0);
  }, [params, setParams]);

  // Main fetch
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
      if (letter) query = query.ilike("title", `${letter}%`).or(`title.ilike.*${letter}%,title.ilike.**${letter}%`);

      if (sort === "az") query = query.order("title", { ascending: true });
      else query = query.order("view_count", { ascending: false });

      query = query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
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
  }, [lang, category, q, letter, sort, page]);

  // Auto-suggest
  useEffect(() => {
    if (sugTimer.current) window.clearTimeout(sugTimer.current);
    if (!searchInput.trim() || searchInput === q) { setSuggestions([]); return; }
    sugTimer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("knowledge_articles")
        .select("id,language,slug,title,excerpt,category,tags,view_count")
        .eq("language", lang)
        .eq("published", true)
        .ilike("title", `%${searchInput.trim()}%`)
        .order("view_count", { ascending: false })
        .limit(8);
      setSuggestions((data || []) as Article[]);
      setShowSug(true);
    }, 200);
  }, [searchInput, lang, q]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full mb-4">
            <BookOpen className="w-3.5 h-3.5" /> Med1 Tibbiy Ensiklopediya
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
            12,000+ tibbiy maqola — bir joyda
          </h1>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Kasalliklar, simptomlar, davolash usullari, dorilar va anatomiya — UZ & EN tillarda.
          </p>

          {/* Smart search */}
          <form
            className="relative max-w-2xl mx-auto"
            onSubmit={(e) => { e.preventDefault(); setShowSug(false); setParam({ q: searchInput || null, letter: null }); }}
          >
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSug(true)}
              onBlur={() => setTimeout(() => setShowSug(false), 200)}
              placeholder="Kasallik, simptom, atama qidiring..."
              className="pl-12 pr-10 h-14 text-base rounded-2xl shadow-sm border-2 focus-visible:ring-primary"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); setParam({ q: null }); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
            {showSug && suggestions.length > 0 && (
              <div className="absolute z-20 mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => window.open(`/knowledge/${s.language}/${s.slug}`, "_blank", "noopener,noreferrer")}
                    className="w-full text-left px-4 py-2.5 hover:bg-accent flex items-center gap-3 border-b border-border last:border-0"
                  >
                    <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{cleanTitle(s.title)}</p>
                      {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Lang + Sort */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button onClick={() => setParam({ lang: "uz" })}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${lang === "uz" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>
              <Globe2 className="w-3.5 h-3.5 inline mr-1" />UZ
            </button>
            <button onClick={() => setParam({ lang: "en" })}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${lang === "en" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>
              <Globe2 className="w-3.5 h-3.5 inline mr-1" />EN
            </button>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button onClick={() => setParam({ sort: "popular" })}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-1 ${sort === "popular" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>
              <TrendingUp className="w-3.5 h-3.5" /> Mashhur
            </button>
            <button onClick={() => setParam({ sort: "az" })}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-1 ${sort === "az" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>
              <ArrowDownAZ className="w-3.5 h-3.5" /> A→Z
            </button>
          </div>
          {(letter || q || category !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchInput(""); setParams({ lang }, { replace: true }); setPage(0); }}>
              <X className="w-3.5 h-3.5 mr-1" /> Tozalash
            </Button>
          )}
        </div>

        {/* A-Z navigation */}
        <div className="bg-card border border-border rounded-2xl p-3 mb-5 overflow-x-auto">
          <div className="flex gap-1 min-w-max justify-center">
            {ALPHABET.map((L) => (
              <button
                key={L}
                onClick={() => setParam({ letter: letter === L ? null : L, sort: "az", q: null })}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                  letter === L
                    ? "bg-primary text-primary-foreground shadow-md scale-110"
                    : "text-foreground hover:bg-accent"
                }`}
              >{L}</button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam({ cat: c.id === "all" ? null : c.id })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >{c.label}</button>
          ))}
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          {loading ? "Yuklanmoqda..." : `${total.toLocaleString()} ta maqola`}
          {letter && <> · Harf: <span className="font-bold text-foreground">{letter}</span></>}
          {q && <> · "{q}"</>}
        </div>

        {/* Results */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((a) => (
            <Link
              key={a.id}
              to={`/knowledge/${a.language}/${a.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card border border-border rounded-xl p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                {a.category && <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>}
                <span className="flex items-center gap-1 ml-auto"><Eye className="w-3 h-3" />{a.view_count}</span>
              </div>
              <h3 className="font-heading font-semibold text-foreground group-hover:text-primary line-clamp-2 mb-2">
                {cleanTitle(a.title)}
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
