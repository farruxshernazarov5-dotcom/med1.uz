import { Link } from "react-router-dom";
import { Building2, Wrench, Activity, Pill, Droplets, Baby, Megaphone } from "lucide-react";

const quickLinks = [
  { icon: Building2, label: "Klinikalar", href: "/clinics", gradient: "from-primary to-secondary" },
  { icon: Wrench, label: "Med texnika", href: "/med-tech", gradient: "from-medical-teal to-medical-green" },
  { icon: Activity, label: "Diagnostika", href: "/diagnostics", gradient: "from-medical-blue to-primary" },
  { icon: Pill, label: "Dorixonalar", href: "/pharmacies", gradient: "from-medical-orange to-medical-red" },
  { icon: Droplets, label: "Qon banklari", href: "/blood-banks", gradient: "from-medical-red to-medical-purple" },
  { icon: Baby, label: "Tug'ruqxonalar", href: "/maternity", gradient: "from-medical-purple to-primary" },
];

const CenterContent = () => {
  return (
    <div className="space-y-4">
      {/* Quick Links Grid */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading font-bold text-foreground mb-4 text-sm uppercase tracking-wider">
          Tez havolalar
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="group flex flex-col items-center gap-2.5 p-4 bg-background rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-card-hover"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <link.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-heading font-semibold text-xs text-foreground text-center">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Ad Banner */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="bg-accent/50 px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Megaphone className="w-3 h-3" />
            <span>Reklama</span>
          </div>
        </div>
        <div className="h-[120px] flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <p className="text-sm font-heading font-semibold text-foreground mb-1">Reklama banner</p>
            <p className="text-xs text-muted-foreground">728×90</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CenterContent;
