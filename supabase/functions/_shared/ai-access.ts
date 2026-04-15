import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AiAccessResult =
  | { allowed: true; userId: string; model: string; maxTokens: number; creditsDeducted: number; balanceAfter: number }
  | { allowed: false; status: number; error: string };

/* ─── Credit costs per service ─── */
const SERVICE_CREDITS: Record<string, number> = {
  "ai-dietolog": 1, "ai-fitness": 1, "ai-health-assistant": 1,
  "ai-baby-care": 1, "ai-farmatsevt": 1,
  "ai-doctor-chat": 5, "symptom-checker": 5, "ai-psixolog": 5,
  "ai-pregnancy": 5, "ai-health-risk": 5,
  "ai-radiology": 25, "ai-report-analysis": 25,
  "ai-cosmetology": 25, "ai-vital-signs": 25,
};

/* ─── Model per cost tier ─── */
const TIER_MODELS: Record<number, { model: string; maxTokens: number }> = {
  1:  { model: "google/gemini-3-flash-preview",       maxTokens: 2048 },
  5:  { model: "google/gemini-3.1-pro-preview",       maxTokens: 4096 },
  25: { model: "google/gemini-3-pro-image-preview",   maxTokens: 4096 },
};

function getModelForCost(cost: number) {
  return TIER_MODELS[cost] || TIER_MODELS[5];
}

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
    const now = new Date();
    const nowIso = now.toISOString();
    const creditCost = SERVICE_CREDITS[serviceId] ?? 5;

    /* ─── Get active (non-expired) credit balance ─── */
    const { data: credits } = await admin
      .from("user_credits")
      .select("id, balance, expires_at")
      .eq("user_id", userId)
      .gt("expires_at", nowIso)
      .gt("balance", 0)
      .order("expires_at", { ascending: true })
      .limit(10);

    const totalBalance = (credits || []).reduce((sum, c) => sum + (c.balance || 0), 0);

    if (totalBalance < creditCost) {
      return {
        allowed: false,
        status: 402,
        error: `Kredit yetarli emas. Kerak: ${creditCost} kredit, Balans: ${totalBalance}. Kredit sotib oling.`,
      };
    }

    /* ─── Deduct credits (FIFO by expiry) ─── */
    let remaining = creditCost;
    for (const credit of (credits || [])) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, credit.balance);
      await admin
        .from("user_credits")
        .update({ balance: credit.balance - deduct, updated_at: nowIso })
        .eq("id", credit.id);
      remaining -= deduct;
    }

    const balanceAfter = totalBalance - creditCost;

    /* ─── Record in credit_history ─── */
    await admin.from("credit_history").insert({
      user_id: userId,
      amount: -creditCost,
      type: "deduct",
      service_id: serviceId,
      description: `${serviceId} xizmatidan foydalanish`,
      balance_after: balanceAfter,
    });

    /* ─── Record in ai_usage ─── */
    const today = nowIso.slice(0, 10);
    await admin.from("ai_usage").insert({
      user_id: userId,
      service_id: serviceId,
      usage_date: today,
    });

    const { model, maxTokens } = getModelForCost(creditCost);

    return { allowed: true, userId, model, maxTokens, creditsDeducted: creditCost, balanceAfter };
  } catch (error) {
    console.error("enforceAiAccess error", error);
    return { allowed: false, status: 500, error: "AI kirishni tekshirishda xatolik" };
  }
}
