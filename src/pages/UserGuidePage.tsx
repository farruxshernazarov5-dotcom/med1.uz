import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Shield, AlertTriangle, Search, MousePointer,
  Smartphone, Globe, Lock, FileText, Scale, Users, Heart,
  CheckCircle, XCircle, Info, HelpCircle, Mail, ExternalLink
} from "lucide-react";

const sections = [
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
    id: "how-to-use",
    icon: MousePointer,
    title: "Platformadan qanday foydalanish",
    items: [
      { label: "Tibbiy ensiklopediya", desc: "20,000+ tibbiy atama va tushunchalarni qidiring va o'qing. Atamalar alfavit tartibida joylashgan." },
      { label: "Kasalliklar bo'limi", desc: "Kasalliklar klassifikatsiyasi, belgilari va umumiy ma'lumotlarni ko'ring." },
      { label: "Klinikalar katalogi", desc: "Klinikalar haqida umumiy ma'lumot. Med1.uz klinikalar bilan shartnoma tuzgan emas." },
      { label: "Diagnostika markazlari", desc: "Diagnostika xizmatlari haqida ma'lumot. Platforma diagnostika natijalariga javob bermaydi." },
      { label: "Dorixonalar", desc: "Dorixonalar katalogi va dori haqida umumiy ma'lumot. Platforma dori sotmaydi va tayinlamaydi." },
      { label: "Qon banklari", desc: "Qon banklari haqida umumiy ma'lumot. Platforma qon quyish xizmatini ko'rsatmaydi." },
      { label: "Tug'ruqxonalar", desc: "Tug'ruqxonalar katalogi. Ma'lumotlar faqat informatsion xarakterda." },
      { label: "Yangiliklar", desc: "Tibbiyot sohasidagi yangiliklar. Yangiliklar umumiy ma'lumot sifatida taqdim etiladi." },
    ],
  },
  {
    id: "search",
    icon: Search,
    title: "Qidiruv tizimidan foydalanish",
    content: [
      "Saytning yuqori qismidagi qidiruv maydoniga kerakli so'zni kiriting. Tizim avtomatik ravishda mos natijalarni ko'rsatadi.",
      "Qidiruv natijalari faqat platformadagi mavjud ma'lumotlar doirasida ishlaydi va tibbiy maslahat hisoblanmaydi.",
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
      "Platforma ma'lumotlaridan noto'g'ri foydalanish natijasida yuzaga kelgan moddiy, ma'naviy yoki jismoniy zarar uchun Med1.uz javobgarlik tashimaydi.",
      "Med1.uz hech qanday dori vositasini tayinlamaydi, sotmaydi yoki tavsiya qilmaydi.",
      "Platformadagi klinikalar, dorixonalar va boshqa muassasalar haqidagi ma'lumotlar faqat informatsion xarakterda bo'lib, Med1.uz ular bilan shartnomaviy munosabatda emas.",
      "Med1.uz hech qanday tibbiy natija yoki sifat uchun kafolat bermaydi.",
    ],
  },
  {
    id: "self-treatment",
    icon: XCircle,
    color: "bg-destructive",
    title: "O'z-o'zini davolash haqida ogohlantirish",
    points: [
      "Platformadagi ma'lumotlar asosida O'Z-O'ZINI DAVOLASH QATTIYAN MAN ETILADI.",
      "Dori vositalarini shifokor tayinlamasdan qabul qilish hayot uchun xavfli bo'lishi mumkin.",
      "Har qanday simptom yoki kasallik bo'yicha faqat malakali tibbiy mutaxassisga murojaat qiling.",
      "Med1.uz o'z-o'zini davolash natijasida yuzaga kelgan oqibatlar uchun hech qanday javobgarlik tashimaydi.",
    ],
  },
  {
    id: "third-party",
    icon: ExternalLink,
    color: "bg-amber-500",
    title: "Uchinchi tomon resurslari",
    points: [
      "Platformada uchinchi tomon veb-saytlariga havolalar bo'lishi mumkin. Med1.uz bu saytlarning mazmuni uchun javobgar emas.",
      "Klinikalar, dorixonalar va diagnostika markazlari haqidagi ma'lumotlar ushbu muassasalarning o'zlari tomonidan taqdim etilgan bo'lishi mumkin.",
      "Med1.uz uchinchi tomon xizmatlari sifati, narxi yoki natijalari uchun kafolat bermaydi.",
      "Tashqi havolalarga o'tish foydalanuvchining shaxsiy mas'uliyatidadir.",
    ],
  },
  {
    id: "intellectual-property",
    icon: FileText,
    color: "bg-primary",
    title: "Intellektual mulk huquqlari",
    points: [
      "Platformadagi barcha kontent (matn, rasm, dizayn, kod) Med1.uz intellektual mulki hisoblanadi.",
      "Ma'lumotlarni manba ko'rsatmasdan nusxalash, tarqatish yoki tijorat maqsadlarida foydalanish taqiqlanadi.",
      "Tibbiy maqolalar va ma'lumotlar ochiq manbalardan olingan bo'lib, mualliflik huquqlari tegishli mualliflarga tegishlidir.",
    ],
  },
  {
    id: "privacy",
    icon: Lock,
    color: "bg-emerald-500",
    title: "Maxfiylik siyosati",
    points: [
      "Med1.uz foydalanuvchilarning shaxsiy tibbiy ma'lumotlarini to'plamaydi va saqlamaydi.",
      "Platforma cookie fayllaridan faqat texnik maqsadlarda foydalanishi mumkin.",
      "Foydalanuvchining platformadagi xatti-harakatlari statistik maqsadlarda anonim tarzda tahlil qilinishi mumkin.",
      "Shaxsiy ma'lumotlar uchinchi shaxslarga hech qanday sharoitda berilmaydi.",
    ],
  },
  {
    id: "changes",
    icon: Info,
    color: "bg-blue-500",
    title: "O'zgartirishlar kiritish huquqi",
    points: [
      "Med1.uz istalgan vaqtda platformadagi ma'lumotlarni, foydalanish shartlarini va maxfiylik siyosatini oldindan ogohlantirishsiz o'zgartirish huquqini o'zida saqlaydi.",
      "Foydalanuvchi platformadan foydalanishni davom ettirish orqali barcha o'zgarishlarni qabul qilgan hisoblanadi.",
    ],
  },
];

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
              <p className="text-primary-foreground/70 text-sm">Foydalanish shartlari va yuridik ma'lumotlar</p>
            </div>
          </div>
          <p className="text-primary-foreground/80 max-w-2xl leading-relaxed">
            Ushbu sahifada Med1.uz platformasidan foydalanish tartibi, yuridik shartlar, javobgarlik chegaralari va maxfiylik siyosati batafsil keltirilgan.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* === Qo'llanma === */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Platformadan foydalanish qo'llanmasi</h2>
            </div>

            <div className="space-y-6">
              {sections.map((sec) => (
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

          {/* === Yuridik qism === */}
          <div>
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

          {/* === Rozilik === */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-8 text-center">
            <Scale className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-3">
              Foydalanish shartlariga rozilik
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">
              Med1.uz platformasidan foydalanish orqali siz yuqoridagi barcha shartlarni o'qiganingizni, tushunganingizni va to'liq qabul qilganingizni tasdiqlaysiz. Platforma ma'lumotlari tibbiy maslahat o'rnini BOSMAYDI. Har qanday sog'liq muammosi bo'yicha malakali shifokorga murojaat qiling.
            </p>
            <p className="text-xs text-muted-foreground">
              Oxirgi yangilangan sana: 2026-yil, 16-fevral
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserGuidePage;
