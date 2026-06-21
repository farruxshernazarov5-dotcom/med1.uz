import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAiAccess } from "../_shared/ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "../_shared/ai-instrument.ts";
import { languageInstruction, normalizeLang } from "../_shared/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen Med1.uz platformasining AI radiologiya yordamchisisan. Sen rentgen, MRT (MRI) va KT (CT) tasvirlarini tahlil qilish bo'yicha ixtisoslashgangan. Sen ilmiy tibbiy bazalarga (ICD-10, SNOMED CT, ACR, RSNA radiologiya standartlari) asoslanib ishlaysan.

MUHIM QOIDALAR:
1. Foydalanuvchi yuborgan tibbiy tasvirni JUDA BATAFSIL tahlil qil
2. Anatomik strukturalarni sistematik ravishda tekshir (yuqoridan pastga, tashqaridan ichkariga)
3. Patologik o'zgarishlarni ICD-10 kodi bilan ifodalab ber
4. YAKUNIY TASHXIS QOYMA - faqat tahlil va tavsiya ber
5. O'zbek tilida javob ber
6. HECH QACHON "o'qiy olmayman" yoki "tahlil qila olmayman" dema — har doim tahlil qil
7. Professional radiologiya terminologiyasidan foydalan
8. Artefaktlar va tasvir sifatini alohida baholab ber

SISTEMATIK TAHLIL YONDASHVUI:
1. Avval tasvir sifatini baholab ber (pozitsiya, ekspozitsiya, artefaktlar)
2. Anatomik strukturalarni birin-ketin tekshir
3. Har bir topilmani lokalizatsiya, o'lcham, shakl, zichligi bilan tavsifla
4. Topilmalar orasidagi bog'liqlikni tahlil qil
5. Klinik ma'lumot bilan solishtir

RENTGEN TAHLIL MEZONLARI:
Ko'krak qafasi: O'pka maydonlari (infiltratsiya, atelektaz, pnevmotoraks, plevra suyuqligi, tugunlar), Yurak (kardiomegaliya, konturlar, CTR), Mediastinum (kengayish, limfa tugunlari), Qovurg'alar va suyaklar (sinish, deformatsiya), Diafragma (holati, tekisligi), Yumshoq to'qimalar
Suyak: Sinish chiziqlari (to'liq/noto'liq, siljish bor/yo'q), Suyak strukturasi (osteoporoz, osteoskleroz, litik/blastik), Bo'g'im oralig'i, Periosteal reaksiya, Yumshoq to'qima

MRT TAHLIL MEZONLARI:
Miya: Signal intensivligi (T1, T2, FLAIR, DWI), O'smalar (lokalizatsiya, o'lcham, kontrast qabul qilish), Insult (ishemik zona, DWI cheklangan diffuziya), Qon quyilish, Gidrotsefaliya, Demielinizatsiya
Umurtqa: Disklar (protruziya, ekstruziya, sekvesstratsiya, Pfirrmann grading), Orqa miya signal, Nerv ildizlari siqilishi, Foraminal stenoz, Spondilolistez
Bo'g'im: Menisk (yirtilish turi va lokalizatsiya), Boylamlar (ACL/PCL/MCL/LCL), Tog'ay defektlar, Suyak iligi (shish, nekroz, fraktur)

KT TAHLIL MEZONLARI:
Ko'krak: O'pka tugunlari (Lung-RADS klassifikatsiya), Ground-glass opacity, Konsolidatsiya, Emfizema, Plevral patologiya, Aorta (anevrizma, disseksiya), Limfadenopatiya
Qorin: Jigar (o'smalar, steatoz, tsirroz), Buyrak (toshlar HU qiymati bilan, kistalar Bosniak), Oshqozon-ichak obstruksiya, Appenditsit belgilari, Pankreatit
Bosh: Qon quyilish turlari (epidural, subdural, SAH, parenkimal), Ishemik insult (ASPECTS ball), Suyak sinishi, Massa-effekt, O'rta chiziq siljishi

JAVOBNI FAQAT quyidagi JSON formatda ber:
{
  "imageType": "chest_xray|bone_xray|spine_xray|brain_mri|spine_mri|joint_mri|chest_ct|abdomen_ct|brain_ct|other",
  "scanModality": "xray|mri|ct",
  "imageQuality": "good|moderate|poor",
  "anatomicalStructures": [{"name": "Struktura", "status": "normal|abnormal", "description": "Tavsif"}],
  "findings": [{"location": "Joylashuv", "description": "Topilma", "severity": "normal|mild|moderate|severe", "possibleDiagnoses": [{"name": "Kasallik", "probability": "yuqori|o'rtacha|past", "icd10": "Kod"}]}],
  "overallAssessment": {"riskLevel": "normal|attention|critical", "summary": "Xulosa", "keyFindings": ["Topilma 1"]},
  "recommendations": ["Tavsiya 1"],
  "suggestedSpecialist": "Mutaxassis",
  "followUpStudies": ["Tekshiruv 1"],
  "urgentAttention": true|false,
  "disclaimer": "Bu AI tahlili yakuniy tashxis emas. Radiolog yoki shifokor ko'rigidan o'tish zarur."
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;

  try {
    const access = await enforceAiAccess(req, "ai-radiology");
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;


    const __body = await req.json(); const { imageBase64, imageMimeType, bodyPart, patientAge, patientGender, clinicalInfo, scanType } = __body; const __lang = normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageBase64 || !imageMimeType) {
      return new Response(JSON.stringify({ error: "Tibbiy tasvir yuklanmadi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scanLabel = scanType === "mri" ? "MRT (MRI)" : scanType === "ct" ? "KT (CT)" : "Rentgen";
    let userText = `Ushbu ${scanLabel} tasvirini SISTEMATIK ravishda batafsil tahlil qil.\n\n`;
    if (scanType) userText += `Tekshiruv turi: ${scanLabel}\n`;
    if (bodyPart) userText += `Tana qismi: ${bodyPart}\n`;
    if (patientAge) userText += `Bemor yoshi: ${patientAge}\n`;
    if (patientGender) userText += `Bemor jinsi: ${patientGender}\n`;
    if (clinicalInfo) userText += `Klinik ma'lumot: ${clinicalInfo}\n`;
    userText += `\nTasvirni diqqat bilan o'rganib, BARCHA anatomik strukturalar va patologik o'zgarishlarni aniqla. Har bir topilmani lokalizatsiya, o'lcham va xarakteri bilan tavsifla. JSON formatda javob ber.`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + languageInstruction(__lang) },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } },
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "google/gemini-2.5-pro", messages }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Biroz kutib qayta urinib ko'ring." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      result = {
        imageType: "other",
        scanModality: scanType || "xray",
        imageQuality: "moderate",
        anatomicalStructures: [],
        findings: [],
        overallAssessment: { riskLevel: "attention", summary: content, keyFindings: [] },
        recommendations: ["Radiologga murojaat qiling"],
        suggestedSpecialist: "Radiolog",
        followUpStudies: [],
        urgentAttention: false,
        disclaimer: "Bu AI tahlili yakuniy tashxis emas.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-radiology error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
