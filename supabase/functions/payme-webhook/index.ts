// Payme (Paycom) Merchant API webhook — JSON-RPC 2.0
// Metodlar: CheckPerformTransaction, CreateTransaction, PerformTransaction,
//           CancelTransaction, CheckTransaction, GetStatement
// Auth: Basic base64("Paycom:PAYME_SECRET_KEY")
// Hujjat: https://developer.help.paycom.uz/metody-merchant-api/
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyPaymentPaid } from "../_shared/payment-notify.ts";
import {
  paymeCors as corsHeaders,
  PAYME_ERR as ERR,
  PAYME_TIMEOUT_MS,
  buildFiscalDetail,
  verifyPaymeAuth,
} from "../_shared/payme.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type PaymeTx = {
  id: string;
  payment_id: string;
  amount: number;
  account: Record<string, unknown>;
  state: number;
  reason: number | null;
  payme_time: number | null;
  create_time: number;
  perform_time: number;
  cancel_time: number;
};

async function writeLog(entry: Record<string, unknown>) {
  try {
    await admin.from("payme_webhook_log").insert(entry);
  } catch (e) {
    console.error("payme log error", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const send = async (payload: Record<string, unknown>, log: Record<string, unknown>) => {
    await writeLog({ ...log, request_ip: ip, response_body: payload });
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  // 1) Autorizatsiya
  if (!verifyPaymeAuth(req.headers.get("Authorization"))) {
    return await send(
      { jsonrpc: "2.0", id: null, error: ERR.INVALID_AUTH },
      { method: "auth", status: "error", error_note: "invalid basic auth" },
    );
  }

  // 2) JSON-RPC tanasi
  let body: { id?: unknown; method?: string; params?: Record<string, any> } | null = null;
  try {
    body = await req.json();
  } catch {
    return await send(
      { jsonrpc: "2.0", id: null, error: ERR.PARSE },
      { method: "parse", status: "error", error_note: "invalid json" },
    );
  }

  const id = body?.id ?? null;
  const method = body?.method;
  const params = body?.params ?? {};

  if (!method || typeof method !== "string") {
    return await send(
      { jsonrpc: "2.0", id, error: ERR.INVALID_RPC },
      { method: "unknown", rpc_id: String(id), status: "error", error_note: "method missing" },
    );
  }

  const ok = (result: unknown, log: Record<string, unknown> = {}) =>
    send({ jsonrpc: "2.0", id, result }, {
      method, rpc_id: String(id), request_body: body, status: "ok", ...log,
    });

  const fail = (err: { code: number; message: unknown }, data?: string, log: Record<string, unknown> = {}) =>
    send({ jsonrpc: "2.0", id, error: data ? { ...err, data } : { ...err } }, {
      method, rpc_id: String(id), request_body: body, status: "error",
      error_note: `${err.code}${data ? `: ${data}` : ""}`, ...log,
    });

  // account: order_id (asosiy parametr)
  const account = (params?.account ?? {}) as Record<string, any>;
  const orderId: string | undefined =
    account?.order_id ?? account?.payment_id ?? account?.order ?? undefined;
  const amountTiyin = Number(params?.amount);
  const txId = params?.id != null ? String(params.id) : "";

  const isUuid = (v: unknown) =>
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  const loadOrder = async (oid: string) =>
    (await admin
      .from("platform_payments")
      .select("id,amount,status,purpose,metadata,user_id,created_at")
      .eq("id", oid)
      .maybeSingle()).data as
      | { id: string; amount: number; status: string; purpose: string; user_id: string | null; created_at: string }
      | null;

  const loadTx = async (tid: string) =>
    (await admin.from("payme_transactions").select("*").eq("id", tid).maybeSingle()).data as PaymeTx | null;

  const ORDER_TTL_MS = 24 * 60 * 60 * 1000;

  /**
   * Buyurtmani tekshiradi. Xato bo'lsa xato javobini qaytaradi (account xatolari
   * -31050 / -31051, summa xatosi -31001).
   */
  const resolveOrder = async () => {
    if (!isUuid(orderId)) return { error: ERR.ORDER_NOT_FOUND, data: "order_id" as const, order: null };
    const p = await loadOrder(orderId!);
    if (!p) return { error: ERR.ORDER_NOT_FOUND, data: "order_id" as const, order: null };
    if (!Number.isFinite(amountTiyin) || Math.round(Number(p.amount) * 100) !== amountTiyin) {
      return { error: ERR.INVALID_AMOUNT, data: undefined, order: p };
    }
    if (p.status !== "pending") return { error: ERR.ORDER_UNAVAILABLE, data: "order_id" as const, order: p };
    if (Date.now() - new Date(p.created_at).getTime() > ORDER_TTL_MS) {
      return { error: ERR.ORDER_UNAVAILABLE, data: "order_id" as const, order: p };
    }
    return { error: null, data: undefined, order: p };
  };

  const cancelTx = async (tx: PaymeTx, reason: number, newState: number) => {
    const cancel_time = Date.now();
    await admin.from("payme_transactions")
      .update({ state: newState, reason, cancel_time, updated_at: new Date().toISOString() })
      .eq("id", tx.id);
    await admin.from("platform_payments")
      .update({ status: newState === -2 ? "refunded" : "cancelled" })
      .eq("id", tx.payment_id);
    return cancel_time;
  };

  try {
    switch (method) {
      // ---------------------------------------------------------------
      case "CheckPerformTransaction": {
        const r = await resolveOrder();
        if (r.error) return fail(r.error, r.data);
        const p = r.order!;

        const { data: fiscal } = await admin
          .from("payme_fiscal_items")
          .select("title,mxik_code,package_code,vat_percent,units")
          .eq("purpose", p.purpose)
          .eq("is_active", true)
          .maybeSingle();

        const detail = buildFiscalDetail(fiscal, Math.round(Number(p.amount) * 100));
        return ok({ allow: true, detail }, { payment_id: p.id });
      }

      // ---------------------------------------------------------------
      case "CreateTransaction": {
        if (!txId) return fail(ERR.INVALID_PARAMS, "id");

        // Idempotentlik: shu tranzaksiya allaqachon mavjud
        const existing = await loadTx(txId);
        if (existing) {
          if (existing.state !== 1) {
            return fail(ERR.CANNOT_PERFORM, "state", { payment_id: existing.payment_id, payme_transaction_id: txId });
          }
          if (Date.now() - Number(existing.create_time) > PAYME_TIMEOUT_MS) {
            await cancelTx(existing, 4, -1);
            return fail(ERR.CANNOT_PERFORM, "timeout", { payment_id: existing.payment_id, payme_transaction_id: txId });
          }
          return ok(
            { create_time: Number(existing.create_time), transaction: existing.payment_id, state: 1 },
            { payment_id: existing.payment_id, payme_transaction_id: txId },
          );
        }

        const r = await resolveOrder();
        if (r.error) return fail(r.error, r.data);
        const p = r.order!;

        // Shu buyurtma bo'yicha boshqa faol tranzaksiya bormi?
        const { data: active } = await admin
          .from("payme_transactions")
          .select("id")
          .eq("payment_id", p.id)
          .in("state", [1, 2])
          .maybeSingle();
        if (active) return fail(ERR.ORDER_UNAVAILABLE, "order_id", { payment_id: p.id });

        const create_time = Date.now();
        const { error: insErr } = await admin.from("payme_transactions").insert({
          id: txId,
          payment_id: p.id,
          amount: amountTiyin,
          account,
          state: 1,
          payme_time: Number(params?.time) || null,
          create_time,
        });
        if (insErr) return fail(ERR.ORDER_UNAVAILABLE, "order_id", { payment_id: p.id });

        await admin.from("platform_payments")
          .update({ provider_transaction_id: txId })
          .eq("id", p.id);

        return ok(
          { create_time, transaction: p.id, state: 1 },
          { payment_id: p.id, payme_transaction_id: txId },
        );
      }

      // ---------------------------------------------------------------
      case "PerformTransaction": {
        const tx = await loadTx(txId);
        if (!tx) return fail(ERR.TX_NOT_FOUND);

        if (tx.state === 2) {
          return ok(
            { transaction: tx.payment_id, perform_time: Number(tx.perform_time), state: 2 },
            { payment_id: tx.payment_id, payme_transaction_id: txId },
          );
        }
        if (tx.state !== 1) {
          return fail(ERR.CANNOT_PERFORM, "state", { payment_id: tx.payment_id, payme_transaction_id: txId });
        }
        if (Date.now() - Number(tx.create_time) > PAYME_TIMEOUT_MS) {
          await cancelTx(tx, 4, -1);
          return fail(ERR.CANNOT_PERFORM, "timeout", { payment_id: tx.payment_id, payme_transaction_id: txId });
        }

        const perform_time = Date.now();
        await admin.from("payme_transactions")
          .update({ state: 2, perform_time, updated_at: new Date().toISOString() })
          .eq("id", txId);

        const { data: p } = await admin
          .from("platform_payments")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            provider_payment_id: txId,
          })
          .eq("id", tx.payment_id)
          .select("id,amount,purpose,user_id")
          .maybeSingle();

        if (p) {
          await notifyPaymentPaid(admin, {
            provider: "payme",
            amount: Number(p.amount),
            purpose: p.purpose,
            paymentId: p.id,
            userId: (p as { user_id?: string | null }).user_id ?? null,
            transactionId: txId,
          });
          await admin.from("audit_logs").insert({
            action: "payment_completed",
            entity_type: "platform_payments",
            entity_id: p.id,
            details: { provider: "payme", transaction_id: txId },
          });
        }

        return ok(
          { transaction: tx.payment_id, perform_time, state: 2 },
          { payment_id: tx.payment_id, payme_transaction_id: txId },
        );
      }

      // ---------------------------------------------------------------
      case "CancelTransaction": {
        const tx = await loadTx(txId);
        if (!tx) return fail(ERR.TX_NOT_FOUND);
        const reason = Number(params?.reason) || null;

        if (tx.state === -1 || tx.state === -2) {
          return ok(
            { transaction: tx.payment_id, cancel_time: Number(tx.cancel_time), state: tx.state },
            { payment_id: tx.payment_id, payme_transaction_id: txId },
          );
        }

        const newState = tx.state === 2 ? -2 : -1;
        const cancel_time = await cancelTx(tx, reason ?? 0, newState);

        await admin.from("audit_logs").insert({
          action: newState === -2 ? "payment_refunded" : "payment_cancelled",
          entity_type: "platform_payments",
          entity_id: tx.payment_id,
          details: { provider: "payme", transaction_id: txId, reason },
        });

        return ok(
          { transaction: tx.payment_id, cancel_time, state: newState },
          { payment_id: tx.payment_id, payme_transaction_id: txId },
        );
      }

      // ---------------------------------------------------------------
      case "CheckTransaction": {
        const tx = await loadTx(txId);
        if (!tx) return fail(ERR.TX_NOT_FOUND);
        return ok({
          create_time: Number(tx.create_time ?? 0),
          perform_time: Number(tx.perform_time ?? 0),
          cancel_time: Number(tx.cancel_time ?? 0),
          transaction: tx.payment_id,
          state: tx.state,
          reason: tx.reason ?? null,
        }, { payment_id: tx.payment_id, payme_transaction_id: txId });
      }

      // ---------------------------------------------------------------
      case "GetStatement": {
        const from = Number(params?.from);
        const to = Number(params?.to);
        if (!Number.isFinite(from) || !Number.isFinite(to)) return fail(ERR.INVALID_PARAMS, "from/to");

        const { data } = await admin
          .from("payme_transactions")
          .select("*")
          .gte("create_time", from)
          .lte("create_time", to)
          .order("create_time", { ascending: true });

        const transactions = (data ?? []).map((t: PaymeTx) => ({
          id: t.id,
          time: Number(t.payme_time ?? t.create_time ?? 0),
          amount: Number(t.amount),
          account: t.account ?? { order_id: t.payment_id },
          create_time: Number(t.create_time ?? 0),
          perform_time: Number(t.perform_time ?? 0),
          cancel_time: Number(t.cancel_time ?? 0),
          transaction: t.payment_id,
          state: t.state,
          reason: t.reason ?? null,
        }));

        return ok({ transactions });
      }

      // ---------------------------------------------------------------
      default:
        return fail(ERR.METHOD_NOT_FOUND, method);
    }
  } catch (err) {
    console.error("payme-webhook error", err);
    return fail(ERR.INTERNAL, err instanceof Error ? err.message : String(err));
  }
});
