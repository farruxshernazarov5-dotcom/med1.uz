import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreditInfo {
  balance: number;
  expiresAt: string | null;
  loading: boolean;
  refetch: () => void;
}

const CreditContext = createContext<CreditInfo>({ balance: 0, expiresAt: null, loading: true, refetch: () => {} });

export const CreditProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [balance, setBalance] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);

  const fetchCredits = useCallback(async (force = false) => {
    if (!user) { setBalance(0); setExpiresAt(null); setLoading(false); return; }
    // throttle: skip if last fetch < 1.5s ago and not forced
    if (!force && Date.now() - lastFetchRef.current < 1500) return;
    lastFetchRef.current = Date.now();
    setLoading(true);
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("user_credits")
      .select("balance, expires_at")
      .eq("user_id", user.id)
      .gt("expires_at", now)
      .gt("balance", 0)
      .order("expires_at", { ascending: true });

    const total = (data || []).reduce((sum, c) => sum + (c.balance || 0), 0);
    const nearest = data?.[0]?.expires_at || null;
    setBalance(total);
    setExpiresAt(nearest);
    setLoading(false);
  }, [user]);

  // Initial fetch + refetch on route change (every page entry)
  useEffect(() => { fetchCredits(true); }, [user, location.pathname, fetchCredits]);

  // Realtime sync: any change to this user's credit rows
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user_credits:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}` },
        () => { fetchCredits(true); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCredits]);

  // Refresh when tab regains focus / becomes visible
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
    <CreditContext.Provider value={{ balance, expiresAt, loading, refetch: () => fetchCredits(true) }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => useContext(CreditContext);
