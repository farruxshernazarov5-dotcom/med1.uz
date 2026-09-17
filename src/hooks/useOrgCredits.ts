import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OrgCreditAccount {
  id: string;
  org_type: string;
  org_id: string | null;
  org_name: string | null;
  contract_id: string | null;
  balance: number;
  lifetime_coins: number;
}

export interface OrgCreditEntry {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

/** Muassasa (klinika, laboratoriya va h.k.) Med Coin hisobi va harakatlari */
export const useOrgCredits = (orgType?: string) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<OrgCreditAccount[]>([]);
  const [ledger, setLedger] = useState<OrgCreditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setAccounts([]); setLedger([]); setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let q = supabase
        .from("org_credit_accounts")
        .select("id, org_type, org_id, org_name, contract_id, balance, lifetime_coins")
        .eq("owner_id", user.id);
      if (orgType) q = q.eq("org_type", orgType);
      const { data: accs } = await q;
      setAccounts((accs as OrgCreditAccount[]) ?? []);

      const ids = (accs ?? []).map((a: { id: string }) => a.id);
      if (ids.length) {
        const { data: rows } = await supabase
          .from("org_credit_ledger")
          .select("id, type, amount, balance_after, description, created_at")
          .in("account_id", ids)
          .order("created_at", { ascending: false })
          .limit(50);
        setLedger((rows as OrgCreditEntry[]) ?? []);
      } else {
        setLedger([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, orgType]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`org_credits:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "org_credit_accounts", filter: `owner_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return { accounts, ledger, totalBalance, loading, refresh: load };
};

export default useOrgCredits;
