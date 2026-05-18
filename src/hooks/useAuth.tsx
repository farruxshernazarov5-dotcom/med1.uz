import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { getStoredReferralCode, getStoredReferralMeta, clearReferralCode } from "@/lib/referralCapture";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  profile: { full_name: string; phone: string; avatar_url: string } | null;
  signUp: (email: string, password: string, fullName: string, role?: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; phone: string; avatar_url: string } | null>(null);

  const fetchUserData = async (userId: string) => {
    const [roleRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("full_name, phone, avatar_url").eq("user_id", userId).maybeSingle(),
    ]);
    setUserRole(roleRes.data?.role ?? null);
    setProfile(profileRes.data ?? null);
  };

  useEffect(() => {
    const syncAuthState = async (sess: Session | null) => {
      setLoading(true);
      setSession(sess);
      setUser(sess?.user ?? null);

      if (sess?.user) {
        await fetchUserData(sess.user.id);
      } else {
        setUserRole(null);
        setProfile(null);
      }

      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      void syncAuthState(sess);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      void syncAuthState(sess);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role = "patient", phone = "") => {
    const referralCode = getStoredReferralCode();
    const referralMeta = getStoredReferralMeta();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
          ...(referralCode
            ? {
                referral_code: referralCode,
                referral_source: referralMeta?.source ?? null,
                referral_captured_at: referralMeta?.capturedAt ?? null,
              }
            : {}),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (!error && referralCode) {
      // Keep code until trigger persists referral row; clear after a short delay.
      setTimeout(() => clearReferralCode(), 5000);
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, profile, signUp, signIn, signInWithPhone, verifyPhoneOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
