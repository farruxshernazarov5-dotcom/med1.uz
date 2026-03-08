import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import {
  Handshake, Building2, Activity, Baby, Eye, Pill, Wrench, UserCheck,
  CheckCircle, ArrowRight, Star, Shield, TrendingUp, Users, Sparkles, Phone
} from "lucide-react";

const partnerTypes = [
  {
    id: "clinics",
    icon: Building2,
    title: "Klinikalar uchun hamkorlik",
    desc: "Klinikangizni Med1.uz platformasiga qo'shing va minglab bemorlarni jalb qiling.",
    benefits: [
      "Platformada klinika profili va brending",
      "Onlayn qabul yozilish tizimi",
      "Shifokorlar katalogi va reytingi",
      "AI diagnostika integratsiyasi",
      "Analitika va statistika paneli",
      "Bemorlar bilan to'g'ridan-to'g'ri aloqa",
    ],
    registerHref: "/clinic-register",
    color: "from-primary to-tech-electric",
  },
  {
    id: "diagnostics",
    icon: Activity,
    title: "Diagnostika markazlari uchun",
    desc: "MRT, KT, UZI va laboratoriya xizmatlaringizni keng auditoriyaga taqdim eting.",
    benefits: [
      "Xizmatlar katalogi (MRT, KT, UZI, Lab)",
      "Onlayn navbat va qabul tizimi",
      "Natijalarni raqamli yuborish",
      "AI radiologiya bilan integratsiya",
      "Markazingiz haqida batafsil profil",
      "Reklama va ko'rinish imkoniyatlari",
    ],
    registerHref: "/diagnostics-register",
    color: "from-tech-electric to-tech-purple",
  },
  {
    id: "doctors",
    icon: UserCheck,
    title: "Shifokorlar uchun",
    desc: "Mustaqil yoki klinika orqali professional profilingizni yarating.",
    benefits: [
      "Shaxsiy shifokor profili sahifasi",
      "Onlayn konsultatsiya imkoniyati",
      "Bemorlar sharhlari va reytingi",
      "Ish grafigi boshqaruvi",
      "AI yordamchi vositalar",
      "Professional brending",
    ],
    registerHref: "/doctor-register",
    color: "from-tech-purple to-tech-electric",
  },
  {
    id: "maternity",
    icon: Baby,
    title: "Tug'ruqxonalar uchun",
    desc: "Tug'ruqxona xizmatlarini onlayn taqdim eting va homilador ayollarni jalb qiling.",
    benefits: [
      "Tug'ruq paketlari va narxlar",
      "Palata turlari va sharoitlar",
      "Onlayn qabul yozilish",
      "Shifokorlar jamoasi profili",
      "Bemorlar statistikasi",
      "Reklama va promo imkoniyatlar",
    ],
    registerHref: "/maternity-register",
    color: "from-primary to-tech-success",
  },
  {
    id: "cosmetology",
    icon: Sparkles,
    title: "Kosmetologiya markazlari uchun",
    desc: "Go'zallik va salomatlik xizmatlarini keng auditoriyaga taqdim eting.",
    benefits: [
      "Xizmatlar katalogi va narxlar",
      "Mutaxassislar profili",
      "Oldin/keyin natijalar galereyasi",
      "Onlayn qabul yozilish",
      "Mijozlar sharhlari tizimi",
      "Maxsus aksiya va chegirmalar",
    ],
    registerHref: "/cosmetology-register",
    color: "from-tech-purple to-primary",
  },
  {
    id: "pharmacies",
    icon: Pill,
    title: "Dorixonalar uchun",
    desc: "Dorixonangizni platformaga qo'shing va dori izlovchi bemorlarni yo'naltiring.",
    benefits: [
      "Dorixona profili va manzil",
      "Dori mavjudligi ma'lumoti",
      "Yetkazib berish xizmati",
      "24/7 ishlash holati",
      "Farmatsevtik maslahat",
      "Xarita orqali ko'rinish",
    ],
    registerHref: "/auth",
    color: "from-tech-success to-tech-electric",
  },
  {
    id: "medtech",
    icon: Wrench,
    title: "Med texnika sotuvchilari uchun",
    desc: "Tibbiy jihozlar va uskunalarni klinikalar va markazlarga taqdim eting.",
    benefits: [
      "Mahsulotlar katalogi",
      "Buyurtma boshqaruv tizimi",
      "B2B va B2C sotish",
      "Sertifikatlar va hujjatlar",
      "Taqdimot va reklama",
      "Analitika va statistika",
    ],
    registerHref: "/vendor-register",
    color: "from-tech-electric to-tech-success",
  },
];

const stats = [
  { value: "1,200+", label: "Tibbiy muassasalar", icon: Building2 },
  { value: "500+", label: "Shifokorlar", icon: UserCheck },
  { value: "50,000+", label: "Oylik tashriflar", icon: TrendingUp },
  { value: "10+", label: "AI xizmatlari", icon: Sparkles },
];

const PartnershipPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-hero-gradient py-20 overflow-hidden">
        <AnimatedBackground variant="pulse" />
        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Handshake className="w-5 h-5 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">Hamkorlik dasturi</span>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            Med1.uz bilan hamkorlik qiling
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
            O'zbekistonning yetakchi tibbiy platformasida o'z xizmatlaringizni millionlab foydalanuvchilarga taqdim eting. 
            Bepul ro'yxatdan o'ting va bugun boshlang!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold">
              <Handshake className="w-5 h-5 mr-2" /> Hamkor bo'lish
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Phone className="w-5 h-5 mr-2" /> +998 90 123 45 67
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-6 bg-card rounded-2xl border border-border shadow-card">
                <s.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-2xl md:text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
              Kimlar hamkor bo'lishi mumkin?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Barcha tibbiy xizmat ko'rsatuvchilar uchun maxsus hamkorlik imkoniyatlari
            </p>
          </div>

          <div className="space-y-8">
            {partnerTypes.map((p, i) => (
              <div
                key={p.id}
                id={p.id}
                className={`flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-card rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Icon & Title */}
                <div className="flex-shrink-0 flex flex-col items-center md:items-start md:w-64">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>
                    <p.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground text-center md:text-left mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground text-center md:text-left">{p.desc}</p>
                  <Link to={p.registerHref} className="mt-4">
                    <Button className="bg-gradient-to-r from-primary to-tech-electric text-primary-foreground border-0">
                      Ro'yxatdan o'tish <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                {/* Benefits */}
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-tech-purple" /> Hamkorlik imtiyozlari
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {p.benefits.map((b) => (
                      <div key={b} className="flex items-start gap-2 p-3 bg-accent/30 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-tech-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-hero-gradient relative overflow-hidden">
        <AnimatedBackground variant="pulse" />
        <div className="relative container mx-auto px-4 text-center">
          <Shield className="w-12 h-12 text-primary-foreground/80 mx-auto mb-4" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
            Hoziroq hamkorlikni boshlang!
          </h2>
          <p className="text-primary-foreground/70 max-w-lg mx-auto mb-6">
            Ro'yxatdan o'tish bepul. Platformadagi millionlab foydalanuvchilarga xizmatlaringizni taqdim eting.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/clinic-register">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Building2 className="w-5 h-5 mr-2" /> Klinika
              </Button>
            </Link>
            <Link to="/doctor-register">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <UserCheck className="w-5 h-5 mr-2" /> Shifokor
              </Button>
            </Link>
            <Link to="/diagnostics-register">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Activity className="w-5 h-5 mr-2" /> Diagnostika
              </Button>
            </Link>
            <Link to="/vendor-register">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Wrench className="w-5 h-5 mr-2" /> Med texnika
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Agreement section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 text-center">
            📋 Hamkorlik shartnomasi shartlari
          </h2>
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h3 className="font-bold text-foreground mb-2">1. Umumiy qoidalar</h3>
              <p>Mazkur shartnoma Med1.uz platformasi (bundan buyon — "Platforma") va hamkor tashkilot (bundan buyon — "Hamkor") o'rtasidagi munosabatlarni tartibga soladi. Platforma tibbiy ma'lumotlar va xizmatlar agregatori sifatida faoliyat yuritadi.</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">2. Hamkorning majburiyatlari</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>To'g'ri va dolzarb ma'lumotlar taqdim etish</li>
                <li>Litsenziya va sertifikatlar haqiqiyligini ta'minlash</li>
                <li>Bemorlar shikoyatlariga o'z vaqtida javob berish</li>
                <li>Platformaning foydalanish qoidalariga rioya qilish</li>
                <li>Maxfiy ma'lumotlarni himoya qilish</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">3. Platformaning majburiyatlari</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Hamkor profilini platformada joylashtirish va ko'rsatish</li>
                <li>Texnik qo'llab-quvvatlash xizmati</li>
                <li>Analitika va statistik ma'lumotlar taqdim etish</li>
                <li>Ma'lumotlar xavfsizligini ta'minlash</li>
                <li>Reklama va marketing yordami</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">4. To'lov shartlari</h3>
              <p>Asosiy ro'yxatdan o'tish bepul. Premium xizmatlar uchun alohida tarif rejalari mavjud. Barcha to'lovlar platforma orqali amalga oshiriladi.</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">5. Javobgarlik</h3>
              <p>Platforma tibbiy muassasa emas va tibbiy tashxis qo'ymaydi. Hamkor tomonidan taqdim etilgan ma'lumotlar uchun hamkorning o'zi javobgardir. Platforma faqat ma'lumotlarni joylashtirish va texnik vositachilik xizmatini ko'rsatadi.</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">6. Shartnoma muddati</h3>
              <p>Shartnoma ro'yxatdan o'tgan kundan boshlab 1 (bir) yil muddatga tuziladi va tomonlardan biri 30 kun oldin yozma ravishda bekor qilmasa, avtomatik uzaytiriladi.</p>
            </div>
            <div className="pt-4 border-t border-border text-center text-xs">
              <p>© {new Date().getFullYear()} Med1.uz — O'zbekistonning yetakchi tibbiy platformasi</p>
              <p className="mt-1">Aloqa: info@med1.uz | +998 90 123 45 67</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PartnershipPage;
