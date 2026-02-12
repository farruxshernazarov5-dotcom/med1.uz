import { Link } from "react-router-dom";
import {
  BookOpen, Heart, Stethoscope, FileText, Building2, Wrench,
  Newspaper, Activity, Pill, Droplets, Baby, ArrowRight
} from "lucide-react";

const services = [
  { icon: BookOpen, label: "Tibbiyot", desc: "20,000+ tibbiy entsiklopediya", href: "/medicine", color: "bg-primary/10 text-primary" },
  { icon: Heart, label: "Salomatlik", desc: "5,000+ salomatlik ma'lumotlari", href: "/health", color: "bg-medical-red/10 text-medical-red" },
  { icon: Stethoscope, label: "Kasalliklar", desc: "Barcha kasalliklar bo'yicha", href: "/diseases", color: "bg-medical-orange/10 text-medical-orange" },
  { icon: FileText, label: "Maqolalar", desc: "Ilmiy va hujjatlar bo'limi", href: "/articles", color: "bg-medical-purple/10 text-medical-purple" },
  { icon: Building2, label: "Klinikalar", desc: "Xususiy va davlat kliniкalari", href: "/clinics", color: "bg-medical-teal/10 text-medical-teal" },
  { icon: Wrench, label: "Med texnika", desc: "Tibbiy texnikalar bazasi", href: "/med-tech", color: "bg-medical-navy/10 text-medical-navy" },
  { icon: Newspaper, label: "Yangiliklar", desc: "Tibbiy yangiliklar", href: "/news", color: "bg-medical-green/10 text-medical-green" },
  { icon: Activity, label: "Diagnostika", desc: "Diagnostika markazlari", href: "/diagnostics", color: "bg-primary/10 text-primary" },
  { icon: Pill, label: "Dorixonalar", desc: "25,000+ dori vositalari", href: "/pharmacies", color: "bg-medical-red/10 text-medical-red" },
  { icon: Droplets, label: "Qon banklari", desc: "Qon guruhlari bazasi", href: "/blood-banks", color: "bg-medical-orange/10 text-medical-orange" },
  { icon: Baby, label: "Tug'ruqxonalar", desc: "Davlat va xususiy", href: "/maternity", color: "bg-medical-purple/10 text-medical-purple" },
];

const ServicesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Bizning <span className="text-gradient">bo'limlar</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Med1.uz — O'zbekistondagi eng to'liq tibbiy ma'lumotlar portali
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map((service, i) => (
            <Link
              key={service.href}
              to={service.href}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 shadow-card hover:shadow-card-hover animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <service.icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">{service.label}</h3>
              <p className="text-sm text-muted-foreground mb-3">{service.desc}</p>
              <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Batafsil <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
