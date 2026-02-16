import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-dark-gradient text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                <span className="font-heading font-bold text-lg">M</span>
              </div>
              <span className="font-heading font-bold text-xl">Med1.uz</span>
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              O'zbekistonning yetakchi tibbiy ma'lumotlar portali. 20,000+ tibbiy atamalar va ma'lumotlar bazasi.
            </p>
          </div>

          {/* Xizmatlar */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Xizmatlar</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              {["Klinikalar", "Med texnika", "Diagnostika markazlari", "Dorixonalar", "Qon banklari", "Tug'ruqxonalar"].map((item) => (
                <li key={item}>
                  <Link to="/" className="hover:text-primary-foreground transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ma'lumot */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Ma'lumot</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li><Link to="/about" className="hover:text-primary-foreground transition-colors">Biz haqimizda</Link></li>
              <li><Link to="/services" className="hover:text-primary-foreground transition-colors">Xizmatlarimiz</Link></li>
              <li><Link to="/user-guide" className="hover:text-primary-foreground transition-colors">Foydalanish shartlari</Link></li>
              <li><Link to="/user-guide" className="hover:text-primary-foreground transition-colors">Maxfiylik siyosati</Link></li>
              <li><Link to="/user-guide" className="hover:text-primary-foreground transition-colors">Qo'llanma</Link></li>
            </ul>
          </div>

          {/* Aloqa */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Aloqa</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                +998 (71) 123-45-67
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

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/40">
          <p>© 2026 Med1.uz. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-4">
            <span>UZ</span>
            <span>RU</span>
            <span>EN</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
