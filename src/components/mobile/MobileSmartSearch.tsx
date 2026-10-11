import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Mic, Search, Sparkles, Stethoscope, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { MOBILE_SERVICE_CATALOG } from "@/data/mobileServiceCatalog";
import { hapticTap } from "@/lib/nativeApp";

export const OPEN_SMART_SEARCH = "med1:open-smart-search";
export const openSmartSearch = (q = "") => window.dispatchEvent(new CustomEvent(OPEN_SMART_SEARCH, { detail: q }));

const SUGGESTIONS = ["Kardiolog", "Tish shifokori", "Qon tahlili", "MRT", "Bosh og‘rig‘i", "Dorixona yaqinida", "Tug‘ruqxona", "Bolalar shifokori"];
// Uzbek Latin apostrophes vary (‘ ’ ' `) — normalise before matching.
const norm = (v: string) => v.toLowerCase().replace(/[‘’ʻʼ`']/g, "'").trim();

type Article = { id: string; title: string; excerpt: string | null; slug: string; language: string };

/** Full-screen smart search for the app: instant service matches, encyclopedia articles and Med1 AI search. */
export function MobileSmartSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = (e: Event) => { setQ(String((e as CustomEvent).detail ?? "")); setOpen(true); window.setTimeout(() => inputRef.current?.focus(), 120); };
    window.addEventListener(OPEN_SMART_SEARCH, onOpen);
    return () => window.removeEventListener(OPEN_SMART_SEARCH, onOpen);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setArticles([]); return; }
    let alive = true;
    const t = window.setTimeout(async () => {
      const { data } = await supabase.from("knowledge_articles").select("id,title,excerpt,slug,language").eq("published", true).ilike("title", `%${term.replace(/[%_]/g, "")}%`).order("view_count", { ascending: false }).limit(6);
      if (alive) setArticles((data ?? []) as Article[]);
    }, 250);
    return () => { alive = false; window.clearTimeout(t); };
  }, [q]);

  const services = useMemo(() => {
    const term = norm(q);
    if (term.length < 1) return [];
    const words = term.split(/\s+/).filter(Boolean);
    return MOBILE_SERVICE_CATALOG
      .map((s) => {
        // Match from the start of a word so "tish" finds "Tish..." but not "joylashtirish".
        const starts = (text: string, w: string) => norm(text).split(/[\s,.()/-]+/).some((t) => t.startsWith(w));
        const score = words.reduce((n, w) => n + (starts(s.title, w) ? 3 : starts(s.description, w) ? 1 : 0), 0);
        return { s, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.s);
  }, [q]);

  const go = (path: string) => { void hapticTap(); setOpen(false); navigate(path); };
  const askAi = () => { if (q.trim().length >= 2) go(`/smart-search?q=${encodeURIComponent(q.trim())}`); };

  const voice = () => {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "uz-UZ"; rec.interimResults = false;
    rec.onresult = (e) => setQ(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    setListening(true); rec.start();
  };
  const hasVoice = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="fixed inset-0 left-0 top-0 flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Aqlli qidiruv</DialogTitle>
        <div className="border-b border-border bg-card px-3 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
          <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); askAi(); }}>
            <Button type="button" variant="ghost" size="icon" aria-label="Yopish" onClick={() => setOpen(false)}><ArrowLeft /></Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Shifokor, xizmat, kasallik, dori..." className="h-10 pl-9 pr-9" enterKeyHint="search" />
              {q && <button type="button" aria-label="Tozalash" onClick={() => setQ("")} className="absolute right-2 top-2.5 text-muted-foreground"><X className="h-5 w-5" /></button>}
            </div>
            {hasVoice && <Button type="button" variant={listening ? "default" : "ghost"} size="icon" aria-label="Ovoz bilan qidirish" onClick={voice}><Mic /></Button>}
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-28">
          {q.trim().length >= 2 && (
            <button type="button" onClick={askAi} className="mb-4 flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-left active:scale-[0.99]">
              <Sparkles className="h-6 w-6 shrink-0 text-primary" />
              <span className="flex-1"><span className="block text-sm font-semibold">Med1 AI bilan qidirish: “{q.trim()}”</span><span className="text-xs text-muted-foreground">Yaqin klinika, shifokor va xizmatlarni AI tanlab beradi</span></span>
            </button>
          )}

          {!q.trim() && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Ommabop so‘rovlar</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => <Button key={s} size="sm" variant="outline" className="rounded-full" onClick={() => setQ(s)}>{s}</Button>)}
              </div>
            </section>
          )}

          {services.length > 0 && (
            <section className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Xizmatlar</p>
              <ul className="space-y-2">
                {services.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => go(s.path)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left active:scale-[0.99]">
                      {s.image ? <img src={s.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <s.icon className="h-6 w-6 shrink-0 text-primary" />}
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{s.title}</span><span className="line-clamp-1 text-xs text-muted-foreground">{s.description}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {articles.length > 0 && (
            <section className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Ensiklopediya</p>
              <ul className="space-y-2">
                {articles.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => go(`/knowledge/${a.language}/${a.slug}`)} className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left">
                      <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="min-w-0"><span className="block text-sm font-semibold">{a.title}</span>{a.excerpt && <span className="line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</span>}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {q.trim().length >= 2 && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => go(`/doctors?q=${encodeURIComponent(q.trim())}`)}><Stethoscope /> Shifokorlar</Button>
              <Button variant="outline" onClick={() => go(`/symptom-checker`)}><Sparkles /> Simptom tekshirish</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; start: () => void;
  onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
  onend: () => void;
};

/** Tap-to-open search field for mobile screens. */
export function MobileSearchBar({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => openSmartSearch()} className={`flex h-12 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-left text-sm text-muted-foreground shadow-sm active:scale-[0.99] ${className}`}>
      <Search className="h-4 w-4 text-primary" />
      <span className="flex-1">Aqlli qidiruv: shifokor, xizmat, kasallik...</span>
      <Sparkles className="h-4 w-4 text-primary" />
    </button>
  );
}
