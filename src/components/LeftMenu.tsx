import { Link } from "react-router-dom";
import {
  BookOpen, Heart, Stethoscope, FileText, Building2, Wrench,
  Newspaper, Activity, Pill, Droplets, Baby
} from "lucide-react";

const menuItems = [
  { icon: BookOpen, label: "Tibbiyot", href: "/medicine" },
  { icon: Heart, label: "Salomatlik", href: "/health" },
  { icon: Stethoscope, label: "Kasalliklar", href: "/diseases" },
  { icon: FileText, label: "Maqolalar", href: "/articles" },
  { icon: Building2, label: "Klinikalar", href: "/clinics" },
  { icon: Wrench, label: "Med texnika", href: "/med-tech" },
  { icon: Newspaper, label: "Yangiliklar", href: "/news" },
  { icon: Activity, label: "Diagnostika", href: "/diagnostics" },
  { icon: Pill, label: "Dorixonalar", href: "/pharmacies" },
  { icon: Droplets, label: "Qon banklari", href: "/blood-banks" },
  { icon: Baby, label: "Tug'ruqxonalar", href: "/maternity" },
];

const LeftMenu = () => {
  return (
    <nav className="bg-card rounded-2xl border border-border shadow-card p-4">
      <h3 className="font-heading font-bold text-foreground mb-3 px-2 text-sm uppercase tracking-wider">
        Bo'limlar
      </h3>
      <ul className="space-y-0.5">
        {menuItems.map((item, i) => (
          <li key={item.href}>
            <Link
              to={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-xl transition-all group"
            >
              <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default LeftMenu;
