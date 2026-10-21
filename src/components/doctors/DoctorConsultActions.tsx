import DoctorDialogContent from "./DoctorDialogContent";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Video, HelpCircle, Send, Loader2 } from "lucide-react";
import DoctorChatSession from "./DoctorChatSession";
import VideoConsultRoom from "./VideoConsultRoom";

type Kind = "chat" | "video" | "question";

const META: Record<Kind, { title: string; hint: string; placeholder: string; label: string; icon: any }> = {
  chat: {
    title: "Shifokor bilan chat",
    hint: "Shifokor javob berganda SMS/bildirishnoma orqali xabar olasiz.",
    placeholder: "Savolingizni yozing...",
    label: "Chat",
    icon: MessageCircle,
  },
  video: {
    title: "Video konsultatsiya so'rovi",
    hint: "Qulay vaqtni tanlang — tasdiqlangach video havola yuboriladi.",
    placeholder: "Shikoyatingizni qisqa yozing...",
    label: "Video konsultatsiya",
    icon: Video,
  },
  question: {
    title: "Shifokorga savol yuborish",
    hint: "Savolingiz shifokorga yetkaziladi, javob shaxsiy bo'ladi.",
    placeholder: "Savolingiz...",
    label: "Savol yuborish",
    icon: HelpCircle,
  },
};

interface Props {
  doctorId: string;
  doctorName: string;
  onBook?: () => void;
}

export default function DoctorConsultActions({ doctorId, doctorName, onBook }: Props) {
  const { user } = useAuth();
  const [kind, setKind] = useState<Kind | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState<Kind | null>(null);
  const [activeAppt, setActiveAppt] = useState<any>(null);
  const [liveChat, setLiveChat] = useState(false);
  const [liveVideo, setLiveVideo] = useState(false);

  const submit = async () => {
    if (!user) { toast({ title: "Tizimga kirish talab qilinadi", variant: "destructive" }); return; }
    if (!kind) return;
    if (!name.trim()) { toast({ title: "Ismingizni kiriting", variant: "destructive" }); return; }
    if (!/^\+998\d{9}$/.test(phone.replace(/\s/g, ""))) { toast({ title: "Telefon formati: +998XXXXXXXXX", variant: "destructive" }); return; }
    if (message.trim().length < 5) { toast({ title: "Xabar juda qisqa", variant: "destructive" }); return; }

    setSaving(true);
    const { error } = await supabase.from("doctor_consult_requests").insert({
      doctor_id: doctorId,
      patient_id: user.id,
      request_type: kind,
      patient_name: name.trim(),
      patient_phone: phone.replace(/\s/g, ""),
      message: message.trim(),
      preferred_at: kind === "video" && when ? new Date(when).toISOString() : null,
    });
    setSaving(false);
    if (error) { toast({ title: "Yuborilmadi", description: error.message, variant: "destructive" }); return; }
    toast({ title: "So'rov yuborildi", description: "Shifokor javobi bildirishnomada ko'rinadi" });
    setMessage(""); setWhen(""); setKind(null);
  };

  const m = kind ? META[kind] : null;

  const openLive = async (k: "chat" | "video") => {
    if (!user) { setKind(k); return; }
    setChecking(k);
    const { data, error } = await supabase
      .from("doctor_ext_appointments")
      .select("id, appointment_date, appointment_time, status")
      .eq("doctor_id", doctorId)
      .eq("patient_id", user.id)
      .neq("status", "cancelled")
      .order("appointment_date", { ascending: false })
      .limit(1);
    setChecking(null);
    if (error) { toast({ title: "Qabul ma’lumotlari yuklanmadi", description: "Qayta urinib ko‘ring", variant: "destructive" }); return; }
    const appt = data?.[0];
    if (!appt) {
      toast({ title: "Avval qabulga yoziling", description: "Chat va video konsultatsiya faqat qabul bron qilingandan keyin ochiladi" });
      setKind(k);
      return;
    }
    setActiveAppt(appt);
    if (k === "chat") setLiveChat(true); else setLiveVideo(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {(["chat", "video", "question"] as Kind[]).map((k) => {
          const Icon = META[k].icon;
          return (
            <Button key={k} variant={k === "chat" ? "default" : "outline"} className="gap-2 h-auto min-h-11 whitespace-normal" disabled={checking !== null}
              onClick={() => (k === "question" ? setKind(k) : openLive(k))}>
              {checking === k ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />} {META[k].label}
            </Button>
          );
        })}
      </div>

      {onBook && <div className="fixed bottom-20 inset-x-2 z-40 grid grid-cols-[1.6fr_1fr_1fr] gap-1 rounded-2xl border bg-card p-2 shadow-lg lg:hidden">
        <Button className="min-h-11 px-2 text-xs" onClick={onBook}>Qabulga yozilish</Button>
        <Button variant="outline" className="min-h-11 px-2 text-xs" disabled={checking !== null} onClick={() => openLive("chat")}>Chat</Button>
        <Button variant="outline" className="min-h-11 px-2 text-xs" disabled={checking !== null} onClick={() => openLive("video")}>Video</Button>
      </div>}

      {activeAppt && (
        <DoctorChatSession
          open={liveChat}
          onOpenChange={setLiveChat}
          doctorId={doctorId}
          doctorName={doctorName}
          appointmentId={activeAppt.id}
        />
      )}
      {activeAppt && (
        <VideoConsultRoom
          open={liveVideo}
          onOpenChange={setLiveVideo}
          doctorId={doctorId}
          doctorName={doctorName}
          appointmentId={activeAppt.id}
          scheduledAt={activeAppt.appointment_date ? `${activeAppt.appointment_date}T${String(activeAppt.appointment_time).slice(0, 5)}` : null}
        />
      )}

      <Dialog open={!!kind} onOpenChange={(v) => !v && setKind(null)}>

        <DoctorDialogContent className="max-w-md overflow-y-auto max-sm:block max-sm:space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base">{m?.title} — {doctorName}</DialogTitle>
          </DialogHeader>
          {!user ? (
            <p className="text-sm text-muted-foreground">
              So'rov yuborish uchun <Link to="/auth" className="text-primary underline">tizimga kiring</Link>.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{m?.hint}</p>
              <Input aria-label="Ism Familiya" className="min-h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism Familiya" />
              <Input aria-label="Telefon raqami" type="tel" className="min-h-11" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" />
              {kind === "video" && (
                <div>
                  <label className="text-xs font-semibold">Qulay vaqt</label>
                  <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
                </div>
              )}
              <Textarea aria-label="Xabaringiz" className="w-full" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={m?.placeholder} />
              <Button onClick={submit} disabled={saving} className="w-full min-h-11 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Yuborish
              </Button>
            </div>
          )}
        </DoctorDialogContent>
      </Dialog>
    </>
  );
}
