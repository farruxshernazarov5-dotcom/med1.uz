import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";

// Beta Supabase auth.oauth namespace — typed locally so we don't grep node_modules.
type OAuthClient = { name?: string; client_uri?: string; redirect_uris?: string[] } | null;
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

const OAuthConsentPage = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Ilovaga ulanish · MED1.UZ";
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("authorization_id parametri yo'q.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error: e } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (e) {
        setError(e.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: e } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (e) {
      setBusy(false);
      setError(e.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Provayder qaytish manzilini yubormadi.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" /> Ulanish xatosi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button asChild variant="outline">
              <Link to="/">Bosh sahifaga qaytish</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const clientName = details.client?.name ?? "tashqi ilova";
  const scopes = (details.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {clientName} MED1.UZ hisobingizga ulanmoqchi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Ruxsat bersangiz, <b>{clientName}</b> MED1.UZ MCP asboblariga siz nomingizdan
            murojaat qila oladi. MED1.UZ ma'lumotlarga kirish qoidalari (RLS) hamisha kuchda qoladi.
          </p>

          <div className="rounded-md border p-3 space-y-1 text-sm">
            <div className="font-medium">Ruxsat etiladi:</div>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Sizning MED1.UZ profilingizni o'qish</li>
              <li>Sizning qabullaringiz ro'yxatini ko'rish</li>
              <li>Ochiq bilimlar bazasi va klinikalar ro'yxatini qidirish</li>
            </ul>
            {scopes.length > 0 && (
              <div className="pt-2 text-xs text-muted-foreground">
                Identifikatsiya: {scopes.join(", ")}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => decide(true)} disabled={busy} className="flex-1">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ruxsat berish"}
            </Button>
            <Button onClick={() => decide(false)} disabled={busy} variant="outline" className="flex-1">
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConsentPage;
