import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CircleHelp, Coins, Crown, Moon, Sun, MessageSquare, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClickMiniAppState, subscribeClickMiniApp } from "@/lib/clickMiniApp";
import { usePartnerSource } from "@/hooks/usePartnerSource";
import { useAuth } from "@/hooks/useAuth";
import ClickOnboarding, { clickOnboardingSeen } from "@/components/partner/ClickOnboarding";
import partnershipLogo from "@/assets/click_med_all_logo_header.webp";
import { MOBILE_AI_SERVICES } from "@/data/mobileAiCatalog";
import { AI_SERVICE_COVERS } from "@/data/aiServiceCovers";
import { useTheme } from "next-themes";
import { useCredits } from "@/hooks/useCredits";
const ClickRequests = lazy(() => import("@/components/partner/ClickRequests"));

export default function ClickMiniAppPage() {
  usePartnerSource();
  const host = useSyncExternalStore(subscribeClickMiniApp, getClickMiniAppState, getClickMiniAppState);
  const [query, setQuery] = useState("");
  const [onb, setOnb] = useState(() => !clickOnboardingSeen());
  const navigate = useNavigate();
  const {user}=useAuth();
  const {balance}=useCredits();
  const {resolvedTheme,setTheme}=useTheme();
  const dark=resolvedTheme!=='light';
  const [params]=useSearchParams();
  const guide = params.get('guide') === '1';
  useEffect(() => { if(guide) setOnb(true); }, [guide]);
  const requests=params.get('view')==='requests';
  return (
    <main className="min-h-screen bg-background text-foreground pb-28">
      <Helmet><title>Click × MED ALL — Med AI</title><meta name="description" content="Barcha Med AI xizmatlari, shaxsiy profil va Click so‘rovlari." /><link rel="icon" type="image/png" href="/click-partnership-favicon.png" /></Helmet>
      {onb && <ClickOnboarding onDone={() => setOnb(false)} />}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-5">
          <Link to="/click" className="flex items-center gap-3" aria-label="Med1.uz asosiy">
            <img src={partnershipLogo} alt="Click × MED ALL" width={700} height={90} fetchPriority="high" className="h-auto w-64 max-w-full rounded bg-card p-1" />
          </Link>
          <div className="flex shrink-0 items-center gap-2"><span role="status" className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            {host.active ? "Click ulangan" : "Med1.uz veb"}
          </span><Button variant="ghost" size="icon" aria-label={dark?"Kunduzgi rejim":"Tungi rejim"} title={dark?"Kunduzgi rejim":"Tungi rejim"} onClick={()=>setTheme(dark?'light':'dark')}>{dark?<Sun/>:<Moon/>}</Button><Button variant="ghost" size="icon" aria-label="Tanishtiruvni qayta ko‘rish" title="Tanishtiruvni qayta ko‘rish" onClick={() => setOnb(true)}><CircleHelp /></Button></div>
        </header>
        {requests ? <section className="py-6">{user?<Suspense fallback={<p role="status">Yuklanmoqda…</p>}><ClickRequests/></Suspense>:<Button asChild><Link to="/auth?next=%2Fclick%3Fview%3Drequests">Hisobga kirish</Link></Button>}</section> : <><section className="py-6">
          <h1 className="text-2xl font-semibold">Med AI xizmatlari</h1>
          {user&&<Link to="/ai-subscription" className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent p-4">
            <span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Coins className="h-5 w-5"/></span><span><span className="block text-xs text-muted-foreground">Med Coin balansingiz</span><span className="text-2xl font-bold">{balance}</span></span></span>
            <span className="flex items-center gap-1 text-sm font-medium text-primary">To‘ldirish<ArrowRight className="h-4 w-4"/></span>
          </Link>}
          {!user&&<Button asChild className="mt-4 w-full"><Link to="/auth?next=%2Fclick">Med AI uchun kirish</Link></Button>}
          <nav aria-label="Click shaxsiy menyusi" className="mt-4 grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-12"><Link to="/click/profile"><UserRound />Profil</Link></Button>
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
        <Button asChild variant="outline" className="mb-6 h-auto w-full overflow-hidden p-0"><Link to="/ai-orchestrator"><span className="relative h-24 w-28 shrink-0 overflow-hidden"><img src={AI_SERVICE_COVERS['ai-orchestrator']} width={768} height={512} loading="lazy" decoding="async" alt="" className="h-full w-full object-cover brightness-[0.7] saturate-[1.1]"/><span className="absolute inset-0 bg-gradient-to-r from-transparent to-foreground/30"/></span><span className="flex min-w-0 flex-1 items-center gap-2 px-3"><Sparkles className="shrink-0 text-primary"/>AI Orchestrator</span><ArrowRight className="mr-4 shrink-0"/></Link></Button>
        {([{id:'main',title:'Med AI xizmatlari'},{id:'special',title:'Ixtisoslashgan AI'},{id:'radiology',title:'Radiologiya AI'}] as const).map(group=><section key={group.id} className="mb-7">
        <h2 className="mb-3 text-lg font-semibold">{group.title}</h2>
        <nav aria-label={group.title} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MOBILE_AI_SERVICES.filter(service=>service.aiGroup===group.id).map(({ id, title, path, icon: Icon, tone }) => (
            <Button key={path} asChild variant="outline" className="group h-auto flex-col gap-0 overflow-hidden whitespace-normal rounded-lg bg-card p-0 text-left">
              <Link to={path}><div className="relative aspect-[3/2] w-full overflow-hidden bg-foreground"><img src={AI_SERVICE_COVERS[id]} alt="" width={768} height={512} loading="lazy" decoding="async" className="h-full w-full object-cover brightness-[0.68] saturate-[1.1] transition-transform duration-300 motion-safe:group-hover:scale-105" /><div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" /></div><span className="flex min-h-20 w-full items-center gap-2 p-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${tone}`}><Icon className="!h-4 !w-4" /></span><span className="min-w-0 flex-1 text-sm leading-snug">{title}</span></span></Link>
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
          <Link to="/privacy">Maxfiylik</Link><Link to="/terms">Foydalanish shartlari</Link><Button variant="link" className="h-auto p-0 text-xs" onClick={() => setOnb(true)}><CircleHelp className="h-3 w-3"/>Yordam</Button><Link to="/click/profile?section=support">Bog‘lanish</Link>
        </footer>
      </div>
    </main>
  );
}