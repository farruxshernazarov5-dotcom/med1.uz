import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AiAccessResult =
  | { allowed: true; userId: string; model: string; maxTokens: number; creditsDeducted: number; balanceAfter: number; bypass?: boolean }
  | { allowed: false; status: number; error: string };

export const AI_PRICING = {
  promptPer1MTokens: 0.15,
  completionPer1MTokens: 0.60,
  blendedPer1MTokens: 0.30,
};

/* ─── Credit costs per service ─── */
/* ─── Coin (Sog'liq Tangasi) costs per service — synced with src/data/aiTariffs.ts ─── */
const SERVICE_CREDITS: Record<string, number> = {
  "ai-dietolog": 1, "ai-fitness": 1, "ai-health-assistant": 1,
  "ai-baby-care": 1, "ai-farmatsevt": 1,
  "ai-doctor-chat": 1,
  "symptom-checker": 5, "ai-psixolog": 5, "ai-pregnancy": 5, "ai-health-risk": 5,
  "ai-radiology": 25, "ai-report-analysis": 25,
  "ai-cosmetology": 25, "ai-vital-signs": 25,
};

/**
 * STRICT TOKEN CAPS — every AI response must stay within 150 output tokens.
 * Callers MUST pass `max_completion_tokens: access.maxTokens` to the gateway.
 * If a response exceeds 150 tokens, a `warn`-level entry is written to
 * `security_debug_log` and admin banner is triggered.
 */
export const MAX_OUTPUT_TOKENS_HARD_CAP = 150;
export const TARGET_REQUEST_TOKENS_MIN = 100;
export const TARGET_REQUEST_TOKENS_MAX = 150;
export const MAX_OUTPUT_TOKENS_PER_RESPONSE = 110;
export const MAX_INPUT_TOKENS = 40;

const TIER_MODELS: Record<number, { model: string; maxTokens: number }> = {
  1:  { model: "google/gemini-2.5-flash-lite", maxTokens: MAX_OUTPUT_TOKENS_PER_RESPONSE },
  5:  { model: "google/gemini-2.5-flash-lite", maxTokens: MAX_OUTPUT_TOKENS_PER_RESPONSE },
  25: { model: "google/gemini-2.5-flash",      maxTokens: MAX_OUTPUT_TOKENS_PER_RESPONSE },
};

/** Universal directive appended to every system prompt — STRICT 3 bullet, 150-token format. */
export const CONCISE_DIRECTIVE = `

🔒 TOKEN TEJASH QOIDASI (MAJBURIY):
- Javob 2–3 ta juda qisqa bullet bo'lsin, jami 60–90 so'zdan oshmasin.
- Kirish so'zi, takror, uzun sarlavha, jadval va batafsil ro'yxat yozma.
- Faqat foydalanuvchi savoliga eng zarur javobni ber.
- Oxirgi bullet qisqa ogohlantirish bo'lsin: "⚠️ Shifokorga murojaat qiling."`;

/**
 * Log a token-overage warning to `security_debug_log` so the admin banner can pick it up.
 * Safe to call from any edge function (uses service role).
 */
export async function logTokenOverage(params: {
  serviceId: string;
  userId: string;
  outputTokens: number;
  model: string;
}) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    await admin.rpc("insert_security_log", {
      _scope: "ai-token-cap",
      _level: "warn",
      _message: `Token limit 150 oshib ketdi: ${params.outputTokens} token (${params.serviceId})`,
      _endpoint: `/functions/v1/${params.serviceId}`,
      _query_text: null,
      _column_name: "max_completion_tokens",
      _user_id: params.userId,
      _metadata: {
        service: params.serviceId,
        output_tokens: params.outputTokens,
        cap: MAX_OUTPUT_TOKENS_HARD_CAP,
        model: params.model,
      },
    });
  } catch (e) {
    console.warn("logTokenOverage failed", e);
  }
}

export function estimateTokensFromMessages(messages: unknown): number {
  try {
    const text = JSON.stringify(messages ?? "");
    return Math.ceil(text.length / 4);
  } catch (_) {
    return 100;
  }
}

export function estimateTokensFromText(text: unknown): number {
  return Math.ceil(String(text ?? "").length / 4);
}

export function aiUsageHeaders(serviceId: string, access: Extract<AiAccessResult, { allowed: true }>, estimatedTokens: number) {
  const estimatedCostUsd = (estimatedTokens / 1_000_000) * AI_PRICING.blendedPer1MTokens;
  return {
    "X-Med1-AI-Service": serviceId,
    "X-Med1-AI-Model": access.model,
    "X-Med1-AI-Credits": String(access.creditsDeducted),
    "X-Med1-AI-Test-Mode": access.bypass ? "super-admin" : "false",
    "X-Med1-AI-Estimated-Tokens": String(estimatedTokens),
    "X-Med1-AI-Output-Token-Cap": String(access.maxTokens),
    "X-Med1-AI-Target-Total-Tokens": `${TARGET_REQUEST_TOKENS_MIN}-${TARGET_REQUEST_TOKENS_MAX}`,
    "X-Med1-AI-Estimated-Cost-Usd": estimatedCostUsd.toFixed(6),
  };
}

function getModelForCost(cost: number) {
  return TIER_MODELS[cost] || TIER_MODELS[5] || TIER_MODELS[1];
}


export function getServiceCost(serviceId: string): number {
  return SERVICE_CREDITS[serviceId] ?? 2;
}

/**
 * Refund credits for a failed AI call. Safe to call after enforceAiAccess succeeded.
 */
export async function refundAiCredits(userId: string, serviceId: string, cost: number, reason = "AI failure") {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    await admin.rpc("refund_ai_credits", {
      _user_id: userId, _service_id: serviceId, _cost: cost, _reason: reason,
    });
  } catch (e) {
    console.error("refundAiCredits failed", e);
  }
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
    const creditCost = SERVICE_CREDITS[serviceId] ?? 2;
    const { model, maxTokens } = getModelForCost(creditCost);

    /* ─── ADMIN BYPASS: super admins test AI without credits ─── */
    try {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (isAdmin === true) {
        return { allowed: true, userId, model, maxTokens, creditsDeducted: 0, balanceAfter: -1, bypass: true };
      }
    } catch (_) { /* ignore */ }

    /* ─── Plan-based limits ─── */
    try {
      const { data: accessRows } = await admin.rpc("get_user_ai_access", { _user_id: userId });
      const access = Array.isArray(accessRows) ? accessRows[0] : accessRows;
      if (access) {
        const allowed = (access.allowed_services as string[]) || [];
        if (allowed.length > 0 && !allowed.includes(serviceId)) {
          return { allowed: false, status: 403, error: `Bu xizmat sizning tarifingizda mavjud emas (${access.tier}). Tarifni yangilang.` };
        }
        if (typeof access.used_today === "number" && typeof access.daily_limit === "number" && access.used_today >= access.daily_limit) {
          return { allowed: false, status: 429, error: `Bugungi limit tugadi (${access.used_today}/${access.daily_limit}).` };
        }
        if (typeof access.used_month === "number" && typeof access.monthly_limit === "number" && access.used_month >= access.monthly_limit) {
          return { allowed: false, status: 429, error: `Oylik limit tugadi (${access.used_month}/${access.monthly_limit}).` };
        }
      }
    } catch (planErr) {
      console.warn("Plan access check skipped:", planErr);
    }

    /* ─── Atomic deduction via RPC (race-condition safe) ─── */
    const { data: deductData, error: deductErr } = await admin.rpc("deduct_ai_credits", {
      _user_id: userId, _service_id: serviceId, _cost: creditCost,
    });

    if (deductErr) {
      console.error("deduct_ai_credits error", deductErr);
      return { allowed: false, status: 500, error: "Kredit yechishda xatolik" };
    }

    const row = Array.isArray(deductData) ? deductData[0] : deductData;
    if (!row?.success) {
      return { allowed: false, status: 402, error: row?.error || "Kredit yetarli emas" };
    }

    return { allowed: true, userId, model, maxTokens, creditsDeducted: creditCost, balanceAfter: row.balance_after };
  } catch (error) {
    console.error("enforceAiAccess error", error);
    return { allowed: false, status: 500, error: "AI kirishni tekshirishda xatolik" };
  }
}
