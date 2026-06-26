import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAiUsageEvent, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI aqlli qidiruv tizimisan. Foydalanuvchi kiritgan so'rov asosida quyidagilarni aniqlaysan:

1. Qidiruv turi: "symptom" (simptom), "service" (xizmat), "specialty" (mutaxassislik), "clinic" (klinika nomi), "location" (joy)
2. Aniqlangan kalit so'zlar
3. Mos mutaxassisliklar
4. Tavsiyalar

MUHIM: Javobni FAQAT JSON formatda ber, boshqa hech narsa yozma.

JSON FORMAT:
{
  "searchType": "symptom|service|specialty|clinic|location",
  "keywords": ["kalit so'z 1", "kalit so'z 2"],
  "matchedSpecialties": ["Kardiologiya", "Terapiya"],
  "matchedServices": ["EKG", "UZI yurak"],
  "possibleConditions": ["Gipertoniya", "Aritmiya"],
  "recommendedSpecialist": "Kardiolog",
  "urgencyLevel": "high|medium|low",
  "searchSuggestions": ["qo'shimcha qidiruv 1", "qo'shimcha qidiruv 2"],
  "aiSummary": "Qisqa tavsif va tavsiya (o'zbek tilida)"
}

SIMPTOM XARITASI (misol):
- bosh og'rig'i → Nevropatolog, Terapevt
- yurak og'rig'i → Kardiolog
- tish og'rig'i → Stomatolog
- ko'z → Oftalmolog
- quloq, burun, tomoq → LOR (Otorinolaringolog)
- qorin og'rig'i → Gastroenterolog
- bel og'rig'i → Nevrolog, Ortoped
- teri → Dermatolog
- bolalar → Pediatr
- homiladorlik → Ginekolog, Akusher
- ruhiy → Psixiatr, Psixolog

XIZMATLAR:
- MRT, KT → Diagnostika
- UZI → Diagnostika, tegishli mutaxassis
- laboratoriya, analiz → Laboratoriya
- stomatologiya → Stomatolog
- kosmetologiya → Kosmetolog
- fizioterapiya → Fizioterapevt`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    // Require authentication to prevent anonymous AI credit drain
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Tizimga kirish talab qilinadi" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const _supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const _serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const _authCheck = createClient(_supabaseUrl, _serviceKey);
    const { data: _u } = await _authCheck.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!_u?.user) {
      return new Response(JSON.stringify({ error: "Sessiya yaroqsiz" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = await createAiUsageEvent({ userId: _u.user.id, serviceId: "ai-smart-search", req, model: "google/gemini-1.5-flash" });

    const { query, latitude, longitude, filters } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      await instrumentError(__usageId, __start, { status: "blocked", errorCode: "bad_request", errorMessage: "Qidiruv so'rovi juda qisqa" });
      return new Response(JSON.stringify({ error: "Qidiruv so'rovi juda qisqa" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 1. AI bilan so'rovni tahlil qilish
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Qidiruv so'rovi: "${query.trim()}"` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      await instrumentError(__usageId, __start, { status: statusFromHttp(aiResponse.status), errorCode: String(aiResponse.status), errorMessage: `AI gateway ${aiResponse.status}` });
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Iltimos, biroz kutib qaytadan urinib ko'ring." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + aiResponse.status);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    await instrumentJson(aiData, __usageId, __start, estimateTokensFromMessages([{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: `Qidiruv so'rovi: "${query.trim()}"` }]), content);

    let aiAnalysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      aiAnalysis = {
        searchType: "clinic",
        keywords: [query.trim()],
        matchedSpecialties: [],
        matchedServices: [],
        possibleConditions: [],
        recommendedSpecialist: "",
        urgencyLevel: "low",
        searchSuggestions: [],
        aiSummary: `"${query}" bo'yicha qidiruv natijalari`,
      };
    }

    // 2. DB dan klinikalar va shifokorlarni qidirish
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchTerms = [...(aiAnalysis.keywords || []), ...(aiAnalysis.matchedSpecialties || [])];
    const queryLower = query.trim().toLowerCase();

    // Search registered clinics
    let clinicsQuery = supabase
      .from("registered_clinics")
      .select("id, name, address, phone, specialties, category, rating:social_links, working_hours, logo_url, logo_external_url, latitude, longitude, description")
      .eq("is_active", true)
      .limit(20);

    // Search by name or specialties
    const orFilters: string[] = [];
    orFilters.push(`name.ilike.%${queryLower}%`);
    orFilters.push(`address.ilike.%${queryLower}%`);
    orFilters.push(`description.ilike.%${queryLower}%`);
    orFilters.push(`category.ilike.%${queryLower}%`);
    
    if (searchTerms.length > 0) {
      for (const term of searchTerms) {
        orFilters.push(`name.ilike.%${term}%`);
        orFilters.push(`description.ilike.%${term}%`);
        orFilters.push(`category.ilike.%${term}%`);
      }
    }

    const { data: clinics } = await supabase
      .from("registered_clinics")
      .select("id, name, address, phone, specialties, category, working_hours, logo_url, logo_external_url, latitude, longitude, description")
      .eq("is_active", true)
      .or(orFilters.join(","))
      .limit(20);

    // Search doctors
    const doctorOrFilters: string[] = [`full_name.ilike.%${queryLower}%`, `specialty.ilike.%${queryLower}%`];
    for (const spec of (aiAnalysis.matchedSpecialties || [])) {
      doctorOrFilters.push(`specialty.ilike.%${spec}%`);
    }
    if (aiAnalysis.recommendedSpecialist) {
      doctorOrFilters.push(`specialty.ilike.%${aiAnalysis.recommendedSpecialist}%`);
    }

    const { data: doctors } = await supabase
      .from("doctors")
      .select("id, full_name, specialty, experience_years, avg_rating, review_count, photo_url, consultation_price, address, city, region, online_consultation, clinic_id")
      .eq("is_active", true)
      .or(doctorOrFilters.join(","))
      .limit(10);

    // Search diagnostics services
    const { data: diagServices } = await supabase
      .from("diagnostics_services")
      .select("id, name, price, category, center_id, description")
      .eq("is_active", true)
      .or(`name.ilike.%${queryLower}%,category.ilike.%${queryLower}%,description.ilike.%${queryLower}%`)
      .limit(10);

    // Search clinic services  
    const { data: clinicServices } = await supabase
      .from("clinic_services")
      .select("id, name, price, clinic_id, description")
      .eq("is_active", true)
      .or(`name.ilike.%${queryLower}%,description.ilike.%${queryLower}%`)
      .limit(10);

    // Calculate distance if coordinates provided
    const resultsWithDistance = (clinics || []).map((clinic: any) => {
      let distance = null;
      if (latitude && longitude && clinic.latitude && clinic.longitude) {
        const R = 6371;
        const dLat = ((clinic.latitude - latitude) * Math.PI) / 180;
        const dLon = ((clinic.longitude - longitude) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((latitude * Math.PI) / 180) * Math.cos((clinic.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
        distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      return { ...clinic, distance };
    });

    // Sort by distance if available
    if (latitude && longitude) {
      resultsWithDistance.sort((a: any, b: any) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    const result = {
      aiAnalysis,
      clinics: resultsWithDistance,
      doctors: doctors || [],
      diagnosticsServices: diagServices || [],
      clinicServices: clinicServices || [],
      totalResults: (resultsWithDistance?.length || 0) + (doctors?.length || 0) + (diagServices?.length || 0) + (clinicServices?.length || 0),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-smart-search error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : String(e) });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
