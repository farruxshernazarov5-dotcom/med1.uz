import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SecurityDebugEntry } from "../SecurityCenterModule";

interface FallbackInfo {
  active: boolean;
  missingColumn: string;
  attemptedQuery: string;
  fallbackQuery: string;
  reason: string;
  at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fallback: FallbackInfo | null;
  related: SecurityDebugEntry[];
}

export const FallbackDetailDrawer = ({ open, onOpenChange, fallback, related }: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            🛡️ Fallback batafsil ma'lumot
          </SheetTitle>
          <SheetDescription>
            Qaysi ustun topilmadi, qaysi so'rov ishlatildi va bog'liq debug yozuvlar.
          </SheetDescription>
        </SheetHeader>

        {fallback && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <span className="text-muted-foreground">Topilmagan</span>
              <code className="font-mono bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">{fallback.missingColumn}</code>

              <span className="text-muted-foreground">Asl so'rov</span>
              <code className="font-mono text-xs break-all">{fallback.attemptedQuery}</code>

              <span className="text-muted-foreground">Fallback</span>
              <code className="font-mono text-xs break-all">{fallback.fallbackQuery}</code>

              <span className="text-muted-foreground">Sabab</span>
              <span className="text-xs break-words">{fallback.reason}</span>

              <span className="text-muted-foreground">Vaqt</span>
              <span className="text-xs">{new Date(fallback.at).toLocaleString("uz-UZ")}</span>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs">
              <p className="font-semibold mb-1">Yo'l-yo'riq</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Backend → Database orqali <code>api_partners.org_name</code> ustuni mavjudligini tasdiqlang.</li>
                <li>Migratsiya ishlatilgan bo'lsa, frontend TypeScript tiplarini qayta yarating.</li>
                <li>Fallback so'rov vaqtinchalik — sxema to'g'rilangach, banner avtomatik o'chadi.</li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-sm font-semibold mb-2">Bog'liq debug yozuvlar ({related.length})</p>
          <ScrollArea className="h-64 rounded border">
            <div className="p-2 space-y-2">
              {related.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">Bog'liq yozuv yo'q</p>
              ) : (
                related.map((e) => (
                  <div key={e.id} className="border-b pb-2 last:border-0 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={e.level === "error" ? "bg-red-600" : "bg-orange-500"}>
                        {e.level}
                      </Badge>
                      <span className="text-muted-foreground">{new Date(e.at).toLocaleString("uz-UZ")}</span>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">{e.scope}</div>
                    {e.column && <div className="font-mono text-[11px] text-orange-700">{e.column}</div>}
                    <div>{e.message}</div>
                    {e.query && <code className="block text-[10px] text-muted-foreground mt-1 break-all">{e.query}</code>}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
