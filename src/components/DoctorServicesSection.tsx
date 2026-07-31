import { CheckCircle2, UserCheck, Calendar, BarChart3, Video, Star, Shield, Zap, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import doctorProfileImg from "@/assets/doctor-service-profile.webp";
import doctorBookingImg from "@/assets/doctor-service-booking.webp";
import doctorAnalyticsImg from "@/assets/doctor-service-analytics.webp";
import doctorOnlineImg from "@/assets/doctor-service-online.webp";

const services = [
  {
    title: "Professional profil sahifasi",
    desc: "O'zingizning shaxsiy brendingizni yarating — mutaxassislik, tajriba, ta'lim, sertifikatlar va barcha ma'lumotlarni bir joyda jamlang",
    img: doctorProfileImg,
    features: ["Shaxsiy profil URL", "Portfolio va sertifikatlar", "Bemor sharhlari", "Ijtimoiy tarmoqlar"],
  },
  {
    title: "Onlayn konsultatsiya moduli",
    desc: "Video va chat orqali bemorlar bilan masofaviy muloqot qiling — geografik chegaralarsiz amaliyotingizni kengaytiring",
    img: doctorOnlineImg,
    features: ["Video qo'ng'iroq", "Chat konsultatsiya", "Retsept yuborish", "Bemor tarixi"],
  },
  {
    title: "Aqlli yozilish tizimi",
    desc: "Bemorlar 24/7 onlayn yozilishi mumkin — jadvalingizni avtomatik boshqaring va vaqtingizni tejang",
    img: doctorBookingImg,
    features: ["24/7 onlayn yozilish", "Avtomatik eslatmalar", "Jadval boshqaruvi", "SMS bildirishnomalar"],
  },
  {
    title: "Analitika va hisobotlar",
    desc: "Bemor oqimi, daromad va reytingingizni real vaqtda kuzating — ma'lumotlarga asoslangan qarorlar qabul qiling",
    img: doctorAnalyticsImg,
    features: ["Bemor statistikasi", "Daromad tahlili", "Reyting dinamikasi", "Haftalik hisobot"],
  },
];

const whyChoose = [
  { icon: Star, title: "Ishonchli brend", desc: "O'zbekistonning yetakchi tibbiy platformasida professional profilingiz — minglab bemorlar har kuni qidiradi" },
  { icon: Zap, title: "AI yo'naltirish", desc: "Sun'iy intellekt bemorlarni simptomlariga mos shifokorlarga avtomatik yo'naltiradi — siz uxlab yotganingizda ham bemor keladi" },
  { icon: Shield, title: "Maxfiylik va xavfsizlik", desc: "Barcha ma'lumotlar shifrlangan va himoyalangan — HIPAA standartlariga mos tibbiy ma'lumotlar xavfsizligi" },
  { icon: Heart, title: "Bemor sadoqati", desc: "Sharhlar, reytinglar va takroriy yozilish tizimi — bemorlaringiz bilan uzoq muddatli munosabat o'rnating" },
  { icon: Calendar, title: "Vaqtni tejash", desc: "Avtomatik jadval boshqaruvi va eslatmalar — ma'muriy ishlarni 70% ga kamaytiring" },
  { icon: BarChart3, title: "O'sish analitikasi", desc: "Amaliyotingiz o'sishini real vaqtda kuzating — qaysi yo'nalishda rivojlanish kerakligini aniqlang" },
];

const DoctorServicesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium text-primary mb-4">
            <UserCheck className="w-4 h-4" />
            Shifokorlar uchun
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Professional <span className="text-gradient">profil xizmatlari</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            O'z brendingizni rivojlantiring, bemor oqimini oshiring va amaliyotingizni raqamlashtiring — barchasi bir platformada
          </p>
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
            Nega aynan <span className="text-gradient">Med1.uz</span>?
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
            <div className="inline-block bg-card rounded-2xl border border-border p-8 shadow-card">
              <p className="font-heading text-xl font-bold text-foreground mb-2">
                Hoziroq professional profilingizni yarating
              </p>
              <p className="text-muted-foreground mb-6">
                5 daqiqada ro'yxatdan o'ting va minglab bemorlar sizni topsin
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="bg-hero-gradient text-primary-foreground border-0" size="lg">
                  <Link to="/doctor-register">
                    Profil yaratish <ArrowRight className="w-4 h-4 ml-1" />
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

export default DoctorServicesSection;
