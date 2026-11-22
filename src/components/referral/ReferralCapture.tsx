import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { captureReferralFromUrl, getStoredReferralCode, clearReferralCode } from "@/lib/referralCapture";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Captures ?ref= codes and, once a confirmed account is signed in, claims the
 * signup bonus server-side (works for email, phone and Google sign-ups alike).
 */
export default function ReferralCapture() {
  const location = useLocation();
  const { user } = useAuth();
  const claimedFor = useRef<string | null>(null);

  useEffect(() => {
    captureReferralFromUrl();
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) { claimedFor.current = null; return; }
    if (!user.email_confirmed_at && !user.phone_confirmed_at) return;
    // Account older than 30 days can never claim — skip the call.
    if (user.created_at && Date.now() - new Date(user.created_at).getTime() > 30 * 864e5) return;
    const code = getStoredReferralCode();
    const claimKey = `${user.id}:${code ?? ""}`;
    if (claimedFor.current === claimKey) return;
    claimedFor.current = claimKey;
    void (supabase as any).rpc("claim_my_signup_bonus", { _code: code }).then(({ error }: { error: unknown }) => {
      if (!error && code) clearReferralCode();
      if (error) claimedFor.current = null;
    });
  }, [user, location.pathname, location.search]);
  return null;
}
