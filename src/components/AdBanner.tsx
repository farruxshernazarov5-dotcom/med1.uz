import { Link } from "react-router-dom";
import { Megaphone, ArrowRight, Stethoscope, BookOpen, Activity } from "lucide-react";

const adVariants = [
  {
    title: "Med1.uz — Tibbiy portal",
    desc: "20,000+ tibbiy atamalar, 1,200+ klinikalar, AI diagnostika",
    icon: Stethoscope,
    href: "/medicine",
    gradient: "from-primary to-secondary",
    cta: "Batafsil",
  },
  {
    title: "Tibbiy Ensiklopediya",
    desc: "A-Z tibbiy atamalar, davolash va profilaktika usullari",
    icon: BookOpen,
    href: "/medicine",
    gradient: "from-medical-teal to-primary",
    cta: "O'rganish",
  },
  {
    title: "AI Diagnostika",
    desc: "Sun'iy intellekt asosida simptomlar tahlili",
    icon: Activity,
    href: "/services",
    gradient: "from-medical-purple to-primary",
    cta: "Sinab ko'ring",
  },
];

const AdBanner = ({ variant = 0 }: { variant?: number }) => {
  const ad = adVariants[variant % adVariants.length];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="bg-accent/50 px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Megaphone className="w-3 h-3" />
          <span>Reklama</span>
        </div>
      </div>
      <Link to={ad.href} className="block group">
        <div className={`bg-gradient-to-br ${ad.gradient} p-6 text-center`}>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ad.icon className="w-7 h-7 text-white" />
          </div>
          <h4 className="font-heading font-bold text-white text-sm mb-1">{ad.title}</h4>
          <p className="text-white/80 text-xs mb-4 leading-relaxed">{ad.desc}</p>
          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors">
            {ad.cta}
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </Link>
      <div className="px-4 py-2 text-center">
        <p className="text-[10px] text-muted-foreground">med1.uz — sog'liq portali</p>
      </div>
    </div>
  );
};

export default AdBanner;
