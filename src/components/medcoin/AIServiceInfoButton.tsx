import { useState } from "react";
import { Info, Clock, Coins, Users, Cog, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={`h-8 gap-1 rounded-full bg-primary/5 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 ${className}`}
        aria-label={`${info?.name ?? serviceId} haqida batafsil ma’lumot`}
      >
        <Info className="w-3 h-3" /> {mc(lang, "infoBtn")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {info?.name ?? serviceId}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <Row icon={<Lightbulb className="w-4 h-4 text-medical-orange" />} label={mc(lang, "infoWhat")} value={info?.what} />
            <Row icon={<Users className="w-4 h-4 text-secondary" />} label={mc(lang, "infoWho")} value={info?.who} />
            <Row icon={<Cog className="w-4 h-4 text-accent" />} label={mc(lang, "infoHow")} value={info?.how} />

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
              <div className="rounded-lg border border-medical-green/30 bg-medical-green/10 p-3">
                <div className="mb-1 text-[11px] font-medium uppercase text-medical-green">
                  {mc(lang, "infoExample")}
                </div>
                <div className="text-sm text-foreground">{info.example}</div>
              </div>
            )}

            <div className="flex gap-2 rounded-lg border border-medical-orange/30 bg-medical-orange/10 p-3">
              <AlertTriangle className="mt-0.5 w-4 flex-shrink-0 text-medical-orange" />
              <div className="text-xs text-foreground">
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
