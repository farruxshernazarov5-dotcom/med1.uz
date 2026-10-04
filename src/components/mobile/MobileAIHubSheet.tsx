import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setPendingCapture, startVoiceInput } from "@/lib/pendingCapture";
import {
  Camera,
  Mic,
  MicOff,
  CheckCircle2,
  Loader2,
  Microscope,
  Search,
  ShieldAlert,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hapticTap } from "@/lib/nativeApp";
import { MOBILE_AI_SERVICES_WITH_IMAGES } from "@/data/mobileServiceCatalog";

type AnalysisStatus = "idle" | "processing" | "ready";
type ToolCategory = "popular" | "main" | "radiology" | "special";
type ToolBadge = "Ommabop" | "Yangi";

type AITool = {
  title: string;
  description: string;
  path: string;
  category: Exclude<ToolCategory, "popular">;
  icon: LucideIcon;
  badge?: ToolBadge;
  popular?: boolean;
  tone: string;
  image?: string;
};

const AI_TOOLS: AITool[] = MOBILE_AI_SERVICES_WITH_IMAGES.map((tool) => ({
  title: tool.title,
  description: tool.description,
  path: tool.path,
  category: tool.aiGroup ?? "main",
  icon: tool.icon,
  badge: tool.badge === "Ommabop" || tool.badge === "Yangi" ? tool.badge : undefined,
  popular: tool.featured,
  tone: tool.tone,
  image: tool.image,
}));

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  popular: "Tezkor / Ommabop",
  main: "14 ta AI Asosiy",
  radiology: "Radiologiya (7 sub)",
  special: "Maxsus AI",
};

const VALID_PATHS = new Set(AI_TOOLS.map((tool) => tool.path));
const SEARCH_HINTS = ["rentgen", "diabet", "bola", "dori", "puls"];
// Recently used AI tools are kept in memory only (never persisted), since tool usage can reveal health information.
let recentPathsMemory: string[] = [];

export const MobileAIHubSheet = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [resultPath, setResultPath] = useState<string | null>(null);
  const [category, setCategory] = useState<ToolCategory>("popular");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [recentPaths, setRecentPaths] = useState<string[]>(recentPathsMemory);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const show = () => { setStatus("idle"); setOpen(true); };
    const processing = (event: Event) => {
      const detail = (event as CustomEvent<{ path?: string }>).detail;
      setStatus("processing");
      setResultPath(detail?.path ?? null);
      setOpen(true);
    };
    const ready = (event: Event) => {
      const detail = (event as CustomEvent<{ path?: string }>).detail;
      setStatus("ready");
      setResultPath(detail?.path ?? resultPath);
      setOpen(true);
    };
    window.addEventListener("med1:open-mobile-ai", show);
    window.addEventListener("med1:ai-processing", processing);
    window.addEventListener("med1:ai-result", ready);
    return () => {
      window.removeEventListener("med1:open-mobile-ai", show);
      window.removeEventListener("med1:ai-processing", processing);
      window.removeEventListener("med1:ai-result", ready);
    };
  }, [resultPath]);

  const openTool = (path: string) => {
    void hapticTap();
    const toolPath = path.split(/[?#]/)[0];
    if (!VALID_PATHS.has(toolPath) && !path.startsWith("/")) {
      setSearchError("Bu xizmat sahifasi topilmadi. Boshqa xizmatni tanlang.");
      return;
    }
    try {
      if (VALID_PATHS.has(toolPath)) {
        recentPathsMemory = [toolPath, ...recentPathsMemory.filter((p) => p !== toolPath)].slice(0, 4);
        setRecentPaths(recentPathsMemory);
      }
      setSearchError(null);
      setQuery("");
      setOpen(false);
      navigate(path);
    } catch {
      setSearchError("Xizmatni ochib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.");
    }
  };

  const toggleVoice = () => {
    void hapticTap();
    if (listening) { stopVoiceRef.current?.(); return; }
    const stop = startVoiceInput({
      onText: (text) => setQuery(text),
      onEnd: () => { setListening(false); stopVoiceRef.current = null; },
    });
    if (!stop) { setSearchError("Qurilmangiz ovozli kiritishni qo‘llab-quvvatlamaydi. Matn bilan yozing."); return; }
    stopVoiceRef.current = stop;
    setListening(true);
  };

  const isSearching = query.trim() !== debouncedQuery.trim();
  const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase("uz");
  const visibleTools = AI_TOOLS.filter((tool) => {
    if (normalizedQuery) {
      return `${tool.title} ${tool.description} ${tool.path}`.toLocaleLowerCase("uz").includes(normalizedQuery);
    }
    return category === "popular" ? tool.popular : tool.category === category;
  });
  const recentTools = recentPaths
    .map((p) => AI_TOOLS.find((tool) => tool.path === p))
    .filter((tool): tool is AITool => Boolean(tool));
  const suggestedTools = AI_TOOLS.filter((tool) => tool.popular).slice(0, 3);

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) window.setTimeout(() => document.getElementById("mobile-ai-trigger")?.focus(), 0);
    }} shouldScaleBackground={false}>
      <DrawerContent className="lg:hidden flex max-h-[92dvh] flex-col rounded-t-3xl border-border bg-card" aria-describedby="mobile-ai-description" onOpenAutoFocus={(event) => { event.preventDefault(); closeButtonRef.current?.focus(); }}>
        <DrawerHeader className="relative shrink-0 px-5 pb-2 text-left">
          <div className="flex items-center gap-3 pr-10">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ai-gradient text-accent-foreground shadow-glow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <DrawerTitle>Med1 AI markazi</DrawerTitle>
              <DrawerDescription id="mobile-ai-description">23 ta AI xizmatidan keraklisini tanlang</DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <Button ref={closeButtonRef} variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="AI oynasini yopish">
              <X />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="shrink-0 space-y-2.5 border-b border-border px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-12 justify-start gap-2" onClick={() => { void hapticTap(); cameraInputRef.current?.click(); }}>
              <Camera className="h-5 w-5 text-medical-green" /> <span className="text-left text-xs leading-tight">Tahlil / retseptni<br />suratga olish</span>
            </Button>
            <Button type="button" variant="outline" className={`h-12 justify-start gap-2 ${listening ? "border-destructive text-destructive animate-pulse" : ""}`} onClick={toggleVoice} aria-pressed={listening}>
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-primary" />}
              <span className="text-left text-xs leading-tight">{listening ? "Tinglanmoqda…\nto‘xtatish" : "Ovozli\nqidiruv"}</span>
            </Button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Kamera orqali suratga olish" onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setPendingCapture(file);
              openTool("/ai-report-analysis");
            }} />
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              role="searchbox"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && query.trim() && visibleTools.length === 0) { setOpen(false); navigate(`/smart-search?q=${encodeURIComponent(query.trim())}`); } }}
              placeholder="AI xizmatini qidiring yoki gapiring..."
              aria-label="AI xizmatlarini qidirish"
              className="h-11 pl-9 pr-9"
            />
            {query && (
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-11 w-10" onClick={() => setQuery("")} aria-label="Qidiruvni tozalash">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="sr-only" role="status" aria-live="polite">{listening ? "Ovoz tinglanmoqda" : ""}</p>


          <Tabs value={category} onValueChange={(value) => { setCategory(value as ToolCategory); setQuery(""); void hapticTap(); }}>
            <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 pb-1" aria-label="AI xizmatlari toifalari">
              {(Object.keys(CATEGORY_LABELS) as ToolCategory[]).map((key) => (
                <TabsTrigger key={key} value={key} className="h-9 shrink-0 rounded-full border border-border px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {CATEGORY_LABELS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="min-h-0 flex-1 scroll-smooth overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3">
          {status !== "idle" && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted/60 p-3" role="status" aria-live="polite" aria-atomic="true">
              {status === "processing" ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-medical-green" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {status === "processing" ? "Tahlil qilinmoqda" : "Xulosa tayyor"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {status === "processing" ? "Natija tayyor bo‘lganda shu yerda ko‘rinadi." : "Natijani ochib tavsiyalarni ko‘ring."}
                </p>
              </div>
              {status === "ready" && resultPath && (
                <Button size="sm" onClick={() => openTool(resultPath)}>Ochish</Button>
              )}
            </div>
          )}

          <p className="mb-2 text-xs font-medium text-muted-foreground" role="status" aria-live="polite">
            {isSearching ? "Qidirilmoqda..." : normalizedQuery ? `Qidiruv bo‘yicha ${visibleTools.length} ta natija` : `${CATEGORY_LABELS[category]} · ${visibleTools.length} ta xizmat`}
          </p>

          {searchError && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3" role="alert">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-destructive">{searchError}</p>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setSearchError(null); setQuery(""); setCategory("popular"); }}>Ommabop xizmatlarga qaytish</Button>
              </div>
            </div>
          )}

          {!query && recentTools.length > 0 && (
            <section className="mb-3" aria-label="Yaqinda ishlatilgan AI xizmatlari">
              <p className="mb-1.5 text-xs font-semibold text-foreground">Yaqinda ishlatilgan</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button key={tool.path} variant="outline" size="sm" className="h-10 shrink-0 gap-2 rounded-full" onClick={() => openTool(tool.path)} aria-label={`${tool.title} xizmatiga qaytish`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${tool.tone}`} aria-hidden="true"><Icon className="h-3.5 w-3.5" /></span>
                      <span className="text-xs">{tool.title}</span>
                    </Button>
                  );
                })}
              </div>
            </section>
          )}

          {isSearching ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="status" aria-label="Qidirilmoqda">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex min-h-20 animate-pulse items-center gap-3 rounded-lg border border-border p-3">
                  <div className="h-11 w-11 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /></div>
                </div>
              ))}
            </div>
          ) : visibleTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="AI xizmatlari ro‘yxati">
            {visibleTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.path}
                  variant="outline"
                  className="h-auto min-h-20 justify-start whitespace-normal rounded-lg p-3 text-left focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openTool(tool.path)}
                  aria-label={`${tool.title}. ${tool.description}${tool.badge ? `. ${tool.badge}` : ""}`}
                >
                  <span className="flex w-full items-center gap-3">
                    <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted" aria-hidden="true">
                      {tool.image && <img src={tool.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                      <span className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                      <span className={`absolute bottom-1 left-1 flex h-7 w-7 items-center justify-center rounded-md ${tool.tone}`}><Icon className="h-3.5 w-3.5" /></span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="block text-sm font-semibold text-foreground">{tool.title}</span>
                        {tool.badge && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{tool.badge}</span>}
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{tool.description}</span>
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center" role="status">
              <Microscope className="mb-3 h-9 w-9 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">AI xizmati topilmadi</p>
              <p className="mt-1 text-xs text-muted-foreground">Qisqaroq so‘z yozing yoki quyidagilardan birini sinang:</p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {SEARCH_HINTS.map((hint) => (
                  <Button key={hint} variant="secondary" size="sm" className="h-8 rounded-full text-xs" onClick={() => setQuery(hint)}>{hint}</Button>
                ))}
              </div>
              <div className="mt-3 flex w-full flex-col gap-1.5">
                {suggestedTools.map((tool) => (
                  <Button key={tool.path} variant="outline" size="sm" className="justify-start" onClick={() => openTool(tool.path)}>{tool.title}</Button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setQuery("")}>Qidiruvni tozalash</Button>
            </div>
          )}

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">Hayot uchun xavf bo‘lsa AI javobini kutmang — 103 ga qo‘ng‘iroq qiling.</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};