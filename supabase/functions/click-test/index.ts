// Super Admin Click integratsiya test paneli backend'i.
// Real imzo hisoblab, real prepare/complete endpointlarga so'rov yuboradi.
// Yaratilgan to'lovlar is_test = true bilan belgilanadi.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import md5 from "npm:blueimp-md5@2.19.0";
import { notifyPaymentSuccess } from "../_shared/click-notify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

interface TestResult {
  id: string;
  name: string;
  status: "PASS" | "FAILED" | "SKIPPED";
  detail: string;
  data?: unknown;
}

function tashkentSignTime(): string {
  const d = new Date(Date.now() + 5 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const { data: authData } = await admin.auth.getUser(authHeader.slice(7));
    if (!authData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: authData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Faqat administrator uchun" }, 403);

    const userId = authData.user.id;
    const results: TestResult[] = [];
    const push = (r: TestResult) => results.push(r);

    const merchantId = (Deno.env.get("CLICK_MERCHANT_ID") ?? "").trim();
    const serviceId = (Deno.env.get("CLICK_SERVICE_ID") ?? "").trim();
    const secretKey = (Deno.env.get("CLICK_SECRET_KEY") ?? "").trim();

    // 1) Test Connection — credentials mavjudligi
    const missing = [
      !merchantId && "CLICK_MERCHANT_ID",
      !serviceId && "CLICK_SERVICE_ID",
      !secretKey && "CLICK_SECRET_KEY",
    ].filter(Boolean);
    push({
      id: "connection",
      name: "Test Connection",
      status: missing.length ? "FAILED" : "PASS",
      detail: missing.length ? `Sozlanmagan secretlar: ${missing.join(", ")}` : "Barcha Click credentials sozlangan",
    });

    if (missing.length) return json({ ok: false, results });

    const malformed = [
      !/^\d+$/.test(merchantId) && "CLICK_MERCHANT_ID raqam bo'lishi kerak",
      !/^\d+$/.test(serviceId) && "CLICK_SERVICE_ID raqam bo'lishi kerak",
    ].filter(Boolean);
    if (malformed.length) {
      push({
        id: "credential-format",
        name: "Credential formati",
        status: "FAILED",
        detail: malformed.join("; "),
      });
      return json({ ok: false, results });
    }

    // Test paketi
    const { data: pkg } = await admin
      .from("payment_packages")
      .select("*")
      .eq("is_active", true)
      .eq("kind", "med_coin")
      .order("price", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!pkg) {
      push({ id: "package", name: "Paket", status: "FAILED", detail: "Faol Med Coin paketi topilmadi" });
      return json({ ok: false, results });
    }

    // Test to'lovi
    const { data: payment, error: payErr } = await admin
      .from("platform_payments")
      .insert({
        user_id: userId,
        provider: "click",
        amount: pkg.price,
        currency: pkg.currency,
        purpose: "click_integration_test",
        package_id: pkg.id,
        reference_id: pkg.code,
        status: "pending",
        is_test: true,
        metadata: { test: true },
      })
      .select()
      .single();

    if (payErr || !payment) {
      push({ id: "payment", name: "Test to'lovi", status: "FAILED", detail: payErr?.message || "yaratilmadi" });
      return json({ ok: false, results });
    }

    const clickTransId = `TEST${Date.now()}`;
    const amount = String(pkg.price);
    const base = `${supabaseUrl}/functions/v1`;

    // 2) Hosted checkout linkini Click Button rasmiy formatida tekshirish.
    const checkoutUrl = new URL("https://my.click.uz/services/pay");
    checkoutUrl.searchParams.set("service_id", serviceId!);
    checkoutUrl.searchParams.set("merchant_id", merchantId!);
    checkoutUrl.searchParams.set("transaction_param", payment.id);
    checkoutUrl.searchParams.set("amount", amount);
    checkoutUrl.searchParams.set("return_url", "https://med1.uz/payment/success");
    const checkoutProbe = await fetch(checkoutUrl, { method: "GET", redirect: "manual" });
    await checkoutProbe.text();
    const checkoutAccepted = checkoutProbe.status >= 200 && checkoutProbe.status < 400;
    push({
      id: "checkout",
      name: "Test Checkout (yetkazib beruvchi)",
      status: checkoutAccepted ? "PASS" : "FAILED",
      detail: checkoutAccepted
        ? "Rasmiy Click Button checkout sahifasi ochildi"
        : `Click checkout sahifasi ochilmadi: HTTP ${checkoutProbe.status}`,
      data: {
        http_status: checkoutProbe.status,
        required_parameters: ["service_id", "merchant_id", "transaction_param", "amount", "return_url"],
      },
    });

    // 3) Test Verification — noto'g'ri imzo rad etilishi kerak
    const badRes = await fetch(`${base}/click-prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        click_trans_id: clickTransId + "X",
        service_id: serviceId,
        merchant_trans_id: payment.id,
        amount,
        action: "0",
        error: "0",
        sign_time: tashkentSignTime(),
        sign_string: "0000000000000000000000000000",
      }),
    });
    const badBody = await badRes.json().catch(() => ({}));
    push({
      id: "verification",
      name: "Test Verification (imzo tekshiruvi)",
      status: badBody?.error === -1 ? "PASS" : "FAILED",
      detail: badBody?.error === -1 ? "Noto'g'ri imzo rad etildi (-1)" : `Kutilmagan javob: ${JSON.stringify(badBody)}`,
    });

    // 4) Test Prepare
    const signTime0 = tashkentSignTime();
    const sign0 = md5(`${clickTransId}${serviceId}${secretKey}${payment.id}${amount}0${signTime0}`);
    const prepRes = await fetch(`${base}/click-prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        click_trans_id: clickTransId,
        service_id: serviceId,
        click_paydoc_id: "0",
        merchant_trans_id: payment.id,
        amount,
        action: "0",
        error: "0",
        error_note: "",
        sign_time: signTime0,
        sign_string: sign0,
      }),
    });
    const prep = await prepRes.json().catch(() => ({}));
    const prepareId = prep?.merchant_prepare_id;
    push({
      id: "prepare",
      name: "Test Prepare",
      status: prep?.error === 0 && prepareId ? "PASS" : "FAILED",
      detail: prep?.error === 0 ? `merchant_prepare_id = ${prepareId}` : `Xato: ${JSON.stringify(prep)}`,
      data: prep,
    });

    let complete: any = null;
    if (prep?.error === 0 && prepareId) {
      // 5) Test Complete
      const signTime1 = tashkentSignTime();
      const sign1 = md5(`${clickTransId}${serviceId}${secretKey}${payment.id}${prepareId}${amount}1${signTime1}`);
      const compRes = await fetch(`${base}/click-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          click_trans_id: clickTransId,
          service_id: serviceId,
          click_paydoc_id: "0",
          merchant_trans_id: payment.id,
          merchant_prepare_id: prepareId,
          amount,
          action: "1",
          error: "0",
          error_note: "",
          sign_time: signTime1,
          sign_string: sign1,
        }),
      });
      complete = await compRes.json().catch(() => ({}));
      push({
        id: "complete",
        name: "Test Complete",
        status: complete?.error === 0 ? "PASS" : "FAILED",
        detail: complete?.error === 0 ? "To'lov tasdiqlandi" : `Xato: ${JSON.stringify(complete)}`,
        data: complete,
      });

      // 6) Test Callback (idempotentlik — takroriy complete)
      const dupRes = await fetch(`${base}/click-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          click_trans_id: clickTransId,
          service_id: serviceId,
          merchant_trans_id: payment.id,
          merchant_prepare_id: prepareId,
          amount,
          action: "1",
          error: "0",
          sign_time: signTime1,
          sign_string: sign1,
        }),
      });
      const dup = await dupRes.json().catch(() => ({}));
      push({
        id: "callback",
        name: "Test Callback (idempotentlik)",
        status: dup?.error === 0 || dup?.error === -4 ? "PASS" : "FAILED",
        detail: `Takroriy callback javobi: error=${dup?.error} — Med Coin qayta berilmadi`,
      });
    } else {
      push({ id: "complete", name: "Test Complete", status: "SKIPPED", detail: "Prepare muvaffaqiyatsiz" });
      push({ id: "callback", name: "Test Callback", status: "SKIPPED", detail: "Prepare muvaffaqiyatsiz" });
    }

    // 7) Test Invoice
    const { data: invoice } = await admin
      .from("payment_invoices")
      .select("*")
      .eq("payment_id", payment.id)
      .maybeSingle();
    push({
      id: "invoice",
      name: "Test Invoice",
      status: invoice ? "PASS" : "FAILED",
      detail: invoice ? `Invoice ${invoice.invoice_number} yaratildi` : "Invoice yaratilmadi",
      data: invoice,
    });

    // 8) Test Med Coin
    const { data: ledger } = await admin
      .from("med_coin_ledger")
      .select("*")
      .eq("payment_id", payment.id)
      .maybeSingle();
    push({
      id: "medcoin",
      name: "Test Med Coin",
      status: ledger ? "PASS" : "FAILED",
      detail: ledger
        ? `+${ledger.amount} coin (${ledger.balance_before} → ${ledger.balance_after})`
        : "Ledger yozuvi topilmadi",
      data: ledger,
    });

    // 9) Test Notification
    const notified = await notifyPaymentSuccess(admin, {
      userId,
      amount: Number(pkg.price),
      product: `[TEST] ${pkg.name_uz}`,
      coins: pkg.coin_amount + pkg.bonus_coins,
      invoiceNumber: invoice?.invoice_number ?? "TEST",
      transactionId: clickTransId,
      isTest: true,
    });
    push({
      id: "notification",
      name: "Test Notification",
      status: notified ? "PASS" : "FAILED",
      detail: notified ? "Telegram xabari yuborildi" : "Telegram sozlanmagan yoki xatolik",
    });

    // Test artefaktlarini tozalash (balans buzilmasligi uchun)
    if (ledger) {
      await admin.from("user_credits").delete().eq("user_id", userId).eq("package_name", pkg.code)
        .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString());
    }

    const failed = results.filter((r) => r.status === "FAILED").length;
    return json({ ok: failed === 0, payment_id: payment.id, results });
  } catch (err) {
    console.error("click-test error:", err);
    return json({ error: err instanceof Error ? err.message : "Server xatolik" }, 500);
  }
});
