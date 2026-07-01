// Payme Merchant API webhook (JSON-RPC 2.0).
// Metodlar: CheckPerformTransaction, CreateTransaction, PerformTransaction,
//           CancelTransaction, CheckTransaction, GetStatement
// Auth: Basic base64("Paycom:PAYME_SECRET_KEY")
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// Payme JSON-RPC error codes
const ERR = {
  INVALID_AUTH: { code: -32504, message: { uz: "Ruxsat yo'q", ru: "Недостаточно привилегий", en: "Insufficient privileges" } },
  INVALID_AMOUNT: { code: -31001, message: { uz: "Summa noto'g'ri", ru: "Неверная сумма", en: "Invalid amount" } },
  ORDER_NOT_FOUND: { code: -31050, message: { uz: "Buyurtma topilmadi", ru: "Заказ не найден", en: "Order not found" } },
  CANNOT_PERFORM: { code: -31008, message: { uz: "Amalni bajarib bo'lmaydi", ru: "Невозможно выполнить операцию", en: "Cannot perform operation" } },
  TX_NOT_FOUND: { code: -31003, message: { uz: "Tranzaksiya topilmadi", ru: "Транзакция не найдена", en: "Transaction not found" } },
  METHOD_NOT_FOUND: { code: -32601, message: { uz: "Metod topilmadi", ru: "Метод не найден", en: "Method not found" } },
};

const rpcResult = (id: unknown, result: unknown) => new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
const rpcError = (id: unknown, err: { code: number; message: unknown }, data?: string) => new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { ...err, data } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  const expected = "Basic " + btoa(`Paycom:${Deno.env.get("PAYME_SECRET_KEY") || ""}`);
  if (authHeader !== expected) return rpcError(null, ERR.INVALID_AUTH);

  const body = await req.json().catch(() => ({}));
  const { id, method, params } = body || {};

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const orderId: string | undefined = params?.account?.order_id;
  const amountTiyin: number | undefined = params?.amount;

  try {
    switch (method) {
      case "CheckPerformTransaction": {
        if (!orderId) return rpcError(id, ERR.ORDER_NOT_FOUND, "order_id");
        const { data: p } = await admin.from("platform_payments").select("id,amount,status").eq("id", orderId).maybeSingle();
        if (!p) return rpcError(id, ERR.ORDER_NOT_FOUND, "order_id");
        if (Math.round(Number(p.amount) * 100) !== amountTiyin) return rpcError(id, ERR.INVALID_AMOUNT);
        if (p.status !== "pending") return rpcError(id, ERR.CANNOT_PERFORM);
        return rpcResult(id, { allow: true });
      }
      case "CreateTransaction": {
        const { data: p } = await admin.from("platform_payments").select("id,amount,status,transaction_id,metadata").eq("id", orderId!).maybeSingle();
        if (!p) return rpcError(id, ERR.ORDER_NOT_FOUND, "order_id");
        if (Math.round(Number(p.amount) * 100) !== amountTiyin) return rpcError(id, ERR.INVALID_AMOUNT);
        // idempotent: agar shu payme_id allaqachon yozilgan bo'lsa
        const meta: any = p.metadata || {};
        if (meta.payme_id && meta.payme_id !== params.id) return rpcError(id, ERR.CANNOT_PERFORM);
        const create_time = Date.now();
        await admin.from("platform_payments").update({
          transaction_id: params.id,
          metadata: { ...meta, payme_id: params.id, payme_time: params.time, payme_state: 1, create_time },
        }).eq("id", orderId!);
        return rpcResult(id, { create_time, transaction: params.id, state: 1 });
      }
      case "PerformTransaction": {
        const { data: p } = await admin.from("platform_payments").select("id,amount,status,metadata").eq("transaction_id", params.id).maybeSingle();
        if (!p) return rpcError(id, ERR.TX_NOT_FOUND);
        const meta: any = p.metadata || {};
        if (meta.payme_state === 2) {
          return rpcResult(id, { transaction: params.id, perform_time: meta.perform_time, state: 2 });
        }
        if (meta.payme_state !== 1) return rpcError(id, ERR.CANNOT_PERFORM);
        const perform_time = Date.now();
        await admin.from("platform_payments").update({
          status: "paid",
          paid_at: new Date().toISOString(),
          metadata: { ...meta, payme_state: 2, perform_time },
        }).eq("id", p.id);
        await admin.from("audit_logs").insert({ action: "payment_completed", entity_type: "platform_payments", entity_id: p.id, details: { provider: "payme", transaction_id: params.id } });
        return rpcResult(id, { transaction: params.id, perform_time, state: 2 });
      }
      case "CancelTransaction": {
        const { data: p } = await admin.from("platform_payments").select("id,status,metadata").eq("transaction_id", params.id).maybeSingle();
        if (!p) return rpcError(id, ERR.TX_NOT_FOUND);
        const meta: any = p.metadata || {};
        const cancel_time = Date.now();
        const newState = meta.payme_state === 2 ? -2 : -1;
        await admin.from("platform_payments").update({
          status: newState === -2 ? "refunded" : "cancelled",
          metadata: { ...meta, payme_state: newState, cancel_time, cancel_reason: params.reason },
        }).eq("id", p.id);
        return rpcResult(id, { transaction: params.id, cancel_time, state: newState });
      }
      case "CheckTransaction": {
        const { data: p } = await admin.from("platform_payments").select("id,status,metadata").eq("transaction_id", params.id).maybeSingle();
        if (!p) return rpcError(id, ERR.TX_NOT_FOUND);
        const meta: any = p.metadata || {};
        return rpcResult(id, {
          create_time: meta.create_time || 0,
          perform_time: meta.perform_time || 0,
          cancel_time: meta.cancel_time || 0,
          transaction: params.id,
          state: meta.payme_state ?? 0,
          reason: meta.cancel_reason ?? null,
        });
      }
      case "GetStatement": {
        const { data } = await admin.from("platform_payments").select("id,amount,transaction_id,metadata,created_at").eq("provider", "payme").gte("created_at", new Date(params.from).toISOString()).lte("created_at", new Date(params.to).toISOString());
        const transactions = (data || []).filter((r: any) => r.transaction_id).map((r: any) => ({
          id: r.transaction_id,
          time: r.metadata?.payme_time || 0,
          amount: Math.round(Number(r.amount) * 100),
          account: { order_id: r.id },
          create_time: r.metadata?.create_time || 0,
          perform_time: r.metadata?.perform_time || 0,
          cancel_time: r.metadata?.cancel_time || 0,
          transaction: r.transaction_id,
          state: r.metadata?.payme_state ?? 0,
          reason: r.metadata?.cancel_reason ?? null,
        }));
        return rpcResult(id, { transactions });
      }
      default:
        return rpcError(id, ERR.METHOD_NOT_FOUND);
    }
  } catch (err) {
    console.error("payme-webhook error", err);
    return rpcError(id, ERR.CANNOT_PERFORM, err instanceof Error ? err.message : String(err));
  }
});
