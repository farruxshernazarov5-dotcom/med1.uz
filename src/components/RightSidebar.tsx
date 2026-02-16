import { Link } from "react-router-dom";
import { Info, Briefcase, Phone, Megaphone } from "lucide-react";

const rightMenuItems = [
  { icon: Info, label: "Biz haqimizda", href: "/about" },
  { icon: Briefcase, label: "Xizmatlarimiz", href: "/services" },
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

      {/* Ad Space */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="bg-accent/50 px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Megaphone className="w-3 h-3" />
            <span>Reklama</span>
          </div>
        </div>
        <div className="h-[280px] flex items-center justify-center bg-muted/30 p-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-3 flex items-center justify-center">
              <Megaphone className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-heading font-semibold text-foreground mb-1">Reklama joyi</p>
            <p className="text-xs text-muted-foreground">300×250</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
