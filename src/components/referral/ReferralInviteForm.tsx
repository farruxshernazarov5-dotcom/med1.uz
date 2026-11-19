import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Copy, MessageCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useReferral } from "@/hooks/useReferral";

/** Saytdan to'g'ridan-to'g'ri taklif yuborish: Telegram, WhatsApp, SMS yoki nusxa. */
export const ReferralInviteForm = () => {
  const { user } = useAuth();
  const { referralLink, loading } = useReferral();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
        <p className="font-semibold">Taklif yuborish uchun hisobingizga kiring</p>
        <p className="text-sm text-muted-foreground">Yangi tasdiqlangan hisobga 10 000 so‘m. Har bir do‘stingizning birinchi pullik xaridi uchun sizga 5 000 so‘m.</p>
        <Button asChild><Link to="/auth?mode=register&next=/referral">Ro‘yxatdan o‘tish</Link></Button>
      </div>
    );
  }
  const text = `${name ? name + ", " : ""}MED-ALL AI / med1.uz — salomatligingiz uchun AI xizmatlari.\n🎁 Havolam orqali yangi hisob ochib tasdiqlang — avans kartangizga 10 000 so‘m bonus. Tarif va Med Coin xaridiga ishlating.\n🤝 Siz ham do‘stlaringizni taklif qiling: har birining birinchi pullik xaridi uchun 5 000 so‘m bonus oling.\n${referralLink}`;
  const enc = encodeURIComponent(text);
  const digits = phone.replace(/\D/g, "");
  const sms = `sms:${digits ? "+" + (digits.startsWith("998") ? digits : "998" + digits) : ""}?body=${enc}`;
  const copy = async () => { await navigator.clipboard.writeText(text); toast.success("Taklif matni nusxalandi"); };
  return (
    <div className="rounded-2xl border border-primary/25 bg-card p-5 space-y-3">
      <div className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" /><h3 className="font-semibold">Do‘stingizga taklif yuboring</h3></div>
      <div className="grid sm:grid-cols-2 gap-2">
        <Input placeholder="Do‘stingiz ismi (ixtiyoriy)" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} />
        <Input placeholder="+998 90 123 45 67 (SMS uchun)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 20))} />
      </div>
      <Textarea readOnly value={loading ? "Havola tayyorlanmoqda…" : text} rows={4} className="text-sm" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button asChild disabled={!referralLink}><a href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${enc}`} target="_blank" rel="noopener"><Send className="w-4 h-4 mr-1" />Telegram</a></Button>
        <Button asChild variant="outline"><a href={`https://wa.me/?text=${enc}`} target="_blank" rel="noopener"><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</a></Button>
        <Button asChild variant="outline"><a href={sms}><Smartphone className="w-4 h-4 mr-1" />SMS</a></Button>
        <Button variant="outline" onClick={copy}><Copy className="w-4 h-4 mr-1" />Nusxa</Button>
      </div>
      <p className="text-xs text-muted-foreground">Har bir do‘st o‘z havolasini oladi. Sizga uning birinchi pullik xaridi uchun bir marta 5 000 so‘m tushadi — ko‘proq haqiqiy taklif, ko‘proq bonus.</p>
    </div>
  );
};
