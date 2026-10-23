import { Webhook } from "npm:standardwebhooks@1.0.0";
import { sendEskizSms } from "./eskiz.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: { message: "Method not allowed" } }, 405);
  const secret = Deno.env.get("ESKIZ_SMS_HOOK_SECRET");
  if (!secret) return reply({ error: { message: "SMS hook is not configured" } }, 503);
  const raw = await req.text();
  if (raw.length > 32000) return reply({ error: { message: "Invalid request" } }, 400);
  let event: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    // Standard Webhooks enforces signature + timestamp over the unchanged body.
    const hook = new Webhook(secret.replace(/^v1,whsec_/, ""));
    event = hook.verify(raw, Object.fromEntries(req.headers)) as typeof event;
  } catch {
    return reply({ error: { message: "Invalid hook signature" } }, 401);
  }
  if (typeof event?.user?.phone !== "string" || typeof event?.sms?.otp !== "string") {
    return reply({ error: { message: "Invalid SMS payload" } }, 400);
  }
  try {
    await sendEskizSms({
      email: Deno.env.get("ESKIZ_EMAIL") || "",
      password: Deno.env.get("ESKIZ_PASSWORD") || "",
      template: Deno.env.get("ESKIZ_SMS_TEMPLATE") || "",
    }, event.user.phone, event.sms.otp);
    return reply({});
  } catch {
    // Do not log raw requests, phone numbers, codes, templates or provider tokens.
    return reply({ error: { http_code: 503, message: "SMS yuborilmadi. Keyinroq qayta urinib ko‘ring." } }, 503);
  }
});