// Click checkout yaratish — summa HAR DOIM server tomonda payment_packages'dan olinadi.
// Frontend faqat package_id yuboradi (fraud himoyasi).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !authData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = authData.user.id;

    const body = await req.json().catch(() => ({}));
    const packageCode = body?.package_code ? String(body.package_code) : null;
    const packageId = body?.package_id ? String(body.package_id) : null;
    const returnUrl = body?.return_url ? String(body.return_url) : "https://med1.uz/payment/success";

    // Paketsiz (ad-hoc) to'lovlar: shifokor broni, klinika xizmati, SaaS va h.k.
    const ADHOC_PURPOSES = new Set([
      "doctor_appointment",
      "clinic_service",
      "clinic_saas",
      "dental_saas",
      "appointment",
      "other",
    ]);
    const rawAmount = Number(body?.amount);
    const adhocPurpose = body?.purpose ? String(body.purpose) : null;
    const referenceId = body?.reference_id ? String(body.reference_id) : null;
    const isAdhoc = !packageCode && !packageId;

    if (isAdhoc) {
      if (!adhocPurpose || !ADHOC_PURPOSES.has(adhocPurpose)) {
        return json({ error: "package_code, package_id yoki to'g'ri purpose talab qilinadi" }, 400);
      }
      if (!Number.isFinite(rawAmount) || rawAmount <= 0 || rawAmount > 500_000_000) {
        return json({ error: "Noto'g'ri to'lov summasi" }, 400);
      }
    }

    let pkg: Record<string, any> | null = null;
    if (!isAdhoc) {
      const q = admin.from("payment_packages").select("*").eq("is_active", true);
      const { data } = packageId
        ? await q.eq("id", packageId).maybeSingle()
        : await q.eq("code", packageCode!).maybeSingle();
      pkg = data;
      if (!pkg) return json({ error: "Paket topilmadi yoki faol emas" }, 404);
    }

    // Shifokor broni bo'lsa — narx server tomonda tekshiriladi (fraud himoyasi)
    let amount = isAdhoc ? Math.round(rawAmount) : Number(pkg!.price);
    if (isAdhoc && adhocPurpose === "doctor_appointment" && referenceId) {
      const { data: appt } = await admin
        .from("doctor_ext_appointments")
        .select("id, price")
        .eq("id", referenceId)
        .maybeSingle();
      if (appt?.price != null) amount = Number(appt.price);
    }
    if (!(amount > 0)) return json({ error: "Noto'g'ri to'lov summasi" }, 400);

    const merchantId = Deno.env.get("CLICK_MERCHANT_ID");
    const serviceId = Deno.env.get("CLICK_SERVICE_ID");
    if (!merchantId || !serviceId) {
      return json({ error: "Click credentials sozlanmagan. Super Admin → Payments → Click." }, 503);
    }

    const { data: payment, error: payErr } = await admin
      .from("platform_payments")
      .insert({
        user_id: userId,
        provider: "click",
        amount,
        currency: pkg?.currency || "UZS",
        purpose: pkg ? (pkg.kind === "subscription" ? "ai_subscription" : "med_coin") : adhocPurpose!,
        package_id: pkg?.id ?? null,
        reference_id: pkg?.code ?? referenceId,
        status: "pending",
        metadata: { return_url: returnUrl, package_code: pkg?.code ?? null, purpose: adhocPurpose },
      })
      .select()
      .single();

    if (payErr) throw payErr;


    const returnWithId = (() => {
      try {
        const u = new URL(returnUrl);
        u.searchParams.set("payment_id", payment.id);
        u.searchParams.set("provider", "click");
        return u.toString();
      } catch {
        const sep = returnUrl.includes("?") ? "&" : "?";
        return `${returnUrl}${sep}payment_id=${payment.id}&provider=click`;
      }
    })();

    const checkout_url =
      `https://my.click.uz/services/pay?service_id=${encodeURIComponent(serviceId)}` +
      `&merchant_id=${encodeURIComponent(merchantId)}` +
      `&amount=${pkg.price}` +
      `&transaction_param=${payment.id}` +
      `&return_url=${encodeURIComponent(returnWithId)}`;

    return json({
      ok: true,
      payment: { id: payment.id, amount: payment.amount, currency: payment.currency, status: payment.status },
      package: { code: pkg.code, name: pkg.name_uz, coins: pkg.coin_amount + pkg.bonus_coins },
      checkout_url,
    });
  } catch (err) {
    console.error("click-create-invoice error:", err);
    return json({ error: err instanceof Error ? err.message : "Server xatolik" }, 500);
  }
});
