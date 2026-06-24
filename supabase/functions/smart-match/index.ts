import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAiUsageEvent, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz Smart Match AI tahlilchisisan. Foydalanuvchi matnini tahlil qilib JSON qaytaring.

Format (FAQAT JSON, hech narsa qo'shma):
{
  "keywords": ["kalit so'z"],
  "symptoms": ["simptom"],
  "specialties": ["mutaxassislik (Kardiolog, Stomatolog, Oftalmolog, LOR, Pediatr, Ginekolog, Dermatolog, Nevrolog, Gastroenterolog, Ortoped, Terapevt, Psixiatr, Endokrinolog, Urolog, Kosmetolog)"],
  "intent_score": 0-100,
  "priority": "low|medium|high|critical",
  "is_emergency": false,
  "ai_summary": "1-2 jumla o'zbek tilida"
}

Intent ko'rsatkichlari (yuqori intent):
- "qayerda", "narxi", "tez yordam", "bugun qabul", "shoshilinch", "og'riyapti"
- Critical: hayotga xavfli simptomlar (yurak xurujini, qattiq qon ketishi, hushdan ketish)
- High: aniq xizmat/joy so'rovi
- Medium: simptom tavsifi
- Low: umumiy savol`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const { input_text, source_channel = "web_search", session_id, latitude, longitude, radius_km, city } = await req.json();
    if (!input_text || typeof input_text !== "string" || input_text.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Matn juda qisqa" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const effectiveRadius = typeof radius_km === "number" && radius_km > 0 ? Math.min(500, radius_km) : null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Require authentication to prevent anonymous AI credit drain
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Tizimga kirish talab qilinadi" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    const userId = userData.user?.id ?? null;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Sessiya yaroqsiz" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = await createAiUsageEvent({ userId, serviceId: "smart-match", req, model: "google/gemini-3-flash-preview" });

    // 1. AI analysis
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: input_text.trim().slice(0, 1500) },
        ],
      }),
    });
    if (!aiRes.ok) {
      await instrumentError(__usageId, __start, { status: statusFromHttp(aiRes.status), errorCode: String(aiRes.status), errorMessage: `AI gateway ${aiRes.status}` });
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "AI limiti oshdi" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI krediti tugadi" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error " + aiRes.status);
    }
    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    let analysis: any;
    try {
      const m = content.match(/\{[\s\S]*\}/);
      analysis = m ? JSON.parse(m[0]) : null;
    } catch { analysis = null; }
    if (!analysis) {
      analysis = { keywords: [input_text.slice(0, 50)], symptoms: [], specialties: [], intent_score: 30, priority: "low", is_emergency: false, ai_summary: input_text.slice(0, 100) };
    }

    const specialties: string[] = analysis.specialties || [];
    const keywords: string[] = analysis.keywords || [];

    // 2. Match clinics
    const orFilter: string[] = [];
    for (const s of specialties) orFilter.push(`category.ilike.%${s}%`, `description.ilike.%${s}%`);
    for (const k of keywords.slice(0, 5)) orFilter.push(`name.ilike.%${k}%`, `description.ilike.%${k}%`);

    let clinics: any[] = [];
    if (orFilter.length) {
      const { data } = await supabase
        .from("registered_clinics")
        .select("id, name, address, phone, category, latitude, longitude, logo_url, service_radius_km, service_city, accepts_remote_patients")
        .eq("is_active", true)
        .or(orFilter.join(","))
        .limit(40);
      clinics = data || [];
    }

    // 3. Match doctors
    const docFilter: string[] = [];
    for (const s of specialties) docFilter.push(`specialty.ilike.%${s}%`);
    let doctors: any[] = [];
    if (docFilter.length) {
      const { data } = await supabase
        .from("doctors")
        .select("id, full_name, specialty, photo_url, consultation_price, avg_rating, online_consultation, clinic_id")
        .eq("is_active", true)
        .or(docFilter.join(","))
        .limit(5);
      doctors = data || [];
    }

    // 4. Match active promotions
    let promotions: any[] = [];
    if (specialties.length || keywords.length) {
      const { data } = await supabase
        .from("promotions")
        .select("id, clinic_id, title, description, discount_percent, promo_price, original_price, image_url, expires_at, specialties, keywords")
        .eq("is_active", true)
        .or(`specialties.ov.{${specialties.join(",")}},keywords.ov.{${keywords.join(",")}}`)
        .limit(6);
      promotions = data || [];
    }

    // Distance + radius filtering
    if (latitude && longitude) {
      const R = 6371;
      clinics = clinics.map((c: any) => {
        if (c.latitude && c.longitude) {
          const dLat = ((c.latitude - latitude) * Math.PI) / 180;
          const dLon = ((c.longitude - longitude) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((latitude * Math.PI) / 180) * Math.cos((c.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
          c.distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        return c;
      });
      // Apply radius filter (use min of user radius and clinic service radius)
      if (effectiveRadius) {
        const filtered = clinics.filter((c: any) => {
          if (c.distance == null) return c.accepts_remote_patients !== false;
          const clinicLimit = c.service_radius_km || 9999;
          return c.distance <= effectiveRadius && c.distance <= clinicLimit;
        });
        // Keep some fallback if filter too strict
        clinics = filtered.length > 0 ? filtered : clinics.filter((c: any) => c.accepts_remote_patients !== false).slice(0, 5);
      }
      clinics.sort((a: any, b: any) => (a.distance ?? 9999) - (b.distance ?? 9999));
      clinics = clinics.slice(0, 8);
    } else if (city) {
      // No coords: bias by city match
      clinics.sort((a: any, b: any) => {
        const am = (a.service_city || a.address || "").toLowerCase().includes(city.toLowerCase()) ? 0 : 1;
        const bm = (b.service_city || b.address || "").toLowerCase().includes(city.toLowerCase()) ? 0 : 1;
        return am - bm;
      });
      clinics = clinics.slice(0, 8);
    } else {
      clinics = clinics.slice(0, 8);
    }

    // 5. Persist recommendation
    const { data: recRow } = await supabase.from("ai_recommendations").insert({
      user_id: userId,
      session_id: session_id || null,
      source_channel,
      input_text: input_text.slice(0, 2000),
      detected_keywords: keywords.slice(0, 20),
      detected_specialties: specialties.slice(0, 10),
      detected_symptoms: (analysis.symptoms || []).slice(0, 20),
      intent_score: Math.max(0, Math.min(100, Number(analysis.intent_score) || 0)),
      priority: ["low", "medium", "high", "critical"].includes(analysis.priority) ? analysis.priority : "low",
      matched_clinic_ids: clinics.map((c: any) => c.id),
      matched_doctor_ids: doctors.map((d: any) => d.id),
      matched_promotion_ids: promotions.map((p: any) => p.id),
      ai_summary: analysis.ai_summary || null,
    }).select("id").single();

    // 6. Update user segment (best-effort)
    if (userId) {
      const segment = analysis.is_emergency ? "emergency"
        : (analysis.intent_score >= 70 ? "high_intent" : "low_intent");
      await supabase.from("user_segments").upsert({
        user_id: userId,
        segment,
        intent_avg: analysis.intent_score,
        last_activity_at: new Date().toISOString(),
        preferred_specialties: specialties,
      }, { onConflict: "user_id" });
    }

    // 7. Bump impressions
    if (promotions.length) {
      const ids = promotions.map((p: any) => p.id);
      await supabase.rpc("increment_promo_impressions", { _ids: ids }).catch(() => null);
      // Fallback raw update
      for (const p of promotions) {
        await supabase.from("promotions").update({ view_count: (p.view_count || 0) + 1 }).eq("id", p.id);
      }
    }

    await instrumentJson(aiData, __usageId, __start, estimateTokensFromMessages([{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: input_text.trim().slice(0, 1500) }]), content);
    return new Response(JSON.stringify({
      recommendation_id: recRow?.id,
      analysis,
      clinics,
      doctors,
      promotions,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("smart-match error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
