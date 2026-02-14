import newsResearch from "@/assets/news-research.jpg";
import newsAi from "@/assets/news-ai.jpg";
import newsVaccine from "@/assets/news-vaccine.jpg";
import newsGlobal from "@/assets/news-global.jpg";
import newsPharma from "@/assets/news-pharma.jpg";
import newsTelemed from "@/assets/news-telemed.jpg";
import newsTransplant from "@/assets/news-transplant.jpg";
import newsMental from "@/assets/news-mental.jpg";
import newsGenetics from "@/assets/news-genetics.jpg";
import newsChildren from "@/assets/news-children.jpg";

export type NewsCategory = {
  id: string;
  title: string;
  icon: string;
  color: string;
};

export type NewsItem = {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  content: string[];
  image: string;
  source: string;
  date: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
};

export const newsCategories: NewsCategory[] = [
  { id: "research", title: "Ilmiy kashfiyotlar", icon: "🔬", color: "from-blue-500/20 to-cyan-500/20" },
  { id: "ai", title: "Sun'iy intellekt", icon: "🤖", color: "from-violet-500/20 to-purple-500/20" },
  { id: "vaccine", title: "Vaksinalar va immunitet", icon: "💉", color: "from-green-500/20 to-emerald-500/20" },
  { id: "global", title: "Jahon sog'liqni saqlash", icon: "🌍", color: "from-red-500/20 to-orange-500/20" },
  { id: "pharma", title: "Farmatsevtika", icon: "💊", color: "from-pink-500/20 to-rose-500/20" },
  { id: "telemed", title: "Teletibbiyot", icon: "📱", color: "from-teal-500/20 to-cyan-500/20" },
  { id: "surgery", title: "Jarrohlik yutuqlari", icon: "🏥", color: "from-amber-500/20 to-yellow-500/20" },
  { id: "mental", title: "Ruhiy salomatlik", icon: "🧠", color: "from-indigo-500/20 to-blue-500/20" },
  { id: "genetics", title: "Genetika va CRISPR", icon: "🧬", color: "from-fuchsia-500/20 to-pink-500/20" },
  { id: "pediatrics", title: "Bolalar sog'lig'i", icon: "👶", color: "from-lime-500/20 to-green-500/20" },
];

export const newsItems: NewsItem[] = [
  // Ilmiy kashfiyotlar
  {
    id: "r1",
    categoryId: "research",
    title: "Olimlar saraton hujayralarini o'ldiruvchi yangi molekula kashf etishdi",
    summary: "Xalqaro tadqiqot guruhi saraton hujayralarini sog'lom hujayralarga zarar bermagan holda yo'q qila oladigan yangi molekulyar mexanizmni aniqladi.",
    content: [
      "Nature jurnalida chop etilgan so'nggi tadqiqotga ko'ra, Kembrij universiteti olimlari saraton hujayralarining energiya ishlab chiqarish jarayonini blokirovka qiladigan yangi molekula — CX-5461 ning takomillashtirilgan versiyasini yaratishdi.",
      "Ushbu molekula saraton hujayralarining ribosomal RNK sintezini to'xtatib, ularning bo'linish qobiliyatini yo'q qiladi. Eng muhimi — sog'lom hujayralar bu ta'sirga chidamli, chunki ularning DNK ta'mirlash mexanizmlari to'liq ishlaydi.",
      "Klinik sinovlarning 2-bosqichi 450 bemor ishtirokida o'tkazilmoqda. Dastlabki natijalar ko'krak bezi va tuxumdon saratoni bo'lgan bemorlarning 67% da o'sma hajmining 50% dan ortiq kamayganini ko'rsatdi.",
      "Professor Sarra Uolker ta'kidlashicha: 'Bu kashfiyot personallashtirilgan onkologiya sohasida yangi era ochishi mumkin. Biz har bir bemorning genetik profiliga mos davolash rejasini tuzish imkoniyatiga yaqinlashmoqdamiz.'",
      "Tadqiqot guruhi 2026 yil oxirigacha FDA dan tezlashtirilgan tasdiqlash olishni rejalashtirmoqda. Agar muvaffaqiyatli bo'lsa, bu dori dastlab ilg'or bosqichdagi o'smalar uchun, keyinchalik erta bosqichlarda ham qo'llanilishi mumkin.",
      "Jahon Sog'liqni Saqlash Tashkiloti bu kashfiyotni '2025-2026 yillarning eng istiqbolli onkologik yutuqlaridan biri' deb baholadi."
    ],
    image: newsResearch,
    source: "Nature Medicine",
    date: "2026-02-12",
    isBreaking: true,
    isFeatured: true
  },
  {
    id: "r2",
    categoryId: "research",
    title: "Alzheimer kasalligiga qarshi yangi antikor dorisi klinik sinovda muvaffaqiyatli",
    summary: "Lecanemab va donanemab dan keyin uchinchi avlod anti-amiloid antikor dorisi Alzheimer kasalligini 35% sekinlashtirdi.",
    content: [
      "New England Journal of Medicine da e'lon qilingan 3-bosqich klinik sinov natijalari Alzheimer kasalligiga qarshi yangi antikor dorisi — remternetug ning erta bosqich Alzheimer bemorlarida kognitiv pasayishni 35% ga sekinlashtirishini ko'rsatdi.",
      "1,800 bemor ishtirok etgan 18 oylik tadqiqotda remternetug amyloid-beta plakalarini 82% ga kamaytirdi. Bu ko'rsatkich lecanemab (27%) va donanemab (24%) dan sezilarli yuqori.",
      "Dorining asosiy afzalligi — ARIA (amiloid bilan bog'liq tasvir anomaliyalari) xavfi ancha past: atigi 12% (lecanemab da 21%, donanemab da 24%). Bu dorini kengroq bemor guruhlariga tayinlash imkonini beradi.",
      "Dorining yana bir innovatsion jihati — uni oyiga bir marta teri ostiga in'ektsiya qilish mumkin (mavjud dorlar venadagi infuziya talab qiladi). Bu bemorlar va ularning oilalari uchun katta qulaylik.",
      "Tadqiqot rahbari professor Dennis Selkoe: 'Biz uchta avlod davomida amiloid gipotezasini sinamoqdamiz. Har bir yangi avlod samaraliroq va xavfsizroq. Remternetug buni yana bir bor tasdiqladi.'",
      "FDA 2026 yil sentyabrgacha qaror qabul qilishi kutilmoqda. Dorining yillik narxi taxminan 20,000 AQSh dollarini tashkil etishi bashorat qilinmoqda."
    ],
    image: newsResearch,
    source: "NEJM",
    date: "2026-02-08",
    isFeatured: true
  },
  // Sun'iy intellekt
  {
    id: "ai1",
    categoryId: "ai",
    title: "Google DeepMind yangi AI modeli rentgen suratlarini radiologlardan aniq o'qiydi",
    summary: "Med-Gemini 2.0 modeli 14 ta kasallikni rentgen suratlaridan 97.3% aniqlik bilan aniqlaydi — bu ko'rsatkich tajribali radiologlardan yuqori.",
    content: [
      "Google DeepMind kompaniyasi tibbiy tasvirlarni tahlil qilishga ixtisoslashgan yangi sun'iy intellekt modeli — Med-Gemini 2.0 ni taqdim etdi. Model ko'krak qafasi rentgen suratlarida 14 ta patologiyani (pnevmoniya, pnevmotoraks, saraton va boshqalar) 97.3% aniqlik bilan aniqlaydi.",
      "500,000 dan ortiq rentgen suratida o'qitilgan bu model 8 mamlakatdagi 15 kasalxonada sinovdan o'tkazildi. Natijalar The Lancet Digital Health jurnalida chop etildi.",
      "Tajribali radiologlarning o'rtacha aniqligi 94.1% ni tashkil etgan bo'lsa, Med-Gemini 2.0 bu ko'rsatkichni 3.2% ga oshirdi. Ayniqsa, kichik o'smalar va erta bosqich o'zgarishlarni aniqlashda model ustunlik ko'rsatdi.",
      "Model shunchaki diagnoz qo'yibgina qolmay, qaror qabul qilish jarayonini vizual tarzda tushuntiradi — qaysi hududga e'tibor qaratganini ko'rsatadi. Bu radiologlar ishonchini oshiradi va o'rganish vositasi sifatida ham xizmat qiladi.",
      "JSST bu texnologiyani rivojlanayotgan mamlakatlarda radiolog yetishmovchiligi muammosini hal qilish uchun muhim qadam deb baholadi. Afrikada 1 million aholiga atigi 1 radiolog to'g'ri keladi.",
      "Google DeepMind jamoasi keyingi bosqichda KT va MRT tasvirlarni ham o'z ichiga olgan universal tibbiy tasvir tahlil modelini yaratish ustida ishlayotganini ma'lum qildi."
    ],
    image: newsAi,
    source: "The Lancet Digital Health",
    date: "2026-02-10",
    isBreaking: true
  },
  {
    id: "ai2",
    categoryId: "ai",
    title: "AI yordamida yangi antibiotik kashf etildi — superbug'larga qarshi samarali",
    summary: "MIT olimlari sun'iy intellekt yordamida ko'p dorivor chidamli bakteriyalarga qarshi yangi antibiotik — Halicin-2 ni kashf etishdi.",
    content: [
      "Massachusetts Texnologiya Instituti (MIT) olimlarining AI platformasi 100 million dan ortiq kimyoviy birikmani tahlil qilib, ko'p dorivor chidamli (MDR) bakteriyalarga qarshi faol yangi molekulani aniqladi.",
      "Halicin-2 deb nomlangan bu antibiotik MRSA, VRE va karbapenem-chidamli Enterobacteriaceae (CRE) kabi eng xavfli superbug'larga qarshi samarali ekanligi laboratoriya sharoitida isbotlandi.",
      "An'anaviy antibiotik kashfiyoti 10-15 yil va 1 milliard dollar talab qiladi. AI bu jarayonni 18 oyga qisqartirdi va xarajatlarni 90% ga kamaytirdi.",
      "Dorining mexanizmi noyob — u bakteriya membranasining proton motiv kuchini buzadi, bu mexanizmga qarshi chidamlilik rivojlanishi juda qiyin.",
      "Hayvonlardagi tajribalar Halicin-2 ning MRSA sepsis modelida 92% sog'ayish ko'rsatkichini berganini isbotladi. Birinchi fazadagi klinik sinovlar 2026 yil yozida boshlanishi rejalashtirilgan.",
      "JSST antimikrob rezistentlikni '21-asr pandemiyasi' deb ataydi. Bu kashfiyot har yili 1.27 million kishining hayotini oladigan AMR muammosiga yechim bo'lishi mumkin."
    ],
    image: newsAi,
    source: "Cell",
    date: "2026-02-05"
  },
  // Vaksinalar
  {
    id: "v1",
    categoryId: "vaccine",
    title: "Universal gripp vaksinasi 1-bosqich klinik sinovlarini muvaffaqiyatli yakunladi",
    summary: "mRNA texnologiyasiga asoslangan universal gripp vaksinasi 20 ta gripp shtammiga qarshi immunitet hosil qildi.",
    content: [
      "Moderna va NIH hamkorligida ishlab chiqilgan mRNA-1010+ vaksinasi barcha ma'lum gripp A va B shtammlariga qarshi universal himoyani ta'minlashi mumkin. 1-bosqich klinik sinovlari 200 ko'ngilli ishtirokida muvaffaqiyatli yakunlandi.",
      "Vaksina 20 ta turli neuraminidaz va hemagglutinin oqsiliga qarshi immunitet hosil qiladi. Bu har yilgi mavsuiy gripp vaksinasidan farqli o'laroq, yangi shtammlar paydo bo'lganda ham himoyani ta'minlashi mumkin.",
      "Sinov natijalari barcha ishtirokchilarda kuchli antikor va T-hujayra javobini ko'rsatdi. Og'ir nojo'ya ta'sirlar kuzatilmadi — faqat in'ektsiya joyida og'riq va vaqtinchalik charchoq qayd etildi.",
      "Har yili gripp dunyo bo'ylab 290,000-650,000 kishining o'limiga sabab bo'ladi. Universal vaksina pandemiya xavfini sezilarli kamaytirishi va har yilgi vaksinatsiya zaruratini yo'q qilishi mumkin.",
      "2-bosqich klinik sinovlari 5,000 ko'ngilli ishtirokida 2026 yil bahorida boshlanadi. Agar muvaffaqiyatli bo'lsa, vaksina 2028 yilda bozorga chiqishi mumkin.",
      "Bu mRNA texnologiyasining COVID-19 dan keyingi yana bir muvaffaqiyati — texnologiya endi saraton, OIV va boshqa kasalliklarga qarshi vaksinalarda ham sinovdan o'tkazilmoqda."
    ],
    image: newsVaccine,
    source: "Science",
    date: "2026-02-03"
  },
  {
    id: "v2",
    categoryId: "vaccine",
    title: "OIVga qarshi vaksina birinchi marta inson sinovlarida immunitet hosil qildi",
    summary: "Duke universiteti olimlari tomonidan ishlab chiqilgan OIV vaksinasi 108 ko'ngillida keng ko'lamli neytralizatsiyalovchi antikorlarni hosil qildi.",
    content: [
      "Duke universiteti va IAVI hamkorligidagi 1-bosqich klinik sinovlari OIV virusining zaif nuqtalarini nishonga oluvchi yangi vaksina strategiyasining muvaffaqiyatini ko'rsatdi.",
      "Vaksina 'germline-targeting' deb ataluvchi innovatsion yondashuv asosida ishlaydi — u immunitet tizimining maxsus B-hujayralarini faollashtiradi, ular esa virusning o'zgarmas qismlariga qarshi antikorlar ishlab chiqaradi.",
      "108 ko'ngillining 97% da keng ko'lamli neytralizatsiyalovchi antikorlar hosil bo'ldi. Bu antikorlar OIVning turli shtammlarini (A, B, C klada) laboratoriyada neytralizatsiya qildi.",
      "OIV dunyo bo'ylab 39 million kishini zararlagan va yiliga taxminan 630,000 kishi OIV bilan bog'liq kasalliklardan vafot etadi. Samarali vaksina yaratish 40 yildan beri davom etayotgan ilmiy maqsad.",
      "Tadqiqot rahbari professor Barton Haynes: 'Bu birinchi marta OIVga qarshi vaksina insonda to'g'ri immune javobni hosil qildi. Biz 40 yillik ilmiy izlanishning natijasini ko'ryapmiz.'",
      "Keyingi bosqichda turli dozalar va kuchaytirilgan sxemalar sinovdan o'tkaziladi. To'liq samarali vaksina yaratish uchun yana 5-7 yil kerak bo'lishi mumkin."
    ],
    image: newsVaccine,
    source: "Nature Medicine",
    date: "2026-01-28"
  },
  // Jahon sog'liq
  {
    id: "g1",
    categoryId: "global",
    title: "JSST: 2025 yilda dunyo bo'ylab antibiotikka chidamlilik 15% oshdi",
    summary: "Jahon Sog'liqni Saqlash Tashkilotining yangi hisoboti antimikrob rezistentlik o'sishining xavotirli sur'atini ko'rsatdi.",
    content: [
      "JSSt ning 2025 yilgi Global Antimicrobial Resistance Surveillance System (GLASS) hisoboti 127 mamlakatdan olingan ma'lumotlarga asoslanib, antibiotikka chidamli infektsiyalar sonining oldingi yilga nisbatan 15% oshganini qayd etdi.",
      "Eng xavotirli tendensiyalar: MRSA holatlari 22% oshdi, karbapenem-chidamli gram-manfiy bakteriyalar 31% ko'paydi. Rivojlanayotgan mamlakatlarda vaziyat ayniqsa og'ir — antibiotikdan noto'g'ri foydalanish va sanitariya muammolari asosiy sabablar.",
      "Hisobotga ko'ra, 2025 yilda dunyo bo'ylab 5 million kishi to'g'ridan-to'g'ri yoki bilvosita AMR bilan bog'liq sabablardan vafot etdi. Bu raqam 2019 yildagi 4.95 milliondan sezilarli ko'p.",
      "JSST bosh direktori Dr. Tedros Adxanom Gebreyesus: 'Antibiotikka chidamlilik COVID-19 dan kam bo'lmagan global tahdid. Biz harakatni hozir boshlamasak, oddiy infektsiyalardan o'lish yana normaga aylanishi mumkin.'",
      "Tashkilot barcha mamlakatlarga quyidagilarni tavsiya qildi: antibiotik retsept bilan cheklash, qishloq xo'jaligida antibiotik ishlatishni kamaytirish, yangi antibiotik tadqiqotlarini moliyalashtirish va AMR kuzatish tizimlarini mustahkamlash.",
      "JSST 2030 yilga qadar AMR ga qarshi global fond tuzish va har yili kamida 4 milliard dollar ajratish zarurligini ta'kidladi."
    ],
    image: newsGlobal,
    source: "WHO",
    date: "2026-02-01",
    isFeatured: true
  },
  {
    id: "g2",
    categoryId: "global",
    title: "Afrikada birinchi mRNA vaksina zavodi ishga tushirildi",
    summary: "Janubiy Afrika Respublikasidagi yangi zavod yiliga 1 milliard dozagacha mRNA vaksina ishlab chiqarish quvvatiga ega.",
    content: [
      "Janubiy Afrika Respublikasining Keyp Taun shahridagi Afrigen Biologics kompaniyasi Afrikadagi birinchi to'liq tsiklli mRNA vaksina ishlab chiqarish zavodini ochdi. Bu pandemiyadan keyin boshlangan texnologiya transferi dasturining eng yirik natijasi.",
      "Zavod yillik 1 milliard dozagacha vaksina ishlab chiqarish quvvatiga ega. Dastlab COVID-19 va gripp vaksinalari, keyingi bosqichda malyariya, tuberkulyoz va OIVga qarshi vaksinalar ishlab chiqariladi.",
      "Loyihani JSST, CEPI va Bill & Melinda Gates Foundation qo'llab-quvvatladi. Umumiy investitsiya 500 million dollarni tashkil etdi.",
      "Afrikada iste'mol qilinadigan vaksinalarning 99% import qilinadi. Bu zavod pandamiya paytida tajriba qilingan 'vaksina tengsizligi' muammosiga uzoq muddatli yechim.",
      "Zavod direktori Dr. Petro Terblanche: 'Biz endi o'z aholimiz uchun vaksinalarni o'zimiz ishlab chiqaramiz. Bu Afrika uchun tarixiy voqea — biz endi donor yordamiga to'liq bog'liq emasmiz.'",
      "Keyingi 5 yil ichida Ruanda, Senegal va Gana da ham shunga o'xshash zavodlar qurish rejalashtirilgan."
    ],
    image: newsGlobal,
    source: "WHO Africa",
    date: "2026-01-22"
  },
  // Farmatsevtika
  {
    id: "p1",
    categoryId: "pharma",
    title: "FDA sememaglutid tabletkasini yurak kasalliklari profilaktikasi uchun tasdiqladi",
    summary: "Ozempic ning tabletka shakli (Rybelsus) endi diabetsiz bemorlarda ham yurak-qon tomir xavfini kamaytirish uchun ruxsat oldi.",
    content: [
      "AQSh Oziq-ovqat va Dori-darmonlar Boshqarmasi (FDA) semaglutidning og'iz orqali qo'llash shaklini (Rybelsus 14 mg) kardiovaskulyar xavfni kamaytirish uchun tasdiqladi. Bu GLP-1 agonistlarining tabletkadagi birinchi kardiovaskulyar ko'rsatmasi.",
      "SELECT-ORAL tadqiqoti 17,600 bemorda o'tkazildi: sememaglutid tabletkasi miokard infarkti, insult va kardiovaskulyar o'lim xavfini 21% ga kamaytirdi. Bemorlarning 72% da qandli diabet yo'q edi.",
      "In'ektsion Ozempic bilan solishtirganda, tabletka shakli kundalik qo'llash uchun ancha qulay, lekin ovqatlanishdan 30 daqiqa oldin bo'sh qoringa bir stakan suv bilan ichish kerak.",
      "Novo Nordisk aksiyalari bu yangilik fonida 8% oshdi. Kompaniya 2026 yilda tabletkali semaglutiddan 12 milliard dollar daromad kutmoqda.",
      "Raqobatchi Eli Lilly ham o'zining GLP-1 dorisi tirzepatidning tabletka shaklini 3-bosqich sinovlarida sinab ko'rmoqda. Natijalar 2026 yil oxirida kutilmoqda.",
      "Mutaxassislar GLP-1 agonistlarini '21-asrning aspirini' deb atashmoqda — ular nafaqat diabetda, balki semizlik, yurak kasalliklari, buyrak kasalliklari va hatto Alzheimer kasalligida ham samarali."
    ],
    image: newsPharma,
    source: "FDA",
    date: "2026-02-07"
  },
  {
    id: "p2",
    categoryId: "pharma",
    title: "Pfizer yangi avlod og'riq qoldiruvchi dori yaratdi — opioidlarga muqobil",
    summary: "Pfizer ning yangi non-opioid analgetik dorisi — PF-06882961 surunkali og'riqda morfindan kam bo'lmagan samaradorlik ko'rsatdi.",
    content: [
      "Pfizer farmatsevtika kompaniyasi qaramlik xavfi bo'lmagan yangi og'riq qoldiruvchi dori — navacaprant (PF-06882961) ning 3-bosqich klinik sinovlari natijalarini e'lon qildi.",
      "Nav1.8 natriy kanali blokatori sifatida ishlaydigan bu dori opioid retseptorlariga ta'sir qilmaydi, shuning uchun qaramlik va nafas depressiyasi xavfi yo'q.",
      "2,400 surunkali og'riq bemorida o'tkazilgan sinov dorining 50% va undan ko'p og'riqni kamaytirganini ko'rsatdi — bu morfinning ko'rsatkichiga teng, lekin nojo'ya ta'sirlari ancha kam.",
      "AQShda yiliga 100,000 dan ortiq kishi opioid ortiqcha dozasidan vafot etadi. Bu dori opioid epidemiyasiga yechim bo'lishi mumkin.",
      "FDA tezlashtirilgan ko'rib chiqish (Breakthrough Therapy) maqomini berdi. Tasdiqlash 2026 yil oxirida kutilmoqda.",
      "Bozor tahlilchilari navacaprant ning yillik savdo hajmini 8-12 milliard dollar deb baholashmoqda. Raqobatchi Vertex Pharmaceuticals ham shunga o'xshash VX-548 dorisini ishlab chiqmoqda."
    ],
    image: newsPharma,
    source: "NEJM",
    date: "2026-01-30"
  },
  // Teletibbiyot
  {
    id: "t1",
    categoryId: "telemed",
    title: "Teletibbiyot: 2025 yilda global bozor 180 milliard dollarga yetdi",
    summary: "McKinsey hisoboti teletibbiyot xizmatlarining pandemiyadan keyingi barqaror o'sishini va yangi texnologik tendensiyalarni tahlil qildi.",
    content: [
      "McKinsey & Company ning so'nggi hisobotiga ko'ra, global teletibbiyot bozori 2025 yilda 180 milliard dollarga yetdi. Bu 2019 yildagi 45 milliard dollardan 4 barobar ko'p.",
      "Eng tez o'sayotgan segmentlar: ruhiy sog'liq (yillik +35%), surunkali kasalliklar monitoringi (+28%), dermatologiya (+22%) va pediatriya (+18%). AI-asosli triage tizimlar yangi tendensiya.",
      "Remote Patient Monitoring (RPM) qurilmalari — aqlli soatlar, qon bosimi monitorlari va glukoza sensorlari — teletibbiyotning eng tez o'sayotgan qismi. 2025 yilda 75 million bemor RPM qurilmalaridan foydalandi.",
      "Regulativ o'zgarishlar: AQSh, Yevropa Ittifoqi va Xitoy teletibbiyot xizmatlariga doimiy to'lovni tasdiqladi. Bu pandemiya paytidagi vaqtinchalik qoidalarning doimiy qonunga aylanishi.",
      "Muammolar: internet tarmog'i yetarli bo'lmagan hududlarda foydalanish cheklangan, bemorning shaxsiy ma'lumotlari xavfsizligi va shifokor-bemor aloqasining sifati masalalari hal qilinishi kerak.",
      "Kelajak bashorati: 2030 yilga kelib ambulatoriya tashriflarining 40% virtual formatda bo'lishi, AI-asosli diagnostika tizimlar teletibbiyotga integratsiya qilinishi kutilmoqda."
    ],
    image: newsTelemed,
    source: "McKinsey & Company",
    date: "2026-01-25"
  },
  // Jarrohlik
  {
    id: "s1",
    categoryId: "surgery",
    title: "Birinchi marta genetik tahrirlangan cho'chqa yuragini inson bemor oldi va 6 oy yashadi",
    summary: "Maryland universiteti jamoasi xenotransplantatsiya tarixida eng uzoq muddatli muvaffaqiyatga erishdi — bemor 6 oydan ortiq yashadi.",
    content: [
      "Maryland universiteti tibbiy markazi jamoasi birinchi marta genetik tahrirlangan cho'chqa yuragini transplantatsiya qilingan bemor 6 oydan ortiq yashab, faol hayot kechirganini e'lon qildi.",
      "57 yoshli bemor Lourens Faucettga 10 ta gen o'zgartirilgan cho'chqa yuragi o'rnatildi: 3 ta cho'chqa geni o'chirildi (odam organizmining rad javobini keltirib chiqaruvchi), 6 ta odam geni qo'shildi va 1 ta cho'chqa o'sish geni o'chirildi.",
      "Oldingi ikki urinishda bemorlar 40 va 60 kun yashagan edi. Bu marta immunosupressiv terapiyaning yangi sxemasi (anti-CD154 antikor) va yaxshilangan genetik tahrirlar muvaffaqiyat kaliiti bo'ldi.",
      "Xenotransplantatsiya donor organ yetishmovchiligi muammosini hal qilishi mumkin. AQShda 100,000 dan ortiq bemor organ navbatida turadi, har kuni 17 kishi organ kutib vafot etadi.",
      "FDA xenotransplantatsiyani 'tezlashtirilgan yo'l' dasturiga kiritdi. 2027 yilga kelib rasmiy klinik sinovlar boshlantishi kutilmoqda.",
      "Eetik masalalar: hayvon huquqlari tashkilotlari norozilik bildirmoqda, ammo transplantologlar buning minglab insonlar hayotini saqlab qolish imkoniyati ekanini ta'kidlashmoqda."
    ],
    image: newsTransplant,
    source: "NEJM",
    date: "2026-02-11",
    isBreaking: true,
    isFeatured: true
  },
  // Ruhiy salomatlik
  {
    id: "m1",
    categoryId: "mental",
    title: "Psilotsibin depressiyaga qarshi dori sifatida Avstraliyada rasman tasdiqlandi",
    summary: "Avstraliya — psilotsinni davolanishga chidamli depressiyada rasman tasdiqlagan birinchi mamlakat. 12 oylik natijalar: 71% bemorlar remissiyada.",
    content: [
      "Avstraliya Terapevtik Mahsulotlar Boshqarmasi (TGA) psilotsibin yordamchi psixoterapiyani davolashga chidamli depressiya (treatment-resistant depression) uchun tasdiqladi. Bu psixedelik terapiyaning rasmiy tibbiy maqom olgan birinchi holati.",
      "Tasdiqlashga asos bo'lgan COMPASS Pathways ning 3-bosqich klinik sinovi 500 bemorda o'tkazildi. 12 oylik natijalar: bemorlarning 71% da depressiya alomatlari sezilarli kamaydi, 42% to'liq remissiyaga erishdi.",
      "Davolash protokoli: 25 mg psilotsibin 2-3 sessiyada, har bir sessiya 6-8 soat davom etadi va maxsus tayyorlangan psixoterapevt nazoratida o'tkaziladi. Bu oddiy dori qabul qilishdan tubdan farq qiladi.",
      "Psilotsibin miya default mode network (DMN) faolligini vaqtinchalik buzib, yangi neyral aloqalar o'rnatishga yordam beradi. Bu mexanizm bemorlarni salbiy fikrlash tsiklidan chiqarishga imkon beradi.",
      "Cheklovlar: faqat sertifikatlangan psixiatr nazoratida, maxsus litsenziyalangan klinikalarda, qat'iy skrining (psixoz, shizofreniya anamnezi bo'lmasligi) dan keyin. Uyda foydalanish man etilgan.",
      "AQSh FDAsi ham psilotsinni 'breakthrough therapy' maqomida ko'rib chiqmoqda. Yevropada MDMA yordamchi terapiya PTSD uchun sinovda. Psixedelik tibbiyot yangi era boshlanmoqda."
    ],
    image: newsMental,
    source: "The Lancet Psychiatry",
    date: "2026-02-06"
  },
  // Genetika
  {
    id: "gen1",
    categoryId: "genetics",
    title: "CRISPR gen terapiyasi o'roq hujayrali anemiyani butunlay davoladi — 3 yillik natijalar",
    summary: "Casgevy (exagamglogene autotemcel) bilan davolangan 75 bemorning 94% da 3 yil ichida og'riq krizlari to'liq to'xtadi.",
    content: [
      "Vertex Pharmaceuticals va CRISPR Therapeutics ning birgalikdagi 3 yillik kuzatuv ma'lumotlari Casgevy gen terapiyasining o'roq hujayrali anemiya (OHA) va transfuziyaga bog'liq beta-talassemiya bemorlarida barqaror samaradorligini tasdiqladi.",
      "75 OHA bemorining 94% da (70/75) so'nggi 3 yil davomida vazo-okklyuziv og'riq krizlari kuzatilmadi. 42 beta-talassemiya bemorining 95% da (40/42) qon quyish zarurati butunlay yo'q bo'ldi.",
      "Casgevy dunyodagi birinchi CRISPR-asosli gen terapiyasi bo'lib, 2023 yilda AQSh va Buyuk Britaniyada tasdiqlangan edi. U bemorning o'z ildiz hujayralarini olib, BCL11A genini tahrirlaydi — bu fetal gemoglobin ishlab chiqarishni tiklaydi.",
      "Davolash jarayoni: bemorning ildiz hujayralari olinadi → CRISPR bilan tahrir qilinadi → kemoteraptya bilan myeloablyatsiya → tahrirlangan hujayralar qayta o'tkaziladi. Butun jarayon 4-6 oy davom etadi.",
      "Asosiy muammo — narx: bir bemor uchun 2.2 million AQSh dollari. Ammo umr bo'yi qon quyish, hospitalizatsiya va boshqa davolash xarajatlari bilan solishtirganda, gen terapiyasi 10-15 yilda o'zini oqlaydi.",
      "Kelajak: Vertex ikkinchi avlod in vivo gen terapiyasini ishlab chiqmoqda — bu bemorning tanasida to'g'ridan-to'g'ri gen tahrirlash imkonini beradi va myeloablyatsiya zaruriyatini yo'q qiladi."
    ],
    image: newsGenetics,
    source: "Blood Journal",
    date: "2026-02-09",
    isFeatured: true
  },
  // Bolalar sog'lig'i
  {
    id: "ped1",
    categoryId: "pediatrics",
    title: "JSST: bolalar vaksinatsiya qamrovi pandemiyadan oldingi darajaga qaytdi",
    summary: "2025 yilda dunyo bo'ylab bolalar vaksinatsiyasi COVID-19 pandemiyasidan oldingi 86% darajasiga qaytdi va ba'zi ko'rsatkichlar oshdi.",
    content: [
      "JSST va UNICEF ning birgalikdagi 2025 yilgi hisobotiga ko'ra, global bolalar vaksinatsiya qamrovi pandemiya davrida 2021 yilda 81% ga tushgan bo'lsa, endi 86% ga qaytdi va DTP3 (difteriya-qoqshol-ko'kyo'tal) bo'yicha 87% ga yetdi.",
      "Eng sezilarli yaxshilanish Janubi-Sharqiy Osiyo (+7%) va Afrikada (+5%) kuzatildi. Hindiston, Nigeriya va Kongodan tashqari deyarli barcha mamlakatlarda pandemiyadan oldingi darajaga qaytildi.",
      "Poliomiyelit: yovvoyi poliovirus 2025 yilda faqat Pokiston va Afg'onistonda 12 holat qayd etildi (2024 yilda — 24). To'liq yo'q qilish yaqin, ammo oxirgi 1% eng qiyin.",
      "Qizilcha: 2025 yilda global qizilcha holatlari 45% kamaydi. Bunda qo'shimcha vaksinatsiya kampaniyalari va ikkinchi doza MCV2 qamrovining 83% ga oshishi hal qiluvchi bo'ldi.",
      "Yangi vaksinalar: malyariya vaksinasi RTS,S 28 Afrika mamlakatida, rotavirus vaksinasi 120 mamlakatda, HPV vaksinasi 140 mamlakatda milliy dasturga kiritildi.",
      "JSST maqsadi: 2030 yilga kelib barcha bolalar vaksinatsiya dasturlari qamrovini 90% ga oshirish va 'nol dozalik bolalar' (hech bir vaksina olmagan) sonini 50% ga kamaytirish."
    ],
    image: newsChildren,
    source: "WHO/UNICEF",
    date: "2026-01-20"
  },
  {
    id: "ped2",
    categoryId: "pediatrics",
    title: "RSV dan himoyalovchi yangi vaksina chaqaloqlar o'limini 78% ga kamaytirdi",
    summary: "Pfizer ning Abrysvo vaksinasi homilador onalarga berilganda yangi tug'ilgan chaqaloqlarni RSV virusidan 6 oy davomida himoya qildi.",
    content: [
      "New England Journal of Medicine da chop etilgan keng ko'lamli tadqiqot Pfizer ning Abrysvo vaksinasining real-world samaradorligini tasdiqladi. 2024-2025 RSV mavsumida vaktsinalangan onalarning chaqaloqlari orasida RSV bilan bog'liq hospitalizatsiya 78% kamaydi.",
      "Tadqiqot 15 mamlakatdagi 250,000 tug'ilishni qamrab oldi. Vaksina homiladorlikning 32-36 haftalarida berildi. Himoya ta'siri tug'ilishdan keyin 6 oygacha davom etdi.",
      "RSV (Respiratory Syncytial Virus) — 1 yoshgacha chaqaloqlarda bronxiolit va pnevmoniyaning asosiy sababi. Dunyo bo'ylab yiliga 3.6 million chaqaloq RSV tufayli kasalxonaga tushadi, 100,000 dan ortig'i vafot etadi.",
      "Abrysvo 2023 yil avgustida FDA tomonidan tasdiqlangan birinchi RSV vaksinasi. Endi uning real-world ma'lumotlari klinik sinovlar natijalarini to'liq tasdiqladi.",
      "Raqobat: Sanofi ning nirsevimab (Beyfortus) monoklonal antikori ham chaqaloqlar uchun tasdiqlangan. U tug'ilgandan keyin to'g'ridan-to'g'ri chaqaloqqa beriladi va 5 oy himoya qiladi.",
      "Ekspertlar ikkala yondashuvning ham — onalar vaksinatsiyasi va chaqaloqlar immunprofilaktikasi — birgalikda RSV bilan bog'liq chaqaloqlar o'limini 90% ga kamaytirish imkonini berishi mumkinligini ta'kidlashmoqda."
    ],
    image: newsChildren,
    source: "NEJM",
    date: "2026-01-15"
  },
  // Teletibbiyot - qo'shimcha
  {
    id: "t2",
    categoryId: "telemed",
    title: "Apple Watch 11 qon shakar va qon bosimini real-vaqtda o'lchash imkoniyatiga ega bo'ldi",
    summary: "Apple ning yangi avlod soati invaziv bo'lmagan glukoza monitoringi va uzluksiz qon bosimi o'lchash funksiyasini taqdim etdi.",
    content: [
      "Apple kompaniyasi Apple Watch Series 11 da birinchi marta invaziv bo'lmagan qon shakar va uzluksiz qon bosimi o'lchash imkoniyatini taqdim etdi. Bu tibbiy qurilmalar bozorida inqilob.",
      "Glukoza monitoringi: infratovush spektroskopiyasi texnologiyasi teri orqali qon shakari darajasini har 5 daqiqada o'lchaydi. MARD (mean absolute relative difference) 9.8% — bu FDA ning tibbiy qurilma sifatida tasdiqlash uchun yetarli (talab: <10%).",
      "Qon bosimi monitoringi: tonometriya sensori har soatda qon bosimini o'lchaydi va kun davomidagi o'zgarishlarni grafik tarzda ko'rsatadi. Gipertoniya bemorlariga ogohlantirish yuboradi.",
      "FDA bu funksiyalarni 'wellness device' emas, balki to'liq tibbiy qurilma (Class II medical device) sifatida tasdiqladi. Bu shifokorlar uchun ham ishonchli ma'lumot manbai.",
      "Dunyo bo'ylab 537 million kishi qandli diabet bilan yashaydi. Ko'pchilik o'z qon shakarini muntazam o'lchamaydi. Apple Watch bu muammoni hal qilishi mumkin — chunki odamlar soatini har kuni taqadi.",
      "Raqobatchilar: Samsung Galaxy Watch 8 va Google Pixel Watch 4 ham shunga o'xshash texnologiyalar ustida ishlayotganini e'lon qildi. Tibbiy wearable qurilmalar bozori 2027 yilga kelib 100 milliard dollarga yetishi bashorat qilinmoqda."
    ],
    image: newsTelemed,
    source: "Apple Newsroom",
    date: "2026-02-04"
  },
];

export const totalNewsItems = newsItems.length;
export const totalNewsCategories = newsCategories.length;
