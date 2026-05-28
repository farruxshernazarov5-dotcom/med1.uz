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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Sessiya yaroqsiz" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // SECURITY: This endpoint must NOT be callable by regular users — it would let them
    // grant themselves arbitrary credits for free. Only admins may insert credits directly;
    // normal purchases must come through a payment webhook (Click/Payme) using service role.
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({
        error: "Kreditlarni xarid qilish faqat to'lov webhook orqali mumkin. Iltimos, to'lovni amalga oshiring.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { package_id, amount, credits, bonus, target_user_id } = await req.json();

    if (!package_id || typeof amount !== "number" || typeof credits !== "number") {
      return new Response(JSON.stringify({ error: "To'lov ma'lumotlari to'liq emas" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Admin may target a specific user; default = self
    const recipientUserId = target_user_id || userId;

    const totalCredits = credits + (bonus || 0);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Add credits
    // Add credits to the recipient
    const { error: creditError } = await admin.from("user_credits").insert({
      user_id: recipientUserId,
      balance: totalCredits,
      purchased_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      package_name: package_id,
    });

    if (creditError) throw creditError;

    // Record in history
    const { data: allCredits } = await admin
      .from("user_credits")
      .select("balance")
      .eq("user_id", recipientUserId)
      .gt("expires_at", now.toISOString())
      .gt("balance", 0);

    const totalBalance = (allCredits || []).reduce((sum, c) => sum + c.balance, 0);

    await admin.from("credit_history").insert({
      user_id: recipientUserId,
      amount: totalCredits,
      type: "purchase",
      description: `${package_id} paket sotib olish (${credits} + ${bonus || 0} bonus)`,
      balance_after: totalBalance,
    });

    // Record payment
    const invoiceId = `CRD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await admin.from("ai_payments").insert({
      user_id: recipientUserId,
      invoice_id: invoiceId,
      plan_id: package_id,
      billing_period: "one-time",
      amount,
      services: [],
      payment_method: "admin_grant",
      status: "paid",
      paid_at: now.toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      credits_added: totalCredits,
      total_balance: totalBalance,
      expires_at: expiresAt.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("purchase-credits error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
