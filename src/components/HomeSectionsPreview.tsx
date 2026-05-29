import { Link } from "react-router-dom";
import {
  BookOpen, Heart, Stethoscope, FileText, Building2, Wrench,
  Newspaper, Activity, Pill, Droplets, Baby, ArrowRight, Eye, Sparkles
} from "lucide-react";

import medicinePills from "@/assets/medicine-pills.webp";
import healthPrevention from "@/assets/health-prevention.webp";
import catGynecology from "@/assets/cat-gynecology.webp";
import artSelected from "@/assets/art-selected.webp";
import clinicPrivate from "@/assets/clinic-private.webp";
import medtechMri from "@/assets/medtech-mri.webp";
import newsResearch from "@/assets/news-research.webp";
import diagCenter from "@/assets/diag-center.webp";
import pharmInterior from "@/assets/pharm-interior.webp";
import bloodDonation from "@/assets/blood-donation.webp";
import maternityHospital from "@/assets/maternity-hospital.webp";
import eyeCataract from "@/assets/eye-cataract.webp";
import cosmetologyHero from "@/assets/cosmetology-hero.webp";

const sections = [
  {
    icon: BookOpen, label: "Tibbiyot", desc: "20,000+ tibbiy atamalar va davolash usullari",
    href: "/medicine", gradient: "from-primary to-secondary", count: "20,000+", image: medicinePills,
    floatingIcons: ["💊", "🧬", "🔬"],
  },
  {
    icon: Heart, label: "Salomatlik", desc: "Sog'lom turmush tarzi bo'yicha maslahatlar",
    href: "/health", gradient: "from-medical-green to-medical-teal", count: "500+", image: healthPrevention,
    floatingIcons: ["❤️", "🏃", "🥗"],
  },
  {
    icon: Stethoscope, label: "Kasalliklar", desc: "Kasalliklar klassifikatsiyasi va davolash",
    href: "/diseases", gradient: "from-medical-red to-medical-orange", count: "5,000+", image: catGynecology,
    floatingIcons: ["🦠", "🩺", "💉"],
  },
  {
    icon: FileText, label: "Maqolalar", desc: "Ilmiy va ommabop tibbiy maqolalar",
    href: "/articles", gradient: "from-medical-purple to-primary", count: "3,000+", image: artSelected,
    floatingIcons: ["📑", "📖", "✍️"],
  },
  {
    icon: Building2, label: "Klinikalar", desc: "Shifokor va klinikalar katalogi",
    href: "/clinics", gradient: "from-primary to-medical-blue", count: "1,200+", image: clinicPrivate,
    floatingIcons: ["🏥", "👨‍⚕️", "🩻"],
  },
  {
    icon: Wrench, label: "Med texnika", desc: "Zamonaviy tibbiy asbob-uskunalar",
    href: "/med-tech", gradient: "from-medical-teal to-medical-green", count: "800+", image: medtechMri,
    floatingIcons: ["⚙️", "🔧", "🖥️"],
  },
  {
    icon: Newspaper, label: "Yangiliklar", desc: "Jahon tibbiyot yangiliklari",
    href: "/news", gradient: "from-medical-orange to-medical-red", count: "10,000+", image: newsResearch,
    floatingIcons: ["📰", "🌍", "📡"],
  },
  {
    icon: Activity, label: "Diagnostika", desc: "Diagnostika markazlari va xizmatlari",
    href: "/diagnostics", gradient: "from-medical-blue to-medical-teal", count: "350+", image: diagCenter,
    floatingIcons: ["🔬", "📊", "🧪"],
  },
  {
    icon: Pill, label: "Dorixonalar", desc: "Dori vositalari va dorixonalar",
    href: "/pharmacies", gradient: "from-medical-green to-primary", count: "25,000+", image: pharmInterior,
    floatingIcons: ["💊", "🏪", "💉"],
  },
  {
    icon: Droplets, label: "Qon banklari", desc: "Qon quyish va donorlik xizmatlari",
    href: "/blood-banks", gradient: "from-medical-red to-medical-purple", count: "120+", image: bloodDonation,
    floatingIcons: ["🩸", "❤️", "🫀"],
  },
  {
    icon: Baby, label: "Tug'ruqxonalar", desc: "Onalar va chaqaloqlar uchun",
    href: "/maternity", gradient: "from-medical-purple to-medical-red", count: "200+", image: maternityHospital,
    floatingIcons: ["👶", "🤱", "🍼"],
  },
  {
    icon: Eye, label: "Oftalmologiya", desc: "Ko'z kasalliklari va davolash usullari",
    href: "/articles/oftalmologiya", gradient: "from-primary to-medical-purple", count: "400+", image: eyeCataract,
    floatingIcons: ["👁️", "🔍", "👓"],
  },
  {
    icon: Sparkles, label: "Kosmetologiya", desc: "Zamonaviy estetik tibbiyot xizmatlari",
    href: "/cosmetology", gradient: "from-medical-purple to-primary", count: "50+", image: cosmetologyHero,
    floatingIcons: ["✨", "💉", "💎"],
  },
];

const FloatingEmoji = ({ emoji, index }: { emoji: string; index: number }) => {
  const positions = [
    { top: "10%", right: "8%" },
    { top: "55%", right: "5%" },
    { bottom: "10%", right: "15%" },
  ];
  const pos = positions[index] || positions[0];
  return (
    <span
      className="absolute text-lg opacity-0 group-hover:opacity-80 transition-all duration-700 pointer-events-none animate-float"
      style={{
        ...pos,
        animationDelay: `${index * 0.4}s`,
        animationDuration: `${3 + index}s`,
        transitionDelay: `${index * 0.1}s`,
      } as React.CSSProperties}
    >
      {emoji}
    </span>
  );
};

const HomeSectionsPreview = () => {
  return (
    <section className="py-12 relative overflow-hidden">
      {/* Animated bg pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-medical-purple/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-slow" />
            <span className="text-sm font-medium text-primary">13 ta asosiy bo'lim</span>
          </div>
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">
            Barcha bo'limlar
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Med1.uz portalining barcha bo'limlari va xizmatlari bir joyda
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sections.map((section, i) => (
            <Link
              key={section.href}
              to={section.href}
              className="group relative bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Image */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={section.image}
                  alt={section.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${section.gradient} opacity-60`} />

                {/* Animated icon */}
                <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-card/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>

                {/* Floating emojis on hover */}
                {section.floatingIcons.map((emoji, ei) => (
                  <FloatingEmoji key={ei} emoji={emoji} index={ei} />
                ))}

                {/* Count badge */}
                <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-xs font-bold text-primary">{section.count}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-heading font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  {section.label}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{section.desc}</p>
                <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Batafsil</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeSectionsPreview;
