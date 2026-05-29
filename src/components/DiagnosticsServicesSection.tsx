import { Link } from "react-router-dom";
import {
  Microscope, Calendar, BarChart3, Brain, Search, Shield,
  Camera, Star, Megaphone, ArrowRight, Zap, HeartHandshake,
  Globe, TrendingUp, FileText, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import diagImagingImg from "@/assets/diag-service-imaging.webp";
import diagLabImg from "@/assets/diag-service-lab.webp";
import diagBookingImg from "@/assets/diag-service-booking.webp";
import diagAnalyticsImg from "@/assets/diag-service-analytics.webp";

const diagServices = [
  {
    icon: Microscope,
    title: "Raqamli diagnostika profili",
    desc: "MRT, KT, UZI, rentgen, laboratoriya va boshqa xizmatlaringizni batafsil taqdim eting — narxlar, tayyorgarlik ko'rsatmalari va mutaxassis ma'lumotlari bilan",
    image: diagImagingImg,
  },
  {
    icon: Calendar,
    title: "Onlayn qabul va navbat tizimi",
    desc: "Bemorlar 24/7 onlayn yozilsin — avtomatik SMS eslatma, navbat boshqaruvi va CRM tizimi bilan samaradorlikni oshiring",
    image: diagBookingImg,
  },
  {
    icon: BarChart3,
    title: "Analitika va biznes hisobotlar",
    desc: "Bemor oqimi, xizmat turlari bo'yicha daromad, qurilma yuklanishi va bozor ulushi haqida real vaqt tahlillar",
    image: diagAnalyticsImg,
  },
  {
    icon: Brain,
    title: "AI radiologiya integratsiyasi",
    desc: "Sun'iy intellekt MRT, KT va rentgen natijalarini dastlabki tahlil qiladi — shifokor ish yukini kamaytirib, aniqlikni oshiradi",
    image: diagLabImg,
  },
];

const whyChooseUs = [
  {
    icon: TrendingUp,
    title: "Bemor oqimini 5x oshiring",
    desc: "Med1.uz da oyiga 50,000+ foydalanuvchi diagnostika xizmati qidiradi. Platformada bo'lish — har kuni yangi bemorlar kelishini ta'minlaydi.",
  },
  {
    icon: Search,
    title: "AI qidiruvda birinchi o'rinda",
    desc: "AI tizimimiz bemorlarni simptomlar asosida avtomatik diagnostika markazingizga yo'naltiradi. Premium obuna bilan qidiruv natijalarida doimo birinchi bo'ling.",
  },
  {
    icon: FileText,
    title: "Raqamli natijalar tizimi",
    desc: "Tahlil natijalarini onlayn yuborish, raqamli arxiv va bemorning shaxsiy kabinetiga integratsiya — zamonaviy xizmat ko'rsatish.",
  },
  {
    icon: Shield,
    title: "Tasdiqlangan markaz belgisi",
    desc: "Med1.uz 'Tasdiqlangan markaz' belgisi bemorlar ishonchini oshiradi va siz bozorda raqobatchilardan ajralib turasiz.",
  },
  {
    icon: Camera,
    title: "Professional ko'rinish",
    desc: "Zamonaviy qurilmalaringiz, laboratoriya va markaz fotolari — bemorlar markazingizni tanlashdan oldin ichkarini ko'rib, qaror qiladi.",
  },
  {
    icon: Megaphone,
    title: "Maqsadli reklama",
    desc: "Bosh sahifada banner, AI tavsiyalarda ko'rinish, maqolalarda reklama va push-bildirishnomalar — aniq auditoriyaga yetib boring.",
  },
];

const DiagnosticsServicesSection = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={diagImagingImg} alt="Diagnostika markazlari uchun xizmatlar" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-medical-blue/90 to-primary/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-white/20">
              <Microscope className="w-4 h-4" />
              Diagnostika markazlari uchun
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 leading-tight">
              Diagnostika markazingizni <span className="text-secondary">raqamlashtiring</span>
            </h2>
            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              Med1.uz platformasi orqali MRT, KT, laboratoriya xizmatlaringizni O'zbekiston bo'ylab taniting va AI texnologiyalardan foydalaning
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                <Link to="/diagnostics-register">
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
              Diagnostika markazlari uchun <span className="text-gradient">xizmatlarimiz</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Zamonaviy raqamli vositalar bilan markazingiz samaradorligini yangi bosqichga olib chiqing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {diagServices.map((service, i) => (
              <div key={i} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                <div className="h-48 overflow-hidden">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
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
              Diagnostika markazlari uchun <span className="text-gradient">eng yaxshi yechim</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              O'zbekistondagi eng katta tibbiy platforma sifatida markazingiz rivojlanishi uchun barcha vositalarni taqdim etamiz
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-medical-blue to-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              { value: "30,000+", label: "Oylik diagnostika qidiruvlari" },
              { value: "200+", label: "Diagnostika markazlari" },
              { value: "50+", label: "Xizmat turlari" },
              { value: "97%", label: "Mijoz mamnuniyati" },
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
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-medical-blue to-primary rounded-3xl p-8 md:p-12 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Microscope className="w-12 h-12 mx-auto mb-4 text-secondary" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">
              Diagnostika markazingizni bugun ro'yxatdan o'tkazing!
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Bepul boshlang'ich tarif bilan platformani sinab ko'ring — hech qanday majburiyatsiz
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                <Link to="/diagnostics-register">Bepul boshlash <ArrowRight className="w-4 h-4 ml-1" /></Link>
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

export default DiagnosticsServicesSection;
