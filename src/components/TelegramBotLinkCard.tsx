import { useEffect, useState } from "react";
import { Send, CheckCircle2, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { telegramLinkStatus, telegramLinkUrl, telegramUnlink } from "@/lib/telegramBotLink";
import { toast } from "@/hooks/use-toast";

/** Profile setting: authorise @eMedInfobot to receive PDF reports, alerts and the 20:00 Med AI tip. */
export default function TelegramBotLinkCard() {
  const [linked, setLinked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => telegramLinkStatus().then(setLinked);
  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const connect = async () => {
    setBusy(true);
    const url = await telegramLinkUrl();
    setBusy(false);
    if (!url) return toast({ title: "Ulanib bo‘lmadi", description: "Qayta urinib ko‘ring.", variant: "destructive" });
    window.open(url, "_blank");
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Send className="h-5 w-5 text-primary" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Telegram bot (@eMedInfobot)</p>
            <p className="text-xs text-muted-foreground">PDF xulosalar, bildirishnomalar va har kuni 20:00 da Med AI maslahati</p>
          </div>
          {linked && <CheckCircle2 className="h-5 w-5 text-primary" />}
        </div>
        {linked === null ? <Loader2 className="h-4 w-4 animate-spin" /> : linked ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>Ulangan ✓</Button>
            <Button variant="ghost" size="sm" onClick={async () => { await telegramUnlink(); setLinked(false); }}><Unlink className="mr-1 h-4 w-4" />Uzish</Button>
          </div>
        ) : (
          <>
            <Button className="w-full" onClick={connect} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Telegram botni ulash</Button>
            <p className="text-[11px] text-muted-foreground">Tugmani bosing → Telegram ochiladi → “Start” ni bosing. Havola 15 daqiqa amal qiladi, keyin bu sahifaga qayting.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
