import catAllergy from "@/assets/cat-allergy.jpg";
import artSelected from "@/assets/art-selected.jpg";
import catDermatology from "@/assets/cat-dermatology.jpg";
import catNeurology from "@/assets/cat-neurology.jpg";
import catAndrology from "@/assets/cat-andrology.jpg";
import catLor from "@/assets/cat-lor.jpg";
import catVenereology from "@/assets/cat-venereology.jpg";
import catInfectious from "@/assets/cat-infectious.jpg";
import catGynecology from "@/assets/cat-gynecology.jpg";
import catEndocrinology from "@/assets/cat-endocrinology.jpg";
import catGastro from "@/assets/cat-gastro.jpg";
import catOncology from "@/assets/cat-oncology.jpg";
import catParasitology from "@/assets/cat-parasitology.jpg";
import catOrthopedics from "@/assets/cat-orthopedics.jpg";
import catMammology from "@/assets/cat-mammology.jpg";
import catRheumatology from "@/assets/cat-rheumatology.jpg";
import catHematology from "@/assets/cat-hematology.jpg";
import catPulmonology from "@/assets/cat-pulmonology.jpg";
import catPediatrics from "@/assets/cat-pediatrics.jpg";
import catVirology from "@/assets/cat-virology.jpg";
import artOncogynecology from "@/assets/art-oncogynecology.jpg";
import catTraumatology from "@/assets/cat-traumatology.jpg";
import catDental from "@/assets/cat-dental.jpg";
import catSurgery from "@/assets/cat-surgery.jpg";
import catEye from "@/assets/cat-eye.jpg";
import catCardiology from "@/assets/cat-cardiology.jpg";
import catUrology from "@/assets/cat-urology.jpg";
import catProctology from "@/assets/cat-proctology.jpg";
import artNarcology from "@/assets/art-narcology.jpg";

export type Article = {
  id: string;
  title: string;
  slug: string;
  image: string;
  summary: string;
  content: string[];
  author: string;
  date: string;
};

export type ArticleCategory = {
  id: string;
  title: string;
  quote: string;
  image: string;
  article: Article;
};

export const articleCategories: ArticleCategory[] = [
  {
    id: "allergiya",
    title: "Allergik reaktsiyalar",
    quote: "\"Allergiya — zamonaviy dunyoning eng keng tarqalgan immunologik muammosi.\"",
    image: catAllergy,
    article: {
      id: "allergy-1",
      title: "Allergik reaktsiyalar: sabablari, turlari va zamonaviy davolash usullari",
      slug: "allergik-reaktsiyalar-zamonaviy-davolash",
      image: catAllergy,
      summary: "Allergik kasalliklarning kelib chiqishi, klinik ko'rinishlari va zamonaviy immunoterapiya usullari haqida keng maqola.",
      content: [
        "Allergik reaktsiyalar — organizmning zararsiz moddalarga nisbatan haddan tashqari immunologik javobi. Jahon sog'liqni saqlash tashkiloti (JSST) ma'lumotlariga ko'ra, dunyo aholisining 30-40% allergik kasalliklarga chalinadi.",
        "Allergiyaning asosiy turlari: I tip (tezkor) — anafilaksiya, eshakemi, allergik rinit; II tip — sitotoksik reaktsiyalar; III tip — immunokompleks kasalliklar; IV tip (kechiktirilgan) — kontakt dermatit, tuberkulin reaktsiyasi.",
        "Allergenlar orasida eng ko'p uchraydiganlari: gul changi (pollinozlar), oziq-ovqat allergenlari (sut, tuxum, yeryong'oq), dori-darmonlar (antibiotiklar, NPVP), uy changi kanalari va hayvon epiteli.",
        "Diagnostika usullari: teri skarifikatsion sinovi, qondagi IgE darajasini aniqlash (RAST, ImmunoCAP), provokatsion sinovlar va eliminatsion dieta. Zamonaviy molekulyar diagnostika alohida allergen komponentlarini aniqlashga imkon beradi.",
        "Davolash asoslari: allergendan qochish (eliminatsiya), farmakoterapiya (antigistaminlar, kortikosteroidlar, leykotrien antagonistlari) va allergen-spetsifik immunoterapiya (ASIT). ASIT — allergiyaning yagona sababiy davolash usuli bo'lib, 3-5 yil davom etadi.",
        "Biologik terapiya: omalizumab (anti-IgE), dupilumab (anti-IL-4/IL-13) kabi monoklonal antikorlar og'ir allergik kasalliklarda inqilobiy natijalar ko'rsatmoqda.",
        "Profilaktika: erta yoshda xilma-xil ovqatlanish, tabiatda ko'proq vaqt o'tkazish (gigiyena gipotezasi), chekishdan qochish va uy muhitini allergenlardan tozalash tavsiya etiladi."
      ],
      author: "Dr. Aziza Karimova, allergolog-immunolog",
      date: "2024-12-15"
    }
  },
  {
    id: "tanlangan",
    title: "Tanlangan kasalliklar",
    quote: "\"Eng keng tarqalgan kasalliklarni bilish — har bir inson uchun muhim.\"",
    image: artSelected,
    article: {
      id: "selected-1",
      title: "Eng ko'p uchraydigan kasalliklar: statistika, profilaktika va zamonaviy yondashuvlar",
      slug: "eng-kop-uchraydigan-kasalliklar",
      image: artSelected,
      summary: "Dunyo bo'ylab eng ko'p uchraydigan kasalliklar haqida statistik ma'lumotlar va ularning oldini olish choralari.",
      content: [
        "Jahon sog'liqni saqlash tashkilotining 2024-yil hisobotiga ko'ra, yurak-qon tomir kasalliklari, diabet, onkologik kasalliklar va surunkali nafas kasalliklari dunyo bo'ylab o'limning asosiy sabablari hisoblanadi.",
        "Yurak-qon tomir kasalliklari yiliga 17.9 million kishining hayotini oladi. Gipertoniya, ateroskleroz va yurak ishemiyasi eng ko'p tarqalgan turlari. Risk omillari: noto'g'ri ovqatlanish, harakatsiz turmush tarzi, chekish va ortiqcha vazn.",
        "2-tip qandli diabet — dunyoda 537 million kattalar bu kasallikka chalingan. Insulin rezistentligi, genetik moyillik va noto'g'ri turmush tarzi asosiy sabablar. Erta tashxis va turmush tarzini o'zgartirish orqali nazorat qilish mumkin.",
        "Onkologik kasalliklar: o'pka, ko'krak bezi, yo'g'on ichak va prostata saratoni eng ko'p uchraydi. Erta skrining dasturlari (mammografiya, kolonoskopiya, PSA) orqali 5 yillik yashash ko'rsatkichi sezilarli oshirildi.",
        "Ruhiy sog'liq: depressiya dunyo bo'ylab 280 million kishini qamrab olgan. Stress, yolg'izlik va ijtimoiy omillar asosiy risk faktorlari. Psixoterapiya va farmakoterapiya birgalikda eng samarali davolash hisoblanadi.",
        "Profilaktikaning 5 ustuni: muntazam jismoniy faollik (haftada 150 daqiqa), muvozanatli ovqatlanish, yetarli uyqu (7-9 soat), stressni boshqarish va zararli odatlardan voz kechish."
      ],
      author: "Dr. Bobur Toshmatov, terapevt",
      date: "2024-11-20"
    }
  },
  {
    id: "dermatologiya",
    title: "Dermatologiya",
    quote: "\"Teri — organizmning eng katta organi va sog'liq oynasi.\"",
    image: catDermatology,
    article: {
      id: "derm-1",
      title: "Teri kasalliklari: zamonaviy dermatologiyaning yutuqlari va davolash usullari",
      slug: "teri-kasalliklari-zamonaviy-dermatologiya",
      image: catDermatology,
      summary: "Psoriaz, ekzema, akne va boshqa teri kasalliklarining zamonaviy davolash usullari haqida ilmiy maqola.",
      content: [
        "Dermatologiya — teri, soch, tirnoq va shilliq qavatlar kasalliklarini o'rganadigan tibbiyot sohasi. Dunyo aholisining 30-70% hayoti davomida biror teri muammosiga duch keladi.",
        "Psoriaz — surunkali autoimmun teri kasalligi bo'lib, dunyo aholisining 2-3% ni qamrab oladi. Teri hujayralarining haddan tashqari tez bo'linishi natijasida kumushrang tangachalar paydo bo'ladi. Zamonaviy biologik preparatlar (adalimumab, ustekinumab, sekukinumab) kasallikni 90% gacha nazorat qilish imkonini berdi.",
        "Atopik dermatit (ekzema) — eng ko'p uchraydigan surunkali teri kasalligi, ayniqsa bolalarda. Teri to'sig'ining buzilishi (filaggrin geni mutatsiyasi) va immunitet disregulatsiyasi asosiy sabablar. Dupilumab — o'rtacha va og'ir atopik dermatit uchun yangi biologik preparat.",
        "Akne (bo'jashorat) — yog' bezlarining surunkali yallig'lanishi. O'smirlarning 85% da uchraydi. Davolash: topikal retinoidlar, benzoil peroksid, antibiotiklar, og'ir hollarda izotretinoin. Tuxumdon polikistozi bilan bog'liq akneda gormon terapiyasi qo'llaniladi.",
        "Teri saratoni: melanoma, bazal hujayrali va yassi hujayrali karsinoma. Ultrabinafsha nurlanish asosiy risk omili. ABCDE qoidasi (Asimmetriya, Border, Color, Diameter, Evolution) melanomani erta aniqlashda muhim.",
        "Zamonaviy dermatologik texnologiyalar: lazer terapiya (fraksional, IPL), fotodynamik terapiya, krioterapiya va dermoskopiya. Teledermatologiya pandemiyadan keyin keng tarqaldi.",
        "Teri parvarishi asoslari: SPF 30+ quyoshdan himoya, yumshoq tozalash, namlantirish va retinol/vitamin C serumlari. Teri mikrobiomasini saqlash zamonaviy dermatologiyaning yangi yo'nalishi."
      ],
      author: "Dr. Nilufar Xasanova, dermatolog",
      date: "2024-10-05"
    }
  },
  {
    id: "nevrologiya",
    title: "Nerv tizimi kasalliklari",
    quote: "\"Miya — koinotdagi eng murakkab tuzilma, uni o'rganish cheksiz sayohat.\"",
    image: catNeurology,
    article: {
      id: "neuro-1",
      title: "Nerv tizimi kasalliklari: insultdan Parkinson kasalligiga qadar",
      slug: "nerv-tizimi-kasalliklari-insult-parkinson",
      image: catNeurology,
      summary: "Markaziy va periferik nerv tizimi kasalliklari, ularning erta tashxisi va zamonaviy neyroreabilitatsiya usullari.",
      content: [
        "Nevrologik kasalliklar dunyo bo'ylab nogironlikning yetakchi sababi hisoblanadi. Insult, epilepsiya, Parkinson kasalligi, ko'p tarqoq skleroz va migren eng ko'p uchraydigan nevrologik kasalliklar.",
        "Insult — miyaga qon oqishining to'satdan buzilishi. Har 40 soniyada bir kishi insultga uchraydi. FAST qoidasi: Face (yuz qiyshayishi), Arms (qo'l kuchsizligi), Speech (nutq buzilishi), Time (vaqt — tezda 103 ga qo'ng'iroq). Trombolizis dastlabki 4.5 soat ichida qo'llanilishi kerak.",
        "Parkinson kasalligi — dopamin ishlab chiqaruvchi neyronlarning yo'qolishi. Titrash, mushaklarning qotishi, harakatlarning sekinlashishi asosiy alomatlar. Levodopa asosiy dori bo'lib qolmoqda, ammo chuqur miya stimulyatsiyasi (DBS) ilg'or davolash usuli.",
        "Migren — dunyo aholisining 15% ni qamrab oladigan nevrologik kasallik. Pulsatsiyalovchi bosh og'rig'i, ko'ngil aynishi va yorug'likka sezuvchanlik xos. CGRP monoklonal antikorlari (erenumab, fremanezumab) profilaktik davolashda inqilob yasadi.",
        "Epilepsiya — miyaning paroksizmal aktivligi. 50 million kishi epilepsiya bilan yashaydi. Zamonaviy antiepileptik preparatlar va zarur hollarda jarrohlik davolash qo'llaniladi. Ketogen dieta dorivor rezistent epilepsiyada samarali.",
        "Neyroreabilitatsiya: robot-yordamchi terapiya, virtual reallik, transkranial magnit stimulyatsiya (TMS) va neyroplastisitik mashqlar insult va travma keyin tiklanishni tezlashtiradi.",
        "Miya sog'lig'ini saqlash: intellektual faollik, ijtimoiy muloqot, jismoniy mashqlar, sifatli uyqu va Mediterran dietasi demensiya riskini 30-40% ga kamaytiradi."
      ],
      author: "Dr. Sardor Rahimov, nevrolog",
      date: "2024-09-18"
    }
  },
  {
    id: "andrologiya",
    title: "Andrologiya",
    quote: "\"Erkak sog'lig'i — oila va jamiyat sog'lig'ining asosi.\"",
    image: catAndrology,
    article: {
      id: "andro-1",
      title: "Erkak reproduktiv sog'lig'i: andrologiyaning zamonaviy yondashuvlari",
      slug: "erkak-reproduktiv-sogligi-andrologiya",
      image: catAndrology,
      summary: "Erkak bepushtligi, prostatit va erektil disfunktsiya haqida zamonaviy tibbiy yondashuvlar.",
      content: [
        "Andrologiya — erkak reproduktiv tizimi kasalliklarini o'rganadigan tibbiyot sohasi. Erkak bepushtligi juftliklarning 40-50% bepushtlik holatlarida sababchi omil hisoblanadi.",
        "Erkak bepushtligining asosiy sabablari: varikosele (35-40%), infektsiyalar, gormon buzilishlari, genetik omillar (Klinefelter sindromi) va turmush tarzi omillari (chekish, spirtli ichimliklar, issiqlik ta'siri).",
        "Spermogramma — erkak fertilligini baholashning asosiy usuli. JSST mezonlari: hajm ≥1.5 ml, kontsentratsiya ≥15 mln/ml, harakatlanish ≥40%, normal morfologiya ≥4%. Zamonaviy CASA tizimi kompyuter yordamida aniq tahlil beradi.",
        "Erektil disfunktsiya (ED) — 40 yoshdan oshgan erkaklarning 52% da turli darajada uchraydi. Sabablari: qon tomir kasalliklari, diabet, gormon yetishmovchiligi, psixologik omillar. PDE-5 ingibitorlari (sildenafil, tadalafil) birinchi qator davolash.",
        "Prostatit va prostat giperplaziyasi (BPH) — 50 yoshdan oshgan erkaklarning yarmida BPH alomatlari kuzatiladi. Alfa-blokatorlar va 5-alfa reduktaza ingibitorlari farmakoterapiyaning asosi.",
        "Testosteron yetishmovchiligi (gipogonadizm): charchoq, kayfiyat tushishi, mushak massasi kamayishi va libido pasayishi bilan namoyon bo'ladi. Gormon almashtirish terapiyasi (GAT) shifokor nazoratida qo'llaniladi.",
        "Profilaktika: muntazam jismoniy faollik, sog'lom ovqatlanish (sink, selen, folat kislota), chekish va spirtdan voz kechish, muntazam urologik ko'rik (40 yoshdan keyin yiliga 1 marta)."
      ],
      author: "Dr. Javlon Mirzayev, androlog-urolog",
      date: "2024-08-22"
    }
  },
  {
    id: "lor",
    title: "LOR",
    quote: "\"Quloq, burun va tomoq — nafas olish va muloqotning darvozasi.\"",
    image: catLor,
    article: {
      id: "lor-1",
      title: "LOR kasalliklari: sinusitdan eshitish yo'qotishiga qadar zamonaviy yondashuvlar",
      slug: "lor-kasalliklari-sinusit-eshitish",
      image: catLor,
      summary: "Quloq, burun va tomoq kasalliklarining diagnostikasi va minimal invaziv davolash usullari.",
      content: [
        "Otorinolaringologiya (LOR) — quloq, burun, tomoq va bosh-bo'yin sohasining kasalliklarini davolaydigan tibbiyot sohasi. LOR kasalliklari ambulatoriya murojjatlarining 15-20% ni tashkil etadi.",
        "Surunkali sinusit — burun bo'shliqlari shilliq qavatining 12 haftadan ortiq davom etadigan yallig'lanishi. 31 million amerikalik surunkali sinusitdan aziyat chekadi. Endoskopik sinus jarrohlik (FESS) dorivor davolashga javob bermaydigan hollarda qo'llaniladi.",
        "Tonzillit va adenoidit — bolalarda eng ko'p uchraydigan LOR kasalliklari. Streptokokk tonzilliti erta davolanmasa revmatik isitma va glomerulonefritga olib kelishi mumkin. Tonzillektomiya yiliga 7+ marta qaytalanuvchi tonzillitda ko'rsatiladi.",
        "Eshitish yo'qotishi: konduktiv (o'rta quloq patologiyasi) va sensorineyral (ichki quloq/nerv shikastlanishi) turlari. Shovqin ta'sirida eshitish yo'qotilishi qaytarilmas. Koxlear implant ikki tomonlama og'ir karliklarda inqilobiy yechim.",
        "Allergik va vazomotor rinit — burun bitishi, aksirish va suv oqishi bilan kechadigan surunkali holat. Intranzal kortikosteroidlar (mometazon, flutikazon) birinchi qator davolash. Immunoterapiya uzoq muddatli nazoratni ta'minlaydi.",
        "LOR onkologiyasi: hiqildoq, burun bo'shliqlari va eshitish organi o'smalari. Chekish va spirtli ichimliklar hiqildoq saratoni riskini 30 barobar oshiradi. Erta bosqichlarda lazer jarrohlik organlarni saqlash imkonini beradi.",
        "Oldini olish: quloqqa narsalarni soqmaslik, shovqinli muhitda himoya vositalari qo'llash, burun gigiyenasini saqlash va chekishdan voz kechish."
      ],
      author: "Dr. Lola Umarova, otorinolaringolog",
      date: "2024-07-10"
    }
  },
  {
    id: "venereologiya",
    title: "Jinsiy kasalliklar",
    quote: "\"Jinsiy sog'liq — umumiy sog'liqning ajralmas qismi.\"",
    image: catVenereology,
    article: {
      id: "vener-1",
      title: "Jinsiy yo'l bilan yuqadigan infektsiyalar: profilaktika va zamonaviy davolash",
      slug: "jinsiy-infektsiyalar-profilaktika-davolash",
      image: catVenereology,
      summary: "JYYI turlari, tashxislash usullari va zamonaviy antibiotik terapiya haqida keng maqola.",
      content: [
        "Jinsiy yo'l bilan yuqadigan infektsiyalar (JYYI) — har kuni 1 million yangi holat qayd etiladi (JSST). Xlamidiya, gonoreya, sifilis, trixomoniaz va HPV eng ko'p tarqalgan turlari.",
        "Xlamidiya — eng ko'p uchraydigan bakterial JYYI. Ko'pincha simptomlar bolmaydi, ammo davolanmasa bepushtlikka olib keladi. Azitromitsin yoki doksitsiklin bilan davolanadi. Barcha jinsiy faol yoshlarga yillik skrining tavsiya etiladi.",
        "Gonoreya — Neisseria gonorrhoeae bakteriyasi chaqiradi. Antibiotikka chidamlilik global muammo. Hozirgi davolash: seftriakson in'ektsiya + azitromitsin. Superbug shtammlari paydo bo'lishi xavotirga sabab.",
        "HPV (odam papillomavirusi) — eng ko'p tarqalgan JYYI. 200+ turi mavjud, 14 tasi onkogen (16, 18 — eng xavfli). Bachadon bo'yni saratoni, anogenital saratonlarning 99% HPV bilan bog'liq. Vaksinatsiya (Gardasil 9) 9-26 yoshda eng samarali.",
        "OIV/OITS — dunyo bo'ylab 39 million kishi OIV bilan yashaydi. Antiretroviral terapiya (ART) virusni aniqlanmaydigan darajaga tushiradi va uzatishni oldini oladi (U=U). PrEP — OIV ga chalinmagan risk guruhlar uchun profilaktik dori.",
        "Sifilis — Treponema pallidum chaqiradi. Birlamchi (shanker), ikkilamchi (teri toshmalari), uchinchi (gumma) va neyrosifilis bosqichlari. Penitsillin hamon eng samarali davolash. Homiladorlikda skrining majburiy.",
        "Profilaktika: prezervativdan to'g'ri foydalanish (90% himoya), HPV vaksinatsiyasi, muntazam skrining, jinsiy sheriklar sonini kamaytirish va ochiq muloqot."
      ],
      author: "Dr. Kamola Nazarova, dermatovenerolog",
      date: "2024-06-28"
    }
  },
  {
    id: "yuqumli",
    title: "Yuqumli kasalliklar",
    quote: "\"Yuqumli kasalliklarni bilish — butun jamiyatni himoya qilish demak.\"",
    image: catInfectious,
    article: {
      id: "infect-1",
      title: "Yuqumli kasalliklar: pandemiyalardan antibiotiklarning kelajagiga",
      slug: "yuqumli-kasalliklar-pandemiya-antibiotiklar",
      image: catInfectious,
      summary: "Infektsion kasalliklar epidemiologiyasi, vaksinatsiya va antimikrob rezistentlik muammolari.",
      content: [
        "Yuqumli kasalliklar insoniyat tarixida eng ko'p o'lim keltirgan sabablar. COVID-19 pandemiyasi zamonaviy dunyoning ham infektsiyalarga zaifligini ko'rsatdi — 7 million dan ortiq o'lim qayd etildi.",
        "Vaksinatsiya — tibbiyot tarixidagi eng muvaffaqiyatli aralashuv. Chechak yo'q qilindi, poliomiyelit deyarli barham topdi. mRNA vaksinalar (COVID-19) — yangi era. Kelajakda saraton va OIVga qarshi vaksinalar kutilmoqda.",
        "Antimikrob rezistentlik (AMR) — XXI asrning eng katta sog'liqni saqlash tahdidi. 2019-yilda 1.27 million o'lim AMR bilan bevosita bog'liq. 2050-yilga kelib yiliga 10 million o'limga olib kelishi bashorat qilingan.",
        "Tuberkulyoz — hamon dunyo bo'ylab eng ko'p o'ldiruvchi infektsion kasallik (yiliga 1.3 million). Ko'p dorivor chidamli sil (MDR-TB) davolash uchun bedaquilin va pretomanid kabi yangi dorilar tasdiqlangan.",
        "Malyariya — yiliga 600,000+ o'lim, asosan Afrikada 5 yoshgacha bolalarda. RTS,S/AS01 — birinchi malyariya vaksinasi 2021-yilda tavsiya etildi. Insektitsid bilan ishlov berilgan to'shaklar va artemisinin kombinatsiyalari asosiy chora.",
        "Yangi tahdidlar: Mpox (maymun chechagi), H5N1 qush grippi, Nipah virusi va X kasallik (noma'lum kelajak pandemiya). JSST pandemik tayyorgarlik shartnomasi ustida ish olib bormoqda.",
        "Shaxsiy himoya: qo'l yuvish (30% infektsiyani kamaytiradi), vaksinatsiya jadvali, xavfsiz ovqat tayyorlash, sayohat oldidan maslahatlashish va antibiotikdan to'g'ri foydalanish."
      ],
      author: "Dr. Firdavs Umarov, infektsionist",
      date: "2024-05-14"
    }
  },
  {
    id: "ginekologiya",
    title: "Ginekologik kasalliklar",
    quote: "\"Ayol sog'lig'i — kelajak avlodlar sog'lig'ining kafolati.\"",
    image: catGynecology,
    article: {
      id: "gyn-1",
      title: "Ayol reproduktiv sog'lig'i: ginekologiyaning zamonaviy yutuqlari",
      slug: "ayol-reproduktiv-sogligi-ginekologiya",
      image: catGynecology,
      summary: "Ginekologik kasalliklar, erta tashxis va zamonaviy minimal invaziv jarrohlik usullari.",
      content: [
        "Ginekologiya — ayollar reproduktiv tizimi sog'lig'i bilan shug'ullanadigan tibbiyot sohasi. Muntazam ginekologik tekshiruv ayollar sog'lig'ining asosi hisoblanadi.",
        "Bachadon miomasi — reproduktiv yoshdagi ayollarning 70-80% da uchraydi. Ko'pchiligi simptomsiz. Og'ir qon ketishi, og'riq yoki bepushtlik bo'lganda davolanish zarur. Miomektomiya, UAE (bachadon arteriyasi embolizatsiyasi) va fokusli ultratovush — zamonaviy usullar.",
        "Endometrioz — bachadon ichki qavati to'qimasining boshqa joylarda o'sishi. Ayollarning 10% da uchraydi. Surunkali tos og'rig'i va bepushtlik asosiy alomatlari. Laparoskopik jarrohlik va gormon terapiyasi (GnRH agonistlari) qo'llaniladi.",
        "Tuxumdon polikistoz sindromi (PCOS) — reproduktiv yoshdagi ayollarning 8-13% da. Noto'g'ri ovulyatsiya, giperandrogenizm va polikistoz tuxumdonlar xos. Turmush tarzini o'zgartirish, metformin va klomifen davolashning asosi.",
        "Bachadon bo'yni saratoni skrinigi: PAP-test va HPV-test birgalikda eng yuqori sezuvchanlikni beradi. 21 yoshdan boshlab har 3 yilda PAP-test, 30 yoshdan keyin har 5 yilda HPV ko-test tavsiya etiladi.",
        "Laparoskopik va robotik jarrohlik: minimal invaziv yondashuvlar og'riqni kamaytiradi, tiklanishni tezlashtiradi va estetik natija beradi. Da Vinci roboti murakkab ginekologik operatsiyalarda keng qo'llanilmoqda.",
        "Profilaktika: yiliga 1 marta ginekologik ko'rik, HPV vaksinatsiyasi, sog'lom vazn saqlash va stress boshqarish."
      ],
      author: "Dr. Maftuna Aliyeva, ginekolog",
      date: "2024-04-20"
    }
  },
  {
    id: "endokrinologiya",
    title: "Endokrinologiya",
    quote: "\"Gormonlar — organizmning ko'rinmas diryjori.\"",
    image: catEndocrinology,
    article: {
      id: "endo-1",
      title: "Endokrin tizim kasalliklari: diabetdan qalqonsimon bez kasalliklariga",
      slug: "endokrin-tizim-kasalliklari-diabet-qalqonsimon",
      image: catEndocrinology,
      summary: "Qandli diabet, qalqonsimon bez kasalliklari va gormon buzilishlarining zamonaviy davolash usullari.",
      content: [
        "Endokrin tizim gormonlar ishlab chiqaruvchi bezlardan iborat bo'lib, organizmning barcha funksiyalarini boshqaradi. Endokrin kasalliklar dunyo aholisining 10-15% da uchraydi.",
        "2-tip qandli diabet — eng ko'p tarqalgan endokrin kasallik. Insulin rezistentligi va beta-hujayralar funktsiyasining pasayishi asosiy mexanizm. Metformin birinchi qator dori. SGLT2 ingibitorlari va GLP-1 agonistlari (semaglutid) yurak va buyrak himoyasini ta'minlaydi.",
        "1-tip qandli diabet — autoimmun kasallik, ko'pincha bolalarda boshlanadi. Insulin terapiyasi hayot uchun zarur. Doimiy glukoza monitoring tizimlari (CGM) va insulin pompalari diabet boshqaruvini inqilob qildi. Sun'iy pankreas tizimlari ishlab chiqilmoqda.",
        "Qalqonsimon bez kasalliklari: gipotireoz (Xashimoto tireoiditi) va gipertireoz (Greyvs kasalligi). Ayollarda 5-8 marta ko'p uchraydi. Levotiroksin gipotireozda, tionamidlar yoki radioaktiv yod gipertireozda qo'llaniladi.",
        "Osteoporoz — suyak zichligi kamayishi. Menopozdan keyingi ayollarning 30% da uchraydi. DEXA skanerlash diagnostikaning oltin standarti. Bisfosfonatlar, denosumab va teriparatid davolashda qo'llaniladi.",
        "Buyrak usti bezi kasalliklari: Kushing sindromi (kortizol ortiqcha), Addison kasalligi (kortizol yetishmovchiligi) va feoxromasitoma. Noyob, ammo hayotga xavfli bo'lishi mumkin.",
        "Profilaktika: sog'lom vazn saqlash (diabet riski 58% kamayadi), yod yetarli ovqatlanish, vitamin D va kaltsiy, muntazam jismoniy faollik va yillik qon tekshiruvi."
      ],
      author: "Dr. Dildora Ergasheva, endokrinolog",
      date: "2024-03-15"
    }
  },
  {
    id: "gastroenterologiya",
    title: "Gastroenterologiya",
    quote: "\"Sog'lom hazm — sog'lom hayotning asosi.\"",
    image: catGastro,
    article: {
      id: "gastro-1",
      title: "Hazm tizimi kasalliklari: zamonaviy gastroenterologiya yutuqlari",
      slug: "hazm-tizimi-kasalliklari-gastroenterologiya",
      image: catGastro,
      summary: "Oshqozon-ichak trakti kasalliklari, endoskopik diagnostika va zamonaviy davolash usullari.",
      content: [
        "Gastroenterologiya — hazm tizimi kasalliklarini o'rganadigan sohа. Dunyo aholisining 40% funksional hazm buzilishlaridan aziyat chekadi.",
        "Gastroezofageal reflyuks kasalligi (GERD) — kattalarning 20% da uchraydi. Oshqozon kislotasining qizilo'ngachga qaytishi. Proton pompa ingibitorlari (omeprazol, esomeprazol) asosiy davolash. LINX magnit halqa — yangi jarrohlik usuli.",
        "Helicobacter pylori — dunyo aholisining yarmida mavjud. Oshqozon yarasi va oshqozon saratonining asosiy sababi. Uch komponentli terapiya (PPI + klaritromitsin + amoksitsillin) 14 kun davomida qo'llaniladi.",
        "Yallig'lanishli ichak kasalliklari (YIK): Kron kasalligi va yarali kolit. Autoimmun xarakterga ega. Biologik preparatlar (infliksimab, vedolizumab, ustekinumab) remissiyani ta'minlaydi. Fekal mikrobiota transplantatsiyasi yangi yo'nalish.",
        "Jigar kasalliklari: gepatit B va C (virusli), alkogol jigar kasalligi va nospirtli yog'li jigar kasalligi (NAFLD). NAFLD — eng tez o'sib borayotgan jigar kasalligi. Gepatit C hozir 95% hollarda 8-12 haftalik dori bilan butunlay davolanadi (sofosbuvir/velpatasvir).",
        "Kolorektal saraton skrinigi: 45 yoshdan boshlab kolonoskopiya har 10 yilda tavsiya etiladi. Poliplar topilsa — tezroq qayta tekshiruv. Fekal immunokimyoviy test (FIT) yillik noninvaziv alternativa.",
        "Profilaktika: tolali ovqatlanish (25-30 g/kun), probiotiklar, yetarli suv ichish, spirtli ichimlikni cheklash va jismoniy faollik."
      ],
      author: "Dr. Anvar Saidov, gastroenterolog",
      date: "2024-02-10"
    }
  },
  {
    id: "onkologiya",
    title: "Onkologiya",
    quote: "\"Saraton — hukm emas, erta tashxis — hayot uchun imkoniyat.\"",
    image: catOncology,
    article: {
      id: "onco-1",
      title: "Onkologiya: erta tashxisdan immunoterapiyaga qadar",
      slug: "onkologiya-erta-tashxis-immunoterapiya",
      image: catOncology,
      summary: "Saraton kasalligining zamonaviy diagnostika va davolash usullari, immunoterapiya va maqsadli terapiya.",
      content: [
        "Saraton — dunyoda o'limning ikkinchi asosiy sababi (yiliga 10 million). Ammo zamonaviy tibbiyot saraton davolashda ulkan yutuqlarga erishmoqda — 5 yillik yashash ko'rsatkichi 70% dan oshdi.",
        "Erta tashxis inqilobi: suyuq biopsiya (liquid biopsy) — qon orqali saraton DNK sini aniqlash. Galleri testi 50 dan ortiq saraton turini erta bosqichda aniqlashi mumkin. AI-asoslangan mammografiya radiologlardan 11% aniqroq natija bermoqda.",
        "Immunoterapiya — saratonga qarshi davolashning yangi ustuni. Checkpoint ingibitorlari (pembrolizumab, nivolumab) T-limfotsitlarga saratonga hujum qilish imkonini beradi. Melanoma, o'pka saratoni va buyrak saratoni davolashida inqilobiy natijalar.",
        "CAR-T hujayra terapiyasi — bemorning o'z T-limfositlarini genetik modifikatsiya qilib saratonga yo'naltiriladi. Ba'zi qon saratonlarida 90% dan yuqori remissiya. Kelajakda qattiq o'smalar uchun ham ishlab chiqilmoqda.",
        "Maqsadli terapiya: saraton hujayralarining aniq molekulyar nishonlarini blokirovka qiladi. EGFR, ALK, BRAF, HER2 ingibitorlari — har bir saraton uchun shaxsiylashtirilgan davolash rejasi tuziladi.",
        "Proton terapiyasi va boshqa zamonaviy nurlanish usullari: aniq nishonlash, kam yon ta'sir. Bolalar onkologiyasida ayniqsa muhim, chunki sog'lom to'qimalarga zarar kamroq.",
        "Profilaktika: chekmaslik (saratonlarning 30% bilan bog'liq), sog'lom vazn, jismoniy faollik, quyoshdan himoya, vaksinatsiya (HPV, gepatit B) va muntazam skrining dasturlariga qatnashish."
      ],
      author: "Dr. Rustam Kamolov, onkolog",
      date: "2024-01-25"
    }
  },
  {
    id: "parazitologiya",
    title: "Parazitologiya",
    quote: "\"Parazitar kasalliklardan himoyalanish — gigiyenadan boshlanadi.\"",
    image: catParasitology,
    article: {
      id: "paraz-1",
      title: "Parazitar kasalliklar: gijja infektsiyalaridan protozoy kasalliklariga",
      slug: "parazitar-kasalliklar-gijja-protozoy",
      image: catParasitology,
      summary: "Parazitar kasalliklarning turlari, diagnostikasi va zamonaviy davolash protokollari.",
      content: [
        "Parazitar kasalliklar dunyo aholisining 25% dan ortiqda uchraydi. Gijja infektsiyalari (gelmintozlar) va protozoy kasalliklari (lyamblioz, amyobiaz) eng ko'p tarqalgan turlari.",
        "Askaridoz — eng keng tarqalgan gijja infektsiyasi (1 milliard+ kishi). Tuproq orqali yuqadi. Ichak tutilishi va o'pka alomatlari yuzaga kelishi mumkin. Albendazol yoki mebendazol bilan davolanadi.",
        "Enterobioz (osteritsalar) — bolalarda eng ko'p. Perianal qichishish asosiy alomat. Oila a'zolarini birgalikda davolash zarur. Mebendazol 2 hafta oralatib 2 marta qabul qilinadi.",
        "Lyamblioz — Giardia lamblia chaqiradi. Iflos suv orqali yuqadi. Diareya, qorin og'rig'i va vaznning kamayishi xos. Metronidazol yoki tinidazol bilan davolanadi.",
        "Toksoplazmoz — mushuklar asosiy manba. Homiladorlik davrida o'ta xavfli (tugma nuqsonlar). Serologik tekshiruv homiladorlik oldidan tavsiya etiladi. Spiramisin va pirimetamin + sulfadiazin davolashda ishlatiladi.",
        "Zamonaviy diagnostika: ELISA va IFA serologik testlari, PCR, najasning mikroskopik tekshiruvi va immunoxromatografik tezkor testlar. Multiplex PCR bir seansdа bir nechta parazitni aniqlashi mumkin.",
        "Profilaktika: qo'lni tez-tez yuvish, meva-sabzavotni yaxshilab yuvish, suvni qaynаtish, go'shtni to'liq pishirish va uy hayvonlarini degelmintizatsiya qilish."
      ],
      author: "Dr. Shahlo Tursunova, parazitolog",
      date: "2023-12-08"
    }
  },
  {
    id: "ortopediya",
    title: "Ortopediya",
    quote: "\"Sog'lom suyak va bo'g'imlar — faol hayotning kaliti.\"",
    image: catOrthopedics,
    article: {
      id: "ortho-1",
      title: "Ortopedik kasalliklar: skoliozdan endoprotezirovkaga qadar",
      slug: "ortopedik-kasalliklar-skolioz-endoprotezirovka",
      image: catOrthopedics,
      summary: "Suyak-mushak tizimi kasalliklari va zamonaviy ortopedik jarrohlik yutuqlari.",
      content: [
        "Ortopediya — suyak-mushak tizimi kasalliklari va jarohаtlarini davolaydigan sohа. Dunyo aholisining 1.71 milliardi mushak-skelet kasalliklaridan aziyat chekadi (JSST, 2024).",
        "Osteoartroz — eng ko'p uchraydigan bo'g'im kasalligi, 60 yoshdan oshgan odamlarning 50% da uchraydi. Tog'ay emirilishi asosiy mexanizm. Konservativ davolash: NSAIDlar, fizioterapiya, gialuron kislota in'ektsiyalari. Og'ir hollarda endoprotezirovka.",
        "Umurtqa pog'onasi kasalliklari: disk churrasi (herniya), skolioz va spinal stenoz. Bel og'rig'i — dunyo bo'ylab nogironlikning birinchi sababi. 90% holatlarda konservativ davolash samarali. Minimal invaziv umurtqa jarrohlik texnologiyalari rivojlanmoqda.",
        "Endoprotezirovka: tizza va son-chanoq bo'g'imi almаshtirish — ortopediyaning eng muvaffaqiyatli operatsiyalari. Zamonaviy implantlar 20-30 yil xizmat qiladi. Robotik jarrohlik (MAKO) aniqlikni oshirdi.",
        "Sport jarohatları: old chоkkali bоylamning (ACL) yirtilishi, menisk shikastlanishi, yelka chiqishi. Artroskopik jarrohlik — minimal invaziv usul bilan tiklanish tezlashadi. PRP (trombositga boy plazma) terapiyasi tiklanishni tezlashtiradi.",
        "Bolalar ortopediyasi: tekis oyoqlik, ichki burilgan oyoq va Legg-Kalve-Pertes kasalligi. Ko'pchiligi o'sish jarayonida o'z-o'zidan tuzaladi. Erta aniqlash va kuzatish muhim.",
        "Profilaktika: muntazam jismoniy mashqlar, sog'lom vazn saqlash, kaltsiy va vitamin D yetarli iste'mol, ergonomik mebel va to'g'ri ko'tarish texnikasi."
      ],
      author: "Dr. Nodir Xolmatov, ortoped-travmatolog",
      date: "2023-11-15"
    }
  },
  {
    id: "mammologiya",
    title: "Mammologiya",
    quote: "\"Ko'krak sog'lig'i — ayolning o'ziga ishonchi va hayot sifati.\"",
    image: catMammology,
    article: {
      id: "mamm-1",
      title: "Ko'krak bezi kasalliklari: erta tashxis va zamonaviy davolash",
      slug: "kokrak-bezi-kasalliklari-erta-tashxis",
      image: catMammology,
      summary: "Mastоpatiya, ko'krak bezi saratoni va zamonaviy skrining usullari haqida ilmiy maqola.",
      content: [
        "Mammologiya — ko'krak bezi kasalliklarini o'rganadigan tibbiyot sohasi. Ko'krak bezi saratoni — ayollarda eng ko'p uchraydigan saraton turi (yangi holatlarning 25%).",
        "Fibrokistoz mastopatiya — reproduktiv yoshdagi ayollarning 60-80% da uchraydi. Ko'krak og'rig'i va tugunlar asosiy alomatlari. Aksariyat hollarda xavfsiz, ammo kuzatish zarur.",
        "Ko'krak bezi saratoni risk omillari: oilaviy anamnez (BRCA1/BRCA2 mutatsiyalari), erta hayz, kech menopauza, bepushtlik, gormon almashtirish terapiyasi va spirtli ichimliklar.",
        "Skrining: mammografiya 40 yoshdan boshlab har 1-2 yilda tavsiya etiladi. 3D tomosintez aniqlikni 40% oshirdi. Yuqori riskli ayollarda MRI qo'shimcha tekshiruv sifatida qo'llaniladi. O'z-o'zini tekshirish oyiga 1 marta.",
        "Zamonaviy davolash: organ saqlovchi jarrohlik + nurlanish terapiyasi ko'p hollarda mastektomiyaga alternativa. Neoadyuvant kimyoterapiya o'smalni operatsiya oldidan kichraytiradi. HER2+ saraton uchun trastuzumab inqilobiy natija berdi.",
        "Rekonstruktiv jarrohlik: mastektomiyadan keyin ko'krak bezini tiklash — autolog to'qima yoki implantlar yordamida. Psixologik tiklanish uchun muhim.",
        "Profilaktika: sog'lom vazn saqlash, jismoniy faollik (haftada 150 daqiqa), spirtni cheklash, emizish (risk kamayadi) va muntazam skrining."
      ],
      author: "Dr. Zulfiya Abdullayeva, mammolog-onkolog",
      date: "2023-10-20"
    }
  },
  {
    id: "revmatologiya",
    title: "Revmatologiya",
    quote: "\"Bo'g'imlar og'rig'i — tananing yashirin signali.\"",
    image: catRheumatology,
    article: {
      id: "revma-1",
      title: "Revmatik kasalliklar: autoimmun yallig'lanishlarning zamonaviy davolash usullari",
      slug: "revmatik-kasalliklar-autoimmun-davolash",
      image: catRheumatology,
      summary: "Revmatoid artrit, tizimli qizil yuguruk va boshqa autoimmun kasalliklarning zamonaviy terapiyasi.",
      content: [
        "Revmatologiya — bo'g'imlar, biriktiruvchi to'qima va autoimmun kasalliklarni davolaydigan sohа. 200 dan ortiq revmatik kasallik mavjud bo'lib, dunyo aholisining 5% ini qamrab oladi.",
        "Revmatoid artrit (RA) — surunkali autoimmun bo'g'im kasalligi. Sinovial qavatning yallig'lanishi bo'g'imlar emirilishiga olib keladi. Erta davolash (dastlabki 3 oy) — eng muhim. Metotreksat birinchi qator DMARD. Biologik preparatlar (adalimumab, totsalizumab) samarali nazoratni ta'minlaydi.",
        "Tizimli qizil yuguruk (SLE) — ko'p organli autoimmun kasallik, asosan yosh ayollarda. Teri toshmalari, bo'g'im og'rig'i, buyrak shikastlanishi xos. Gidroksixlorokin barcha SLE bemorlari uchun tavsiya etiladi. Belimumab — birinchi SLE uchun tasdiqlangan biologik preparat.",
        "Podagra — qon kislotasi kristallarining bo'g'imlarda to'planishi. Erkaklarda ko'proq, ayniqsa bosh barmoq bo'g'imida. O'tkir xurujda kolxitsin yoki NSAIDlar, uzoq muddatda allopurinol yoki febuksostat qo'llaniladi.",
        "Ankilozlovchi spondilit — umurtqa pog'onasi bo'g'imlarining surunkali yallig'lanishi. HLA-B27 genetik marker bilan bog'liq. TNF-alfa ingibitorlari va IL-17 blokatorlari (sekukinumab) yaxshi natija beradi.",
        "Fibromiyalgiya — keng tarqalgan mushak og'rig'i, charchoq va uyqu buzilishi. Organik shikastlanish yo'q. Duloksetin, pregabalin va kognitiv-xulq terapiyasi birgalikda eng samarali.",
        "Profilaktika va boshqarish: sog'lom vazn, past ta'sirli jismoniy mashqlar, omega-3, stressni boshqarish va shifokor bilan doimiy aloqa."
      ],
      author: "Dr. Malika Jurayeva, revmatolog",
      date: "2023-09-12"
    }
  },
  {
    id: "gematologiya",
    title: "Qon kasalliklari",
    quote: "\"Qon — hayotning suyuq organi.\"",
    image: catHematology,
    article: {
      id: "hema-1",
      title: "Gematologik kasalliklar: kamqonlikdan leykozga qadar",
      slug: "gematologik-kasalliklar-kamqonlik-leykoz",
      image: catHematology,
      summary: "Qon kasalliklari turlari, diagnostikasi va zamonaviy gematologik davolash usullari.",
      content: [
        "Gematologiya — qon va qon yaratuvchi organlar kasalliklarini o'rganadi. Qon kasalliklari xavfli va ko'pincha uzoq davolanishni talab qiladi.",
        "Temir tanqisli kamqonlik — eng keng tarqalgan qon kasalligi, dunyo aholisining 25% da. Charchoq, rangpar bo'lish, bosh aylanishi xos. Temir preparatlari (sulfat, glyukonat) va sabab davolash zarur. Iv temir infuziyasi og'ir hollarda tezkor natija beradi.",
        "B12 vitamini va folat tanqisligi kamqonligi — megaloblast kamqonlik. Vegetarianlarda va oshqozon operatsiyasi bo'lganlarda ko'p uchraydi. B12 in'ektsiyalari yoki yuqori dozali oral B12 bilan davolanadi.",
        "Leykoz (qon saratoni) — qon yaratuvchi hujayralarning xavfli o'sishi. O'tkir limfoblast leykoz (ALL) bolalarda eng ko'p — 90% remissiya. O'tkir miyeloid leykoz (AML) kattalarning og'ir leykozi. Kimyoterapiya, maqsadli terapiya va suyak iligi transplantatsiyasi qo'llaniladi.",
        "Limfomalar: Xojkin va noxojkin limfomalari. Xojkin limfomasi — eng yaxshi davolanadigan saratonlardan biri (80%+ tuzalish). ABVD kimyoterapiya va nurlanish standart davolash.",
        "Gemofilia — irsiy qon ketishi kasalligi, qon ivish omillari yetishmovchiligi. Profilaktik omil infuziyalari hayot sifatini yaxshilaydi. Emitsizumab — omil VIII ingibitorli gemofiliya A uchun yangi dori.",
        "Profilaktika: temir va vitaminlarga boy ovqatlanish, muntazam qon tekshiruvi, oilaviy anamnezni bilish va shifokorga o'z vaqtida murojaat qilish."
      ],
      author: "Dr. Odil Toshpulatov, gematolog",
      date: "2023-08-05"
    }
  },
  {
    id: "pulmonologiya",
    title: "Pulmonologiya",
    quote: "\"Nafas — hayotning birinchi va oxirgi harakati.\"",
    image: catPulmonology,
    article: {
      id: "pulm-1",
      title: "O'pka kasalliklari: surunkali obstruktiv kasallikdan o'pka saratoniga",
      slug: "opka-kasalliklari-sobk-saraton",
      image: catPulmonology,
      summary: "Nafas tizimi kasalliklari, diagnostikasi va zamonaviy pulmonologik yondashuvlar.",
      content: [
        "Pulmonologiya — o'pka va nafas yo'llari kasalliklarini o'rganadi. Surunkali nafas kasalliklari dunyo bo'ylab o'limning uchinchi sababi.",
        "SOBK (surunkali obstruktiv bronxit kasalligi) — 380 million kishini qamrab oladi. Chekish asosiy sabab (85-90%). Bronxodilatatorlar (tiotropiy, salmeterol) va ingalyatsion kortikosteroidlar asosiy davolash. Chekishni to'xtatish — eng samarali chora.",
        "Bronxial astma — nafas yo'llarining surunkali yallig'lanish kasalligi. 340 million kishi astma bilan yashaydi. Biologik preparatlar (omalizumab, mepolizumab, benralizumab) og'ir astmada inqilob yasadi.",
        "Pnevmoniya — dunyo bo'ylab 5 yoshgacha bolalar o'limining yetakchi infektsion sababi. Bakterial pnevmoniyada antibiotiklar, virusli pnevmoniyada simptomatik davolash. COVID-19 pnevmoniyasi yangi davolash protokollarini shakllantirdi.",
        "O'pka saratoni — saratondan o'limning birinchi sababi (yiliga 1.8 million). Chekish bilan 90% bog'liq. Past dozali kompyuter tomografiyasi (LDCT) erta skrining uchun tavsiya etiladi. Immunoterapiya va maqsadli terapiya yashash muddatini sezilarli uzaytirdi.",
        "O'pka emboliyasi — o'pka arteriyasining tromb bilan berkitilishi. Chuqur vena trombozidan kelib chiqadi. Antikoagulyantlar (rivaroksaban, apiksaban) davolash va profilaktikada qo'llaniladi.",
        "Profilaktika: chekmaslik, havo sifatini nazorat qilish, pnevmokokk va gripp vaksinatsiyasi, muntazam jismoniy mashqlar va nafas gymnastikas."
      ],
      author: "Dr. Sherzod Qodirov, pulmonolog",
      date: "2023-07-18"
    }
  },
  {
    id: "pediatriya",
    title: "Pediatriya",
    quote: "\"Bolalar sog'lig'i — millatning eng qimmatli boyligi.\"",
    image: catPediatrics,
    article: {
      id: "ped-1",
      title: "Bolalar sog'lig'i: vaksinatsiyadan bolalar ovqatlanishiga",
      slug: "bolalar-sogligi-vaksinatsiya-ovqatlanish",
      image: catPediatrics,
      summary: "Pediatriyaning asosiy yo'nalishlari, bolalar kasalliklari va zamonaviy profilaktika usullari.",
      content: [
        "Pediatriya — bolalar va o'smirlar sog'lig'ini o'rganadigan tibbiyot sohasi. Bolalar kattalardan farqli ravishda kasallanadi va davolanadi — dozalar, dori shakllari va yondashuvlar boshqacha.",
        "Vaksinatsiya jadvali — bolalar sog'lig'ining asosi. O'zbekiston milliy vaksinatsiya jadvali 12 kasallikdan himoyalaydi: sil, gepatit B, poliomiyelit, qoq yo'tal, difteriya, qoqshol, qizamiq, qizilcha, parotit va boshqalar.",
        "Bolalar ovqatlanishi: dastlabki 6 oy faqat ona suti. 6 oydan — qo'shimcha ozuqa bosqichma-bosqich kiritiladi. 2 yoshgacha bolalar uchun temir, sink, vitamin A va D yetarli bo'lishi muhim.",
        "Bolalar infektsiyalari: ORVI (yiliga 6-8 marta normal), bronxiolit (RSV), otit, gastroenterit. Aksariyat virusli — antibiotik kerak emas. Dehidratsiyani oldini olish eng muhim chora.",
        "Bolalar allergiyalari: ovqat allergiyasi, atopik dermatit va bronxial astma. Erta diversifikatsiya (6 oydan allergen ovqatlar kiritish) allergiya riskini kamaytirishi isbotlangan.",
        "Bolalar rivojlanishi: motor, nutq va ijtimoiy-emotsional rivojlanish bosqichlari. Rivojlanish kechikishi erta aniqlansa — erta aralashuv natijasi yaxshiroq. Autizm spektri 1:36 bolada uchraydi.",
        "Profilaktika: vaksinatsiya jadvaliga rioya, ko'krak suti bilan emizish, sog'lom ovqatlanish, jismoniy faollik, yetarli uyqu va muntazam pediatr ko'rigi."
      ],
      author: "Dr. Gulnora Yusupova, pediatr",
      date: "2023-06-22"
    }
  },
  {
    id: "virusologiya",
    title: "Virusologiya",
    quote: "\"Viruslar — tabiatning eng kichik, ammo eng kuchli kuchi.\"",
    image: catVirology,
    article: {
      id: "virus-1",
      title: "Virusologiya: COVID-19 dan kelajak pandemiyalariga tayyorgarlik",
      slug: "virusologiya-covid-kelajak-pandemiyalar",
      image: catVirology,
      summary: "Virusli kasalliklar, antiviral terapiya va pandemik tayyorgarlik haqida ilmiy maqola.",
      content: [
        "Virusologiya — viruslar va ular chaqiradigan kasalliklarni o'rganadi. COVID-19 pandemiyasi virusologiya faniga bo'lgan e'tiborni keskin oshirdi.",
        "SARS-CoV-2 va COVID-19: 770 million+ tasdiqlangan holat, 7 million+ o'lim. mRNA vaksinalar 10 oy ichida yaratildi — vaksinologiya tarixida rekord. Paxlovid (nirmatrelivir/ritonavir) — samarali antiviral dori.",
        "Gripp viruslari: mavsumiy gripp yiliga 290,000-650,000 o'limga sabab. H5N1 qush grippi pandemik potentsialga ega. Yillik gripp vaksinatsiyasi risk guruhlari uchun muhim.",
        "Gepatit viruslari: A (oral-fekal), B va C (qon orqali), D va E. Gepatit B — vaksinatsiya bilan oldini olish mumkin. Gepatit C — 95% to'liq davolanadi. Gepatit B funksional davolash uchun tadqiqotlar davom etmoqda.",
        "Gerpes viruslari oilasi: HSV-1/2 (labial/genital gerpes), VZV (suv chechak/gerpes zoster), EBV (mononukleoz), CMV. Dunyo aholisining 67% HSV-1 tashuvchisi. Asiklovir va valasiklovir asosiy antiviral dorilar.",
        "Yangi virusli tahdidlar: Mpox, Nipah, Marburg virusi va noma'lum zoonoz viruslar. One Health yondashuvi — inson, hayvon va atrof-muhit sog'lig'ini birgalikda ko'rib chiqish pandemiyalarga tayyorgarlikning asosi.",
        "Profilaktika: vaksinatsiya, qo'l gigienasi, xavfsiz jinsiy aloqa, qon bilan aloqada ehtiyotkorlik va sog'lom turmush tarzi immunitetni mustahkamlaydi."
      ],
      author: "Dr. Alisher Qoraboyev, virusolog",
      date: "2023-05-10"
    }
  },
  {
    id: "onkoginekologiya",
    title: "Onkoginekologiya",
    quote: "\"Ayollar saratonini erta aniqlash — hayot saqlovchi qadam.\"",
    image: artOncogynecology,
    article: {
      id: "oncogyn-1",
      title: "Onkoginekologiya: ayollar reproduktiv organlarining saraton kasalliklari",
      slug: "onkoginekologiya-ayollar-saraton",
      image: artOncogynecology,
      summary: "Bachadon bo'yni, tuxumdon va bachadon tanasi saratoni haqida zamonaviy tashxis va davolash.",
      content: [
        "Onkoginekologiya — ayollar reproduktiv organlarining saraton kasalliklarini o'rganadi. Bachadon bo'yni, tuxumdon va endometriy saratoni eng ko'p uchraydigan turlari.",
        "Bachadon bo'yni saratoni — dunyo bo'ylab ayollar saratonining to'rtinchi ko'p uchraydigan turi. HPV infektsiyasi 99% hollarda sabab. JSST 2030-yilga kelib yo'q qilish strategiyasi: 90% vaksinatsiya, 70% skrining, 90% davolash.",
        "Tuxumdon saratoni — eng o'ldiruvchi ginekologik saraton. Erta alomatlari noaniq (qorin shishishi, ishtaha yo'qolishi). BRCA1/2 mutatsiya tashuvchilarda risk 40-60%. Profilaktik salpingooforektomiya risk guruhlarida ko'rib chiqiladi.",
        "Endometriy saratoni — rivojlangan mamlakatlarda eng ko'p uchraydigan ginekologik saraton. Semizlik, diabet va gormon buzilishlari risk omillari. Aksariyat hollarda erta bosqichda aniqlanadi — 5 yillik yashash 80%+.",
        "Zamonaviy davolash: robotik jarrohlik (Da Vinci), maqsadli terapiya (bevatsizumab, olaparib — PARP ingibitorlari) va immunoterapiya (pembrolizumab — MSI-H o'smalar uchun).",
        "Fertilitetni saqlash: yosh bemorlarda tuxum hujayra yoki embrionni muzlatish kimyoterapiya oldidan tavsiya etiladi. Ba'zi erta bosqich endometriy saratoni konservativ davolanishi mumkin.",
        "Profilaktika: HPV vaksinatsiyasi, muntazam PAP-test va HPV skrining, sog'lom vazn saqlash, oilaviy anamnezni bilish va genetik konsultatsiya."
      ],
      author: "Dr. Dilorom Toshmatova, onkoginekolog",
      date: "2023-04-15"
    }
  },
  {
    id: "travmatologiya",
    title: "Travmatologiya",
    quote: "\"Birinchi yordamni bilish — hayot saqlab qolish san'ati.\"",
    image: catTraumatology,
    article: {
      id: "trav-1",
      title: "Travmatologiya: shikastlanishlardan tiklanish va zamonaviy jarrohlik usullari",
      slug: "travmatologiya-shikastlanish-tiklanish",
      image: catTraumatology,
      summary: "Suyak sinishi, bo'g'im shikastlanishi va zamonaviy travmatologik yondashuvlar.",
      content: [
        "Travmatologiya — mexanik shikastlanishlar va ularning oqibatlarini davolaydigan sohа. Jarohatlar dunyo bo'ylab o'limning uchinchi sababi, ayniqsa yosh odamlar orasida.",
        "Suyak sinishi davolashi: konservativ (gips, shina) va jarrohlik (metall plastinka, ilizarov apparati). Zamonaviy biorezorbirlаnadigan implantlar ikkinchi operatsiyaga ehtiyojni yo'q qiladi.",
        "ACL (oldingi chokka bog'i) yirtilishi — sportchilar orasida eng ko'p. Artroskopik rekonstruksiya oltin standart. Reabilitatsiya 6-9 oy davom etadi. Qayta jarohat profilaktikasi uchun neyromushak mashqlari muhim.",
        "Politravma — bir nechta organ va tizimning bir vaqtda shikastlanishi. Damage Control Surgery — hayotni saqlab qolish uchun dastlabki minimal jarrohlik, keyin bosqichma-bosqich davolash.",
        "3D bosib chiqarish texnologiyasi: murakkab suyak sinishlarida individual implantlar va jarrohlik rejasini modellashtirish. Bioprinting — kelajakda suyak to'qimasini laboratoriyada yetishtiish imkoniyati.",
        "Reabilitatsiya: fizioterapiya, massaj, suv ichida mashqlar, elektrostimulatsiya va robot-yordamchi terapiya. Erta mobilizatsiya va faol reabilitatsiya yakuniy natijani sezilarli yaxshilaydi.",
        "Profilaktika: xavfsizlik kamari taqish, sport paytida himoya vositalari, uy xavfsizligi (ayniqsa keksalar uchun) va jarohatning birinchi yordam qoidalarini bilish."
      ],
      author: "Dr. Bekzod Ruziyev, travmatolog",
      date: "2023-03-20"
    }
  },
  {
    id: "stomatologiya",
    title: "Stomatologiya",
    quote: "\"Sog'lom tabassumning sirri — muntazam parvarish va profilaktika.\"",
    image: catDental,
    article: {
      id: "stomat-1",
      title: "Stomatologiya: tish sog'lig'idan estetik stomatologiyaga",
      slug: "stomatologiya-tish-sogligi-estetik",
      image: catDental,
      summary: "Tish kasalliklari, implantologiya va zamonaviy stomatologik texnologiyalar.",
      content: [
        "Stomatologiya — og'iz bo'shlig'i, tish va jag' kasalliklarini davolaydi. Kariyes — dunyo bo'ylab eng ko'p tarqalgan surunkali kasallik, aholining 90% da uchraydi.",
        "Kariyes — tish emalining bakteriyalar tomonidan emirilishi. Streptococcus mutans asosiy sabab. Ftoridli pasta, muntazam tozalash (2 marta/kun) va professional gigiyena (6 oyda 1) eng samarali profilaktika.",
        "Parodontit — tish atrofi to'qimalarining yallig'lanishi. Kattalarning 50% da turli darajada uchraydi. Davolanmasa tish yo'qotilishiga olib keladi. Scaling va root planing, og'ir hollarda jarrohlik davolash qo'llaniladi.",
        "Dental implantlar — yo'qotilgan tishlarni almashtishning oltin standarti. Titan implantlar 95%+ muvaffaqiyat ko'rsatkichiga ega. Bir kunlik implantatsiya va all-on-4/6 konseptsiyalari tez tiklanishni ta'minlaydi.",
        "Estetik stomatologiya: vinirlar (porselen qoplamalar), tish oqartirish (lazer va uy tizimlari), invisalign (shaffof breketlar). Digital smile design — kompyuter yordamida mukammal tabassum loyihalash.",
        "Bolalar stomatologiyasi: sut tishlari sog'lig'i doimiy tishlar uchun muhim. Fissura germetizatsiyasi (1-2 yoshda), ftorlash va tish cho'tkasi bilan tanishtiirish 6 oylikdan boshlanadi.",
        "Profilaktika: tishlarni 2 marta tozalash, tish ipi ishlatish, shakar iste'molini cheklash, 6 oyda 1 stomatolog ko'rigi va ftoridli mahsulotlar."
      ],
      author: "Dr. Otabek Normatov, stomatolog",
      date: "2023-02-14"
    }
  },
  {
    id: "jarrohlik",
    title: "Jarrohlik",
    quote: "\"Jarroh qo'li bilan shifo beradi, ilm bilan yo'l ko'rsatadi.\"",
    image: catSurgery,
    article: {
      id: "jarr-1",
      title: "Zamonaviy jarrohlik: laparoskopiyadan robotik jarrohlikka",
      slug: "zamonaviy-jarrohlik-laparoskopiya-robotik",
      image: catSurgery,
      summary: "Jarrohlikning zamonaviy usullari, minimal invaziv texnologiyalar va anesteziya xavfsizligi.",
      content: [
        "Jarrohlik — tibbiyotning eng qadimiy va eng muhim sohalaridan biri. Zamonaviy jarrohlik minimal invaziv va aniq yondashuvlarga o'tmoqda.",
        "Laparoskopik jarrohlik — kichik teshiklar orqali operatsiya. O't pufagi, appendiks, charviq va ginekologik operatsiyalarda standart. Og'riq kam, tiklanish tez, iz qolmaydi.",
        "Robotik jarrohlik (Da Vinci tizimi) — jarrohning harakatlarini 7 erkinlik darajasida kuchaytirilgan aniqlik bilan bajaradi. Prostata, bachadon va yurak operatsiyalarida keng qo'llanilmoqda.",
        "NOTES (Natural Orifice Transluminal Endoscopic Surgery) — tabiiy teshiklar orqali jarrohlik. Hech qanday tashqi iz qoldirmaydi. Hali tadqiqot bosqichida, ammo kelajagi porloq.",
        "Anesteziya xavfsizligi: zamonaviy monitoring (BIS, kapnografiya, invaziv AD) va yangi anestetiklar (sugammadeks) anesteziya xavfsizligini misli ko'rilmagan darajada oshirdi. O'lim xavfi 1:200,000 dan kam.",
        "Tezkor jarrohlik (ambulatoriya jarrohlik): ko'p operatsiyalar endi bir kunda bajariladi va bemor uyiga qaytadi. Ingvinal churraq, varikotsele va kichik o'smalar shular jumlasidan.",
        "Profilaktika va tayyorgarlik: operatsiya oldidan chekishni to'xtatish (4 hafta), sog'lom ovqatlanish, jismoniy tayyorgarlik va psixologik tayyorgarlik tiklanishni tezlashtiradi."
      ],
      author: "Dr. Ulug'bek Fayzullayev, jarroh",
      date: "2023-01-10"
    }
  },
  {
    id: "oftalmologiya",
    title: "Oftalmologiya",
    quote: "\"Ko'z — dunyoni ko'rish oynasi, uni asrang.\"",
    image: catEye,
    article: {
      id: "oftal-1",
      title: "Ko'z kasalliklari: kataraktadan lazer korreksiyaga",
      slug: "koz-kasalliklari-katarakta-lazer",
      image: catEye,
      summary: "Ko'z kasalliklari, zamonaviy diagnostika va ko'rish tiklash operatsiyalari haqida maqola.",
      content: [
        "Oftalmologiya — ko'z va ko'rish kasalliklarini o'rganadi. Dunyo bo'ylab 2.2 milliard kishi ko'rish buzilishiga ega, ularning yarmida oldini olish yoki davolash mumkin edi.",
        "Katarakta — ko'z gavharining loyqalanishi. 50 yoshdan oshganlarda eng ko'p uchraydigan ko'rish yo'qotish sababi. Fakoemulsifikatsiya — zamonaviy 15-daqiqalik operatsiya. Premium IOL linzalar bir vaqtda yaqin va uzoqni ko'rish imkonini beradi.",
        "Glaukoma — ko'z ichi bosimining oshishi ko'rish nervini shikastlaydi. \"Yashirin ko'rlik\" deb ataladi, chunki erta alomatlari yo'q. Ko'z tomchilari, lazer trabekuloplastika va filtratsion jarrohlik qo'llaniladi.",
        "Ko'rish tuzatish: LASIK va SMILE lazer operatsiyalari miopiya, gipermetropiya va astigmatizmni tuzatadi. ICL (implantable contact lens) yuqori darajali miopiyada eng yaxshi variant.",
        "Diabetik retinopatiya — diabetning eng og'ir ko'z asorаti. Anti-VEGF in'ektsiyalari (ranibizumab, aflibersept) va lazer fotokoagulyatsiya ko'rishni saqlaydi. Muntazam ko'z tekshiruvi diabetiklarda yiliga 1 marta majburiy.",
        "Quruq ko'z sindromi — kompyuter asrining kasalligi. Sun'iy ko'z yoshi, omega-3, 20-20-20 qoidasi (har 20 daqiqada, 20 soniya, 20 fut uzoqqa qarash) va punktal probkalar yordamida boshqariladi.",
        "Profilaktika: quyosh ko'zoynagi (UV himoya), kompyuter oldida tanaffus, sog'lom ovqatlanish (lutein, zeaksantin — sabzavot, tuxum), chekmaslik va yillik ko'z tekshiruvi."
      ],
      author: "Dr. Sarvinoz Xaydarova, oftalmolog",
      date: "2022-12-05"
    }
  },
  {
    id: "kardiologiya",
    title: "Yurak-qon tomir",
    quote: "\"Yurak — hayotning motori, uni sevgi va ilm bilan asrang.\"",
    image: catCardiology,
    article: {
      id: "card-1",
      title: "Yurak-qon tomir kasalliklari: gipertoniyadan stentirovkaga",
      slug: "yurak-qon-tomir-gipertoniya-stentirovka",
      image: catCardiology,
      summary: "Kardiologik kasalliklar, zamonaviy diagnostika va interventsion kardiologiya yutuqlari.",
      content: [
        "Yurak-qon tomir kasalliklari — dunyo bo'ylab o'limning birinchi sababi (yiliga 17.9 million). Gipertoniya, ishemik yurak kasalligi va yurak yetishmovchiligi eng ko'p uchraydi.",
        "Gipertoniya — kattalarning 30-40% da. \"Jimjit o'ldiruvchi\" — ko'pincha alomatsiz kechadi. 130/80 mmHg dan yuqori davolash boshlanadi. ACE ingibitorlari, ARBlar, kaltsiy kanal blokatorlari va diuretiklar asosiy dori guruhlari.",
        "Miokard infarkti — yurak mushaklariga qon bormasligi. FAST qoidasi: ko'krak og'rig'i, terlash, nafas qisilishi — darhol 103 ga qo'ng'iroq. Dastlabki 90 daqiqada PCI (perkutan koronar interventsiya) — oltin standart.",
        "Koronar stentirovka va shuntirovka: stentlar tor tomirlani kengaytiradi, dori chiqaruvchi stentlar qayta torayishni kamaytiradi. Ko'p tomir shikastlanishida koronar shuntirovka (CABG) ko'proq afzallik beradi.",
        "Yurak yetishmovchiligi — yurakning samarali qon haydash qobiliyatining pasayishi. ARNI (sakubitril/valsartan), SGLT2 ingibitorlari va beta-blokatorlar zamonaviy davolashning to'rt ustuni.",
        "Aritmiyalar: fibrillyatsiya, tahikardiya, bradikardiya. Kateter ablatsiya aritmiya manbasini yo'q qiladi. Peysmaker va ICD (implantatsiya qilinadigan kardiodefibrillyator) hayot saqlovchi qurilmalar.",
        "Profilaktika: kuniga 30 daqiqa tez yurish, tuzni cheklash (5 g/kun), yog'ni kamaytirish, chekmaslik, stressni boshqarish va muntazam qon bosimi nazorati."
      ],
      author: "Dr. Jamshid Ergashev, kardiolog",
      date: "2022-11-18"
    }
  },
  {
    id: "urologiya",
    title: "Urologiya",
    quote: "\"Siydik-tanosil tizimi sog'lig'i — butun organizm sog'lig'ining ko'zgusi.\"",
    image: catUrology,
    article: {
      id: "urol-1",
      title: "Urologik kasalliklar: buyrak toshidan prostat saratoniga",
      slug: "urologik-kasalliklar-buyrak-toshi-prostat",
      image: catUrology,
      summary: "Siydik-tanosil tizimi kasalliklari, zamonaviy diagnostika va minimal invaziv davolash.",
      content: [
        "Urologiya — siydik tizimi va erkak reproduktiv organlar kasalliklarini davolaydi. Buyrak toshi, siydik yo'llari infektsiyalari va prostat kasalliklari eng ko'p uchraydi.",
        "Buyrak toshi (urolitiaz) — aholining 10-15% da hayot davomida uchraydi. Kaltsiy oksalat toshlari eng ko'p (80%). ESWL (tashqi zarba to'lqinli litоtripsiya), ureteroskopiya va perkutan nefrolitotomiya zamonaviy davolash usullari.",
        "Siydik yo'llari infektsiyasi (SYI) — ayollarda erkaklarga nisbatan 30 marta ko'p. E.coli sabab (85%). Nitrofurantoin va fosfomitsin birinchi qator antibiotiklar. Qaytalanadigan SYI da profilaktik antibiotik yoki immunostimulant (Uro-Vaxom) qo'llaniladi.",
        "Prostat giperplaziyasi (BPH) — 60 yoshdan oshgan erkaklarning 50% da. Siydik qiyinlashishi, tez-tez siydik ajratish xos. Alfa-blokatorlar (tamsulosin) va 5-alfa reduktaza ingibitorlari (finasterid). Minimal invaziv usullar: UroLift, Aquablation, GreenLight lazer.",
        "Prostat saratoni — erkaklarda ikkinchi ko'p uchraydigan saraton. PSA skrining 50 yoshdan (oilaviy anamnez bo'lsa 45 yoshdan). Aktiv kuzatish past riskli saratonda, radikal prostatektomiya yoki nurlanish terapiyasi yuqori riskda.",
        "Buyrak saratoni — aksariyat tasodifan UZI yoki KT da aniqlanadi. Nefron saqlovchi jarrohlik kichik o'smalarda. Maqsadli terapiya (sunitinib, kabozantinib) va immunoterapiya metastatik kasallikda.",
        "Profilaktika: kuniga 2-3 litr suv ichish, tuz va oqsilni me'yorda iste'mol, jismoniy faollik va 45-50 yoshdan muntazam urologik ko'rik."
      ],
      author: "Dr. Baxtiyor Xoliqov, urolog",
      date: "2022-10-25"
    }
  },
  {
    id: "proktologiya",
    title: "Proktologiya",
    quote: "\"Nozik muammo — professional yechim talab qiladi.\"",
    image: catProctology,
    article: {
      id: "prokt-1",
      title: "Proktologik kasalliklar: gemorroyydan yo'g'on ichak saratoniga",
      slug: "proktologik-kasalliklar-gemorroy-saraton",
      image: catProctology,
      summary: "To'g'ri ichak kasalliklari, zamonaviy diagnostika va minimal invaziv davolash usullari.",
      content: [
        "Proktologiya — to'g'ri ichak va anal soha kasalliklarini davolaydi. Gemorroy, anal yoriq va to'g'ri ichak saratoni eng ko'p uchraydigan kasalliklar.",
        "Gemorroy — kattalarning 50% da 50 yoshgacha kamida bir marta uchraydi. Ichki va tashqi turlari. Konservativ davolash: tolali ovqat, venotoniklаr (diosmin), topikal kremlar. Jarrohlik: gemorroidektomiya, HAL-RAR, lazer koagulyatsiya.",
        "Anal yoriq — og'riq va qon ketish bilan kechadigan anal kanaldagi yara. Surunkali yoriqda nitroglitserin yoki diltiazem mazlari, botulotoksin in'ektsiyasi yoki jarrohlik (lateral sfinkterotomiya) qo'llaniladi.",
        "Pararektal absess va fistula — anal bezlar infektsiyasi. Absessni darhol ochish kerak. Fistula davolashi murakkab — LIFT, flap, biopluglar va lazer fistulotomiya (FiLaC) zamonaviy usullar.",
        "Kolorektal saraton — dunyo bo'ylab uchinchi ko'p uchraydigan saraton. 45 yoshdan kolonoskopiya skrining tavsiya etiladi. Erta bosqichlarda endoskopik polipektomiya. Ilg'or bosqichlarda jarrohlik + kimyoterapiya + maqsadli terapiya.",
        "Yallig'lanishli ichak kasalliklari proktologik aspekti: Kron kasalligida perianal fistulalar 30% bemorlarda uchraydi. Biologik preparatlar (infliksimab) yallig'lanishni nazorat qiladi.",
        "Profilaktika: tolali ovqatlanish (25-30 g/kun), yetarli suv ichish, uzoq o'tirmaslik, jismoniy faollik va dushda gigiyena."
      ],
      author: "Dr. Mirzo Rahmatullayev, proktolog",
      date: "2022-09-08"
    }
  },
  {
    id: "narkologiya",
    title: "Narkologiya",
    quote: "\"Qaramlikdan xalos bo'lish — eng katta g'alaba.\"",
    image: artNarcology,
    article: {
      id: "narko-1",
      title: "Narkologiya: qaramlik kasalligi va zamonaviy reabilitatsiya usullari",
      slug: "narkologiya-qaramlik-reabilitatsiya",
      image: artNarcology,
      summary: "Giyohvandlik, alkogolizm va boshqa qaramlik turlarining zamonaviy davolash va reabilitatsiya usullari.",
      content: [
        "Narkologiya — kimyoviy va xulq-atvor qaramliklarini o'rganadigan tibbiyot sohasi. Dunyo bo'ylab 35 million kishi giyohvandlikdan aziyat chekadi, 283 million kishi spirtli ichimliklarni suiiste'mol qiladi.",
        "Alkogolizm — eng keng tarqalgan qaramlik. Jigar tsirrozi, pankreatit, kardiomiopatiya va neyrodegeneratsiya oqibatlari. Detoksifikatsiya (benzodiazepinlar), naltrekson, akamprozat va disulfiram farmakoterapiyaning asosi.",
        "Opioid qaramlik — dunyo miqyosidagi epidemiya. Yiliga 100,000+ opioid ortiqcha dozasidan o'lim. Metadon va buprenorfin bilan almashtirish terapiyasi (MAT) eng samarali davolash. Nalokson — ortiqcha dozada hayot saqlovchi dori.",
        "Tamaki qaramlik — yiliga 8 million o'limga sabab. Nikotin almashtirish terapiyasi (plastir, saqich), vareniklin va bupropion. E-sigaretalar — chekishdan voz kechishda biroz samarali, ammo xavfsizligi noaniq.",
        "Xulq-atvor qaramliklari: qimor o'yinlari, internet/ijtimoiy tarmoq qaramligi va ovqatlanish buzilishlari. Kognitiv-xulq terapiyasi (KXT) va motivatsion intervyu asosiy psixoterapevtik yondashuvlar.",
        "Reabilitatsiya bosqichlari: detoksifikatsiya → intensiv davolash → ambulatoriya dasturi → uzoq muddatli qo'llab-quvvatlash. 12 qadamlik dasturlar (AA, NA) va o'zaro yordam guruhlari remissiyani saqlashda muhim.",
        "Profilaktika: ta'lim va xabardorlik (ayniqsa yoshlar orasida), sog'lom stressni boshqarish ko'nikmalari, ijtimoiy qo'llab-quvvatlash va erta murojaat uchun stigmani kamaytirish."
      ],
      author: "Dr. Mansur Abdullaev, narkolog-psixiatr",
      date: "2022-08-12"
    }
  },
];

export const totalArticleCategories = articleCategories.length;

import { ophthalmologyArticles } from "./ophthalmologyArticles";

export function getCategoryArticleCount(categoryId: string): number {
  if (categoryId === "oftalmologiya") return ophthalmologyArticles.length;
  return 1;
}

export function findArticle(categoryId: string, slug: string): { category: ArticleCategory; article: Article } | null {
  const category = articleCategories.find((c) => c.id === categoryId);
  if (!category) return null;
  
  if (categoryId === "oftalmologiya") {
    const article = ophthalmologyArticles.find((a) => a.slug === slug);
    if (!article) return null;
    return { category, article };
  }
  
  if (category.article.slug !== slug) return null;
  return { category, article: category.article };
}
