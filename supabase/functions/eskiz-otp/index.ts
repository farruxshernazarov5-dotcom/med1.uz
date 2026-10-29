import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendEskizSms } from "../_shared/eskiz.ts";

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const PHONE_RE = /^\+998\d{9}$/;
const TTL_MS = 5 * 60_000, COOLDOWN_MS = 60_000, WINDOW_MS = 60 * 60_000, MAX_SENDS = 5, MAX_ATTEMPTS = 5;

async function hash(phone: string, code: string) {
  const pepper = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${pepper}:${phone}:${code}`));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function otp() {
  const b = new Uint32Array(1); crypto.getRandomValues(b);
  return (100000 + (b[0] % 900000)).toString();
}
async function findProfileUser(phone: string) {
  const { data } = await supabase.from("profiles").select("user_id").eq("phone", phone).limit(1).maybeSingle();
  return data?.user_id as string | undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const path = new URL(req.url).pathname.split("/").pop();
  let body: { phone?: unknown; otp?: unknown };
  try { body = await req.json(); } catch { return reply({ error: "Noto‘g‘ri so‘rov" }, 400); }
  const phone = String(body.phone ?? "").replace(/[\s()-]/g, "");
  if (!PHONE_RE.test(phone)) return reply({ error: "Telefon raqam +998XXXXXXXXX ko‘rinishida bo‘lsin" }, 400);

  if (path === "send-otp") {
    // Only registered numbers get SMS: avoids paid-SMS abuse and duplicate profiles.
    if (!(await findProfileUser(phone))) {
      return reply({ error: "not_registered", message: "Bu raqam bilan hisob topilmadi. Avval ro‘yxatdan o‘ting." });
    }
    const now = Date.now();
    const { data: cur } = await supabase.from("sms_otp").select("*").eq("phone", phone).maybeSingle();
    if (cur?.last_sent_at && now - new Date(cur.last_sent_at).getTime() < COOLDOWN_MS) {
      return reply({ error: "cooldown", message: "Yangi kodni 1 daqiqadan keyin so‘rang." });
    }
    const inWindow = cur?.window_start && now - new Date(cur.window_start).getTime() < WINDOW_MS;
    const count = inWindow ? (cur?.send_count ?? 0) : 0;
    if (count >= MAX_SENDS) return reply({ error: "limit", message: "Juda ko‘p urinish. 1 soatdan keyin qayta urinib ko‘ring." });
    const code = otp();
    try {
      await sendEskizSms({
        email: Deno.env.get("ESKIZ_EMAIL") || "",
        password: Deno.env.get("ESKIZ_PASSWORD") || "",
        template: Deno.env.get("ESKIZ_SMS_TEMPLATE") || "",
      }, phone, code);
    } catch (e) {
      console.error("eskiz send failed:", (e as Error).message); // no phone/code in logs
      if ((e as Error).message === "invalid_sms_template") {
        console.error("Approved OTP template has no unambiguous code field");
      }
      const reason = (e as Error).message;
      return reply({ error: "send_failed", message: reason === "eskiz_template_not_approved"
        ? "Eskiz kodli SMS matnini qabul qilmadi. Hozircha Telegram orqali kiring."
        : reason === "invalid_sms_template"
          ? "SMS matnida kod o‘rni sozlanmagan. Hozircha Telegram orqali kiring."
          : "SMS yuborilmadi. Keyinroq yoki Telegram orqali urinib ko‘ring." });
    }
    await supabase.from("sms_otp").upsert({
      phone, code_hash: await hash(phone, code), expires_at: new Date(now + TTL_MS).toISOString(),
      attempts: 0, last_sent_at: new Date(now).toISOString(),
      window_start: inWindow ? cur?.window_start : new Date(now).toISOString(),
      send_count: count + 1, updated_at: new Date(now).toISOString(),
    }, { onConflict: "phone" });
    return reply({ success: true });
  }

  if (path === "verify-otp") {
    const code = String(body.otp ?? "");
    if (!/^\d{6}$/.test(code)) return reply({ error: "Kod 6 raqamdan iborat" });
    const { data: rec } = await supabase.from("sms_otp").select("*").eq("phone", phone).maybeSingle();
    if (!rec?.code_hash) return reply({ error: "Avval kod so‘rang" });
    if (new Date(rec.expires_at).getTime() < Date.now()) return reply({ error: "Kod muddati tugagan" });
    if (rec.code_hash !== await hash(phone, code)) {
      const attempts = rec.attempts + 1;
      await supabase.from("sms_otp").update(
        attempts >= MAX_ATTEMPTS ? { code_hash: null, attempts: 0 } : { attempts },
      ).eq("phone", phone);
      return reply({ error: attempts >= MAX_ATTEMPTS ? "Urinishlar tugadi. Yangi kod so‘rang." : "Noto‘g‘ri kod" });
    }
    await supabase.from("sms_otp").update({ code_hash: null, attempts: 0, updated_at: new Date().toISOString() }).eq("phone", phone);
    const userId = await findProfileUser(phone);
    if (userId) {
      const { data: u } = await supabase.auth.admin.getUserById(userId);
      if (u?.user?.email) {
        const { data: link, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
        if (link && !error) return reply({ success: true, verified: true, has_account: true, hashed_token: link.properties.hashed_token });
      }
    }
    return reply({ success: true, verified: true, has_account: false });
  }
  return reply({ error: "Not found" }, 404);
});
