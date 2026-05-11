import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  moduleId: string;
  currentTier: string;
  recommendedTier: string;
  reason: string;
}

export const UpgradeNudge = ({ moduleId, currentTier, recommendedTier, reason }: Props) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/5 to-primary/10 p-5">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase text-primary tracking-wide">
              AI Tavsiya
            </span>
          </div>
          <h3 className="font-semibold mb-1">
            {recommendedTier.toUpperCase()} tarif siz uchun mukammal
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{reason}</p>
          <Link to={`/pricing?module=${moduleId}`}>
            <Button size="sm" className="gap-2">
              Tarifni ko'rish <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpgradeNudge;
