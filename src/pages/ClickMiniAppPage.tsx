import { useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, CalendarDays, FlaskConical, Search, ShieldCheck, Sparkles, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClickMiniAppState, subscribeClickMiniApp } from "@/lib/clickMiniApp";
import logo from "@/assets/logo.webp";
import medical from "@/assets/hero-medical.webp";

const services = [
  { name: "Shifokorlar", path: "/doctors", icon: Stethoscope },
  { name: "Klinikalar", path: "/clinics", icon: Building2 },
  { name: "Diagnostika", path: "/diagnostics", icon: FlaskConical },
  { name: "Med AI", path: "/ai-services", icon: Sparkles },
  { name: "Qabullarim", path: "/mobile-appointments", icon: CalendarDays },
  { name: "Shaxsiy kabinet", path: "/mobile-profile", icon: UserRound },
];

export default function ClickMiniAppPage() {
  const host = useSyncExternalStore(subscribeClickMiniApp, getClickMiniAppState, getClickMiniAppState);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-background text-foreground pb-28">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-5">
          <Link to="/click" className="flex items-center gap-3" aria-label="Med1.uz asosiy">
            <img src={logo} alt="" className="h-11 w-11 object-contain" />
            <span className="font-heading text-xl font-bold">Med1.uz</span>
          </Link>
          <span role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            {host.active ? "Click ulangan" : "Med1.uz veb"}
          </span>
        </header>
        <section className="py-6">
          <h1 className="text-2xl font-semibold">Salomatlik markazi</h1>
          <form className="mt-5 flex gap-2" onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) navigate(`/smart-search?q=${encodeURIComponent(query.trim())}`);
          }}>
            <Input aria-label="Shifokor yoki xizmat qidirish" placeholder="Shifokor yoki xizmat" value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 min-w-0" />
            <Button type="submit" size="icon" disabled={!query.trim()} className="h-12 w-12 shrink-0" aria-label="Qidirish"><Search /></Button>
          </form>
        </section>
        <nav aria-label="Tibbiy xizmatlar" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {services.map(({ name, path, icon: Icon }) => (
            <Button key={path} asChild variant="outline" className="h-28 flex-col gap-3 whitespace-normal rounded-lg bg-card p-3 text-center">
              <Link to={path}><Icon className="!h-7 !w-7 text-secondary" /><span>{name}</span></Link>
            </Button>
          ))}
        </nav>
        <section className="mt-8 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Barcha xizmatlar</h2>
            <Button asChild variant="ghost" size="icon"><Link to="/mobile-services" aria-label="Barcha xizmatlarni ochish"><ArrowRight /></Link></Button>
          </div>
          <Link to="/mobile-services" className="block overflow-hidden rounded-lg">
            <img src={medical} alt="Tibbiy xizmatlar" className="aspect-[16/7] w-full object-cover" loading="lazy" />
          </Link>
        </section>
        <footer className="mt-8 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/privacy">Maxfiylik</Link><Link to="/terms">Foydalanish shartlari</Link><Link to="/contact">Yordam</Link>
        </footer>
      </div>
    </main>
  );
}