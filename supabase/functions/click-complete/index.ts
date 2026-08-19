// Click COMPLETE endpoint (action = 1)
// Click merchant kabinetidagi "Complete URL" shu funksiyaga qaratiladi.
// Faqat shu yerda Med Coin beriladi / obuna faollashadi / invoice yaratiladi.
import {
  adminClient,
  ClickError,
  corsHeaders,
  getClientIp,
  guardClickRequest,
  isClickCancelled,
  jsonResponse,
  parseClickRequest,
  writeCallbackLog,
} from "../_shared/click.ts";
import { notifyPaymentSuccess } from "../_shared/click-notify.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Kabinetda URL tekshirilganda yoki brauzerda ochilganda Click parametrlari
  // bo'lmaydi. Buni action=-3 deb loglamaymiz; haqiqiy callback action=1 bilan
  // POST yoki query orqali kelganda quyidagi protokol odatdagidek ishlaydi.
  const requestUrl = new URL(req.url);
  if (req.method === "GET" && !requestUrl.searchParams.has("action")) {
    return jsonResponse({
      ok: true,
      endpoint: "click-complete",
      expected_action: 1,
      message: "Click Complete endpoint is ready; callback parameters are required",
    });
  }

  const admin = adminClient();
  const ip = getClientIp(req);

  try {
    const p = await parseClickRequest(req);
    const guard = await guardClickRequest(admin, p, ip, "1");
    if (!guard.ok) return guard.response!;
    const payment = guard.payment as Record<string, any>;

    const base = {
      click_trans_id: p.click_trans_id,
      action: p.action,
      merchant_trans_id: p.merchant_trans_id,
      payment_id: payment.id,
      sign_string: p.sign_string,
      sign_time: p.sign_time,
      request_ip: ip,
      request_body: p.raw,
    };

    const respond = async (body: Record<string, unknown>, status: string, note?: string) => {
      await writeCallbackLog(admin, { ...base, status, error_note: note, response_body: body });
      return jsonResponse(body);
    };

    // 1) merchant_prepare_id mosligi
    if (!payment.prepare_id || String(payment.prepare_id) !== String(p.merchant_prepare_id)) {
      return await respond({
        click_trans_id: p.click_trans_id,
        merchant_trans_id: p.merchant_trans_id,
        error: ClickError.TRANSACTION_NOT_FOUND,
        error_note: "Transaction does not exist",
      }, "error", "merchant_prepare_id mismatch");
    }

    // 2) Click tomonidan bekor qilingan
    if (isClickCancelled(p)) {
      await admin.from("platform_payments")
        .update({ status: "cancelled" })
        .eq("id", payment.id)
        .in("status", ["pending", "prepared"]);
      return await respond({
        click_trans_id: p.click_trans_id,
        merchant_trans_id: p.merchant_trans_id,
        error: ClickError.TRANSACTION_CANCELLED,
        error_note: "Transaction cancelled",
      }, "error", "cancelled by click");
    }

    // 3) Idempotentlik — allaqachon bajarilgan bo'lsa Click'ga muvaffaqiyat qaytariladi
    if (payment.fulfilled_at || payment.status === "completed") {
      return await respond({
        click_trans_id: p.click_trans_id,
        merchant_trans_id: p.merchant_trans_id,
        merchant_confirm_id: Number(payment.prepare_id),
        error: ClickError.SUCCESS,
        error_note: "Success",
      }, "rejected_replay", "already fulfilled");
    }

    // 4) Atomik holat o'zgarishi: faqat pending/prepared → paid
    const { data: locked } = await admin
      .from("platform_payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        provider_payment_id: p.click_paydoc_id || p.click_trans_id,
        provider_transaction_id: p.click_trans_id,
      })
      .eq("id", payment.id)
      .in("status", ["pending", "prepared"])
      .select("id")
      .maybeSingle();

    if (!locked) {
      return await respond({
        click_trans_id: p.click_trans_id,
        merchant_trans_id: p.merchant_trans_id,
        error: ClickError.ALREADY_PAID,
        error_note: "Already paid",
      }, "rejected_replay", "concurrent complete");
    }

    // 5) Fulfillment — Med Coin / obuna / invoice / ledger / audit (bitta tranzaksiyada)
    const { data: fulfil, error: fErr } = await admin.rpc("click_fulfill_payment", {
      _payment_id: payment.id,
    });

    if (fErr || !(fulfil as any)?.ok) {
      console.error("fulfillment failed:", fErr, fulfil);
      await admin.from("platform_payments").update({ status: "paid" }).eq("id", payment.id);
      return await respond({
        click_trans_id: p.click_trans_id,
        merchant_trans_id: p.merchant_trans_id,
        error: ClickError.FAILED_TO_UPDATE_USER,
        error_note: "Failed to update user",
      }, "error", `fulfillment: ${fErr?.message || JSON.stringify(fulfil)}`);
    }

    const result = fulfil as any;

    // 6) Bildirishnoma (xatolik to'lovni bekor qilmaydi)
    await notifyPaymentSuccess(admin, {
      userId: payment.user_id,
      amount: Number(payment.amount),
      product: result.product ?? payment.purpose,
      coins: Number(result.coins ?? 0),
      invoiceNumber: result.invoice_number,
      transactionId: p.click_trans_id,
      isTest: Boolean(payment.is_test),
    });

    return await respond({
      click_trans_id: p.click_trans_id,
      merchant_trans_id: p.merchant_trans_id,
      merchant_confirm_id: Number(payment.prepare_id),
      error: ClickError.SUCCESS,
      error_note: "Success",
    }, "processed");
  } catch (err) {
    console.error("click-complete error:", err);
    await writeCallbackLog(admin, {
      click_trans_id: "unknown",
      action: "1",
      request_ip: ip,
      status: "error",
      error_note: String(err),
    });
    return jsonResponse({ error: ClickError.FAILED_TO_UPDATE_USER, error_note: "Server error" });
  }
});
