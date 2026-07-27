import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send, Paperclip, MessageCircle, FileText, Wifi, WifiOff } from "lucide-react";

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
  created_at: string;
}

const MAX_FILE = 10 * 1024 * 1024;

export default function DoctorChatSession({ open, onOpenChange, doctorId, doctorName, appointmentId }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
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
    if (file.size > MAX_FILE) { toast({ title: "Fayl 10MB dan katta", variant: "destructive" }); return; }
    setSending(true);
    const path = `${user.id}/${appointmentId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("consult-files").upload(path, file, { contentType: file.type });
    if (error) {
      setSending(false);
      toast({ title: "Fayl yuklanmadi", description: error.message, variant: "destructive" });
      return;
    }
    const { data: signed } = await supabase.storage.from("consult-files").createSignedUrl(path, 60 * 60 * 24 * 7);
    await insert({
      content: null,
      attachment_url: signed?.signedUrl ?? path,
      attachment_name: file.name,
      attachment_type: file.type,
    });
    setSending(false);
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
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                    {m.attachment_url && (
                      <a href={m.attachment_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 underline text-xs mt-1">
                        <FileText className="w-3.5 h-3.5" /> {m.attachment_name || "Fayl"}
                      </a>
                    )}
                    <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t flex items-center gap-2">
          <input ref={fileRef} type="file" hidden accept="image/*,application/pdf"
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
