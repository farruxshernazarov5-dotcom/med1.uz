import { Link } from "react-router-dom";
import { Brain, Building2, Microscope, Pill, Droplets, Baby } from "lucide-react";

const items = [
  { label: "Bizning xizmatlar", href: "/services", icon: Building2 },
  { label: "Tariflar", href: "/pricing", icon: Building2 },
  { label: "AI tariflari", href: "/ai-subscription", icon: Brain },
  { label: "Diagnostika", href: "/diagnostics", icon: Microscope },
  { label: "Dorixonalar", href: "/pharmacies", icon: Pill },
  { label: "Qon banklari", href: "/blood-banks", icon: Droplets },
  { label: "Tug'ruqxona", href: "/maternity", icon: Baby },
];

const HomeServicesMenu = () => {
  return (
    <section className="py-5 border-y border-border bg-card/70 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Bizning xizmatlar</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeServicesMenu;
