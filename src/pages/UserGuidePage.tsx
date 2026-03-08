import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Shield, AlertTriangle, Search, MousePointer,
  Smartphone, Globe, Lock, FileText, Scale, Users, Heart,
  CheckCircle, XCircle, Info, HelpCircle, Mail, ExternalLink,
  Brain, Stethoscope, Bot, HeartPulse, Eye, UserCheck,
  Activity, Download, Cookie, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

/* ===== DATA ===== */

const guideSections = [
  {
    id: "about",
    icon: BookOpen,
    title: "Med1.uz nima?",
    content: [
      "Med1.uz — O'zbekiston Respublikasida tibbiy ma'lumotlarni raqamlashtirish va ommalashtirish maqsadida yaratilgan ochiq ma'lumot portalidir.",
      "Platformada joylashtirilgan barcha ma'lumotlar FAQAT umumiy ta'lim va ma'lumot berish maqsadida taqdim etiladi. Platforma hech qanday tibbiy xizmat ko'rsatmaydi, diagnostika qilmaydi, davolamaydi va dori tayinlamaydi.",
    ],
  },
  {
    id: "registration",
    icon: Users,
    title: "Ro'yxatdan o'tish va shaxsiy kabinet",
    content: [
      "Platformadan to'liq foydalanish uchun elektron pochta orqali ro'yxatdan o'ting va shaxsiy kabinetingizni yarating.",
      "Shaxsiy kabinetda siz AI tahlil natijalarini ko'rishingiz, tibbiy tarixingizni saqlashingiz, qabulga yozilishingiz va PDF hisobotlarni yuklab olishingiz mumkin.",
    ],
  },
  {
    id: "how-to-use",
    icon: MousePointer,
    title: "Platformadan qanday foydalanish",
    items: [
      { label: "Tibbiy ensiklopediya", desc: "20,000+ tibbiy atama va tushunchalarni qidiring va o'qing. Atamalar alfavit tartibida joylashgan." },
      { label: "Kasalliklar bo'limi", desc: "Kasalliklar klassifikatsiyasi, belgilari va umumiy ma'lumotlarni ko'ring." },
      { label: "Klinikalar katalogi", desc: "Klinikalar haqida umumiy ma'lumot. Onlayn qabul yozilish va shifokor profillari." },
      { label: "Diagnostika markazlari", desc: "MRT, KT, laboratoriya va boshqa diagnostika xizmatlari katalogi." },
      { label: "Dorixonalar", desc: "Dorixonalar katalogi va dori haqida umumiy ma'lumot." },
      { label: "Qon banklari", desc: "Qon banklari haqida ma'lumot va donor sifatida ro'yxatdan o'tish." },
      { label: "Tug'ruqxonalar", desc: "Tug'ruqxonalar katalogi va xizmatlari haqida ma'lumot." },
      { label: "Kosmetologiya", desc: "Kosmetologiya markazlari va ularga yozilish." },
    ],
  },
  {
    id: "search",
    icon: Search,
    title: "Qidiruv tizimidan foydalanish",
    content: [
      "Saytning yuqori qismidagi qidiruv maydoniga kerakli so'zni kiriting. Tizim avtomatik ravishda mos natijalarni ko'rsatadi.",
      "AI aqlli qidiruv orqali tabiiy tilda savol berishingiz va aniq javob olishingiz mumkin.",
    ],
  },
];

const aiGuideSections = [
  {
    id: "ai-symptom",
    icon: Stethoscope,
    title: "AI Erta Diagnostika",
    steps: [
      "Simptomlaringizni kiriting (og'riq joyi, davomiyligi, kuchlanishi)",
      "AI ehtimoliy kasalliklar ro'yxatini ko'rsatadi",
      "Xavf darajasi va mos shifokor mutaxassisligi tavsiya etiladi",
      "Natijani PDF hisobot sifatida yuklab olishingiz mumkin",
    ],
  },
  {
    id: "ai-doctor",
    icon: Bot,
    title: "AI Shifokor Chat",
    steps: [
      "Sog'liq bo'yicha savolni yozing",
      "AI real vaqtda javob beradi",
      "Kerak bo'lsa, mos mutaxassisga yo'naltirilasiz",
      "Chat tarixi shaxsiy kabinetda saqlanadi",
    ],
  },
  {
    id: "ai-report",
    icon: FileText,
    title: "Analiz Natijalarini Tahlili",
    steps: [
      "Laboratoriya analiz faylini (PDF/rasm) yuklang",
      "AI ko'rsatkichlarni o'qiydi va normal diapazon bilan solishtiradi",
      "Ehtimoliy sabablar va ICD-10 kodlari ko'rsatiladi",
      "Natijalar PDF hisobotda yuklab olinadi",
    ],
  },
  {
    id: "ai-risk",
    icon: HeartPulse,
    title: "Sog'liq Xavfi Prognozi",
    steps: [
      "Tana ko'rsatkichlarini kiriting (yosh, vazn, bo'y, hayot tarzi)",
      "AI kasallik xavfini hisoblaydi (0-100 ball)",
      "Profilaktik tavsiyalar va tekshiruv jadvali beriladi",
      "Sog'liq indeksi grafik ko'rinishda ko'rsatiladi",
    ],
  },
  {
    id: "ai-radiology",
    icon: Eye,
    title: "AI Radiologiya",
    steps: [
      "Rentgen, MRT yoki KT tasvirini yuklang",
      "AI patologik o'zgarishlarni tahlil qiladi",
      "BIRADS/ACR klassifikatsiyasi ko'rsatiladi",
      "Tavsiya etilgan shifokor va qo'shimcha tekshiruvlar",
    ],
  },
  {
    id: "ai-assistant",
    icon: UserCheck,
    title: "AI Sog'liq Assistenti",
    steps: [
      "Sog'liq bo'yicha istalgan savolni bering",
      "Simptom tahlili, analiz tushuntirish rejimlarini tanlang",
      "O'zbek, rus yoki ingliz tilida muloqot qiling",
      "Shaxsiy sog'liq tavsiyalari oling",
    ],
  },
];

const legalSections = [
  {
    id: "disclaimer",
    icon: AlertTriangle,
    color: "bg-destructive",
    title: "⚠️ Muhim ogohlantirish (Disclaimer)",
    points: [
      "Med1.uz platformasida joylashtirilgan BARCHA ma'lumotlar faqat umumiy ta'lim va ma'lumot berish maqsadida taqdim etiladi.",
      "Platformadagi hech qanday ma'lumot professional tibbiy maslahat, diagnostika yoki davolash tavsiyasi sifatida qabul qilinishi MUMKIN EMAS.",
      "Med1.uz tibbiy muassasa emas, tibbiy litsenziyaga ega emas va tibbiy xizmat ko'rsatmaydi.",
      "AI tahlillari faqat tavsiya sifatida beriladi va yakuniy tashxis hisoblanmaydi.",
      "Platformadagi ma'lumotlardan foydalanish natijasida yuzaga kelishi mumkin bo'lgan har qanday zarar uchun Med1.uz javobgar emas.",
      "Har qanday sog'liq muammosi bo'yicha ALBATTA malakali shifokorga murojaat qiling.",
    ],
  },
  {
    id: "no-liability",
    icon: Shield,
    color: "bg-primary",
    title: "Javobgarlikni cheklash",
    points: [
      "Med1.uz platformasi va uning asoschilari, xodimlari, hamkorlari platformadagi ma'lumotlarning to'liqligi, aniqligi yoki dolzarbligi uchun hech qanday kafolat bermaydi.",
      "Foydalanuvchi platformadagi ma'lumotlardan o'z xavf-xatari ostida foydalanadi.",
      "AI xizmatlari natijalari statistik ehtimollikka asoslangan bo'lib, individual holatda noto'g'ri bo'lishi mumkin.",
      "Platforma ma'lumotlaridan noto'g'ri foydalanish natijasida yuzaga kelgan moddiy, ma'naviy yoki jismoniy zarar uchun Med1.uz javobgarlik tashimaydi.",
      "Med1.uz hech qanday dori vositasini tayinlamaydi, sotmaydi yoki tavsiya qilmaydi.",
      "Platformadagi klinikalar, dorixonalar va boshqa muassasalar haqidagi ma'lumotlar faqat informatsion xarakterda bo'lib, Med1.uz ular bilan shartnomaviy munosabatda emas.",
    ],
  },
  {
    id: "self-treatment",
    icon: XCircle,
    color: "bg-destructive",
    title: "O'z-o'zini davolash haqida ogohlantirish",
    points: [
      "Platformadagi ma'lumotlar asosida O'Z-O'ZINI DAVOLASH QATTIYAN MAN ETILADI.",
      "AI tahlil natijalari asosida o'z-o'zini davolash hayot uchun xavfli bo'lishi mumkin.",
      "Dori vositalarini shifokor tayinlamasdan qabul qilish hayot uchun xavfli bo'lishi mumkin.",
      "Har qanday simptom yoki kasallik bo'yicha faqat malakali tibbiy mutaxassisga murojaat qiling.",
      "Med1.uz o'z-o'zini davolash natijasida yuzaga kelgan oqibatlar uchun hech qanday javobgarlik tashimaydi.",
    ],
  },
];

const privacySections = [
  {
    id: "data-collection",
    icon: Activity,
    title: "Ma'lumot yig'ish va ishlash",
    points: [
      "Shaxsiy ma'lumotlar (ism, kontakt, tug'ilgan sana) faqat xizmatlarni ko'rsatish va tahlil qilish uchun ishlatiladi.",
      "AI tahlillari, simptomlar va laboratoriya natijalari faqat foydalanuvchining shaxsiy kabinetida saqlanadi.",
      "Ro'yxatdan o'tish uchun elektron pochta manzili va telefon raqami talab qilinadi.",
      "Tibbiy ma'lumotlar (analiz natijalari, simptomlar) AI xizmatlari orqali tahlil qilinadi va foydalanuvchiga qaytariladi.",
    ],
  },
  {
    id: "data-protection",
    icon: Lock,
    title: "Ma'lumotlarni himoya qilish",
    points: [
      "Barcha ma'lumotlar shifrlangan serverlarda (SSL/TLS) saqlanadi.",
      "Foydalanuvchi roziligi olinganidan keyingina ma'lumotlar qayta ishlanadi.",
      "Server monitoring va xavfsizlik choralariga muntazam rioya qilinadi.",
      "Row Level Security (RLS) orqali har bir foydalanuvchi faqat o'z ma'lumotlarini ko'ra oladi.",
      "Tibbiy hujjatlar maxfiy storage da saqlanadi va faqat egasiga ochiq.",
    ],
  },
  {
    id: "third-party-sharing",
    icon: ExternalLink,
    title: "Uchinchi tomon bilan bo'lishish",
    points: [
      "Foydalanuvchi ma'lumotlari uning roziligi bilan mos shifokor yoki klinika bilan almashilishi mumkin.",
      "Reklama yoki marketing maqsadlarida shaxsiy ma'lumotlar HECH QACHON uchinchi shaxslarga berilmaydi.",
      "Anonim statistik ma'lumotlar platforma sifatini yaxshilash uchun ishlatilishi mumkin.",
      "Qonun talab qilgan hollarda tegishli davlat organlariga ma'lumot berilishi mumkin.",
    ],
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "Cookie va texnik ma'lumotlar",
    points: [
      "Veb sayt ishlashi uchun texnik cookie fayllaridan foydalaniladi.",
      "Autentifikatsiya sessiyalarini saqlash uchun cookie ishlatiladi.",
      "Foydalanuvchi brauzer sozlamalari orqali cookie larni boshqarishi mumkin.",
      "Analitik cookie lar faqat anonim statistika yig'ish uchun ishlatilishi mumkin.",
    ],
  },
  {
    id: "user-rights",
    icon: Users,
    title: "Foydalanuvchi huquqlari",
    points: [
      "Shaxsiy ma'lumotlarni ko'rish, tahrirlash va o'chirish huquqi.",
      "AI natijalarini PDF formatda yuklab olish huquqi.",
      "Shaxsiy kabinetdagi barcha ma'lumotlarni to'liq boshqarish.",
      "Platformadan foydalanishni istalgan vaqtda to'xtatish huquqi.",
      "Ma'lumotlarning noto'g'riligini xabar qilish huquqi.",
    ],
  },
];

const faqData = [
  { q: "AI tahlil natijalari ishonchli mi?", a: "AI tahlillari statistik ehtimollikka asoslangan bo'lib, yakuniy tashxis EMAS. Natijalarni faqat ma'lumot sifatida qabul qiling va aniq tashxis uchun shifokorga murojaat qiling." },
  { q: "Shaxsiy ma'lumotlarim xavfsizmi?", a: "Ha, barcha ma'lumotlar shifrlangan serverlarda saqlanadi. Har bir foydalanuvchi faqat o'z ma'lumotlarini ko'ra oladi. Uchinchi shaxslarga rozilikingiz bilan almashiladi." },
  { q: "PDF hisobotni qanday yuklab olaman?", a: "Har bir AI tahlil natijasi sahifasida 'Yuklab olish' tugmasi mavjud. Shuningdek, shaxsiy kabinetdagi 'Hujjatlar' bo'limidan barcha natijalaringizni yuklab olishingiz mumkin." },
  { q: "AI xizmatlardan foydalanish pullik mi?", a: "Asosiy AI xizmatlari bepul. Kengaytirilgan funksiyalar uchun premium tariflar mavjud." },
  { q: "Xatolik yuz berganda nima qilishim kerak?", a: "info@med1.uz elektron pochtasiga yoki @med1uz Telegram kanaliga murojaat qiling. Texnik yordam jamoasi sizga yordam beradi." },
  { q: "AI natijalarni shifokorga ko'rsata olaman mi?", a: "Ha, PDF hisobotni yuklab olib, shifokoringizga ko'rsatishingiz mumkin. Ammo, shifokor o'z tekshiruvlari asosida yakuniy tashxis qo'yadi." },
];

/* ===== FAQ ITEM ===== */
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

/* ===== PAGE ===== */
const UserGuidePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-hero-gradient py-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Bosh sahifa
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">
                Foydalanuvchi qo'llanmasi
              </h1>
              <p className="text-primary-foreground/70 text-sm">Foydalanish shartlari, maxfiylik siyosati va yuridik ma'lumotlar</p>
            </div>
          </div>
          <p className="text-primary-foreground/80 max-w-2xl leading-relaxed">
            Ushbu sahifada Med1.uz platformasidan foydalanish tartibi, AI xizmatlari qo'llanmasi, maxfiylik siyosati, yuridik shartlar va javobgarlik chegaralari batafsil keltirilgan.
          </p>
        </div>
      </section>

      {/* Quick nav */}
      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Qo'llanma", href: "#guide", icon: MousePointer },
            { label: "AI xizmatlar", href: "#ai-guide", icon: Brain },
            { label: "Maxfiylik", href: "#privacy", icon: Lock },
            { label: "FAQ", href: "#faq", icon: HelpCircle },
          ].map((nav) => (
            <a
              key={nav.href}
              href={nav.href}
              className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2 hover:border-primary/30 transition-colors text-sm font-medium text-foreground"
            >
              <nav.icon className="w-4 h-4 text-primary" />
              {nav.label}
            </a>
          ))}
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-14">

          {/* === Qo'llanma === */}
          <div id="guide">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Platformadan foydalanish qo'llanmasi</h2>
            </div>

            <div className="space-y-6">
              {guideSections.map((sec) => (
                <div key={sec.id} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <sec.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg">{sec.title}</h3>
                  </div>
                  {sec.content && sec.content.map((p, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{p}</p>
                  ))}
                  {sec.items && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {sec.items.map((item) => (
                        <div key={item.label} className="bg-accent/50 rounded-xl p-4 border border-border">
                          <h4 className="text-sm font-semibold text-foreground mb-1">{item.label}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* === AI Xizmatlar Qo'llanmasi === */}
          <div id="ai-guide">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">AI xizmatlaridan foydalanish</h2>
            </div>

            <MedicalDisclaimer className="mb-6" />

            <div className="space-y-4">
              {aiGuideSections.map((sec) => (
                <div key={sec.id} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <sec.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg">{sec.title}</h3>
                  </div>
                  <ol className="space-y-2">
                    {sec.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            {/* PDF yuklab olish tushuntirish */}
            <div className="mt-6 bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-lg">Natijalarni yuklab olish</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Barcha AI tahlil natijalari sahifalarida "Yuklab olish" tugmasi mavjud. Hisobotlar quyidagilarni o'z ichiga oladi:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Foydalanuvchi ma'lumotlari",
                  "Tekshiruv turi va sanasi",
                  "AI tahlil natijalari",
                  "Xavf darajasi ko'rsatkichlari",
                  "Tavsiya etilgan shifokor",
                  "Tibbiy ogohlantirish",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* === Yuridik qism === */}
          <div id="legal">
            <div className="flex items-center gap-2 mb-6">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Yuridik shartlar va javobgarlik</h2>
            </div>

            {/* Critical Warning Banner */}
            <div className="bg-destructive/10 border-2 border-destructive/30 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-heading font-bold text-destructive text-lg mb-2">
                    DIQQAT! Ushbu platformadan foydalanishdan oldin o'qing
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed mb-3">
                    Med1.uz platformasidan foydalanish orqali siz quyidagi shartlarni to'liq qabul qilgan hisoblanasiz. Agar siz ushbu shartlarga rozi bo'lmasangiz, platformadan foydalanmasligingiz so'raladi.
                  </p>
                  <p className="text-sm font-semibold text-destructive">
                    Med1.uz TIBBIY MUASSASA EMAS va hech qanday tibbiy xizmat ko'rsatmaydi!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {legalSections.map((sec) => (
                <div key={sec.id} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${sec.color} flex items-center justify-center`}>
                      <sec.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg">{sec.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {sec.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* === Maxfiylik siyosati === */}
          <div id="privacy">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Maxfiylik siyosati</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Med1.uz foydalanuvchilarning shaxsiy va tibbiy ma'lumotlarini O'zbekiston Respublikasining "Shaxsiy ma'lumotlar to'g'risida"gi qonuniga muvofiq himoya qiladi.
            </p>

            <div className="space-y-6">
              {privacySections.map((sec) => (
                <div key={sec.id} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <sec.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg">{sec.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {sec.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* === Uchinchi tomon resurslari === */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg">Uchinchi tomon resurslari</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Platformada uchinchi tomon veb-saytlariga havolalar bo'lishi mumkin. Med1.uz bu saytlarning mazmuni uchun javobgar emas.",
                "Klinikalar, dorixonalar va diagnostika markazlari haqidagi ma'lumotlar ushbu muassasalarning o'zlari tomonidan taqdim etilgan bo'lishi mumkin.",
                "Med1.uz uchinchi tomon xizmatlari sifati, narxi yoki natijalari uchun kafolat bermaydi.",
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* === Intellektual mulk === */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg">Intellektual mulk huquqlari</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Platformadagi barcha kontent (matn, rasm, dizayn, kod) Med1.uz intellektual mulki hisoblanadi.",
                "Ma'lumotlarni manba ko'rsatmasdan nusxalash, tarqatish yoki tijorat maqsadlarida foydalanish taqiqlanadi.",
                "Tibbiy maqolalar va ma'lumotlar ochiq manbalardan olingan bo'lib, mualliflik huquqlari tegishli mualliflarga tegishlidir.",
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* === O'zgartirishlar === */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg">O'zgartirishlar kiritish huquqi</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Med1.uz istalgan vaqtda platformadagi ma'lumotlarni, foydalanish shartlarini va maxfiylik siyosatini oldindan ogohlantirishsiz o'zgartirish huquqini o'zida saqlaydi.",
                "Foydalanuvchi platformadan foydalanishni davom ettirish orqali barcha o'zgarishlarni qabul qilgan hisoblanadi.",
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* === FAQ === */}
          <div id="faq">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Ko'p beriladigan savollar (FAQ)</h2>
            </div>
            <div className="space-y-3">
              {faqData.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>

          {/* === Rozilik === */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-8 text-center">
            <Scale className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-3">
              Foydalanish shartlariga rozilik
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">
              Med1.uz platformasidan foydalanish orqali siz yuqoridagi barcha shartlarni o'qiganingizni, tushunganingizni va to'liq qabul qilganingizni tasdiqlaysiz. Platforma ma'lumotlari tibbiy maslahat o'rnini BOSMAYDI. AI tahlillari yakuniy tashxis emas. Har qanday sog'liq muammosi bo'yicha malakali shifokorga murojaat qiling.
            </p>
            <p className="text-xs text-muted-foreground">
              Oxirgi yangilangan sana: 2026-yil, 8-mart
            </p>
          </div>

          {/* Aloqa */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg">Aloqa</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Savollar, takliflar yoki shikoyatlar bo'yicha biz bilan bog'laning:
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:info@med1.uz" className="inline-flex items-center gap-2 bg-accent text-sm px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
                <Mail className="w-4 h-4" /> info@med1.uz
              </a>
              <a href="https://t.me/med1uz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent text-sm px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
                <ExternalLink className="w-4 h-4" /> Telegram
              </a>
            </div>
          </div>

          {/* Ma'lumot manbasi */}
          <p className="text-center text-xs text-muted-foreground">Ma'lumot manbasi: med1.uz</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserGuidePage;
