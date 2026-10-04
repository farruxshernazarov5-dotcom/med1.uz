import { Link } from "react-router-dom";
import { ArrowRight, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOBILE_QUICK_SERVICES } from "@/data/mobileServiceCatalog";
import { hapticTap } from "@/lib/nativeApp";

export const MobileHomeQuickServices = () => (
  <section className="relative overflow-hidden border-y border-border bg-card px-4 py-6 lg:hidden" aria-labelledby="mobile-quick-title">
    <div className="pointer-events-none absolute inset-0 bg-ai-gradient opacity-[0.06]" aria-hidden="true" />
    <div className="relative">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">Tezkor kirish</p>
          <h2 id="mobile-quick-title" className="text-xl font-bold text-foreground">Kerakli xizmatlar</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/mobile-services" onClick={() => void hapticTap()}>Barchasi <ArrowRight /></Link>
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MOBILE_QUICK_SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <Link key={service.id} to={service.path} onClick={() => void hapticTap()} className="group relative flex aspect-[4/5] min-w-0 items-end overflow-hidden rounded-lg border border-border bg-muted p-2 text-left shadow-card transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {service.image && <img src={service.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />}
              <span className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/25 to-transparent" aria-hidden="true" />
              <span className="relative w-full">
                <span className={`mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg ${service.tone}`}><Icon className="h-4 w-4" /></span>
                <span className="block w-full text-[10px] font-bold leading-tight text-primary-foreground">{service.title}</span>
              </span>
            </Link>
          );
        })}
        <Link to="/mobile-services" onClick={() => void hapticTap()} className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-1 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Grid2X2 className="h-5 w-5" /></span>
          <span className="w-full text-[11px] font-semibold leading-tight text-foreground">Barcha xizmatlar</span>
        </Link>
      </div>
    </div>
  </section>
);
