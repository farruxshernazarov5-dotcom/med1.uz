import { Link } from "react-router-dom";
import {
  TrendingUp, Search, Star, Shield, Megaphone, ArrowRight, CheckCircle2,
  Droplets, Zap, Globe, HeartHandshake, Heart, BarChart3, Calendar, Brain, Siren
} from "lucide-react";
import { Button } from "@/components/ui/button";
import bloodCenterImg from "@/assets/blood-service-center.webp";
import bloodManagementImg from "@/assets/blood-service-management.webp";
import bloodAnalyticsImg from "@/assets/blood-service-analytics.webp";
import bloodEmergencyImg from "@/assets/blood-service-emergency.webp";

const bloodBankServices = [
  {
    icon: Globe,
    title: "Raqamli profil sahifasi",
    desc: "Qon bankingiz uchun professional veb-sahifa — mavjud qon guruhlari, saqlash imkoniyatlari, aloqa va joylashuv ma'lumotlari bilan",
    image: bloodCenterImg,
  },
  {
    icon: Calendar,
    title: "Donor boshqaruv tizimi",
    desc: "Donorlarni ro'yxatdan o'tkazish, qon topshirish jadvalini boshqarish, avtomatik eslatmalar va qayta donor jalb etish",
    image: bloodManagementImg,
  },
  {
    icon: BarChart3,
    title: "Analitika va monitoring",
    desc: "Qon zaxirasi holati, donor statistikasi, qon guruhlari taqsimoti va talab-taklif tahlili bo'yicha real vaqt hisobotlar",
    image: bloodAnalyticsImg,
  },
  {
    icon: Siren,
    title: "Favqulodda aloqa tizimi",
    desc: "Shoshilinch hollarda donorlarni tezkor mobilizatsiya qilish, qon guruhi bo'yicha tezkor qidiruv va xabarlar tizimi",
    image: bloodEmergencyImg,
  },
];

const whyChooseUs = [
  {
    icon: TrendingUp,
    title: "Donor oqimini 3x oshiring",
    desc: "Med1.uz orqali minglab foydalanuvchilar qon banklarini qidiradi. Platformada bo'lish — yangi donorlar oqimini kafolatlaydi.",
  },
  {
    icon: Search,
    title: "Tezkor topilish imkoniyati",
    desc: "Premium obuna bilan qon bankingiz qidiruv natijalarida yuqori chiqadi. Favqulodda hollarda bemorlar sizni tez topadi.",
  },
  {
    icon: Shield,
    title: "Ishonchli brend imiji",
    desc: "Med1.uz tasdiqlangan qon banki belgisi jamoatchilik ishonchini oshiradi. Professional profil — professional taassurot.",
  },
  {
    icon: Heart,
    title: "Hayot saqlovchi xizmat",
    desc: "Har bir donor — biror kishining hayotini saqlovchi. Platformamiz orqali bu ezgu ishni yanada kengaytiring.",
  },
  {
    icon: Star,
    title: "Donor sharhlari tizimi",
    desc: "Donorlarning ijobiy tajribalari yangi ko'ngillilarni jalb qiladi. Reyting tizimi orqali obro'ingizni mustahkamlang.",
  },
  {
    icon: Megaphone,
    title: "Donor jalb kampaniyalari",
    desc: "Bosh sahifada banner, push-bildirishnomalar, ijtimoiy tarmoqlarda targ'ibot — donor bazangizni kengaytiring.",
  },
];

const BloodBankServicesSection = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async" src={bloodCenterImg} alt="Qon banklari uchun xizmatlar" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 to-red-800/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-white/20">
              <Droplets className="w-4 h-4" />
              Qon banklari uchun xizmatlar
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 leading-tight">
              Qon bankingizni <span className="text-red-300">raqamlashtiring</span> va hayotlarni saqlang
            </h2>
            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              Med1.uz platformasi orqali qon bankingizni O'zbekiston bo'ylab taniting, donor bazangizni kengaytiring va favqulodda vaziyatlarda tezkor aloqa o'rnating
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-red-700 hover:bg-white/90 font-bold">
                <Link to="/blood-donor-register">
                  Hozir ro'yxatdan o'ting <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link to="/pricing">Tariflarni ko'rish</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Qon banklari uchun <span className="text-gradient">xizmatlarimiz</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Zamonaviy texnologiyalar bilan qon bankingizni yangi darajaga olib chiqing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {bloodBankServices.map((service, i) => (
              <div key={i} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                <div className="h-48 overflow-hidden">
                  <img loading="lazy" decoding="async" src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full text-sm font-medium text-red-600 mb-4">
              <HeartHandshake className="w-4 h-4" />
              Nega aynan Med1.uz?
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nega bizni <span className="text-gradient">tanlash kerak?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              O'zbekistondagi eng yirik tibbiy platforma sifatida qon bankingiz muvaffaqiyati uchun barcha vositalarni taqdim etamiz
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:border-red-500/30 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-dark-gradient text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: "10,000+", label: "Faol donorlar" },
              { value: "50+", label: "Ro'yxatdagi qon banklari" },
              { value: "8", label: "Qon guruhi qo'llab-quvvatlanadi" },
              { value: "24/7", label: "Favqulodda aloqa" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-extrabold text-red-400 mb-1">{stat.value}</p>
                <p className="text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Droplets className="w-12 h-12 mx-auto mb-4 text-red-200" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">
              Qon bankingizni bugun ro'yxatdan o'tkazing!
            </h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Bepul boshlang'ich tarif bilan platformani sinab ko'ring — hech qanday to'lov talab etilmaydi
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-red-700 hover:bg-white/90 font-bold">
                <Link to="/blood-donor-register">Bepul boshlash <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link to="/pricing">Tariflar</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BloodBankServicesSection;
