import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Reminder {
  id: string;
  appointment_id: string;
  user_id: string;
  kind: string;
  channel: string;
}

const fmtTime = (t: string) => String(t).slice(0, 5);

function buildMessage(kind: string, appt: any) {
  const when = `${appt.appointment_date} ${fmtTime(appt.appointment_time)}`;
  if (kind === "confirmation") {
    return {
      subject: "Qabul tasdiqlandi — MED1.UZ",
      text:
        `Hurmatli ${appt.patient_name}, qabulingiz tasdiqlandi.\n` +
        `Xizmat: ${appt.service_name}\nVaqt: ${when}\nBron kodi: ${appt.booking_code}\n\n` +
        `Bekor qilish yoki vaqtni o'zgartirish: https://med1.uz/doctors`,
    };
  }
  return {
    subject: "Eslatma: qabulgacha 1 soat qoldi — MED1.UZ",
    text:
      `Hurmatli ${appt.patient_name}, qabulingizga 1 soat qoldi.\n` +
      `Xizmat: ${appt.service_name}\nVaqt: ${when}\nBron kodi: ${appt.booking_code}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    const { data: due, error } = await supabase
      .from("doctor_appointment_reminders")
      .select("id, appointment_id, user_id, kind, channel")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(100);

    if (error) throw error;
    if (!due || due.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apptIds = [...new Set(due.map((r: Reminder) => r.appointment_id))];
    const userIds = [...new Set(due.map((r: Reminder) => r.user_id))];

    const [{ data: appts }, { data: profiles }] = await Promise.all([
      supabase
        .from("doctor_ext_appointments")
        .select("id, patient_name, patient_phone, service_name, appointment_date, appointment_time, booking_code, status")
        .in("id", apptIds),
      supabase.from("profiles").select("user_id, full_name, phone, telegram_chat_id").in("user_id", userIds),
    ]);

    const apptMap = new Map((appts || []).map((a: any) => [a.id, a]));
    const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    let sent = 0;
    let skipped = 0;

    for (const r of due as Reminder[]) {
      const appt = apptMap.get(r.appointment_id);
      const prof: any = profMap.get(r.user_id);

      if (!appt || appt.status === "cancelled") {
        await supabase.from("doctor_appointment_reminders")
          .update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", r.id);
        continue;
      }

      const msg = buildMessage(r.kind, appt);
      let ok = false;
      let errText: string | null = null;

      try {
        if (r.channel === "email") {
          const { data: authUser } = await supabase.auth.admin.getUserById(r.user_id);
          const to = authUser?.user?.email;
          if (!to) { errText = "email_missing"; }
          else {
            const res = await supabase.functions.invoke("send-app-email", {
              body: {
                to,
                subject: msg.subject,
                html: `<p>${msg.text.replace(/\n/g, "<br/>")}</p>`,
                purpose: "transactional",
                idempotency_key: `doc-appt-${r.id}`,
              },
            });
            ok = !res.error;
            errText = res.error ? String(res.error.message || res.error) : null;
          }
        } else if (r.channel === "telegram") {
          const chatId = prof?.telegram_chat_id;
          if (!chatId) { errText = "telegram_not_linked"; }
          else {
            const res = await supabase.functions.invoke("telegram-notify", {
              body: { chat_id: chatId, text: msg.text, user_id: r.user_id },
            });
            ok = !res.error;
            errText = res.error ? String(res.error.message || res.error) : null;
          }
        } else if (r.channel === "sms") {
          const phone = appt.patient_phone || prof?.phone;
          const smsToken = Deno.env.get("SMS_API_TOKEN");
          if (!phone) { errText = "phone_missing"; }
          else if (!smsToken) { errText = "sms_provider_not_configured"; }
          else {
            const res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${smsToken}` },
              body: JSON.stringify({ mobile_phone: phone.replace(/\D/g, ""), message: msg.text.slice(0, 300), from: "4546" }),
            });
            ok = res.ok;
            if (!ok) errText = `sms_http_${res.status}`;
          }
        }
      } catch (e) {
        errText = String((e as Error).message);
      }

      if (ok) sent++; else skipped++;

      await supabase.from("doctor_appointment_reminders").update({
        status: ok ? "sent" : errText && /missing|not_linked|not_configured/.test(errText) ? "skipped" : "failed",
        sent_at: ok ? new Date().toISOString() : null,
        error: errText,
        updated_at: new Date().toISOString(),
      }).eq("id", r.id);
    }

    return new Response(JSON.stringify({ processed: due.length, sent, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
