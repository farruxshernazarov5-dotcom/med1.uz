import { Link } from "react-router-dom";
import {
  TrendingUp, Users, Calendar, BarChart3, Camera, Search,
  Star, Shield, Brain, Megaphone, ArrowRight, CheckCircle2,
  Sparkles, Zap, Globe, HeartHandshake, Heart, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import cosmetologyClinicImg from "@/assets/cosmetology-service-clinic.webp";
import cosmetologyBookingImg from "@/assets/cosmetology-service-booking.webp";
import cosmetologyAnalyticsImg from "@/assets/cosmetology-service-analytics.webp";
import cosmetologyAIImg from "@/assets/cosmetology-service-ai.webp";

const cosmetologyServices = [
  {
    icon: Globe,
    title: "Raqamli profil sahifasi",
    desc: "Kosmetologiya markazingiz uchun premium veb-sahifa — xizmatlar, mutaxassislar, narxlar, aksiyalar va portfoliyo bilan to'liq ma'lumot",
    image: cosmetologyClinicImg,
  },
  {
    icon: Calendar,
    title: "Onlayn qabul tizimi",
    desc: "Mijozlar 24/7 onlayn yozilsin — avtomatik eslatmalar, CRM tizimi va qayta tashrif buyurish kuzatuvi",
    image: cosmetologyBookingImg,
  },
  {
    icon: BarChart3,
    title: "Analitika va statistika",
    desc: "Mijoz oqimi, daromad tahlili, eng mashhur muolajalar va mutaxassis samaradorligi bo'yicha real vaqt hisobotlar",
    image: cosmetologyAnalyticsImg,
  },
  {
    icon: Brain,
    title: "AI teri tahlili",
    desc: "Sun'iy intellekt mijozlarning teri holatini tahlil qiladi va markazingizdagi mos muolajalarni tavsiya qiladi",
    image: cosmetologyAIImg,
  },
];

const whyChooseUs = [
  {
    icon: TrendingUp,
    title: "Mijoz oqimini 3x oshiring",
    desc: "Med1.uz orqali oyiga minglab foydalanuvchilar kosmetologiya xizmatlari qidiradi. Platformada bo'lish — yangi mijozlar oqimini kafolatlaydi.",
  },
  {
    icon: Search,
    title: "AI qidiruvda birinchi o'rin",
    desc: "Premium obuna bilan markazingiz qidiruv natijalarida yuqori chiqadi va AI tizimi mijozlarni sizga yo'naltiradi.",
  },
  {
    icon: Shield,
    title: "Ishonchli brend imiji",
    desc: "Med1.uz tasdiqlangan markaz belgisi mijozlar ishonchini oshiradi. Professional profil — professional taassurot.",
  },
  {
    icon: Palette,
    title: "Go'zallik portfoliyosi",
    desc: "Oldin/keyin fotolar, video natijalar va mijoz sharhlari — ishingizni eng yaxshi tomondan ko'rsating.",
  },
  {
    icon: Star,
    title: "Mijoz sharhlari tizimi",
    desc: "Mamnun mijozlar sharhlari yangi tashrif buyuruvchilarni jalb qiladi. Reyting tizimi orqali obro'ingizni mustahkamlang.",
  },
  {
    icon: Megaphone,
    title: "Maqsadli marketing",
    desc: "Bosh sahifada banner, aksiya e'lonlari, push-bildirishnomalar — go'zallik xizmatlariga qiziquvchi auditoriyaga yeting.",
  },
];

const CosmetologyServicesSection = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={cosmetologyClinicImg} alt="Kosmetologiya markazlari uchun xizmatlar" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-pink-900/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-white/20">
              <Sparkles className="w-4 h-4" />
              Kosmetologiya markazlari uchun xizmatlar
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 leading-tight">
              Markazingizni <span className="text-purple-300">raqamlashtiring</span> va mijozlar ishonchini oshiring
            </h2>
            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              Med1.uz platformasi orqali kosmetologiya markazingizni O'zbekiston bo'ylab taniting, onlayn qabul tizimini yo'lga qo'ying va AI texnologiyalaridan foydalaning
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-bold">
                <Link to="/cosmetology-register">
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
              Kosmetologiya markazlari uchun <span className="text-gradient">xizmatlarimiz</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Zamonaviy texnologiyalar bilan markazingizni yangi darajaga olib chiqing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {cosmetologyServices.map((service, i) => (
              <div key={i} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                <div className="h-48 overflow-hidden">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-purple-500" />
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
            <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full text-sm font-medium text-purple-600 mb-4">
              <HeartHandshake className="w-4 h-4" />
              Nega aynan Med1.uz?
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nega bizni <span className="text-gradient">tanlash kerak?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              O'zbekistondagi eng yirik tibbiy platforma sifatida markazingiz muvaffaqiyati uchun barcha vositalarni taqdim etamiz
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:border-purple-500/30 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              { value: "40,000+", label: "Oylik foydalanuvchilar" },
              { value: "300+", label: "Ro'yxatdagi markazlar" },
              { value: "200+", label: "Mutaxassis kosmetologlar" },
              { value: "98%", label: "Mijoz mamnuniyati" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-extrabold text-purple-400 mb-1">{stat.value}</p>
                <p className="text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-200" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">
              Markazingizni bugun ro'yxatdan o'tkazing!
            </h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Bepul boshlang'ich tarif bilan platformani sinab ko'ring — hech qanday to'lov talab etilmaydi
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-bold">
                <Link to="/cosmetology-register">Bepul boshlash <ArrowRight className="w-4 h-4 ml-1" /></Link>
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

export default CosmetologyServicesSection;
