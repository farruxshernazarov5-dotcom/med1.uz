import { useState, useSyncExternalStore } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Crown, MessageSquare, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClickMiniAppState, subscribeClickMiniApp } from "@/lib/clickMiniApp";
import { usePartnerSource } from "@/hooks/usePartnerSource";
import { useAuth } from "@/hooks/useAuth";
import ClickRequests from "@/components/partner/ClickRequests";
import ClickOnboarding, { clickOnboardingSeen } from "@/components/partner/ClickOnboarding";
import partnershipLogo from "@/assets/click-med-all-partnership.png";
import { MOBILE_AI_SERVICES } from "@/data/mobileServiceCatalog";

export default function ClickMiniAppPage() {
  usePartnerSource();
  const host = useSyncExternalStore(subscribeClickMiniApp, getClickMiniAppState, getClickMiniAppState);
  const [query, setQuery] = useState("");
  const [onb, setOnb] = useState(() => !clickOnboardingSeen());
  const navigate = useNavigate();
  const {user}=useAuth();
  const [params]=useSearchParams();
  const requests=params.get('view')==='requests';
  return (
    <main className="min-h-screen bg-background text-foreground pb-28">
      <Helmet><title>Click × MED ALL — Med AI</title><meta name="description" content="Barcha Med AI xizmatlari, shaxsiy profil va Click so‘rovlari." /><link rel="icon" type="image/png" href="/click-partnership-favicon.png" /></Helmet>
      {onb && <ClickOnboarding onDone={() => setOnb(false)} />}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-5">
          <Link to="/click" className="flex items-center gap-3" aria-label="Med1.uz asosiy">
            <img src={partnershipLogo} alt="Click × MED ALL" width={1536} height={512} className="h-14 w-52 max-w-full object-contain" />
          </Link>
          <span role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            {host.active ? "Click ulangan" : "Med1.uz veb"}
          </span>
        </header>
        {requests ? <section className="py-6">{user?<ClickRequests/>:<Button asChild><Link to="/auth?next=%2Fclick%3Fview%3Drequests">Hisobga kirish</Link></Button>}</section> : <><section className="py-6">
          <h1 className="text-2xl font-semibold">Med AI xizmatlari</h1>
          {!user&&<Button asChild className="mt-4 w-full"><Link to="/auth?next=%2Fclick">Med AI uchun kirish</Link></Button>}
          <nav aria-label="Click shaxsiy menyusi" className="mt-4 grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-12"><Link to="/mobile-profile"><UserRound />Profil</Link></Button>
            <Button asChild variant="outline" className="h-12"><Link to="/click?view=requests"><MessageSquare />So‘rovlarim</Link></Button>
          </nav>
          <form className="mt-5 flex gap-2" onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) navigate(`/ai-doctor-chat?q=${encodeURIComponent(query.trim())}`);
          }}>
            <Input aria-label="Shikoyatingizni yozing" placeholder="Shikoyatingiz yoki savolingiz" value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 min-w-0" />
            <Button type="submit" size="icon" disabled={!query.trim()} className="h-12 w-12 shrink-0" aria-label="Qidirish"><Search /></Button>
          </form>
        </section>
        <Button asChild variant="secondary" className="mb-6 h-14 w-full justify-between"><Link to="/ai-orchestrator"><span className="flex items-center gap-2"><Sparkles />AI Orchestrator</span><ArrowRight /></Link></Button>
        {([{id:'main',title:'Med AI xizmatlari'},{id:'special',title:'Ixtisoslashgan AI'},{id:'radiology',title:'Radiologiya AI'}] as const).map(group=><section key={group.id} className="mb-7">
        <h2 className="mb-3 text-lg font-semibold">{group.title}</h2>
        <nav aria-label={group.title} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MOBILE_AI_SERVICES.filter(service=>service.aiGroup===group.id).map(({ title, path, icon: Icon, tone }) => (
            <Button key={path} asChild variant="outline" className="h-28 flex-col gap-3 whitespace-normal rounded-lg bg-card p-3 text-center">
              <Link to={path}><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="!h-6 !w-6" /></span><span>{title}</span></Link>
            </Button>
          ))}
        </nav>
        </section>)}
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