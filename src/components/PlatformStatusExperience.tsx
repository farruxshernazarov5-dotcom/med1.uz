import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { Check, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getServiceActivities, subscribeServiceActivities } from "@/lib/serviceActivity";
import { maintenanceApplies, parsePlatformStatus, shouldShowRelease, type PlatformStatus } from "@/lib/platformStatus";
import ServiceProcessing from "./ServiceProcessing";
import maintenancePhoto from "@/assets/status-maintenance.jpg";
import updatePhoto from "@/assets/status-update.jpg";

export default function PlatformStatusExperience() {
  const { pathname } = useLocation();
  const activities = useSyncExternalStore(subscribeServiceActivities, getServiceActivities);
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [seen, setSeen] = useState(() => localStorage.getItem("medall-release-seen"));
  const [minimized, setMinimized] = useState(false);
  const [visibleActivity, setVisibleActivity] = useState(false);
  const current = activities[activities.length - 1];
  useEffect(() => {
    setVisibleActivity(false); setMinimized(false);
    if (!current) return;
    const timer = window.setTimeout(() => setVisibleActivity(true), 650);
    return () => clearTimeout(timer);
  }, [current?.id]);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const read = async () => {
      try { const response = await fetch(`/platform-status.json?t=${Math.floor(Date.now() / 300000)}`, { cache: "no-store", signal: controller.signal }); if (!response.ok) return; const next = parsePlatformStatus(await response.json()); if (alive && next) setStatus(next); } catch { /* An unavailable notice must not stop working services. */ }
    };
    void read(); const timer = window.setInterval(() => { if (document.visibilityState === "visible") void read(); }, 300000);
    return () => { alive = false; controller.abort(); clearInterval(timer); };
  }, []);
  const maintenance = status && maintenanceApplies(status, pathname);
  const release = status?.release;
  const update = !maintenance && !pathname.startsWith("/admin") && shouldShowRelease(release?.version, seen);
  const dismiss = () => { if (!release) return; localStorage.setItem("medall-release-seen", release.version); setSeen(release.version); };
  return <>
    {maintenance && status && <div className="platform-maintenance" role="alert"><div className="status-announcement"><p className="text-sm font-semibold text-secondary">MED ALL</p><img src={maintenancePhoto} width={768} height={768} alt="Tibbiy tizimni takomillashtirish" className="status-photo"/><h1 className="text-2xl font-semibold">{status.maintenance.title}</h1><p className="mt-3 text-sm text-muted-foreground">{status.maintenance.message}</p>{status.maintenance.until && <p className="mt-3 text-sm text-secondary">{status.maintenance.until}</p>}<Button className="mt-6" variant="outline" onClick={() => window.location.reload()}><RefreshCw/>Qayta tekshirish</Button></div></div>}
    <Dialog open={Boolean(update)} onOpenChange={open => { if (!open) dismiss(); }}><DialogContent className="status-update-dialog"><div className="status-announcement"><p className="text-sm font-semibold text-secondary">MED ALL · {release?.version}</p><img src={updatePhoto} width={768} height={768} alt="MED ALL yangilanishi" className="status-photo"/><DialogTitle className="text-2xl">{release?.title}</DialogTitle><DialogDescription className="mt-3">{release?.message}</DialogDescription><ul className="mt-4 space-y-2 text-left">{release?.highlights.map((item, i) => <li className="flex gap-2 text-sm" key={i}><Check className="h-4 w-4 shrink-0 text-secondary"/>{item}</li>)}</ul><Button className="mt-6 w-full" onClick={dismiss}>Davom etish</Button></div></DialogContent></Dialog>
    {current && visibleActivity && !maintenance && <aside className={`service-activity-overlay ${minimized ? "is-minimized" : ""}`} aria-label="Xizmat jarayoni"><Button className="absolute right-2 top-2 z-10" variant="ghost" size="icon" aria-label={minimized ? "Jarayonni ochish" : "Jarayonni kichraytirish"} onClick={() => setMinimized(v => !v)}>{minimized ? <RefreshCw/> : <X/>}</Button>{minimized ? <p className="py-3 pl-4 pr-14 text-sm text-foreground">MED ALL · Javob kutilmoqda</p> : <ServiceProcessing key={current.id} service={current.service} compact/>}</aside>}
  </>;
}