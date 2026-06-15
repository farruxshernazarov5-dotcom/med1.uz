import { useState } from "react";
import { Info, Clock, Coins, Users, Cog, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { mc, mcService } from "@/lib/medCoinI18n";
import { getServiceCreditCost, AI_SERVICE_TARIFFS } from "@/data/aiTariffs";

interface Props {
  serviceId: string;
  /** Optional inline trigger; otherwise render the floating ℹ️ chip. */
  className?: string;
}

const AIServiceInfoButton = ({ serviceId, className = "" }: Props) => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);

  const info = mcService(lang, serviceId);
  const tariff = AI_SERVICE_TARIFFS.find((t) => t.id === serviceId);
  const cost = getServiceCreditCost(serviceId);
  const tier = tariff?.costTier ?? "low";
  const time = tier === "high" ? mc(lang, "infoTimeHigh") : tier === "mid" ? mc(lang, "infoTimeMid") : mc(lang, "infoTimeFast");

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline px-2 py-1 rounded-full bg-primary/5 hover:bg-primary/10 transition ${className}`}
        aria-label="info"
      >
        <Info className="w-3 h-3" /> {mc(lang, "infoBtn")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {info?.name ?? serviceId}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <Row icon={<Lightbulb className="w-4 h-4 text-amber-500" />} label={mc(lang, "infoWhat")} value={info?.what} />
            <Row icon={<Users className="w-4 h-4 text-blue-500" />} label={mc(lang, "infoWho")} value={info?.who} />
            <Row icon={<Cog className="w-4 h-4 text-violet-500" />} label={mc(lang, "infoHow")} value={info?.how} />

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                  <Coins className="w-3 h-3" /> {mc(lang, "infoCost")}
                </div>
                <div className="font-bold text-foreground">{cost} 🪙</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                  <Clock className="w-3 h-3" /> {mc(lang, "infoTime")}
                </div>
                <div className="font-bold text-foreground">{time}</div>
              </div>
            </div>

            {info?.example && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-3">
                <div className="text-[11px] font-medium uppercase text-emerald-700 dark:text-emerald-300 mb-1">
                  {mc(lang, "infoExample")}
                </div>
                <div className="text-sm text-emerald-900 dark:text-emerald-100">{info.example}</div>
              </div>
            )}

            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-100">
                {info?.warning}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => (
  <div className="flex gap-2.5">
    <div className="flex-shrink-0 mt-0.5">{icon}</div>
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value ?? "—"}</div>
    </div>
  </div>
);

export default AIServiceInfoButton;
