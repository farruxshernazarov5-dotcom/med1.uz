import { useEffect, useState } from "react";
import { Lock, Sparkles, ArrowRight, X, Check, Minus, Crown, Zap, ArrowUpRight, Ticket, Loader2, BadgeCheck, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "feature_blocked" | "limit_exceeded" | "expired" | "no_subscription" | string;
  moduleId: string;
  feature?: string;
  metric?: string;
  used?: number;
  limit?: number;
  currentTier?: string;
  requiredTier?: string;
}

const REASON_TEXT: Record<string, { title: string; desc: string }> = {
  feature_blocked: { title: "🔒 Bu funksiya tarifda yo'q", desc: "Ushbu modulning kengaytirilgan imkoniyatidan foydalanish uchun tarifingizni yangilang." },
  limit_exceeded:  { title: "⚠️ Limit tugadi", desc: "Joriy oy uchun limitingiz to'lib bo'lgan. Yuqoriroq tarifga o'tib limitlarni oshiring." },
  expired:         { title: "⏰ Obuna muddati tugagan", desc: "Obunangiz muddati tugagan. Davom ettirish uchun yangilang." },
  no_subscription: { title: "✨ Faollashtirilmagan modul", desc: "Bu modul obunangizda faol emas. Tarifni tanlang." },
};

const TIER_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, enterprise: 3 };
const TIER_ORDER = ["free", "starter", "pro", "enterprise"];
const TIER_LABEL_COLOR: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  pro: "bg-primary/15 text-primary",
  enterprise: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300",
};

interface PlanRow {
  tier: string;
  price_uzs: number | null;
  features: string[];
  limits: Record<string, number>;
}

const formatLimit = (v: number) => {
  if (v === -1 || v === null || v === undefined) return "∞";
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return String(v);
};

const formatPrice = (v: number | null) => {
  if (!v || v === 0) return "Bepul";
  return `${v.toLocaleString("uz-UZ")} so'm/oy`;
};

export const UpgradeModal = ({
  open, onClose, reason = "feature_blocked", moduleId,
  feature, metric, used, limit, currentTier, requiredTier,
}: UpgradeModalProps) => {
  const t = REASON_TEXT[reason] || REASON_TEXT.feature_blocked;
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Resolve target tier: prop, or one step above currentTier
  const cur = (currentTier || "free").toLowerCase();
  const req = (requiredTier ||
    TIER_ORDER[Math.min(TIER_RANK[cur] + 1, TIER_ORDER.length - 1)]
  ).toLowerCase();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("saas_plans" as any)
        .select("tier,price_uzs,features,limits")
        .eq("module_id", moduleId)
        .in("tier", [cur, req]);
      if (!cancelled) {
        const rows = ((data as any[]) || []).map((r) => ({
          tier: r.tier,
          price_uzs: r.price_uzs ?? null,
          features: Array.isArray(r.features) ? r.features : [],
          limits: (r.limits || {}) as Record<string, number>,
        }));
        setPlans(rows);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, moduleId, cur, req]);

  const curPlan = plans.find((p) => p.tier === cur);
  const reqPlan = plans.find((p) => p.tier === req);

  // Build union of all features + limits (so user sees gaps)
  const allFeatures = Array.from(new Set([
    ...(curPlan?.features || []),
    ...(reqPlan?.features || []),
    ...(feature ? [feature] : []),
  ]));
  const allMetrics = Array.from(new Set([
    ...Object.keys(curPlan?.limits || {}),
    ...Object.keys(reqPlan?.limits || {}),
  ]));

  const hasFeature = (plan: PlanRow | undefined, f: string) =>
    !!plan?.features.includes(f);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-3 shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
            <Lock className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">{t.title}</DialogTitle>
          <DialogDescription className="text-center pt-2">{t.desc}</DialogDescription>
        </DialogHeader>

        {/* Context box */}
        <div className="bg-muted/40 rounded-xl p-3 text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Modul:</span><span className="font-medium">{moduleId}</span></div>
          {feature && <div className="flex justify-between"><span className="text-muted-foreground">Funksiya:</span><span className="font-medium">{feature}</span></div>}
          {metric && limit !== undefined && (
            <div className="flex justify-between"><span className="text-muted-foreground">{metric}:</span><span className="font-medium">{used}/{limit === -1 ? "∞" : limit}</span></div>
          )}
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-3 bg-gradient-to-r from-muted/60 to-muted/30">
            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Taqqoslash
            </div>
            {/* Current */}
            <div className="p-3 text-center border-l border-border">
              <Badge className={cn("text-[10px] uppercase mb-1", TIER_LABEL_COLOR[cur])}>
                Joriy: {cur}
              </Badge>
              <div className="text-xs text-muted-foreground">{formatPrice(curPlan?.price_uzs ?? 0)}</div>
            </div>
            {/* Required */}
            <div className="p-3 text-center border-l border-primary/30 bg-primary/5 relative">
              <div className="absolute top-0 right-2 -translate-y-1/2">
                <Badge className="text-[9px] bg-gradient-to-r from-primary to-purple-500 text-primary-foreground gap-1 px-1.5">
                  <Crown className="w-2.5 h-2.5" /> Tavsiya
                </Badge>
              </div>
              <Badge className={cn("text-[10px] uppercase mb-1", TIER_LABEL_COLOR[req])}>
                Kerak: {req}
              </Badge>
              <div className="text-xs font-semibold text-primary">{formatPrice(reqPlan?.price_uzs ?? null)}</div>
            </div>
          </div>

          {loading && (
            <div className="p-6 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>
          )}

          {!loading && (
            <>
              {/* Features section */}
              {allFeatures.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 border-y border-border">
                    Funksiyalar
                  </div>
                  {allFeatures.map((f) => {
                    const inCur = hasFeature(curPlan, f);
                    const inReq = hasFeature(reqPlan, f);
                    const isHighlighted = feature && f === feature;
                    return (
                      <div key={f} className={cn(
                        "grid grid-cols-3 text-sm border-b border-border last:border-b-0",
                        isHighlighted && "bg-amber-500/5"
                      )}>
                        <div className="p-2.5 text-foreground flex items-center gap-1.5 truncate">
                          {isHighlighted && <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />}
                          <span className="truncate">{f}</span>
                        </div>
                        <div className="p-2.5 text-center border-l border-border">
                          {inCur ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                          )}
                        </div>
                        <div className="p-2.5 text-center border-l border-primary/20 bg-primary/[0.03]">
                          {inReq ? (
                            <Check className="w-4 h-4 text-primary mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Limits section */}
              {allMetrics.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 border-y border-border">
                    Limitlar (oylik)
                  </div>
                  {allMetrics.map((m) => {
                    const cv = curPlan?.limits?.[m];
                    const rv = reqPlan?.limits?.[m];
                    const isHighlighted = metric && m === metric;
                    const better = (rv === -1) || (cv !== undefined && rv !== undefined && rv > cv);
                    return (
                      <div key={m} className={cn(
                        "grid grid-cols-3 text-sm border-b border-border last:border-b-0",
                        isHighlighted && "bg-amber-500/5"
                      )}>
                        <div className="p-2.5 text-foreground truncate">{m}</div>
                        <div className="p-2.5 text-center border-l border-border font-mono text-xs">
                          {cv === undefined ? "—" : formatLimit(cv)}
                        </div>
                        <div className={cn(
                          "p-2.5 text-center border-l border-primary/20 bg-primary/[0.03] font-mono text-xs font-semibold",
                          better ? "text-primary" : "text-foreground"
                        )}>
                          {rv === undefined ? "—" : formatLimit(rv)}
                          {better && <ArrowUpRight className="w-3 h-3 inline ml-0.5 text-emerald-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!allFeatures.length && !allMetrics.length && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Tarif ma'lumotlari topilmadi
                </div>
              )}
            </>
          )}
        </div>

        {/* Highlight diff bar */}
        <div className="rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/30 p-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-foreground">
            <b className="uppercase">{req}</b> tarifga o'tib{" "}
            <span className="text-primary font-semibold">
              {Math.max(0, (reqPlan?.features.length || 0) - (curPlan?.features.length || 0))} ta yangi funksiya
            </span>{" "}
            va kengaytirilgan limitlar yoqiladi.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <Link to={`/pricing?module=${moduleId}&tier=${req}`} onClick={onClose}>
            <Button className="w-full bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 gap-2 h-11 font-semibold shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)]">
              <Sparkles className="w-4 h-4" /> {req.toUpperCase()} tarifga o'tish <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            <X className="w-4 h-4 mr-1" /> Yopish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
