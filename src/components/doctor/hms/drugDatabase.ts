// E-Prescription dorilar bazasi va dorilar o'zaro ta'siri (interaction) motori.
// Soddalashtirilgan offline ma'lumotlar bazasi — keyinchalik real bazaga ulanishi mumkin.

export type Drug = {
  id: string;
  name: string;          // Brand nom
  generic: string;       // Xalqaro nom (INN)
  category: string;      // Antibiotik, NSAID, ...
  forms: string[];       // tabletka, kapsula, sirop, in'eksiya, ...
  strengths: string[];   // 250 mg, 500 mg, ...
  default_dosage: string;
  default_frequency: string;
  default_duration: string;
  instructions: string;
  warnings?: string;
  interactions?: string[]; // boshqa dori id lari yoki kategoriyalari
  pregnancy?: "safe" | "caution" | "contraindicated";
};

export const DRUG_DATABASE: Drug[] = [
  // ───── Antibiotiklar ─────
  {
    id: "amoxiclav-875",
    name: "Amoksiklav",
    generic: "Amoksitsillin + Klavulan kislota",
    category: "Antibiotik",
    forms: ["tabletka", "sirop"],
    strengths: ["375 mg", "625 mg", "875/125 mg", "1000 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 2 mahal (har 12 soatda)",
    default_duration: "7 kun",
    instructions: "Ovqat bilan qabul qiling. To'liq kursni tugating.",
    warnings: "Penitsillinga allergiya bo'lsa qabul qilmang.",
    interactions: ["warfarin", "metotreksat"],
    pregnancy: "caution",
  },
  {
    id: "azithromycin-500",
    name: "Azitromitsin",
    generic: "Azithromycin",
    category: "Antibiotik",
    forms: ["tabletka", "kapsula", "sirop"],
    strengths: ["250 mg", "500 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1 mahal",
    default_duration: "3 kun",
    instructions: "Ovqatdan 1 soat oldin yoki 2 soat keyin.",
    warnings: "QT-interval uzayishi xavfi bo'lganlarga ehtiyotkorlik bilan.",
    interactions: ["amiodaron", "warfarin"],
    pregnancy: "caution",
  },
  {
    id: "ciprofloxacin-500",
    name: "Tsiprofloksatsin",
    generic: "Ciprofloxacin",
    category: "Antibiotik",
    forms: ["tabletka"],
    strengths: ["250 mg", "500 mg", "750 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 2 mahal",
    default_duration: "7 kun",
    instructions: "Ko'p suyuqlik bilan. Sutli mahsulotlardan 2 soat oldin yoki keyin.",
    warnings: "18 yoshgacha bo'lganlarga tavsiya etilmaydi. Pay yorilishi xavfi.",
    interactions: ["warfarin", "teofillin", "antasidlar"],
    pregnancy: "contraindicated",
  },

  // ───── NSAID / Analgetik ─────
  {
    id: "paracetamol-500",
    name: "Paratsetamol",
    generic: "Paracetamol",
    category: "Analgetik / Antipiretik",
    forms: ["tabletka", "sirop", "shamcha"],
    strengths: ["250 mg", "500 mg", "1000 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 3–4 mahal",
    default_duration: "5 kun",
    instructions: "Ovqatdan keyin. Sutkalik doza 4 g dan oshmasin.",
    warnings: "Jigar kasalliklarida ehtiyotkorlik bilan.",
    interactions: ["warfarin"],
    pregnancy: "safe",
  },
  {
    id: "ibuprofen-400",
    name: "Ibuprofen",
    generic: "Ibuprofen",
    category: "NSAID",
    forms: ["tabletka", "sirop"],
    strengths: ["200 mg", "400 mg", "600 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 3 mahal",
    default_duration: "5 kun",
    instructions: "Ovqatdan keyin, ko'p suv bilan.",
    warnings: "Oshqozon yarasi, buyrak kasalliklarida ehtiyot bo'ling.",
    interactions: ["warfarin", "aspirin", "AKE-inhibitorlar"],
    pregnancy: "caution",
  },
  {
    id: "diclofenac-50",
    name: "Diklofenak",
    generic: "Diclofenac",
    category: "NSAID",
    forms: ["tabletka", "in'eksiya", "gel"],
    strengths: ["25 mg", "50 mg", "75 mg", "100 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 2–3 mahal",
    default_duration: "5 kun",
    instructions: "Ovqat bilan.",
    warnings: "Yurak-qon tomir kasalliklari xavfini oshiradi.",
    interactions: ["warfarin", "litiy", "AKE-inhibitorlar"],
    pregnancy: "caution",
  },

  // ───── PPI / Oshqozon ─────
  {
    id: "omeprazole-20",
    name: "Omeprazol",
    generic: "Omeprazole",
    category: "PPI",
    forms: ["kapsula"],
    strengths: ["10 mg", "20 mg", "40 mg"],
    default_dosage: "1 kapsula",
    default_frequency: "Kuniga 1 mahal",
    default_duration: "14 kun",
    instructions: "Ertalab nahorda, ovqatdan 30 daqiqa oldin.",
    interactions: ["klopidogrel", "warfarin"],
    pregnancy: "caution",
  },
  {
    id: "pantoprazole-40",
    name: "Pantoprazol",
    generic: "Pantoprazole",
    category: "PPI",
    forms: ["tabletka"],
    strengths: ["20 mg", "40 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1 mahal",
    default_duration: "28 kun",
    instructions: "Ertalab, ovqatdan oldin.",
    pregnancy: "caution",
  },

  // ───── Antigistamin ─────
  {
    id: "loratadine-10",
    name: "Loratadin",
    generic: "Loratadine",
    category: "Antigistamin",
    forms: ["tabletka", "sirop"],
    strengths: ["10 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1 mahal",
    default_duration: "10 kun",
    instructions: "Vaqtidan qat'i nazar.",
    pregnancy: "caution",
  },
  {
    id: "cetirizine-10",
    name: "Tsetirizin",
    generic: "Cetirizine",
    category: "Antigistamin",
    forms: ["tabletka", "tomchi"],
    strengths: ["5 mg", "10 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1 mahal kechqurun",
    default_duration: "10 kun",
    instructions: "Uyqu bosishi mumkin.",
    pregnancy: "caution",
  },

  // ───── Kardiologiya ─────
  {
    id: "amlodipine-5",
    name: "Amlodipin",
    generic: "Amlodipine",
    category: "Kardiologiya / AB",
    forms: ["tabletka"],
    strengths: ["2.5 mg", "5 mg", "10 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1 mahal ertalab",
    default_duration: "Doimiy (doktor nazoratida)",
    instructions: "Bir xil vaqtda. AB ni har kuni o'lchang.",
    warnings: "Greypfrut sharbati bilan birga olmang.",
    interactions: ["simvastatin"],
    pregnancy: "caution",
  },
  {
    id: "lisinopril-10",
    name: "Lizinopril",
    generic: "Lisinopril",
    category: "Kardiologiya / AKE",
    forms: ["tabletka"],
    strengths: ["5 mg", "10 mg", "20 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1 mahal",
    default_duration: "Doimiy",
    instructions: "Quruq yo'tal yuzaga kelsa shifokorga xabar bering.",
    warnings: "Homiladorlikda QAT'IY MAN ETILGAN.",
    interactions: ["NSAID", "kaliyga boy preparatlar"],
    pregnancy: "contraindicated",
  },
  {
    id: "bisoprolol-5",
    name: "Bisoprolol",
    generic: "Bisoprolol",
    category: "Kardiologiya / Beta-blokator",
    forms: ["tabletka"],
    strengths: ["2.5 mg", "5 mg", "10 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1 mahal ertalab",
    default_duration: "Doimiy",
    instructions: "Birdan to'xtatmang — asta-sekin kamaytiring.",
    warnings: "Bronxial astmada ehtiyot bo'ling.",
    pregnancy: "caution",
  },

  // ───── Endokrinologiya ─────
  {
    id: "metformin-500",
    name: "Metformin",
    generic: "Metformin",
    category: "Endokrinologiya",
    forms: ["tabletka"],
    strengths: ["500 mg", "850 mg", "1000 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 2 mahal",
    default_duration: "Doimiy",
    instructions: "Ovqat bilan. Doza asta-sekin oshiriladi.",
    warnings: "Buyrak yetishmovchiligida man etiladi.",
    pregnancy: "caution",
  },

  // ───── Mukolitik / Yo'tal ─────
  {
    id: "ambroxol-30",
    name: "Ambroksol",
    generic: "Ambroxol",
    category: "Mukolitik",
    forms: ["tabletka", "sirop"],
    strengths: ["15 mg", "30 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 3 mahal",
    default_duration: "7 kun",
    instructions: "Ko'p suyuqlik bilan.",
    pregnancy: "caution",
  },

  // ───── Gematologiya ─────
  {
    id: "iron-100",
    name: "Maltofer",
    generic: "Temir (III) gidroksid polimaltozat",
    category: "Gematologiya / Temir",
    forms: ["tabletka", "sirop"],
    strengths: ["100 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1–2 mahal",
    default_duration: "3 oy",
    instructions: "Vitamin C bilan birga so'rilishi yaxshilanadi. Choy/qahva bilan emas.",
    pregnancy: "safe",
  },

  // ───── Vitaminlar ─────
  {
    id: "folic-5",
    name: "Folat kislota",
    generic: "Folic acid",
    category: "Vitamin",
    forms: ["tabletka"],
    strengths: ["1 mg", "5 mg"],
    default_dosage: "1 tabletka",
    default_frequency: "Kuniga 1 mahal",
    default_duration: "1 oy",
    instructions: "Homiladorlikda majburiy.",
    pregnancy: "safe",
  },
  {
    id: "vitamin-d-2000",
    name: "Vitamin D3",
    generic: "Cholecalciferol",
    category: "Vitamin",
    forms: ["tomchi", "tabletka", "kapsula"],
    strengths: ["1000 IU", "2000 IU", "5000 IU"],
    default_dosage: "1 doza",
    default_frequency: "Kuniga 1 mahal",
    default_duration: "2 oy",
    instructions: "Yog'li ovqat bilan yaxshi so'riladi.",
    pregnancy: "safe",
  },
];

export const DRUG_CATEGORIES = Array.from(new Set(DRUG_DATABASE.map((d) => d.category))).sort();

// ───────────────────────── Interaction engine ─────────────────────────
// Oddiy: bir-biriga zid keluvchi dori juftlari ro'yxati.
type InteractionRule = {
  a: string;        // dori id yoki generic name pasti registr
  b: string;
  severity: "low" | "moderate" | "high";
  message: string;
};

const INTERACTION_RULES: InteractionRule[] = [
  { a: "warfarin", b: "amoxiclav-875", severity: "moderate", message: "Antibiotik warfarin INR ni oshirishi mumkin — INR nazorati zarur." },
  { a: "warfarin", b: "ibuprofen-400", severity: "high", message: "NSAID + warfarin — qon ketish xavfi yuqori." },
  { a: "warfarin", b: "diclofenac-50", severity: "high", message: "NSAID + warfarin — qon ketish xavfi yuqori." },
  { a: "warfarin", b: "azithromycin-500", severity: "moderate", message: "INR ni oshirishi mumkin." },
  { a: "amlodipine-5", b: "simvastatin", severity: "moderate", message: "Simvastatin dozasini 20 mg dan oshirmang." },
  { a: "lisinopril-10", b: "ibuprofen-400", severity: "high", message: "AKE + NSAID — buyrak funksiyasi yomonlashishi mumkin." },
  { a: "lisinopril-10", b: "diclofenac-50", severity: "high", message: "AKE + NSAID — buyrak funksiyasi yomonlashishi mumkin." },
  { a: "omeprazole-20", b: "klopidogrel", severity: "moderate", message: "Klopidogrel samarasi pasayishi mumkin." },
  { a: "ciprofloxacin-500", b: "warfarin", severity: "high", message: "INR keskin oshishi mumkin." },
  { a: "metformin-500", b: "kontrast", severity: "high", message: "Yodli kontrast oldidan 48 soat to'xtating." },
];

export type InteractionResult = {
  severity: "low" | "moderate" | "high";
  message: string;
  drugs: [string, string];
};

export function checkInteractions(drugIds: string[]): InteractionResult[] {
  const found: InteractionResult[] = [];
  for (let i = 0; i < drugIds.length; i++) {
    for (let j = i + 1; j < drugIds.length; j++) {
      const a = drugIds[i];
      const b = drugIds[j];
      const rule = INTERACTION_RULES.find(
        (r) => (r.a === a && r.b === b) || (r.a === b && r.b === a),
      );
      if (rule) {
        found.push({
          severity: rule.severity,
          message: rule.message,
          drugs: [a, b],
        });
      }
    }
  }
  return found;
}

// Allergiya tekshiruvi: bemor allergiya matnida dori nomi bor-yo'qligini tekshirish
export function checkAllergyConflicts(allergies: string, drugIds: string[]): string[] {
  if (!allergies?.trim()) return [];
  const lower = allergies.toLowerCase();
  const hits: string[] = [];
  for (const id of drugIds) {
    const drug = DRUG_DATABASE.find((d) => d.id === id);
    if (!drug) continue;
    if (
      lower.includes(drug.name.toLowerCase()) ||
      lower.includes(drug.generic.toLowerCase()) ||
      (drug.category === "Antibiotik" && /penitsillin|penicillin/i.test(allergies)) ||
      (drug.category === "NSAID" && /nsaid|aspirin|ibuprofen/i.test(allergies))
    ) {
      hits.push(`${drug.name} — bemor allergiya: "${allergies.slice(0, 60)}"`);
    }
  }
  return hits;
}
