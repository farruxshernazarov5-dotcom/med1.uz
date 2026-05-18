import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ReferralStats = {
  total_invites: number;
  pending_count: number;
  subscribed_count: number;
  approved_count: number;
  conversion_rate: number;
  total_credits: number;
  total_months: number;
  total_ai_credits: number;
  current_tier: string;
  next_tier_min: number;
};

export type ReferralCode = {
  id: string;
  owner_id: string;
  code: string;
  kind: string;
  org_role: string | null;
  is_active: boolean;
  total_uses: number;
  total_rewards_credits: number;
  total_rewards_months: number;
  created_at: string;
};

export type ReferralRow = {
  id: string;
  code_text: string | null;
  referrer_id: string;
  referred_user_id: string | null;
  referred_email: string | null;
  referred_org_role: string | null;
  status: string;
  subscription_tier: string | null;
  reward_credits: number;
  reward_months: number;
  reward_ai_credits: number;
  created_at: string;
  approved_at: string | null;
  subscribed_at: string | null;
};

export type ReferralWallet = {
  owner_id: string;
  credits_balance: number;
  ai_credits_balance: number;
  months_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
};

export type LeaderRow = {
  owner_id: string;
  org_role: string;
  total_uses: number;
  total_rewards_credits: number;
  rank: number;
};

export type ReferralNotif = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

const sb = supabase as any;

export const useReferral = () => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [wallet, setWallet] = useState<ReferralWallet | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [notifications, setNotifications] = useState<ReferralNotif[]>([]);

  const ensureCode = useCallback(async () => {
    if (!user) return null;
    const { data: existing } = await sb
      .from("referral_codes")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (existing) return existing as ReferralCode;

    const { data: gen } = await sb.rpc("generate_referral_code", { _owner_id: user.id });
    const newCode = typeof gen === "string" ? gen : String(gen ?? "").toUpperCase();
    const { data: ins } = await sb
      .from("referral_codes")
      .insert({
        owner_id: user.id,
        code: newCode,
        kind: userRole === "patient" ? "patient" : "org",
        org_role: userRole ?? null,
      })
      .select()
      .single();
    return ins as ReferralCode;
  }, [user, userRole]);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [codeRow, statsRes, walletRes, refsRes, leadRes, notifRes] = await Promise.all([
        ensureCode(),
        sb.rpc("get_referral_stats", { _owner_id: user.id }),
        sb.from("referral_wallet").select("*").eq("owner_id", user.id).maybeSingle(),
        sb.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }).limit(100),
        sb.from("referral_leaderboard").select("*").order("rank", { ascending: true }).limit(10),
        sb.from("referral_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);

      setCode(codeRow);
      setStats(Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data);
      setWallet(walletRes.data);
      setReferrals(refsRes.data ?? []);
      setLeaderboard(leadRes.data ?? []);
      setNotifications(notifRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [user, ensureCode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`referral-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "referrals", filter: `referrer_id=eq.${user.id}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "referral_notifications", filter: `user_id=eq.${user.id}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "referral_wallet", filter: `owner_id=eq.${user.id}` }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, reload]);

  const markNotifRead = async (id: string) => {
    await sb.from("referral_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const referralLink = code ? `${window.location.origin}/auth?ref=${code.code}` : "";

  return { loading, code, stats, wallet, referrals, leaderboard, notifications, referralLink, reload, markNotifRead };
};
