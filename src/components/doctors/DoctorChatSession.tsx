import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send, Paperclip, MessageCircle, FileText, Wifi, WifiOff, ShieldAlert, Eye, EyeOff, Clock, Flag } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doctorId: string;
  doctorName: string;
  appointmentId: string;
}

interface Msg {
  id: string;
  sender_id: string;
  sender_role: string;
  content: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_expires_at?: string | null;
  is_flagged?: boolean;
  is_hidden?: boolean;
  flag_reason?: string | null;
  created_at: string;
}

const MAX_FILE = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const BLOCKED_EXT = /\.(exe|bat|cmd|sh|js|apk|scr|msi|jar|dll|vbs|com|ps1|php)$/i;
const RETENTION_DAYS = 30;

const FLAG_LABELS: Record<string, string> = {
  tashqi_havola: "Tashqi havola",
  shaxsiy_malumot: "Shaxsiy ma'lumot",
  maxfiy_malumot: "Maxfiy ma'lumot (karta/parol)",
  xavfli_fayl: "Xavfli fayl turi",
};

export default function DoctorChatSession({ open, onOpenChange, doctorId, doctorName, appointmentId }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    let active = true;
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from("doctor_ext_chat_messages")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });
      if (active) { setMessages((data as Msg[]) || []); setLoading(false); }
    })();

    const channel = supabase
      .channel(`doctor-chat-${appointmentId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "doctor_ext_chat_messages", filter: `appointment_id=eq.${appointmentId}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === (payload.new as Msg).id) ? prev : [...prev, payload.new as Msg]));
        })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => { active = false; supabase.removeChannel(channel); };
  }, [open, user, appointmentId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const insert = async (payload: Partial<Msg>) => {
    if (!user) return;
    const { error } = await supabase.from("doctor_ext_chat_messages").insert({
      appointment_id: appointmentId,
      doctor_id: doctorId,
      patient_id: user.id,
      sender_id: user.id,
      sender_role: "patient",
      ...payload,
    });
    if (error) toast({ title: "Yuborilmadi", description: error.message, variant: "destructive" });
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await insert({ content: text.trim().slice(0, 4000) });
    setText("");
    setSending(false);
  };

  const upload = async (file: File) => {
    if (!user) return;
    // --- Xavfsizlik tekshiruvlari ---
    if (BLOCKED_EXT.test(file.name)) {
      toast({ title: "Xavfli fayl turi", description: "Bajariluvchi fayllarni yuborish taqiqlangan", variant: "destructive" });
      return;
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      toast({ title: "Fayl turi qo'llab-quvvatlanmaydi", description: "Faqat rasm (JPG/PNG/WEBP) va PDF", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE) { toast({ title: "Fayl 10MB dan katta", variant: "destructive" }); return; }
    if (file.size === 0) { toast({ title: "Bo'sh fayl", variant: "destructive" }); return; }

    setSending(true);
    const path = `${user.id}/${appointmentId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("consult-files").upload(path, file, { contentType: file.type });
    if (error) {
      setSending(false);
      toast({ title: "Fayl yuklanmadi", description: error.message, variant: "destructive" });
      return;
    }
    const expires = new Date(Date.now() + RETENTION_DAYS * 86400000);
    const { data: signed } = await supabase.storage
      .from("consult-files")
      .createSignedUrl(path, RETENTION_DAYS * 86400);
    await insert({
      content: null,
      attachment_url: signed?.signedUrl ?? path,
      attachment_name: file.name,
      attachment_type: file.type,
      attachment_expires_at: expires.toISOString(),
    } as Partial<Msg>);
    setSending(false);
    toast({ title: "Fayl yuborildi", description: `Saqlash muddati: ${RETENTION_DAYS} kun` });
  };

  const flagMessage = async (id: string) => {
    const { error } = await supabase
      .from("doctor_ext_chat_messages")
      .update({ is_flagged: true, flag_reason: "foydalanuvchi_shikoyati" })
      .eq("id", id);
    if (error) { toast({ title: "Belgilanmadi", description: error.message, variant: "destructive" }); return; }
    setMessages((p) => p.map((m) => (m.id === id ? { ...m, is_flagged: true, flag_reason: "foydalanuvchi_shikoyati" } : m)));
    toast({ title: "Xabar shubhali deb belgilandi" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" /> {doctorName}
            <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
              {live ? <Wifi className="w-3 h-3 text-medical-green" /> : <WifiOff className="w-3 h-3 text-muted-foreground" />}
              {live ? "Real vaqt" : "Ulanmoqda"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pt-2">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" /> Karta raqami, parol yoki OTP kodni yubormang. Fayllar {RETENTION_DAYS} kundan so'ng o'chiriladi.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Suhbatni boshlang — shifokor javobi shu yerda real vaqtda ko'rinadi.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              const masked = (m.is_hidden || m.is_flagged) && !revealed[m.id];
              const reasons = (m.flag_reason || "").split(",").filter(Boolean);
              const expired = m.attachment_expires_at ? new Date(m.attachment_expires_at) < new Date() : false;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {masked ? (
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-xs font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5" /> Ishonchsiz kontent yashirildi
                        </p>
                        {reasons.length > 0 && (
                          <p className="text-[10px] opacity-80">
                            Sabab: {reasons.map((r) => FLAG_LABELS[r] || r).join(", ")}
                          </p>
                        )}
                        <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1"
                          onClick={() => setRevealed((p) => ({ ...p, [m.id]: true }))}>
                          <Eye className="w-3 h-3" /> Baribir ko'rsatish
                        </Button>
                      </div>
                    ) : (
                      <>
                        {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                        {m.attachment_url && (
                          expired ? (
                            <p className="flex items-center gap-1.5 text-xs mt-1 opacity-70">
                              <Clock className="w-3.5 h-3.5" /> Fayl saqlash muddati tugagan
                            </p>
                          ) : (
                            <a href={m.attachment_url} target="_blank" rel="noreferrer noopener"
                              className="flex items-center gap-2 underline text-xs mt-1">
                              <FileText className="w-3.5 h-3.5" /> {m.attachment_name || "Fayl"}
                            </a>
                          )
                        )}
                        {m.attachment_expires_at && !expired && (
                          <p className="text-[10px] mt-0.5 opacity-70 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(m.attachment_expires_at).toLocaleDateString("uz-UZ")} gacha saqlanadi
                          </p>
                        )}
                        {(m.is_flagged || m.is_hidden) && (
                          <button onClick={() => setRevealed((p) => ({ ...p, [m.id]: false }))}
                            className="text-[10px] underline opacity-70 flex items-center gap-1 mt-1">
                            <EyeOff className="w-2.5 h-2.5" /> Yashirish
                          </button>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className={`text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {!mine && !m.is_flagged && (
                        <button onClick={() => flagMessage(m.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                          <Flag className="w-2.5 h-2.5" /> Shikoyat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t flex items-center gap-2">
          <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          <Button size="icon" variant="ghost" disabled={sending} onClick={() => fileRef.current?.click()} aria-label="Fayl biriktirish">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Xabar yozing..." />
          <Button size="icon" disabled={sending || !text.trim()} onClick={send} aria-label="Yuborish">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
