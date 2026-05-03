import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Eye, ExternalLink, Globe2, Share2, Clock,
  Activity, Stethoscope, Pill, ShieldCheck, Lightbulb, AlertTriangle,
  TrendingUp, FlaskConical, HeartPulse, FileText, Info, Phone, Tag,
} from "lucide-react";
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
  excerpt: string | null;
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

// Section definitions with icon + gradient color matching the creative encyclopedia style
const SECTION_THEMES: { keys: string[]; icon: any; color: string; bg: string; ring: string }[] = [
  { keys: ["sabab", "etiologi", "kelib chiq", "cause", "origin"], icon: Info, color: "text-sky-500", bg: "from-sky-500/15 to-sky-500/5", ring: "ring-sky-500/30" },
  { keys: ["belgi", "simptom", "klinik", "symptom", "sign"], icon: Activity, color: "text-rose-500", bg: "from-rose-500/15 to-rose-500/5", ring: "ring-rose-500/30" },
  { keys: ["tashxis", "diagnos", "tekshir", "exam", "test", "lab"], icon: Stethoscope, color: "text-indigo-500", bg: "from-indigo-500/15 to-indigo-500/5", ring: "ring-indigo-500/30" },
  { keys: ["davola", "treatment", "manage", "terapiya"], icon: Pill, color: "text-emerald-500", bg: "from-emerald-500/15 to-emerald-500/5", ring: "ring-emerald-500/30" },
  { keys: ["profilaktika", "oldini ol", "prevention"], icon: ShieldCheck, color: "text-amber-500", bg: "from-amber-500/15 to-amber-500/5", ring: "ring-amber-500/30" },
  { keys: ["tavsiya", "recommend", "maslahat"], icon: Lightbulb, color: "text-fuchsia-500", bg: "from-fuchsia-500/15 to-fuchsia-500/5", ring: "ring-fuchsia-500/30" },
  { keys: ["asorat", "complication"], icon: AlertTriangle, color: "text-orange-500", bg: "from-orange-500/15 to-orange-500/5", ring: "ring-orange-500/30" },
  { keys: ["prognoz", "outlook", "natija"], icon: TrendingUp, color: "text-cyan-500", bg: "from-cyan-500/15 to-cyan-500/5", ring: "ring-cyan-500/30" },
  { keys: ["patogenez", "patofizio", "patho"], icon: FlaskConical, color: "text-violet-500", bg: "from-violet-500/15 to-violet-500/5", ring: "ring-violet-500/30" },
  { keys: ["murojaat", "shifokor", "doctor", "contact"], icon: Phone, color: "text-red-500", bg: "from-red-500/15 to-red-500/5", ring: "ring-red-500/30" },
  { keys: ["muqobil", "alternative", "boshqa nom"], icon: Tag, color: "text-slate-500", bg: "from-slate-500/15 to-slate-500/5", ring: "ring-slate-500/30" },
  { keys: ["manba", "reference", "adabiyot"], icon: FileText, color: "text-zinc-500", bg: "from-zinc-500/15 to-zinc-500/5", ring: "ring-zinc-500/30" },
];

const themeFor = (heading: string) => {
  const h = heading.toLowerCase();
  for (const t of SECTION_THEMES) if (t.keys.some(k => h.includes(k))) return t;
  return { icon: HeartPulse, color: "text-primary", bg: "from-primary/15 to-primary/5", ring: "ring-primary/30" };
};

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
    window.scrollTo(0, 0);
    return () => { canceled = true; };
  }, [lang, slug]);

  // Group content into sections (heading + paragraphs)
  type Section = { heading: string | null; lines: string[] };
  const { sections, toc } = useMemo(() => {
    if (!article) return { sections: [] as Section[], toc: [] as { id: string; text: string }[] };
    const formatted = formatArticleContent(article.content);
    const lines = formatted.split("\n").map(l => l.trim()).filter(Boolean);
    const sections: Section[] = [];
    let current: Section = { heading: null, lines: [] };
    for (const line of lines) {
      const h = line.match(/^#{1,4}\s+(.+)$/) || line.match(/^\*\*(.+?)\*\*:?$/);
      if (h) {
        if (current.heading || current.lines.length) sections.push(current);
        current = { heading: h[1].trim(), lines: [] };
      } else {
        current.lines.push(line);
      }
    }
    if (current.heading || current.lines.length) sections.push(current);

    const toc = sections
      .filter(s => s.heading)
      .map((s, i) => ({ id: `sec-${i}`, text: s.heading! }));
    return { sections, toc };
  }, [article]);

  const linkify = useMemo(() => {
    const linkKeys = Object.keys(linkMap).sort((a, b) => b.length - a.length).slice(0, 30);
    return (text: string): (string | JSX.Element)[] => {
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
            <Link key={`l-${i++}`} to={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              {matched}
            </Link>
          );
        } else parts.push(matched);
        lastIdx = m.index + matched.length;
      }
      if (lastIdx < text.length) parts.push(text.slice(lastIdx));
      return parts;
    };
  }, [linkMap]);

  const renderLine = (raw: string, key: string | number) => {
    const numMatch = raw.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      return (
        <div key={key} className="flex gap-3 items-start mb-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <p className="text-foreground/85 leading-relaxed flex-1">{renderInline(numMatch[2], linkify)}</p>
        </div>
      );
    }
    if (raw.startsWith("* ") || raw.startsWith("- ") || raw.startsWith("• ")) {
      return (
        <div key={key} className="flex gap-3 items-start mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2.5" />
          <p className="text-foreground/85 leading-relaxed flex-1">
            {renderInline(raw.replace(/^[\*\-•]\s+/, ""), linkify)}
          </p>
        </div>
      );
    }
    return (
      <p key={key} className="text-foreground/85 leading-relaxed mb-3">
        {renderInline(raw, linkify)}
      </p>
    );
  };

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
  const intro = sections.find(s => !s.heading);
  const headedSections = sections.filter(s => s.heading);

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

        <div className="grid lg:grid-cols-[1fr_240px] gap-6 lg:gap-8">
          <div className="min-w-0">
            {/* Hero card — gradient like the medicine modal */}
            <div className="relative overflow-hidden rounded-3xl mb-6 bg-gradient-to-br from-primary via-primary/80 to-indigo-500 p-6 md:p-8 shadow-xl">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-10 -bottom-10 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {article.category && (
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm hover:bg-white/30">
                      {article.category}
                    </Badge>
                  )}
                  <Badge className="bg-white/15 text-white border-0 backdrop-blur-sm">
                    {article.language.toUpperCase()}
                  </Badge>
                </div>
                <h1 className="font-heading text-2xl md:text-4xl font-bold text-white mb-2">
                  {title}
                </h1>
                {article.excerpt && (
                  <p className="text-white/85 text-sm md:text-base">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-white/80 text-xs">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {readMin} daq.</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {article.view_count}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {article.tags.map((t) => (
                  <Link key={t} to={`/knowledge?q=${encodeURIComponent(t)}`}
                    className="text-xs text-primary bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-full">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            {/* Intro card (no heading paragraph) */}
            {intro && intro.lines.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-primary">
                  <BookOpen className="w-4 h-4" />
                  <h2 className="font-heading font-semibold text-base">Batafsil ma'lumot</h2>
                </div>
                <div>{intro.lines.map((l, i) => renderLine(l, i))}</div>
              </div>
            )}

            {/* Themed section cards */}
            <div className="space-y-4">
              {headedSections.map((sec, idx) => {
                const theme = themeFor(sec.heading!);
                const Icon = theme.icon;
                return (
                  <section
                    key={idx}
                    id={`sec-${idx}`}
                    className={`scroll-mt-24 relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${theme.bg} p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-card ring-2 ${theme.ring} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${theme.color}`} />
                      </div>
                      <h2 className="font-heading text-lg md:text-xl font-bold text-foreground">
                        {sec.heading}
                      </h2>
                    </div>
                    <div className="pl-1">
                      {sec.lines.map((l, i) => renderLine(l, i))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Source */}
            {article.source_url && (
              <div className="mt-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-0.5">Ma'lumot manbasi</p>
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1">
                    {article.source_name || "Source"} <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="mt-1 italic">Ushbu ma'lumotlar faqat ta'lim maqsadida. O'z-o'zini davolashdan qoching va shifokorga murojaat qiling.</p>
                </div>
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <section className="mt-8">
                <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Aloqador maqolalar
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {related.map((r) => (
                    <Link key={r.id} to={`/knowledge/${r.language}/${r.slug}`}
                      target="_blank" rel="noopener noreferrer"
                      className="group bg-card border border-border rounded-xl p-3 hover:border-primary hover:shadow-md transition-all flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">{cleanTitle(r.title)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* TOC sidebar */}
          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Mundarija</h3>
                <ul className="space-y-1.5 text-sm">
                  {toc.slice(0, 20).map((t) => {
                    const theme = themeFor(t.text);
                    const Icon = theme.icon;
                    return (
                      <li key={t.id}>
                        <a href={`#${t.id}`} className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors py-1">
                          <Icon className={`w-3.5 h-3.5 ${theme.color} flex-shrink-0`} />
                          <span className="line-clamp-2">{t.text}</span>
                        </a>
                      </li>
                    );
                  })}
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
