// Shared handler for specialized radiology AI sub-modules.
// Each sub-module (pulmonology, brain, bone, chest-ct, mammography, abdomen, spine)
// uses this handler with its own subModule id + specialized prompt overlay.

import { enforceAiAccess, refundAiCredits } from "./ai-access.ts";
import { instrumentJson, instrumentError, statusFromHttp } from "./ai-instrument.ts";
import { languageInstructionDetailed, detectLangFromText, normalizeLang } from "./lang.ts";
import { cleanAiText, parseAiJsonObject } from "./json.ts";

export const radiologyCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-med1-channel, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export type RadiologySubModule =
  | "pulmonology"
  | "brain"
  | "bone"
  | "chest-ct"
  | "mammography"
  | "abdomen"
  | "spine";

interface SubModuleConfig {
  title: string;         // uz label
  focus: string;         // system prompt focus block
  defaultScan: "xray" | "mri" | "ct";
  specialist: string;
}

export const SUBMODULE_CONFIG: Record<RadiologySubModule, SubModuleConfig> = {
  pulmonology: {
    title: "Pulmonologiya (o'pka)",
    focus:
      "Sen AI Radiolog — pulmonologik tasvirlarni tahlil qilishga ixtisoslashgansan. O'pka to'qimasi, plevra, bronxlar, mediastinum, diafragmani sistematik tekshir. TB, pnevmoniya, COVID izlari, o'sma, plevral suyuqlik, pnevmotoraks belgilarini ko'zla. Fleischner Society tavsiyalarini bil.",
    defaultScan: "xray",
    specialist: "Pulmonolog / Radiolog",
  },
  brain: {
    title: "Miya (Brain MRI/CT)",
    focus:
      "Sen AI Radiolog — miya MRT va KT tasvirlariga ixtisoslashgansan. Kortikal-subkortikal strukturalar, qorinchalar, bazal ganglio, oq modda, mozjazok, miya poyasini ko'zdan kechir. Insult (ishemik/gemorragik), o'sma, atrofiya, demielinizatsiya, gidrosefaliya, gematoma izlarini toping. ASPECTS shkalasi va MRI protokollari (DWI/FLAIR/T2) bo'yicha izohla.",
    defaultScan: "mri",
    specialist: "Neyroradiolog / Nevrolog",
  },
  bone: {
    title: "Suyak-Skelet Rentgen",
    focus:
      "Sen AI Radiolog — suyak-skelet rentgen tasvirlariga ixtisoslashgansan. Kortikal chegara, medulla, epifiz-metafiz, bo'g'im yorig'i, atrofdagi yumshoq to'qimalarni sistematik ko'r. Sinish (turi, joyi), dislokatsiya, osteoporoz, osteomiyelit, o'sma (litik/blastik), artroz, avaskulyar nekroz belgilarini aniqla. AO/OTA klassifikatsiyasi bo'yicha sinishni izohla.",
    defaultScan: "xray",
    specialist: "Travmatolog-Ortoped / Radiolog",
  },
  "chest-ct": {
    title: "Ko'krak KT (Chest CT)",
    focus:
      "Sen AI Radiolog — ko'krak KT tasvirlariga ixtisoslashgansan. O'pka parenximasi (HRCT patternlar), plevra, mediastinum, yurak, aorta, koronar tomirlar, limfa tugunlarini ko'zdan kechir. Nodul (Fleischner), ILD, PE (agar CT-PA bo'lsa), aorta anevrizmasi, mediastinal massa, limfadenopatiya belgilarini aniqla. Lung-RADS va CT severity score qo'llansin (agar mos bo'lsa).",
    defaultScan: "ct",
    specialist: "Torakal Radiolog / Pulmonolog",
  },
  mammography: {
    title: "Mammografiya",
    focus:
      "Sen AI Radiolog — mammografiya tasvirlariga ixtisoslashgansan. Fibroglandulyar to'qima zichligi (ACR A-D), tugun (shakl, chegara, zichlik), mikrokalsifikatlar (turi, taqsimoti), me'moriy buzilish, teri qalinlashuvi, meme so'rg'ichi retraksiyasini ko'zdan kechir. BI-RADS (0–6) kategoriya bering. Ikkala meme simmetriyasini solishtiring.",
    defaultScan: "xray",
    specialist: "Mammolog / Onkolog-Radiolog",
  },
  abdomen: {
    title: "Qorin bo'shlig'i (Abdomen CT/MRI)",
    focus:
      "Sen AI Radiolog — qorin bo'shlig'i KT/MRT tasvirlariga ixtisoslashgansan. Jigar (segmentlar), o't pufagi, oshqozon osti bezi, taloq, buyraklar, ustki qorinlar, ichaklar, mezenterik tomirlar, limfa tugunlarini sistematik ko'r. Toshlar, kista, o'sma (LI-RADS), abssess, ichak obstruksiyasi, appenditsit, divertikulit belgilarini aniqla.",
    defaultScan: "ct",
    specialist: "Abdominal Radiolog / Gastroenterolog",
  },
  spine: {
    title: "Umurtqa (Spine MRI/Rentgen)",
    focus:
      "Sen AI Radiolog — umurtqa MRT va rentgen tasvirlariga ixtisoslashgansan. Umurtqa jismlari balandligi, disklar (dehidratatsiya, churra, protruziya), ligament, orqa miya kanali, foramenlar, spinal shnur intensivligini ko'r. Pfirrmann shkalasi (disk), stenozning darajasi (mild/moderate/severe), spondilolistez (Meyerding), listez darajasi, kompressiya sinishini aniqla.",
    defaultScan: "mri",
    specialist: "Vertebrolog / Neyroxirurg / Radiolog",
  },
};

const BASE_SYSTEM_PROMPT = `Sen Med1.uz platformasining IXTISOSLASHGAN AI radiolog yordamchisisan. Sen ilmiy tibbiy bazalarga (ICD-10, SNOMED CT, ACR, RSNA, Fleischner, BI-RADS, Lung-RADS, LI-RADS, ASPECTS, Pfirrmann) asoslanib ishlaysan.

MUHIM QOIDALAR:
1. Foydalanuvchi yuborgan tibbiy tasvirni JUDA BATAFSIL tahlil qil
2. Anatomik strukturalarni sistematik ravishda tekshir
3. Patologik o'zgarishlarni ICD-10 kodi bilan ifodalab ber
4. YAKUNIY TASHXIS QOYMA — faqat tahlil va tavsiya ber
5. Foydalanuvchining so'nggi xabari tilida javob ber
6. HECH QACHON "o'qiy olmayman" dema — har doim tahlil qil
7. Professional radiologiya terminologiyasidan foydalan
8. Artefaktlar va tasvir sifatini alohida baholab ber

JAVOBNI FAQAT valid JSON object sifatida ber (markdown, \`\`\`json, izoh, salomlashish YO'Q):
{
  "imageType": "string",
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

function normalizeResult(parsed: Record<string, unknown> | null, content: string, scanType: string, defaultSpecialist: string) {
  const obj = parsed ?? {};
  const assessment = (obj.overallAssessment && typeof obj.overallAssessment === "object") ? obj.overallAssessment as any : {};
  return {
    imageType: String(obj.imageType ?? "other"),
    scanModality: String(obj.scanModality ?? scanType ?? "xray"),
    imageQuality: ["good", "moderate", "poor"].includes(String(obj.imageQuality)) ? String(obj.imageQuality) : "moderate",
    anatomicalStructures: Array.isArray(obj.anatomicalStructures) ? obj.anatomicalStructures.map((raw: any) => ({
      name: String(raw?.name ?? "Anatomik struktura"),
      status: raw?.status === "abnormal" ? "abnormal" : "normal",
      description: String(raw?.description ?? "Ko'rib chiqildi."),
    })) : [],
    findings: Array.isArray(obj.findings) ? obj.findings.map((raw: any) => ({
      location: String(raw?.location ?? "Ko'rsatilmagan"),
      description: String(raw?.description ?? "Topilma tavsifi mavjud emas."),
      severity: ["normal", "mild", "moderate", "severe"].includes(raw?.severity) ? raw.severity : "normal",
      possibleDiagnoses: Array.isArray(raw?.possibleDiagnoses) ? raw.possibleDiagnoses.map((d: any) => ({
        name: String(d?.name ?? "Aniqlashtirish kerak"),
        probability: String(d?.probability ?? "past"),
        icd10: String(d?.icd10 ?? ""),
      })) : [],
    })) : [],
    overallAssessment: {
      riskLevel: ["normal", "attention", "critical"].includes(assessment.riskLevel) ? assessment.riskLevel : "attention",
      summary: String(assessment.summary ?? obj.summary ?? cleanAiText(content)),
      keyFindings: Array.isArray(assessment.keyFindings) ? assessment.keyFindings.map(String) : [],
    },
    recommendations: Array.isArray(obj.recommendations) && obj.recommendations.length > 0 ? obj.recommendations.map(String) : ["Radiolog yoki shifokorga murojaat qiling."],
    suggestedSpecialist: String(obj.suggestedSpecialist ?? defaultSpecialist),
    followUpStudies: Array.isArray(obj.followUpStudies) ? obj.followUpStudies.map(String) : [],
    urgentAttention: Boolean(obj.urgentAttention),
    disclaimer: String(obj.disclaimer ?? "Bu AI tahlili yakuniy tashxis emas."),
  };
}

export async function handleRadiologySubmodule(req: Request, subModule: RadiologySubModule, serviceId: string): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: radiologyCorsHeaders });

  const __start = Date.now();
  let __usageId: string | null = null;
  let __userId: string | null = null;
  const cost = 25;
  const config = SUBMODULE_CONFIG[subModule];

  try {
    const access = await enforceAiAccess(req, serviceId);
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status,
        headers: { ...radiologyCorsHeaders, "Content-Type": "application/json" },
      });
    }
    __usageId = access.usageId ?? null;
    __userId = access.userId;

    const __body = await req.json();
    const { imageBase64, imageMimeType, pdfPageImages, bodyPart, patientAge, patientGender, clinicalInfo, scanType } = __body;
    const __lang = detectLangFromText(clinicalInfo) ?? normalizeLang(__body?.lang);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageBase64 || !imageMimeType) {
      return new Response(JSON.stringify({ error: "Tibbiy tasvir yuklanmadi" }), {
        status: 400, headers: { ...radiologyCorsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveScan = (scanType as string) || config.defaultScan;
    const scanLabel = effectiveScan === "mri" ? "MRT (MRI)" : effectiveScan === "ct" ? "KT (CT)" : "Rentgen";

    let userText = `Ushbu ${scanLabel} tasvirini "${config.title}" ixtisosi bo'yicha SISTEMATIK batafsil tahlil qil.\n\n`;
    userText += `Tekshiruv turi: ${scanLabel}\n`;
    if (bodyPart) userText += `Tana qismi: ${bodyPart}\n`;
    if (patientAge) userText += `Bemor yoshi: ${patientAge}\n`;
    if (patientGender) userText += `Bemor jinsi: ${patientGender}\n`;
    if (clinicalInfo) userText += `Klinik ma'lumot: ${clinicalInfo}\n`;
    userText += `\nBu ${config.title} yo'nalishidagi ixtisoslashgan tahlil. JSON formatda javob ber.`;

    const pageImages = Array.isArray(pdfPageImages) && pdfPageImages.length > 0 ? pdfPageImages.slice(0, 3) : [imageBase64];

    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n=== IXTISOS ===\n${config.focus}\n\nMutaxassis: ${config.specialist}`;

    const messages = [
      { role: "system", content: systemPrompt + languageInstructionDetailed(__lang) },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          ...pageImages.map((img: string) => ({
            type: "image_url",
            image_url: { url: `data:${pageImages.length > 1 ? "image/jpeg" : imageMimeType};base64,${img}` },
          })),
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: access.model || "google/gemini-2.5-pro",
        max_completion_tokens: Math.max(access.maxTokens || 0, 4096),
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      await instrumentError(__usageId, __start, { status: statusFromHttp(status), errorCode: String(status), errorMessage: `AI gateway ${status}` });
      if (__userId) await refundAiCredits(__userId, serviceId, cost, `AI Gateway error ${status}`);
      if (status === 429) return new Response(JSON.stringify({ error: "So'rovlar limiti oshdi. Biroz kutib qayta urinib ko'ring." }), { status: 429, headers: { ...radiologyCorsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Xizmat vaqtincha mavjud emas." }), { status: 402, headers: { ...radiologyCorsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error(`${serviceId} AI gateway error:`, status, t);
      return new Response(JSON.stringify({ error: "AI xizmati xatosi" }), { status: 500, headers: { ...radiologyCorsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const result = normalizeResult(parseAiJsonObject(content), content, effectiveScan, config.specialist);
    await instrumentJson(data, __usageId, __start, 0, content);

    return new Response(JSON.stringify(result), {
      headers: { ...radiologyCorsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`${serviceId} error:`, e);
    await instrumentError(__usageId, __start, { errorCode: "exception", errorMessage: e instanceof Error ? e.message : "unknown" });
    if (__userId) await refundAiCredits(__userId, serviceId, cost, e instanceof Error ? e.message : "Internal error");
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Noma'lum xato" }), {
      status: 500, headers: { ...radiologyCorsHeaders, "Content-Type": "application/json" },
    });
  }
}
