import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AiAccessResult =
  | { allowed: true; userId: string; planId: string }
  | { allowed: false; status: number; error: string };

/* ─── Qat'iy kunlik limitlar (plan_id → limit) ─── */
const DAILY_LIMITS: Record<string, number> = {
  // Individual plans
  free: 1,
  starter: 10,

  // Clinic plans
  "clinic-starter": 10,
  "clinic-pro": 50,
  "clinic-enterprise": -1,

  // Diagnostics plans
  "diag-starter": 15,
  "diag-pro": 100,
  "diag-enterprise": -1,

  // Pharmacy plans
  "pharm-starter": 20,
  "pharm-pro": 80,
  "pharm-enterprise": -1,

  // Emergency plans
  "emer-starter": 30,
  "emer-pro": 150,
  "emer-enterprise": -1,

  // Cosmetology plans
  "cosm-starter": 10,
  "cosm-pro": 50,
  "cosm-enterprise": -1,
};

/* Enterprise / unlimited reja'lar */
const UNLIMITED_PLANS = new Set([
  "professional", "family", "custom", "ai-pro", "premium",
  "clinic-enterprise", "diag-enterprise", "pharm-enterprise",
  "emer-enterprise", "cosm-enterprise",
]);

export async function enforceAiAccess(req: Request, serviceId: string): Promise<AiAccessResult> {
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
      .select("plan_id, services, status, expires_at, created_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const planId = String(subscription?.plan_id || "free").toLowerCase();
    const selectedServices = Array.isArray(subscription?.services)
      ? subscription.services.map((s: string) => String(s).toLowerCase())
      : [];

    /* ─── Xizmat tekshiruvi ─── */
    if (selectedServices.length > 0 && !selectedServices.includes(serviceId.toLowerCase())) {
      return {
        allowed: false,
        status: 403,
        error: "Ushbu AI xizmat sizning joriy tarifingizga kirmaydi",
      };
    }

    /* ─── Kunlik limit tekshiruvi ─── */
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

    /* ─── Foydalanishni qayd etish ─── */
    const { error: usageInsertError } = await admin.from("ai_usage").insert({
      user_id: userId,
      service_id: serviceId,
      usage_date: today,
    });

    if (usageInsertError) {
      console.error("ai_usage insert error", usageInsertError);
      return { allowed: false, status: 500, error: "So'rovni qayd etishda xatolik" };
    }

    return { allowed: true, userId, planId };
  } catch (error) {
    console.error("enforceAiAccess error", error);
    return { allowed: false, status: 500, error: "AI kirishni tekshirishda xatolik" };
  }
}
