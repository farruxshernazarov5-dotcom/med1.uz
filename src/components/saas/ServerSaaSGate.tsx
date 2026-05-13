import { useEffect, useState, ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import UpgradeModal from "./UpgradeModal";
import type { SaaSModuleId } from "@/hooks/useSaasPlan";

interface Props {
  moduleId: SaaSModuleId;
  feature: string;
  /** Tier needed to unlock — used to drive UpgradeModal comparison. */
  requiredTier?: string;
  /** Human-readable module name shown on the lock screen. */
  label?: string;
  children: ReactNode;
}

type State =
  | { status: "loading" }
  | { status: "ok" }
  | { status: "blocked"; reason: string; tier?: string }
  | { status: "error"; message: string };

/**
 * Server-side enforcement wrapper.
 * Calls the `saas-gate` edge function with the module + feature key.
 * If the server denies access, renders a lock screen with UpgradeModal.
 *
 * UI lock is cosmetic — this is the bypass-resistant gate.
 */
export const ServerSaaSGate = ({ moduleId, feature, requiredTier, label, children }: Props) => {
  const [state, setState] = useState<State>({ status: "loading" });
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("saas-gate", {
          body: { module: moduleId, feature },
        });
        if (cancelled) return;
        if (error) {
          // Edge function returns 402 when blocked — sdk surfaces it as an error
          // but `data` may still contain the payload.
          const reason = (data as any)?.reason || (error as any)?.context?.reason || "feature_blocked";
          const tier = (data as any)?.tier || "free";
          if (reason && reason !== "server_error" && reason !== "network_error") {
            setState({ status: "blocked", reason, tier });
          } else {
            setState({ status: "error", message: error.message || "Server xatosi" });
          }
          return;
        }
        if ((data as any)?.allowed) {
          setState({ status: "ok" });
        } else {
          setState({
            status: "blocked",
            reason: (data as any)?.reason || "feature_blocked",
            tier: (data as any)?.tier || "free",
          });
        }
      } catch (e: any) {
        if (cancelled) return;
        setState({ status: "error", message: String(e?.message || e) });
      }
    })();
    return () => { cancelled = true; };
  }, [moduleId, feature]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <ShieldAlert className="w-8 h-8 mx-auto text-destructive mb-2" />
        <p className="text-sm text-destructive font-medium">Tekshiruv xatosi</p>
        <p className="text-xs text-muted-foreground mt-1">{state.message}</p>
      </div>
    );
  }

  if (state.status === "blocked") {
    const reasonText: Record<string, string> = {
      feature_blocked: "Bu modul tarifingizda mavjud emas",
      limit_exceeded: "Tarifingiz limiti tugagan",
      expired: "Obunangiz muddati tugagan",
      no_subscription: "Obuna faollashtirilmagan",
      unauthorized: "Avtorizatsiya talab qilinadi",
    };
    return (
      <>
        <div className="rounded-3xl border border-amber-300/40 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/20 p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_18px,hsl(var(--primary)/0.04)_18px,hsl(var(--primary)/0.04)_19px)]" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-4 shadow-lg shadow-amber-500/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              🔒 Premium modul bloklangan
            </h2>
            <p className="text-base text-muted-foreground max-w-lg mx-auto mb-2">
              <span className="font-semibold text-foreground">{label || feature.toUpperCase()}</span> — {reasonText[state.reason] || "Foydalanish ruxsat etilmagan"}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Joriy tarif: <span className="font-bold uppercase">{state.tier || "free"}</span>
              {requiredTier && <> · Kerak: <span className="font-bold uppercase text-amber-600">{requiredTier}</span></>}
            </p>
            <Button
              size="lg"
              onClick={() => setUpgradeOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg gap-2"
            >
              💎 Tarifni yangilash
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4">
              Bu tekshiruv server tomonida amalga oshirildi — UI'ni chetlab o'tib bo'lmaydi.
            </p>
          </div>
        </div>
        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          reason={state.reason as any}
          moduleId={moduleId}
          feature={feature}
          currentTier={state.tier}
          requiredTier={requiredTier}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default ServerSaaSGate;
