import catPsychiatry from "@/assets/cat-psychiatry.jpg";
import catCardiology from "@/assets/cat-cardiology.jpg";
import catSurgery from "@/assets/cat-surgery.jpg";
import catPulmonology from "@/assets/cat-pulmonology.jpg";
import catEndocrinology from "@/assets/cat-endocrinology.jpg";
import catPediatrics from "@/assets/cat-pediatrics.jpg";
import catGastro from "@/assets/cat-gastro.jpg";
import catUrology from "@/assets/cat-urology.jpg";
import catOrthopedics from "@/assets/cat-orthopedics.jpg";
import type { Article } from "./articles";

export type ExtraArticleCategory = {
  id: string;
  title: string;
  quote: string;
  image: string;
  linkedDiseaseCategory: string;
  linkedEncyclopediaTerms: string[];
  article: Article;
};

export const extraArticleCategories: ExtraArticleCategory[] = [
  {
    id: "psixiatriya",
    title: "Psixiatriya",
    quote: "\"Ruhiy sog'liq — jismoniy sog'liqning ajralmas qismi.\"",
    image: catPsychiatry,
    linkedDiseaseCategory: "psixiatriya",
    linkedEncyclopediaTerms: ["Depressiya", "Shizofreniya", "Panik atak", "Obsessiv-kompulsiv buzilish"],
    article: {
      id: "psych-1",
      title: "Ruhiy sog'liq: depressiyadan shizofreniyaga qadar zamonaviy psixiatriya",
      slug: "ruhiy-sogliq-depressiya-shizofreniya",
      image: catPsychiatry,
      summary: "Ruhiy kasalliklar turlari, zamonaviy psixofarmakologiya va psixoterapiya usullari haqida ilmiy maqola.",
      content: [
        "Psixiatriya — ruhiy va xulq-atvor buzilishlarini o'rganadigan tibbiyot sohasi. Dunyo aholisining 25% hayoti davomida biror ruhiy kasallikka duch keladi.",
        "Depressiya — eng keng tarqalgan ruhiy kasallik, 280 million kishini qamrab oladi. Kayfiyat tushishi, qiziqishlar yo'qolishi va energiya kamayishi asosiy alomatlar. SSRI (sertralin, fluoksetin) birinchi qator dorilar. Kognitiv-xulq terapiyasi farmakoterapiya bilan birgalikda eng samarali natija beradi.",
        "Shizofreniya — aholining 1% da uchraydigan og'ir ruhiy kasallik. Gallyutsinatsiyalar, aqldan ozish g'oyalari va ijtimoiy ajralish xos. Atipik antipsixotiklar (risperidon, olanzapin, aripiprazol) asosiy davolash. LAI (uzoq ta'sirli in'ektsion) preparatlar qabul qilishni yengilllashtiradi.",
        "Anxiozlik buzilishlari: umumlashgan anxiozlik, panik buzilish, ijtimoiy fobiya va OKB. SSRI va benzodiazepinlar (qisqa muddatga), KXT va mindfulness mashqlari yordamida boshqariladi.",
        "Bipolar buzilish — kayfiyat maniya va depressiya orasida tebranadi. Litiy hamon oltin standart. Valproat, lamotrijin va quetiapine ham qo'llaniladi. Muntazam uyqu va stressni boshqarish muhim.",
        "Bolalar psixiatriyasi: ADHD (diqqat tanqisligi va giperaktivlik), autizm spektri va bolalar depressiyasi. Erta aniqlash va aralashuv kelajak natijalarini sezilarli yaxshilaydi.",
        "Profilaktika: ijtimoiy aloqalar, jismoniy faollik, sifatli uyqu, stressni boshqarish texnikalari va stigmani kamaytirish orqali erta murojaat."
      ],
      author: "Dr. Nodira Xoliqova, psixiatr",
      date: "2025-01-15"
    }
  },
  {
    id: "kardiologiya-qoshimcha",
    title: "Kardiovaskulyar reabilitatsiya",
    quote: "\"Yurak operatsiyasidan keyin tiklanish — ikkinchi hayot boshlanishi.\"",
    image: catCardiology,
    linkedDiseaseCategory: "kardiologiya",
    linkedEncyclopediaTerms: ["Miokard infarkti", "Stentirovka", "Yurak yetishmovchiligi", "Aritmiya"],
    article: {
      id: "cardio-rehab-1",
      title: "Kardiovaskulyar reabilitatsiya: yurak kasalliklaridan tiklanish dasturlari",
      slug: "kardiovaskulyar-reabilitatsiya-tiklanish",
      image: catCardiology,
      summary: "Yurak infarkti va operatsiyadan keyingi tiklanish bosqichlari, jismoniy mashqlar va psixologik qo'llab-quvvatlash.",
      content: [
        "Kardiovaskulyar reabilitatsiya — yurak kasalliklari va operatsiyalardan keyingi kompleks tiklanish dasturi. Reabilitatsiya o'lim xavfini 25-30% ga kamaytiradi.",
        "Reabilitatsiyaning 4 bosqichi: 1) Statsionar (1-2 hafta) — nafas mashqlari, sekin yurish; 2) Erta ambulatoriya (2-12 hafta) — nazoratli jismoniy mashqlar; 3) Kech ambulatoriya (3-6 oy) — mustaqil mashqlar; 4) Qo'llab-quvvatlash (umr bo'yi).",
        "Jismoniy mashqlar: aerob mashqlar (yurish, velosiped, suzish) haftada 3-5 marta, 30-60 daqiqa. Yurak urishi monitoringi bilan nazorat qilinadi. Bosqichma-bosqich intensivlikni oshirish muhim.",
        "Psixologik aspekt: yurak kasalliklari bo'lgan bemorlarning 40% da depressiya kuzatiladi. Psixoterapiya, guruh mashg'ulotlari va kerak bo'lganda antidepressantlar tiklanishni tezlashtiradi.",
        "Dietoterapiya: Mediterran dietasi yurak kasalliklari riskini 30% kamaytiradi. Omega-3, meva-sabzavot, yong'oqlar va zaytun moyi asosiy komponentlar. Tuz 5 g/kun dan kam, to'yingan yog' 10% dan kam.",
        "Telereabilitatsiya: COVID-19 pandemiyasi onlayn reabilitatsiya dasturlarini rivojlantirdi. Uy sharoitida sensor va ilovalar yordamida nazoratli mashqlar an'anaviy dasturlarga teng samarali.",
        "Profilaktika: hayot tarzi o'zgarishlari (chekishni to'xtatish, sog'lom ovqatlanish, stress boshqarish), dorilarni muntazam qabul qilish va shifokor bilan doimiy aloqa."
      ],
      author: "Dr. Abdulla Nazarov, kardiolog-reabilitolog",
      date: "2025-02-01"
    }
  },
  {
    id: "jarrohlik-qoshimcha",
    title: "Transplantologiya",
    quote: "\"Organ transplantatsiyasi — zamonaviy tibbiyotning eng buyuk mo'jizasi.\"",
    image: catSurgery,
    linkedDiseaseCategory: "jarrohlik",
    linkedEncyclopediaTerms: ["Transplantatsiya", "Immunosupressiya", "Organ donorlik"],
    article: {
      id: "transplant-1",
      title: "Transplantologiya: organ ko'chirish va zamonaviy immunosupressiv terapiya",
      slug: "transplantologiya-organ-kochirish",
      image: catSurgery,
      summary: "Buyrak, jigar va yurak transplantatsiyasi, donor muammolari va yangi texnologiyalar.",
      content: [
        "Transplantologiya — kasallangan organlarni sog'lom donorlik organlari bilan almashtirishni o'rganadi. Yiliga 150,000+ organ transplantatsiyasi amalga oshiriladi.",
        "Buyrak transplantatsiyasi — eng ko'p bajariladigan organ ko'chirish. Dializ bilan solishtirganda hayot sifati va davomiyligi ancha yaxshi. Tirik donordan buyrak ko'chirish eng yaxshi natija beradi.",
        "Jigar transplantatsiyasi — jigar tsirrozi va o'tkir jigar yetishmovchiligi uchun yagona davolash usuli. Split-jigar texnikasi bir donordan ikki retsipiyentga ko'chirish imkonini berdi.",
        "Yurak transplantatsiyasi — og'ir yurak yetishmovchiligi uchun oxirgi chora. Donor yurakning saqlash vaqti 4-6 soat. Sun'iy yurak pompalari (LVAD) transplantatsiyagacha ko'prik vazifasini bajaradi.",
        "Immunosupressiv terapiya: takrolimus, mikofenolat va kortikosteroidlar — uch komponentli rejim. Donor-spetsifik antikorlar monitoringi ret reaktsiyasini erta aniqlaydi.",
        "Yangi texnologiyalar: 3D bioprinting (sun'iy organlar), ksenotransplantatsiya (cho'chqa organlari), perfuzion mashinalar (organlarni saqlash muddatini uzaytirish) va chimeric antigen receptor (CAR) T-hujayralar.",
        "Donor muammolari: dunyo bo'ylab donor organlarga talab taklifdan 5 marta ko'p. Opt-out donorlik tizimlari (Ispaniya modeli) donorlik ko'rsatkichini oshirdi."
      ],
      author: "Dr. Jasur Mirzayev, transplantolog-jarroh",
      date: "2025-01-20"
    }
  },
  {
    id: "pulmonologiya-qoshimcha",
    title: "Ftiziologiya (Sil kasalligi)",
    quote: "\"Sil — qadimiy kasallik, zamonaviy dorilar bilan yengish mumkin.\"",
    image: catPulmonology,
    linkedDiseaseCategory: "pulmonologiya",
    linkedEncyclopediaTerms: ["Tuberkulyoz", "Mantoux sinovi", "Rifampisin", "MDR-TB"],
    article: {
      id: "ftiz-1",
      title: "Sil kasalligi: zamonaviy diagnostika va 6 oylik davolash rejimi",
      slug: "sil-kasalligi-diagnostika-davolash",
      image: catPulmonology,
      summary: "Tuberkulyoz epidemiologiyasi, GeneXpert diagnostikasi va zamonaviy davolash protokollari.",
      content: [
        "Tuberkulyoz (sil) — Mycobacterium tuberculosis chaqiradigan infektsion kasallik. Yiliga 10.6 million yangi holat va 1.3 million o'lim qayd etiladi. O'zbekistonda sil hamon dolzarb muammo.",
        "Diagnostika: an'anaviy balg'am mikroskopiyasi, GeneXpert MTB/RIF (2 soatda natija + rifampisin rezistentligi), Mantoux sinovi va IGRA testlari (QuantiFERON). Ko'krak qafasi rentgenografiyasi skrining uchun qo'llaniladi.",
        "Standart davolash: 6 oylik rejim — 2 oy intensiv faza (izoniazid + rifampisin + pirazinamid + etambutol), keyin 4 oy davom faza (izoniazid + rifampisin). DOTS strategiyasi to'g'ridan-to'g'ri nazoratli terapiya.",
        "Ko'p dorivor chidamli sil (MDR-TB): rifampisin va izoniazidga chidamli. Bedaquilin va pretomanid kabi yangi dorilar davolash muddatini 9-12 oyga qisqartirdi. BPaL rejimi inqilobiy natijalar ko'rsatdi.",
        "O'pka tashqari sil: limfa tugunlari, suyak, buyrak, miya pardasi va boshqa organlarda uchraydi. Diagnostikasi qiyinroq, davolash muddati ko'pincha uzunroq (9-12 oy).",
        "Bolalarda sil: alomatlari noaniq, diagnostikasi qiyin. BCG vaksinatsiyasi og'ir shakllardaan himoyalaydi. Uy sharoitida kontakt tekshiruvi profilaktikaning muhim qismi.",
        "Profilaktika: BCG vaksinatsiyasi (yangi tug'ilgan chaqaloqlarga), latent sil infektsiyasini davolash (3-6 oy izoniazid), kasallangan bemorlarga yaqin kontaktlarni tekshirish."
      ],
      author: "Dr. Farrux Sultonov, ftiziolog",
      date: "2025-02-10"
    }
  },
  {
    id: "endokrinologiya-qoshimcha",
    title: "Diabet parvarishi",
    quote: "\"Diabet — boshqarsa bo'ladigan kasallik, bilim eng yaxshi dori.\"",
    image: catEndocrinology,
    linkedDiseaseCategory: "endokrinologiya",
    linkedEncyclopediaTerms: ["Insulin", "Glikemiya", "HbA1c", "Diabetik neyropatiya"],
    article: {
      id: "diab-care-1",
      title: "Qandli diabet boshqaruvi: zamonaviy texnologiyalar va turmush tarzi",
      slug: "qandli-diabet-boshqaruvi-texnologiyalar",
      image: catEndocrinology,
      summary: "Doimiy glukoza monitoringi, insulin pompalari va diabetik asoratlarning oldini olish.",
      content: [
        "Qandli diabet bilan 537 million katta yoshdagi kishi yashaydi (IDF, 2024). Yaxshi boshqarish asoratlarni 50-70% ga kamaytiradi.",
        "Doimiy glukoza monitoringi (CGM): Dexcom G7, FreeStyle Libre 3 — real vaqtda qon shakar darajasini ko'rsatadi. Barmoq uchidan qon olish zaruratini 90% ga kamaytirdi. HbA1c va TIR (Time in Range) asosiy nazorat ko'rsatkichlari.",
        "Insulin pompalari va yopiq tutash tizimlar: Omnipod 5, Tandem t:slim — CGM bilan birgalikda sun'iy pankreas vazifasini bajaradi. Avtomatik bazal insulin sozlash gipoglikemiya xavfini kamaytiradi.",
        "GLP-1 agonistlari (semaglutid, liraglutid): 2-tip diabetda qon shakarini nazorat qilish + vazn yo'qotish + yurak-qon tomir himoyasi. Ozempik va Wegovy — eng ko'p so'raladigan dorilar.",
        "Diabetik asoratlar: retinopatiya (ko'rish yo'qolishi), nefropatiya (buyrak yetishmovchiligi), neyropatiya (oyoq yarasi) va kardiovaskulyar xavf. SGLT2 ingibitorlari (empagliflozin, dapagliflozin) buyrak va yurakni himoyalaydi.",
        "Diabetik oyoq parvarishi: oyoqlarni har kuni tekshirish, quruq teriga krem surish, mos poyabzal tanlash va podiatr bilan muntazam ko'rik. Oyoq yarasi — amputatsiyaning asosiy sababi.",
        "Profilaktika va boshqarish: karbohidratlarni hisoblash, muntazam jismoniy mashqlar (haftada 150 daqiqa), HbA1c < 7%, qon bosimi < 130/80 va lipidlar nazorati."
      ],
      author: "Dr. Zarina Mamatova, endokrinolog-diabetolog",
      date: "2025-01-28"
    }
  },
  {
    id: "pediatriya-qoshimcha",
    title: "Neonatologiya",
    quote: "\"Hayotning birinchi 28 kuni — eng muhim va eng zaif davrdir.\"",
    image: catPediatrics,
    linkedDiseaseCategory: "pediatriya",
    linkedEncyclopediaTerms: ["Nedonoshennost", "Neonatal sariqlik", "Apgar shkala", "RDS"],
    article: {
      id: "neonat-1",
      title: "Neonatologiya: chaqaloq intensiv terapiyasi va erta chaqaloq parvarishi",
      slug: "neonatologiya-chaqaloq-intensiv-terapiya",
      image: catPediatrics,
      summary: "Erta tug'ilgan chaqaloqlar parvarishi, NICU texnologiyalari va rivojlanish kuzatishi.",
      content: [
        "Neonatologiya — yangi tug'ilgan chaqaloqlar (0-28 kun) kasalliklarini davolaydigan pediatriya bo'limi. Dunyo bo'ylab yiliga 15 million chaqaloq muddatidan erta tug'iladi.",
        "Neonatal intensiv terapiya (NICU): inkubatorlar, surfattant terapiyasi (RDS uchun), CPAP va mexanik ventilyatsiya nafas qo'llab-quvvatlash. 24 haftada tug'ilgan chaqaloqlarning 50%+ tirik qolish imkoniyati.",
        "Neonatal sariqlik: yangi tug'ilgan chaqaloqlarning 60% da fiziologik sariqlik kuzatiladi. Fototerapiya (ko'k nur) bilirubin darajasini pasaytiradi. Og'ir hollarda almashtirish transfuziyasi zarur bo'lishi mumkin.",
        "Kangaru ona usuli (KMC): erta tug'ilgan chaqaloqni onaning ko'kragiga teri-teriga qo'yish. Haroratni barqarorlash, ko'krak suti bilan emizish va bog'lanishni yaxshilaydi. O'lim xavfini 36% ga kamaytiradi.",
        "Yangi tug'ilganlar skriningi: metabolik kasalliklar (fenilketonuriya, gipotireoz), eshitish skriningi va yurakning kritik nuqsonlari. O'zbekistonda 5 kasallikka skrining o'tkaziladi.",
        "Emizish: birinchi soatda ko'krak suti berish muhim. Kolostrum immunoglobulinlarga boy. Erta tug'ilgan chaqaloqlarda donorlik ko'krak suti yoki maxsus formulalar qo'llaniladi.",
        "Kuzatuv: erta tug'ilgan chaqaloqlar 2 yoshgacha nevrolog, oftalmolog va audiolog nazoratida bo'ladi. Erta aralashuv dasturlari rivojlanish kechikishini kamaytiradi."
      ],
      author: "Dr. Feruza Alimova, neonatolog",
      date: "2025-02-05"
    }
  },
  {
    id: "gastro-qoshimcha",
    title: "Gepatologiya",
    quote: "\"Jigar — organizmning eng katta va eng sabr qiladigan laboratoriyasi.\"",
    image: catGastro,
    linkedDiseaseCategory: "gastroenterologiya",
    linkedEncyclopediaTerms: ["Gepatit", "Sirroz", "Jigar transplantatsiyasi", "NAFLD"],
    article: {
      id: "hepat-1",
      title: "Jigar kasalliklari: gepatitdan jigar transplantatsiyasiga",
      slug: "jigar-kasalliklari-gepatit-transplantatsiya",
      image: catGastro,
      summary: "Virusli gepatitlar, jigar tsirrozi va zamonaviy gepatologik yondashuvlar.",
      content: [
        "Gepatologiya — jigar kasalliklarini o'rganadi. Jigar 500 dan ortiq funksiya bajaradi: detoksifikatsiya, oqsil sintezi, safro ishlab chiqarish va energiya metabolizmi.",
        "Gepatit B — dunyo bo'ylab 296 million kishida surunkali infektsiya. Vertikal (onadan bolaga) uzatilish asosiy yo'l. Vaksinatsiya 95% himoya beradi. Tenofovir va entekavir virusni supressiya qiladi.",
        "Gepatit C — 58 million kishida surunkali infektsiya. Qon orqali uzatiladi. Hozirgi DAA dorilar (sofosbuvir/velpatasvir) 8-12 haftada 95%+ tuzalish beradi. Vaksinasi yo'q.",
        "Nospirtli yog'li jigar kasalligi (NAFLD/MASH) — eng tez o'sib borayotgan jigar kasalligi, kattalarning 25% da. Semizlik va diabet bilan bog'liq. Resmetirom — birinchi MASH uchun tasdiqlangan dori (2024).",
        "Jigar tsirrozi — surunkali jigar kasalligining oxirgi bosqichi. Assit, varikoz qon ketish va gepatik ensefalopatiya asoratlari. MELD skala transplantatsiya navbatini belgilaydi.",
        "Jigar saratoni (gepatosellyulyar karsinoma): surunkali gepatit B/C va sirroz zaminida rivojlanadi. Har 6 oyda UZI + AFP skrining tavsiya etiladi. Rezektsiya, ablatsiya va sorafenib davolashda qo'llaniladi.",
        "Profilaktika: gepatit B vaksinatsiyasi, spirtli ichimliklarni cheklash, sog'lom vazn saqlash, steril tibbiy asboblar va qon donorligini tekshirish."
      ],
      author: "Dr. Ravshan Normatov, gepatolog",
      date: "2025-01-10"
    }
  },
  {
    id: "urologiya-qoshimcha",
    title: "Nefroskopiya va litotripiya",
    quote: "\"Buyrak toshi — kichik, lekin og'rig'i ulkan.\"",
    image: catUrology,
    linkedDiseaseCategory: "urologiya",
    linkedEncyclopediaTerms: ["Urolitiaz", "Nefrolitotomiya", "ESWL", "Buyrak kolikasi"],
    article: {
      id: "nephro-lit-1",
      title: "Buyrak toshi davolashning zamonaviy usullari: ESWL dan lazer litotripiyaga",
      slug: "buyrak-toshi-zamonaviy-davolash",
      image: catUrology,
      summary: "Buyrak toshlari turlari, diagnostikasi va minimal invaziv parchalash usullari.",
      content: [
        "Urolitiaz (buyrak toshi) — aholining 10-15% da hayot davomida uchraydi. Qaytalalanish xavfi 50% (5 yil ichida). Erkak va ayollarda teng uchraydi.",
        "Tosh turlari: kaltsiy oksalat (75-80%), struvit (infektsion), sistein va urat toshlari. KT tekshiruvi — tosh diagnostikasining oltin standarti. Tosh tarkibini aniqlash profilaktika uchun muhim.",
        "ESWL (tashqi zarba to'lqinli litotripiya): 2 sm gacha toshlarda samarali. Ambulatoriya sharoitida, ogohlantirishsiz. Muvaffaqiyat 70-85%. Kichik toshlar uchun birinchi tanlash.",
        "Ureteroskopiya (URS) + lazer litotripiya: Holmiy lazer (Ho:YAG) yoki TFL lazer toshni chang qiladi. Har qanday joylashuv va kattalikdagi toshlarda samarali. Stent o'rnatilishi mumkin.",
        "Perkutan nefrolitotomiya (PNL): 2 sm dan katta buyrak toshlarida oltin standart. Mini-PNL va ultra-mini-PNL texnikalari asoratlarni kamaytirdi.",
        "Metabolik tekshiruv: qaytalanadigan tosh hosil bo'lishda 24 soatlik siydik tahlili zarur. Hiperkalsiuriya, hiperoksaluriya va hipersitraturiya eng ko'p uchraydigan buzilishlar.",
        "Profilaktika: kuniga 2.5-3 litr suv ichish, tuz iste'molini cheklash (5 g/kun), hayvon oqsilini kamaytirish, sitrat boy mevalar (limon) va shifokor tavsiyasi bo'yicha dieta."
      ],
      author: "Dr. Xurshid Toshmatov, urolog-litotripsist",
      date: "2025-01-05"
    }
  },
  {
    id: "ortopediya-qoshimcha",
    title: "Sport tibbiyoti",
    quote: "\"Sportchining eng yaxshi do'sti — bilimli shifokor.\"",
    image: catOrthopedics,
    linkedDiseaseCategory: "ortopediya",
    linkedEncyclopediaTerms: ["ACL yirtilishi", "Menisk", "Tendinit", "PRP terapiya"],
    article: {
      id: "sport-med-1",
      title: "Sport tibbiyoti: shikastlanish profilaktikasi va reabilitatsiya",
      slug: "sport-tibbiyoti-shikastlanish-reabilitatsiya",
      image: catOrthopedics,
      summary: "Sportchilar shikastlanishlari, zamonaviy reabilitatsiya va sportga qaytish protokollari.",
      content: [
        "Sport tibbiyoti — sportchilar sog'lig'ini saqlash, shikastlanishlarni davolash va qayta shikastlanishni oldini olishga yo'naltirilgan sohа.",
        "Eng ko'p uchraydigan shikastlanishlar: ACL (oldingi chokka boy'lami) yirtilishi, menisk shikastlanishi, yelka rotator manketa yirtilishi, Axill tendon yirtilishi va stress sinishlari.",
        "PRP (trombositga boy plazma) terapiyasi: bemorning o'z qonidan tayyorlanadi. O'sish omillari tiklanishni tezlashtiradi. Tendinopatiya, mushak shikastlanishi va bo'g'im kasalliklarida qo'llaniladi.",
        "Artroskopik jarrohlik: kichik kamera va asboblar orqali bo'g'im ichida operatsiya. ACL rekonstruksiyasi, menisk tiklanishi va yelka stabilizatsiyasi eng ko'p bajariladigan operatsiyalar.",
        "Sportga qaytish protokollari: bosqichma-bosqich yuklama oshirish, funksional testlar (hop test, Y-balance test) va psixologik tayyorlik. Vaxtidan erta qaytish qayta shikastlanish xavfini 6 marta oshiradi.",
        "Regenerativ tibbiyot: kam hujayrali terapiya, ekzosomalar va genetik terapiya — kelajakda to'qima tiklanishini tezlashtiradigan yangi usullar.",
        "Profilaktika: yetarli isitish va sovutish, to'g'ri texnika, progressiv yuklama, muvozanatli ovqatlanish va yetarli dam olish. FIFA 11+ dasturi futbolda shikastlanishni 30-50% ga kamaytirdi."
      ],
      author: "Dr. Sardor Ibragimov, sport tibbiyoti mutaxassisi",
      date: "2025-02-15"
    }
  },
];
