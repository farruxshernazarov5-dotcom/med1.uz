import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkoutUrl, clickEnv, validateClickConfig } from "../_shared/click.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const amount = Number(body?.amount);
    const purpose = String(body?.purpose || "ai_subscription");
    const reference_id = body?.reference_id ? String(body.reference_id) : null;
    const return_url = body?.return_url ? String(body.return_url) : "https://med1.uz/payment/success";

    if (!amount || amount <= 0 || amount > 100000000) {
      return new Response(JSON.stringify({ error: "Noto'g'ri summa" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const click = clickEnv();
    const configErrors = validateClickConfig(click).filter((issue) => issue.level === "error");
    if (configErrors.length > 0) {
      console.error("click-create-invoice configuration error", configErrors.map((issue) => issue.message));
      return new Response(JSON.stringify({ error: "Click konfiguratsiyasi to'liq emas" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: payment, error: payErr } = await admin
      .from("platform_payments")
      .insert({
        user_id: userId,
        provider: "click",
        amount,
        purpose,
        reference_id,
        status: "pending",
        metadata: { return_url },
      })
      .select()
      .single();

    if (payErr) throw payErr;

    // return_url ga payment_id qo'shamiz — success sahifasi polling qilishi uchun
    const returnWithId = (() => {
      try {
        const u = new URL(return_url);
        u.searchParams.set("payment_id", payment.id);
        u.searchParams.set("provider", "click");
        return u.toString();
      } catch {
        const sep = return_url.includes("?") ? "&" : "?";
        return `${return_url}${sep}payment_id=${payment.id}&provider=click`;
      }
    })();

    // Click checkout URL
    const checkout_url = checkoutUrl({
      serviceId: click.serviceId,
      merchantId: click.merchantId,
      amount,
      transactionParam: payment.id,
      returnUrl: returnWithId,
    });

    return new Response(JSON.stringify({ ok: true, payment, checkout_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("click-create-invoice error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Server xatolik" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
