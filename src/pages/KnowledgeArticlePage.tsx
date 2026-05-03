import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Eye, ExternalLink, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

const KnowledgeArticlePage = () => {
  const { lang = "uz", slug = "" } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Related[]>([]);
  const [linkMap, setLinkMap] = useState<Record<string, string>>({});

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
        // increment views
        supabase.rpc("increment_knowledge_view", { _article_id: data.id });

        // related: same category, top 6
        const { data: rel } = await supabase
          .from("knowledge_articles")
          .select("id,slug,title,language")
          .eq("language", lang)
          .eq("category", data.category)
          .neq("id", data.id)
          .order("view_count", { ascending: false })
          .limit(8);
        setRelated((rel || []) as Related[]);

        // build link map for internal linking from related titles
        const map: Record<string, string> = {};
        (rel || []).forEach((r: any) => {
          map[r.title.toLowerCase()] = `/knowledge/${r.language}/${r.slug}`;
        });
        setLinkMap(map);
      }
    };
    load();
    return () => { canceled = true; };
  }, [lang, slug]);

  // Auto-link: highlight known terms in content
  const renderedContent = useMemo(() => {
    if (!article) return null;
    const paragraphs = article.content.split("\n").filter(p => p.trim());
    const linkKeys = Object.keys(linkMap).sort((a, b) => b.length - a.length).slice(0, 30);

    const linkify = (text: string): (string | JSX.Element)[] => {
      if (!linkKeys.length) return [text];
      // build regex of all titles
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
        } else {
          parts.push(matched);
        }
        lastIdx = m.index + matched.length;
      }
      if (lastIdx < text.length) parts.push(text.slice(lastIdx));
      return parts;
    };

    return paragraphs.map((p, i) => {
      const trimmed = p.trim();
      if (trimmed.startsWith("* ")) {
        return (
          <li key={i} className="text-foreground/85 leading-relaxed ml-6 list-disc">
            {linkify(trimmed.slice(2))}
          </li>
        );
      }
      if (trimmed.length < 80 && i > 0 && !trimmed.endsWith(".")) {
        return (
          <h2 key={i} className="font-heading text-xl font-bold text-foreground mt-6 mb-2">
            {trimmed}
          </h2>
        );
      }
      return (
        <p key={i} className="text-foreground/85 leading-relaxed mb-3">
          {linkify(trimmed)}
        </p>
      );
    });
  }, [article, linkMap]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/knowledge" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Ensiklopediya
        </Link>

        <article className="bg-card border border-border rounded-2xl p-6 md:p-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary">{article.language.toUpperCase()}</Badge>
            {article.category && <Badge variant="outline">{article.category}</Badge>}
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
              <Eye className="w-3 h-3" /> {article.view_count}
            </span>
          </div>

          <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-4">
            {article.title}
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
        </article>

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="font-heading text-xl font-bold mb-4">Aloqador maqolalar</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <Link key={r.id} to={`/knowledge/${r.language}/${r.slug}`}
                  className="bg-card border border-border rounded-lg p-3 hover:border-primary transition-colors">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{r.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default KnowledgeArticlePage;
