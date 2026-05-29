import Header from "@/components/Header";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  Target, Users, Globe, Shield, Rocket, Calendar,
  Eye, Code, ArrowLeft, Heart, Lightbulb, TrendingUp,
  Monitor, Database, Lock, Stethoscope
} from "lucide-react";
import founderImg from "@/assets/founder-farrukh.webp";
import seoImg from "@/assets/seo-javokhir.webp";
import missionImg from "@/assets/about-mission.webp";

const milestones = [
  { year: "2018", title: "Loyiha asos solinishi", desc: "Med1.uz g'oyasi tug'ildi — O'zbekiston tibbiyotini raqamlashtirish maqsadida", icon: Lightbulb },
  { year: "2019", title: "Birinchi versiya", desc: "Tibbiy atamalar bazasi va asosiy ma'lumotlar portali ishga tushirildi", icon: Rocket },
  { year: "2020", title: "Kengayish bosqichi", desc: "Kasalliklar klassifikatsiyasi, klinikalar va diagnostika markazlari qo'shildi", icon: TrendingUp },
  { year: "2022", title: "Yangi xizmatlar", desc: "Dorixonalar, qon banklari, tug'ruqxonalar va med texnika bo'limlari qo'shildi", icon: Heart },
  { year: "2024", title: "Zamonaviy platforma", desc: "To'liq qayta dizayn, 20,000+ tibbiy atamalar, yangiliklar portali", icon: Monitor },
  { year: "2026", title: "Avtomatlashtirish", desc: "Sun'iy intellekt integratsiyasi va tibbiyot jarayonlarini avtomatlashtirish", icon: Database },
];

const values = [
  { icon: Shield, title: "Shaffoflik", desc: "Tibbiy ma'lumotlarni ochiq va ishonchli tarzda taqdim etish" },
  { icon: Globe, title: "Qamrov", desc: "Barcha tibbiyot sohalarini bir platformada jamlash" },
  { icon: Lock, title: "Ishonchlilik", desc: "Tasdiqlangan va tekshirilgan tibbiy ma'lumotlar" },
  { icon: Users, title: "Foydalanuvchilar", desc: "Bemorlar va shifokorlar o'rtasida ko'prik bo'lish" },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Med1.uz haqida — O'zbekiston raqamli tibbiy ekotizimi"
        description="Med1.uz — 2018 yildan beri O'zbekiston tibbiyotini raqamlashtirayotgan platforma. Bizning missiya, qadriyatlar va jamoa haqida."
        path="/about"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Med1.uz haqida",
          url: "https://med1.uz/about",
        }}
      />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={missionImg} alt="Med1.uz missiyasi" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Bosh sahifa</span>
          </Link>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Biz haqimizda
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl leading-relaxed">
            Med1.uz — O'zbekistonning yetakchi tibbiy ma'lumotlar portali. 2018-yildan beri tibbiyot sohasini raqamlashtirish va shaffoflikni ta'minlash yo'lida xizmat qilmoqdamiz.
          </p>
        </div>
      </section>

      {/* Missiya */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Target className="w-4 h-4" />
              Bizning missiyamiz
            </div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              Tibbiyotni raqamlashtirish va avtomatlashtirish
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Med1.uz — foydalanuvchilar va tibbiyot sohalarini bog'lovchi, barcha ma'lumotlarni bir joyga jamlovchi zamonaviy platforma. Bizning maqsadimiz — O'zbekiston tibbiyotining barcha sohalarini qamrab olish, jarayonlarni raqamlashtirish va avtomatlashtirish orqali sifatli tibbiy xizmatlar ko'rsatishga hissa qo'shish.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((item) => (
              <div key={item.title} className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-card transition-shadow group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jamoa */}
      <section className="py-16 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              Bizning jamoa
            </div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              Loyihani yaratuvchilar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Founder */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-shadow">
              <div className="relative h-80 overflow-hidden">
                <img src={founderImg} alt="Farrukh Farkhadovich" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/80 to-transparent p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">Founder & CEO</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white">Farrukh Farkhadovich</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 bg-accent text-xs font-medium px-3 py-1.5 rounded-full text-foreground">
                    <Stethoscope className="w-3 h-3" /> Vrach-oftalmolog
                  </span>
                  <span className="inline-flex items-center gap-1 bg-accent text-xs font-medium px-3 py-1.5 rounded-full text-foreground">
                    <Eye className="w-3 h-3" /> Ko'z shifokori
                  </span>
                  <span className="inline-flex items-center gap-1 bg-accent text-xs font-medium px-3 py-1.5 rounded-full text-foreground">
                    <Code className="w-3 h-3" /> Web dizayner
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Med1.uz loyihasiga 2018-yilda asos solgan. Professional oftalmolog sifatida tibbiyot sohasini chuqur bilishi va web texnologiyalardan foydalanish tajribasi orqali O'zbekiston tibbiyotini raqamlashtirish g'oyasini hayotga tatbiq etmoqda. Loyihaning asosiy maqsadi — barcha tibbiyot sohalarini qamrab olish, shaffoflikni ta'minlash va zamonaviy texnologiyalarni tibbiyotga joriy etish.
                </p>
              </div>
            </div>

            {/* SEO / Technical */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-shadow">
              <div className="relative h-80 overflow-hidden">
                <img src={seoImg} alt="Javokhir Kadirov" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/80 to-transparent p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">Technical SEO</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white">Javokhir Kadirov</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 bg-accent text-xs font-medium px-3 py-1.5 rounded-full text-foreground">
                    <Code className="w-3 h-3" /> SEO mutaxassis
                  </span>
                  <span className="inline-flex items-center gap-1 bg-accent text-xs font-medium px-3 py-1.5 rounded-full text-foreground">
                    <Monitor className="w-3 h-3" /> Texnik optimallashtirish
                  </span>
                  <span className="inline-flex items-center gap-1 bg-accent text-xs font-medium px-3 py-1.5 rounded-full text-foreground">
                    <TrendingUp className="w-3 h-3" /> Raqamli marketing
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Med1.uz platformasining texnik SEO bo'yicha mutaxassisi. Saytning qidiruv tizimlarida yuqori o'rinlarga chiqishi, texnik optimallashtirish, tezlikni oshirish va foydalanuvchi tajribasini yaxshilash bo'yicha mas'ul. Zamonaviy SEO strategiyalari va raqamli marketing yondashuvlari orqali platformaning ko'rinuvchanligini ta'minlaydi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tarix - Timeline */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Calendar className="w-4 h-4" />
              Loyiha tarixi
            </div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              2018-yildan bugungi kungacha
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-8">
                {milestones.map((m, i) => (
                  <div key={m.year} className="relative flex gap-6 items-start">
                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-md">
                      <m.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-5 flex-1 hover:shadow-card transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{m.year}</span>
                        <h3 className="font-heading font-bold text-foreground">{m.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Raqamlar */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "20,000+", label: "Tibbiy atamalar" },
              { num: "500+", label: "Maqolalar" },
              { num: "11", label: "Tibbiyot bo'limlari" },
              { num: "2018", label: "Asos solingan yil" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-heading text-3xl md:text-4xl font-bold mb-2">{s.num}</div>
                <div className="text-primary-foreground/70 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
