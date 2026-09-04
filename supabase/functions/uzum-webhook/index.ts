// Uzum Bank webhook. Standart PREPARE / CONFIRM / CANCEL callback.
// Auth: HMAC-SHA256 imzo `x-uzum-signature` sarlavhasida (raw_body ustidan).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, x-uzum-signature" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function hmacSha256Hex(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const raw = await req.text();
    const secret = Deno.env.get("UZUM_SECRET_KEY") || "";
    const provided = req.headers.get("x-uzum-signature") || "";
    if (secret) {
      const expected = await hmacSha256Hex(secret, raw);
      if (provided.toLowerCase() !== expected.toLowerCase()) return json(401, { error: 0, error_note: "invalid signature" });
    }

    const body = JSON.parse(raw || "{}");
    const { action, order_id, transaction_id, amount, service_id } = body;
    if (!order_id) return json(400, { error: -1, error_note: "order_id required" });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: p } = await admin.from("platform_payments").select("id,amount,status,metadata").eq("id", order_id).maybeSingle();
    if (!p) return json(404, { error: -1, error_note: "order not found" });

    const meta: any = p.metadata || {};
    const expectedTiyin = Math.round(Number(p.amount) * 100);
    if (amount && Math.abs(Number(amount) - expectedTiyin) > 0) return json(400, { error: -2, error_note: "amount mismatch" });

    if (action === "PREPARE" || action === "check") {
      if (p.status !== "pending") return json(409, { error: -3, error_note: "not pending" });
      return json(200, { error: 0, transaction_id: order_id, amount: expectedTiyin });
    }
    if (action === "CONFIRM" || action === "perform") {
      if (p.status === "paid") return json(200, { error: 0, transaction_id, state: 2 });
      if (p.status !== "pending") return json(409, { error: -3, error_note: "not pending" });
      await admin.from("platform_payments").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        provider_transaction_id: transaction_id || order_id,
        metadata: { ...meta, uzum_service_id: service_id, uzum_confirmed_at: Date.now() },
      }).eq("id", p.id);
      await admin.from("audit_logs").insert({ action: "payment_completed", entity_type: "platform_payments", entity_id: p.id, details: { provider: "uzum", transaction_id } });
      return json(200, { error: 0, transaction_id, state: 2 });
    }
    if (action === "CANCEL" || action === "cancel") {
      await admin.from("platform_payments").update({
        status: p.status === "paid" ? "refunded" : "cancelled",
        metadata: { ...meta, uzum_cancelled_at: Date.now(), cancel_reason: body.reason },
      }).eq("id", p.id);
      return json(200, { error: 0, transaction_id, state: -1 });
    }
    return json(400, { error: -1, error_note: `unknown action: ${action}` });
  } catch (err) {
    console.error("uzum-webhook error", err);
    return json(500, { error: -9, error_note: err instanceof Error ? err.message : String(err) });
  }
});
