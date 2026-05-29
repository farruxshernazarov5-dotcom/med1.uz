import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Star, Shield, Zap, Clock, Users, Monitor, BarChart3, Stethoscope, FlaskConical, Pill, BedDouble, Building, Heart, Wallet, MessageSquare, FileText, Bell, Mail, Phone, Calendar, UserCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import hmsDashboardImg from "@/assets/hms-dashboard.webp";
import hmsLabImg from "@/assets/hms-laboratory.webp";
import hmsFinanceImg from "@/assets/hms-finance.webp";
import hmsPharmacyImg from "@/assets/hms-pharmacy.webp";

const hmsModules = [
  {
    icon: Stethoscope,
    title: "Bemor boshqaruvi",
    desc: "Bemor kartasi, tibbiy tarix, qabul va navbat tizimi",
    img: hmsDashboardImg,
  },
  {
    icon: FlaskConical,
    title: "Laboratoriya moduli",
    desc: "Tahlil natijalari, laboratoriya xodimlari va avtomatik hisobot",
    img: hmsLabImg,
  },
  {
    icon: Wallet,
    title: "Moliya va buxgalteriya",
    desc: "Ish haqi, davomat, moliyaviy hisobotlar va prognozlash",
    img: hmsFinanceImg,
  },
  {
    icon: Pill,
    title: "Dorixona boshqaruvi",
    desc: "Dori bazasi, retseptlar, zaxira nazorati va farmatsevt moduli",
    img: hmsPharmacyImg,
  },
];

const allModules = [
  { icon: Briefcase, label: "Buxgalteriya" },
  { icon: Calendar, label: "Uchrashuv" },
  { icon: FlaskConical, label: "Laboratoriya" },
  { icon: BedDouble, label: "To'shak boshqaruvi" },
  { icon: Building, label: "Departament" },
  { icon: Heart, label: "Donor bazasi" },
  { icon: Wallet, label: "Moliya" },
  { icon: Pill, label: "Dorixona" },
  { icon: UserCheck, label: "Lab xodimi" },
  { icon: Stethoscope, label: "Hamshira" },
  { icon: Users, label: "Bemor kartasi" },
  { icon: FileText, label: "Retsept tizimi" },
  { icon: BarChart3, label: "Hisobotlar" },
  { icon: Bell, label: "E'lon tizimi" },
  { icon: Mail, label: "Email / SMS" },
  { icon: MessageSquare, label: "Chat tizimi" },
];

const whyChooseUs = [
  {
    icon: Monitor,
    title: "24 ta modul — bitta tizimda",
    desc: "Buxgalteriyadan tortib laboratoriyagacha, hammasini bir joyda boshqaring. Har bir modul bir-biri bilan integratsiyalangan.",
  },
  {
    icon: Shield,
    title: "Ma'lumotlar xavfsizligi",
    desc: "Barcha ma'lumotlar shifrlangan holda saqlanadi. HIPAA va mahalliy qonunchilik talablariga mos keladi.",
  },
  {
    icon: Zap,
    title: "AI yordamchi texnologiyalar",
    desc: "Premium tarifda AI moliyaviy prognozlash, dori ta'sir tahlili va laboratoriya natijalarini avtomatik yuborish mavjud.",
  },
  {
    icon: Clock,
    title: "Tezkor joriy etish",
    desc: "Tizimni 1-3 kun ichida to'liq sozlab, xodimlarni o'rgatamiz. Shaxsiy menejer tayinlanadi.",
  },
  {
    icon: Users,
    title: "Cheksiz foydalanuvchilar",
    desc: "Shifokorlar, hamshiralar, laborantlar, farmatsevtlar — barcha xodimlar uchun alohida profillar.",
  },
  {
    icon: BarChart3,
    title: "Kengaytirilgan analitika",
    desc: "Real-time statistika, departamentlar arasi taqqoslash va moliyaviy hisobotlar bir sahifada.",
  },
];

const HMSServicesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-full text-sm font-medium text-accent-foreground mb-4">
            <Monitor className="w-4 h-4" />
            Kasalxona boshqaruv tizimi (HMS)
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            To'liq <span className="text-gradient">kasalxona boshqaruv</span> tizimi
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Klinikangizning barcha jarayonlarini — bemordan buxgalteriyagacha — bitta raqamli platformada boshqaring
          </p>
        </div>

        {/* 4 Main modules with images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {hmsModules.map((mod, i) => (
            <div key={i} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
              <div className="aspect-video overflow-hidden">
                <img
                  src={mod.img}
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <mod.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground">{mod.title}</h3>
                </div>
                <p className="text-muted-foreground">{mod.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* All 16 modules grid */}
        <div className="mb-16">
          <h3 className="font-heading text-2xl font-bold text-center text-foreground mb-8">
            Tizimga kiruvchi <span className="text-gradient">barcha modullar</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {allModules.map((mod, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all text-center">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <mod.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">{mod.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why choose us */}
        <div className="mb-16">
          <h3 className="font-heading text-2xl font-bold text-center text-foreground mb-8">
            Nega <span className="text-gradient">Med1 HMS</span> ni tanlash kerak?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-heading text-lg font-bold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { value: "24+", label: "Modullar" },
            { value: "99.9%", label: "Uptime kafolati" },
            { value: "1-3 kun", label: "Joriy etish" },
            { value: "24/7", label: "Qo'llab-quvvatlash" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="font-heading text-3xl font-extrabold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="bg-hero-gradient border-0 text-lg px-8">
            <Link to="/pricing">
              Tariflarni ko'rish <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HMSServicesSection;
