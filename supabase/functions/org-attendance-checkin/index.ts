// Universal check-in/out for any organization staff via QR + GPS.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function distM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000, dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const URL = Deno.env.get("SUPABASE_URL")!;
    const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "unauthorized" }, 401);

    const { token, lat, lng, action } = await req.json();
    if (!token || typeof lat !== "number" || typeof lng !== "number" || !["check_in","check_out"].includes(action))
      return j({ error: "invalid params" }, 400);

    const admin = createClient(URL, SVC);
    const ua = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "";
    const audit = async (owner_id: string | null, staff_id: string | null, result: string, reason: string | null, qr_token_id: string | null, distance: number | null) => {
      try {
        await admin.from("org_attendance_audit_logs").insert({
          owner_id: owner_id || u.user!.id, staff_id, user_id: u.user!.id, action,
          result, reason, qr_token: token?.slice(0, 16), qr_token_id,
          lat, lng, distance_m: distance, device_info: ua.slice(0, 200), ip_address: ip.slice(0, 80),
        });
      } catch {}
    };

    const { data: tok } = await admin.from("org_attendance_qr_tokens").select("*").eq("token", token).maybeSingle();
    if (!tok) { await audit(null, null, "denied", "QR yaroqsiz", null, null); return j({ error: "QR yaroqsiz" }, 400); }
    if (new Date(tok.expires_at).getTime() < Date.now()) { await audit(tok.owner_id, null, "denied", "QR muddati tugagan", tok.id, null); return j({ error: "QR muddati tugagan" }, 400); }

    const { data: staff } = await admin.from("org_attendance_staff").select("*").eq("owner_id", tok.owner_id).eq("user_id", u.user.id).eq("is_active", true).maybeSingle();
    if (!staff) { await audit(tok.owner_id, null, "denied", "Xodim sifatida ro'yxatdan o'tmagan", tok.id, null); return j({ error: "Siz bu tashkilot xodimi sifatida ro'yxatdan o'tmagansiz" }, 403); }

    const { data: settings } = await admin.from("org_attendance_settings").select("*").eq("owner_id", tok.owner_id).maybeSingle();
    let distance = 0;
    if (settings?.enforce_geo && settings?.location_lat != null && settings?.location_lng != null) {
      distance = distM(lat, lng, settings.location_lat, settings.location_lng);
      if (distance > (settings.radius_m ?? 100)) {
        await audit(tok.owner_id, staff.id, "denied", `Joylashuv mos emas (${distance}m > ${settings.radius_m}m)`, tok.id, distance);
        return j({ error: `Joylashuv mos emas (${distance}m, ruxsat: ${settings.radius_m}m)` }, 400);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await admin.from("org_attendance_records").select("*").eq("staff_id", staff.id).eq("attendance_date", today).maybeSingle();
    const now = new Date();

    if (action === "check_in") {
      if (existing?.check_in) { await audit(tok.owner_id, staff.id, "denied", "Bugun allaqachon check-in", tok.id, distance); return j({ error: "Bugun allaqachon check-in qilingan" }, 400); }
      let is_late = false, late_minutes = 0;
      if (settings?.work_start) {
        const [h, m] = settings.work_start.split(":").map(Number);
        const startMin = h*60 + m + (settings.late_threshold_min ?? 0);
        const nowMin = now.getHours()*60 + now.getMinutes();
        if (nowMin > startMin) { is_late = true; late_minutes = nowMin - (h*60 + m); }
      }
      const payload: any = {
        owner_id: tok.owner_id, staff_id: staff.id, attendance_date: today,
        check_in: now.toISOString(), check_in_lat: lat, check_in_lng: lng, check_in_distance_m: distance,
        qr_token_id: tok.id, is_late, late_minutes, device_info: ua.slice(0, 200),
        status: is_late ? "late" : "present",
      };
      const q = existing
        ? admin.from("org_attendance_records").update(payload).eq("id", existing.id).select().single()
        : admin.from("org_attendance_records").insert(payload).select().single();
      const { data, error } = await q;
      if (error) { await audit(tok.owner_id, staff.id, "error", error.message, tok.id, distance); return j({ error: error.message }, 500); }
      await audit(tok.owner_id, staff.id, is_late ? "late" : "success", is_late ? `Kechikish ${late_minutes}d` : null, tok.id, distance);
      return j({ ok: true, attendance: data, late: is_late, late_minutes });
    } else {
      if (!existing?.check_in) { await audit(tok.owner_id, staff.id, "denied", "Check-in qilinmagan", tok.id, distance); return j({ error: "Avval check-in qiling" }, 400); }
      if (existing.check_out) { await audit(tok.owner_id, staff.id, "denied", "Bugun allaqachon check-out", tok.id, distance); return j({ error: "Bugun allaqachon check-out qilingan" }, 400); }
      const worked = Math.round((now.getTime() - new Date(existing.check_in).getTime()) / 60000);
      const { data, error } = await admin.from("org_attendance_records").update({
        check_out: now.toISOString(), check_out_lat: lat, check_out_lng: lng, check_out_distance_m: distance, worked_minutes: worked,
      }).eq("id", existing.id).select().single();
      if (error) { await audit(tok.owner_id, staff.id, "error", error.message, tok.id, distance); return j({ error: error.message }, 500); }
      await audit(tok.owner_id, staff.id, "success", `Ishlangan ${worked}d`, tok.id, distance);
      return j({ ok: true, attendance: data, worked_minutes: worked });
    }
  } catch (e: any) { return j({ error: e?.message || "error" }, 500); }
});
function j(b: any, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
