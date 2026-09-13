import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const allowedTypes = new Set(["all", "clinic", "pharmacy", "diagnostics", "laboratory", "doctor"]);
const includedTypes: Record<string, string[]> = {
  all: ["hospital", "medical_clinic", "doctor", "pharmacy", "medical_lab"],
  clinic: ["hospital", "medical_clinic"], pharmacy: ["pharmacy"],
  diagnostics: ["medical_lab", "medical_clinic"], laboratory: ["medical_lab"], doctor: ["doctor"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Tizimga kirish talab qilinadi" });
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const mapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!supabaseUrl || !anonKey || !lovableKey || !mapsKey) return json(503, { error: "Google Maps ulanishi tayyor emas" });
    const auth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsError } = await auth.auth.getClaims(authHeader.slice(7));
    if (claimsError || !claims?.claims?.sub) return json(401, { error: "Sessiya yaroqsiz" });

    const body = await req.json().catch(() => null);
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    const radius = Math.min(20_000, Math.max(500, Number(body?.radius_meters) || 10_000));
    const type = allowedTypes.has(String(body?.type)) ? String(body.type) : "all";
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return json(400, { error: "Joylashuv koordinatalari noto‘g‘ri" });

    const response = await fetch("https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchNearby", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": mapsKey, "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.regularOpeningHours.openNow,places.googleMapsUri",
      },
      body: JSON.stringify({ includedTypes: includedTypes[type], maxResultCount: 20, rankPreference: "DISTANCE", locationRestriction: { circle: { center: { latitude, longitude }, radius } }, languageCode: "uz", regionCode: "UZ" }),
    });
    if (response.status === 403) return json(503, { error: "Google Places API kaliti bu so‘rovga ruxsat bermadi" });
    if (!response.ok) {
      const details = await response.text();
      console.error(`Google Places failed [${response.status}]: ${details}`);
      return json(response.status, { error: "Google katalogidan ma’lumot olinmadi" });
    }
    const payload = await response.json();
    const places = (payload.places || []).map((place: any) => ({
      id: place.id, name: place.displayName?.text || "Tibbiy xizmat", address: place.formattedAddress || null,
      latitude: place.location?.latitude, longitude: place.location?.longitude, phone: place.nationalPhoneNumber || null,
      primary_type: place.primaryType || null, rating: place.rating || null, reviews: place.userRatingCount || 0,
      open_now: place.regularOpeningHours?.openNow ?? null, maps_url: place.googleMapsUri || null, source: "google",
    }));
    return json(200, { places, radius_meters: radius });
  } catch (error) {
    console.error("google-nearby-medical", error);
    return json(500, { error: error instanceof Error ? error.message : "Server xatoligi" });
  }
});