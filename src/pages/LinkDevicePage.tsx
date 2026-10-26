import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redeemDeviceLink } from "@/lib/deviceLink";
import { isNativeApp } from "@/lib/nativeApp";

const TOKEN_RE = /^[a-f0-9]{48}$/;

/**
 * Opened by scanning the pairing QR shown on another device. Inside the Med ALL
 * app it redeems the token and signs in; in a plain browser it explains that
 * the link must be opened in the app.
 */
export default function LinkDevicePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const valid = TOKEN_RE.test(token);
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (!valid || ran.current) return;
    if (!isNativeApp()) { setState("error"); setMessage(""); return; }
    ran.current = true;
    redeemDeviceLink(token)
      .then((email) => { setState("done"); setMessage(email); })
      .catch((e: Error) => { setState("error"); setMessage(e.message); });
  }, [token, valid]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <Smartphone className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-xl font-bold">Qurilmani ulash</h1>
        {!valid ? (
          <p className="mt-3 text-sm text-destructive">Havola noto'g'ri. Kompyuterdagi sahifada yangi QR kod olib, qayta skanerlang.</p>
        ) : state === "working" ? (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Hisobingiz ulanmoqda…
          </p>
        ) : state === "done" ? (
          <>
            <CheckCircle2 className="mx-auto mt-4 h-12 w-12 text-medical-green" />
            <p className="mt-3 text-sm text-muted-foreground">{message} hisobi shu qurilmaga ulandi.</p>
            <Button className="mt-5 h-12 w-full" onClick={() => navigate("/", { replace: true })}>Bosh sahifaga o'tish</Button>
          </>
        ) : isNativeApp() ? (
          <>
            <p className="mt-3 text-sm text-destructive">{message}</p>
            <Button className="mt-5 h-12 w-full" variant="outline" onClick={() => navigate("/auth", { replace: true })}>Kirish sahifasiga o'tish</Button>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Bu havola Med ALL telefon ilovasida ochilishi kerak. Ilovani o'rnating va QR kodni ilova ichidagi skaner bilan o'qing.
          </p>
        )}
      </div>
    </main>
  );
}
