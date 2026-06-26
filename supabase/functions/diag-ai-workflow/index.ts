// AI Workflow function for Diagnostics: auto-assign orders to staff and radiology assistance
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAiUsageEvent, estimateTokensFromMessages } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    // Require authentication — burns LOVABLE AI credits
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const _admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: _u } = await _admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!_u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action || body.mode;
    const { orders, staff, modality, body_part, image_url } = body;

    // SSRF protection: only allow image_url from Supabase storage origin
    if (image_url && typeof image_url === "string") {
      const allowed = (Deno.env.get("SUPABASE_URL") || "");
      if (!image_url.startsWith(allowed) && !image_url.startsWith("https://wiqcfyecdmararxqdmfk.supabase.co")) {
        return new Response(JSON.stringify({ error: "image_url manbai ruxsat etilmagan" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");




    if (action === "auto_assign") {
      __usageId = await createAiUsageEvent({ userId: _u.user.id, serviceId: "diag-ai-workflow:auto_assign", req, model: "google/gemini-1.5-flash" });
      const systemPrompt = `Siz diagnostika markazi ish jarayonini optimallashtiruvchi AI yordamchisiz.
Buyurtmalarni xodimlarga taqsimlang quyidagi qoidalar bo'yicha:
- Radiologiya buyurtmalari -> radiolog roliga
- Lab buyurtmalari -> laborant roliga
- Funksional testlar -> shifokor yoki texnik
- "Ishda" (on_duty=true) bo'lgan xodimlarga ustunlik bering
- Mutaxassislik xizmat turiga mos bo'lsa ustunlik bering
- Ish yuklamasini teng taqsimlang
Faqat tool call orqali javob bering.`;

      const userMsg = `Buyurtmalar:\n${JSON.stringify(orders, null, 2)}\n\nXodimlar:\n${JSON.stringify(staff, null, 2)}\n\nHar bir buyurtmani eng mos xodimga taqsimlang.`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-1.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg },
          ],
          tools: [{
            type: "function",
            function: {
              name: "assign_orders",
              description: "Buyurtmalarni xodimlarga taqsimlash",
              parameters: {
                type: "object",
                properties: {
                  assignments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        order_id: { type: "string" },
                        staff_id: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["order_id", "staff_id"],
                    },
                  },
                },
                required: ["assignments"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "assign_orders" } },
        }),
      });

      if (!aiRes.ok) {
        const t = await aiRes.text();
        await instrumentError(__usageId, __start, { status: statusFromHttp(aiRes.status), errorCode: String(aiRes.status), errorMessage: t.slice(0, 500) });
        if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI: ${t}`);
      }

      const aiData = await aiRes.json();
      const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : { assignments: [] };
      await instrumentJson(aiData, __usageId, __start, estimateTokensFromMessages([{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }]), args || JSON.stringify(parsed));

      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "radiology_assist") {
      __usageId = await createAiUsageEvent({ userId: _u.user.id, serviceId: "diag-ai-workflow:radiology_assist", req, model: "google/gemini-1.5-pro" });
      const systemPrompt = `Siz tajribali radiolog AI yordamchisisiz. Tasvirni tahlil qilib, ${modality} tadqiqoti uchun professional Findings va Impression yozing.
MUHIM: Bu faqat dastlabki taklif. Yakuniy diagnostika faqat sertifikatlangan radiolog tomonidan tasdiqlanishi kerak.
ICD-10 kodlarini qo'shing agar mos bo'lsa.
O'zbek tilida yozing.`;

      const userContent: any = [
        { type: "text", text: `Modality: ${modality}\nBody part: ${body_part || "Belgilanmagan"}\n\nIltimos, tasvirni tahlil qiling va Findings va Impression bering.` },
      ];
      if (image_url) userContent.push({ type: "image_url", image_url: { url: image_url } });

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-1.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          tools: [{
            type: "function",
            function: {
              name: "radiology_report",
              parameters: {
                type: "object",
                properties: {
                  findings: { type: "string", description: "Tasvirda kuzatilgan o'zgarishlar" },
                  impression: { type: "string", description: "Diagnostik xulosa va tavsiyalar" },
                },
                required: ["findings", "impression"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "radiology_report" } },
        }),
      });

      if (!aiRes.ok) {
        await instrumentError(__usageId, __start, { status: statusFromHttp(aiRes.status), errorCode: String(aiRes.status), errorMessage: `AI gateway ${aiRes.status}` });
        if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await aiRes.text();
        throw new Error(`AI: ${t}`);
      }

      const aiData = await aiRes.json();
      const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : {};
      await instrumentJson(aiData, __usageId, __start, estimateTokensFromMessages([{ role: "system", content: systemPrompt }, { role: "user", content: userContent }]), args || JSON.stringify(parsed));
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "explain_results") {
      __usageId = await createAiUsageEvent({ userId: _u.user.id, serviceId: "diag-ai-workflow:explain_results", req, model: "google/gemini-1.5-flash" });
      const { patient_name, patient_gender, patient_dob, test_name, results_summary } = body;
      const systemPrompt = `Siz tajribali shifokor-laborantsiz. Bemor uchun analiz natijalarini sodda, tushunarli o'zbek tilida tushuntiring.
- Har bir abnormal qiymat nimani anglatishi mumkinligini ayting (umumiy ma'noda)
- Tavsiyalar bering (ovqatlanish, turmush tarzi)
- Qachon shifokorga murojaat qilish kerakligini aniq aytib bering
- Bemorni qo'rqitmang, lekin jiddiy holatlarda ogohlantiring
- Maksimum 250 so'z
- Oxirida disclaimer: "Bu AI tushuntirish, to'liq tashxis uchun shifokorga murojaat qiling"`;

      const userMsg = `Bemor: ${patient_name || "—"} (${patient_gender || "—"}, tug'ilgan: ${patient_dob || "—"})
Tekshiruv: ${test_name}

Natijalar:
${results_summary}

Iltimos, bu natijalarni tushuntiring.`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-1.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg },
          ],
        }),
      });

      if (!aiRes.ok) {
        await instrumentError(__usageId, __start, { status: statusFromHttp(aiRes.status), errorCode: String(aiRes.status), errorMessage: `AI gateway ${aiRes.status}` });
        if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await aiRes.text();
        throw new Error(`AI: ${t}`);
      }
      const aiData = await aiRes.json();
      const explanation = aiData.choices?.[0]?.message?.content || "AI javob bermadi";
      await instrumentJson(aiData, __usageId, __start, estimateTokensFromMessages([{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }]), explanation);
      return new Response(JSON.stringify({ explanation }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await instrumentError(__usageId, __start, { status: "blocked", errorCode: "unknown_action", errorMessage: String(action || "") });
    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("diag-ai-workflow error:", e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
