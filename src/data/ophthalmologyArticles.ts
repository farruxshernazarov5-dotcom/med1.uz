import eyeCataract from "@/assets/eye-cataract.jpg";
import eyeGlaucoma from "@/assets/eye-glaucoma.jpg";
import eyeLasik from "@/assets/eye-lasik.jpg";
import eyePediatric from "@/assets/eye-pediatric.jpg";
import eyeRetina from "@/assets/eye-retina.jpg";
import eyeDryeye from "@/assets/eye-dryeye.jpg";
import eyeDiabetic from "@/assets/eye-diabetic.jpg";
import eyeTrauma from "@/assets/eye-trauma.jpg";
import eyeComputer from "@/assets/eye-computer.jpg";
import eyeOncology from "@/assets/eye-oncology.jpg";
import type { Article } from "./articles";

const author = "Shernazarov Farrukh Farkhadovich, oftalmolog";

export const ophthalmologyArticles: Article[] = [
  {
    id: "oftal-1",
    title: "Katarakta: zamonaviy fakoemulsifikatsiya va sun'iy gavhar implantatsiyasi",
    slug: "katarakta-fakoemulsifikatsiya-suniy-gavhar",
    image: eyeCataract,
    summary: "Katarakta kasalligining sabablari, diagnostikasi va zamonaviy jarrohlik usullari — fakoemulsifikatsiya va premium intraokulyar linzalar haqida batafsil maqola.",
    content: [
      "Katarakta — ko'z gavharining loyqalanishi natijasida ko'rish qobiliyatining asta-sekin pasayishi. Bu kasallik butun dunyo bo'ylab ko'rlik va past ko'rishning asosiy sababi hisoblanadi. JSST ma'lumotlariga ko'ra, dunyo bo'ylab 94 million kishi kataraktadan aziyat chekadi va ularning aksariyati 50 yoshdan oshgan bemorlar.",
      "Kataraktaning asosiy turlari: yadroviy (gavhar markazida loyqalanish), kortikal (gavhar chetlarida), posterior subkapsulyar (gavhar orqa yuzasida) va kongenital (tug'ma). Yosh bilan bog'liq katarakta eng ko'p uchraydi — 60 yoshdan oshganlarning 70% da turli darajadagi gavhar loyqalanishi kuzatiladi.",
      "Katarakta rivojlanishiga ta'sir etuvchi omillar: yosh, ultrabinafsha nurlanish, diabet, kortikosteroidlarni uzoq vaqt qo'llash, ko'z travmasi, chekish va genetik moyillik. Antioksidantlar (C va E vitaminlari, lutein, zeaksantin) katarakta rivojlanishini sekinlashtirishi mumkin.",
      "Diagnostika usullari: tirqishli lampa biomikroskopiyasi — gavhar shaffofligini batafsil ko'rish imkonini beradi. IOL Master va optik kogerent biometriya sun'iy gavhar kuchini aniq hisoblaydi. Korneotopografiya astigmatizmni aniqlaydi va premium IOL tanlashda muhim.",
      "Fakoemulsifikatsiya — zamonaviy katarakta jarrohligining oltin standarti. 2-2.5 mm kichik kesim orqali ultratovush yordamida loyqa gavhar parchalanadi va so'riladi. Butun protsedura 15-20 daqiqa davom etadi va mahalliy anesteziya ostida amalga oshiriladi.",
      "Intraokulyar linzalar (IOL) turlari: monofokal (bitta masofaga — yaqin yoki uzoq), multifokal (bir nechta masofaga), toriq (astigmatizmni tuzatadi), EDOF (kengaytirilgan fokus chuqurligi). Premium IOLlar ko'zoynaksiz hayotni ta'minlaydi.",
      "Femtosekundli lazer yordamida katarakta jarrohliigi (FLACS) — kompyuter nazoratidagi lazer gavhar kapsulotomiyasi, gavhar parchalanishi va korneotomiyani oldindan programmalangan aniqlik bilan bajaradi. Bu usul an'anaviy fakoemulsifikatsiyaga nisbatan yanada yuqori aniqlik beradi.",
      "Operatsiyadan keyingi parvarish: antibiotiк va yallig'lanishga qarshi ko'z tomchilari 4-6 hafta mobaynida ishlatiladi. Ko'rish odatda 1-3 kun ichida tiklanadi. Og'ir jismoniy ish va suzishdan 2-4 hafta davomida saqlanish kerak.",
      "Katarakta operatsiyasining asoratlari kam uchraydi (2-3%): posterior kapsulaning loyqalanishi (YAG lazer bilan davolanadi), endoftalmit (og'ir infektsiya), makula shishi, retina ajralishi. Zamonaviy texnologiyalar bu xavflarni minimal darajaga tushirdi.",
      "Profilaktika va maslahatlar: quyosh ko'zoynagi (UV 400 himoya) taqish, antioksidantlarga boy oziq-ovqat iste'moli, chekishni to'xtatish, diabetni nazorat qilish va 50 yoshdan keyin yillik oftalmologik ko'rik. Katarakta ko'rishga sezilarli ta'sir qilganda operatsiya eng samarali yechim."
    ],
    author,
    date: "2025-02-10"
  },
  {
    id: "oftal-2",
    title: "Glaukoma: yashirin ko'rlik tahdidi va zamonaviy davolash strategiyalari",
    slug: "glaukoma-yashirin-korlik-davolash",
    image: eyeGlaucoma,
    summary: "Glaukoma kasalligining erta tashxisi, ko'z ichi bosimini nazorat qilish va zamonaviy farmakologik hamda jarrohlik usullari haqida ilmiy maqola.",
    content: [
      "Glaukoma — ko'rish nervining progressiv shikastlanishi bo'lib, qaytarilmas ko'rlikening ikkinchi sababi hisoblanadi. Dunyo bo'ylab 80 million kishi glaukomaga chalingan va 2040 yilga kelib bu raqam 111 millionga yetishi kutilmoqda.",
      "Glaukoma turlari: birlamchi ochiq burchakli (eng ko'p — 90%), birlamchi yopiq burchakli (Osiyo mamlakatlarida ko'p), normal bosimli glaukoma (ko'z ichi bosimi me'yorda, ammo ko'rish nervi shikastlanadi), kongenital (tug'ma) va ikkilamchi glaukoma.",
      "Ko'z ichi bosimi (KIB) — glaukomaning asosiy risk omili. Normal KIB 10-21 mmHg. Ammo KIB normal bo'lgan bemorlarning 30-40% da ham glaukoma rivojlanishi mumkin, shuning uchun KIB o'lchash yolg'iz yetarli emas.",
      "Diagnostika: Goldmann applanatsion tonometriya (KIB o'lchash oltin standarti), gonioskopiya (burchak ko'rigi), optik kogerent tomografiya (OKT — retinal nerv tolalari qalinligini o'lchash), ko'rish maydoni perimetriyasi (Humphrey, Octopus) va ko'rish nervi fotografiyasi.",
      "Farmakoterapiya — birinchi qator davolash: prostaglandin analoglari (latanoprost, travoprost — KIBni 25-35% ga kamaytiradi), beta-blokatorlar (timolol), alfa-agonistlar (brimoniidin), karboangidraz ingibitorlari (dorzolamid) va Rho-kinaz ingibitorlari (netarsudil — yangi avlod).",
      "Lazer davolash: selektiv lazer trabekuloplastika (SLT) — birlamchi yoki qo'shimcha davolash sifatida qo'llaniladi. YAG lazer iridotomiya — yopiq burchakli glaukomada. Tsiklofotokoagulyatsiya — refrakter glaukomada.",
      "Jarrohlik davolash: trabekulektomiya (filtration jarrohlik — oltin standart), drenaj implantlari (Ahmed, Baerveldt), minimal invaziv glaukoma jarrohliigi (MIGS — iStent, Hydrus, XEN gel stent). MIGS asoratlari kam va tiklanish tez.",
      "Glaukoma bilan yashash: kundalik ko'z tomchilarini muntazam ishlatish, KIBni nazorat qilish, 3-6 oyda bir ko'rik, jismoniy faollikni davom ettirish (bosim ko'taruvchi mashqlardan boshqa) va haydovchilik layoqatini tekshirish.",
      "Yangi yo'nalishlar: neyroproteksiya (ko'rish nervini himoya qiluvchi dorilar), gen terapiyasi, sun'iy intellekt yordamida erta diagnostika va implantable KIB sensorlari (24 soat monitoring). Bu texnologiyalar glaukoma davolashida inqilob yasashi kutilmoqda.",
      "Profilaktika va maslahat: glaukoma oilaviy bo'lib, yaqin qarindoshlarida glaukoma bo'lsa risk 4-9 barobar yuqori. 40 yoshdan keyin har 2 yilda, 60 yoshdan keyin yillik KIB va ko'rish nervi tekshiruvi o'tkazish shart. Erta tashxis — ko'rishni saqlab qolishning yagona yo'li."
    ],
    author,
    date: "2025-01-25"
  },
  {
    id: "oftal-3",
    title: "Diabetik retinopatiya: qandli diabetning ko'zga ta'siri va zamonaviy davolash",
    slug: "diabetik-retinopatiya-davolash",
    image: eyeDiabetic,
    summary: "Diabetik retinopatiyaning bosqichlari, diagnostikasi, anti-VEGF terapiya va lazer davolash usullari haqida batafsil maqola.",
    content: [
      "Diabetik retinopatiya (DR) — qandli diabetning eng og'ir ko'z asorati bo'lib, mehnat qobiliyatli yoshdagi odamlar orasida ko'rlikning yetakchi sababi. 1-tip diabetiklarning 90% va 2-tip diabetiklerning 60% da 20 yil ichida DR rivojlanadi.",
      "DR bosqichlari: 1) Yengil noproliferativ — mikroanevrizmalar paydo bo'ladi. 2) O'rtacha noproliferativ — qon ketishlar va ekssudatlar. 3) Og'ir noproliferativ — retinal ishemiya kengayadi. 4) Proliferativ — yangi qon tomirlari o'sadi (neovaskularizatsiya), ko'rlikka olib kelishi mumkin.",
      "Diabetik makula shishi (DMSh) — makulada suyuqlik to'planishi natijasida markaziy ko'rish pasayadi. DR ning istalgan bosqichida rivojlanishi mumkin va ko'rish yo'qotilishining eng ko'p uchraydigan sababi.",
      "Diagnostika: fundus fotografiyasi (skrining uchun), florestsein angiografiya (qon tomir o'tkazuvchanligi va ishemiyani aniqlash), optik kogerent tomografiya (OKT — makula qalinligini aniq o'lchash), OKT-angiografiya (bo'yamasdan qon tomirlari xaritasi).",
      "Anti-VEGF terapiya — DR va DMSh davolashida inqilob. Ranibizumab (Lucentis), aflibersept (Eylea), brolucizumab (Beovu) va faricimab (Vabysmo — bispecific antibody). Intravitreal in'ektsiyalar har 4-8 haftada qo'llaniladi va ko'rishni sezilarli yaxshilaydi.",
      "Lazer fotokoagulyatsiya: panretinal fotokoagulyatsiya (PRP) — proliferativ DRda yangi qon tomirlarini qaytaradi. Fokal/grid lazer — klinik jihatdan sezilarli makula shishida. Anti-VEGF bilan birgalikda qo'llanilishi mumkin.",
      "Vitreoretinal jarrohlik (vitrektomiya): shishasimon tanaga qon quyilishi (gemoftalmda), retina tortishilishi va og'ir proliferativ DRda qo'llaniladi. 23/25/27-gauge mikro-invaziv vitrektomiya tiklanishni tezlashtiradi.",
      "Qandli diabetni nazorat qilish — DR profilaktikasining asosi. HbA1c ni 7% dan past saqlash DR rivojlanish xavfini 76% ga kamaytiradi (DCCT tadqiqoti). Qon bosimi (<130/80 mmHg) va lipidlar nazorati ham muhim.",
      "Sun'iy intellekt (AI) va teleoftalmologiya: AI-asosli retina skrining tizimlari (IDx-DR — FDA tasdiqlangan) diabetik retinopatiyani shifokor ishtirokisiz 87% aniqlik bilan aniqlaydi. Bu texnologiya skrining imkoniyatlarini kengaytirmoqda.",
      "Tavsiyalar: diabetik bemorlar tashxis qo'yilgan kundan boshlab yillik ko'z tekshiruvidan o'tishi shart. Homiladorlikda har trimestrda ko'rik kerak. Erta tashxis va o'z vaqtida davolash ko'rlikning 95% holatlarini oldini oladi."
    ],
    author,
    date: "2025-01-15"
  },
  {
    id: "oftal-4",
    title: "LASIK va refraktiv jarrohlik: ko'zoynaksiz hayot uchun zamonaviy usullar",
    slug: "lasik-refraktiv-jarrohlik-kozoynak",
    image: eyeLasik,
    summary: "LASIK, SMILE, PRK va ICL operatsiyalari — ko'rish tuzatishning zamonaviy lazer va implantatsion usullari haqida keng maqola.",
    content: [
      "Refraktiv jarrohlik — miopiya (yaqindan ko'rish), gipermetropiya (uzoqdan ko'rish) va astigmatizmni jarrohlik usuli bilan tuzatishga qaratilgan oftalmologiya tarmog'i. Dunyo bo'ylab 35 million dan ortiq LASIK operatsiya bajarilgan.",
      "LASIK (Laser-Assisted In Situ Keratomileusis) — eng mashhur ko'rish tuzatish operatsiyasi. Kornea yuzasida yupqa qopqoq (flap) hosil qilinib, eksimerli lazer kornea to'qimasini qayta shakllantiradi. Butun protsedura 10-15 daqiqa, ko'rish ertasiga tiklanadi.",
      "Femto-LASIK — flap yaratishda mexanik mikrokeratom o'rniga femtosekundli lazer ishlatiladi. Bu yanada yuqori aniqlik, kamroq asoratlar va yaxshiroq prognoz beradi. Zamonaviy klinikalarda standart usulga aylangan.",
      "SMILE (Small Incision Lenticule Extraction) — flapless texnologiya. Femtosekundli lazer kornea ichida lentikul (kichik linza shaklidagi to'qima) hosil qiladi va 2-4 mm kesim orqali chiqaradi. Quruq ko'z sindromi kamroq, kornea mustahkamligi saqlanadi.",
      "PRK (Photorefractive Keratectomy) — kornea yuzasi epiteliysi olib tashlanib, eksimerli lazer to'g'ridan-to'g'ri stroma yuzasiga ta'sir qiladi. Yupqa kornealarda va sport bilan shug'ullanuvchilarida afzal. Tiklanish LASIK ga nisbatan sekinroq (3-5 kun).",
      "ICL (Implantable Collamer Lens) — ko'z ichiga implantatsiya qilinadigan kontakt linza. Yuqori darajadagi miopiyada (-6 dan -20 dioptrgacha) eng yaxshi variant. Kornea o'zgartirilmaydi, shuning uchun qaytarilmas. Staar Surgical EVO Visian ICL eng mashhur model.",
      "Refraktiv operatsiyaga tayyorgarlik: 18 yoshdan kichik bo'lmasligi, ko'rish raqami kamida 1 yil barqaror, kornea qalinligi yetarli (>500 mkm LASIK uchun), keratokonusis va boshqa kornea kasalliklari bo'lmasligi kerak. Homiladorlik va laktatsiya paytida operatsiya qilinmaydi.",
      "Topografik/wavefront-guided lazer — har bir bemorning ko'z xaritasiga asoslangan individual davolash. Aberratsiyalarni (ko'rish buzilishlarini) korrektsiya qiladi va sifatli ko'rishni ta'minlaydi, ayniqsa tungi ko'rish sifatini yaxshilaydi.",
      "Asoratlar va xavflar: quruq ko'z (eng ko'p — 20-40%, vaqtinchalik), halo va glare (tungi yorug'lik aylanalari), flap muammolari (LASIK da), kam yoki ortiqcha tuzatish, kamdan-kam hollarda keratektaziya. Og'ir asoratlar 1% dan kam.",
      "Kimga tavsiya etiladi: 18-45 yosh, barqaror refraktsiya, sog'lom ko'z, kornea qalinligi yetarli. Operatsiyadan oldin batafsil ko'rik — kornea topografiyasi, pachimetriya, ko'z tubi tekshiruvi va quruq ko'z testlari o'tkaziladi. To'g'ri tanlangan usul bemorga ko'zoynaksiz erkin hayotni hadya etadi."
    ],
    author,
    date: "2024-12-20"
  },
  {
    id: "oftal-5",
    title: "Quruq ko'z sindromi: zamonaviy diagnostika va davolash yondashuvlari",
    slug: "quruq-koz-sindromi-diagnostika-davolash",
    image: eyeDryeye,
    summary: "Quruq ko'z kasalligining sabablari, DEWS II tasniflari va zamonaviy davolash usullari — sun'iy ko'z yoshidan autologik serumga qadar.",
    content: [
      "Quruq ko'z sindromi (QKS) — ko'z yoshi plyonkasining barqarorligining buzilishi bo'lib, ko'z yuzasida shikastlanish va noqulay subyektiv belgilar bilan kechadi. Dunyo aholisining 5-34% da uchraydi, ayollarda va keksalarda ko'proq.",
      "DEWS II tasnifi bo'yicha QKS ikki asosiy turga bo'linadi: 1) Ko'z yoshi kamayishi (aqueous deficiency) — ko'z yoshi bezining yetarli suyuqlik ishlab chiqarmasligi. 2) Evaporativ tur — ko'z yoshining haddan tashqari tez bug'lanishi, ko'pincha Meybom bezlari disfunktsiyasi (MBD) sababli.",
      "QKS sabablari: kompyuter va smartfon ekranlariga uzoq vaqt qarash (palak chaqish 66% kamayadi), kontakt linzalar, LASIK dan keyin, gormonlar o'zgarishi (menopauza), autoimmun kasalliklar (Shyogren sindromi), dorilar (antigistaminlar, antidepressantlar) va atrof-muhit omillari.",
      "Diagnostika usullari: OSDI (Ocular Surface Disease Index) so'rovnomasi, Schirmer testi (ko'z yoshi miqdori), ko'z yoshi plyonkasi parchalanish vaqti (TBUT), vital bo'yash (florestsein, lissamin yashil), Meybomografiya va interferometriya.",
      "Davolash — bosqichma-bosqich yondashuv: 1-bosqich: sun'iy ko'z yoshi (konservantsiz — Hylo-Comod, Systane Ultra), muhitni optimallashtirish, omega-3 qo'shimchasi. 2-bosqich: yallig'lanishga qarshi tomchilar (tsiklosporin — Restasis, lifitegrast — Xiidra).",
      "3-bosqich: autologik serum ko'z tomchilari (bemorning o'z qon serumidan tayyorlanadi), sklemal kontakt linzalar, punktal probkalar (ko'z yoshi oqib ketishini kamaytiradi). 4-bosqich: amniontik membrana transplantatsiyasi, tarsorrfiya.",
      "Meybom bezlari disfunktsiyasi (MBD) davolash: issiq kompresslar va qovoq massaji, LipiFlow (termal pulsatsiya tizimi), IPL (intensiv pulsli yorug'lik terapiyasi), Blephex (qovoq gigiyenasi apparati). MBD — evaporativ quruq ko'zning 86% sababchisi.",
      "Zamonaviy terapiyalar: OTX-101 (tsiklosporin nanoemulsiyasi), varenicline nasal spray (ko'z yoshi ishlab chiqarishni stimullyatsiya qiladi), reproxalap (TRPV1 antagonist — og'riq va yallig'lanishga qarshi). Bu yangi avlod dorilar QKS davolashida katta ilgarilash.",
      "Profilaktika choralari: kompyuter oldida 20-20-20 qoidasi (har 20 daqiqada, 20 sekund, 20 fut uzoqqa qarash), yetarli namlantirish (havoni namlash apparati), palak chaqishni ongli ravishda ko'paytirish, ko'zoynaklar (shamoldan himoya), antioksidantlar va omega-3.",
      "Tavsiyalar: QKS — surunkali holat bo'lib, uzoq muddatli boshqaruvni talab qiladi. O'z-o'zini davolash o'rniga mutaxassisga murojaat qilish kerak. Yengil holatlarda sun'iy ko'z yoshi, o'rtacha va og'ir hollarda yallig'lanishga qarshi terapiya va protseduralar zarur."
    ],
    author,
    date: "2024-11-30"
  },
  {
    id: "oftal-6",
    title: "Bolalar oftalmologiyasi: g'ilaylik, ambliopiya va refraktsion buzilishlar",
    slug: "bolalar-oftalmologiyasi-gilaylik-ambliopiya",
    image: eyePediatric,
    summary: "Bolalarda ko'z kasalliklarining erta aniqlash usullari, g'ilaylik davolash va ambliopiya (dangasa ko'z) terapiyasi.",
    content: [
      "Bolalar oftalmologiyasi — 0 dan 18 yoshgacha bolalarning ko'z kasalliklarini o'rganadi. Ko'rish tizimi 7-9 yoshgacha shakllanadi, shuning uchun erta tashxis va davolash muhim. Bolalarning 5-10% da klinik ahamiyatga ega ko'rish buzilishlari mavjud.",
      "Ambliopiya (dangasa ko'z) — miya bir ko'zdan keladigan tasvirni to'liq qayta ishlay olmasligi. Bolalarning 2-3% da uchraydi. Sabablari: g'ilaylik, anizometropiya (ikki ko'z orasidagi refraktsiya farqi), ko'rishga to'siq (tug'ma katarakta, ptoz). 7 yoshgacha davolash eng samarali.",
      "Ambliopiya davolash: to'g'ri ko'zni yopish (okkluziya) — kuniga 2-6 soat, atropin penalizatsiyasi (to'g'ri ko'zga 1% atropin tomchilar), optik korreksiya va ko'rish mashqlari. Zamonaviy kompyuter dasturlari (dichoptik terapiya) ham samarali.",
      "G'ilaylik (strabizm) — ko'zlarning parallel bo'lmagan holati. Bolalarning 4% da uchraydi. Turlari: ichki (ezotropiya), tashqi (ekzotropiya), vertikal va paralitik. Erta davolash ambliopiya va stereoskopik ko'rishning buzilishini oldini oladi.",
      "G'ilaylik davolash: ko'zoynaklar bilan korreksiya (ayniqsa akkommodativ ezotropiyada), prizmali ko'zoynaklar, botulotoksin in'ektsiyasi va jarrohlik (ko'z mushaklarini kuchaytirish yoki bo'shatish). Jarrohlik 80-90% hollarda muvaffaqiyatli.",
      "Bolalarda refraktsion buzilishlar: miopiya (yaqindan ko'rish) — zamonaviy bolalar orasida epidemiya (Sharqiy Osiyoda 80-90%). Atropin 0.01-0.05% tomchilari, ortokeratologiya (tungi linzalar) va ko'proq tashqarida bo'lish miopiya progressiyasini 50-60% ga sekinlashtiradi.",
      "Tug'ma ko'z kasalliklari: retinoblastoma (ko'z saratoni — oq qorachiq belgisi), tug'ma katarakta, tug'ma glaukoma (buqqa ko'z — buphthalmia), ko'z yoshi yo'llari tiqilishi (nazolakrimal kanal obstruktsiyasi). Erta murojaat — hayot va ko'rishni saqlab qolish kaliti.",
      "Chaqaloqlarning ko'z skriningi: qizil refleks tekshiruvi (tug'ruqxonada), 6 oylikda birinchi ko'z ko'rigi, 3 yoshda va maktabga kirishdan oldin to'liq oftalmologik tekshiruv. Chala tug'ilgan chaqaloqlarda retinopathy of prematurity (ROP) skriningi majburiy.",
      "Raqamli qurilmalar va bolalar ko'zi: 2 yoshgacha ekrandan foydalanishni cheklash, 2-5 yosh — kuniga 1 soatdan ko'p emas, to'g'ri masofa (50 cm dan kam emas), tabiatda vaqt o'tkazish (kuniga 2 soat) miopiya profilaktikasida samarali.",
      "Ota-onalarga maslahatlar: bolaning ko'z olma qisilishi, bosh qiyshayishi, ekranga yaqin borishi, bir ko'zni yopishi — bu ko'rish muammolari belgisi. O'z vaqtida murojaat ko'rish sifatini butunlay o'zgartirishi mumkin. Har yili oftalmologga olib borish tavsiya etiladi."
    ],
    author,
    date: "2024-11-10"
  },
  {
    id: "oftal-7",
    title: "Retina kasalliklari: retina ajralishi va vitreoretinal jarrohlik",
    slug: "retina-kasalliklari-ajralish-jarrohlik",
    image: eyeRetina,
    summary: "Retina ajralishi, makula degeneratsiyasi va zamonaviy vitreoretinal jarrohlik usullari — PPV, skleroplomba va endolazer.",
    content: [
      "Retina — ko'zning ichki qismidagi yorug'likni sezuvchi to'qima bo'lib, ko'rishning asosiy organi. Retina kasalliklari ko'rish yo'qotilishining muhim sabablari qatoriga kiradi. Yoshga bog'liq makula degeneratsiyasi (YMD) rivojlangan mamlakatlarda ko'rlikning asosiy sababi.",
      "Retina ajralishi — retinaning pigment epiteliydan ajralib chiqishi. Shoshilinch holat! Belgilari: ko'z oldida chaqnash, qora nuqtalar (mushaklar — floaterlar), parda tushishi. 10,000 dan 1 kishida yiliga uchraydi. Miopiyachilar, ko'z jarohati bo'lganlar va katarakta operatsiyasidan keyin risk yuqori.",
      "Retina ajralishi turlari: regmatogen (retina yirtilishi orqali), traktsion (vitreoretinal tortishma — diabetik retinopatiyada), eksudativ (suyuqlik to'planishi — yallig'lanish yoki o'smalar). Har biri alohida davolash yondashuvini talab qiladi.",
      "Davolash usullari: pnevmatik retinopeksiya (gaz pufagi bilan retinani bosish), skleroplomba (silikon lenta bilan ko'z devorini ichkariga bosish), pars plana vitrektomiya (PPV — shishasimon tanani olib tashlash va retinani qayta joylashtirish).",
      "Zamonaviy vitrektomiya: 23/25/27-gauge mikro-invaziv texnologiya, keng burchakli ko'rish tizimlari (Resight, BIOM), endolazer va chandelier yorug'lik. 3D vizualizatsiya tizimlari (NGENUITY, TrueVision) chirohdan jarrohga yuqori sifatli tasvir beradi.",
      "Yoshga bog'liq makula degeneratsiyasi (YMD): quruq (atrofik — 85%) va ho'l (neovaskulyar — 15%) turlari. Ho'l YMD da anti-VEGF in'ektsiyalari (ranibizumab, aflibersept, faricimab) ko'rishni saqlaydi. Quruq YMD uchun pegcetacoplan (C3 ingibitor) — birinchi tasdiqlangan dori.",
      "Makula teshigi — makula markazidagi to'liq qalinlikdagi defekt. Vitrektomiya + ichki chegaralovchi membrana (ILM) peeling + gaz tamponada bilan 90% dan ortiq anatomik muvaffaqiyat. Kichik teshiklarda ozon terapiya ham sinovdan o'tmoqda.",
      "Retinal ven tiqilishi (RVO) — retina qon tomirlarining trombozi. Markaziy ven tiqilishi (CRVO) va tarmoq ven tiqilishi (BRVO). Makula shishi rivojlansa anti-VEGF va/yoki deksametazon implant (Ozurdex) bilan davolanadi.",
      "Gen terapiyasi va yangi texnologiyalar: Luxturna (voretigene neparvovec) — Leber tug'ma amaurozi uchun birinchi tasdiqlangan gen terapiyasi. Retina protezlari (Argus II — sun'iy retina), optogenetika va ildiz hujayra terapiyasi kelajakda ko'rlikni davolash imkonini berishi mumkin.",
      "Profilaktika: miopiya nazorati, ko'z travmalaridan himoya, diabet va gipertoniyani davolash, antioksidantlar (AREDS2 formulasi — lutein, zeaksantin, C, E vitaminlari, sink), chekmaslik va 50 yoshdan keyin retina tekshiruvi."
    ],
    author,
    date: "2024-10-20"
  },
  {
    id: "oftal-8",
    title: "Ko'z travmalari: birinchi yordam va zamonaviy davolash usullari",
    slug: "koz-travmalari-birinchi-yordam-davolash",
    image: eyeTrauma,
    summary: "Ko'z jarohatlarining turlari, birinchi yordam qoidalari va zamonaviy oftalmologik rekonstruktiv jarrohlik haqida maqola.",
    content: [
      "Ko'z travmalari — dunyo bo'ylab bir tomonlama ko'rlikning asosiy sabablaridan biri. Yiliga 55 million kishi ko'z jarohati oladi, ulardan 750,000 tasi gospitalizatsiya talab qiladi. Erkaklar ayollarga nisbatan 4 barobar ko'p jarohat oladi.",
      "Ko'z travmalari tasnifi (BETT — Birmingham Eye Trauma Terminology): yopiq globus jarohati (ko'z devori butun — kontuziya, laseratsiya), ochiq globus jarohati (ko'z devori buzilgan — ruptura, penetrant, perforant, ko'z ichiga yot jism).",
      "Kimyoviy kuyish — eng shoshilinch ko'z jarohati. Ishqorlar (NaOH, Ca(OH)2) kislotalarga nisbatan xavfliroq — chuqurroq penetratsiya. BIRINCHI YORDAM: darhol ko'plab suv bilan yuvish kamida 20-30 daqiqa! So'ng zudlik bilan kasalxonaga.",
      "Kornea yot jismlari va abraziyasi: metall parchalar, shisha, tuproq. Slit-lamp yordamida aniqlash. Yuzaki yot jismlarni igle yoki burr bilan olib tashlash, antibiotiк tomchi va bog'lam qo'yish. Ko'pincha 24-48 soatda bitadi.",
      "Hifema — oldingi kamera qon quyilishi. Odatda to'g'ridan-to'g'ri zarba natijasida. Yotish rejimi, tsikloplegik va steroid tomchilar, KIB nazorati. Qayta qon ketish 3-5 kunda xavfli. Orak hujayrali anemiya bemorlarda asoratlar ko'proq.",
      "Ko'z orbita sinishi (blow-out fracture) — ko'z soqqasi atrofidagi suyaklarning sinishi. Ko'rish ikkilanishi (diplopia), enoftalm (ko'z botishi) va infraorbital sezgi yo'qolishi xos. KT tekshiruvidan so'ng zarur hollarda jarrohlik rekonstruksiya.",
      "Penetrant va perforant ko'z jarohatlari — eng og'ir holat. Ko'z koptogini teshib o'tgan jarohatlar. Birinchi yordam: ko'zga tegmaslik, qattiq qalqon bilan himoya qilish, antibiotik va tetanus profilaktikasi, shoshilinch jarrohlik. Globe salvage — ko'zni saqlab qolish har doim ustuvor.",
      "Bolalardagi ko'z travmalari: sport jarohatlari, o'yinchoqlar (airsoft, o'q otish), maishiy kimyo. 90% ko'z jarohatlarini himoya ko'zoynagi bilan oldini olish mumkin. Sport paytida polikarbonat himoya ko'zoynagi taqish shart.",
      "Zamonaviy rekonstruktiv jarrohlik: kornea transplantatsiyasi (penetrant va lamellar), skleroplastika, vitrektomiya va endotamponada, enukleatstiya va protezlash (ko'zni saqlab bo'lmagan hollarda). Amniontik membrana ko'z yuzasini tiklashda qo'llaniladi.",
      "Profilaktika: ish joyida himoya ko'zoynaklari (ANSI Z87.1 standarti), sport ko'zoynagi, bolalar xavfsizligi (xavfli o'yinchoqlarni olib tashlash), kimyoviy moddalar bilan ishlashda yuz himoyasi, petarda va feyerverk xavfsizligi. Oldindan ehtiyot bo'lish — ko'rishni saqlab qolishning eng ishonchli yo'li."
    ],
    author,
    date: "2024-09-15"
  },
  {
    id: "oftal-9",
    title: "Ko'z onkologiyasi: ko'z o'smalari va zamonaviy davolash strategiyalari",
    slug: "koz-onkologiyasi-osmalar-davolash",
    image: eyeOncology,
    summary: "Ko'z ichi va orbita o'smalari — retinoblastoma, uveal melanoma va limfoma diagnostikasi va zamonaviy onkologik davolash.",
    content: [
      "Ko'z onkologiyasi — ko'z va uning atrofi to'qimalarida paydo bo'ladigan o'smalarni o'rganadi. Ko'z saratonlari nisbatan kam uchraydi, ammo ko'rish va hayot uchun jiddiy tahdid. Kattalarning ko'z ichi o'smalaridan uveal melanoma (85%) eng ko'p tarqalgan.",
      "Uveal melanoma — ko'z ichining eng ko'p uchraydigan birlamchi sog'liq o'smasi. Xorioideyadan (90%), tsiliiar tanadan (6%) yoki iriidan (4%) kelib chiqadi. Yiliga milliondan 5-7 holat. Metastazlar odatda jigarga tarqaladi (50% hollarda).",
      "Uveal melanomaning diagnostikasi: B-scan ultratovush (o'sma balandligi va qalinligi), florestsein va indotsianin yashil angiografiya, OKT, MRT (ekstraokulyar o'sish uchun) va nozik ignali aspiratsion biopsiya (FNAB) sitogenetik tahlil uchun.",
      "Uveal melanomani davolash: kichik o'smalarda lazer terapiya (TTT — transpupillyar termoterapiya), o'rta hajmdagilarda brakiterapiya (radioaktiv plakka — I-125 yoki Ru-106), katta o'smalarda enukleatstiya (ko'zni olib tashlash). Proton nurlanish terapiyasi ko'zni saqlash imkonini beradi.",
      "Retinoblastoma — bolalardagi eng ko'p uchraydigan ko'z ichi o'smasi. 15,000-20,000 tug'ilishda 1 holat. 60% sporadik, 40% irsiy (RB1 gen mutatsiyasi). Oq qorachiq (leykokoria) va g'ilaylik asosiy belgilar. Erta tashxis — 95% dan ortiq sog'ayish ko'rsatkichi.",
      "Retinoblastoma davolash: intraarterial kimyoterapiya (ko'z arteriyasiga to'g'ridan-to'g'ri dori yuborish — melfalan), intravitreal kimyoterapiya, lazer fotokoagulyatsiya, krioterapiya va termoterapiya. Ilg'or hollarda enukleatstiya, tashqi nurlanish esa oxirgi variant sifatida.",
      "Ko'z limfomasi: birlamchi intraokulyar limfoma (PIOL) — miyaning diffuz yirik B-hujayrali limfomasining ko'z ko'rinishi. Keksa yoshdagilarda surunkali uveit sifatida namoyon bo'ladi. Diagnostikasi qiyin — vitrektomiya va sitoloigk tekshiruv kerak. Metotreksat intravitreal in'ektsiyasi va nurlanish bilan davolanadi.",
      "Ko'z qovoqlari va orbita o'smalari: bazal hujayrali karsinoma (qovoq saratonining 90%), yassi hujayrali karsinoma, sebatseous karsinoma va rhabdomiosarkoma (bolalarda orbita o'smasi). Jarrohlik olib tashlash va zarur hollarda rekonstruktiv plastika.",
      "Onkogenetika va genetik konsalting: RB1 mutatsiyasi aniqlangan oilalarda bola tug'ilishdan oldin genetik tekshiruv. BRCA mutatsiyalari uveal melanoma xavfini oshirishi mumkin. BAP1 gen mutatsiyasi — metastatik uveal melanoma uchun asosiy prognastik marker.",
      "Kuzatish va reabilitatsiya: ko'z saratonidan keyin uzoq muddatli monitoring (5 yil va undan ko'p), okular protezlar va ko'z kosmetikasi, psixologik qo'llab-quvvatlash. Ko'z onkologiyasi multidistsiplinar yondashuv — oftalmolog, onkolog, radiolog va genetik hamkorligini talab qiladi."
    ],
    author,
    date: "2024-08-05"
  },
  {
    id: "oftal-10",
    title: "Kompyuter ko'rish sindromi: raqamli dunyoning ko'zga ta'siri va profilaktika",
    slug: "kompyuter-korish-sindromi-profilaktika",
    image: eyeComputer,
    summary: "Kompyuter va smartfon ekranlarining ko'z sog'lig'iga ta'siri, ko'k yorug'lik xavfi va samarali profilaktika choralari.",
    content: [
      "Kompyuter ko'rish sindromi (KKS) yoki raqamli ko'z charchashi — kompyuter, planshet va smartfon ekranlariga 2 soatdan ko'proq qarash natijasida paydo bo'ladigan belgilar majmuasi. Ofis xodimlarining 50-90% da turli darajada uchraydi.",
      "KKS belgilari: ko'z charchashi (astenopiya), bosh og'rig'i, ko'z qurishi va achishishi, xiralashgan ko'rish, ikkilangan ko'rish, bo'yin va yelka og'rig'i. Bu belgilar odatda vaqtinchalik bo'lib, ekrandan uzoqlashganda yaxshilanadi, ammo surunkali ta'sir uzoq muddatli muammolarga olib kelishi mumkin.",
      "Ko'k yorug'lik (HEV — High Energy Visible light, 400-500 nm) — ekranlardan chiqadigan qisqa to'lqinli yorug'lik. Retinaga ta'siri, tsirkadian ritmni buzishi (uyqu sifatini pasaytirishi) va makula degeneratsiyasi riskini oshirishi haqida tadqiqotlar davom etmoqda.",
      "Miopiya epidemiyasi va ekranlar: dunyo bo'ylab bolalar va yoshlar orasida miopiya keskin oshmoqda. 2050 yilga kelib dunyo aholisining 50% miopiya bo'lishi bashorat qilinmoqda. Yaqindan ko'p ishlash va tashqarida kam bo'lish asosiy sabablar.",
      "Ergonomik yondashuvlar: monitor ko'z sathidan 15-20° pastda, masofa 50-70 cm, ekran yorqinligi atrofdagi yorug'likka mos, shrift hajmi 12+ pt, yuqori kontrast (qora matn oq fonda), antireflex ekran himoyasi.",
      "20-20-20 qoidasi: har 20 daqiqada, 20 soniya davomida, 20 fut (6 metr) uzoqlikka qarash. Bu oddiy qoida akomodatsiya spazmini (ko'z mushagi charchashini) kamaytiradi va ko'z namlanishini yaxshilaydi. Smartphone ishlatishda ham amal qilish kerak.",
      "Ko'zoynaklar va linzalar: kompyuter ko'zoynagi (ofis linzalari) — yaqin va o'rta masofaga optimallashtirilgan. Ko'k yorug'lik filtri (blue-light blocking) ko'zoynaklar uyqu sifatini yaxshilashi mumkin, ammo retina himoyasi bo'yicha dalillar hali yetarli emas.",
      "Sun'iy ko'z yoshi va muhit nazorati: konservantsiz sun'iy ko'z yoshlari (har 2-3 soatda), xona namligini 40-60% da saqlash, konditsioner va ventilyatorni ko'zga to'g'ri yo'naltirmaslik. Palak chaqishni ongli ravishda ko'paytirish (minutiga 15-20 marta).",
      "Bolalar va ekran vaqti: AAP (Amerika Pediatriya Akademiyasi) tavsiyalari — 2 yoshgacha video qo'ng'iroqdan boshqa ekran yo'q, 2-5 yosh — 1 soat/kun, maktab yoshi — oqilona cheklov. Har 20-30 daqiqada tanaffus, tashqarida kuniga 2 soat.",
      "Tavsiyalar va xulosa: kompyuter ko'rish sindromi — zamonaviy hayotning ajralmas qismi, ammo oddiy profilaktika choralari bilan boshqarish mumkin. Muntazam ko'z tekshiruvi, to'g'ri ko'zoynaklar, ergonomik ish joyi va ekran vaqtini boshqarish — sog'lom ko'z uchun kalit. Ko'z — eng qimmatbaho a'zo, uni asrang."
    ],
    author,
    date: "2024-07-15"
  }
];
