/**
 * Partner source detection for Web-View integrations (HAMBI, UNITEL, etc.)
 *
 * Detects ?source=hambi (or any partner slug) in the URL, persists it for the
 * entire session, and exposes the active partner metadata + return URL.
 *
 * Also fires a single visit-tracking call to the `partner-track` edge function
 * the first time a partner source is detected in a session.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "med1_partner_source";
const SESSION_KEY = "med1_partner_session";
const TRACKED_KEY = "med1_partner_tracked";

export interface PartnerSource {
  slug: string;
  name: string;
  return_url: string | null;
  brand_color: string | null;
  logo_url: string | null;
}

const KNOWN_FALLBACKS: Record<string, PartnerSource> = {
  hambi: {
    slug: "hambi",
    name: "HAMBI by UNITEL",
    return_url: "https://hambi.uz",
    brand_color: "#E30613",
    logo_url: null,
  },
  unitel: {
    slug: "unitel",
    name: "UNITEL",
    return_url: "https://unitel.uz",
    brand_color: "#E30613",
    logo_url: null,
  },
};

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export const usePartnerSource = () => {
  const location = useLocation();
  const [partner, setPartner] = useState<PartnerSource | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PartnerSource) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const slug = (params.get("source") || params.get("partner") || "").toLowerCase().trim();
    if (!slug) return;

    let cancelled = false;

    const hydrate = async () => {
      // Try DB first, fall back to known constants so the UI works offline.
      const { data } = await supabase
        .from("partner_sources")
        .select("slug,name,return_url,brand_color,logo_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      const next: PartnerSource | null = data ?? KNOWN_FALLBACKS[slug] ?? null;
      if (!next || cancelled) return;

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPartner(next);

      // One visit per session per slug
      const trackedKey = `${TRACKED_KEY}:${slug}`;
      if (!sessionStorage.getItem(trackedKey)) {
        sessionStorage.setItem(trackedKey, "1");
        const session_id = getSessionId();
        const { data: auth } = await supabase.auth.getUser();
        supabase.functions
          .invoke("partner-track", {
            body: {
              event: "visit",
              source_slug: slug,
              session_id,
              user_id: auth.user?.id ?? null,
              landing_path: location.pathname + location.search,
              referrer: document.referrer || null,
              user_agent: navigator.userAgent,
              utm: {
                utm_source: params.get("utm_source"),
                utm_medium: params.get("utm_medium"),
                utm_campaign: params.get("utm_campaign"),
              },
            },
          })
          .catch(() => void 0);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [location.search, location.pathname]);

  const clear = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPartner(null);
  };

  return { partner, clear, sessionId: getSessionId() };
};
