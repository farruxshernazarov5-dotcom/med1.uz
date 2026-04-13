import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, MailX } from "lucide-react";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
          headers: { apikey: anonKey },
        });
        const data = await res.json();
        if (res.ok && data.valid === true) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch { setStatus("invalid"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setStatus("success");
    } catch {
      setStatus("error");
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <p className="text-muted-foreground">Tekshirilmoqda...</p>
            </>
          )}
          {status === "valid" && (
            <>
              <MailX className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-xl font-bold text-foreground">Email bildirishnomalardan chiqish</h1>
              <p className="text-sm text-muted-foreground">
                Siz Med1.uz email bildirishnomalaridan chiqishni xohlaysizmi?
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
                {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Jarayonda...</> : "Ha, chiqishni tasdiqlash"}
              </Button>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto" />
              <h1 className="text-xl font-bold text-foreground">Allaqachon chiqilgan</h1>
              <p className="text-sm text-muted-foreground">Siz avval email bildirishnomalaridan chiqqansiz.</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h1 className="text-xl font-bold text-foreground">Muvaffaqiyatli!</h1>
              <p className="text-sm text-muted-foreground">Siz email bildirishnomalaridan chiqtingiz.</p>
            </>
          )}
          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <h1 className="text-xl font-bold text-foreground">Xatolik</h1>
              <p className="text-sm text-muted-foreground">
                {status === "invalid" ? "Noto'g'ri yoki eskirgan havola." : "Jarayonda xatolik yuz berdi."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsubscribePage;
