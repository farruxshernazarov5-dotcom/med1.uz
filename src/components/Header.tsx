import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Tibbiyot", href: "/medicine" },
  { label: "Salomatlik", href: "/health" },
  { label: "Kasalliklar", href: "/diseases" },
  { label: "Maqolalar", href: "/articles" },
  { label: "Klinikalar", href: "/clinics" },
  { label: "Med texnika", href: "/med-tech" },
  { label: "Yangiliklar", href: "/news" },
  { label: "Diagnostika", href: "/diagnostics" },
  { label: "Dorixonalar", href: "/pharmacies" },
  { label: "Qon banklari", href: "/blood-banks" },
  { label: "Tug'ruqxonalar", href: "/maternity" },
];

const languages = ["UZ", "RU", "EN"];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("UZ");

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <span className="font-heading font-bold text-primary-foreground text-lg">M</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              Med1<span className="text-gradient">.uz</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.slice(0, 7).map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            <div className="relative group">
              <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent">
                Ko'proq ▾
              </button>
              <div className="absolute top-full right-0 mt-1 bg-card rounded-xl shadow-card-hover border border-border p-2 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {navItems.slice(7).map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Search className="w-5 h-5" />
            </Button>

            {/* Language Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCurrentLang(lang)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    currentLang === lang
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <Button variant="default" size="sm" className="hidden sm:flex bg-hero-gradient hover:opacity-90 text-primary-foreground border-0">
              Kirish
            </Button>

            {/* Mobile Menu */}
            <button
              className="lg:hidden p-2 text-muted-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-fade-up">
            <div className="grid grid-cols-2 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCurrentLang(lang)}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                      currentLang === lang
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <Button className="flex-1 bg-hero-gradient text-primary-foreground border-0">Kirish</Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
