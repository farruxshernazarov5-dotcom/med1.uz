import { Link } from "react-router-dom";
import {
  BookOpen, Heart, Stethoscope, FileText, Building2, Wrench,
  Newspaper, Activity, Pill, Droplets, Baby, Eye
} from "lucide-react";

import medicinePills from "@/assets/medicine-pills.jpg";
import healthPrevention from "@/assets/health-prevention.jpg";
import catGynecology from "@/assets/cat-gynecology.jpg";
import artSelected from "@/assets/art-selected.jpg";
import clinicPrivate from "@/assets/clinic-private.jpg";
import medtechMri from "@/assets/medtech-mri.jpg";
import newsResearch from "@/assets/news-research.jpg";
import diagCenter from "@/assets/diag-center.jpg";
import pharmInterior from "@/assets/pharm-interior.jpg";
import bloodDonation from "@/assets/blood-donation.jpg";
import maternityHospital from "@/assets/maternity-hospital.jpg";
import eyeCataract from "@/assets/eye-cataract.jpg";

const tickerSections = [
  { icon: BookOpen, label: "Tibbiyot", href: "/medicine", image: medicinePills, count: "20,000+", gradient: "from-primary to-secondary" },
  { icon: Heart, label: "Salomatlik", href: "/health", image: healthPrevention, count: "500+", gradient: "from-medical-green to-medical-teal" },
  { icon: Stethoscope, label: "Kasalliklar", href: "/diseases", image: catGynecology, count: "5,000+", gradient: "from-medical-red to-medical-orange" },
  { icon: FileText, label: "Maqolalar", href: "/articles", image: artSelected, count: "3,000+", gradient: "from-medical-purple to-primary" },
  { icon: Building2, label: "Klinikalar", href: "/clinics", image: clinicPrivate, count: "1,200+", gradient: "from-primary to-medical-blue" },
  { icon: Wrench, label: "Med texnika", href: "/med-tech", image: medtechMri, count: "800+", gradient: "from-medical-teal to-medical-green" },
  { icon: Newspaper, label: "Yangiliklar", href: "/news", image: newsResearch, count: "10,000+", gradient: "from-medical-orange to-medical-red" },
  { icon: Activity, label: "Diagnostika", href: "/diagnostics", image: diagCenter, count: "350+", gradient: "from-medical-blue to-medical-teal" },
  { icon: Pill, label: "Dorixonalar", href: "/pharmacies", image: pharmInterior, count: "25,000+", gradient: "from-medical-green to-primary" },
  { icon: Droplets, label: "Qon banklari", href: "/blood-banks", image: bloodDonation, count: "120+", gradient: "from-medical-red to-medical-purple" },
  { icon: Baby, label: "Tug'ruqxonalar", href: "/maternity", image: maternityHospital, count: "200+", gradient: "from-medical-purple to-medical-red" },
  { icon: Eye, label: "Oftalmologiya", href: "/articles/oftalmologiya", image: eyeCataract, count: "400+", gradient: "from-primary to-medical-purple" },
  { icon: Eye, label: "Kosmetologiya", href: "/cosmetology", image: eyeCataract, count: "50+", gradient: "from-medical-purple to-secondary" },
];

const TickerItem = ({ section }: { section: typeof tickerSections[0] }) => {
  const Icon = section.icon;
  return (
    <Link
      to={section.href}
      className="flex-shrink-0 group relative w-44 h-24 rounded-xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
    >
      <img
        src={section.image}
        alt={section.label}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        loading="lazy"
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${section.gradient} opacity-70 group-hover:opacity-80 transition-opacity`} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-primary-foreground">
        <div className="w-8 h-8 rounded-lg bg-card/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold tracking-wide">{section.label}</span>
        <span className="text-[10px] opacity-80 bg-card/20 backdrop-blur-sm rounded-full px-2 py-0.5">{section.count}</span>
      </div>
    </Link>
  );
};

const SectionTicker = () => {
  // Duplicate for seamless loop
  const items = [...tickerSections, ...tickerSections];

  return (
    <div className="relative bg-card/50 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="flex items-center gap-4 py-2.5 px-4 animate-ticker hover:[animation-play-state:paused]">
        {items.map((section, i) => (
          <TickerItem key={`${section.href}-${i}`} section={section} />
        ))}
      </div>
    </div>
  );
};

export default SectionTicker;
