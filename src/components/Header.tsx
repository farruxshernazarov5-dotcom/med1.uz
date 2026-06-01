import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, User, LogOut, Shield, Coins, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/lib/dashboard";
import { useCredits } from "@/hooks/useCredits";
import { useLanguage, LANGUAGE_LABELS } from "@/hooks/useLanguage";
import type { SupportedLanguage } from "@/i18n/config";
import logoImg from "@/assets/logo.webp";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, profile, userRole, signOut } = useAuth();
  const { balance } = useCredits();
  const { lang, setLanguage, t } = useLanguage();
  const dashboardPath = getDashboardPath(userRole);

  const navItems = [
    { label: t("nav.medicine"), href: "/medicine" },
    { label: t("nav.health"), href: "/health" },
    { label: t("nav.diseases"), href: "/diseases" },
    { label: t("nav.articles"), href: "/articles" },
    { label: t("nav.encyclopedia"), href: "/knowledge" },
    { label: t("nav.clinics"), href: "/clinics" },
    { label: t("nav.aiServices"), href: "/ai-services" },
    { label: "API", href: "/api-docs" },
    { label: t("nav.medtech"), href: "/med-tech" },
    { label: t("nav.news"), href: "/news" },
    { label: t("nav.diagnostics"), href: "/diagnostics" },
    { label: t("nav.pharmacies"), href: "/pharmacies" },
    { label: t("nav.bloodBanks"), href: "/blood-banks" },
    { label: t("nav.maternity"), href: "/maternity" },
    { label: t("nav.cosmetology"), href: "/cosmetology" },
    { label: t("nav.partnership"), href: "/partnership" },
  ];

  const languages: SupportedLanguage[] = ["uz", "ru", "en"];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Med1.uz logotipi" className="w-10 h-10 rounded-xl object-contain" />
              <span className="font-heading font-bold text-xl text-foreground">
                Med1<span className="text-gradient">.uz</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.slice(0, 7).map((item) => (
                <Link key={item.href} to={item.href} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent">
                  {item.label}
                </Link>
              ))}
              <div className="relative group">
                <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent">
                  Ko'proq ▾
                </button>
                <div className="absolute top-full right-0 mt-1 bg-card rounded-xl shadow-card-hover border border-border p-2 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {navItems.slice(7).map((item) => (
                    <Link key={item.href} to={item.href} className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setSearchOpen(true)}
                className="text-muted-foreground gap-2 hidden sm:flex"
              >
                <Search className="w-4 h-4" />
                <span className="text-xs">Qidirish</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Qidiruv" className="text-muted-foreground sm:hidden" onClick={() => setSearchOpen(true)}>
                <Search className="w-5 h-5" />
              </Button>

              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
                {languages.map((code) => (
                  <button key={code} onClick={() => setLanguage(code)} title={LANGUAGE_LABELS[code].label} className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${lang === code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {LANGUAGE_LABELS[code].code}
                  </button>
                ))}
              </div>

              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/ai-subscription" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                    <Coins className="w-3.5 h-3.5" />
                    🪙 {balance}
                  </Link>
                  <Button asChild variant="ghost" size="sm" className="text-emerald-700 dark:text-emerald-400" title="Xodim Check-in/out">
                    <Link to="/check-in"><ScanLine className="w-4 h-4 mr-1" /> Keldi-Ketdi</Link>
                  </Button>
                  {userRole === "admin" && (
                    <Button asChild variant="ghost" size="sm" className="text-primary">
                      <Link to="/admin"><Shield className="w-4 h-4 mr-1" /> Admin</Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                    <Link to={dashboardPath}><User className="w-4 h-4 mr-1" /> {profile?.full_name?.split(" ")[0] || "Panel"}</Link>
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Chiqish" onClick={signOut} className="text-muted-foreground"><LogOut className="w-4 h-4" /></Button>
                </div>
              ) : (
                <Button asChild variant="default" size="sm" className="hidden sm:flex bg-hero-gradient hover:opacity-90 text-primary-foreground border-0">
                  <Link to="/auth">Kirish</Link>
                </Button>
              )}

              <button aria-label={isOpen ? "Menyuni yopish" : "Menyuni ochish"} aria-expanded={isOpen} className="lg:hidden p-2 text-muted-foreground" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {isOpen && (
            <nav className="lg:hidden py-4 border-t border-border animate-fade-up">
              <div className="grid grid-cols-2 gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} to={item.href} className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  {languages.map((code) => (
                    <button key={code} onClick={() => setLanguage(code)} className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${lang === code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {LANGUAGE_LABELS[code].code}
                    </button>
                  ))}
                </div>
                {user ? (
                  <div className="flex flex-1 gap-2 flex-wrap">
                    <Button asChild variant="outline" className="flex-1 min-w-[140px]">
                      <Link to="/check-in" onClick={() => setIsOpen(false)}><ScanLine className="w-4 h-4 mr-1" /> Keldi-Ketdi</Link>
                    </Button>
                    {userRole === "admin" && (
                      <Button asChild variant="outline" className="flex-1">
                        <Link to="/admin" onClick={() => setIsOpen(false)}><Shield className="w-4 h-4 mr-1" /> Admin</Link>
                      </Button>
                    )}
                    <Button asChild className="flex-1 bg-hero-gradient text-primary-foreground border-0">
                      <Link to={dashboardPath} onClick={() => setIsOpen(false)}>Panel</Link>
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="flex-1 bg-hero-gradient text-primary-foreground border-0">
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Kirish</Link>
                  </Button>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Header;
