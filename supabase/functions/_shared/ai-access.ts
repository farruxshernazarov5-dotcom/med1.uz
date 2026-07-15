import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AiAccessResult =
  | { allowed: true; userId: string; model: string; maxTokens: number; creditsDeducted: number; balanceAfter: number; bypass?: boolean; usageId?: string | null; channel: string }
  | { allowed: false; status: number; error: string };

/** Detect request channel from headers. Defaults to 'web'. */
export function getChannelFromRequest(req: Request): string {
  const explicit = (req.headers.get("x-med1-channel") || req.headers.get("X-Med1-Channel") || "").toLowerCase().trim();
  if (explicit) {
    const allowed = ["web", "hambi", "telegram", "api", "mobile_android", "mobile_ios"];
    if (allowed.includes(explicit)) return explicit;
  }
  const platform = (req.headers.get("x-supabase-client-platform") || "").toLowerCase();
  if (platform === "android") return "mobile_android";
  if (platform === "ios") return "mobile_ios";
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  if (ua.includes("hambi")) return "hambi";
  if (ua.includes("telegrambot") || ua.includes("tgwebapp")) return "telegram";
  return "web";
}

/** Compute approximate USD cost from token counts (uses AI_PRICING). */
export function computeCostUsd(promptTokens: number, completionTokens: number): number {
  const p = (promptTokens / 1_000_000) * AI_PRICING.promptPer1MTokens;
  const c = (completionTokens / 1_000_000) * AI_PRICING.completionPer1MTokens;
  return Number((p + c).toFixed(6));
}

/** Best-effort: update the ai_usage row created by deduct_ai_credits with final result fields. */
export async function recordAiUsageResult(usageId: string | null | undefined, params: {
  status?: "success" | "error" | "timeout" | "rate_limited" | "blocked";
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  tokensUsed?: number;
  costUsd?: number;
  errorCode?: string;
  errorMessage?: string;
  region?: string;
}): Promise<void> {
  if (!usageId) return;
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    await admin.rpc("update_ai_usage_result", {
      _usage_id: usageId,
      _status: params.status ?? null,
      _latency_ms: params.latencyMs ?? null,
      _prompt_tokens: params.promptTokens ?? null,
      _completion_tokens: params.completionTokens ?? null,
      _tokens_used: params.tokensUsed ?? ((params.promptTokens != null && params.completionTokens != null) ? (params.promptTokens + params.completionTokens) : null),
      _cost_usd: params.costUsd ?? null,
      _error_code: params.errorCode ?? null,
      _error_message: params.errorMessage ?? null,
      _region: params.region ?? null,
    });
  } catch (e) {
    console.warn("recordAiUsageResult failed", e);
  }
}

/** Create an ai_usage audit row for AI calls that do not use Med Coin deduction. */
export async function createAiUsageEvent(params: {
  userId: string;
  serviceId: string;
  req?: Request;
  channel?: string;
  model?: string;
  costCredits?: number;
  status?: "success" | "error" | "timeout" | "rate_limited" | "blocked";
}): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey || !params.userId) return null;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin
      .from("ai_usage")
      .insert({
        user_id: params.userId,
        service_id: params.serviceId,
        channel: params.channel ?? (params.req ? getChannelFromRequest(params.req) : "web"),
        model: params.model ?? null,
        cost_credits: params.costCredits ?? 0,
        status: params.status ?? "success",
      })
      .select("id")
      .single();
    if (error) {
      console.warn("createAiUsageEvent failed", error);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.warn("createAiUsageEvent failed", e);
    return null;
  }
}

/** Validate a bearer token and return the authenticated user id. */
export async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!supabaseUrl || !serviceRoleKey || !token) return null;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

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
  // Specialized (Narrow) AI modules — Medical Decision Support
  "ai-oncology": 25, "ai-diabetes": 5,
};

/**
 * TOKEN CAPS per credit tier — javob to'liq yakunlanishi uchun yetarli token.
 * Eski 150-token chegarasi javoblarni kesib qo'yardi; endi har bir Med Coin tarifi
 * o'ziga mos to'liq javob hajmiga ega.
 *
 *   1 Med Coin  → gemini-2.5-flash, 1500 output tokens (~1000 so'z)
 *   5 Med Coin  → gemini-2.5-flash, 3000 output tokens (~2000 so'z)
 *  25 Med Coin  → gemini-2.5-pro,   6000 output tokens (~4000 so'z)
 *
 * MED COIN HISOBI:
 * - Foydalanuvchi har bir AI so'rovi uchun aniq, oldindan e'lon qilingan miqdorda
 *   Med Coin to'laydi (SERVICE_CREDITS jadvali). Tokenga bog'liq emas.
 * - Tokenlar foydalanuvchidan emas, Lovable AI Gateway tomonidan provayderga
 *   (Google Gemini) to'lanadi. AI_PRICING ichida USD narx admin analitika uchun.
 */
/**
 * Har bir AI so'rovi uchun 300–350 token oralig'ida javob.
 * Hard cap = 350; tier modellari ham shu oraliqda ishlaydi.
 * Javob kesilmasligi uchun system prompt qisqa, yakunlangan javob talab qiladi.
 */
export const MAX_OUTPUT_TOKENS_HARD_CAP = 4096;
 export const MAX_INPUT_TOKENS = 8000;
 
 const TIER_MODELS: Record<number, { model: string; maxTokens: number }> = {
   1:  { model: "google/gemini-2.5-flash", maxTokens: 2048 },
   5:  { model: "google/gemini-2.5-flash", maxTokens: 4096 },
   25: { model: "google/gemini-2.5-pro",           maxTokens: 4096 },
 };
 
 /**
  * QISQA, LO'NDA va YAKUNLANGAN javob direktivasi.
  * Maqsad: 120–180 so'z ichida to'liq tugagan javob (kesilmaslik kafolati).
  */
 export const CONCISE_DIRECTIVE = `

📋 JAVOB QOIDASI (QAT'IY):
- Javob 120–180 so'z (≈250–400 token) ichida TO'LIQ YAKUNLANGAN bo'lsin.
- Salomlashish, kirish, "savolingizga javob beraman" kabi preambulalarni YOZMA — to'g'ridan-to'g'ri mazmunga o't.
- Maksimum 3–4 ta qisqa bullet. Har biri 1 jumla. ICD/lotincha nomlarni faqat zarur bo'lsa qisqa qavsda ber.
- Har bir gap to'liq tugashi shart. Agar joy kam bo'lsa — punktlarni kamaytir, lekin oxirgi gapni hech qachon yarim qoldirma.
- Oxirida albatta bitta qisqa ogohlantirish qatori bo'lsin, lekin uni TARGET_REPLY_LANGUAGE tiliga tarjima qil. Masalan ruscha javobda: "⚠️ Для точного диагноза обратитесь к врачу." Inglizcha javobda: "⚠️ Consult a doctor for an accurate diagnosis."`;

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
    return Math.max(200, Math.ceil(text.length / 3.8));
  } catch (_) {
    return 1000;
  }
}

export function aiUsageHeaders(serviceId: string, access: Extract<AiAccessResult, { allowed: true }>, estimatedTokens: number) {
  const estimatedCostUsd = (estimatedTokens / 1_000_000) * AI_PRICING.blendedPer1MTokens;
  return {
    "X-Med1-AI-Service": serviceId,
    "X-Med1-AI-Model": access.model,
    "X-Med1-AI-Credits": String(access.creditsDeducted),
    "X-Med1-AI-Test-Mode": access.bypass ? "super-admin" : "false",
    "X-Med1-AI-Estimated-Tokens": String(estimatedTokens),
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
    const channel = getChannelFromRequest(req);

    /* ─── ADMIN BYPASS: super admins test AI without credits ─── */
    try {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (isAdmin === true) {
        // Still log a row so analytics include admin/test traffic
        let usageId: string | null = null;
        try {
          const { data: ins } = await admin
            .from("ai_usage")
            .insert({ user_id: userId, service_id: serviceId, channel, model, cost_credits: 0, status: "success" })
            .select("id")
            .single();
          usageId = ins?.id ?? null;
        } catch (_) { /* best-effort */ }
        return { allowed: true, userId, model, maxTokens, creditsDeducted: 0, balanceAfter: -1, bypass: true, usageId, channel };
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
      _user_id: userId, _service_id: serviceId, _cost: creditCost, _channel: channel, _model: model,
    });

    if (deductErr) {
      console.error("deduct_ai_credits error", deductErr);
      return { allowed: false, status: 500, error: "Kredit yechishda xatolik" };
    }

    const row = Array.isArray(deductData) ? deductData[0] : deductData;
    if (!row?.success) {
      return { allowed: false, status: 402, error: row?.error || "Kredit yetarli emas" };
    }

    return { allowed: true, userId, model, maxTokens, creditsDeducted: creditCost, balanceAfter: row.balance_after, usageId: row.usage_id ?? null, channel };
  } catch (error) {
    console.error("enforceAiAccess error", error);
    return { allowed: false, status: 500, error: "AI kirishni tekshirishda xatolik" };
  }
}
