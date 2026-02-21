import { Link } from "react-router-dom";
import { Info, Briefcase, Phone, BookOpen } from "lucide-react";
import AdBanner from "@/components/AdBanner";

const rightMenuItems = [
  { icon: Info, label: "Biz haqimizda", href: "/about" },
  { icon: Briefcase, label: "Xizmatlarimiz", href: "/services" },
  { icon: BookOpen, label: "Qo'llanma", href: "/user-guide" },
  { icon: Phone, label: "Aloqa", href: "/contact" },
];

const RightSidebar = () => {
  return (
    <div className="space-y-4">
      {/* Menu 2 */}
      <nav className="bg-card rounded-2xl border border-border shadow-card p-4">
        <h3 className="font-heading font-bold text-foreground mb-3 px-2 text-sm uppercase tracking-wider">
          Ma'lumot
        </h3>
        <ul className="space-y-0.5">
          {rightMenuItems.map((item) => (
            <li key={item.label}>
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

      {/* Ad Banner */}
      <AdBanner variant={0} />

      {/* Second Ad */}
      <AdBanner variant={1} />
    </div>
  );
};

export default RightSidebar;
