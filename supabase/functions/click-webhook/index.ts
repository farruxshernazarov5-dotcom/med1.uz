import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

// Click webhook — public endpoint, signature bilan tasdiqlanadi
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const md5 = (s: string) => createHash("md5").update(s).toString();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secretKey = Deno.env.get("CLICK_SECRET_KEY")!;
    const serviceId = Deno.env.get("CLICK_SERVICE_ID")!;

    // Click form-urlencoded yuboradi
    const contentType = req.headers.get("content-type") || "";
    let params: Record<string, string> = {};
    if (contentType.includes("application/json")) {
      params = await req.json();
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) params[k] = String(v);
    }

    const action = String(params.action ?? "");
    const click_trans_id = String(params.click_trans_id ?? "");
    const service_id = String(params.service_id ?? "");
    const merchant_trans_id = String(params.merchant_trans_id ?? ""); // bizning payment.id
    const amount = String(params.amount ?? "");
    const sign_time = String(params.sign_time ?? "");
    const sign_string = String(params.sign_string ?? "");
    const merchant_prepare_id = String(params.merchant_prepare_id ?? "");

    // Signature verify
    // Prepare (action=0): md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
    // Complete (action=1): md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
    const expected = action === "1"
      ? md5(`${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`)
      : md5(`${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`);

    const reply = (error: number, error_note: string, extra: Record<string, unknown> = {}) =>
      new Response(JSON.stringify({
        click_trans_id,
        merchant_trans_id,
        ...extra,
        error,
        error_note,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (sign_string !== expected) {
      console.error("Bad signature", { expected, received: sign_string });
      return reply(-1, "SIGN CHECK FAILED");
    }

    if (service_id !== serviceId) {
      return reply(-3, "Action not found");
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Payment topish
    const { data: payment, error: pErr } = await admin
      .from("platform_payments")
      .select("*")
      .eq("id", merchant_trans_id)
      .maybeSingle();

    if (pErr || !payment) return reply(-5, "User does not exist");
    if (Number(payment.amount) !== Number(amount)) return reply(-2, "Incorrect parameter amount");
    if (payment.status === "paid") return reply(-4, "Already paid");
    if (payment.status === "cancelled") return reply(-9, "Transaction cancelled");

    if (action === "0") {
      // Prepare
      await admin.from("platform_payments").update({
        provider_transaction_id: click_trans_id,
        metadata: { ...payment.metadata, prepare_at: new Date().toISOString() },
      }).eq("id", payment.id);

      return reply(0, "Success", { merchant_prepare_id: payment.id });
    }

    if (action === "1") {
      // Complete
      await admin.from("platform_payments").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        provider_payment_id: click_trans_id,
      }).eq("id", payment.id);

      return reply(0, "Success", { merchant_confirm_id: payment.id });
    }

    return reply(-3, "Action not found");
  } catch (err) {
    console.error("click-webhook error:", err);
    return new Response(JSON.stringify({ error: -7, error_note: "Server error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
