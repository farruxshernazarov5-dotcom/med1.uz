import { resolvePackagePrice, safeReturnUrl } from "../_shared/payment-guard.ts";
// Uzum Bank Merchant API payment link generator.
// Foydalanuvchi uchun platform_payments buyurtmasini yaratadi va Uzum Bank open-service havolasini qaytaradi.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSubscriptionContract } from "../_shared/subscription-contract.ts";
import { buildUzumPaymentUrl } from "../_shared/uzum-merchant.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function parseServiceId(raw: string | undefined): number | null {
  if (!raw) return null;
  const parsed = Number(raw.trim());
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await auth.auth.getClaims(token);
    if (!claims?.claims) return json(401, { error: "Unauthorized" });
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const rawAmount = Number(body?.amount);
    const purpose = String(body?.purpose || "ai_subscription");
    const reference_id = body?.reference_id ? String(body.reference_id) : null;
    const return_url = safeReturnUrl(body?.return_url);
    if (!return_url) return json(400, { error: "Qaytish manzili ruxsat etilmagan" });
    const environment = body?.environment === "sandbox" ? "sandbox" : "live";

    if (!rawAmount || rawAmount <= 0 || rawAmount > 100_000_000) return json(400, { error: "Noto'g'ri summa" });

    const liveServiceId = parseServiceId(Deno.env.get("UZUM_SERVICE_ID"));
    const sandboxServiceId = parseServiceId(Deno.env.get("UZUM_SERVICE_ID_SANDBOX")) ?? liveServiceId;
    const serviceId = environment === "sandbox" ? sandboxServiceId : liveServiceId;
    if (!serviceId) return json(503, { error: "Uzum Bank xizmat ID sozlanmagan" });

    const admin = createClient(supabaseUrl, serviceKey);
    const contractGate = await requireSubscriptionContract(admin, userId, purpose);
    if (!contractGate.allowed) {
      return json(403, {
        error: "Pullik obunadan oldin elektron shartnomani imzolash shart",
        code: "CONTRACT_REQUIRED",
        contract_slug: contractGate.slug,
      });
    }

    const packageCode = body?.package_code ? String(body.package_code) : null;
    const priced = await resolvePackagePrice(admin, packageCode, rawAmount);
    if (!priced.ok) return json(400, { error: priced.error });
    const amount = priced.amount;
    const pkg = priced.packageId ? { id: priced.packageId } : null;

    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: reuse } = await admin
      .from("platform_payments")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "uzum")
      .eq("purpose", purpose)
      .eq("amount", amount)
      .eq("status", "pending")
      .is("provider_transaction_id", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let payment = reuse as { id: string } | null;
    if (!payment) {
      const { data: created, error: payErr } = await admin
        .from("platform_payments")
        .insert({
          user_id: userId,
          provider: "uzum",
          amount,
          purpose,
          reference_id,
          package_id: pkg?.id ?? null,
          status: "pending",
          metadata: {
            return_url,
            environment,
            contract_id: body?.contract_id ? String(body.contract_id) : contractGate.contractId,
            package_code: packageCode,
            uzum_service_id: serviceId,
            org_id: body?.org_id ? String(body.org_id) : undefined,
            org_type: body?.org_type ? String(body.org_type) : undefined,
            org_name: body?.org_name ? String(body.org_name) : undefined,
          },
        })
        .select("id")
        .single();
      if (payErr) throw payErr;
      payment = created;
    } else if (pkg?.id) {
      await admin.from("platform_payments").update({ package_id: pkg.id }).eq("id", payment.id);
    }
    if (!payment) return json(500, { error: "To'lov buyurtmasi yaratilmadi" });

    const returnWithId = (() => {
      try {
        const u = new URL(return_url);
        u.searchParams.set("payment_id", payment.id);
        u.searchParams.set("provider", "uzum");
        return u.toString();
      } catch {
        const sep = return_url.includes("?") ? "&" : "?";
        return `${return_url}${sep}payment_id=${payment.id}&provider=uzum`;
      }
    })();

    const amountTiyin = Math.round(amount * 100);
    const checkout_url = buildUzumPaymentUrl({
      serviceId,
      paymentId: payment.id,
      amountTiyin,
      returnUrl: returnWithId,
    });

    return json(200, { ok: true, payment, checkout_url, amount_tiyin: amountTiyin, environment });
  } catch (err) {
    console.error("uzum-create-invoice error:", err);
    return json(500, { error: "Server xatolik" });
  }
});
