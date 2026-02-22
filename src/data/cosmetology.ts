import cosmetologyHero from "@/assets/cosmetology-hero.jpg";

export interface CosmetologyService {
  id: string;
  title: string;
  description: string;
  details: string[];
  benefits: string[];
  duration: string;
  price: string;
  source: string;
}

export const cosmetologyServices: CosmetologyService[] = [
  {
    id: "botoks",
    title: "Botulinum toksin (Botoks) in'ektsiyasi",
    description: "Mimik ajinlarni tekislash uchun mushak relaksant in'ektsiya",
    details: [
      "Botulinum toksin — mushak faoliyatini vaqtincha to'xtatib ajinlarni tekishlaydi",
      "Peshona, qosh orasi, ko'z atrofi ('qarg'a izi') eng ko'p bajariladigan zonalar",
      "Ta'siri 3-6 oy davom etadi, protsedura 10-15 daqiqa",
      "Og'riq minimal — mayda igna bilan bajariladi",
      "Natiija 3-7 kundan keyin to'liq namoyon bo'ladi",
    ],
    benefits: ["Tez natija", "Minimal davriy chekinish", "Xavfsiz va samarali", "15+ yillik klinik tajriba"],
    duration: "15-30 daqiqa",
    price: "300,000 - 800,000 so'm",
    source: "ASPS kosmetik protseduralar qo'llanmasi",
  },
  {
    id: "filler",
    title: "Dermal fillerlar (Gialuronat kislota)",
    description: "Yuz hajmini tiklash va konturlarni shakllantirish",
    details: [
      "Gialuronat kislota asosidagi fillerlar — yuz hajmini, lab konturini tiklaydi",
      "Nazolabiaal burmalar, lab kattalshtirish, yonoq hajmi uchun qo'llaniladi",
      "Ta'siri 6-18 oy davom etadi, turga qarab",
      "Gialuronidaza bilan kerak bo'lganda eritish mumkin",
      "FDA tomonidan tasdiqlangan preparatlar: Juvederm, Restylane",
    ],
    benefits: ["Tezkor natija", "Tabiiy ko'rinish", "Qaytariladigan protsedura", "Minimal og'riq"],
    duration: "30-60 daqiqa",
    price: "500,000 - 2,000,000 so'm",
    source: "ASDS filler qo'llanmasi",
  },
  {
    id: "lazer-epilyatsiya",
    title: "Lazer epilyatsiya",
    description: "Lazer nurlari bilan doimiy soch olib tashlash",
    details: [
      "Lazer yorug'ligi melanin pigmentini nishonga olib, tuk follikulasini yo'q qiladi",
      "Diod (808nm), Aleksandrit (755nm) va Nd:YAG (1064nm) lazerlar qo'llaniladi",
      "Har qanday tanа sohasi uchun mos: yuz, qo'ltiq, oyoq, bikini",
      "O'rtacha 6-8 seans kerak, har 4-6 haftada",
      "FDA tasdiqlangan qurilmalar bilan xavfsiz bajariladi",
    ],
    benefits: ["Doimiy natija", "Tez protsedura", "Barcha teri turlari uchun", "Ingrown tuk muammosini hal qiladi"],
    duration: "15 daqiqa - 1 soat (sohaga qarab)",
    price: "100,000 - 500,000 so'm (seansga)",
    source: "AAD lazer epilyatsiya qo'llanmasi",
  },
  {
    id: "kimyoviy-piling",
    title: "Kimyoviy piling",
    description: "Teri yangilanishi uchun kislota asosida eksfoliatsiya",
    details: [
      "Teri yuzasiga maxsus kislotalar qo'llab, eskirgan hujayralarni olib tashlash",
      "Yuzaki piling: glikolat, mandelat kislota (minimal davriy chekinish)",
      "O'rtacha piling: TCA 15-35% (akne izlari, pigmentatsiya uchun)",
      "Chuqur piling: fenol (og'ir ajinlar uchun, to'liq tiklanish 2-3 hafta)",
      "Teri teksturasi, rangi va porlashi sezilarli yaxshilanadi",
    ],
    benefits: ["Teri yangilanishi", "Pigmentatsiya kamayishi", "Akne izlari kamayishi", "Teri porlashi oshishi"],
    duration: "20-45 daqiqa",
    price: "150,000 - 600,000 so'm",
    source: "ASDS kimyoviy piling qo'llanmasi",
  },
  {
    id: "mezoterapiya",
    title: "Mezoterapiya",
    description: "Teri ichiga vitamin va mineral koktеyllarini kiritish",
    details: [
      "Mayda ignalar bilan teri ichiga vitaminlar, aminokislotalar, gialuronat kislota kiritiladi",
      "Yuz, bo'yin, dekolte va qo'l terisini yangilash uchun",
      "Teri namlanishi, elastikligi va rangining yaxshilanishi",
      "4-6 seans tavsiya etiladi, har 2 haftada",
      "Dermapen (mikronidling) — ignali qurilma bilan mexanik variant",
    ],
    benefits: ["Chuqur namlantirish", "Teri tonusi oshishi", "Kollagen stimulyatsiyasi", "Minimal tiklanish davri"],
    duration: "30-45 daqiqa",
    price: "200,000 - 500,000 so'm",
    source: "IMS mezoterapiya protokoli",
  },
  {
    id: "plazmolifting",
    title: "Plazmolifting (PRP terapiya)",
    description: "O'z qon plazmasidan teri yangilash",
    details: [
      "Bemorning o'z qonidan trombotsitlarga boy plazma (PRP) ajratiladi",
      "PRP yuzga in'ektsiya qilinadi — kollagen va elastin sintezi tezlashadi",
      "Allergiya xavfi yo'q — o'z qoni ishlatiladi",
      "Yuz terisini yangilash, soch to'kilishida bosh terisi uchun ham qo'llaniladi",
      "3-4 seans, har 3-4 haftada kurs o'tkaziladi",
    ],
    benefits: ["Tabiiy usul", "Allergiya xavfi yo'q", "Teri yangilanishi", "Soch to'kilishida samarali"],
    duration: "45-60 daqiqa",
    price: "300,000 - 700,000 so'm",
    source: "ISAPS plazmolifting qo'llanmasi",
  },
  {
    id: "rf-lifting",
    title: "RF lifting (Radiotolqinli lifting)",
    description: "Radio chastotali to'lqinlar bilan teri tortish",
    details: [
      "RF energiyasi teri chuqur qavatlarini isitib kollagen ishlab chiqarishni rag'batlantiradi",
      "Yuz konturi tortiladi, jag' chizig'i aniqlanadi",
      "Monopolar, bipolar va fraksional RF turlari mavjud",
      "Natija sekin namoyon bo'ladi — kollagen sintezi 1-3 oy davom etadi",
      "HIFU (yuqori intensivlikli fokuslantirilgan ultratovush) ham shu guruhga kiradi",
    ],
    benefits: ["Jarrohliksiz lifting", "Og'riqsiz", "Tiklanish davri yo'q", "Uzoq muddatli natija"],
    duration: "30-60 daqiqa",
    price: "300,000 - 1,000,000 so'm",
    source: "ASDS RF lifting qo'llanmasi",
  },
  {
    id: "lazer-yuz",
    title: "Lazer teri yangilash (Resurfacing)",
    description: "Lazer bilan teri yuzasini yangilash",
    details: [
      "Fraksional CO2 lazer — teri yuzasida mikro kanallar ochib, kollagen stimulyatsiyasi",
      "Akne izlari, ajinlar, pigmentatsiya va teri teksturasi yaxshilanadi",
      "Ablativ (kuchli) va noablativ (yengil) lazer turlari mavjud",
      "Erbium:YAG — nozikroq ta'sir, tezroq tiklanish",
      "To'liq natija 2-3 seansdan keyin ko'rinadi",
    ],
    benefits: ["Kuchli teri yangilanishi", "Akne izlari kamayishi", "Kollagen sintezi", "Uzoq muddatli natija"],
    duration: "30-90 daqiqa",
    price: "500,000 - 2,000,000 so'm",
    source: "ASLMS lazer resurfacing qo'llanmasi",
  },
];

export const cosmetologyInfo = {
  heroImage: cosmetologyHero,
  title: "Kosmetologiya",
  subtitle: "Zamonaviy estetik tibbiyot xizmatlari",
  description: "Kosmetologiya — teri go'zalligi va sog'lig'ini saqlash, yaxshilash va tiklashga qaratilgan tibbiyot sohasi. Zamonaviy kosmetologiya ilmiy asoslangan usullar, yuqori texnologiyali qurilmalar va tasdiqlangan preparatlar bilan ishlaydi.",
  stats: [
    { label: "Xizmat turlari", value: "50+" },
    { label: "Mutaxassislar", value: "200+" },
    { label: "Klinikalar", value: "100+" },
    { label: "Mamnun mijozlar", value: "50,000+" },
  ],
  categories: [
    "In'ektsion kosmetologiya (Botoks, fillerlar)",
    "Apparat kosmetologiya (lazer, RF, HIFU)",
    "Teri parvarishi (pilinglar, mezoterapiya)",
    "Estetik jarrohlik (rinoplastika, blefaroplastika)",
    "Lazer epilyatsiya",
    "Teri yangilash (resurfacing)",
    "Anti-aging terapiya",
    "Soch to'kilishi davolash (PRP, mezoterapiya)",
  ],
};
