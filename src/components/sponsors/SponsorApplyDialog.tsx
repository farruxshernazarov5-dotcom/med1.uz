import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Copy, Check, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uzbekistanRegions } from "@/data/uzbekistanRegions";

export const CARD_NUMBER = "5614684809699026";
export const CARD_HOLDER = "Shernazarov F";
export const formatCard = (v: string) => v.replace(/(.{4})/g, "$1 ").trim();

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000, 200000];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultAmount?: string;
  onSubmitted?: () => void;
}

const SponsorApplyDialog = ({ open, onOpenChange, defaultAmount = "", onSubmitted }: Props) => {
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("");
  const [phone, setPhone] = useState("+998");
  const [amount, setAmount] = useState(defaultAmount);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && defaultAmount) setAmount(defaultAmount);
  }, [open, defaultAmount]);

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER);
      setCopied(true);
      toast({ title: "Karta raqami nusxalandi", description: formatCard(CARD_NUMBER) });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Nusxalab bo'lmadi", description: formatCard(CARD_NUMBER), variant: "destructive" });
    }
  };

  const reset = () => {
    setFullName(""); setDisplayName(""); setRegion(""); setPhone("+998");
    setAmount(""); setMessage(""); setIsAnonymous(false);
  };

  const submit = async () => {
    const name = fullName.trim();
    const sum = Number(amount);

    if (name.length < 3 || name.length > 100) {
      toast({ title: "Ism-familiyani to'liq kiriting", variant: "destructive" });
      return;
    }
    if (!sum || sum < 1000 || sum > 1_000_000_000) {
      toast({ title: "Minimal summa 1 000 so'm", variant: "destructive" });
      return;
    }
    if (phone.trim() && !/^\+998\d{9}$/.test(phone.trim())) {
      toast({ title: "Telefon formati: +998XXXXXXXXX", variant: "destructive" });
      return;
    }
    if (message.length > 300) {
      toast({ title: "Izoh 300 belgidan oshmasin", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    const publicName = isAnonymous
      ? "Anonim"
      : (displayName.trim() || `${name.split(" ")[0]} ${(name.split(" ")[1]?.[0] || "").toUpperCase()}****`.trim());

    const { error } = await supabase.from("sponsor_contributions").insert({
      user_id: authData?.user?.id ?? null,
      full_name: name.slice(0, 100),
      display_name: publicName.slice(0, 60),
      region: region || null,
      phone: phone.trim() === "+998" ? null : phone.trim(),
      amount: sum,
      message: message.trim() ? message.trim().slice(0, 300) : null,
      is_anonymous: isAnonymous,
      status: "pending",
    });
    setSaving(false);

    if (error) {
      toast({ title: "Yuborishda xatolik", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "💚 Rahmat! Arizangiz qabul qilindi",
      description: "Moderator tasdiqlagach, ismingiz homiylar ro'yxatida ko'rinadi.",
    });
    reset();
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            Hissa qo'shish arizasi
          </DialogTitle>
          <DialogDescription>
            Kartaga o'tkazing va quyidagi formani to'ldiring — moderatsiyadan so'ng ro'yxatga qo'shilasiz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <button onClick={copyCard} className="w-full text-left rounded-xl bg-gradient-to-br from-[#0A2540] to-[#1e3a5f] p-4">
            <p className="text-white/50 text-[10px]">Karta raqami — nusxalab o'tkazing</p>
            <p className="font-mono text-lg font-black text-white tracking-wider">{formatCard(CARD_NUMBER)}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-white/70 text-xs uppercase">{CARD_HOLDER}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/10 px-2 py-1 rounded">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Nusxalandi" : "Nusxalash"}
              </span>
            </div>
          </button>

          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎭</span>
              <Label className="text-sm font-medium">Anonim ko'rinsin</Label>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <div>
            <Label className="text-sm font-semibold">Ism-familiya *</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100}
              placeholder="Masalan: Shernazarov Farrux" className="mt-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">
              To'liq ism faqat moderator uchun. Ro'yxatda qisqartirilgan yoki anonim ko'rinadi.
            </p>
          </div>

          {!isAnonymous && (
            <div>
              <Label className="text-sm font-semibold">Ro'yxatda ko'rinadigan nom</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={60}
                placeholder="Masalan: FARRUX ****" className="mt-1.5" />
            </div>
          )}

          <div>
            <Label className="text-sm font-semibold">Hudud</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Tanlang" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {uzbekistanRegions.map(r => (
                  <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Telefon (moderator bog'lanishi uchun)</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} maxLength={13}
              placeholder="+998901234567" className="mt-1.5" />
          </div>

          <div>
            <Label className="text-sm font-semibold">Summa (so'm) *</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Masalan: 50000" className="mt-1.5 h-12 text-lg font-bold" />
            <div className="grid grid-cols-3 gap-2 mt-2">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition-all
                    ${amount === String(a)
                      ? "border-primary bg-primary/10 text-primary scale-105"
                      : "border-border text-foreground hover:border-primary/40 hover:bg-primary/5"}`}>
                  {(a / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Tilak / izoh</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={300}
              placeholder="Loyihaga tilaklaringiz..." className="mt-1.5" rows={3} />
          </div>

          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-xl p-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            Shaxsiy ma'lumotlaringiz (to'liq ism, telefon) hech qachon ommaga ko'rsatilmaydi.
            Ro'yxatga faqat moderator tasdiqlagan yozuvlar chiqadi.
          </div>

          <Button onClick={submit} disabled={saving} size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-lg">
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Heart className="w-5 h-5 mr-2" />}
            Arizani yuborish
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            <Link to="/user-guide#terms" className="text-primary underline">Ommaviy offerta</Link> shartlariga rozilik
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SponsorApplyDialog;
