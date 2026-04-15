import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { routeModel } from "./ai-router.ts";

export type AiAccessResult =
  | { allowed: true; userId: string; planId: string; tier: string; model: string; maxTokens: number }
  | { allowed: false; status: number; error: string };

/* ─── Tier-based daily limits ─── */
const TIER_DAILY_LIMITS: Record<string, { text: number; image: number }> = {
  free:     { text: 1,   image: 0 },
  lite:     { text: 20,  image: 0 },
  standard: { text: 50,  image: 5 },
  premium:  { text: 100, image: 15 },
};

/* ─── Legacy plan limits (backward compat) ─── */
const DAILY_LIMITS: Record<string, number> = {
  free: 1, starter: 10,
  "clinic-starter": 10, "clinic-pro": 50, "clinic-enterprise": -1,
  "diag-starter": 15, "diag-pro": 100, "diag-enterprise": -1,
  "pharm-starter": 20, "pharm-pro": 80, "pharm-enterprise": -1,
  "emer-starter": 30, "emer-pro": 150, "emer-enterprise": -1,
  "cosm-starter": 10, "cosm-pro": 50, "cosm-enterprise": -1,
};

const UNLIMITED_PLANS = new Set([
  "professional", "family", "custom", "ai-pro", "premium",
  "clinic-enterprise", "diag-enterprise", "pharm-enterprise",
  "emer-enterprise", "cosm-enterprise",
]);

/* ─── Lite tier services ─── */
const LITE_SERVICES = new Set(["ai-dietolog", "ai-farmatsevt", "ai-fitness", "ai-vital-signs"]);
const STANDARD_SERVICES = new Set([
  ...LITE_SERVICES,
  "symptom-checker", "ai-doctor-chat", "ai-health-risk", "ai-health-assistant",
  "ai-psixolog", "ai-pregnancy", "ai-baby-care", "ai-cosmetology",
]);

function isServiceInTier(serviceId: string, tier: string): boolean {
  if (tier === "premium" || tier === "professional" || tier === "family") return true;
  if (tier === "standard") return STANDARD_SERVICES.has(serviceId);
  if (tier === "lite") return LITE_SERVICES.has(serviceId);
  return true; // free gets 1 request to any service
}

export async function enforceAiAccess(req: Request, serviceId: string, requestType: "text" | "image" = "text"): Promise<AiAccessResult> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return { allowed: false, status: 500, error: "Backend sozlamalarida xatolik bor" };
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return { allowed: false, status: 401, error: "AI xizmatdan foydalanish uchun tizimga kiring" };
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await admin.auth.getUser(token);

    if (authError || !authData?.user) {
      return { allowed: false, status: 401, error: "Sessiya yaroqsiz, qayta kiring" };
    }

    const userId = authData.user.id;
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    const { data: subscription } = await admin
      .from("ai_subscriptions")
      .select("plan_id, tier, services, status, expires_at, created_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tier = String(subscription?.tier || "free").toLowerCase();
    const planId = String(subscription?.plan_id || "free").toLowerCase();
    const selectedServices = Array.isArray(subscription?.services)
      ? subscription.services.map((s: string) => String(s).toLowerCase())
      : [];

    /* ─── Service access check ─── */
    if (selectedServices.length > 0 && !selectedServices.includes(serviceId.toLowerCase())) {
      return { allowed: false, status: 403, error: "Ushbu AI xizmat sizning joriy tarifingizga kirmaydi" };
    }

    if (tier !== "free" && !isServiceInTier(serviceId, tier)) {
      return { allowed: false, status: 403, error: `Ushbu xizmat ${tier.toUpperCase()} tarifiga kirmaydi. Tarifni yangilang.` };
    }

    /* ─── Daily limit check ─── */
    const tierLimits = TIER_DAILY_LIMITS[tier];
    if (tierLimits) {
      const limit = requestType === "image" ? tierLimits.image : tierLimits.text;
      if (limit === 0 && requestType === "image") {
        return { allowed: false, status: 403, error: "Rasm tahlili sizning tarifingizda mavjud emas" };
      }

      const { count: dailyUsage } = await admin
        .from("ai_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("service_id", serviceId)
        .eq("usage_date", today);

      if ((dailyUsage || 0) >= limit) {
        return {
          allowed: false,
          status: 429,
          error: `Bugungi limit tugadi (${limit} ta). Tarifni yangilang yoki ertaga urinib ko'ring`,
        };
      }
    } else {
      // Legacy plan limits
      const limit = DAILY_LIMITS[planId] ?? DAILY_LIMITS.free ?? 1;
      const isUnlimited = UNLIMITED_PLANS.has(planId) || limit === -1;

      if (!isUnlimited) {
        const { count: dailyUsage } = await admin
          .from("ai_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("service_id", serviceId)
          .eq("usage_date", today);

        if ((dailyUsage || 0) >= limit) {
          return {
            allowed: false,
            status: 429,
            error: `Bugungi limit tugadi (${limit} ta). Tarifni yangilang yoki ertaga urinib ko'ring`,
          };
        }
      }
    }

    /* ─── Record usage ─── */
    const { error: usageInsertError } = await admin.from("ai_usage").insert({
      user_id: userId,
      service_id: serviceId,
      usage_date: today,
    });

    if (usageInsertError) {
      console.error("ai_usage insert error", usageInsertError);
      return { allowed: false, status: 500, error: "So'rovni qayd etishda xatolik" };
    }

    /* ─── Route to correct model ─── */
    const { model, maxTokens } = routeModel(tier, requestType);

    return { allowed: true, userId, planId, tier, model, maxTokens };
  } catch (error) {
    console.error("enforceAiAccess error", error);
    return { allowed: false, status: 500, error: "AI kirishni tekshirishda xatolik" };
  }
}
