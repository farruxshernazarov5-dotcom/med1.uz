import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownView } from "@/lib/markdownRender";
import { PARTNER_DOCS } from "@/data/partner-docs";
import {
  BookOpen, Download, FileJson, FileText, Search, ExternalLink,
  ShieldCheck, Rocket, Code2,
} from "lucide-react";

const BASE_URL = "https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/api-gateway";

const RESOURCES = [
  { icon: FileJson, title: "OpenAPI 3.0 spetsifikatsiya", desc: "76+ endpoint, mashina o'qiy oladigan format", href: "/openapi.json" },
  { icon: Code2, title: "Swagger UI (interaktiv)", desc: "Brauzerda so'rov yuborib sinash", href: "/api-docs" },
  { icon: Download, title: "Postman kolleksiyasi", desc: "Barcha asosiy so'rovlar tayyor holda", href: "/docs/med1-postman-collection.json" },
  { icon: FileText, title: "SDK manifest", desc: "Flutter, JS/TS, Python, PHP, Kotlin, Swift", href: "/sdk/manifest.json" },
  { icon: ShieldCheck, title: "Hamkorlik shartnomasi", desc: "Rasmiy oferta — UZ / RU / EN, PDF", href: "/partner-terms" },
  { icon: Rocket, title: "Hamkorlik arizasi", desc: "Ariza topshirish va kalit olish", href: "/partnership" },
];

export default function PartnerDocsPage() {
  const [active, setActive] = useState(PARTNER_DOCS[0].id);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Hamkorlar uchun API hujjatlari · MED1.UZ";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content",
      "MED1.UZ Partner API to'liq hujjatlari: autentifikatsiya, endpoint'lar, webhook, xatolar, sandbox, xavfsizlik, yuridik talablar, SLA va go-live checklist.");
    const hash = window.location.hash.replace("#", "");
    if (hash && PARTNER_DOCS.some((d) => d.id === hash)) setActive(hash);
  }, []);

  const current = useMemo(
    () => PARTNER_DOCS.find((d) => d.id === active) ?? PARTNER_DOCS[0],
    [active],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PARTNER_DOCS;
    return PARTNER_DOCS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q),
    );
  }, [query]);

  const select = (id: string) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const downloadCurrent = () => {
    const blob = new Blob([current.source], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MED1UZ-${current.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    const all = PARTNER_DOCS.map((d) => d.source).join("\n\n---\n\n");
    const blob = new Blob([`# MED1.UZ — Hamkorlar uchun API hujjatlari\n\n${all}`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MED1UZ-Partner-API-Documentation.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Badge className="mb-3">Partner Documentation · v1</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Hamkorlar uchun API hujjatlari
          </h1>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            MED1.UZ ekotizimiga mobil ilova, web sayt yoki server-to-server integratsiya qilish
            uchun zarur bo'lgan barcha texnik, xavfsizlik va yuridik hujjatlar to'plami.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={downloadAll}>
              <Download className="w-4 h-4 mr-2" /> To'liq to'plamni yuklab olish
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/api-docs"><Code2 className="w-4 h-4 mr-2" /> Swagger UI</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/partnership"><Rocket className="w-4 h-4 mr-2" /> API kalit olish</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs font-mono text-muted-foreground break-all">
            Base URL: {BASE_URL}
          </p>
        </header>

        <section aria-label="Resurslar" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {RESOURCES.map((r) => (
            <a key={r.href} href={r.href} className="block">
              <Card className="p-4 h-full hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <r.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground flex items-center gap-1">
                      {r.title} <ExternalLink className="w-3 h-3 opacity-50" />
                    </p>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hujjatlar ichidan qidirish..."
                className="pl-9"
                aria-label="Hujjatlardan qidirish"
              />
            </div>
            <nav className="space-y-1">
              {filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => select(d.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    d.id === active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="block">{d.title}</span>
                  <span className="block text-xs opacity-70 mt-0.5">{d.summary}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">Hech narsa topilmadi.</p>
              )}
            </nav>
          </aside>

          <article>
            <Card className="p-5 md:p-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <BookOpen className="w-4 h-4" /> {current.title}
                </div>
                <Button size="sm" variant="outline" onClick={downloadCurrent}>
                  <Download className="w-4 h-4 mr-2" /> .md
                </Button>
              </div>
              <MarkdownView source={current.source} />
            </Card>

            <Card className="p-5 mt-6">
              <h2 className="font-semibold text-foreground mb-2">Yordam kerakmi?</h2>
              <p className="text-sm text-muted-foreground">
                Texnik savollar: api@med1.uz · Xavfsizlik: security@med1.uz · Yuridik: legal@med1.uz.
                Murojaatda <code className="font-mono">request_id</code>, endpoint va UTC vaqtni ko'rsating.
              </p>
            </Card>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
