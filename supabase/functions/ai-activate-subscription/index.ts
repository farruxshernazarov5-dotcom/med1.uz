import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return new Response(JSON.stringify({ error: "Tizimga kirish talab qilinadi" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Sessiya yaroqsiz" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // SECURITY: This endpoint must NOT be callable by regular users — it would let them
    // self-activate premium subscriptions for free. Only admins (or the payment webhook
    // using service role) may activate subscriptions here.
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({
        error: "Obunani faollashtirish faqat to'lov webhook orqali mumkin. Iltimos, to'lovni amalga oshiring.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { invoice_id, plan_id, billing_period, amount, services, tier } = await req.json();

    if (!invoice_id || !plan_id || !billing_period || typeof amount !== "number") {
      return new Response(JSON.stringify({ error: "To'lov ma'lumotlari to'liq emas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side lookup: never trust client-supplied amount/tier/services for free plans
    const { data: planRow } = await admin
      .from("ai_subscription_plans")
      .select("id, tier, price_monthly, price_yearly, allowed_services")
      .eq("id", plan_id)
      .maybeSingle();
    if (!planRow) {
      return new Response(JSON.stringify({ error: "Tarif topilmadi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const expectedAmount = billing_period === "yearly" ? Number(planRow.price_yearly) : Number(planRow.price_monthly);
    if (Number(amount) < expectedAmount) {
      return new Response(JSON.stringify({ error: "Noto'g'ri to'lov summasi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    if (billing_period === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    await admin
      .from("ai_subscriptions")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("user_id", userId)
      .eq("status", "active");

    const { error: paymentError } = await admin
      .from("ai_payments")
      .insert({
        user_id: userId,
        invoice_id,
        plan_id,
        billing_period,
        amount,
        services: Array.isArray(services) ? services : [],
        payment_method: "simulated",
        status: "paid",
        paid_at: now.toISOString(),
      });

    if (paymentError) throw paymentError;

    const resolvedTier = tier || plan_id || "free";
    const tierLimits: Record<string, { text: number; image: number }> = {
      free: { text: 1, image: 0 }, lite: { text: 20, image: 0 },
      standard: { text: 50, image: 5 }, premium: { text: 100, image: 15 },
    };
    const limits = tierLimits[resolvedTier] || tierLimits.free;

    const { data: subscription, error: subError } = await admin
      .from("ai_subscriptions")
      .insert({
        user_id: userId,
        plan_id,
        tier: resolvedTier,
        billing_period,
        services: Array.isArray(services) ? services : [],
        status: "active",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        daily_text_limit: limits.text,
        daily_image_limit: limits.image,
      })
      .select("id, plan_id, tier, billing_period, status, started_at, expires_at, services")
      .single();

    if (subError) throw subError;

    return new Response(JSON.stringify({ success: true, subscription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-activate-subscription error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
