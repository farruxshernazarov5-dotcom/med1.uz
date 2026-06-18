import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { recordMetric } from "@/lib/perfMonitor";

interface CreditInfo {
  balance: number;
  expiresAt: string | null;
  loading: boolean;
  refreshing: boolean;
  initialized: boolean;
  refetch: () => void;
}

const CACHE_KEY = "med1:credits:v1";
const CACHE_FRESH_MS = 30_000;   // route-change refetch only if cache older than this
const THROTTLE_MS = 1_500;

interface Cached {
  userId: string;
  balance: number;
  expiresAt: string | null;
  cachedAt: number;
}

const readCache = (): Cached | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
};

const writeCache = (c: Cached) => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
};

const CreditContext = createContext<CreditInfo>({
  balance: 0,
  expiresAt: null,
  loading: true,
  refreshing: false,
  initialized: false,
  refetch: () => {},
});

const CreditProviderInner = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  const cached = readCache();
  const initialCacheMatch = !!(cached && user && cached.userId === user.id);
  const [balance, setBalance] = useState<number>(initialCacheMatch ? cached!.balance : 0);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialCacheMatch ? cached!.expiresAt : null);
  const [loading, setLoading] = useState<boolean>(!initialCacheMatch);
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState<boolean>(initialCacheMatch);

  const lastFetchRef = useRef(0);
  const inflightRef = useRef<Promise<void> | null>(null);
  const initializedRef = useRef(initialCacheMatch);
  const firstPaintReportedRef = useRef(false);
  const mountTimeRef = useRef(performance.now());

  // Report first-paint metric once (cache hit = instant)
  useEffect(() => {
    if (firstPaintReportedRef.current) return;
    if (initialCacheMatch) {
      firstPaintReportedRef.current = true;
      recordMetric("credits.cache_hit", performance.now() - mountTimeRef.current);
    }
  }, [initialCacheMatch]);

  const fetchCredits = useCallback(async (force = false): Promise<void> => {
    if (!user) {
      setBalance(0); setExpiresAt(null); setLoading(false); setRefreshing(false);
      setInitialized(true); initializedRef.current = true;
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
      return;
    }
    if (!force && Date.now() - lastFetchRef.current < THROTTLE_MS) return;
    if (inflightRef.current) return inflightRef.current;
    lastFetchRef.current = Date.now();

    if (!initializedRef.current) setLoading(true); else setRefreshing(true);
    const t0 = performance.now();

    const run = (async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("user_credits")
          .select("balance, expires_at")
          .eq("user_id", user.id)
          .gt("expires_at", now)
          .gt("balance", 0)
          .order("expires_at", { ascending: true });
        if (error) throw error;

        const total = (data || []).reduce((sum, c) => sum + (c.balance || 0), 0);
        const nearest = data?.[0]?.expires_at || null;
        setBalance(total);
        setExpiresAt(nearest);
        writeCache({ userId: user.id, balance: total, expiresAt: nearest, cachedAt: Date.now() });
      } catch (e) {
        console.warn("[useCredits] fetch failed", e);
      } finally {
        const dt = performance.now() - t0;
        recordMetric("credits.fetch_ms", dt);
        if (!firstPaintReportedRef.current) {
          firstPaintReportedRef.current = true;
          recordMetric("credits.first_paint_ms", performance.now() - mountTimeRef.current, { cache: false });
        }
        setLoading(false);
        setRefreshing(false);
        setInitialized(true);
        initializedRef.current = true;
        inflightRef.current = null;
      }
    })();
    inflightRef.current = run;
    return run;
  }, [user]); // stable: no `initialized` dep

  // Initial fetch on user change
  useEffect(() => { void fetchCredits(true); }, [user, fetchCredits]);

  // Route-change refetch — ONLY if cache is stale. Prevents per-navigation Supabase
  // round-trip that was making the app feel frozen on rapid in-app navigation.
  useEffect(() => {
    if (!user) return;
    const c = readCache();
    if (!c || Date.now() - c.cachedAt > CACHE_FRESH_MS) {
      void fetchCredits();
    }
  }, [location.pathname, user, fetchCredits]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user_credits:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}` },
        () => { void fetchCredits(true); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCredits]);

  // Refresh on tab focus / visibility (throttled by fetchCredits itself)
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") void fetchCredits(); };
    const onFocus = () => void fetchCredits();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchCredits]);

  return (
    <CreditContext.Provider
      value={{ balance, expiresAt, loading, refreshing, initialized, refetch: () => { void fetchCredits(true); } }}
    >
      {children}
    </CreditContext.Provider>
  );
};

export const CreditProvider = ({ children }: { children: React.ReactNode }) => (
  <CreditProviderInner>{children}</CreditProviderInner>
);

export const useCredits = () => useContext(CreditContext);
