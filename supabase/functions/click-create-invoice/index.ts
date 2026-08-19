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

    // Paketsiz (ad-hoc) to'lovlar: shifokor broni, klinika xizmati, SaaS, obuna, invoys va h.k.
    // purpose "prefix:reference" ko'rinishida bo'lishi mumkin — prefiks bo'yicha tekshiramiz.
    const ADHOC_PURPOSES = new Set([
      "doctor_appointment",
      "clinic_service",
      "clinic_invoice",
      "dental_invoice",
      "clinic_saas",
      "dental_saas",
      "diagnostics_saas",
      "pharmacy_saas",
      "maternity_saas",
      "cosmetology_saas",
      "subscription",
      "ai_subscription",
      "med_coin",
      "sandbox_test",
      "appointment",
      "other",
    ]);
    const rawAmount = Number(body?.amount);
    const adhocPurpose = body?.purpose ? String(body.purpose) : null;
    const purposePrefix = adhocPurpose ? adhocPurpose.split(":")[0] : null;
    const referenceId = body?.reference_id ? String(body.reference_id) : null;
    const isAdhoc = !packageCode && !packageId;

    if (isAdhoc) {
      if (!purposePrefix || !ADHOC_PURPOSES.has(purposePrefix)) {
        return json({ error: `Noto'g'ri to'lov maqsadi: ${adhocPurpose ?? "yo'q"}` }, 400);
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
    if (isAdhoc && purposePrefix === "doctor_appointment" && referenceId) {
      const { data: appt } = await admin
        .from("doctor_ext_appointments")
        .select("id, price")
        .eq("id", referenceId)
        .maybeSingle();
      if (appt?.price != null) amount = Number(appt.price);
    }
    if (!(amount > 0)) return json({ error: "Noto'g'ri to'lov summasi" }, 400);

    // Click checkout ikkita alohida identifikatorni qabul qiladi:
    // merchant_id = korxona/merchant ID, merchant_user_id = merchant foydalanuvchisi.
    // Ikkalasini ham o'z nomi bilan yuborish kerak. Click'ning hosted checkout ilovasi
    // merchant_user_id ni query'dan o'qib, internal checkout/prepare so'roviga uzatadi.
    const merchantId = Deno.env.get("CLICK_MERCHANT_ID");
    const merchantUserId = Deno.env.get("CLICK_MERCHANT_USER_ID");
    const serviceId = Deno.env.get("CLICK_SERVICE_ID");
    if (!merchantId || !merchantUserId || !serviceId) {
      return json({ error: "Click credentials sozlanmagan. Super Admin → Payments → Click." }, 503);
    }

    const { data: payment, error: payErr } = await admin
      .from("platform_payments")
      .insert({
        user_id: userId,
        provider: "click",
        amount,
        currency: pkg?.currency || "UZS",
        purpose: pkg ? (pkg.kind === "subscription" ? "ai_subscription" : "med_coin") : purposePrefix!,
        package_id: pkg?.id ?? null,
        reference_id: pkg?.code ?? referenceId,
        status: "pending",
        metadata: { return_url: returnUrl, package_code: pkg?.code ?? null, purpose: adhocPurpose, purpose_ref: referenceId },
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

    // Click hosted checkout parametrlarini URL API orqali yig'amiz. merchant_user_id
    // yetishmasa Click callbacklarimizga yetib kelmasdan "yetkazib beruvchi ma'lumoti
    // yetarli emas" deb rad etadi.
    const checkoutUrl = new URL("https://my.click.uz/services/pay");
    checkoutUrl.searchParams.set("service_id", serviceId);
    checkoutUrl.searchParams.set("merchant_id", merchantId);
    checkoutUrl.searchParams.set("merchant_user_id", merchantUserId);
    checkoutUrl.searchParams.set("amount", String(amount));
    checkoutUrl.searchParams.set("transaction_param", payment.id);
    checkoutUrl.searchParams.set("return_url", returnWithId);
    const checkout_url = checkoutUrl.toString();


    return json({
      ok: true,
      payment: { id: payment.id, amount: payment.amount, currency: payment.currency, status: payment.status },
      package: pkg
        ? { code: pkg.code, name: pkg.name_uz, coins: (pkg.coin_amount || 0) + (pkg.bonus_coins || 0) }
        : { code: null, name: adhocPurpose, coins: 0 },

      checkout_url,
    });
  } catch (err) {
    console.error("click-create-invoice error:", err);
    return json({ error: err instanceof Error ? err.message : "Server xatolik" }, 500);
  }
});
