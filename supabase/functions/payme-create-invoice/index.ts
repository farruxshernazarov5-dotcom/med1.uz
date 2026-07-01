// Payme (Paycom) checkout URL generator.
// Foydalanuvchi uchun to'lov invoice yaratadi va Payme checkout URL qaytaradi.
// URL formati: https://checkout.paycom.uz/base64(m=MERCHANT;ac.order_id=UUID;a=AMOUNT_TIYIN;c=RETURN_URL)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json(401, { error: "Unauthorized" });
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const purpose = String(body?.purpose || "ai_subscription");
    const reference_id = body?.reference_id ? String(body.reference_id) : null;
    const return_url = body?.return_url ? String(body.return_url) : "https://med1.uz/payment/success";
    const environment = body?.environment === "sandbox" ? "sandbox" : "live";

    if (!amount || amount <= 0 || amount > 100_000_000) {
      return json(400, { error: "Noto'g'ri summa" });
    }

    const merchantId =
      environment === "sandbox"
        ? Deno.env.get("PAYME_MERCHANT_ID_SANDBOX") || Deno.env.get("PAYME_MERCHANT_ID")
        : Deno.env.get("PAYME_MERCHANT_ID");
    if (!merchantId) return json(500, { error: "Payme merchant sozlanmagan" });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: payment, error: payErr } = await admin
      .from("platform_payments")
      .insert({
        user_id: userId,
        provider: "payme",
        amount,
        purpose,
        reference_id,
        status: "pending",
        metadata: { return_url, environment },
      })
      .select()
      .single();
    if (payErr) throw payErr;

    const returnWithId = (() => {
      try {
        const u = new URL(return_url);
        u.searchParams.set("payment_id", payment.id);
        u.searchParams.set("provider", "payme");
        return u.toString();
      } catch {
        const sep = return_url.includes("?") ? "&" : "?";
        return `${return_url}${sep}payment_id=${payment.id}&provider=payme`;
      }
    })();

    // Payme summani tiyinda kutadi (1 so'm = 100 tiyin)
    const amountTiyin = Math.round(amount * 100);
    const params = `m=${merchantId};ac.order_id=${payment.id};a=${amountTiyin};c=${returnWithId}`;
    const encoded = btoa(params);
    const host = environment === "sandbox" ? "https://test.paycom.uz" : "https://checkout.paycom.uz";
    const checkout_url = `${host}/${encoded}`;

    return json(200, { ok: true, payment, checkout_url, environment });
  } catch (err) {
    console.error("payme-create-invoice error:", err);
    return json(500, { error: err instanceof Error ? err.message : "Server xatolik" });
  }
});
