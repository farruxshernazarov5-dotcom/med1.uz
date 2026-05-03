import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Eye, ExternalLink, Globe2, Share2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatArticleContent } from "@/lib/formatArticleContent";

type Article = {
  id: string;
  language: "uz" | "en";
  slug: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  source_name: string | null;
  source_url: string | null;
  view_count: number;
  created_at: string;
};

type Related = { id: string; slug: string; title: string; language: string };

const cleanTitle = (t: string) =>
  t.replace(/\*+/g, "").replace(/^[#\s\-•]+/, "").replace(/\s+/g, " ").trim();

// Render **bold** + inline markdown
const renderInline = (text: string, linkify: (s: string) => (string | JSX.Element)[]): (string | JSX.Element)[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  const out: (string | JSX.Element)[] = [];
  parts.forEach((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      out.push(<strong key={`b-${i}`} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      out.push(<em key={`i-${i}`}>{part.slice(1, -1)}</em>);
    } else if (part) {
      linkify(part).forEach((p) => out.push(p));
    }
  });
  return out;
};

const KnowledgeArticlePage = () => {
  const { lang = "uz", slug = "" } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Related[]>([]);
  const [linkMap, setLinkMap] = useState<Record<string, string>>({});
  const [altLang, setAltLang] = useState<{ lang: string; slug: string } | null>(null);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("knowledge_articles")
        .select("*")
        .eq("language", lang)
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (canceled) return;
      setArticle(data as any);
      setLoading(false);
      if (data) {
        supabase.rpc("increment_knowledge_view", { _article_id: data.id });

        // Related
        const { data: rel } = await supabase
          .from("knowledge_articles")
          .select("id,slug,title,language")
          .eq("language", lang)
          .eq("category", data.category)
          .neq("id", data.id)
          .order("view_count", { ascending: false })
          .limit(8);
        setRelated((rel || []) as Related[]);
        const map: Record<string, string> = {};
        (rel || []).forEach((r: any) => {
          map[cleanTitle(r.title).toLowerCase()] = `/knowledge/${r.language}/${r.slug}`;
        });
        setLinkMap(map);

        // Alt-language: search same title in other lang
        const otherLang = lang === "uz" ? "en" : "uz";
        const cleanT = cleanTitle(data.title).split(/[\(\[]/)[0].trim().slice(0, 40);
        if (cleanT) {
          const { data: alt } = await supabase
            .from("knowledge_articles")
            .select("slug,language")
            .eq("language", otherLang)
            .eq("published", true)
            .ilike("title", `%${cleanT}%`)
            .limit(1)
            .maybeSingle();
          if (alt) setAltLang({ lang: alt.language, slug: alt.slug });
          else setAltLang(null);
        }
      }
    };
    load();
    return () => { canceled = true; };
  }, [lang, slug]);

  // Build TOC from headings
  const { renderedContent, toc } = useMemo(() => {
    if (!article) return { renderedContent: null as any, toc: [] as { id: string; text: string }[] };
    const paragraphs = article.content.split("\n").filter(p => p.trim());
    const linkKeys = Object.keys(linkMap).sort((a, b) => b.length - a.length).slice(0, 30);
    const toc: { id: string; text: string }[] = [];

    const linkify = (text: string): (string | JSX.Element)[] => {
      if (!linkKeys.length) return [text];
      const escaped = linkKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
      const parts: (string | JSX.Element)[] = [];
      let lastIdx = 0;
      let m: RegExpExecArray | null;
      let i = 0;
      while ((m = re.exec(text)) !== null) {
        if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
        const matched = m[0];
        const href = linkMap[matched.toLowerCase()];
        if (href) {
          parts.push(
            <Link key={`l-${i++}`} to={href} className="text-primary hover:underline font-medium">
              {matched}
            </Link>
          );
        } else parts.push(matched);
        lastIdx = m.index + matched.length;
      }
      if (lastIdx < text.length) parts.push(text.slice(lastIdx));
      return parts;
    };

    const rendered = paragraphs.map((p, i) => {
      const raw = p.trim();

      // Heading: ## or ### markdown, or ** wrapped short line
      const headingMatch = raw.match(/^#{1,4}\s+(.+)$/);
      const boldHeading = raw.match(/^\*\*(.+?)\*\*:?$/);
      if (headingMatch || boldHeading) {
        const text = (headingMatch?.[1] || boldHeading?.[1] || "").trim();
        const id = `h-${i}`;
        toc.push({ id, text });
        return (
          <h2 key={i} id={id} className="font-heading text-xl md:text-2xl font-bold text-foreground mt-8 mb-3 scroll-mt-24 border-l-4 border-primary pl-3">
            {text}
          </h2>
        );
      }

      // Numbered list
      const numMatch = raw.match(/^(\d+)[.)]\s+(.+)$/);
      if (numMatch) {
        return (
          <div key={i} className="flex gap-3 items-start pl-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
              {numMatch[1]}
            </span>
            <p className="text-foreground/85 leading-relaxed flex-1">{renderInline(numMatch[2], linkify)}</p>
          </div>
        );
      }

      // Bullet list
      if (raw.startsWith("* ") || raw.startsWith("- ") || raw.startsWith("• ")) {
        return (
          <div key={i} className="flex gap-3 items-start pl-4 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2.5" />
            <p className="text-foreground/85 leading-relaxed flex-1">
              {renderInline(raw.replace(/^[\*\-•]\s+/, ""), linkify)}
            </p>
          </div>
        );
      }

      // Short line as subheading
      if (raw.length < 70 && i > 0 && !raw.endsWith(".") && !raw.endsWith(",") && !raw.endsWith(":")) {
        const id = `h-${i}`;
        toc.push({ id, text: raw });
        return (
          <h3 key={i} id={id} className="font-heading text-lg font-bold text-foreground mt-6 mb-2 scroll-mt-24">
            {renderInline(raw, linkify)}
          </h3>
        );
      }

      return (
        <p key={i} className="text-foreground/85 leading-relaxed mb-3">
          {renderInline(raw, linkify)}
        </p>
      );
    });

    return { renderedContent: rendered, toc };
  }, [article, linkMap]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: article?.title, url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Havola nusxalandi" }); }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Maqola topilmadi</h1>
          <Link to="/knowledge" className="text-primary hover:underline">← Ensiklopediyaga qaytish</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const readMin = Math.max(1, Math.round(article.content.split(/\s+/).length / 200));
  const title = cleanTitle(article.title);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Link to="/knowledge" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> Ensiklopediya
          </Link>
          <div className="flex items-center gap-2">
            {altLang && (
              <Button size="sm" variant="outline" onClick={() => navigate(`/knowledge/${altLang.lang}/${altLang.slug}`)} className="gap-1">
                <Globe2 className="w-3.5 h-3.5" /> {altLang.lang.toUpperCase()}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={share} className="gap-1">
              <Share2 className="w-3.5 h-3.5" /> Ulashish
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_240px] gap-8">
          <article className="bg-card border border-border rounded-2xl p-6 md:p-10 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="secondary">{article.language.toUpperCase()}</Badge>
              {article.category && <Badge variant="outline">{article.category}</Badge>}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {readMin} daq.
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Eye className="w-3 h-3" /> {article.view_count}
              </span>
            </div>

            <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h1>

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-6">
                {article.tags.map((t) => (
                  <Link key={t} to={`/knowledge?q=${encodeURIComponent(t)}`}
                    className="text-xs text-primary bg-primary/5 px-2 py-1 rounded-full hover:bg-primary/10">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <div className="prose prose-sm md:prose-base max-w-none">
              {renderedContent}
            </div>

            {article.source_url && (
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Manba: <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1">
                    {article.source_name || "Source"} <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            )}

            {related.length > 0 && (
              <section className="mt-10 pt-8 border-t border-border">
                <h2 className="font-heading text-xl font-bold mb-4">Aloqador maqolalar</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {related.map((r) => (
                    <Link key={r.id} to={`/knowledge/${r.language}/${r.slug}`}
                      className="bg-background border border-border rounded-lg p-3 hover:border-primary transition-colors">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{cleanTitle(r.title)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* TOC sidebar */}
          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Mundarija</h3>
                <ul className="space-y-1.5 text-sm">
                  {toc.slice(0, 20).map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="text-foreground/70 hover:text-primary line-clamp-2 block">
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default KnowledgeArticlePage;
