import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const HARDCODED_FALLBACKS: Record<string, string> = {
  Stomatolog: "🦷 Tabassumingizni unutmang! Sizga yaqin stomatologiyada maxsus chegirma — hoziroq foydalaning.",
  Kardiolog: "❤️ Yuragingizni tekshiring — yonginangizdagi klinikada bepul ko'rik mavjud.",
  Kosmetolog: "💆‍♀️ O'zingizga vaqt ajrating ✨ Yaqin kosmetologiya markazida bonusli xizmatlar.",
  Pediatr: "👶 Bolangiz salomatligi — eng muhimi. Yaqin pediatriya markazida aksiya bor.",
  Diagnostika: "🔬 Sog'ligingizni tekshiring — yaqin laboratoriyada chegirmali tahlillar.",
  Default: "📍 Sizga yaqin tibbiy markazda maxsus aksiya — ko'rib chiqing!",
};

async function loadTemplates(supabase: any): Promise<Record<string, string>> {
  try {
    const { data } = await supabase
      .from("geo_creative_templates")
      .select("category, template, priority")
      .eq("is_active", true).eq("language", "uz")
      .order("priority", { ascending: false });
    const map: Record<string, string> = {};
    for (const r of data || []) if (!map[r.category]) map[r.category] = r.template;
    return { ...HARDCODED_FALLBACKS, ...map };
  } catch { return HARDCODED_FALLBACKS; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { latitude, longitude, accuracy } = await req.json();
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(JSON.stringify({ error: "lat/lng required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let userId: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
      userId = data.user?.id ?? null;
    }

    // Update consent last_seen
    if (userId) {
      await supabase.from("user_location_consent").upsert({
        user_id: userId, granted: true,
        last_lat: Math.round(latitude * 1000) / 1000,
        last_lng: Math.round(longitude * 1000) / 1000,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    // Fetch nearby clinics within ~3km (rough bbox prefilter)
    const latDelta = 3000 / 111000;
    const lonDelta = 3000 / (111000 * Math.cos((latitude * Math.PI) / 180));
    const { data: clinicsRaw } = await supabase
      .from("registered_clinics")
      .select("id, name, address, category, latitude, longitude, logo_url, phone")
      .eq("is_active", true)
      .gte("latitude", latitude - latDelta).lte("latitude", latitude + latDelta)
      .gte("longitude", longitude - lonDelta).lte("longitude", longitude + lonDelta)
      .limit(40);

    const clinics = (clinicsRaw || [])
      .map((c: any) => ({ ...c, distance_m: c.latitude && c.longitude ? Math.round(haversineM(latitude, longitude, c.latitude, c.longitude)) : null }))
      .filter((c: any) => c.distance_m != null && c.distance_m <= 2000)
      .sort((a: any, b: any) => a.distance_m - b.distance_m);

    if (!clinics.length) {
      return new Response(JSON.stringify({ matches: [], clinics: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const clinicIds = clinics.map((c: any) => c.id);
    const { data: promos } = await supabase
      .from("promotions")
      .select("id, clinic_id, title, description, discount_percent, promo_price, original_price, image_url, expires_at, specialties, radius_m, geo_trigger_enabled, creative_template")
      .eq("is_active", true)
      .eq("geo_trigger_enabled", true)
      .in("clinic_id", clinicIds)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .limit(30);

    // Cooldown: skip promos already sent to user in last 24h
    let recentPromoIds = new Set<string>();
    if (userId) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: recent } = await supabase.from("geo_notifications").select("promo_id").eq("user_id", userId).gte("sent_at", since);
      recentPromoIds = new Set((recent || []).map((r: any) => r.promo_id).filter(Boolean));
    }

    const fallbacks = await loadTemplates(supabase);
    const matches: any[] = [];
    for (const p of promos || []) {
      if (recentPromoIds.has(p.id)) continue;
      const clinic = clinics.find((c: any) => c.id === p.clinic_id);
      if (!clinic || clinic.distance_m == null) continue;
      const radius = p.radius_m || 300;
      if (clinic.distance_m > radius) continue;
      const cat = (clinic.category || "Default") as string;
      const message = p.creative_template ||
        fallbacks[cat] ||
        fallbacks["Default"] ||
        `📍 ${clinic.name} sizdan ${clinic.distance_m}m uzoqlikda — ${p.title}!`;
      matches.push({
        promo_id: p.id, clinic_id: p.clinic_id, clinic_name: clinic.name,
        clinic_lat: clinic.latitude, clinic_lng: clinic.longitude,
        distance_m: clinic.distance_m, title: p.title, description: p.description,
        discount_percent: p.discount_percent, image_url: p.image_url,
        expires_at: p.expires_at, message,
      });
    }
    matches.sort((a, b) => a.distance_m - b.distance_m);
    const top = matches.slice(0, 3);

    // Log notifications
    if (top.length) {
      await supabase.from("geo_notifications").insert(top.map(m => ({
        user_id: userId, promo_id: m.promo_id, clinic_id: m.clinic_id,
        lat: latitude, lng: longitude, distance_m: m.distance_m,
        channel: "web", message: m.message,
      })));
      // Bump promo view_count
      for (const m of top) {
        const { data: pr } = await supabase.from("promotions").select("view_count").eq("id", m.promo_id).single();
        await supabase.from("promotions").update({ view_count: (pr?.view_count || 0) + 1 }).eq("id", m.promo_id);
      }
    }

    return new Response(JSON.stringify({
      matches: top,
      clinics: clinics.slice(0, 10),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("geo-promo-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
