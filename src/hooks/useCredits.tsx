import { useState, useEffect, createContext, useContext, useCallback } from "react";
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
  const [balance, setBalance] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) { setBalance(0); setExpiresAt(null); setLoading(false); return; }
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

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  return (
    <CreditContext.Provider value={{ balance, expiresAt, loading, refetch: fetchCredits }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => useContext(CreditContext);
