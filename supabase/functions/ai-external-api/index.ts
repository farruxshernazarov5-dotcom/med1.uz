import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AVAILABLE_SERVICES = [
  "symptom-checker", "ai-doctor-chat", "ai-report-analysis", "ai-health-risk",
  "ai-radiology", "ai-health-assistant", "ai-pregnancy", "ai-baby-care",
  "ai-cosmetology", "ai-dietolog", "ai-psixolog", "ai-farmatsevt",
  "ai-fitness", "ai-vital-signs",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Expected: /ai-external-api/{action}
    // Actions: services, chat/{service-id}

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authenticate via x-api-key header (user's API key from ai_api_keys table or bearer token)
    const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "API kaliti talab qilinadi. 'x-api-key' yoki 'Authorization: Bearer <key>' headerlarini qo'shing.",
        docs: "https://med1.uz/ai-services#api",
      }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = req.method === "POST" ? await req.json() : {};
    const action = pathParts[pathParts.length - 1] || body.action;

    // LIST SERVICES
    if (action === "services" || req.method === "GET") {
      return new Response(JSON.stringify({
        success: true,
        services: AVAILABLE_SERVICES.map(id => ({
          id,
          endpoint: `/ai-external-api`,
          method: "POST",
          body: { action: "chat", service: id, messages: [{ role: "user", content: "..." }] },
        })),
        tariffs: {
          monthly: { starter: 99000, professional: 299000, enterprise: 599000 },
          currency: "UZS",
        },
        rate_limits: { requests_per_minute: 30, requests_per_day: 1000 },
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CHAT
    if (action === "chat") {
      const { service, messages, model, stream } = body;

      if (!service || !AVAILABLE_SERVICES.includes(service)) {
        return new Response(JSON.stringify({
          error: `Noto'g'ri xizmat. Mavjud xizmatlar: ${AVAILABLE_SERVICES.join(", ")}`,
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({
          error: "messages[] massivi talab qilinadi",
          example: { messages: [{ role: "user", content: "Bosh og'rig'i bor" }] },
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Service-specific system prompts
      const systemPrompts: Record<string, string> = {
        "symptom-checker": "Sen Med1.uz AI erta diagnostika tizimisan. Bemorning simptomlarini tahlil qil va ehtimoliy tashxislarni ICD-10 kodlari bilan ko'rsat.",
        "ai-doctor-chat": "Sen tajribali AI shifokor assistentisan. Ilmiy asoslangan maslahatlar ber.",
        "ai-report-analysis": "Sen laboratoriya va tibbiy natijalarni tahlil qiluvchi AI assistentisan.",
        "ai-health-risk": "Sen sog'liq xavfi prognozi bo'yicha AI mutaxassisisisan.",
        "ai-radiology": "Sen AI radiologiya mutaxassisisisan. Tibbiy tasvirlarni tahlil qilasan.",
        "ai-health-assistant": "Sen umumiy sog'liq bo'yicha AI assistentisan.",
        "ai-pregnancy": "Sen homiladorlik va ona-bola sog'lig'i bo'yicha AI mutaxassisisisan.",
        "ai-baby-care": "Sen bola parvarishi va pediatriya bo'yicha AI mutaxassisisisan.",
        "ai-cosmetology": "Sen kosmetologiya va dermatologiya bo'yicha AI mutaxassisisisan.",
        "ai-dietolog": "Sen dietologiya va ovqatlanish bo'yicha AI mutaxassisisisan.",
        "ai-psixolog": "Sen psixologiya bo'yicha AI mutaxassisisisan. Empatic tarzda gaplashasan.",
        "ai-farmatsevt": "Sen farmatsevtika bo'yicha AI mutaxassisisisan. Dorilar o'zaro ta'sirini tekshirasan.",
        "ai-fitness": "Sen fitness va sport tibbiyoti bo'yicha AI mutaxassisisisan.",
        "ai-vital-signs": "Sen vital belgilar tahlili bo'yicha AI mutaxassisisisan.",
      };

      const selectedModel = model || "google/gemini-3-flash-preview";

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompts[service] + "\n\nO'zbek tilida javob ber. Har bir javob oxirida: '⚠️ AI tahlili faqat ma'lumot berish maqsadida. Aniq tashxis uchun shifokor bilan maslahatlashing.'" },
            ...messages,
          ],
          stream: stream !== false,
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit oshdi, keyinroq urinib ko'ring" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Kredit tugagan" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway xatolik: ${status}`);
      }

      if (stream !== false) {
        return new Response(aiResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      }

      const result = await aiResponse.json();
      return new Response(JSON.stringify({
        success: true,
        service,
        model: selectedModel,
        response: result.choices?.[0]?.message?.content || "",
        usage: result.usage,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      error: "Noto'g'ri so'rov",
      available_actions: ["services", "chat"],
      docs: "https://med1.uz/ai-services#api",
    }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("ai-external-api error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
