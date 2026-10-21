import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type PlatformRequestKind = "chat" | "video" | "question" | "booking";

const HINT: Record<PlatformRequestKind, string> = {
  chat: "Xabaringiz shifokorga yetkaziladi. Javob bildirishnoma va Telegram orqali keladi.",
  video: "Qulay vaqtni tanlang — shifokor tasdiqlagach video havola yuboriladi.",
  question: "Savolingiz shifokorga shaxsiy tarzda yuboriladi.",
  booking: "Qulay sana va vaqtni tanlang — shifokor tasdiqlagach xabar olasiz.",
};

interface Props { doctorId: string; kind: PlatformRequestKind; onDone: () => void }

/** Request form for platform doctors (chat, video, question, booking) — answers arrive as notifications. */
export default function PlatformDoctorRequestForm({ doctorId, kind, onDone }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.full_name) setName((v) => v || data.full_name);
      if (data?.phone && /^\+998\d{9}$/.test(data.phone)) setPhone((v) => (v === "+998" ? data.phone : v));
    });
  }, [user]);

  if (!user) {
    return <p className="text-sm text-muted-foreground">So‘rov yuborish uchun <Link to="/auth" className="text-primary underline">tizimga kiring</Link>.</p>;
  }

  if (sent) {
    return (
      <div className="text-center space-y-3 py-6">
        <CheckCircle2 className="h-12 w-12 mx-auto text-medical-green" />
        <p className="font-semibold">So‘rovingiz yuborildi</p>
        <p className="text-xs text-muted-foreground">Shifokor javobi bildirishnomalarda va Telegramda ko‘rinadi.</p>
        <Button className="w-full min-h-11" onClick={onDone}>Yopish</Button>
      </div>
    );
  }

  const submit = async () => {
    const cleanPhone = phone.replace(/\s/g, "");
    if (name.trim().length < 2) { toast({ title: "Ismingizni kiriting", variant: "destructive" }); return; }
    if (!/^\+998\d{9}$/.test(cleanPhone)) { toast({ title: "Telefon formati: +998XXXXXXXXX", variant: "destructive" }); return; }
    if (message.trim().length < 5) { toast({ title: "Xabar juda qisqa", variant: "destructive" }); return; }
    if ((kind === "video" || kind === "booking") && when && new Date(when).getTime() < Date.now()) {
      toast({ title: "O‘tgan vaqtni tanlab bo‘lmaydi", variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("platform_doctor_requests").insert({
      doctor_id: doctorId,
      patient_id: user.id,
      request_type: kind,
      patient_name: name.trim(),
      patient_phone: cleanPhone,
      message: message.trim().slice(0, 2000),
      preferred_at: when ? new Date(when).toISOString() : null,
    });
    setSaving(false);
    if (error) { toast({ title: "Yuborilmadi", description: "Internet aloqasini tekshirib, qayta urinib ko‘ring", variant: "destructive" }); return; }
    setSent(true);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{HINT[kind]}</p>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism Familiya" aria-label="Ism Familiya" className="min-h-11" />
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+998901234567" aria-label="Telefon" className="min-h-11" />
      {(kind === "video" || kind === "booking") && (
        <div>
          <label className="text-xs font-semibold" htmlFor="pdr-when">Qulay vaqt</label>
          <Input id="pdr-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="min-h-11" />
        </div>
      )}
      <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={kind === "question" ? "Savolingiz..." : "Shikoyatingizni qisqa yozing..."} aria-label="Xabar" />
      <Button onClick={submit} disabled={saving} className="w-full min-h-11 gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Yuborish
      </Button>
    </div>
  );
}
