import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Grid2X2, Heart, MapPin, Search, Sparkles, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MOBILE_CATEGORY_LABELS,
  MOBILE_SERVICE_CATALOG,
  type MobileServiceCategory,
  type MobileServiceItem,
} from "@/data/mobileServiceCatalog";
import { hapticTap } from "@/lib/nativeApp";
import { MobileServiceDetail } from "@/components/mobile/MobileServiceDetail";

type CategoryFilter = "all" | MobileServiceCategory;

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Barchasi" },
  ...Object.entries(MOBILE_CATEGORY_LABELS).map(([id, label]) => ({ id: id as MobileServiceCategory, label })),
];

const normalize = (value: string) => value.toLocaleLowerCase("uz").replace(/[‘’']/g, "");

export const MobileServiceCatalog = ({ dashboardPath, onOpenNearby, onOpenDoctors, onOpenFavorites }: { dashboardPath: string; onOpenNearby: () => void; onOpenDoctors: () => void; onOpenFavorites: () => void }) => {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedService, setSelectedService] = useState<MobileServiceItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const isSearching = query !== debouncedQuery;
  const services = useMemo(() => {
    const q = normalize(debouncedQuery.trim());
    return MOBILE_SERVICE_CATALOG
      .map((service) => service.category === "cabinet" && service.id === "patient-cabinet" ? { ...service, path: dashboardPath } : service)
      .filter((service) => category === "all" || service.category === category)
      .filter((service) => !q || normalize(`${service.title} ${service.description} ${MOBILE_CATEGORY_LABELS[service.category]}`).includes(q));
  }, [category, dashboardPath, debouncedQuery]);

  const grouped = useMemo(() => services.reduce<Record<string, MobileServiceItem[]>>((result, service) => {
    (result[service.category] ??= []).push(service);
    return result;
  }, {}), [services]);

  const quickActions = [
    { label: "Yaqin joylar", icon: MapPin, action: onOpenNearby },
    { label: "Shifokor topish", icon: Stethoscope, action: onOpenDoctors },
    { label: "Sevimlilar", icon: Heart, action: onOpenFavorites },
    { label: "Med1 AI", icon: Sparkles, action: () => window.dispatchEvent(new CustomEvent("med1:open-mobile-ai")) },
  ];

  return (
    <section className="pb-6" aria-label="Barcha xizmatlar katalogi">
      <div className="relative overflow-hidden border-b border-border bg-card px-4 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-ai-gradient opacity-[0.07]" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-semibold text-primary">Med1.uz ekotizimi</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">Barcha xizmatlar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Kerakli xizmatni qidiring yoki toifadan tanlang.</p>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} type="search" inputMode="search" placeholder="Shifokor, xizmat, AI yoki dori..." aria-label="Barcha xizmatlarni qidirish" className="h-12 bg-background pl-9 pr-10" />
            {query && <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-12" onClick={() => setQuery("")} aria-label="Qidiruvni tozalash"><X /></Button>}
          </div>
        </div>
      </div>

      {!query && (
        <div className="grid grid-cols-4 gap-2 px-4 py-4" aria-label="Tezkor amallar">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return <Button key={action.label} variant="outline" className="h-auto min-w-0 flex-col gap-1.5 whitespace-normal px-1 py-3 text-[10px] leading-tight" onClick={() => { void hapticTap(); action.action(); }}><Icon className="h-5 w-5 text-primary" />{action.label}</Button>;
          })}
        </div>
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3" aria-label="Xizmat toifalari">
        {FILTERS.map((filter) => <Button key={filter.id} size="sm" variant={category === filter.id ? "default" : "outline"} className="shrink-0 rounded-full" onClick={() => { void hapticTap(); setCategory(filter.id); }}>{filter.label}</Button>)}
      </div>

      <p className="px-4 pb-2 text-xs text-muted-foreground" role="status" aria-live="polite">{isSearching ? "Qidirilmoqda…" : `${services.length} ta xizmat topildi`}</p>

      {isSearching ? (
        <div className="grid grid-cols-2 gap-2 px-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg border border-border bg-muted" />)}</div>
      ) : services.length ? (
        <div className="space-y-5 px-4">
          {(Object.keys(MOBILE_CATEGORY_LABELS) as MobileServiceCategory[]).map((group) => grouped[group]?.length ? (
            <section key={group} aria-labelledby={`catalog-${group}`}>
              <div className="mb-2 flex items-center justify-between">
                <h3 id={`catalog-${group}`} className="text-sm font-bold text-foreground">{MOBILE_CATEGORY_LABELS[group]}</h3>
                <span className="text-xs text-muted-foreground">{grouped[group].length} ta</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {grouped[group].map((service) => {
                  const Icon = service.icon;
                  return (
                    <Button key={service.id} variant="ghost" onClick={() => { void hapticTap(); setSelectedService(service); }} className="group flex h-auto min-h-56 min-w-0 flex-col items-stretch justify-start overflow-hidden rounded-lg border border-border bg-card p-0 text-left shadow-card transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${service.title} haqida batafsil ma’lumot`}>
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                        {service.image && <img src={service.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" aria-hidden="true" />
                        <span className={`absolute bottom-2 left-2 flex h-9 w-9 items-center justify-center rounded-lg border border-background/20 shadow-card ${service.tone}`}><Icon className="h-4 w-4" /></span>
                        {service.badge && <span className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[9px] font-semibold text-card-foreground backdrop-blur-sm">{service.badge}</span>}
                      </div>
                      <span className="flex flex-1 flex-col p-3">
                        <span className="text-sm font-bold leading-tight text-foreground">{service.title}</span>
                        <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{service.description}</span>
                        <ArrowRight className="mt-auto h-4 w-4 self-end text-primary" />
                      </span>
                    </Button>
                  );
                })}
              </div>
            </section>
          ) : null)}
        </div>
      ) : (
        <div className="mx-4 flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center">
          <Grid2X2 className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 font-bold text-foreground">Xizmat topilmadi</h3>
          <p className="mt-1 text-sm text-muted-foreground">“Shifokor”, “AI”, “dori” yoki “tekshiruv” kabi qisqaroq so‘z kiriting.</p>
          <Button className="mt-4" variant="outline" onClick={() => { setQuery(""); setCategory("all"); }}>Barcha xizmatlarni ko‘rish</Button>
        </div>
      )}
      <MobileServiceDetail service={selectedService} open={Boolean(selectedService)} onOpenChange={(next) => { if (!next) setSelectedService(null); }} />
    </section>
  );
};
