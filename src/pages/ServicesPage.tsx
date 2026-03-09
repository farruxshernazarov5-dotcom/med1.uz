import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  Brain, BookOpen, Building2, Activity, Pill, Droplets, Baby,
  UserCheck, Search, Megaphone, Stethoscope, FlaskConical,
  Shield, Heart, Target, Zap, CheckCircle2, ArrowRight,
  Cpu, Database, Globe, TrendingUp, ChevronRight
} from "lucide-react";
import AdBanner from "@/components/AdBanner";
import PricingSection from "@/components/PricingSection";
import ClinicServicesSection from "@/components/ClinicServicesSection";
import DiagnosticsServicesSection from "@/components/DiagnosticsServicesSection";
import MaternityServicesSection from "@/components/MaternityServicesSection";
const mainServices = [
  {
    id: "ai-diagnostics",
    icon: Brain,
    number: "01",
    title: "AI asosidagi erta diagnostika",
    subtitle: "Sun'iy intellekt yordamida kasalliklarni erta aniqlash",
    color: "from-primary to-secondary",
    href: "/ai-services",
    features: [
      "Foydalanuvchi simptomlarni kiritadi",
      "AI algoritmi ularni tahlil qiladi",
      "Ehtimoliy kasalliklar ro'yxatini chiqaradi",
      "Xavf darajasini baholaydi",
      "Mos shifokor yoki klinikani tavsiya qiladi",
    ],
    highlight: "Kasalliklarni og'irlashishidan oldin aniqlashga yordam beradi",
  },
  {
    id: "encyclopedia",
    icon: BookOpen,
    number: "02",
    title: "Tibbiy ensiklopediya va bilim bazasi",
    subtitle: "Keng qamrovli tibbiy ma'lumotlar",
    color: "from-medical-purple to-primary",
    href: "/medicine",
    features: [
      "20 000+ tibbiy termin va tushunchalar",
      "Kasalliklar haqida batafsil ma'lumot",
      "Davolash usullari",
      "Profilaktika tavsiyalari",
      "Ilmiy maqolalar",
    ],
    highlight: "Aqlli qidiruv tizimi orqali kerakli ma'lumotni tez toping",
  },
  {
    id: "clinics",
    icon: Building2,
    number: "03",
    title: "Klinikalar katalogi va boshqaruvi",
    subtitle: "Klinikalar uchun raqamli platforma",
    color: "from-medical-teal to-medical-green",
    href: "/clinics",
    features: [
      "Xususiy va davlat klinikalar ro'yxati",
      "Yo'nalish bo'yicha qidiruv",
      "Shifokor profillari",
      "Onlayn yozilish imkoniyati",
      "Klinikalar uchun admin panel",
    ],
    highlight: "Klinikalar o'z xizmatlarini joylashtiradi va bemor oqimini oshiradi",
  },
  {
    id: "diagnostics",
    icon: Activity,
    number: "04",
    title: "Diagnostika markazlari va laboratoriyalar",
    subtitle: "Barcha diagnostika xizmatlarini birlashtiradi",
    color: "from-medical-blue to-primary",
    href: "/diagnostics",
    features: [
      "MRT, MSKT, Rentgen, UTT",
      "Qon tahlillari",
      "Biokimyoviy tahlillar",
      "IFA, PCR laboratoriya xizmatlari",
      "Diagnostika markazini tez topish",
    ],
    highlight: "Foydalanuvchi kerakli diagnostika markazini tez topadi va bog'lana oladi",
  },
  {
    id: "pharmacies",
    icon: Pill,
    number: "05",
    title: "Dorixonalar va dori vositalari bazasi",
    subtitle: "25 000+ dori yo'riqnomalari",
    color: "from-medical-orange to-medical-red",
    href: "/pharmacies",
    features: [
      "Dorixonalar katalogi",
      "25 000+ dori yo'riqnomalari",
      "Dori haqida batafsil ma'lumot",
      "Qo'llash usuli va qarshi ko'rsatmalar",
      "Ishonchli ma'lumot manbalari",
    ],
    highlight: "Foydalanuvchilarga dorilar haqida ishonchli ma'lumot olish imkonini beradi",
  },
  {
    id: "blood-banks",
    icon: Droplets,
    number: "06",
    title: "Qon banklari tizimi",
    subtitle: "Tezkor qon donorlik xizmati",
    color: "from-medical-red to-medical-purple",
    href: "/blood-banks",
    features: [
      "Qon guruhlari bazasi (O+, O-, A+, A-, B+, B-, AB+, AB-)",
      "Qon banklari ro'yxati",
      "Tezkor aloqa imkoniyati",
      "Favqulodda vaziyatlarda yordam",
    ],
    highlight: "Favqulodda vaziyatlarda tezkor ma'lumot olish imkonini beradi",
  },
  {
    id: "maternity",
    icon: Baby,
    number: "07",
    title: "Tug'ruqxonalar va ixtisoslashgan markazlar",
    subtitle: "Davlat va xususiy tug'ruqxonalar",
    color: "from-medical-purple to-primary",
    href: "/maternity",
    features: [
      "Davlat va xususiy tug'ruqxonalar",
      "Mutaxassislar haqida ma'lumot",
      "Aloqa va joylashuv",
      "Xizmatlar ro'yxati",
    ],
    highlight: "Onalik va bolalar salomatligi uchun eng yaxshi markazlar",
  },
  {
    id: "doctor-profile",
    icon: UserCheck,
    number: "08",
    title: "Shifokorlar uchun professional profil",
    subtitle: "Shifokorlar o'z brendini rivojlantirsin",
    color: "from-medical-green to-medical-teal",
    features: [
      "Shaxsiy profil yaratish",
      "Mutaxassislik yo'nalishi",
      "Ish tajribasi ko'rsatish",
      "Qabul vaqtini belgilash",
      "Aloqa ma'lumotlari",
    ],
    highlight: "Shifokorlarga o'z professional brendini rivojlantirish imkonini beradi",
  },
  {
    id: "ai-search",
    icon: Search,
    number: "09",
    title: "AI asosidagi aqlli qidiruv",
    subtitle: "Simptom va xizmat bo'yicha yo'naltirish",
    color: "from-primary to-medical-blue",
    features: [
      "Simptom bo'yicha qidiruv",
      "Xizmat bo'yicha qidiruv",
      "Klinikani joylashuv bo'yicha topish",
      "Tavsiya algoritmi",
    ],
    highlight: "Eng to'g'ri natijani eng tez yo'l bilan toping",
  },
  {
    id: "advertising",
    icon: Megaphone,
    number: "10",
    title: "Reklama va premium xizmatlar",
    subtitle: "Klinikalar va tibbiy muassasalar uchun",
    color: "from-medical-orange to-medical-purple",
    features: [
      "Premium joylashtirish",
      "Asosiy sahifada ko'rinish",
      "Maqsadli reklama",
      "Bemor oqimi statistikasi",
    ],
    highlight: "Tibbiy muassasalar uchun samarali marketing vositasi",
  },
];

const platformFeatures = [
  { icon: Cpu, label: "AI diagnostika", desc: "Sun'iy intellekt" },
  { icon: Database, label: "Katta baza", desc: "20 000+ termin" },
  { icon: Globe, label: "Raqamlashtirish", desc: "Barcha sohalar" },
  { icon: Shield, label: "Shaffoflik", desc: "Ishonchli ma'lumot" },
  { icon: TrendingUp, label: "Rivojlanish", desc: "Doimiy yangilanish" },
  { icon: Zap, label: "Tezkorlik", desc: "24/7 ishlaydi" },
];

const bottomLinks = [
  { icon: BookOpen, label: "Tibbiyot", href: "/medicine" },
  { icon: Heart, label: "Salomatlik", href: "/health" },
  { icon: Stethoscope, label: "Kasalliklar", href: "/diseases" },
  { icon: Building2, label: "Klinikalar", href: "/clinics" },
  { icon: Activity, label: "Diagnostika", href: "/diagnostics" },
  { icon: Pill, label: "Dorixonalar", href: "/pharmacies" },
  { icon: Droplets, label: "Qon banklari", href: "/blood-banks" },
  { icon: Baby, label: "Tug'ruqxonalar", href: "/maternity" },
  { icon: FlaskConical, label: "Med texnika", href: "/med-tech" },
  { icon: Globe, label: "Yangiliklar", href: "/news" },
  { icon: BookOpen, label: "Maqolalar", href: "/articles" },
];

const ServicesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient opacity-[0.07]" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-secondary/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-full text-sm font-medium text-accent-foreground mb-6 animate-fade-up">
              <Zap className="w-4 h-4" />
              <span>10+ professional xizmat</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 animate-fade-up leading-tight">
              Med1.uz <span className="text-gradient">xizmatlari</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up">
              O'zbekiston uchun yagona raqamli sog'liqni saqlash ekotizimi — AI diagnostika, tibbiy marketplace va aqlli yordamchi
            </p>
          </div>
        </div>
      </section>

      {/* Platform features strip */}
      <section className="py-8 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {platformFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services list */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="space-y-8">
            {mainServices.map((service, i) => (
              <div
                key={service.id}
                className="group bg-card rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left accent + number */}
                  <div className={`lg:w-2 bg-gradient-to-b ${service.color} shrink-0`} />

                  <div className="flex-1 p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <service.icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-bold text-primary bg-accent px-2 py-0.5 rounded-full">
                            {service.number}
                          </span>
                          <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                            {service.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground">{service.subtitle}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {service.features.map((feat, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm text-foreground">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary bg-accent/50 px-3 py-1.5 rounded-lg">
                        💡 {service.highlight}
                      </p>
                      {service.href && (
                        <Link
                          to={service.href}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          Bo'limga o'tish <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic B2B Services */}
      <ClinicServicesSection />

      {/* Diagnostics B2B Services */}
      <DiagnosticsServicesSection />

      {/* Pricing Plans */}
      <PricingSection />

      {/* Summary */}
      <section className="py-16 bg-dark-gradient text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Med1.uz — bu shunchaki tibbiy katalog emas
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Bu O'zbekiston uchun yagona raqamli sog'liqni saqlash ekotizimi
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Brain, text: "AI asosidagi erta diagnostika tizimi" },
              { icon: Globe, text: "Tibbiy xizmatlar marketplace'i" },
              { icon: Megaphone, text: "Klinikalar uchun marketing platformasi" },
              { icon: Heart, text: "Bemorlar uchun aqlli yordamchi" },
              { icon: Shield, text: "Raqamli sog'liqni saqlash ekotizimi" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-5 bg-primary-foreground/10 rounded-2xl backdrop-blur-sm border border-primary-foreground/10">
                <item.icon className="w-8 h-8 text-secondary" />
                <p className="text-sm font-medium text-center">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom navigation */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Barcha <span className="text-gradient">bo'limlar</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {bottomLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="group flex items-center gap-3 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all shadow-card hover:shadow-card-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-heading text-sm font-semibold text-foreground">{link.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Banners */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdBanner variant={0} />
            <AdBanner variant={1} />
            <AdBanner variant={2} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
