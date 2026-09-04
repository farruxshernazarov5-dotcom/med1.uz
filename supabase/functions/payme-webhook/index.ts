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

type Meta = Record<string, unknown> & {
  payme_id?: string;
  payme_time?: number;
  payme_state?: number;
  create_time?: number;
  perform_time?: number;
  cancel_time?: number;
  cancel_reason?: number;
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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

  const send = async (
    payload: Record<string, unknown>,
    log: Record<string, unknown>,
  ) => {
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
    send({ jsonrpc: "2.0", id, error: { ...err, data } }, {
      method, rpc_id: String(id), request_body: body, status: "error",
      error_note: `${err.code}${data ? `: ${data}` : ""}`, ...log,
    });

  // account: order_id yoki payment_id
  const account = params?.account ?? {};
  const orderId: string | undefined =
    account?.order_id ?? account?.payment_id ?? account?.order ?? undefined;
  const amountTiyin: number | undefined = params?.amount;

  const loadOrder = async (oid: string) =>
    (await admin
      .from("platform_payments")
      .select("id,amount,status,purpose,provider_transaction_id,metadata,user_id,created_at")
      .eq("id", oid)
      .maybeSingle()).data;

  const loadByTx = async (txId: string) =>
    (await admin
      .from("platform_payments")
      .select("id,amount,status,purpose,provider_transaction_id,metadata,user_id,created_at")
      .eq("provider_transaction_id", txId)
      .maybeSingle()).data;

  const amountMatches = (dbAmount: number) =>
    Number.isFinite(Number(amountTiyin)) &&
    Math.round(Number(dbAmount) * 100) === Number(amountTiyin);

  // Buyurtma (order_id) amal qilish muddati — 24 soat
  const ORDER_TTL_MS = 24 * 60 * 60 * 1000;
  const orderExpired = (createdAt?: string | null) =>
    !!createdAt && Date.now() - new Date(createdAt).getTime() > ORDER_TTL_MS;

  const isUuid = (v: unknown) =>
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  try {
    switch (method) {
      // ---------------------------------------------------------------
      case "CheckPerformTransaction": {
        if (!isUuid(orderId)) return fail(ERR.ORDER_NOT_FOUND, "order_id");
        const p = await loadOrder(orderId!);
        if (!p) return fail(ERR.ORDER_NOT_FOUND, "order_id");
        if (!amountMatches(Number(p.amount))) return fail(ERR.INVALID_AMOUNT);
        if (p.status !== "pending") return fail(ERR.ORDER_UNAVAILABLE, "order_id", { payment_id: p.id });
        if (orderExpired((p as { created_at?: string }).created_at)) {
          return fail(ERR.ORDER_UNAVAILABLE, "order_id", { payment_id: p.id });
        }

        // Fiskal ma'lumot (soliq oboroti uchun) — MXIK, package_code, QQS
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
        if (!isUuid(orderId)) return fail(ERR.ORDER_NOT_FOUND, "order_id");
        const p = await loadOrder(orderId!);
        if (!p) return fail(ERR.ORDER_NOT_FOUND, "order_id");
        if (!amountMatches(Number(p.amount))) return fail(ERR.INVALID_AMOUNT);

        const meta = (p.metadata ?? {}) as Meta;

        // Ayni tranzaksiya allaqachon yaratilgan — idempotent javob
        if (meta.payme_id === params.id) {
          if (meta.payme_state === 1) {
            const createdAt = Number(meta.create_time ?? 0);
            if (createdAt && Date.now() - createdAt > PAYME_TIMEOUT_MS) {
              const cancel_time = Date.now();
              await admin.from("platform_payments").update({
                status: "cancelled",
                metadata: { ...meta, payme_state: -1, cancel_time, cancel_reason: 4 },
              }).eq("id", p.id);
              return fail(ERR.CANNOT_PERFORM, "timeout", { payment_id: p.id, payme_transaction_id: params.id });
            }
            return ok(
              { create_time: Number(meta.create_time), transaction: p.id, state: 1 },
              { payment_id: p.id, payme_transaction_id: params.id },
            );
          }
          return fail(ERR.CANNOT_PERFORM, "state", { payment_id: p.id, payme_transaction_id: params.id });
        }

        // Boshqa tranzaksiya shu buyurtmani band qilgan
        if (meta.payme_id && meta.payme_id !== params.id) {
          return fail(ERR.ORDER_UNAVAILABLE, "order_id", { payment_id: p.id });
        }
        if (p.status !== "pending") return fail(ERR.ORDER_UNAVAILABLE, "order_id", { payment_id: p.id });
        if (orderExpired((p as { created_at?: string }).created_at)) {
          return fail(ERR.ORDER_UNAVAILABLE, "order_id", { payment_id: p.id });
        }

        const create_time = Date.now();
        const { data: updated } = await admin
          .from("platform_payments")
          .update({
            provider_transaction_id: params.id,
            metadata: {
              ...meta,
              payme_id: params.id,
              payme_time: params.time,
              payme_state: 1,
              create_time,
            },
          })
          .eq("id", p.id)
          .eq("status", "pending")
          .is("provider_transaction_id", null)
          .select("id")
          .maybeSingle();

        if (!updated) return fail(ERR.ORDER_UNAVAILABLE, "order_id", { payment_id: p.id });

        return ok(
          { create_time, transaction: p.id, state: 1 },
          { payment_id: p.id, payme_transaction_id: params.id },
        );
      }

      // ---------------------------------------------------------------
      case "PerformTransaction": {
        const p = await loadByTx(String(params.id));
        if (!p) return fail(ERR.TX_NOT_FOUND);
        const meta = (p.metadata ?? {}) as Meta;

        if (meta.payme_state === 2) {
          return ok(
            { transaction: p.id, perform_time: Number(meta.perform_time), state: 2 },
            { payment_id: p.id, payme_transaction_id: String(params.id) },
          );
        }
        if (meta.payme_state !== 1) {
          return fail(ERR.CANNOT_PERFORM, "state", { payment_id: p.id, payme_transaction_id: String(params.id) });
        }

        const createdAt = Number(meta.create_time ?? 0);
        if (createdAt && Date.now() - createdAt > PAYME_TIMEOUT_MS) {
          const cancel_time = Date.now();
          await admin.from("platform_payments").update({
            status: "cancelled",
            metadata: { ...meta, payme_state: -1, cancel_time, cancel_reason: 4 },
          }).eq("id", p.id);
          return fail(ERR.CANNOT_PERFORM, "timeout", { payment_id: p.id, payme_transaction_id: String(params.id) });
        }

        const perform_time = Date.now();
        const { data: updated } = await admin
          .from("platform_payments")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            provider_payment_id: String(params.id),
            metadata: { ...meta, payme_state: 2, perform_time },
          })
          .eq("id", p.id)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();

        if (!updated) {
          return fail(ERR.CANNOT_PERFORM, "concurrent", { payment_id: p.id, payme_transaction_id: String(params.id) });
        }

        await notifyPaymentPaid(admin, {
          provider: "payme",
          amount: Number(p.amount),
          purpose: p.purpose,
          paymentId: p.id,
          userId: (p as { user_id?: string | null }).user_id ?? null,
          transactionId: String(params.id),
        });

        await admin.from("audit_logs").insert({
          action: "payment_completed",
          entity_type: "platform_payments",
          entity_id: p.id,
          details: { provider: "payme", transaction_id: params.id },
        });

        return ok(
          { transaction: p.id, perform_time, state: 2 },
          { payment_id: p.id, payme_transaction_id: String(params.id) },
        );
      }

      // ---------------------------------------------------------------
      case "CancelTransaction": {
        const p = await loadByTx(String(params.id));
        if (!p) return fail(ERR.TX_NOT_FOUND);
        const meta = (p.metadata ?? {}) as Meta;

        if (meta.payme_state === -1 || meta.payme_state === -2) {
          return ok(
            { transaction: p.id, cancel_time: Number(meta.cancel_time), state: meta.payme_state },
            { payment_id: p.id, payme_transaction_id: String(params.id) },
          );
        }

        const cancel_time = Date.now();
        const newState = meta.payme_state === 2 ? -2 : -1;
        await admin.from("platform_payments").update({
          status: newState === -2 ? "refunded" : "cancelled",
          metadata: { ...meta, payme_state: newState, cancel_time, cancel_reason: params.reason ?? null },
        }).eq("id", p.id);

        await admin.from("audit_logs").insert({
          action: newState === -2 ? "payment_refunded" : "payment_cancelled",
          entity_type: "platform_payments",
          entity_id: p.id,
          details: { provider: "payme", transaction_id: params.id, reason: params.reason ?? null },
        });

        return ok(
          { transaction: p.id, cancel_time, state: newState },
          { payment_id: p.id, payme_transaction_id: String(params.id) },
        );
      }

      // ---------------------------------------------------------------
      case "CheckTransaction": {
        const p = await loadByTx(String(params.id));
        if (!p) return fail(ERR.TX_NOT_FOUND);
        const meta = (p.metadata ?? {}) as Meta;
        return ok({
          create_time: Number(meta.create_time ?? 0),
          perform_time: Number(meta.perform_time ?? 0),
          cancel_time: Number(meta.cancel_time ?? 0),
          transaction: p.id,
          state: meta.payme_state ?? 0,
          reason: meta.cancel_reason ?? null,
        }, { payment_id: p.id, payme_transaction_id: String(params.id) });
      }

      // ---------------------------------------------------------------
      case "GetStatement": {
        const from = Number(params?.from);
        const to = Number(params?.to);
        if (!Number.isFinite(from) || !Number.isFinite(to)) return fail(ERR.INVALID_PARAMS, "from/to");

        const { data } = await admin
          .from("platform_payments")
          .select("id,amount,provider_transaction_id,metadata,created_at")
          .eq("provider", "payme")
          .not("provider_transaction_id", "is", null)
          .gte("created_at", new Date(from).toISOString())
          .lte("created_at", new Date(to).toISOString());

        const transactions = (data ?? []).map((r: any) => {
          const meta = (r.metadata ?? {}) as Meta;
          return {
            id: r.provider_transaction_id,
            time: Number(meta.payme_time ?? 0),
            amount: Math.round(Number(r.amount) * 100),
            account: { order_id: r.id },
            create_time: Number(meta.create_time ?? 0),
            perform_time: Number(meta.perform_time ?? 0),
            cancel_time: Number(meta.cancel_time ?? 0),
            transaction: r.id,
            state: meta.payme_state ?? 0,
            reason: meta.cancel_reason ?? null,
          };
        });

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
