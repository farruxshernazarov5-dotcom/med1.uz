import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SITE = "https://www.med1.uz";

interface Meta {
  title: string;
  description: string;
}

/**
 * Sitewide per-route title/description/og fallback for pages that don't render
 * their own <SEO /> component. Pages with <SEO /> override these tags because
 * Helmet dedupes by name/property and the page-level tags mount later.
 */
const ROUTE_META: Record<string, Meta> = {
  "/health": {
    title: "Salomatlik maslahatlari — ovqatlanish, sport, uyqu | Med1.uz",
    description:
      "Ovqatlanish, jismoniy faollik, ruhiy salomatlik, uyqu, ilk yordam va profilaktika bo'yicha shifokorlar tomonidan tayyorlangan amaliy maslahatlar.",
  },
  "/pricing": {
    title: "Narxlar va tariflar — Med Coin va SaaS rejalari | Med1.uz",
    description:
      "Med1.uz AI xizmatlari uchun Med Coin narxlari, klinikalar va shifokorlar uchun SaaS tarif rejalari hamda ularga kiritilgan imkoniyatlar ro'yxati.",
  },
  "/diagnostics": {
    title: "Diagnostika markazlari — MRT, KT, UZI va laborator tekshiruvlar",
    description:
      "O'zbekistondagi diagnostika markazlari: MRT, KT, rentgen, UZI va laborator tahlillar. Manzil, ish vaqti va onlayn navbat olish imkoniyati.",
  },
  "/pharmacies": {
    title: "Dorixonalar — 24/7 navbatchi dorixonalar bazasi | Med1.uz",
    description:
      "Shahringizdagi dorixonalar ro'yxati: manzil, telefon, ish vaqti va 24 soat ishlaydigan navbatchi dorixonalar haqida ma'lumot.",
  },
  "/blood-banks": {
    title: "Qon markazlari va donorlik — Med1.uz",
    description:
      "Qon quyish markazlari manzillari, donor bo'lish talablari va qon topshirish jarayoni haqida to'liq ma'lumot.",
  },
  "/maternity": {
    title: "Tug'ruqxonalar va perinatal markazlar | Med1.uz",
    description:
      "Tug'ruqxonalar, perinatal markazlar va homiladorlikni kuzatish xizmatlari: manzil, xizmatlar ro'yxati va bog'lanish ma'lumotlari.",
  },
  "/cosmetology": {
    title: "Kosmetologiya klinikalari va xizmatlari | Med1.uz",
    description:
      "Kosmetologiya markazlari, teri parvarishi, lazer va estetik muolajalar bo'yicha klinikalar ro'yxati hamda narx oralig'i.",
  },
  "/med-tech": {
    title: "Tibbiy texnika va uskunalar katalogi | Med1.uz",
    description:
      "Klinikalar uchun tibbiy texnika: diagnostika uskunalari, laboratoriya jihozlari va yetkazib beruvchilar bo'yicha katalog.",
  },
  "/knowledge": {
    title: "Tibbiy bilimlar bazasi — 12 000+ maqola | Med1.uz",
    description:
      "Kasalliklar, dori vositalari va davolash protokollari bo'yicha o'zbek va ingliz tilidagi tibbiy bilimlar bazasi.",
  },
  "/services": {
    title: "Med1.uz xizmatlari — bemorlar, shifokorlar va klinikalar uchun",
    description:
      "Onlayn navbat, AI diagnostika yordamchisi, klinika boshqaruv tizimi va shifokorlar uchun raqamli xizmatlar to'plami.",
  },
  "/symptom-checker": {
    title: "Simptom tekshiruvchi — belgilar bo'yicha dastlabki tahlil",
    description:
      "Belgilaringizni kiriting va AI yordamida ehtimoliy sabablar hamda qaysi mutaxassisga murojaat qilish bo'yicha tavsiya oling.",
  },
  "/smart-search": {
    title: "Aqlli qidiruv — shifokor, klinika va xizmat topish | Med1.uz",
    description:
      "Bitta qidiruv orqali shifokorlar, klinikalar, tahlillar va tibbiy maqolalarni toping. Filtrlar va AI tavsiyalari bilan.",
  },
  "/ai-services": {
    title: "AI tibbiy xizmatlar — 14 ta yo'nalish | Med1.uz",
    description:
      "Radiologiya, onkologiya, diabet, dietologiya, psixologiya va boshqa yo'nalishlar bo'yicha AI yordamchi xizmatlari.",
  },
  "/ai-doctor-chat": {
    title: "AI shifokor chat — savollaringizga tezkor javob | Med1.uz",
    description:
      "Sog'liq bo'yicha savollaringizga AI shifokor yordamchisidan o'zbek tilida tezkor va manbaga asoslangan javob oling.",
  },
  "/ai-report-analysis": {
    title: "AI tahlil natijalari izohi — laborator hisobot tahlili",
    description:
      "Qon, siydik va boshqa laborator tahlil natijalarini yuklang: AI ko'rsatkichlarni norma bilan solishtirib tushuntiradi.",
  },
  "/ai-radiology": {
    title: "AI radiologiya — rentgen, KT va MRT tasvirlari tahlili",
    description:
      "Ko'krak qafasi, bosh miya, suyak, mammografiya, qorin va umurtqa tasvirlarini AI yordamida dastlabki tahlil qilish.",
  },
  "/ai-health-assistant": {
    title: "AI salomatlik yordamchisi — shaxsiy tavsiyalar | Med1.uz",
    description:
      "Kundalik salomatlik, profilaktika va turmush tarzi bo'yicha shaxsiylashtirilgan AI tavsiyalari.",
  },
  "/ai-vital-signs": {
    title: "AI hayotiy ko'rsatkichlar — kamera orqali puls va SpO2",
    description:
      "Smartfon kamerasi yordamida puls, SpO2 va nafas chastotasini o'lchash hamda natijalarni kuzatib borish.",
  },
  "/partnership": {
    title: "Hamkorlik — klinikalar va texnologiya sheriklari uchun",
    description:
      "Med1.uz bilan hamkorlik shartlari: klinikalar, laboratoriyalar, dorixonalar va API integratsiyasi bo'yicha sheriklik dasturi.",
  },
  "/referral": {
    title: "Referal dastur — do'stni taklif qiling va bonus oling",
    description:
      "Med1.uz referal dasturi: taklif havolangiz orqali ro'yxatdan o'tganlar uchun Med Coin bonuslari va shartlar.",
  },
  "/user-guide": {
    title: "Foydalanuvchi qo'llanmasi — Med1.uz bilan ishlash",
    description:
      "Ro'yxatdan o'tish, navbat olish, AI xizmatlaridan foydalanish va shaxsiy kabinet imkoniyatlari bo'yicha bosqichma-bosqich qo'llanma.",
  },
  "/sitemap": {
    title: "Sayt xaritasi — barcha bo'limlar | Med1.uz",
    description: "Med1.uz saytining barcha ochiq bo'limlari va sahifalariga havolalar ro'yxati.",
  },
  "/legal-center": {
    title: "Yuridik markaz — shartnomalar va hujjatlar | Med1.uz",
    description:
      "Med1.uz yuridik hujjatlari: foydalanish shartlari, maxfiylik siyosati, tibbiy ogohlantirish va hamkorlik shartnomalari.",
  },
  "/legal": {
    title: "Yuridik hujjatlar | Med1.uz",
    description:
      "Med1.uz foydalanish shartlari, maxfiylik siyosati va boshqa rasmiy hujjatlar bilan tanishing.",
  },
  "/terms": {
    title: "Foydalanish shartlari | Med1.uz",
    description: "Med1.uz platformasidan foydalanish shartlari, foydalanuvchi huquq va majburiyatlari.",
  },
  "/privacy": {
    title: "Maxfiylik siyosati | Med1.uz",
    description: "Shaxsiy va tibbiy ma'lumotlaringiz qanday yig'iladi, saqlanadi va himoyalanadi.",
  },
  "/disclaimer": {
    title: "Tibbiy ogohlantirish (Disclaimer) | Med1.uz",
    description:
      "Med1.uz materiallari axborot maqsadida. Tashxis va davolash uchun shifokorga murojaat qilish shartligi haqida ogohlantirish.",
  },
  "/cookies": {
    title: "Cookie siyosati | Med1.uz",
    description: "Med1.uz saytida ishlatiladigan cookie fayllari turlari va ularni boshqarish sozlamalari.",
  },
  "/cookie-policy": {
    title: "Cookie siyosati | Med1.uz",
    description: "Med1.uz saytida ishlatiladigan cookie fayllari turlari va ularni boshqarish sozlamalari.",
  },
  "/saas-terms": {
    title: "SaaS shartnoma shartlari — klinikalar uchun | Med1.uz",
    description: "Klinikalar va tibbiy tashkilotlar uchun Med1.uz HMS SaaS xizmatidan foydalanish shartlari.",
  },
  "/referral-terms": {
    title: "Referal dastur shartlari | Med1.uz",
    description: "Referal bonuslari, hisoblash tartibi va dasturda ishtirok etish qoidalari.",
  },
  "/partner-terms": {
    title: "Hamkorlik shartnomasi shartlari | Med1.uz",
    description: "Med1.uz hamkorlari uchun shartnoma shartlari, majburiyatlar va integratsiya talablari.",
  },
  "/partner-docs": {
    title: "Hamkorlar uchun API hujjatlari | Med1.uz",
    description:
      "Med1.uz API integratsiyasi bo'yicha to'liq hujjatlar: autentifikatsiya, endpointlar, webhooklar va sinov muhiti.",
  },
  "/api-docs": {
    title: "API hujjatlari — Med1.uz ochiq platformasi",
    description: "Med1.uz REST API endpointlari, so'rov formatlari va misollar bilan texnik hujjat.",
  },
  "/developers": {
    title: "Dasturchilar uchun — SDK va integratsiya | Med1.uz",
    description: "Med1.uz SDK'lari (JS, Python, PHP, Kotlin, Swift, Flutter) va integratsiya bo'yicha yo'riqnomalar.",
  },
  "/clinic-register": {
    title: "Klinikani ro'yxatdan o'tkazish | Med1.uz",
    description:
      "Klinikangizni Med1.uz platformasiga qo'shing: onlayn navbat, bemorlar oqimi va HMS boshqaruv tizimi imkoniyatlari.",
  },
  "/doctor-register": {
    title: "Shifokor sifatida ro'yxatdan o'tish | Med1.uz",
    description:
      "Shifokor profilini yarating, qabul jadvalini boshqaring va yangi bemorlarni onlayn qabul qiling.",
  },
  "/dental-register": {
    title: "Stomatologiya klinikasini ro'yxatdan o'tkazish | Med1.uz",
    description: "Stomatologiya klinikangiz uchun raqamli boshqaruv, bemor kartalari va onlayn navbat tizimi.",
  },
  "/pharmacy-register": {
    title: "Dorixonani ro'yxatdan o'tkazish | Med1.uz",
    description: "Dorixonangizni platformaga qo'shing: dori qidiruvida ko'rinish va mijozlar oqimini oshirish.",
  },
  "/diagnostics-register": {
    title: "Diagnostika markazini ro'yxatdan o'tkazish | Med1.uz",
    description: "Diagnostika markazingiz uchun onlayn navbat, natijalarni yuborish va bemorlar bazasi.",
  },
  "/maternity-register": {
    title: "Tug'ruqxonani ro'yxatdan o'tkazish | Med1.uz",
    description: "Perinatal markaz va tug'ruqxonalar uchun ro'yxatdan o'tish hamda boshqaruv tizimi.",
  },
  "/cosmetology-register": {
    title: "Kosmetologiya markazini ro'yxatdan o'tkazish | Med1.uz",
    description: "Kosmetologiya klinikangizni platformaga qo'shing va mijozlarni onlayn qabul qiling.",
  },
  "/vendor-register": {
    title: "Tibbiy texnika yetkazib beruvchi sifatida ro'yxatdan o'tish",
    description: "Tibbiy uskunalar va sarf materiallari yetkazib beruvchilar uchun katalogga qo'shilish.",
  },
  "/blood-donor-register": {
    title: "Qon donori bo'lib ro'yxatdan o'tish | Med1.uz",
    description: "Donorlar bazasiga qo'shiling: shoshilinch qon kerak bo'lganda sizga xabar yuboriladi.",
  },
};

export function RouteMeta() {
  const { pathname } = useLocation();
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const meta = ROUTE_META[key];
  if (!meta) return null;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE}${key}`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
}

export default RouteMeta;
