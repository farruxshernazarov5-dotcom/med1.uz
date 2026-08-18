// Click PREPARE endpoint (action = 0)
// Click merchant kabinetidagi "Prepare URL" shu funksiyaga qaratiladi.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const ip = getClientIp(req);

  try {
    const p = await parseClickRequest(req);
    const guard = await guardClickRequest(admin, p, ip, "0");
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

    // To'lov bekor qilingan bo'lsa
    if (isClickCancelled(p)) {
      await admin.from("platform_payments").update({ status: "cancelled" }).eq("id", payment.id);
      const body = {
        click_trans_id: p.click_trans_id,
        merchant_trans_id: p.merchant_trans_id,
        error: ClickError.TRANSACTION_CANCELLED,
        error_note: "Transaction cancelled",
      };
      await writeCallbackLog(admin, { ...base, status: "error", error_note: "cancelled by click", response_body: body });
      return jsonResponse(body);
    }

    if (payment.status === "paid" || payment.status === "completed") {
      const body = {
        click_trans_id: p.click_trans_id,
        merchant_trans_id: p.merchant_trans_id,
        error: ClickError.ALREADY_PAID,
        error_note: "Already paid",
      };
      await writeCallbackLog(admin, { ...base, status: "rejected_replay", error_note: "already paid", response_body: body });
      return jsonResponse(body);
    }

    // Idempotent prepare: prepare_id faqat bir marta beriladi
    let prepareId: number | null = payment.prepare_id ?? null;
    if (!prepareId) {
      const { data: seq } = await admin.rpc("next_prepare_id");
      prepareId = Number(seq);
    }

    await admin
      .from("platform_payments")
      .update({
        status: "prepared",
        prepare_id: prepareId,
        provider_transaction_id: p.click_trans_id,
        metadata: {
          ...(payment.metadata ?? {}),
          prepare_at: new Date().toISOString(),
          prepare_ip: ip,
          click_paydoc_id: p.click_paydoc_id,
        },
      })
      .eq("id", payment.id);

    const response = {
      click_trans_id: p.click_trans_id,
      merchant_trans_id: p.merchant_trans_id,
      merchant_prepare_id: prepareId,
      error: ClickError.SUCCESS,
      error_note: "Success",
    };

    await writeCallbackLog(admin, { ...base, status: "processed", response_body: response });
    return jsonResponse(response);
  } catch (err) {
    console.error("click-prepare error:", err);
    await writeCallbackLog(admin, {
      click_trans_id: "unknown",
      action: "0",
      request_ip: ip,
      status: "error",
      error_note: String(err),
    });
    return jsonResponse({ error: ClickError.FAILED_TO_UPDATE_USER, error_note: "Server error" });
  }
});
