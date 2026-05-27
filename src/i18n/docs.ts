/**
 * Centralised UZ/RU/EN content for all legal documents,
 * cookie consent and the user guide.
 *
 * Renderers (PrivacyPage, TermsPage, DisclaimerPage, SaasTermsPage,
 * ReferralTermsPage, UserGuidePage, CookieConsent) read from here
 * via the current language.
 */
import type { SupportedLanguage } from "@/i18n/config";

export type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: Array<string | { bold: string; text: string }>;
};

export type LegalDoc = {
  back: string;
  title: string;
  subtitle: string;
  sections: Section[];
};

export type DisclaimerDoc = {
  back: string;
  title: string;
  subtitle: string;
  alertTitle: string;
  alertText: string; // may contain <b>...</b>
  decisionTitle: string;
  decisionPoints: string[];
  liabilityTitle: string;
  liabilityText: string;
};

export type CookiesDoc = {
  title: string;
  description: string; // {link} placeholder
  privacyLinkLabel: string;
  necessary: string;
  necessaryDesc: string;
  analytics: string;
  analyticsDesc: string;
  marketing: string;
  marketingDesc: string;
  acceptAll: string;
  settings: string;
  saveSelected: string;
  reject: string;
};

export type GuideEntry = { title: string; paragraphs?: string[]; items?: { label: string; desc: string }[]; steps?: string[] };
export type LegalPoints = { title: string; points: string[] };

export type UserGuideDoc = {
  back: string;
  title: string;
  subtitle: string;
  intro: string;
  nav: { guide: string; ai: string; privacy: string; faq: string };
  guideTitle: string;
  guide: GuideEntry[];
  aiTitle: string;
  aiSections: GuideEntry[];
  downloadTitle: string;
  downloadIntro: string;
  downloadItems: string[];
  legalTitle: string;
  criticalTitle: string;
  criticalBody: string;
  criticalEm: string;
  legalSections: LegalPoints[];
  privacyTitle: string;
  privacyIntro: string;
  privacySections: LegalPoints[];
  thirdPartyTitle: string;
  thirdPartyPoints: string[];
  ipTitle: string;
  ipPoints: string[];
  changesTitle: string;
  changesPoints: string[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  consentTitle: string;
  consentBody: string;
  lastUpdated: string;
  contactTitle: string;
  contactDesc: string;
  source: string;
};

export type Docs = {
  privacy: LegalDoc;
  terms: LegalDoc;
  disclaimer: DisclaimerDoc;
  saasTerms: LegalDoc & { badge: string; intro: string };
  referralTerms: LegalDoc & { backToReferral: string; lastUpdated: string; copyright: string };
  cookies: CookiesDoc;
  userGuide: UserGuideDoc;
};

/* ───────────────────────── UZBEK ───────────────────────── */
const uz: Docs = {
  privacy: {
    back: "Bosh sahifa",
    title: "Maxfiylik siyosati",
    subtitle: "Sizning shaxsiy va tibbiy maʼlumotlaringiz qanday himoya qilinishi va ishlatilishi.",
    sections: [
      {
        title: "1. Yigʻiladigan maʼlumotlar",
        bullets: [
          { bold: "Hisob maʼlumotlari:", text: "ism, telefon, email, parol (xeshlangan)." },
          { bold: "Tibbiy maʼlumotlar:", text: "tashxislar, analiz natijalari, retseptlar — faqat foydalanuvchi yoki uning shifokori kiritsa." },
          { bold: "Tashkilot maʼlumotlari:", text: "INN/STIR, manzil, litsenziya raqami." },
          { bold: "Texnik:", text: "IP, brauzer turi, cookie (statistika va xavfsizlik uchun)." },
        ],
      },
      {
        title: "2. Maʼlumotlar himoyasi",
        bullets: [
          "Barcha maʼlumotlar Supabase (PostgreSQL) infratuzilmasida shifrlangan holda saqlanadi.",
          "Row-Level Security (RLS) orqali har bir foydalanuvchi faqat oʻziga tegishli yozuvlarni koʻradi.",
          "Parollar bcrypt algoritmi bilan xeshlanadi; ochiq parolni tizimda koʻrib boʻlmaydi.",
          "5 marta muvaffaqiyatsiz kirishdan keyin hisob 10 daqiqaga bloklanadi.",
          "Backupʼlar har kuni avtomatik amalga oshiriladi.",
        ],
      },
      {
        title: "3. Maʼlumotlar kim bilan boʻlishiladi",
        paragraphs: ["Hech qachon maʼlumotlaringizni reklama maqsadida sotmaymiz. Cheklangan holda ulashamiz:"],
        bullets: [
          "Tanlagan klinika/shifokor (band qilish jarayonida).",
          "Toʻlov provayderi (Click, Payme — faqat toʻlov uchun zarur maʼlumot).",
          "Davlat organlari — qonunchilik talab qilgan holatlarda.",
        ],
      },
      {
        title: "4. Foydalanuvchi huquqlari",
        bullets: [
          "Shaxsiy maʼlumotlarni koʻrish, tahrirlash va oʻchirish.",
          "Hisobni butunlay oʻchirish (maʼlumotlar 30 kun ichida tizimdan oʻchiriladi).",
          "Email/SMS xabarnomalardan voz kechish.",
        ],
      },
      {
        title: "5. Cookie va analitika",
        paragraphs: ["Tizim foydalanuvchi tajribasini yaxshilash uchun cookie ishlatadi. Brauzer sozlamalaridan oʻchirish mumkin, lekin ayrim funksiyalar ishlamasligi mumkin."],
      },
      {
        title: "6. Aloqa",
        paragraphs: ["Maxfiylik boʻyicha savollar: privacy@med1.uz"],
      },
    ],
  },
  terms: {
    back: "Bosh sahifa",
    title: "Foydalanish shartlari",
    subtitle: "Med1.uz platformasidan foydalanish qoidalari. Oxirgi yangilanish: 2026-yil aprel.",
    sections: [
      {
        title: "1. Umumiy qoidalar",
        paragraphs: [
          "Med1.uz — bu Oʻzbekiston Respublikasi tibbiy axborot platformasi boʻlib, foydalanuvchilarga klinika, shifokor, dorixona, diagnostika markazlari va sunʼiy intellekt asosidagi yordamchi xizmatlarni taqdim etadi.",
          "Tizimdan foydalanish orqali siz ushbu shartlarga toʻliq rozilik bildirgan hisoblanasiz.",
        ],
      },
      {
        title: "2. Med1.uz faqat vositachi platforma",
        paragraphs: ["Muhim: Med1.uz tibbiy muassasa emas. Platforma faqat klinikalar, shifokorlar va bemorlar oʻrtasidagi axborot almashinuvini taʼminlaydi."],
        bullets: [
          "Tibbiy tashxis va davolash uchun javobgarlik shifokor/klinikaning oʻzida.",
          "Platformada joylangan AI natijalari faqat maʼlumot maqsadida boʻlib, tibbiy qaror oʻrnini bosmaydi.",
          "Klinikalar va shifokorlar oʻz lisenziyalari va malakalarini mustaqil tasdiqlaydi.",
        ],
      },
      {
        title: "3. SaaS obuna qoidalari",
        paragraphs: ["Tashkilot va shifokorlar uchun obuna tariflari mavjud (Free, Starter, Pro, Enterprise). Har bir modul alohida obunalanadi."],
        bullets: [
          "Toʻlov amalga oshirilmaganda yoki muddati tugaganda — modulning kengaytirilgan funksiyalari avtomatik bloklanadi.",
          "Obunani istalgan vaqtda bekor qilish mumkin; foydalanilgan davr uchun mablagʻ qaytarilmaydi.",
          "Tariflar va limitlar oldindan ogohlantirish bilan oʻzgartirilishi mumkin.",
        ],
      },
      {
        title: "4. Foydalanuvchi majburiyatlari",
        bullets: [
          "Roʻyxatdan oʻtishda toʻgʻri va haqiqiy maʼlumotlarni kiritish.",
          "Boshqalarning shaxsiy yoki tibbiy maʼlumotlarini ruxsatsiz ishlatmaslik.",
          "Tizim xavfsizligiga zarar yetkazadigan harakatlar (DDoS, scraping, injection) qilmaslik.",
          "Tizimdan firibgarlik, soxta retsept yoki noqonuniy maqsadlarda foydalanmaslik.",
        ],
      },
      {
        title: "5. Javobgarlikni cheklash",
        paragraphs: ["Med1.uz platformasi quyidagilar uchun javobgar emas:"],
        bullets: [
          "Klinika, shifokor yoki dorixona koʻrsatgan xizmat sifati.",
          "AI tahlillari asosida qabul qilingan tibbiy qarorlar.",
          "Foydalanuvchining notoʻgʻri kiritgan maʼlumotlari natijasidagi xatoliklar.",
          "Uchinchi tomon toʻlov tizimlari (Click, Payme) ishidagi muammolar.",
        ],
      },
      { title: "6. Aloqa", paragraphs: ["Savollar uchun: info@med1.uz"] },
    ],
  },
  disclaimer: {
    back: "Bosh sahifa",
    title: "Tibbiy ogohlantirish (Disclaimer)",
    subtitle: "Med1.uz dagi AI va axborot xizmatlari — maʼlumot uchun, tashxis emas.",
    alertTitle: "Eng muhim!",
    alertText: "Ushbu sunʼiy intellekt tahlillari va platformadagi axborot <b>faqat maʼlumot maqsadida</b> taqdim etiladi va <b>yakuniy tibbiy tashxis hisoblanmaydi</b>. Aniq tashxis va davolanish uchun malakali shifokor bilan maslahatlashish shart.",
    decisionTitle: "Yakuniy qaror — shifokorda",
    decisionPoints: [
      "AI Erta Diagnostika, AI Doktor Chat va boshqa AI xizmatlar — yoʻnaltiruvchi maslahat beruvchi vositadir.",
      "Hech qanday AI natijasini doridarmon yoki davolash sifatida qabul qilmang.",
      "Shoshilinch holatlarda — 103 raqamiga qoʻngʻiroq qiling.",
      "Surunkali kasalliklar va doimiy dorivor moddalar uchun shifokoringiz nazorati majburiy.",
    ],
    liabilityTitle: "Med1.uz javobgarligi",
    liabilityText: "Med1.uz vositachi platforma sifatida AI yoki klinikalar taqdim etgan maʼlumotlar toʻgʻriligi va ulardan foydalanish oqibatlari uchun javobgar emas. Foydalanuvchi tizimdan oʻz xohish-irodasi va masʼuliyati bilan foydalanadi.",
  },
  saasTerms: {
    back: "Bosh sahifa",
    badge: "SaaS HMS — Pullik xizmatlar",
    title: "SaaS HMS Foydalanish shartlari",
    subtitle: "",
    intro: "Ushbu hujjat <b>faqat pullik SaaS HMS xizmatlari</b> uchun amal qiladi va asosiy sayt qoidalaridan alohida hujjat hisoblanadi.",
    sections: [
      {
        title: "1. Hujjatning maqsadi va doirasi",
        paragraphs: [
          "Ushbu shartlar Med1.uz platformasidagi pullik SaaS HMS modullari (Klinika HMS, Diagnostika LIS, Stomatologiya, Tugʻruqxona, Kosmetologiya, Dorixona, Shifokor kabineti va h.k.) uchun amal qiladi.",
          "Asosiy sayt qoidalari (Global Terms) oʻzgarmaydi va barcha foydalanuvchilarga tegishli boʻlib qoladi.",
        ],
      },
      {
        title: "2. Obuna va toʻlovlar",
        bullets: [
          { bold: "Tariflar:", text: "Free, Starter, Pro, Enterprise — har bir modul uchun alohida." },
          "Toʻlovlar Click yoki Payme orqali oldindan amalga oshiriladi.",
          { bold: "Refund siyosati:", text: "Aktivlashtirilgan obuna uchun mablagʻ qaytarilmaydi. Foydalanilmagan davr uchun daʼvolar 7 ish kuni ichida koʻrib chiqiladi." },
          "Obuna avtomatik yangilanmaydi — har davr oxirida foydalanuvchi qayta toʻlovni amalga oshirishi shart.",
          "Toʻlov muddati oʻtib ketsa, kengaytirilgan funksiyalar avtomatik bloklanadi.",
        ],
      },
      {
        title: "3. Javobgarlikni cheklash",
        paragraphs: ["Med1.uz faqat texnik vositadir. Platforma:"],
        bullets: [
          "Tibbiy xizmat koʻrsatmaydi — xizmat klinika tomonidan amalga oshiriladi.",
          "Tibbiy tashxis va davolanish toʻgʻriligi uchun javobgar emas.",
          "AI natijalari va avtomatik hisob-kitoblar uchun yakuniy masʼuliyat foydalanuvchida.",
          "Xizmat sifati, narx kelishmovchiliklari va shifokor harakatlari uchun javobgarlikni oʻz zimmasiga olmaydi.",
        ],
      },
      {
        title: "4. Nizolarni hal qilish",
        paragraphs: ["Klinika ↔ bemor oʻrtasidagi barcha nizolar platformadan tashqarida hal qilinadi:"],
        bullets: [
          "Birinchi navbatda — toʻgʻridan-toʻgʻri muzokara.",
          "Keyingi bosqich — Sogʻliqni saqlash vazirligi yoki Isteʼmolchilar huquqlarini himoya qilish boʻlimi.",
          "Yakuniy bosqich — sud tartibida (OʻzR qonunchiligi asosida).",
        ],
      },
      {
        title: "5. Maʼlumotlar masʼuliyati",
        bullets: [
          "Klinika kiritgan barcha maʼlumotlar (bemor kartochkasi, retsept, lab natijalari) uchun klinika toʻliq masʼul.",
          "Med1.uz maʼlumotlarni faqat saqlaydi va RLS himoyasini taʼminlaydi.",
          "Foydalanuvchi (klinika) oʻz maʼlumotlarining maxfiyligi va toʻgʻriligini taʼminlashi shart.",
        ],
      },
      {
        title: "6. Xizmatdan voz kechish",
        paragraphs: ["Med1.uz quyidagi hollarda obunani bekor qilish huquqini saqlab qoladi:"],
        bullets: [
          "Platformadan suiisteʼmol qilish (firibgarlik, soxta retsept, noqonuniy maʼlumot).",
          "Toʻlov majburiyatlarini bajarmaslik.",
          "Boshqa foydalanuvchilarga zarar yetkazish.",
        ],
      },
      {
        title: "7. Shartlarni qabul qilish",
        paragraphs: ["Pullik SaaS HMS xizmatini sotib olishdan oldin foydalanuvchi ushbu shartlarni elektron tarzda qabul qiladi. Qabul qilingan vaqt, IP-manzil va versiya audit logʻda saqlanadi."],
      },
      {
        title: "8. Aloqa",
        paragraphs: ["SaaS HMS: saas@med1.uz", "Yuridik: legal@med1.uz"],
      },
    ],
  },
  referralTerms: {
    back: "Bosh sahifa",
    backToReferral: "Referral dasturiga qaytish",
    title: "Referral dasturi shartlari",
    subtitle: "",
    lastUpdated: "Oxirgi yangilanish: 2026-yil 18-may",
    copyright: "© 2018–2026 MED-ALL AI SYSTEM MCHJ. Barcha huquqlar himoyalangan.",
    sections: [
      {
        title: "1. Umumiy qoidalar",
        paragraphs: [
          "Med1.uz referral dasturi roʻyxatdan oʻtgan barcha foydalanuvchilarga ochiq. Har bir foydalanuvchiga bitta noyob referral kod beriladi.",
          "Kod yordamida cheksiz miqdorda taklif yuborish mumkin.",
        ],
      },
      {
        title: "2. Bonuslar va hisob-kitob",
        paragraphs: ["Taklif qilingan foydalanuvchi obuna boʻlganidan soʻng quyidagi bonuslar avtomatik beriladi:"],
        bullets: [
          { bold: "Credits", text: "— Med1.uz hamyoniga qoʻshiladi (tier multiplier asosida)" },
          { bold: "Bonus oylar", text: "— joriy obunaga qoʻshiladi" },
          { bold: "AI credits", text: "— AI xizmatlari uchun ishlatiladi" },
        ],
      },
      {
        title: "3. Tier tizimi",
        paragraphs: ["4 ta tier mavjud: Bronze (0+), Silver (5+), Gold (15+), Platinum (40+). Har bir tier oʻz bonus multiplierʼiga ega (1×, 1.2×, 1.5×, 2×)."],
      },
      {
        title: "4. Taqiqlanadigan harakatlar",
        bullets: [
          "Self-referral (oʻzingizni oʻzingiz taklif qilish) — avtomatik bloklanadi",
          "Soxta akkountlar yaratish va spam",
          "Bir xil IP/qurilmadan koʻp akkount roʻyxatdan oʻtkazish",
          "Pul yoki tovar evaziga referral kod ulashish",
        ],
      },
      {
        title: "5. Cash-out va withdrawal",
        paragraphs: ["Platinum tier foydalanuvchilari toʻplangan creditsʼni naqd pulga aylantirish soʻrovini yuborishi mumkin. Soʻrov admin tomonidan koʻrib chiqiladi va 7 ish kuni ichida ijro etiladi."],
      },
      {
        title: "6. Oʻzgartirishlar",
        paragraphs: ["Med1.uz ushbu shartlarni istalgan vaqtda oʻzgartirish huquqini saqlab qoladi. Muhim oʻzgarishlar haqida foydalanuvchilarga in-app va email orqali xabar beriladi."],
      },
    ],
  },
  cookies: {
    title: "Cookie sozlamalari",
    description: "Biz saytda tajribangizni yaxshilash uchun cookie fayllaridan foydalanamiz. Batafsil maʼlumot uchun {link} sahifasini koʻring.",
    privacyLinkLabel: "Maxfiylik siyosati",
    necessary: "Zaruriy",
    necessaryDesc: "Sayt ishlashi uchun majburiy",
    analytics: "Analitika",
    analyticsDesc: "Saytni yaxshilash statistikasi",
    marketing: "Marketing",
    marketingDesc: "Shaxsiylashtirilgan reklamalar",
    acceptAll: "Hammasini qabul qilish",
    settings: "Sozlamalar",
    saveSelected: "Tanlanganni saqlash",
    reject: "Rad etish",
  },
  userGuide: {
    back: "Bosh sahifa",
    title: "Foydalanuvchi qoʻllanmasi",
    subtitle: "Foydalanish shartlari, maxfiylik siyosati va yuridik maʼlumotlar",
    intro: "Ushbu sahifada Med1.uz platformasidan foydalanish tartibi, AI xizmatlari qoʻllanmasi, maxfiylik siyosati, yuridik shartlar va javobgarlik chegaralari batafsil keltirilgan.",
    nav: { guide: "Qoʻllanma", ai: "AI xizmatlar", privacy: "Maxfiylik", faq: "FAQ" },
    guideTitle: "Platformadan foydalanish qoʻllanmasi",
    guide: [
      { title: "Med1.uz nima?", paragraphs: [
        "Med1.uz — Oʻzbekistonda tibbiy maʼlumotlarni raqamlashtirish maqsadida yaratilgan ochiq maʼlumot portali.",
        "Platformadagi barcha maʼlumotlar faqat umumiy taʼlim va maʼlumot berish maqsadida taqdim etiladi. Platforma tibbiy xizmat koʻrsatmaydi, diagnostika qilmaydi va davolamaydi.",
      ]},
      { title: "Roʻyxatdan oʻtish va shaxsiy kabinet", paragraphs: [
        "Platformadan toʻliq foydalanish uchun elektron pochta orqali roʻyxatdan oʻting va shaxsiy kabinetingizni yarating.",
        "Shaxsiy kabinetda AI tahlil natijalarini koʻrishingiz, tibbiy tarixingizni saqlashingiz, qabulga yozilishingiz va PDF hisobotlarni yuklab olishingiz mumkin.",
      ]},
      { title: "Platformadan qanday foydalanish", items: [
        { label: "Tibbiy ensiklopediya", desc: "20 000+ tibbiy atamani qidirib oʻqing." },
        { label: "Kasalliklar boʻlimi", desc: "Klassifikatsiya, belgilar va umumiy maʼlumot." },
        { label: "Klinikalar katalogi", desc: "Klinika, shifokor profillari va onlayn yozilish." },
        { label: "Diagnostika markazlari", desc: "MRT, KT, laboratoriya xizmatlari katalogi." },
        { label: "Dorixonalar", desc: "Dorixonalar katalogi va dori haqida umumiy maʼlumot." },
        { label: "Qon banklari", desc: "Qon banklari va donor sifatida roʻyxatdan oʻtish." },
        { label: "Tugʻruqxonalar", desc: "Tugʻruqxonalar katalogi va xizmatlari." },
        { label: "Kosmetologiya", desc: "Kosmetologiya markazlari va ularga yozilish." },
      ]},
      { title: "Qidiruv tizimi", paragraphs: [
        "Yuqori qismdagi qidiruv maydoniga soʻzni kiriting. Tizim mos natijalarni koʻrsatadi.",
        "AI aqlli qidiruv orqali tabiiy tilda savol berib aniq javob olishingiz mumkin.",
      ]},
    ],
    aiTitle: "AI xizmatlaridan foydalanish",
    aiSections: [
      { title: "AI Erta Diagnostika", steps: ["Simptomlaringizni kiriting", "AI ehtimoliy kasalliklar roʻyxatini koʻrsatadi", "Xavf darajasi va mos mutaxassis tavsiya etiladi", "Natijani PDF sifatida yuklab oling"] },
      { title: "AI Shifokor Chat", steps: ["Sogʻliq boʻyicha savolingizni yozing", "AI real vaqtda javob beradi", "Kerak boʻlsa mos mutaxassisga yoʻnaltiriladi", "Chat tarixi shaxsiy kabinetda saqlanadi"] },
      { title: "Analiz Natijalari Tahlili", steps: ["Lab natija faylini (PDF/rasm) yuklang", "AI koʻrsatkichlarni oʻqib normalar bilan solishtiradi", "Ehtimoliy sabablar va ICD-10 kodlari koʻrsatiladi", "Natijani PDF hisobotda yuklab oling"] },
      { title: "Sogʻliq Xavfi Prognozi", steps: ["Tana koʻrsatkichlarini kiriting", "AI kasallik xavfini hisoblaydi (0–100)", "Profilaktik tavsiyalar va tekshiruv jadvali beriladi", "Sogʻliq indeksi grafikda koʻrsatiladi"] },
      { title: "AI Radiologiya", steps: ["Rentgen, MRT yoki KT tasvirini yuklang", "AI patologik oʻzgarishlarni tahlil qiladi", "BIRADS/ACR klassifikatsiyasi koʻrsatiladi", "Tavsiya etilgan shifokor va qoʻshimcha tekshiruvlar"] },
      { title: "AI Sogʻliq Assistenti", steps: ["Sogʻliq boʻyicha istalgan savolni bering", "Simptom tahlili va analiz tushuntirish rejimlari", "Oʻzbek, rus yoki ingliz tilida muloqot", "Shaxsiy sogʻliq tavsiyalari"] },
    ],
    downloadTitle: "Natijalarni yuklab olish",
    downloadIntro: "Barcha AI tahlil natijalari sahifalarida 'Yuklab olish' tugmasi mavjud. Hisobotlar quyidagilarni oʻz ichiga oladi:",
    downloadItems: ["Foydalanuvchi maʼlumotlari", "Tekshiruv turi va sanasi", "AI tahlil natijalari", "Xavf darajasi", "Tavsiya etilgan shifokor", "Tibbiy ogohlantirish"],
    legalTitle: "Yuridik shartlar va javobgarlik",
    criticalTitle: "DIQQAT! Platformadan foydalanishdan oldin oʻqing",
    criticalBody: "Med1.uz platformasidan foydalanish orqali siz quyidagi shartlarni toʻliq qabul qilgan hisoblanasiz.",
    criticalEm: "Med1.uz TIBBIY MUASSASA EMAS va hech qanday tibbiy xizmat koʻrsatmaydi!",
    legalSections: [
      { title: "⚠️ Muhim ogohlantirish (Disclaimer)", points: [
        "Med1.uz platformasidagi BARCHA maʼlumotlar faqat umumiy taʼlim va maʼlumot maqsadida taqdim etiladi.",
        "Platformadagi hech qanday maʼlumot professional tibbiy maslahat, diagnostika yoki davolash tavsiyasi sifatida qabul qilinishi MUMKIN EMAS.",
        "Med1.uz tibbiy muassasa emas, litsenziyaga ega emas va tibbiy xizmat koʻrsatmaydi.",
        "AI tahlillari faqat tavsiya sifatida beriladi va yakuniy tashxis hisoblanmaydi.",
        "Maʼlumotlardan foydalanish natijasida yuzaga keladigan har qanday zarar uchun Med1.uz javobgar emas.",
        "Har qanday sogʻliq muammosi boʻyicha ALBATTA malakali shifokorga murojaat qiling.",
      ]},
      { title: "Javobgarlikni cheklash", points: [
        "Med1.uz platformasi va asoschilari maʼlumotlarning toʻliqligi yoki aniqligi uchun kafolat bermaydi.",
        "Foydalanuvchi platformadagi maʼlumotlardan oʻz xavf-xatari ostida foydalanadi.",
        "AI natijalari statistik ehtimollikka asoslanadi va individual holatda notoʻgʻri boʻlishi mumkin.",
        "Med1.uz hech qanday dori vositasini tayinlamaydi, sotmaydi yoki tavsiya qilmaydi.",
        "Klinika va dorixonalar haqidagi maʼlumotlar faqat informatsion xarakterda.",
      ]},
      { title: "Oʻz-oʻzini davolash haqida ogohlantirish", points: [
        "Platformadagi maʼlumotlar asosida OʻZ-OʻZINI DAVOLASH QATTIYAN MAN ETILADI.",
        "AI tahlil natijalari asosida oʻz-oʻzini davolash hayot uchun xavfli boʻlishi mumkin.",
        "Dori vositalarini shifokor tayinlamasdan qabul qilish xavfli boʻlishi mumkin.",
        "Har qanday simptom yoki kasallik boʻyicha faqat shifokorga murojaat qiling.",
      ]},
    ],
    privacyTitle: "Maxfiylik siyosati",
    privacyIntro: "Med1.uz foydalanuvchilarning shaxsiy va tibbiy maʼlumotlarini Oʻzbekiston Respublikasining 'Shaxsiy maʼlumotlar toʻgʻrisida'gi qonuniga muvofiq himoya qiladi.",
    privacySections: [
      { title: "Maʼlumot yigʻish va ishlash", points: [
        "Shaxsiy maʼlumotlar faqat xizmatlarni koʻrsatish va tahlil uchun ishlatiladi.",
        "AI tahlillari va laboratoriya natijalari faqat shaxsiy kabinetda saqlanadi.",
        "Roʻyxatdan oʻtish uchun email va telefon talab qilinadi.",
        "Tibbiy maʼlumotlar AI orqali tahlil qilinib foydalanuvchiga qaytariladi.",
      ]},
      { title: "Maʼlumotlarni himoya qilish", points: [
        "Barcha maʼlumotlar SSL/TLS bilan shifrlangan serverlarda saqlanadi.",
        "Foydalanuvchi roziligi olinganidan keyingina maʼlumotlar qayta ishlanadi.",
        "Row Level Security (RLS) orqali har bir foydalanuvchi faqat oʻz maʼlumotlarini koʻradi.",
        "Tibbiy hujjatlar maxfiy storageʼda saqlanadi va faqat egasiga ochiq.",
      ]},
      { title: "Uchinchi tomon bilan boʻlishish", points: [
        "Maʼlumotlar foydalanuvchi roziligi bilan klinika/shifokor bilan almashilishi mumkin.",
        "Reklama yoki marketing uchun shaxsiy maʼlumotlar HECH QACHON uchinchi shaxslarga berilmaydi.",
        "Anonim statistik maʼlumotlar platforma sifatini yaxshilash uchun ishlatilishi mumkin.",
        "Qonun talab qilgan hollarda davlat organlariga maʼlumot berilishi mumkin.",
      ]},
      { title: "Cookie va texnik maʼlumotlar", points: [
        "Sayt ishlashi uchun texnik cookie fayllaridan foydalaniladi.",
        "Autentifikatsiya sessiyasini saqlash uchun cookie ishlatiladi.",
        "Foydalanuvchi brauzer sozlamalari orqali cookieʼlarni boshqarishi mumkin.",
        "Analitik cookieʼlar faqat anonim statistika uchun ishlatiladi.",
      ]},
      { title: "Foydalanuvchi huquqlari", points: [
        "Shaxsiy maʼlumotlarni koʻrish, tahrirlash va oʻchirish.",
        "AI natijalarini PDF formatda yuklab olish.",
        "Shaxsiy kabinetdagi barcha maʼlumotlarni boshqarish.",
        "Platformadan foydalanishni istalgan vaqtda toʻxtatish.",
      ]},
    ],
    thirdPartyTitle: "Uchinchi tomon resurslari",
    thirdPartyPoints: [
      "Platformada uchinchi tomon saytlariga havolalar boʻlishi mumkin. Med1.uz ularning mazmuni uchun javobgar emas.",
      "Klinika, dorixona va diagnostika markazlari haqidagi maʼlumotlar shu muassasalar tomonidan taqdim etilgan boʻlishi mumkin.",
      "Med1.uz uchinchi tomon xizmatlari sifati va natijalari uchun kafolat bermaydi.",
    ],
    ipTitle: "Intellektual mulk huquqlari",
    ipPoints: [
      "Platformadagi barcha kontent (matn, rasm, dizayn, kod) Med1.uz intellektual mulki hisoblanadi.",
      "Maʼlumotlarni manba koʻrsatmasdan nusxalash yoki tijorat maqsadlarida foydalanish taqiqlanadi.",
      "Tibbiy maqolalar ochiq manbalardan olingan, mualliflik huquqi tegishli mualliflarga tegishlidir.",
    ],
    changesTitle: "Oʻzgartirishlar kiritish huquqi",
    changesPoints: [
      "Med1.uz istalgan vaqtda shartlarni va maxfiylik siyosatini oldindan ogohlantirishsiz oʻzgartirish huquqini saqlaydi.",
      "Foydalanishni davom ettirish orqali foydalanuvchi barcha oʻzgarishlarni qabul qilgan hisoblanadi.",
    ],
    faqTitle: "Koʻp beriladigan savollar (FAQ)",
    faq: [
      { q: "AI tahlil natijalari ishonchli mi?", a: "AI tahlillari statistik ehtimollikka asoslangan, yakuniy tashxis EMAS. Aniq tashxis uchun shifokorga murojaat qiling." },
      { q: "Shaxsiy maʼlumotlarim xavfsizmi?", a: "Ha, barcha maʼlumotlar shifrlangan serverlarda. Har bir foydalanuvchi faqat oʻz maʼlumotlarini koʻradi." },
      { q: "PDF hisobotni qanday yuklab olaman?", a: "Har bir AI tahlil natijasi sahifasida 'Yuklab olish' tugmasi mavjud." },
      { q: "AI xizmatlardan foydalanish pullik mi?", a: "Asosiy AI xizmatlari bepul. Kengaytirilgan funksiyalar uchun premium tariflar mavjud." },
      { q: "Xatolik yuz berganda nima qilishim kerak?", a: "info@med1.uz yoki @med1uz Telegramga murojaat qiling." },
      { q: "AI natijalarni shifokorga koʻrsata olaman mi?", a: "Ha, PDF hisobotni yuklab olib shifokoringizga koʻrsatishingiz mumkin." },
    ],
    consentTitle: "Foydalanish shartlariga rozilik",
    consentBody: "Med1.uz platformasidan foydalanish orqali siz yuqoridagi barcha shartlarni oʻqiganingizni, tushunganingizni va qabul qilganingizni tasdiqlaysiz. AI tahlillari yakuniy tashxis emas.",
    lastUpdated: "Oxirgi yangilangan sana: 2026-yil, 8-mart",
    contactTitle: "Aloqa",
    contactDesc: "Savollar, takliflar yoki shikoyatlar boʻyicha biz bilan bogʻlaning:",
    source: "Maʼlumot manbasi: med1.uz",
  },
};

/* ───────────────────────── RUSSIAN ───────────────────────── */
const ru: Docs = {
  privacy: {
    back: "Главная",
    title: "Политика конфиденциальности",
    subtitle: "Как мы защищаем и используем ваши персональные и медицинские данные.",
    sections: [
      {
        title: "1. Собираемые данные",
        bullets: [
          { bold: "Данные аккаунта:", text: "имя, телефон, email, пароль (хешированный)." },
          { bold: "Медицинские данные:", text: "диагнозы, результаты анализов, рецепты — только при вводе пользователем или врачом." },
          { bold: "Данные организации:", text: "ИНН, адрес, номер лицензии." },
          { bold: "Технические:", text: "IP, тип браузера, cookie (для статистики и безопасности)." },
        ],
      },
      {
        title: "2. Защита данных",
        bullets: [
          "Все данные хранятся в зашифрованном виде в инфраструктуре Supabase (PostgreSQL).",
          "Row-Level Security (RLS) обеспечивает доступ пользователя только к своим записям.",
          "Пароли хешируются алгоритмом bcrypt — открытый пароль в системе не виден.",
          "После 5 неудачных входов аккаунт блокируется на 10 минут.",
          "Резервное копирование выполняется ежедневно автоматически.",
        ],
      },
      {
        title: "3. С кем мы делимся данными",
        paragraphs: ["Мы никогда не продаём ваши данные в рекламных целях. В ограниченных случаях мы делимся ими:"],
        bullets: [
          "С выбранной клиникой/врачом (при записи на приём).",
          "С платёжным провайдером (Click, Payme — только данные, необходимые для оплаты).",
          "С государственными органами — когда этого требует закон.",
        ],
      },
      {
        title: "4. Права пользователя",
        bullets: [
          "Просмотр, редактирование и удаление личных данных.",
          "Полное удаление аккаунта (данные удаляются в течение 30 дней).",
          "Отказ от email/SMS уведомлений.",
        ],
      },
      {
        title: "5. Cookie и аналитика",
        paragraphs: ["Система использует cookie для улучшения пользовательского опыта. Их можно отключить в настройках браузера, но некоторые функции могут не работать."],
      },
      { title: "6. Контакты", paragraphs: ["Вопросы по конфиденциальности: privacy@med1.uz"] },
    ],
  },
  terms: {
    back: "Главная",
    title: "Условия использования",
    subtitle: "Правила использования платформы Med1.uz. Последнее обновление: апрель 2026.",
    sections: [
      {
        title: "1. Общие положения",
        paragraphs: [
          "Med1.uz — медицинская информационная платформа Республики Узбекистан, предоставляющая пользователям клиники, врачей, аптеки, диагностические центры и ИИ-сервисы.",
          "Используя систему, вы полностью принимаете настоящие условия.",
        ],
      },
      {
        title: "2. Med1.uz — только посредническая платформа",
        paragraphs: ["Важно: Med1.uz не является медицинским учреждением. Платформа обеспечивает только обмен информацией между клиниками, врачами и пациентами."],
        bullets: [
          "Ответственность за диагностику и лечение несут врач/клиника.",
          "Результаты AI — только информационные, не заменяют медицинское решение.",
          "Клиники и врачи самостоятельно подтверждают свои лицензии и квалификацию.",
        ],
      },
      {
        title: "3. Правила SaaS-подписок",
        paragraphs: ["Для организаций и врачей доступны тарифы (Free, Starter, Pro, Enterprise). Каждый модуль оплачивается отдельно."],
        bullets: [
          "При неоплате или истечении срока расширенные функции модуля автоматически блокируются.",
          "Подписку можно отменить в любой момент; оплата за использованный период не возвращается.",
          "Тарифы и лимиты могут изменяться с предварительным уведомлением.",
        ],
      },
      {
        title: "4. Обязательства пользователя",
        bullets: [
          "Указывать корректные и реальные данные при регистрации.",
          "Не использовать чужие персональные или медицинские данные без разрешения.",
          "Не наносить вред безопасности системы (DDoS, scraping, injection).",
          "Не использовать систему для мошенничества, поддельных рецептов или иных незаконных целей.",
        ],
      },
      {
        title: "5. Ограничение ответственности",
        paragraphs: ["Платформа Med1.uz не несёт ответственности за:"],
        bullets: [
          "Качество услуг, оказываемых клиникой, врачом или аптекой.",
          "Медицинские решения, принятые на основе AI-анализа.",
          "Ошибки, вызванные некорректно введёнными пользователем данными.",
          "Проблемы в работе платёжных систем третьих лиц (Click, Payme).",
        ],
      },
      { title: "6. Контакты", paragraphs: ["По вопросам: info@med1.uz"] },
    ],
  },
  disclaimer: {
    back: "Главная",
    title: "Медицинский дисклеймер",
    subtitle: "AI и информационные сервисы Med1.uz — для справки, а не для постановки диагноза.",
    alertTitle: "Самое важное!",
    alertText: "Аналитика ИИ и информация на платформе предоставляются <b>исключительно в информационных целях</b> и <b>не являются окончательным медицинским диагнозом</b>. Для точного диагноза и лечения обязательно проконсультируйтесь с квалифицированным врачом.",
    decisionTitle: "Окончательное решение — за врачом",
    decisionPoints: [
      "AI-диагностика, AI-чат и другие AI-сервисы — только направляющий инструмент.",
      "Не принимайте результаты AI как назначение лекарств или лечение.",
      "В экстренных случаях звоните 103.",
      "При хронических заболеваниях и постоянном приёме лекарств наблюдение врача обязательно.",
    ],
    liabilityTitle: "Ответственность Med1.uz",
    liabilityText: "Med1.uz как посредническая платформа не несёт ответственности за точность данных, предоставленных AI или клиниками, и последствия их использования. Пользователь использует систему по собственному желанию и под свою ответственность.",
  },
  saasTerms: {
    back: "Главная",
    badge: "SaaS HMS — Платные услуги",
    title: "Условия использования SaaS HMS",
    subtitle: "",
    intro: "Этот документ действует <b>только для платных услуг SaaS HMS</b> и является отдельным от основных правил сайта.",
    sections: [
      {
        title: "1. Цель и область применения",
        paragraphs: [
          "Эти условия применяются к платным модулям SaaS HMS платформы Med1.uz (Клиника HMS, Диагностика LIS, Стоматология, Роддом, Косметология, Аптека, Кабинет врача и т. д.).",
          "Основные правила сайта (Global Terms) остаются в силе для всех пользователей.",
        ],
      },
      {
        title: "2. Подписка и платежи",
        bullets: [
          { bold: "Тарифы:", text: "Free, Starter, Pro, Enterprise — отдельно для каждого модуля." },
          "Оплата производится через Click или Payme заранее.",
          { bold: "Политика возврата:", text: "Возврат средств за активированную подписку не производится. Заявления за неиспользованный период рассматриваются в течение 7 рабочих дней." },
          "Подписка не продлевается автоматически — пользователь должен оплачивать заново.",
          "При просрочке оплаты расширенные функции автоматически блокируются.",
        ],
      },
      {
        title: "3. Ограничение ответственности",
        paragraphs: ["Med1.uz — только техническое средство. Платформа:"],
        bullets: [
          "Не оказывает медицинских услуг — услугу оказывает клиника.",
          "Не отвечает за корректность диагностики и лечения.",
          "Окончательная ответственность за результаты AI и автоматические расчёты лежит на пользователе.",
          "Не несёт ответственности за качество услуг, споры о ценах и действия врачей.",
        ],
      },
      {
        title: "4. Разрешение споров",
        paragraphs: ["Все споры между клиникой и пациентом решаются вне платформы:"],
        bullets: [
          "В первую очередь — прямые переговоры.",
          "Далее — Министерство здравоохранения или защита прав потребителей.",
          "Финальная стадия — суд (в соответствии с законодательством РУз).",
        ],
      },
      {
        title: "5. Ответственность за данные",
        bullets: [
          "За все данные, введённые клиникой (карта пациента, рецепт, лабораторные результаты), полностью отвечает клиника.",
          "Med1.uz только хранит данные и обеспечивает защиту RLS.",
          "Пользователь (клиника) обязан обеспечивать конфиденциальность и точность своих данных.",
        ],
      },
      {
        title: "6. Отказ в обслуживании",
        paragraphs: ["Med1.uz оставляет за собой право отменить подписку в следующих случаях:"],
        bullets: [
          "Злоупотребление платформой (мошенничество, поддельные рецепты, незаконные данные).",
          "Невыполнение платёжных обязательств.",
          "Нанесение вреда другим пользователям.",
        ],
      },
      {
        title: "7. Принятие условий",
        paragraphs: ["Перед покупкой SaaS HMS пользователь принимает условия в электронном виде. Время принятия, IP-адрес и версия сохраняются в audit log."],
      },
      { title: "8. Контакты", paragraphs: ["SaaS HMS: saas@med1.uz", "Юридические вопросы: legal@med1.uz"] },
    ],
  },
  referralTerms: {
    back: "Главная",
    backToReferral: "Назад к реферальной программе",
    title: "Условия реферальной программы",
    subtitle: "",
    lastUpdated: "Последнее обновление: 18 мая 2026",
    copyright: "© 2018–2026 MED-ALL AI SYSTEM MCHJ. Все права защищены.",
    sections: [
      {
        title: "1. Общие положения",
        paragraphs: [
          "Реферальная программа Med1.uz открыта для всех зарегистрированных пользователей. Каждому пользователю выдаётся уникальный реферальный код.",
          "С помощью кода можно отправлять неограниченное число приглашений.",
        ],
      },
      {
        title: "2. Бонусы и расчёт",
        paragraphs: ["После оформления подписки приглашённым пользователем автоматически начисляются бонусы:"],
        bullets: [
          { bold: "Credits", text: "— зачисляются на кошелёк Med1.uz (с учётом множителя тира)" },
          { bold: "Бонусные месяцы", text: "— добавляются к текущей подписке" },
          { bold: "AI credits", text: "— используются для AI-сервисов" },
        ],
      },
      {
        title: "3. Система тиров",
        paragraphs: ["Доступны 4 тира: Bronze (0+), Silver (5+), Gold (15+), Platinum (40+). У каждого свой множитель бонуса (1×, 1.2×, 1.5×, 2×)."],
      },
      {
        title: "4. Запрещённые действия",
        bullets: [
          "Самореферал — автоматически блокируется",
          "Создание фейковых аккаунтов и спам",
          "Регистрация множества аккаунтов с одного IP/устройства",
          "Обмен реферального кода на деньги или товары",
        ],
      },
      {
        title: "5. Cash-out и вывод",
        paragraphs: ["Пользователи тира Platinum могут запросить вывод накопленных credits в наличные. Заявка рассматривается администрацией и выполняется в течение 7 рабочих дней."],
      },
      {
        title: "6. Изменения",
        paragraphs: ["Med1.uz сохраняет право изменять условия в любой момент. О важных изменениях пользователи уведомляются in-app и email."],
      },
    ],
  },
  cookies: {
    title: "Настройки cookie",
    description: "Мы используем файлы cookie для улучшения работы сайта. Подробнее — на странице {link}.",
    privacyLinkLabel: "Политика конфиденциальности",
    necessary: "Необходимые",
    necessaryDesc: "Обязательны для работы сайта",
    analytics: "Аналитика",
    analyticsDesc: "Статистика для улучшения сайта",
    marketing: "Маркетинг",
    marketingDesc: "Персонализированная реклама",
    acceptAll: "Принять всё",
    settings: "Настройки",
    saveSelected: "Сохранить выбранное",
    reject: "Отклонить",
  },
  userGuide: {
    back: "Главная",
    title: "Руководство пользователя",
    subtitle: "Условия использования, политика конфиденциальности и юридическая информация",
    intro: "На этой странице подробно описаны порядок использования платформы Med1.uz, руководство по AI-сервисам, политика конфиденциальности, юридические условия и границы ответственности.",
    nav: { guide: "Руководство", ai: "AI-сервисы", privacy: "Конфиденциальность", faq: "FAQ" },
    guideTitle: "Руководство по использованию платформы",
    guide: [
      { title: "Что такое Med1.uz?", paragraphs: [
        "Med1.uz — открытый информационный портал для цифровизации медицинских данных в Узбекистане.",
        "Все материалы предоставляются только в общеобразовательных и информационных целях. Платформа не оказывает медицинских услуг, не ставит диагнозы и не назначает лечение.",
      ]},
      { title: "Регистрация и личный кабинет", paragraphs: [
        "Для полного доступа зарегистрируйтесь по email и создайте личный кабинет.",
        "В кабинете доступны: AI-анализы, медицинская история, запись на приём и скачивание PDF-отчётов.",
      ]},
      { title: "Как пользоваться платформой", items: [
        { label: "Медицинская энциклопедия", desc: "Поиск среди 20 000+ медицинских терминов." },
        { label: "Раздел заболеваний", desc: "Классификация, симптомы и общая информация." },
        { label: "Каталог клиник", desc: "Профили клиник и врачей, онлайн-запись." },
        { label: "Диагностические центры", desc: "МРТ, КТ, лаборатории и др." },
        { label: "Аптеки", desc: "Каталог аптек и информация о лекарствах." },
        { label: "Банки крови", desc: "Банки крови и регистрация донором." },
        { label: "Роддома", desc: "Каталог роддомов и их услуг." },
        { label: "Косметология", desc: "Косметологические центры и запись." },
      ]},
      { title: "Поиск", paragraphs: [
        "Введите запрос в поисковое поле наверху — система покажет подходящие результаты.",
        "AI-поиск позволяет задавать вопросы естественным языком и получать точный ответ.",
      ]},
    ],
    aiTitle: "Использование AI-сервисов",
    aiSections: [
      { title: "AI Ранняя диагностика", steps: ["Введите симптомы", "AI покажет список вероятных заболеваний", "Указываются риск и подходящий специалист", "Скачайте результат в PDF"] },
      { title: "AI Чат с врачом", steps: ["Задайте вопрос о здоровье", "AI отвечает в реальном времени", "При необходимости направляет к специалисту", "История чата сохраняется в кабинете"] },
      { title: "Анализ результатов лаборатории", steps: ["Загрузите файл анализов (PDF/изображение)", "AI сравнивает с нормами", "Показываются вероятные причины и коды ICD-10", "Скачайте PDF-отчёт"] },
      { title: "Прогноз риска здоровья", steps: ["Введите показатели тела", "AI рассчитывает риск (0–100)", "Профилактические рекомендации и график обследований", "Индекс здоровья на графике"] },
      { title: "AI Радиология", steps: ["Загрузите рентген, МРТ или КТ", "AI анализирует патологии", "Классификация BIRADS/ACR", "Рекомендации по врачу и дополнительным обследованиям"] },
      { title: "AI Ассистент здоровья", steps: ["Задайте любой вопрос", "Режимы анализа симптомов и интерпретации", "Общение на узбекском, русском или английском", "Персональные рекомендации"] },
    ],
    downloadTitle: "Скачивание результатов",
    downloadIntro: "На всех страницах с результатами AI доступна кнопка «Скачать». Отчёт включает:",
    downloadItems: ["Данные пользователя", "Тип и дата обследования", "Результаты AI-анализа", "Уровень риска", "Рекомендованный врач", "Медицинский дисклеймер"],
    legalTitle: "Юридические условия и ответственность",
    criticalTitle: "ВНИМАНИЕ! Прочитайте перед использованием платформы",
    criticalBody: "Используя платформу Med1.uz, вы полностью принимаете указанные условия.",
    criticalEm: "Med1.uz НЕ ЯВЛЯЕТСЯ медицинским учреждением и не оказывает медицинских услуг!",
    legalSections: [
      { title: "⚠️ Важное предупреждение (Disclaimer)", points: [
        "ВСЕ данные на платформе Med1.uz предоставляются только в общеобразовательных целях.",
        "Никакая информация на платформе НЕ может быть воспринята как профессиональная медицинская консультация, диагностика или лечение.",
        "Med1.uz не медицинское учреждение, не имеет лицензии и не оказывает медицинских услуг.",
        "AI-анализы даются только как рекомендация и не являются окончательным диагнозом.",
        "Med1.uz не несёт ответственности за любой ущерб от использования данных.",
        "По любым проблемам со здоровьем ОБЯЗАТЕЛЬНО обращайтесь к квалифицированному врачу.",
      ]},
      { title: "Ограничение ответственности", points: [
        "Med1.uz и его учредители не дают гарантий полноты и точности данных.",
        "Пользователь использует данные на свой страх и риск.",
        "Результаты AI основаны на статистической вероятности и могут быть неточны в индивидуальных случаях.",
        "Med1.uz не назначает, не продаёт и не рекомендует лекарства.",
        "Информация о клиниках и аптеках носит только информационный характер.",
      ]},
      { title: "Предупреждение о самолечении", points: [
        "САМОЛЕЧЕНИЕ на основе данных платформы СТРОГО ЗАПРЕЩАЕТСЯ.",
        "Самолечение на основе AI-результатов может быть опасным для жизни.",
        "Приём лекарств без назначения врача может быть опасным.",
        "По любому симптому обращайтесь только к врачу.",
      ]},
    ],
    privacyTitle: "Политика конфиденциальности",
    privacyIntro: "Med1.uz защищает персональные и медицинские данные пользователей в соответствии с Законом Республики Узбекистан «О персональных данных».",
    privacySections: [
      { title: "Сбор и обработка данных", points: [
        "Персональные данные используются только для оказания услуг и анализа.",
        "AI-анализы и лабораторные результаты хранятся только в личном кабинете.",
        "Для регистрации требуются email и телефон.",
        "Медицинские данные анализируются AI и возвращаются пользователю.",
      ]},
      { title: "Защита данных", points: [
        "Все данные хранятся на серверах с шифрованием SSL/TLS.",
        "Данные обрабатываются только после получения согласия пользователя.",
        "RLS обеспечивает доступ пользователя только к своим данным.",
        "Медицинские документы хранятся в защищённом storage и доступны только владельцу.",
      ]},
      { title: "Передача третьим лицам", points: [
        "Данные могут передаваться клинике/врачу с согласия пользователя.",
        "Персональные данные НИКОГДА не передаются третьим лицам в рекламных целях.",
        "Анонимные статистические данные могут использоваться для улучшения платформы.",
        "По требованию закона данные могут предоставляться государственным органам.",
      ]},
      { title: "Cookie и технические данные", points: [
        "Технические cookie используются для работы сайта.",
        "Cookie применяются для сохранения сессии аутентификации.",
        "Пользователь может управлять cookie через настройки браузера.",
        "Аналитические cookie используются только для анонимной статистики.",
      ]},
      { title: "Права пользователя", points: [
        "Просмотр, редактирование и удаление личных данных.",
        "Скачивание AI-результатов в PDF.",
        "Управление всеми данными в личном кабинете.",
        "Прекращение использования платформы в любое время.",
      ]},
    ],
    thirdPartyTitle: "Сторонние ресурсы",
    thirdPartyPoints: [
      "На платформе могут быть ссылки на сторонние сайты. Med1.uz не несёт ответственности за их содержание.",
      "Информация о клиниках, аптеках и центрах может предоставляться самими учреждениями.",
      "Med1.uz не гарантирует качество и результаты услуг сторонних компаний.",
    ],
    ipTitle: "Права интеллектуальной собственности",
    ipPoints: [
      "Весь контент платформы (текст, изображения, дизайн, код) — интеллектуальная собственность Med1.uz.",
      "Копирование без указания источника или коммерческое использование запрещены.",
      "Медицинские статьи взяты из открытых источников; авторские права принадлежат соответствующим авторам.",
    ],
    changesTitle: "Право вносить изменения",
    changesPoints: [
      "Med1.uz сохраняет право изменять условия и политику в любое время без предварительного уведомления.",
      "Продолжая использование, пользователь принимает все изменения.",
    ],
    faqTitle: "Часто задаваемые вопросы (FAQ)",
    faq: [
      { q: "Достоверны ли результаты AI?", a: "Анализ AI основан на статистике и НЕ является окончательным диагнозом. Для точного диагноза обращайтесь к врачу." },
      { q: "Безопасны ли мои персональные данные?", a: "Да, все данные хранятся на серверах с шифрованием. Каждый пользователь видит только свои данные." },
      { q: "Как скачать PDF-отчёт?", a: "На каждой странице AI-результата есть кнопка «Скачать»." },
      { q: "AI-сервисы платные?", a: "Базовые AI-сервисы бесплатны. Для расширенных функций доступны премиум-тарифы." },
      { q: "Что делать при ошибке?", a: "Обратитесь на info@med1.uz или в Telegram @med1uz." },
      { q: "Можно ли показать AI-результаты врачу?", a: "Да, скачайте PDF и покажите врачу." },
    ],
    consentTitle: "Согласие с условиями",
    consentBody: "Используя платформу Med1.uz, вы подтверждаете, что прочитали, поняли и принимаете все условия. AI-анализы не являются окончательным диагнозом.",
    lastUpdated: "Последнее обновление: 8 марта 2026",
    contactTitle: "Контакты",
    contactDesc: "По вопросам, предложениям или жалобам свяжитесь с нами:",
    source: "Источник данных: med1.uz",
  },
};

/* ───────────────────────── ENGLISH ───────────────────────── */
const en: Docs = {
  privacy: {
    back: "Home",
    title: "Privacy Policy",
    subtitle: "How your personal and medical data is protected and used.",
    sections: [
      {
        title: "1. Data we collect",
        bullets: [
          { bold: "Account data:", text: "name, phone, email, password (hashed)." },
          { bold: "Medical data:", text: "diagnoses, lab results, prescriptions — only when entered by the user or their doctor." },
          { bold: "Organisation data:", text: "INN, address, license number." },
          { bold: "Technical:", text: "IP, browser, cookies (for analytics and security)." },
        ],
      },
      {
        title: "2. Data protection",
        bullets: [
          "All data is stored encrypted on Supabase (PostgreSQL) infrastructure.",
          "Row-Level Security (RLS) means each user can only access their own records.",
          "Passwords are hashed with bcrypt; plain passwords are never visible in the system.",
          "After 5 failed login attempts the account is locked for 10 minutes.",
          "Daily automated backups.",
        ],
      },
      {
        title: "3. Who we share data with",
        paragraphs: ["We never sell your data for advertising. We share it only in limited cases:"],
        bullets: [
          "The clinic/doctor you select (during booking).",
          "Payment provider (Click, Payme — only the data needed for payment).",
          "Government authorities — when required by law.",
        ],
      },
      {
        title: "4. User rights",
        bullets: [
          "View, edit and delete personal data.",
          "Delete the account entirely (data is purged within 30 days).",
          "Opt out of email/SMS notifications.",
        ],
      },
      {
        title: "5. Cookies and analytics",
        paragraphs: ["We use cookies to improve user experience. They can be disabled in your browser, but some features may not work."],
      },
      { title: "6. Contact", paragraphs: ["Privacy questions: privacy@med1.uz"] },
    ],
  },
  terms: {
    back: "Home",
    title: "Terms of Use",
    subtitle: "Rules for using the Med1.uz platform. Last updated: April 2026.",
    sections: [
      {
        title: "1. General",
        paragraphs: [
          "Med1.uz is a medical information platform of the Republic of Uzbekistan that provides users with clinics, doctors, pharmacies, diagnostic centres and AI-based assistant services.",
          "By using the system you fully accept these terms.",
        ],
      },
      {
        title: "2. Med1.uz is only an intermediary platform",
        paragraphs: ["Important: Med1.uz is not a medical institution. The platform only enables the exchange of information between clinics, doctors and patients."],
        bullets: [
          "Responsibility for diagnosis and treatment lies with the doctor/clinic.",
          "AI results on the platform are informational only and do not replace medical decisions.",
          "Clinics and doctors independently confirm their licenses and qualifications.",
        ],
      },
      {
        title: "3. SaaS subscription rules",
        paragraphs: ["Subscription tiers (Free, Starter, Pro, Enterprise) are available for organisations and doctors. Each module is subscribed separately."],
        bullets: [
          "If payment is missed or the period ends, the module's advanced features are automatically blocked.",
          "Subscriptions can be cancelled at any time; refunds are not issued for used periods.",
          "Tariffs and limits may change with prior notice.",
        ],
      },
      {
        title: "4. User obligations",
        bullets: [
          "Provide accurate and real information when registering.",
          "Do not use other people's personal or medical data without consent.",
          "Do not perform actions that harm system security (DDoS, scraping, injection).",
          "Do not use the system for fraud, fake prescriptions or unlawful purposes.",
        ],
      },
      {
        title: "5. Limitation of liability",
        paragraphs: ["Med1.uz is not responsible for:"],
        bullets: [
          "The quality of services provided by a clinic, doctor or pharmacy.",
          "Medical decisions made based on AI analysis.",
          "Errors caused by incorrect user input.",
          "Issues with third-party payment systems (Click, Payme).",
        ],
      },
      { title: "6. Contact", paragraphs: ["Questions: info@med1.uz"] },
    ],
  },
  disclaimer: {
    back: "Home",
    title: "Medical Disclaimer",
    subtitle: "AI and information services on Med1.uz are informational — not a diagnosis.",
    alertTitle: "Most important!",
    alertText: "AI analyses and information on the platform are provided <b>for informational purposes only</b> and <b>are not a final medical diagnosis</b>. Consult a qualified doctor for accurate diagnosis and treatment.",
    decisionTitle: "Final decision rests with the doctor",
    decisionPoints: [
      "AI Early Diagnosis, AI Doctor Chat and other AI services are guidance tools only.",
      "Never treat AI output as a prescription or treatment plan.",
      "In emergencies call 103.",
      "For chronic conditions and ongoing medication, your doctor's supervision is mandatory.",
    ],
    liabilityTitle: "Med1.uz responsibility",
    liabilityText: "As an intermediary platform, Med1.uz is not responsible for the accuracy of information provided by AI or clinics, or for the consequences of its use. Users use the system at their own discretion and responsibility.",
  },
  saasTerms: {
    back: "Home",
    badge: "SaaS HMS — Paid services",
    title: "SaaS HMS Terms of Service",
    subtitle: "",
    intro: "This document applies <b>only to paid SaaS HMS services</b> and is separate from the main site rules.",
    sections: [
      {
        title: "1. Purpose and scope",
        paragraphs: [
          "These terms apply to the paid SaaS HMS modules on Med1.uz (Clinic HMS, Diagnostics LIS, Dental, Maternity, Cosmetology, Pharmacy, Doctor cabinet, etc.).",
          "The main site rules (Global Terms) remain in force for all users.",
        ],
      },
      {
        title: "2. Subscription and payments",
        bullets: [
          { bold: "Tariffs:", text: "Free, Starter, Pro, Enterprise — separate for each module." },
          "Payments are made in advance via Click or Payme.",
          { bold: "Refund policy:", text: "No refund for activated subscriptions. Claims for unused periods are reviewed within 7 business days." },
          "Subscriptions do not renew automatically — the user must repay each period.",
          "If payment is overdue, advanced features are automatically blocked.",
        ],
      },
      {
        title: "3. Limitation of liability",
        paragraphs: ["Med1.uz is only a technical tool. The platform:"],
        bullets: [
          "Does not provide medical services — the clinic does.",
          "Is not responsible for the correctness of diagnosis and treatment.",
          "Final responsibility for AI results and automated calculations lies with the user.",
          "Does not take responsibility for service quality, price disputes or doctor actions.",
        ],
      },
      {
        title: "4. Dispute resolution",
        paragraphs: ["All disputes between the clinic and the patient are resolved outside the platform:"],
        bullets: [
          "First — direct negotiation.",
          "Next — Ministry of Health or Consumer Protection authority.",
          "Final — court (under Uzbekistan law).",
        ],
      },
      {
        title: "5. Data responsibility",
        bullets: [
          "The clinic is fully responsible for all data it enters (patient card, prescriptions, lab results).",
          "Med1.uz only stores data and provides RLS protection.",
          "The user (clinic) is responsible for the confidentiality and accuracy of its data.",
        ],
      },
      {
        title: "6. Service termination",
        paragraphs: ["Med1.uz reserves the right to cancel a subscription in the following cases:"],
        bullets: [
          "Platform abuse (fraud, fake prescriptions, unlawful data).",
          "Failure to meet payment obligations.",
          "Harming other users.",
        ],
      },
      {
        title: "7. Acceptance of terms",
        paragraphs: ["Before purchasing a paid SaaS HMS service, the user accepts these terms electronically. The acceptance time, IP and version are stored in the audit log."],
      },
      { title: "8. Contact", paragraphs: ["SaaS HMS: saas@med1.uz", "Legal: legal@med1.uz"] },
    ],
  },
  referralTerms: {
    back: "Home",
    backToReferral: "Back to referral program",
    title: "Referral program terms",
    subtitle: "",
    lastUpdated: "Last updated: May 18, 2026",
    copyright: "© 2018–2026 MED-ALL AI SYSTEM MCHJ. All rights reserved.",
    sections: [
      {
        title: "1. General",
        paragraphs: [
          "The Med1.uz referral program is open to all registered users. Each user gets one unique referral code.",
          "Unlimited invites can be sent using the code.",
        ],
      },
      {
        title: "2. Bonuses and accounting",
        paragraphs: ["After the invited user subscribes, the following bonuses are credited automatically:"],
        bullets: [
          { bold: "Credits", text: "— added to the Med1.uz wallet (with tier multiplier)" },
          { bold: "Bonus months", text: "— added to the current subscription" },
          { bold: "AI credits", text: "— used for AI services" },
        ],
      },
      {
        title: "3. Tier system",
        paragraphs: ["4 tiers exist: Bronze (0+), Silver (5+), Gold (15+), Platinum (40+). Each has its own bonus multiplier (1×, 1.2×, 1.5×, 2×)."],
      },
      {
        title: "4. Prohibited actions",
        bullets: [
          "Self-referral — automatically blocked",
          "Creating fake accounts and spam",
          "Registering many accounts from the same IP/device",
          "Trading the referral code for money or goods",
        ],
      },
      {
        title: "5. Cash-out and withdrawal",
        paragraphs: ["Platinum tier users may request a cash-out of accumulated credits. Requests are reviewed by admins and processed within 7 business days."],
      },
      {
        title: "6. Changes",
        paragraphs: ["Med1.uz reserves the right to change these terms at any time. Users are notified about important changes in-app and by email."],
      },
    ],
  },
  cookies: {
    title: "Cookie settings",
    description: "We use cookies to improve your experience. For details see the {link} page.",
    privacyLinkLabel: "Privacy Policy",
    necessary: "Necessary",
    necessaryDesc: "Required for site to work",
    analytics: "Analytics",
    analyticsDesc: "Stats to improve the site",
    marketing: "Marketing",
    marketingDesc: "Personalised advertising",
    acceptAll: "Accept all",
    settings: "Settings",
    saveSelected: "Save selected",
    reject: "Reject",
  },
  userGuide: {
    back: "Home",
    title: "User Guide",
    subtitle: "Terms of use, privacy policy and legal information",
    intro: "This page describes how to use the Med1.uz platform, AI service guidance, privacy policy, legal terms and limits of liability.",
    nav: { guide: "Guide", ai: "AI services", privacy: "Privacy", faq: "FAQ" },
    guideTitle: "Platform user guide",
    guide: [
      { title: "What is Med1.uz?", paragraphs: [
        "Med1.uz is an open information portal aiming to digitalize medical knowledge in Uzbekistan.",
        "All content is provided for general educational and informational purposes only. The platform does not provide medical services, diagnose or treat conditions.",
      ]},
      { title: "Registration and personal cabinet", paragraphs: [
        "For full access, register with your email and create a personal cabinet.",
        "In the cabinet you can view AI results, store medical history, book appointments and download PDF reports.",
      ]},
      { title: "How to use the platform", items: [
        { label: "Medical encyclopedia", desc: "Search over 20,000 medical terms." },
        { label: "Diseases section", desc: "Classification, symptoms and general information." },
        { label: "Clinic catalogue", desc: "Clinic and doctor profiles, online booking." },
        { label: "Diagnostic centres", desc: "MRI, CT, lab and other services." },
        { label: "Pharmacies", desc: "Pharmacy catalogue and drug information." },
        { label: "Blood banks", desc: "Blood banks and donor registration." },
        { label: "Maternity hospitals", desc: "Maternity catalogue and services." },
        { label: "Cosmetology", desc: "Cosmetology centres and booking." },
      ]},
      { title: "Search", paragraphs: [
        "Type a query in the top search bar — the system shows matching results.",
        "AI smart search lets you ask in natural language and get a precise answer.",
      ]},
    ],
    aiTitle: "Using AI services",
    aiSections: [
      { title: "AI Early Diagnosis", steps: ["Enter your symptoms", "AI lists likely conditions", "Risk level and matching specialist are suggested", "Download the result as PDF"] },
      { title: "AI Doctor Chat", steps: ["Ask a health question", "AI replies in real time", "If needed you're routed to the right specialist", "Chat history is saved in your cabinet"] },
      { title: "Lab result analysis", steps: ["Upload a lab file (PDF/image)", "AI compares values with normal ranges", "Possible causes and ICD-10 codes are shown", "Download the PDF report"] },
      { title: "Health risk forecast", steps: ["Enter your body metrics", "AI computes a risk score (0–100)", "Preventive recommendations and check-up schedule", "Health index shown as a chart"] },
      { title: "AI Radiology", steps: ["Upload X-ray, MRI or CT", "AI analyses pathological changes", "BIRADS/ACR classification", "Recommended doctor and follow-up studies"] },
      { title: "AI Health Assistant", steps: ["Ask any health question", "Symptom analysis and report interpretation modes", "Communicate in Uzbek, Russian or English", "Personal health recommendations"] },
    ],
    downloadTitle: "Download results",
    downloadIntro: "All AI result pages have a 'Download' button. Reports include:",
    downloadItems: ["User data", "Test type and date", "AI analysis results", "Risk level", "Recommended doctor", "Medical disclaimer"],
    legalTitle: "Legal terms and liability",
    criticalTitle: "WARNING! Read before using the platform",
    criticalBody: "By using the Med1.uz platform you fully accept the following terms.",
    criticalEm: "Med1.uz IS NOT a medical institution and does not provide medical services!",
    legalSections: [
      { title: "⚠️ Important warning (Disclaimer)", points: [
        "ALL information on Med1.uz is provided for general educational and informational purposes only.",
        "None of the information on the platform may be taken as professional medical advice, diagnosis or treatment.",
        "Med1.uz is not a medical institution, has no license and does not provide medical services.",
        "AI analyses are recommendations only and are not a final diagnosis.",
        "Med1.uz is not liable for any damage resulting from use of the data.",
        "For any health concern ALWAYS consult a qualified doctor.",
      ]},
      { title: "Limitation of liability", points: [
        "Med1.uz and its founders give no warranty as to the completeness or accuracy of the data.",
        "Users use the data at their own risk.",
        "AI results are based on statistical probability and may be incorrect in individual cases.",
        "Med1.uz does not prescribe, sell or recommend any medication.",
        "Information about clinics and pharmacies is informational only.",
      ]},
      { title: "Self-treatment warning", points: [
        "SELF-TREATMENT based on platform data is STRICTLY PROHIBITED.",
        "Self-treatment based on AI results can be life-threatening.",
        "Taking medication without a doctor's prescription can be dangerous.",
        "For any symptom or condition, only consult a qualified doctor.",
      ]},
    ],
    privacyTitle: "Privacy policy",
    privacyIntro: "Med1.uz protects personal and medical data in line with the Republic of Uzbekistan's 'Personal Data' law.",
    privacySections: [
      { title: "Data collection and processing", points: [
        "Personal data is used only to provide services and analysis.",
        "AI analyses and lab results are stored only in the personal cabinet.",
        "Registration requires email and phone.",
        "Medical data is analysed by AI and returned to the user.",
      ]},
      { title: "Data protection", points: [
        "All data is stored on SSL/TLS-encrypted servers.",
        "Data is processed only after user consent.",
        "RLS ensures each user only sees their own data.",
        "Medical documents are stored in private storage, accessible only to the owner.",
      ]},
      { title: "Sharing with third parties", points: [
        "Data may be shared with a clinic/doctor with user consent.",
        "Personal data is NEVER shared with third parties for advertising.",
        "Anonymous statistical data may be used to improve the platform.",
        "Data may be provided to government authorities when required by law.",
      ]},
      { title: "Cookies and technical data", points: [
        "Technical cookies are used for the site to function.",
        "Cookies are used to keep auth sessions.",
        "Users can manage cookies via browser settings.",
        "Analytics cookies are used only for anonymous statistics.",
      ]},
      { title: "User rights", points: [
        "View, edit and delete personal data.",
        "Download AI results as PDF.",
        "Manage all data in the personal cabinet.",
        "Stop using the platform at any time.",
      ]},
    ],
    thirdPartyTitle: "Third-party resources",
    thirdPartyPoints: [
      "The platform may contain links to third-party sites. Med1.uz is not responsible for their content.",
      "Information about clinics, pharmacies and centres may be provided by those institutions themselves.",
      "Med1.uz does not guarantee the quality or results of third-party services.",
    ],
    ipTitle: "Intellectual property rights",
    ipPoints: [
      "All platform content (text, images, design, code) is the intellectual property of Med1.uz.",
      "Copying without attribution or using it for commercial purposes is prohibited.",
      "Medical articles are taken from open sources; authors' rights belong to the respective authors.",
    ],
    changesTitle: "Right to make changes",
    changesPoints: [
      "Med1.uz reserves the right to change the terms and privacy policy at any time without prior notice.",
      "By continuing to use the platform, the user accepts all changes.",
    ],
    faqTitle: "Frequently Asked Questions (FAQ)",
    faq: [
      { q: "Are AI results reliable?", a: "AI analyses are based on statistics and are NOT a final diagnosis. Consult a doctor for an accurate diagnosis." },
      { q: "Are my personal data safe?", a: "Yes, all data is stored encrypted. Each user only sees their own data." },
      { q: "How do I download the PDF report?", a: "Every AI result page has a 'Download' button." },
      { q: "Are AI services paid?", a: "Core AI services are free. Premium tariffs are available for extended features." },
      { q: "What should I do if an error occurs?", a: "Contact info@med1.uz or Telegram @med1uz." },
      { q: "Can I show AI results to my doctor?", a: "Yes, download the PDF and show it to your doctor." },
    ],
    consentTitle: "Consent to the terms",
    consentBody: "By using the Med1.uz platform you confirm that you have read, understood and accepted all of the above terms. AI analyses are not a final diagnosis.",
    lastUpdated: "Last updated: March 8, 2026",
    contactTitle: "Contact",
    contactDesc: "For questions, suggestions or complaints, get in touch:",
    source: "Source: med1.uz",
  },
};

const ALL: Record<SupportedLanguage, Docs> = { uz, ru, en };

export function getDocs(lang: SupportedLanguage): Docs {
  return ALL[lang] ?? ALL.uz;
}
