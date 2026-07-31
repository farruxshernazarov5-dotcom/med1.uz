import { CheckCircle2, Megaphone, BarChart3, Target, Video, Star, Shield, Zap, Eye, TrendingUp, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import adBannerImg from "@/assets/ad-service-banner.webp";
import adPremiumImg from "@/assets/ad-service-premium.webp";
import adAnalyticsImg from "@/assets/ad-service-analytics.webp";
import adTargetingImg from "@/assets/ad-service-targeting.webp";

const services = [
  {
    title: "Banner reklama",
    desc: "Platformaning barcha sahifalarida — bosh sahifa, klinikalar, diagnostika, dorixonalar bo'limlarida banner reklamangizni joylashtiring va minglab foydalanuvchilarga yeting",
    img: adBannerImg,
    features: ["Sidebar bannerlar", "Asosiy sahifa joylashuv", "Responsive dizayn", "Animatsiyali bannerlar"],
  },
  {
    title: "Premium listing",
    desc: "Qidiruv natijalarida birinchi o'rinda chiqing — bemorlar sizni raqobatchilardan oldin ko'radi va tanlaydi",
    img: adPremiumImg,
    features: ["Qidiruvda yuqori o'rin", "VIP belgi va badge", "Ajratilgan karta dizayni", "Ko'proq ko'rsatish"],
  },
  {
    title: "Maqsadli auditoriya",
    desc: "AI texnologiyasi yordamida reklamangizni eng to'g'ri auditoriyaga yo'naltiring — yosh, hudud, kasallik turi va qiziqishlar bo'yicha",
    img: adTargetingImg,
    features: ["Demografik targeting", "Hudud bo'yicha filtrlash", "Qiziqish bo'yicha", "AI tavsiyalar"],
  },
  {
    title: "Analitika va ROI",
    desc: "Reklama kampaniyangiz samaradorligini real vaqtda kuzating — ko'rsatishlar, kliklar, konversiyalar va ROI hisobotlari",
    img: adAnalyticsImg,
    features: ["Real-time statistika", "CTR va konversiya", "ROI hisoboti", "A/B testing"],
  },
];

const whyChoose = [
  { icon: Users, title: "100,000+ foydalanuvchi", desc: "Platformada oyiga 100,000 dan ortiq faol foydalanuvchi — reklama xabaringiz keng auditoriyaga yetadi" },
  { icon: Target, title: "Maqsadli auditoriya", desc: "AI texnologiyasi orqali reklamangiz faqat kerakli auditoriyaga ko'rsatiladi — har bir so'mning samaradorligi oshadi" },
  { icon: BarChart3, title: "Shaffof analitika", desc: "Har bir ko'rsatish, klik va konversiyani real vaqtda kuzating — reklama byudjetingiz qayerga sarflanayotganini bilib turing" },
  { icon: Shield, title: "Brendga mos muhit", desc: "Faqat tibbiy va salomatlik kontentida reklama — brendingiz ishonchli va professional muhitda paydo bo'ladi" },
  { icon: TrendingUp, title: "Yuqori konversiya", desc: "Tibbiy xizmatlarni izlayotgan foydalanuvchilar — ular allaqachon xarid qilishga tayyor, shuning uchun konversiya yuqori" },
  { icon: Zap, title: "5 daqiqada ishga tushiring", desc: "Reklama kampaniyangizni tezda sozlang va ishga tushiring — murakkab sozlamalar va uzoq kutishlar yo'q" },
];

const stats = [
  { value: "100K+", label: "Oylik foydalanuvchilar" },
  { value: "3.2%", label: "O'rtacha CTR" },
  { value: "85%", label: "Konversiya o'sishi" },
  { value: "24/7", label: "Qo'llab-quvvatlash" },
];

const AdvertisingServicesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium text-primary mb-4">
            <Megaphone className="w-4 h-4" />
            Reklama va premium
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Reklama va <span className="text-gradient">premium xizmatlar</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Tibbiy muassasangizni O'zbekistonning eng yirik sog'liqni saqlash platformasida targ'ib qiling — maqsadli auditoriya, shaffof analitika va yuqori konversiya
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5 text-center shadow-card">
              <p className="font-heading text-3xl font-extrabold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {services.map((s, i) => (
            <div key={i} className="group bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all">
              <div className="h-48 overflow-hidden">
                <img loading="lazy" decoding="async" src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
                <div className="grid grid-cols-2 gap-2">
                  {s.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Why choose us */}
        <div className="max-w-5xl mx-auto">
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Nega aynan <span className="text-gradient">Med1.uz</span> da reklama?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {whyChoose.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-heading font-bold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="inline-block bg-card rounded-2xl border border-border p-8 shadow-card max-w-xl">
              <Megaphone className="w-10 h-10 text-primary mx-auto mb-4" />
              <p className="font-heading text-xl font-bold text-foreground mb-2">
                Reklama kampaniyangizni hoziroq boshlang
              </p>
              <p className="text-muted-foreground mb-6">
                Minglab bemorlar sizning xizmatingizni kutmoqda — birinchi bo'lib ularga yeting
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="bg-hero-gradient text-primary-foreground border-0" size="lg">
                  <Link to="/partnership">
                    Reklama joylashtirish <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/pricing">Tariflarni ko'rish</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvertisingServicesSection;
