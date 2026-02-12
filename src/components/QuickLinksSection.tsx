import { Building2, Wrench, Activity, Pill, Droplets, Baby } from "lucide-react";
import { Link } from "react-router-dom";

const quickLinks = [
  { icon: Building2, label: "Klinikalar", href: "/clinics", gradient: "from-primary to-secondary" },
  { icon: Wrench, label: "Med texnika", href: "/med-tech", gradient: "from-medical-teal to-medical-green" },
  { icon: Activity, label: "Diagnostika", href: "/diagnostics", gradient: "from-medical-blue to-primary" },
  { icon: Pill, label: "Dorixonalar", href: "/pharmacies", gradient: "from-medical-orange to-medical-red" },
  { icon: Droplets, label: "Qon banklari", href: "/blood-banks", gradient: "from-medical-red to-medical-purple" },
  { icon: Baby, label: "Tug'ruqxonalar", href: "/maternity", gradient: "from-medical-purple to-primary" },
];

const QuickLinksSection = () => {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
          Tez havolalar
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="group flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all shadow-card hover:shadow-card-hover"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <link.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="font-heading font-semibold text-sm text-foreground text-center">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickLinksSection;
