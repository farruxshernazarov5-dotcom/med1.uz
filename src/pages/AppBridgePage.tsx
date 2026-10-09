import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { buildAppHandoffUrl } from "@/lib/nativeOAuth";

const STATE_RE = /^[a-f0-9]{48}$/;

/**
 * Opened in the phone's browser by the Med ALL app. Signs the user in with
 * Google/Microsoft, then hands the session back to the app on a user tap.
 */
export default function AppBridgePage() {
  const [params] = useSearchParams();
  const provider = params.get("provider") === "microsoft" ? "microsoft" : "google";
  const state = params.get("state") ?? "";
  const validState = STATE_RE.test(state);
  const { user, loading } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!validState || loading || user) return;
    const flag = `med1_bridge_started_${state}`;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
    void lovable.auth
      .signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/app-bridge?provider=${provider}&state=${state}` })
      .then((r) => { if (r.error) setError("Kirish bekor qilindi yoki xatolik yuz berdi."); });
  }, [validState, loading, user, provider, state]);

  const returnToApp = async () => {
    setBusy(true);
    // Fresh tokens go to the app; the browser copy is dropped so the two never reuse one refresh token.
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !data.session) { setError("Sessiya topilmadi. Qayta urinib ko‘ring."); setBusy(false); return; }
    const url = buildAppHandoffUrl(state, data.session.access_token, data.session.refresh_token);
    supabase.auth.stopAutoRefresh();
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(".")[0];
    localStorage.removeItem(`sb-${ref}-auth-token`);
    setDone(true);
    window.location.href = url;
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <Smartphone className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-xl font-bold">Med ALL ilovasiga kirish</h1>
        {!validState ? (
          <p className="mt-3 text-sm text-destructive">Havola noto‘g‘ri. Ilovadagi “Google orqali kirish” tugmasini qayta bosing.</p>
        ) : error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : done ? (
          <p className="mt-3 text-sm text-muted-foreground">Ilova ochilmoqda… Agar ochilmasa, Med ALL ilovasini qo‘lda oching.</p>
        ) : user ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">{user.email} hisobiga kirdingiz. Davom etish uchun ilovaga qayting.</p>
            <Button className="mt-5 h-12 w-full" onClick={returnToApp} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Med ALL ilovasiga qaytish
            </Button>
          </>
        ) : (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {provider === "google" ? "Google" : "Microsoft"} sahifasi ochilmoqda…</p>
        )}
      </div>
    </main>
  );
}
