import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreditInfo {
  balance: number;
  expiresAt: string | null;
  loading: boolean;       // true only on the very first fetch (use for skeletons)
  refreshing: boolean;    // true on background refetches
  initialized: boolean;   // true after first fetch completes (regardless of success)
  refetch: () => void;
}

const CACHE_KEY = "med1:credits:v1";

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

/**
 * Inner provider — uses useLocation safely (must be rendered inside <BrowserRouter>).
 * Initial state is hydrated from sessionStorage so balance appears on first paint
 * (no skeleton flash) on browser refresh / deep-link entry.
 */
const CreditProviderInner = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Hydrate from cache (only if it belongs to the current user)
  const cached = readCache();
  const initialCacheMatch = cached && user && cached.userId === user.id;
  const [balance, setBalance] = useState<number>(initialCacheMatch ? cached!.balance : 0);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialCacheMatch ? cached!.expiresAt : null);
  const [loading, setLoading] = useState<boolean>(!initialCacheMatch);
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState<boolean>(!!initialCacheMatch);
  const lastFetchRef = useRef(0);
  const inflightRef = useRef<Promise<void> | null>(null);

  const fetchCredits = useCallback(async (force = false) => {
    if (!user) {
      setBalance(0); setExpiresAt(null); setLoading(false); setRefreshing(false); setInitialized(true);
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
      return;
    }
    if (!force && Date.now() - lastFetchRef.current < 1500) return;
    if (inflightRef.current) return inflightRef.current;
    lastFetchRef.current = Date.now();

    if (!initialized) setLoading(true); else setRefreshing(true);

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
        // Silent fail — keep last known balance
        console.warn("[useCredits] fetch failed", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setInitialized(true);
        inflightRef.current = null;
      }
    })();
    inflightRef.current = run;
    return run;
  }, [user, initialized]);

  // Initial fetch on user change
  useEffect(() => { fetchCredits(true); }, [user, fetchCredits]);

  // Refetch on every client-side route change
  useEffect(() => { if (user) fetchCredits(); }, [location.pathname, user, fetchCredits]);

  // Realtime subscription on this user's credit rows
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user_credits:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}` },
        () => { fetchCredits(true); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCredits]);

  // Refresh on tab focus / visibility
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") fetchCredits(); };
    const onFocus = () => fetchCredits();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchCredits]);

  return (
    <CreditContext.Provider
      value={{ balance, expiresAt, loading, refreshing, initialized, refetch: () => fetchCredits(true) }}
    >
      {children}
    </CreditContext.Provider>
  );
};

/**
 * Public provider — must be rendered INSIDE <BrowserRouter>. It's a thin wrapper
 * around CreditProviderInner so we can keep the public API stable while using
 * useLocation safely.
 */
export const CreditProvider = ({ children }: { children: React.ReactNode }) => (
  <CreditProviderInner>{children}</CreditProviderInner>
);

export const useCredits = () => useContext(CreditContext);
