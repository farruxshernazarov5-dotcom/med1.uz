import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, Wallet } from "lucide-react";
import PaymeAdminPanel from "@/components/admin/payments/PaymeAdminPanel";

export default function PaymeAdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = "Payme boshqaruv paneli · MED1.UZ Admin";
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(Boolean(data));
    })();
  }, []);

  if (isAdmin === null) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="text-xl font-semibold">Faqat adminlar uchun</h1>
            <p className="text-muted-foreground">Bu sahifa yopiq. Admin roli talab qilinadi.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" /> Payme boshqaruv paneli
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Payme (Paycom) konfiguratsiyasi, endpoint healthcheck, 6 ta JSON-RPC metod testi,
          test to'lov yaratish, tranzaksiyalar va webhook loglari.
        </p>
      </header>

      <PaymeAdminPanel />
    </div>
  );
}
