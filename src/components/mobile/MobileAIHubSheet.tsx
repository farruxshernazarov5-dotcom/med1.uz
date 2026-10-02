import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bot,
  CheckCircle2,
  FileScan,
  FlaskConical,
  HeartPulse,
  Loader2,
  ScanLine,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { hapticTap } from "@/lib/nativeApp";

type AnalysisStatus = "idle" | "processing" | "ready";

const TOOLS = [
  { title: "Rentgen / MRT", description: "Tasvirlarni AI bilan tahlil qilish", path: "/ai-radiology", icon: ScanLine },
  { title: "Laboratoriya OCR", description: "Analiz varaqasini o‘qish", path: "/ai-report-analysis", icon: FileScan },
  { title: "Simptom tekshirgich", description: "Belgilar bo‘yicha xavfni baholash", path: "/symptom-checker", icon: Activity },
  { title: "AI Shifokor", description: "Tibbiy savollarga tezkor javob", path: "/ai-doctor-chat", icon: Bot },
  { title: "Xavf kalkulyatori", description: "Salomatlik xavfini hisoblash", path: "/ai-health-risk", icon: HeartPulse },
] as const;

export const MobileAIHubSheet = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [resultPath, setResultPath] = useState<string | null>(null);

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
    setOpen(false);
    navigate(path);
  };

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) window.setTimeout(() => document.getElementById("mobile-ai-trigger")?.focus(), 0);
    }} shouldScaleBackground={false}>
      <DrawerContent className="lg:hidden max-h-[88dvh] rounded-t-3xl border-border bg-card" aria-describedby="mobile-ai-description">
        <DrawerHeader className="relative px-5 pb-3 text-left">
          <div className="flex items-center gap-3 pr-10">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ai-gradient text-accent-foreground shadow-glow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <DrawerTitle>Med1 AI markazi</DrawerTitle>
              <DrawerDescription id="mobile-ai-description">Kerakli tahlil turini tanlang</DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="AI oynasini yopish">
              <X />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
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

          <div className="grid grid-cols-2 gap-2.5">
            {TOOLS.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.path}
                  variant="outline"
                  className={`h-auto min-h-28 whitespace-normal p-3 text-left ${index === TOOLS.length - 1 ? "col-span-2" : ""}`}
                  onClick={() => openTool(tool.path)}
                >
                  <span className="flex w-full flex-col items-start gap-2" aria-label={`${tool.title}. ${tool.description}`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{tool.title}</span>
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{tool.description}</span>
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">Hayot uchun xavf bo‘lsa AI javobini kutmang — 103 ga qo‘ng‘iroq qiling.</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};