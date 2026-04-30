// AI Workflow function for Diagnostics: auto-assign orders to staff and radiology assistance
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, orders, staff, modality, body_part, image_url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    if (action === "auto_assign") {
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
          model: "google/gemini-3-flash-preview",
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
        if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI: ${t}`);
      }

      const aiData = await aiRes.json();
      const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : { assignments: [] };

      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "radiology_assist") {
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
          model: "google/gemini-2.5-pro",
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
        if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await aiRes.text();
        throw new Error(`AI: ${t}`);
      }

      const aiData = await aiRes.json();
      const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : {};
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("diag-ai-workflow error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
