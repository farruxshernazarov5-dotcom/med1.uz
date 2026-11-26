// Uzum Bank Merchant API — /check, /create, /confirm, /reverse, /status.
// Protocol: POST application/json + Basic Auth; amounts are integer tiyin.
// Docs: https://developer.uzumbank.uz/uz/merchant
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { notifyPaymentPaid } from "../_shared/payment-notify.ts";
import {
  expectedUzumServiceId,
  uzumMethodFromPath,
  uzumOrderIdFromParams,
  uzumResponseData,
  verifyUzumBasicAuth,
} from "../_shared/uzum-merchant.ts";

const MAX_BODY_BYTES = 64 * 1024;
const serviceIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const timestampSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const baseShape = { serviceId: serviceIdSchema, timestamp: timestampSchema };
const checkSchema = z.object({ ...baseShape, params: z.record(z.unknown()) }).passthrough();
const createSchema = z.object({
  ...baseShape,
  transId: z.string().uuid(),
  params: z.record(z.unknown()),
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).passthrough();
const confirmSchema = z.object({
  ...baseShape,
  transId: z.string().uuid(),
  paymentSource: z.string().min(1).max(64),
  tariff: z.string().max(64).nullish(),
  processingReferenceNumber: z.string().max(128).nullish(),
  phone: z.string().min(1).max(32),
  cardType: z.number().int().positive().optional(),
}).passthrough();
const transactionSchema = z.object({ ...baseShape, transId: z.string().uuid() }).passthrough();

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  purpose: string;
  user_id: string;
  metadata: Record<string, unknown> | null;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function protocolError(errorCode: string, details: Record<string, unknown> = {}) {
  return json(400, { status: "FAILED", timestamp: Date.now(), errorCode, ...details });
}

function validationErrorCode(error: z.ZodError): "10002" | "10005" {
  const missing = error.issues.some((issue) =>
    issue.code === "invalid_type" && "received" in issue && issue.received === "undefined"
  );
  return missing ? "10005" : "10002";
}

function configuredServiceId(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const method = uzumMethodFromPath(new URL(req.url).pathname);
  if (!method) return json(404, { status: "FAILED", errorCode: "10003" });
  if (req.method !== "POST") return protocolError("10003", { serviceId: 0 });

  const username = Deno.env.get("UZUM_BASIC_AUTH_USERNAME") ?? "";
  const password = Deno.env.get("UZUM_BASIC_AUTH_PASSWORD") ?? "";
  if (!username || !password) {
    console.error("uzum-webhook: Basic Auth credentials are not configured");
    return protocolError("99999");
  }
  if (!verifyUzumBasicAuth(req.headers.get("Authorization"), username, password)) {
    return protocolError("10001");
  }

  const liveServiceId = configuredServiceId(Deno.env.get("UZUM_SERVICE_ID"));
  const sandboxServiceId = configuredServiceId(Deno.env.get("UZUM_SERVICE_ID_SANDBOX")) ?? liveServiceId;
  if (!liveServiceId && !sandboxServiceId) {
    console.error("uzum-webhook: service ID is not configured");
    return protocolError("99999");
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return protocolError("10002");
  let input: unknown;
  try {
    input = JSON.parse(raw || "null");
  } catch {
    return protocolError("10002");
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const loadPayment = async (orderId: string) => {
    const { data, error } = await admin
      .from("platform_payments")
      .select("id,amount,status,purpose,user_id,metadata")
      .eq("id", orderId)
      .eq("provider", "uzum")
      .maybeSingle();
    if (error) throw error;
    return data as PaymentRow | null;
  };

  const paymentServiceMatches = (payment: PaymentRow, serviceId: number) => {
    const expected = expectedUzumServiceId(payment.metadata, liveServiceId, sandboxServiceId);
    return expected !== null && expected === serviceId;
  };

  try {
    if (method === "check") {
      const parsed = checkSchema.safeParse(input);
      if (!parsed.success) return protocolError(validationErrorCode(parsed.error));
      const { serviceId, params } = parsed.data;
      if (serviceId !== liveServiceId && serviceId !== sandboxServiceId) return protocolError("10006");
      const orderId = uzumOrderIdFromParams(params);
      if (!orderId) return protocolError("10007");
      const payment = await loadPayment(orderId);
      if (!payment || !paymentServiceMatches(payment, serviceId)) return protocolError("10007");
      if (["paid", "completed"].includes(payment.status)) return protocolError("10008");
      if (payment.status !== "pending") return protocolError("10009");
      return json(200, {
        serviceId,
        timestamp: Date.now(),
        status: "OK",
        data: uzumResponseData(payment.id),
      });
    }

    if (method === "create") {
      const parsed = createSchema.safeParse(input);
      if (!parsed.success) return protocolError(validationErrorCode(parsed.error));
      const { serviceId, transId, params, amount } = parsed.data;
      if (serviceId !== liveServiceId && serviceId !== sandboxServiceId) return protocolError("10006");
      const orderId = uzumOrderIdFromParams(params);
      if (!orderId) return protocolError("10007");
      const payment = await loadPayment(orderId);
      if (!payment || !paymentServiceMatches(payment, serviceId)) return protocolError("10007");
      if (["paid", "completed"].includes(payment.status)) return protocolError("10008");
      if (payment.status !== "pending") return protocolError("10009");

      const transTime = Date.now();
      const { data: result, error } = await admin.rpc("uzum_payment_transition", {
        _action: "create",
        _trans_id: transId,
        _payment_id: payment.id,
        _service_id: serviceId,
        _amount_tiyin: amount,
        _event_time: transTime,
      });
      if (error) throw error;
      if (!result?.ok) return protocolError(String(result?.error_code ?? "99999"));
      return json(200, {
        serviceId,
        transId,
        status: "CREATED",
        transTime: Number(result.trans_time),
        data: uzumResponseData(payment.id),
        amount: Number(result.amount_tiyin),
      });
    }

    if (method === "confirm") {
      const parsed = confirmSchema.safeParse(input);
      if (!parsed.success) return protocolError(validationErrorCode(parsed.error));
      const { serviceId, transId, paymentSource } = parsed.data;
      const confirmTime = Date.now();
      const { data: result, error } = await admin.rpc("uzum_payment_transition", {
        _action: "confirm",
        _trans_id: transId,
        _service_id: serviceId,
        _event_time: confirmTime,
        _payment_source: paymentSource,
      });
      if (error) throw error;
      if (!result?.ok) return protocolError(String(result?.error_code ?? "99999"), { serviceId, transId });

      await notifyPaymentPaid(admin, {
        provider: "uzum",
        amount: Number(result.amount),
        purpose: String(result.purpose),
        paymentId: String(result.payment_id),
        userId: String(result.user_id),
        transactionId: transId,
      });
      return json(200, {
        serviceId,
        transId,
        status: "CONFIRMED",
        confirmTime: Number(result.confirm_time),
        data: uzumResponseData(String(result.payment_id)),
        amount: Number(result.amount_tiyin),
      });
    }

    if (method === "reverse") {
      const parsed = transactionSchema.safeParse(input);
      if (!parsed.success) return protocolError(validationErrorCode(parsed.error));
      const { serviceId, transId } = parsed.data;
      const reverseTime = Date.now();
      const { data: result, error } = await admin.rpc("uzum_payment_transition", {
        _action: "reverse",
        _trans_id: transId,
        _service_id: serviceId,
        _event_time: reverseTime,
      });
      if (error) throw error;
      if (!result?.ok) return protocolError(String(result?.error_code ?? "99999"), { serviceId, transId });
      return json(200, {
        serviceId,
        transId,
        status: "REVERSED",
        reverseTime: Number(result.reverse_time),
        data: uzumResponseData(String(result.payment_id)),
        amount: Number(result.amount_tiyin),
      });
    }

    const parsed = transactionSchema.safeParse(input);
    if (!parsed.success) return protocolError(validationErrorCode(parsed.error));
    const { serviceId, transId } = parsed.data;
    const { data: transaction, error } = await admin
      .from("uzum_transactions")
      .select("trans_id,payment_id,service_id,amount_tiyin,status,trans_time,confirm_time,reverse_time")
      .eq("trans_id", transId)
      .maybeSingle();
    if (error) throw error;
    if (!transaction || Number(transaction.service_id) !== serviceId) {
      return protocolError("10014", { serviceId, transId });
    }
    return json(200, {
      serviceId,
      transId,
      status: transaction.status,
      transTime: Number(transaction.trans_time),
      confirmTime: transaction.confirm_time === null ? null : Number(transaction.confirm_time),
      reverseTime: transaction.reverse_time === null ? null : Number(transaction.reverse_time),
      data: uzumResponseData(String(transaction.payment_id)),
      amount: Number(transaction.amount_tiyin),
    });
  } catch (error) {
    console.error("uzum-webhook error", error instanceof Error ? error.message : String(error));
    return protocolError("99999");
  }
});
