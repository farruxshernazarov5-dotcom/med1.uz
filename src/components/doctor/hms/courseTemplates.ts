// Treatment Course Templates — tayyor davolash kurslari (bosqichlar bilan)
// Shifokor 1 bosishda kurs nomi, bosqichlar, taxminiy davomiylik va izohlarni avtomatik to'ldiradi.

export type CourseTemplate = {
  id: string;
  name: string;          // shablon nomi (Gipertenziya nazorati 30 kun, ...)
  category: string;      // bo'lim (Kardiologiya, Stomatologiya, ...)
  diagnosis: string;
  description: string;
  duration_days: number; // taxminiy davomiyligi (boshlanishdan tugashgacha)
  steps: { title: string; done: boolean }[];
  notes: string;
};

export const COURSE_TEMPLATES: CourseTemplate[] = [
  // ─────────── Terapiya ───────────
  {
    id: "ct-orvi-7",
    name: "ORVI — 7 kunlik kurs",
    category: "Terapiya",
    diagnosis: "O'tkir respirator virusli infektsiya (ORVI)",
    description: "Simptomatik davo, yotoq rejimi va nazorat.",
    duration_days: 7,
    steps: [
      { title: "1-kun: Boshlang'ich ko'rik, harorat o'lchash", done: false },
      { title: "2–3-kun: Antipiretik, ko'p suyuqlik", done: false },
      { title: "4–5-kun: Holat dinamikasini baholash", done: false },
      { title: "7-kun: Yakuniy ko'rik, kursni yopish", done: false },
    ],
    notes: "Holat 5 kunda yaxshilanmasa — qo'shimcha tekshiruv (CBC, ko'krak rentgeni).",
  },
  {
    id: "ct-bronchitis-10",
    name: "O'tkir bronxit — 10 kun",
    category: "Terapiya",
    diagnosis: "O'tkir bronxit",
    description: "Mukolitik + antibiotik (ko'rsatma bo'yicha) + nazorat.",
    duration_days: 10,
    steps: [
      { title: "1-kun: Auskultatsiya, balg'am tahlili buyurish", done: false },
      { title: "2-kun: Mukolitik boshlash (Ambroksol)", done: false },
      { title: "3–7-kun: Antibiotikoterapiya", done: false },
      { title: "8-kun: Oraliq ko'rik", done: false },
      { title: "10-kun: Yakuniy nazorat", done: false },
    ],
    notes: "Harorat 3 kundan ko'p saqlansa — ko'krak rentgeni.",
  },

  // ─────────── Kardiologiya ───────────
  {
    id: "ct-htn-30",
    name: "Gipertenziya nazorati — 30 kun",
    category: "Kardiologiya",
    diagnosis: "Arterial gipertenziya, II daraja",
    description: "Gipotenziv terapiya titratsiyasi va AB nazorati.",
    duration_days: 30,
    steps: [
      { title: "1-kun: AB o'lchash, EKG, lipidogramma buyurish", done: false },
      { title: "3-kun: Amlodipin 5 mg boshlash", done: false },
      { title: "7-kun: AB nazorati, dozani moslash", done: false },
      { title: "14-kun: Oraliq ko'rik", done: false },
      { title: "21-kun: Yon ta'sirlarni baholash", done: false },
      { title: "30-kun: Yakuniy ko'rik, davomiy reja", done: false },
    ],
    notes: "Bemor har kuni AB ni yozib boradi. Tuzni cheklash majburiy.",
  },
  {
    id: "ct-cardio-rehab-21",
    name: "Yurak reabilitatsiyasi — 21 kun",
    category: "Kardiologiya",
    diagnosis: "Postinfarkt holati / yurak yetishmovchiligi",
    description: "Bosqichma-bosqich jismoniy faollikni tiklash.",
    duration_days: 21,
    steps: [
      { title: "1-hafta: Yengil yurish (10 daqiqa)", done: false },
      { title: "2-hafta: Yurish 20 daqiqa, yengil mashqlar", done: false },
      { title: "3-hafta: 30+ daqiqa faollik, EKG nazorat", done: false },
      { title: "Yakuniy: Eхo-KG va kardiolog ko'rigi", done: false },
    ],
    notes: "Har bosqichda yurak urishi va AB nazorati.",
  },

  // ─────────── Endokrinologiya ───────────
  {
    id: "ct-dm2-90",
    name: "Diabet 2-tip — 90 kunlik nazorat",
    category: "Endokrinologiya",
    diagnosis: "Qandli diabet, 2-tip",
    description: "Metformin titratsiya, parhez, HbA1c nazorati.",
    duration_days: 90,
    steps: [
      { title: "1-kun: Boshlang'ich tekshiruv, HbA1c", done: false },
      { title: "1-hafta: Metformin 500 mg x 2", done: false },
      { title: "2-hafta: Doza oshirish (500 → 1000)", done: false },
      { title: "30-kun: Glyukoza dnevnik tahlili", done: false },
      { title: "60-kun: Oraliq ko'rik", done: false },
      { title: "90-kun: HbA1c qayta + reja yangilash", done: false },
    ],
    notes: "Bemor har kuni glyukozani o'lchaydi (ochlikda + ovqatdan 2 soat keyin).",
  },

  // ─────────── Gastroenterologiya ───────────
  {
    id: "ct-gastritis-14",
    name: "O'tkir gastrit — 14 kun",
    category: "Gastroenterologiya",
    diagnosis: "O'tkir gastrit",
    description: "PPI + parhez (5-stol) + simptomatik davo.",
    duration_days: 14,
    steps: [
      { title: "1-kun: FGDS yo'naltirish, parhez tushuntirish", done: false },
      { title: "2-kun: Omeprazol 20 mg boshlash", done: false },
      { title: "7-kun: Oraliq ko'rik, simptomlarni baholash", done: false },
      { title: "14-kun: Yakuniy ko'rik, kursni yopish", done: false },
    ],
    notes: "H. pylori (+) bo'lsa — eradikatsiya sxemasiga o'tish.",
  },

  // ─────────── Gematologiya ───────────
  {
    id: "ct-anemia-90",
    name: "Temir tanqisligi anemiyasi — 90 kun",
    category: "Gematologiya",
    diagnosis: "Temir tanqisligi anemiyasi",
    description: "Per os temir preparatlari + ovqatlanish maslahati.",
    duration_days: 90,
    steps: [
      { title: "1-kun: CBC, ferritin, TIBC olish", done: false },
      { title: "1-hafta: Temir preparati boshlash", done: false },
      { title: "30-kun: CBC nazorati (gemoglobin)", done: false },
      { title: "60-kun: Oraliq baholash", done: false },
      { title: "90-kun: Ferritin + reja yakuni", done: false },
    ],
    notes: "Vitamin C bilan birga qabul qiling. Choy/qahva bilan emas.",
  },

  // ─────────── Stomatologiya ───────────
  {
    id: "ct-dental-caries",
    name: "Karies davolash — 3 ta seans",
    category: "Stomatologiya",
    diagnosis: "O'rta karies",
    description: "Tish kavernasini tozalash, plomba, nazorat.",
    duration_days: 14,
    steps: [
      { title: "1-seans: Diagnostika, anesteziya, tozalash", done: false },
      { title: "2-seans: Plomba qo'yish, sayqallash", done: false },
      { title: "3-seans: 2 haftadan keyin nazorat ko'rik", done: false },
    ],
    notes: "Issiq/sovuqdan og'riq qaytsa darhol murojaat.",
  },
  {
    id: "ct-dental-endo",
    name: "Endodontik davolash — 4 ta seans",
    category: "Stomatologiya",
    diagnosis: "O'tkir pulpit",
    description: "Kanal davolash + doimiy plomba.",
    duration_days: 21,
    steps: [
      { title: "1-seans: Anesteziya, kanal ochish", done: false },
      { title: "2-seans: Kanal mexanik tozalash", done: false },
      { title: "3-seans: Kanalni plomba qilish, rentgen", done: false },
      { title: "4-seans: Doimiy plomba + nazorat", done: false },
    ],
    notes: "Har seansdan keyin rentgen nazorati.",
  },

  // ─────────── Kosmetologiya ───────────
  {
    id: "ct-cosmo-acne",
    name: "Akne davolash kursi — 8 hafta",
    category: "Kosmetologiya",
    diagnosis: "Akne vulgaris (o'rta)",
    description: "Tozalash + retinoid + nazorat seanslari.",
    duration_days: 56,
    steps: [
      { title: "1-hafta: Tashxis, foto fiksatsiya, parvarish rejasi", done: false },
      { title: "2-hafta: Mexanik tozalash seansi", done: false },
      { title: "4-hafta: Kimyoviy peeling (yengil)", done: false },
      { title: "6-hafta: Oraliq baholash", done: false },
      { title: "8-hafta: Yakuniy foto + uy parvarishi rejasi", done: false },
    ],
    notes: "Quyoshdan himoya (SPF 30+) majburiy.",
  },
  {
    id: "ct-cosmo-mesotherapy",
    name: "Mezoterapiya — 5 seans",
    category: "Kosmetologiya",
    diagnosis: "Teri yoshartirish / regidratatsiya",
    description: "Yuz mezoterapiyasi kursi.",
    duration_days: 35,
    steps: [
      { title: "1-seans: Tashxis va birinchi protsedura", done: false },
      { title: "2-seans: 7 kundan keyin", done: false },
      { title: "3-seans: 14 kundan keyin", done: false },
      { title: "4-seans: 21 kundan keyin", done: false },
      { title: "5-seans: Yakuniy + qo'llab-quvvatlash rejasi", done: false },
    ],
    notes: "Seanslar orasida ko'p suv ichish va SPF.",
  },

  // ─────────── Ginekologiya ───────────
  {
    id: "ct-prenatal-1tri",
    name: "Homiladorlik kuzatuvi — 1-trimestr",
    category: "Ginekologiya",
    diagnosis: "Fiziologik homiladorlik (1-trimestr)",
    description: "Boshlang'ich skrining va tahlillar.",
    duration_days: 84,
    steps: [
      { title: "6–8-hafta: Birinchi UZI, ro'yxatga olish", done: false },
      { title: "10–12-hafta: TORCH, qon guruhi, CBC", done: false },
      { title: "11–13-hafta: Birinchi skrining (PAPP-A, β-HCG)", done: false },
      { title: "14-hafta: Yakuniy ko'rik, 2-trimestrga o'tish", done: false },
    ],
    notes: "Folat kislota har kuni 400 mkg.",
  },
];

export const COURSE_CATEGORIES = Array.from(new Set(COURSE_TEMPLATES.map((t) => t.category)));
