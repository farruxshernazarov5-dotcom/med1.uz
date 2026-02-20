import { Link } from "react-router-dom";
import {
  BookOpen, Heart, Stethoscope, FileText, Building2, Wrench,
  Newspaper, Activity, Pill, Droplets, Baby, Eye
} from "lucide-react";

const menuItems = [
  { icon: BookOpen, label: "Tibbiyot", href: "/medicine", gradient: "from-primary to-secondary" },
  { icon: Heart, label: "Salomatlik", href: "/health", gradient: "from-medical-green to-medical-teal" },
  { icon: Stethoscope, label: "Kasalliklar", href: "/diseases", gradient: "from-medical-red to-medical-orange" },
  { icon: FileText, label: "Maqolalar", href: "/articles", gradient: "from-medical-purple to-primary" },
  { icon: Building2, label: "Klinikalar", href: "/clinics", gradient: "from-primary to-medical-blue" },
  { icon: Wrench, label: "Med texnika", href: "/med-tech", gradient: "from-medical-teal to-medical-green" },
  { icon: Newspaper, label: "Yangiliklar", href: "/news", gradient: "from-medical-orange to-medical-red" },
  { icon: Activity, label: "Diagnostika", href: "/diagnostics", gradient: "from-medical-blue to-primary" },
  { icon: Pill, label: "Dorixonalar", href: "/pharmacies", gradient: "from-medical-green to-primary" },
  { icon: Droplets, label: "Qon banklari", href: "/blood-banks", gradient: "from-medical-red to-medical-purple" },
  { icon: Baby, label: "Tug'ruqxonalar", href: "/maternity", gradient: "from-medical-purple to-primary" },
  { icon: Eye, label: "Oftalmologiya", href: "/articles/oftalmologiya", gradient: "from-primary to-medical-purple" },
];

const LeftMenu = () => {
  return (
    <nav className="bg-card rounded-2xl border border-border shadow-card p-4">
      <h3 className="font-heading font-bold text-foreground mb-3 px-2 text-sm uppercase tracking-wider">
        Bo'limlar
      </h3>
      <ul className="space-y-0.5">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-xl transition-all group"
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <item.icon className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default LeftMenu;
