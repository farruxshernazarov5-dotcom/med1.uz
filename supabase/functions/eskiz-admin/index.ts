import { createClient } from "npm:@supabase/supabase-js@2";
import { buildSms, eskizToken, eskizTemplates } from "../_shared/eskiz.ts";
import { renderTransactionalSms, SMS_TEMPLATE_IDS, type SmsEvent } from "../_shared/transactional-sms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return reply({ error: "not_configured" }, 503);
  const db = createClient(url, key);
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return reply({ error: "unauthorized" }, 401);
  const { data: auth, error } = await db.auth.getUser(jwt);
  if (error || !auth.user) return reply({ error: "unauthorized" }, 401);
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin");
  if (!roles?.length) return reply({ error: "forbidden" }, 403);
  let body: { previews?: unknown };
  try { body = await req.json(); } catch { return reply({ error: "invalid_request" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return reply({ error: "invalid_request" }, 400);
  if (body.previews !== undefined && (!Array.isArray(body.previews) || body.previews.length > 7)) {
    return reply({ error: "invalid_sms_arguments" }, 400);
  }
  try {
    const token = await eskizToken({ email: Deno.env.get("ESKIZ_EMAIL") || "", password: Deno.env.get("ESKIZ_PASSWORD") || "" });
    const templates = await eskizTemplates(token);
    const transactional = Object.entries(SMS_TEMPLATE_IDS).map(([event, id]) => {
      const template = templates.find(t => t.id === id && t.status === "service");
      return { event, templateId: id, approved: Boolean(template?.originalText && template.text),
        parameterCount: (template?.originalText.match(/%s/g) ?? []).length };
    });
    const previews = [];
    for (const item of (body.previews ?? []) as unknown[]) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return reply({ error: "invalid_sms_arguments" }, 400);
      const input = item as { event?: unknown; values?: unknown };
      if (typeof input.event !== "string" || !Object.hasOwn(SMS_TEMPLATE_IDS, input.event) || !Array.isArray(input.values)) {
        return reply({ error: "invalid_sms_arguments" }, 400);
      }
      try {
        previews.push({ event: input.event, message: renderTransactionalSms(input.event as SmsEvent, input.values, templates) });
      } catch { return reply({ error: "sms_preview_invalid", event: input.event }, 400); }
    }
    const saved = Deno.env.get("ESKIZ_SMS_TEMPLATE") || "";
    const expected = "Med1.uz tasdiqlash kodi: {code}. Kodni hech kimga, hatto kompaniya xodimlariga ham bermang!";
    // Only return public provider templates and shape checks, never secret values or live OTPs.
    let valid = false;
    try { buildSms("+998900000000", "123456", saved); valid = true; } catch { /* shape only */ }
    return reply({ templates, transactional, previews, sent: false, otp: { exactExpected: saved === expected, validCodeMarker: valid } });
  } catch {
    return reply({ error: "Eskiz hisobini yoki matnlarini tekshirib bo‘lmadi" }, 502);
  }
});