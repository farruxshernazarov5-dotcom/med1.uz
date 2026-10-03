import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Apple,
  Baby,
  Bone,
  Bot,
  Brain,
  CheckCircle2,
  CircleDot,
  Dumbbell,
  FileScan,
  HeartHandshake,
  HeartPulse,
  Loader2,
  Microscope,
  Pill,
  Ribbon,
  Search,
  Salad,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Wind,
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
};

const AI_TOOLS: AITool[] = [
  { title: "Simptom tekshirgich", description: "Belgilar bo‘yicha xavfni baholash", path: "/symptom-checker", category: "main", icon: Activity, badge: "Ommabop", popular: true, tone: "bg-destructive/10 text-destructive" },
  { title: "AI Shifokor chati", description: "Tibbiy savollarga tezkor javob", path: "/ai-doctor-chat", category: "main", icon: Bot, badge: "Ommabop", popular: true, tone: "bg-primary/10 text-primary" },
  { title: "Laboratoriya tahlili OCR", description: "Analiz varaqasini suratdan o‘qish", path: "/ai-report-analysis", category: "main", icon: FileScan, badge: "Ommabop", popular: true, tone: "bg-medical-green/10 text-medical-green" },
  { title: "Salomatlik xavfi", description: "Shaxsiy xavf omillarini hisoblash", path: "/ai-health-risk", category: "main", icon: HeartPulse, tone: "bg-destructive/10 text-destructive" },
  { title: "Radiologiya AI", description: "Rentgen, MRT va KT tasvirlari", path: "/ai-radiology", category: "main", icon: ScanLine, badge: "Ommabop", popular: true, tone: "bg-ai-purple/10 text-ai-purple" },
  { title: "Salomatlik assistenti", description: "Kundalik sog‘liq bo‘yicha ko‘mak", path: "/ai-health-assistant", category: "main", icon: Stethoscope, tone: "bg-primary/10 text-primary" },
  { title: "Homiladorlik AI", description: "Homiladorlik davri bo‘yicha yordam", path: "/ai-pregnancy", category: "main", icon: HeartHandshake, tone: "bg-destructive/10 text-destructive" },
  { title: "Bolalar parvarishi AI", description: "Bola salomatligi va parvarishi", path: "/ai-baby-care", category: "main", icon: Baby, tone: "bg-primary/10 text-primary" },
  { title: "Kosmetologiya AI", description: "Teri holati va parvarish tavsiyalari", path: "/ai-cosmetology", category: "main", icon: Sparkles, tone: "bg-ai-purple/10 text-ai-purple" },
  { title: "AI Dietolog", description: "Ovqatlanish rejasi va tavsiyalar", path: "/ai-dietolog", category: "main", icon: Salad, tone: "bg-medical-green/10 text-medical-green" },
  { title: "AI Psixolog", description: "Ruhiy holat bo‘yicha suhbat va ko‘mak", path: "/ai-psixolog", category: "main", icon: Brain, tone: "bg-ai-purple/10 text-ai-purple" },
  { title: "AI Farmatsevt", description: "Dorilar va o‘zaro ta’sir haqida ma’lumot", path: "/ai-farmatsevt", category: "main", icon: Pill, tone: "bg-primary/10 text-primary" },
  { title: "AI Fitnes", description: "Shaxsiy mashq va faollik rejasi", path: "/ai-fitness", category: "main", icon: Dumbbell, tone: "bg-medical-green/10 text-medical-green" },
  { title: "Vital ko‘rsatkichlar", description: "Puls, bosim va SpO₂ monitoringi", path: "/ai-vital-signs", category: "main", icon: Activity, badge: "Yangi", popular: true, tone: "bg-destructive/10 text-destructive" },
  { title: "Pulmonologiya", description: "Chest X-ray + CT", path: "/ai-radiology/pulmonology", category: "radiology", icon: Wind, badge: "Yangi", tone: "bg-primary/10 text-primary" },
  { title: "Miya / Brain", description: "MRI / CT · ASPECTS", path: "/ai-radiology/brain", category: "radiology", icon: Brain, tone: "bg-ai-purple/10 text-ai-purple" },
  { title: "Suyak-Skelet", description: "AO/OTA · Fracture", path: "/ai-radiology/bone", category: "radiology", icon: Bone, tone: "bg-primary/10 text-primary" },
  { title: "Ko‘krak KT", description: "HRCT · Lung-RADS", path: "/ai-radiology/chest-ct", category: "radiology", icon: ScanLine, tone: "bg-medical-green/10 text-medical-green" },
  { title: "Mammografiya", description: "BI-RADS 0–6", path: "/ai-radiology/mammography", category: "radiology", icon: Ribbon, tone: "bg-destructive/10 text-destructive" },
  { title: "Qorin bo‘shlig‘i", description: "LI-RADS · Abdomen", path: "/ai-radiology/abdomen", category: "radiology", icon: Apple, tone: "bg-medical-green/10 text-medical-green" },
  { title: "Umurtqa / Spine", description: "Pfirrmann · MRI", path: "/ai-radiology/spine", category: "radiology", icon: Bone, tone: "bg-ai-purple/10 text-ai-purple" },
  { title: "AI Onkologiya", description: "Onkologik holat bo‘yicha yordam", path: "/ai-oncology", category: "special", icon: Ribbon, badge: "Yangi", popular: true, tone: "bg-destructive/10 text-destructive" },
  { title: "AI Qandli Diabet", description: "Glyukoza va diabet nazorati", path: "/ai-diabetes", category: "special", icon: CircleDot, badge: "Yangi", tone: "bg-medical-green/10 text-medical-green" },
];

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
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              role="searchbox"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="AI xizmatini qidiring..."
              aria-label="AI xizmatlarini qidirish"
              className="h-11 pl-9 pr-9"
            />
            {query && (
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-11 w-10" onClick={() => setQuery("")} aria-label="Qidiruvni tozalash">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

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
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tool.tone}`} aria-hidden="true">
                      <Icon className="h-5 w-5" />
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