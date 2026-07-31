import { Link } from "react-router-dom";
import { 
  TrendingUp, Users, Calendar, BarChart3, Camera, Search, 
  Star, Shield, Brain, Megaphone, ArrowRight, CheckCircle2,
  Building2, Zap, Globe, HeartHandshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import clinicMarketingImg from "@/assets/clinic-service-marketing.webp";
import clinicBookingImg from "@/assets/clinic-service-booking.webp";
import clinicTeamImg from "@/assets/clinic-service-team.webp";
import clinicBrandImg from "@/assets/clinic-service-brand.webp";

const clinicServices = [
  {
    icon: Globe,
    title: "Raqamli profil sahifasi",
    desc: "Klinikangiz uchun professional veb-sahifa — xizmatlar, shifokorlar, narxlar va aloqa ma'lumotlari bilan",
    image: clinicBrandImg,
  },
  {
    icon: Calendar,
    title: "Onlayn qabul tizimi",
    desc: "Bemorlar 24/7 onlayn yozilsin — avtomatik eslatmalar, qabul boshqaruvi va CRM tizimi",
    image: clinicBookingImg,
  },
  {
    icon: BarChart3,
    title: "Analitika va statistika",
    desc: "Bemor oqimi, daromad tahlili, shifokor samaradorligi va bozor ulushi bo'yicha real vaqt hisobotlar",
    image: clinicMarketingImg,
  },
  {
    icon: Brain,
    title: "AI bemor yo'naltirish",
    desc: "Sun'iy intellekt simptomlar asosida bemorlarni avtomatik klinikangizga yo'naltiradi",
    image: clinicTeamImg,
  },
];

const whyChooseUs = [
  {
    icon: TrendingUp,
    title: "Bemor oqimini 3x oshiring",
    desc: "Med1.uz orqali oyiga 50,000+ foydalanuvchi tibbiy xizmat qidiradi. Platformada bo'lish — yangi bemorlar oqimini kafolatlaydi.",
  },
  {
    icon: Search,
    title: "AI qidiruv natijalarida birinchi",
    desc: "Premium obuna bilan klinikangiz qidiruv natijalarida yuqori o'rinlarda chiqadi va AI tizimi bemorlarni sizga yo'naltiradi.",
  },
  {
    icon: Shield,
    title: "Ishonchli brend imiji",
    desc: "Med1.uz tasdiqlangan klinika belgisi sizga bemorlar ishonchini oshiradi. Professional profil — professional taassurot.",
  },
  {
    icon: Camera,
    title: "Professional ko'rinish",
    desc: "Foto galereya, video turlar, shifokor profillari — klinikangizni eng yaxshi tomondan ko'rsating.",
  },
  {
    icon: Star,
    title: "Bemor sharhlari tizimi",
    desc: "Mamnun bemorlar sharhlari yangi mijozlarni jalb qiladi. Reyting tizimi orqali obro'ingizni oshiring.",
  },
  {
    icon: Megaphone,
    title: "Maqsadli marketing",
    desc: "Bosh sahifada banner, maqolalarda reklama, push-bildirishnomalar — to'g'ri auditoriyaga yeting.",
  },
];

const ClinicServicesSection = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async" src={clinicTeamImg} alt="Klinikalar uchun xizmatlar" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-white/20">
              <Building2 className="w-4 h-4" />
              Klinikalar uchun xizmatlar
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 leading-tight">
              Klinikangizni <span className="text-secondary">raqamlashtiring</span> va bemor oqimini oshiring
            </h2>
            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              Med1.uz platformasi orqali klinikangizni O'zbekiston bo'ylab taniting, onlayn qabul tizimini yo'lga qo'ying va AI texnologiyalaridan foydalaning
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                <Link to="/clinic-register">
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
              Klinikalar uchun <span className="text-gradient">xizmatlarimiz</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Zamonaviy texnologiyalar bilan klinikangizni yangi darajaga olib chiqing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {clinicServices.map((service, i) => (
              <div key={i} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                <div className="h-48 overflow-hidden">
                  <img loading="lazy" decoding="async" src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
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
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium text-primary mb-4">
              <HeartHandshake className="w-4 h-4" />
              Nega aynan Med1.uz?
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nega bizni <span className="text-gradient">tanlash kerak?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              O'zbekistondagi eng yirik tibbiy platforma sifatida klinikangiz muvaffaqiyati uchun barcha vositalarni taqdim etamiz
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-primary-foreground" />
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
              { value: "50,000+", label: "Oylik foydalanuvchilar" },
              { value: "1,200+", label: "Ro'yxatdagi klinikalar" },
              { value: "500+", label: "Shifokor profillari" },
              { value: "98%", label: "Mijoz mamnuniyati" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-extrabold text-secondary mb-1">{stat.value}</p>
                <p className="text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 md:p-12 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Zap className="w-12 h-12 mx-auto mb-4 text-secondary" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">
              Klinikangizni bugun ro'yxatdan o'tkazing!
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Bepul boshlang'ich tarif bilan platformani sinab ko'ring — hech qanday to'lov talab etilmaydi
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                <Link to="/clinic-register">Bepul boshlash <ArrowRight className="w-4 h-4 ml-1" /></Link>
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

export default ClinicServicesSection;
