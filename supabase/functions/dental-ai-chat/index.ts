import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAiUsageEvent, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    // Require authentication — burns LOVABLE AI credits
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Tizimga kirish talab qilinadi" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const _admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: _u } = await _admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!_u?.user) {
      return new Response(JSON.stringify({ error: "Sessiya yaroqsiz" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI kalit topilmadi");

    const systemPrompt = mode === "treatment"
      ? `Sen professional stomatolog AI yordamchisan. Davolash rejalari, materiallar tanlash va risk baholash bo'yicha maslahat berasan. Javoblaringni o'zbek tilida, aniq va professional tarzda ber. Har doim ogohlantirishlarni qo'sh: "Bu AI tavsiyasi - yakuniy qaror shifokor tomonidan qabul qilinishi kerak."`
      : mode === "diagnosis"
      ? `Sen dental rentgen tahlilchi AI san. Tish rentgen tasviri tavsifi asosida mumkin bo'lgan muammolarni aniqla: kariyes, periodontit, suyak yo'qolishi, kista, impaksiya va h.k. Natijalarni tish raqami bilan ko'rsat (FDI tizimi). Har doim ogohlantirishlarni qo'sh.`
      : `Sen stomatologiya bo'yicha AI yordamchisan. Tish davolash, dori tavsiyalari, bemor savollari va klinik qarorlar bo'yicha professional maslahat berasan. Javoblaringni o'zbek tilida ber. Har doim: "Bu AI tavsiyasi" degan ogohlantirishni qo'sh.`;
    __usageId = await createAiUsageEvent({ userId: _u.user.id, serviceId: "dental-ai-chat", req, model: "google/gemini-1.5-flash" });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      await instrumentError(__usageId, __start, { status: statusFromHttp(response.status), errorCode: String(response.status), errorMessage: data?.error?.message || "AI xatolik" });
      throw new Error(data.error?.message || "AI xatolik");
    }

    const reply = data.choices?.[0]?.message?.content || "Javob olinmadi";
    await instrumentJson(data, __usageId, __start, estimateTokensFromMessages([{ role: "system", content: systemPrompt }, ...(messages || [])]), reply);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Xatolik" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
