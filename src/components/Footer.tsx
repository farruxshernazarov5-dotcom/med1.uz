import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const serviceLinks = [
  { label: "Klinikalar", href: "/clinics" },
  { label: "Med texnika", href: "/med-tech" },
  { label: "Diagnostika markazlari", href: "/diagnostics" },
  { label: "Dorixonalar", href: "/pharmacies" },
  { label: "Qon banklari", href: "/blood-banks" },
  { label: "Tug'ruqxonalar", href: "/maternity" },
];

const encyclopediaLinks = [
  { label: "Tibbiyot", href: "/medicine" },
  { label: "Salomatlik", href: "/health" },
  { label: "Kasalliklar", href: "/diseases" },
  { label: "Maqolalar", href: "/articles" },
  { label: "Yangiliklar", href: "/news" },
  { label: "Oftalmologiya", href: "/articles/oftalmologiya" },
];

const infoLinks = [
  { label: "Biz haqimizda", href: "/about" },
  { label: "Xizmatlarimiz", href: "/services" },
  { label: "Qo'llanma", href: "/user-guide" },
  { label: "Developers / API", href: "/developers" },
  { label: "Sayt xaritasi", href: "/sitemap" },
];

const legalLinks = [
  { label: "Foydalanish shartlari", href: "/terms" },
  { label: "Maxfiylik siyosati", href: "/privacy" },
  { label: "Tibbiy ogohlantirish", href: "/disclaimer" },
  { label: "SaaS HMS shartlari", href: "/saas-terms" },
];

const Footer = () => {
  return (
    <footer className="bg-dark-gradient text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                <span className="font-heading font-bold text-lg">M</span>
              </div>
              <span className="font-heading font-bold text-xl">Med1.uz</span>
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed mb-4">
              O'zbekistonning yetakchi tibbiy ma'lumotlar portali. 20,000+ tibbiy atamalar va ma'lumotlar bazasi.
            </p>
          </div>

          {/* Xizmatlar */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Xizmatlar</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              {serviceLinks.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="hover:text-primary-foreground transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entsiklopediya */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Entsiklopediya</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              {encyclopediaLinks.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="hover:text-primary-foreground transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ma'lumot & Aloqa */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Ma'lumot</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60 mb-6">
              {infoLinks.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="hover:text-primary-foreground transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <div className="space-y-0.5">
                  <a href="tel:+998992144103" className="block hover:text-primary-foreground transition-colors">+998 99 214 41 03</a>
                  <a href="tel:+998777770463" className="block hover:text-primary-foreground transition-colors">+998 77 777 04 63</a>
                  <a href="tel:+998770000498" className="block hover:text-primary-foreground transition-colors">+998 77 000 04 98</a>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                info@med1.uz
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Toshkent, O'zbekiston
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-6">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-primary-foreground/60 mb-4">
            {legalLinks.map((l) => (
              <Link key={l.href} to={l.href} className="hover:text-primary-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/50">
            <p className="text-center">MED-ALL AI SYSTEM MCHJ © 2018–2026. Barcha huquqlar himoyalangan.</p>
            <div className="flex items-center gap-3">
              <span>UZ</span>
              <span>RU</span>
              <span>EN</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
