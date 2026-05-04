// Performs check-in or check-out validating QR token + GPS distance.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function distM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "unauthorized" }, 401);

    const body = await req.json();
    const { token, lat, lng, action } = body as { token: string; lat: number; lng: number; action: "check_in" | "check_out" };
    if (!token || typeof lat !== "number" || typeof lng !== "number" || !["check_in", "check_out"].includes(action))
      return j({ error: "invalid params" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Validate token
    const { data: tok } = await admin.from("hms_attendance_qr_tokens").select("*").eq("token", token).maybeSingle();
    if (!tok) return j({ error: "QR yaroqsiz" }, 400);
    if (new Date(tok.expires_at).getTime() < Date.now()) return j({ error: "QR muddati tugagan" }, 400);

    const clinic_id = tok.clinic_id;

    // Find staff (linked to user)
    const { data: staff } = await admin.from("hms_staff").select("*").eq("clinic_id", clinic_id).eq("user_id", u.user.id).maybeSingle();
    if (!staff) return j({ error: "Siz bu klinika xodimi sifatida ro'yxatdan o'tmagansiz" }, 403);

    // Settings
    const { data: settings } = await admin.from("hms_attendance_settings").select("*").eq("clinic_id", clinic_id).maybeSingle();
    let distance = 0;
    let suspicious = false;
    if (settings?.enforce_geo && settings?.location_lat != null && settings?.location_lng != null) {
      distance = distM(lat, lng, settings.location_lat, settings.location_lng);
      if (distance > (settings.radius_m ?? 100)) {
        return j({ error: `Joylashuv mos emas (${distance}m, ruxsat: ${settings.radius_m}m)` }, 400);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await admin
      .from("hms_attendance")
      .select("*")
      .eq("staff_id", staff.id)
      .eq("attendance_date", today)
      .maybeSingle();

    const ua = req.headers.get("user-agent") || "";
    const now = new Date();

    if (action === "check_in") {
      if (existing?.check_in) return j({ error: "Bugun allaqachon check-in qilingan" }, 400);
      // Late detection
      let is_late = false, late_minutes = 0;
      if (settings?.work_start) {
        const [h, m] = settings.work_start.split(":").map(Number);
        const startMin = h * 60 + m + (settings.late_threshold_min ?? 0);
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (nowMin > startMin) { is_late = true; late_minutes = nowMin - (h * 60 + m); }
      }
      const payload: any = {
        clinic_id, staff_id: staff.id, attendance_date: today,
        check_in: now.toISOString(),
        check_in_lat: lat, check_in_lng: lng, check_in_distance_m: distance,
        qr_token_id: tok.id, is_late, late_minutes,
        device_info: ua.slice(0, 200), suspicious,
        status: is_late ? "late" : "present",
      };
      const q = existing
        ? admin.from("hms_attendance").update(payload).eq("id", existing.id).select().single()
        : admin.from("hms_attendance").insert(payload).select().single();
      const { data, error } = await q;
      if (error) return j({ error: error.message }, 500);
      return j({ ok: true, attendance: data, late: is_late, late_minutes });
    } else {
      if (!existing?.check_in) return j({ error: "Avval check-in qiling" }, 400);
      if (existing.check_out) return j({ error: "Bugun allaqachon check-out qilingan" }, 400);
      const worked = Math.round((now.getTime() - new Date(existing.check_in).getTime()) / 60000);
      const { data, error } = await admin
        .from("hms_attendance")
        .update({
          check_out: now.toISOString(),
          check_out_lat: lat, check_out_lng: lng, check_out_distance_m: distance,
          worked_minutes: worked,
        })
        .eq("id", existing.id).select().single();
      if (error) return j({ error: error.message }, 500);
      return j({ ok: true, attendance: data, worked_minutes: worked });
    }
  } catch (e: any) {
    return j({ error: e?.message || "error" }, 500);
  }
});

function j(b: any, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
