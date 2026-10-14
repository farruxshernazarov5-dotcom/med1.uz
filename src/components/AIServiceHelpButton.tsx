import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CircleHelp } from "lucide-react";
import { MOBILE_AI_SERVICES_WITH_IMAGES } from "@/data/mobileServiceCatalog";
import { MobileServiceDetail } from "@/components/mobile/MobileServiceDetail";

const SEEN = "med1_ai_story_seen_v1";

/** Every Med AI service page gets a "?" that replays its 4-frame animated explainer; it auto-plays once per service. */
const AIServiceHelpButton = () => {
  const { pathname } = useLocation();
  const service = MOBILE_AI_SERVICES_WITH_IMAGES.find((s) => s.path === pathname) ?? null;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    if (!service) return;
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(SEEN) ?? "[]");
      if (!seen.includes(service.id)) {
        localStorage.setItem(SEEN, JSON.stringify([...seen, service.id]));
        const t = window.setTimeout(() => setOpen(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch { /* storage blocked */ }
  }, [service?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!service) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${service.title} haqida yordam`}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 lg:bottom-6"
      >
        <CircleHelp className="h-6 w-6" />
      </button>
      <MobileServiceDetail service={service} open={open} onOpenChange={setOpen} />
    </>
  );
};

export default AIServiceHelpButton;
