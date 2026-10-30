import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Apple, ArrowRight, Baby, Brain, Crown, FlaskConical, HeartPulse, Pill, ScanLine, Search, ShieldCheck, Smile, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClickMiniAppState, subscribeClickMiniApp } from "@/lib/clickMiniApp";
import { usePartnerSource } from "@/hooks/usePartnerSource";
import { useAuth } from "@/hooks/useAuth";
import ClickRequests from "@/components/partner/ClickRequests";
import ClickOnboarding, { clickOnboardingSeen } from "@/components/partner/ClickOnboarding";
import logo from "@/assets/logo.webp";

const services = [
  { name: "AI shifokor", path: "/ai-doctor-chat", icon: Stethoscope },
  { name: "Vital AI", path: "/ai-vital-signs", icon: HeartPulse },
  { name: "Tahlil tahlili", path: "/ai-report-analysis", icon: FlaskConical },
  { name: "AI diagnostika", path: "/ai-diagnostika", icon: ScanLine },
  { name: "Farmatsevt AI", path: "/ai-farmatsevt", icon: Pill },
  { name: "Dietolog AI", path: "/ai-dietolog", icon: Apple },
  { name: "Psixolog AI", path: "/ai-psixolog", icon: Brain },
  { name: "Homiladorlik AI", path: "/ai-pregnancy", icon: Baby },
  { name: "Bola parvarishi AI", path: "/ai-baby-care", icon: Smile },
];

export default function ClickMiniAppPage() {
  usePartnerSource();
  const host = useSyncExternalStore(subscribeClickMiniApp, getClickMiniAppState, getClickMiniAppState);
  const [query, setQuery] = useState("");
  const [onb, setOnb] = useState(() => !clickOnboardingSeen());
  const navigate = useNavigate();
  const {user,loading}=useAuth();
  const [params]=useSearchParams();
  const requests=params.get('view')==='requests';
  useEffect(()=>{if(!loading&&user&&!requests)navigate('/ai-services',{replace:true});},[loading,user?.id,requests,navigate]);
  return (
    <main className="min-h-screen bg-background text-foreground pb-28">
      {onb && !user && <ClickOnboarding onDone={() => setOnb(false)} />}
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
        {requests ? <section className="py-6">{user?<ClickRequests/>:<Button asChild><Link to="/auth?next=%2Fclick%3Fview%3Drequests">Hisobga kirish</Link></Button>}</section> : <><section className="py-6">
          <h1 className="text-2xl font-semibold">Med AI xizmatlari</h1>
          {!user&&<Button asChild className="mt-4 w-full"><Link to="/auth?next=%2Fai-services">Med AI uchun kirish</Link></Button>}
          <form className="mt-5 flex gap-2" onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) navigate(`/ai-doctor-chat?q=${encodeURIComponent(query.trim())}`);
          }}>
            <Input aria-label="Shikoyatingizni yozing" placeholder="Shikoyatingiz yoki savolingiz" value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 min-w-0" />
            <Button type="submit" size="icon" disabled={!query.trim()} className="h-12 w-12 shrink-0" aria-label="Qidirish"><Search /></Button>
          </form>
        </section>
        <nav aria-label="Med AI xizmatlari" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {services.map(({ name, path, icon: Icon }) => (
            <Button key={path} asChild variant="outline" className="h-28 flex-col gap-3 whitespace-normal rounded-lg bg-card p-3 text-center">
              <Link to={path}><Icon className="!h-7 !w-7 text-secondary" /><span>{name}</span></Link>
            </Button>
          ))}
        </nav>
        <section className="mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          <Button asChild variant="outline" className="h-14 justify-between"><Link to="/ai-services">Barcha AI xizmatlar <ArrowRight /></Link></Button>
          <Button asChild className="h-14 justify-between"><Link to="/ai-subscription"><span className="flex items-center gap-2"><Crown />AI tariflar</span><ArrowRight /></Link></Button>
        </section>
        </>}
        <footer className="mt-8 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/privacy">Maxfiylik</Link><Link to="/terms">Foydalanish shartlari</Link><Link to="/contact">Yordam</Link>
        </footer>
      </div>
    </main>
  );
}