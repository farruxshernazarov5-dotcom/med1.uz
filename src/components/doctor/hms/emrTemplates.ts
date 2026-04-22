// EMR "Quick Text" Templates — Tashxis, Analiz, Retsept
// Tezkor matn shablonlari: shifokor 1 bosishda formani avtomatik to'ldiradi.

export type DiagnosisTemplate = {
  id: string;
  name: string;        // shablon nomi (Shamollash, Gastrit, ...)
  category: string;    // bo'lim (Terapiya, GIT, ...)
  diagnosis: string;
  icd_code: string;
  symptoms: string;
  notes: string;
};

export type LabTemplate = {
  id: string;
  name: string;
  category: string;
  tests: string[];
  urgency: "normal" | "urgent";
  clinical_info: string;
};

export type RxTemplate = {
  id: string;
  name: string;
  category: string;
  medication: string;
  dosage: string;
  duration: string;
  instructions: string;
};

// ───────────────────────── Tashxis (Diagnosis) ─────────────────────────
export const DIAGNOSIS_TEMPLATES: DiagnosisTemplate[] = [
  {
    id: "dx-uri",
    name: "Shamollash (ORVI)",
    category: "Terapiya",
    diagnosis: "O'tkir respirator virusli infektsiya (ORVI)",
    icd_code: "J06.9",
    symptoms: "Tana harorati 37.5–38.5°C, tomoq og'rig'i, burun bitishi, yo'tal, umumiy holsizlik",
    notes: "Yotoq rejimi, ko'p suyuqlik, simptomatik davo. 3–5 kun ichida holat yaxshilanmasa qayta ko'rikka chaqirildi.",
  },
  {
    id: "dx-gastritis",
    name: "O'tkir gastrit",
    category: "Gastroenterologiya",
    diagnosis: "O'tkir gastrit",
    icd_code: "K29.1",
    symptoms: "Epigastriyada og'riq, ko'ngil aynish, qusish, ishtahaning pasayishi",
    notes: "Parhez (5-stol), antasid va PPI tavsiya etildi. 7 kundan so'ng nazorat.",
  },
  {
    id: "dx-htn",
    name: "Arterial gipertenziya",
    category: "Kardiologiya",
    diagnosis: "Arterial gipertenziya, II daraja",
    icd_code: "I10",
    symptoms: "Bosh og'rig'i, bosh aylanishi, AB 150/95 mmHg, yurak urishi tezlashgan",
    notes: "Tuzni cheklash, gipotenziv terapiya boshlandi. Har kuni AB nazorati.",
  },
  {
    id: "dx-allergy",
    name: "Allergik reaksiya",
    category: "Allergologiya",
    diagnosis: "O'tkir allergik dermatit",
    icd_code: "L23.9",
    symptoms: "Teri toshmasi, qichishish, qizarish",
    notes: "Allergen bilan kontaktni to'xtatish, antigistamin preparatlar.",
  },
  {
    id: "dx-bronchitis",
    name: "O'tkir bronxit",
    category: "Pulmonologiya",
    diagnosis: "O'tkir bronxit",
    icd_code: "J20.9",
    symptoms: "Quruq yoki balg'amli yo'tal, ko'krakda og'irlik, harorat, hansirash",
    notes: "Mukolitik, ko'p suyuqlik, kerak bo'lsa antibiotik.",
  },
  {
    id: "dx-uti",
    name: "Siydik yo'llari infeksiyasi",
    category: "Urologiya",
    diagnosis: "O'tkir sistit",
    icd_code: "N30.0",
    symptoms: "Tez-tez siydik chiqarish, dizuriya, qovuq sohasida og'riq",
    notes: "Ko'p suyuqlik, antibiotik (uropati). 7 kundan so'ng nazorat tahlil.",
  },
  {
    id: "dx-anemia",
    name: "Temir tanqisligi anemiyasi",
    category: "Gematologiya",
    diagnosis: "Temir tanqisligi anemiyasi, o'rta darajali",
    icd_code: "D50.9",
    symptoms: "Holsizlik, terining oqarishi, hansirash, bosh aylanishi, tirnoqlarning mo'rtligi",
    notes: "Temir preparatlari per os 3 oy. 1 oydan keyin CBC nazorati.",
  },
  {
    id: "dx-dm2",
    name: "Qandli diabet, 2-tip",
    category: "Endokrinologiya",
    diagnosis: "Qandli diabet, 2-tip",
    icd_code: "E11.9",
    symptoms: "Polidipsiya, poliuriya, vazn yo'qotish, charchoq",
    notes: "Parhez, jismoniy faollik, metformin. HbA1c har 3 oyda.",
  },
];

// ───────────────────────── Analiz (Lab) ─────────────────────────
export const LAB_TEMPLATES: LabTemplate[] = [
  {
    id: "lab-basic",
    name: "Asosiy paket",
    category: "Umumiy",
    tests: ["Umumiy qon tahlili (CBC)", "Umumiy siydik", "Qand"],
    urgency: "normal",
    clinical_info: "Profilaktik umumiy tekshiruv.",
  },
  {
    id: "lab-cardio",
    name: "Kardiologik paket",
    category: "Kardiologiya",
    tests: ["Lipidogramma (xolesterin, LDL, HDL, TG)", "Glyukoza", "Kreatinin", "EKG", "AST/ALT"],
    urgency: "normal",
    clinical_info: "Yurak-qon tomir kasalliklari shubhasi / nazorati.",
  },
  {
    id: "lab-thyroid",
    name: "Qalqonsimon bez",
    category: "Endokrinologiya",
    tests: ["TTG", "T3 erkin", "T4 erkin", "Anti-TPO"],
    urgency: "normal",
    clinical_info: "Qalqonsimon bez funktsiyasini baholash.",
  },
  {
    id: "lab-liver",
    name: "Jigar paneli",
    category: "Gastroenterologiya",
    tests: ["AST/ALT", "Bilirubin (umumiy va to'g'ri)", "Albumin", "GGT", "ALP"],
    urgency: "normal",
    clinical_info: "Jigar funktsiyasi va gepatit shubhasi.",
  },
  {
    id: "lab-kidney",
    name: "Buyrak paneli",
    category: "Urologiya",
    tests: ["Kreatinin", "Karbamid", "Umumiy siydik", "Mochevina kislota", "Albumin/kreatinin nisbati"],
    urgency: "normal",
    clinical_info: "Buyrak funktsiyasini baholash.",
  },
  {
    id: "lab-diabetes",
    name: "Diabet nazorati",
    category: "Endokrinologiya",
    tests: ["Glyukoza (ochlikda)", "HbA1c", "Umumiy siydik", "Lipidogramma"],
    urgency: "normal",
    clinical_info: "Qandli diabet skrining / nazorat.",
  },
  {
    id: "lab-anemia",
    name: "Anemiya tekshiruvi",
    category: "Gematologiya",
    tests: ["Umumiy qon tahlili (CBC)", "Ferritin", "Temir (Fe)", "TIBC", "Vitamin B12", "Folat"],
    urgency: "normal",
    clinical_info: "Anemiya etiologiyasini aniqlash.",
  },
  {
    id: "lab-prenatal",
    name: "Homiladorlik (1-trimestr)",
    category: "Ginekologiya",
    tests: ["CBC", "Qon guruhi va Rh", "HIV", "RW", "HBsAg", "HCV", "TORCH", "Umumiy siydik"],
    urgency: "normal",
    clinical_info: "Homiladorlik bo'yicha boshlang'ich skrining.",
  },
  {
    id: "lab-urgent-chest",
    name: "Shoshilinch ko'krak og'rig'i",
    category: "Shoshilinch",
    tests: ["Troponin I", "CK-MB", "D-dimer", "EKG", "CBC"],
    urgency: "urgent",
    clinical_info: "O'tkir koronar sindrom shubhasi — shoshilinch.",
  },
];

// ───────────────────────── Retsept (Rx) ─────────────────────────
export const RX_TEMPLATES: RxTemplate[] = [
  {
    id: "rx-paracetamol",
    name: "Paratsetamol (harorat)",
    category: "Analgetik",
    medication: "Paratsetamol 500 mg",
    dosage: "1 tabletka",
    duration: "5 kun",
    instructions: "Kuniga 3–4 mahal, ovqatdan keyin. Sutkalik doza 4 g dan oshmasin.",
  },
  {
    id: "rx-ibuprofen",
    name: "Ibuprofen (og'riq/yallig'lanish)",
    category: "NSAID",
    medication: "Ibuprofen 400 mg",
    dosage: "1 tabletka",
    duration: "5 kun",
    instructions: "Kuniga 3 mahal, ovqatdan keyin. Oshqozon yarasi bo'lsa ehtiyot bo'ling.",
  },
  {
    id: "rx-amoxiclav",
    name: "Amoksiklav (antibiotik)",
    category: "Antibiotik",
    medication: "Amoksitsillin + Klavulan kislota 875/125 mg",
    dosage: "1 tabletka",
    duration: "7 kun",
    instructions: "Kuniga 2 mahal, har 12 soatda, ovqat bilan. To'liq kursni tugating.",
  },
  {
    id: "rx-omeprazole",
    name: "Omeprazol (oshqozon)",
    category: "PPI",
    medication: "Omeprazol 20 mg",
    dosage: "1 kapsula",
    duration: "14 kun",
    instructions: "Ertalab nahorda, ovqatdan 30 daqiqa oldin.",
  },
  {
    id: "rx-loratadine",
    name: "Loratadin (allergiya)",
    category: "Antigistamin",
    medication: "Loratadin 10 mg",
    dosage: "1 tabletka",
    duration: "10 kun",
    instructions: "Kuniga 1 mahal, vaqtidan qat'i nazar.",
  },
  {
    id: "rx-amlodipine",
    name: "Amlodipin (gipotenziv)",
    category: "Kardiologiya",
    medication: "Amlodipin 5 mg",
    dosage: "1 tabletka",
    duration: "Doimiy (doktor nazoratida)",
    instructions: "Ertalab, bir vaqtda. AB ni har kuni o'lchang.",
  },
  {
    id: "rx-metformin",
    name: "Metformin (diabet)",
    category: "Endokrinologiya",
    medication: "Metformin 500 mg",
    dosage: "1 tabletka",
    duration: "Doimiy",
    instructions: "Kuniga 2 mahal, ovqat bilan. Doza asta-sekin oshiriladi.",
  },
  {
    id: "rx-iron",
    name: "Temir preparati",
    category: "Gematologiya",
    medication: "Temir (III) gidroksid polimaltozat 100 mg",
    dosage: "1 tabletka",
    duration: "3 oy",
    instructions: "Kuniga 1–2 mahal, ovqat bilan. Vitamin C bilan birga so'rilishi yaxshilanadi.",
  },
  {
    id: "rx-ambroxol",
    name: "Ambroksol (yo'tal)",
    category: "Mukolitik",
    medication: "Ambroksol 30 mg",
    dosage: "1 tabletka",
    duration: "7 kun",
    instructions: "Kuniga 3 mahal, ko'p suyuqlik bilan.",
  },
];

export const DIAG_CATEGORIES = Array.from(new Set(DIAGNOSIS_TEMPLATES.map((t) => t.category)));
export const LAB_CATEGORIES = Array.from(new Set(LAB_TEMPLATES.map((t) => t.category)));
export const RX_CATEGORIES = Array.from(new Set(RX_TEMPLATES.map((t) => t.category)));
