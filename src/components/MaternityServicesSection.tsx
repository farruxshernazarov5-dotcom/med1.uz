import { Link } from "react-router-dom";
import {
  TrendingUp, Users, Calendar, BarChart3, Camera, Search,
  Star, Shield, Brain, Megaphone, ArrowRight, CheckCircle2,
  Baby, Zap, Globe, HeartHandshake, Heart, Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import maternityReceptionImg from "@/assets/maternity-service-reception.jpg";
import maternityBookingImg from "@/assets/maternity-service-booking.jpg";
import maternityAnalyticsImg from "@/assets/maternity-service-analytics.jpg";
import maternityAIImg from "@/assets/maternity-service-ai.jpg";

const maternityServices = [
  {
    icon: Globe,
    title: "Raqamli profil sahifasi",
    desc: "Tug'ruqxonangiz uchun professional veb-sahifa — xizmatlar, shifokorlar, xona turlari, narxlar va aloqa ma'lumotlari bilan to'liq ma'lumot",
    image: maternityReceptionImg,
  },
  {
    icon: Calendar,
    title: "Onlayn qabul va band qilish",
    desc: "Homilador ayollar 24/7 onlayn yozilsin — avtomatik eslatmalar, xona bron qilish va to'liq qabul boshqaruvi",
    image: maternityBookingImg,
  },
  {
    icon: BarChart3,
    title: "Analitika va statistika",
    desc: "Bemor oqimi, tug'ruq statistikasi, daromad tahlili va xizmat samaradorligi bo'yicha real vaqt hisobotlar",
    image: maternityAnalyticsImg,
  },
  {
    icon: Brain,
    title: "AI prenatal monitoring",
    desc: "Sun'iy intellekt homiladorlik kuzatuvini avtomatlashtiradi va xavfli holatlarni oldindan aniqlaydi",
    image: maternityAIImg,
  },
];

const whyChooseUs = [
  {
    icon: TrendingUp,
    title: "Bemor oqimini 3x oshiring",
    desc: "Med1.uz orqali oyiga minglab homilador ayollar tug'ruqxona qidiradi. Platformada bo'lish — yangi bemorlar oqimini kafolatlaydi.",
  },
  {
    icon: Search,
    title: "AI qidiruvda birinchi o'rin",
    desc: "Premium obuna bilan tug'ruqxonangiz qidiruv natijalarida yuqori o'rinlarda chiqadi va AI tizimi bemorlarni sizga yo'naltiradi.",
  },
  {
    icon: Shield,
    title: "Ishonchli brend imiji",
    desc: "Med1.uz tasdiqlangan tug'ruqxona belgisi bemorlar ishonchini oshiradi. Professional profil — professional taassurot.",
  },
  {
    icon: Heart,
    title: "Onalik g'amxo'rligi",
    desc: "Homiladorlik kuzatuvi, tug'ruqdan keyingi parvarishlash va chaqaloq salomatligi — barcha bosqichda qo'llab-quvvatlash.",
  },
  {
    icon: Star,
    title: "Bemor sharhlari tizimi",
    desc: "Mamnun onalar sharhlari yangi bemorlarni jalb qiladi. Reyting tizimi orqali obro'ingizni mustahkamlang.",
  },
  {
    icon: Megaphone,
    title: "Maqsadli marketing",
    desc: "Bosh sahifada banner, maqolalarda reklama, push-bildirishnomalar — homilador ayollar auditoriyasiga yeting.",
  },
];

const MaternityServicesSection = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={maternityReceptionImg} alt="Tug'ruqxonalar uchun xizmatlar" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/90 to-primary/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-white/20">
              <Baby className="w-4 h-4" />
              Tug'ruqxonalar uchun xizmatlar
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 leading-tight">
              Tug'ruqxonangizni <span className="text-pink-300">raqamlashtiring</span> va bemorlar ishonchini oshiring
            </h2>
            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              Med1.uz platformasi orqali tug'ruqxonangizni O'zbekiston bo'ylab taniting, onlayn qabul tizimini yo'lga qo'ying va zamonaviy AI texnologiyalaridan foydalaning
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-pink-700 hover:bg-white/90 font-bold">
                <Link to="/maternity-register">
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
              Tug'ruqxonalar uchun <span className="text-gradient">xizmatlarimiz</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Zamonaviy texnologiyalar bilan tug'ruqxonangizni yangi darajaga olib chiqing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {maternityServices.map((service, i) => (
              <div key={i} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                <div className="h-48 overflow-hidden">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-pink-500" />
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
            <div className="inline-flex items-center gap-2 bg-pink-500/10 px-4 py-2 rounded-full text-sm font-medium text-pink-600 mb-4">
              <HeartHandshake className="w-4 h-4" />
              Nega aynan Med1.uz?
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nega bizni <span className="text-gradient">tanlash kerak?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              O'zbekistondagi eng yirik tibbiy platforma sifatida tug'ruqxonangiz muvaffaqiyati uchun barcha vositalarni taqdim etamiz
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:border-pink-500/30 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              { value: "30,000+", label: "Oylik foydalanuvchilar" },
              { value: "200+", label: "Ro'yxatdagi tug'ruqxonalar" },
              { value: "150+", label: "Mutaxassis shifokorlar" },
              { value: "97%", label: "Mijoz mamnuniyati" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-extrabold text-pink-400 mb-1">{stat.value}</p>
                <p className="text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-pink-500 to-pink-700 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Baby className="w-12 h-12 mx-auto mb-4 text-pink-200" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">
              Tug'ruqxonangizni bugun ro'yxatdan o'tkazing!
            </h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Bepul boshlang'ich tarif bilan platformani sinab ko'ring — hech qanday to'lov talab etilmaydi
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-pink-700 hover:bg-white/90 font-bold">
                <Link to="/maternity-register">Bepul boshlash <ArrowRight className="w-4 h-4 ml-1" /></Link>
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

export default MaternityServicesSection;
