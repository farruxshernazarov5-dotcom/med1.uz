import DoctorDialogContent from "./DoctorDialogContent";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Video, PhoneOff, Wifi, WifiOff, Copy } from "lucide-react";
import { openJitsiMeeting } from "@/lib/jitsiMeeting";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doctorId: string;
  doctorName: string;
  appointmentId?: string | null;
  scheduledAt?: string | null;
}

type ConnState = "idle" | "creating" | "waiting" | "connecting" | "opened" | "ended" | "error";

const STATE_META: Record<ConnState, { label: string; cls: string }> = {
  idle: { label: "Tayyor", cls: "bg-muted text-muted-foreground" },
  creating: { label: "Xona yaratilmoqda...", cls: "bg-primary/10 text-primary border-primary/20" },
  waiting: { label: "Shifokor kutilmoqda", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  connecting: { label: "Ulanmoqda...", cls: "bg-primary/10 text-primary border-primary/20" },
  opened: { label: "Jitsi ochildi", cls: "bg-primary/10 text-primary border-primary/20" },
  ended: { label: "Yakunlandi", cls: "bg-muted text-muted-foreground" },
  error: { label: "Ulanish xatosi", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function VideoConsultRoom({ open, onOpenChange, doctorId, doctorName, appointmentId, scheduledAt }: Props) {
  const { user } = useAuth();
  const [state, setState] = useState<ConnState>("idle");
  const [room, setRoom] = useState<any>(null);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const createRoom = useCallback(async () => {
    if (!user) { toast({ title: "Tizimga kirish talab qilinadi", variant: "destructive" }); return; }
    setState("creating");
    // Reuse an existing open room for this appointment/doctor
    let query = supabase
      .from("doctor_video_rooms")
      .select("*")
      .eq("patient_id", user.id)
      .eq("doctor_id", doctorId)
      .neq("status", "ended")
      .order("created_at", { ascending: false })
      .limit(1);
    if (appointmentId) query = query.eq("appointment_id", appointmentId);
    const { data: existing } = await query;

    if (existing && existing.length > 0) {
      setRoom(existing[0]);
      setState("waiting");
      return;
    }

    const { data, error } = await supabase
      .from("doctor_video_rooms")
      .insert({
        appointment_id: appointmentId ?? null,
        doctor_id: doctorId,
        patient_id: user.id,
        scheduled_at: scheduledAt ?? null,
        status: "waiting",
      })
      .select("*")
      .single();

    if (error) { setState("error"); toast({ title: "Xona yaratilmadi", description: error.message, variant: "destructive" }); return; }
    setRoom(data);
    setState("waiting");
  }, [user, doctorId, appointmentId, scheduledAt]);

  useEffect(() => {
    if (open) { setState("idle"); setRoom(null); }
  }, [open]);

  const join = async () => {
    if (!room) return;
    setState("connecting");
    try {
      await openJitsiMeeting(`https://meet.jit.si/${room.room_code}`);
      setState("opened");
    } catch (e) {
      setState("waiting");
      toast({ title: "Jitsi ochilmadi", description: e instanceof Error ? e.message : "Qayta urinib ko‘ring", variant: "destructive" });
    }
  };

  const end = async () => {
    if (room) {
      await supabase.from("doctor_video_rooms")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", room.id);
    }
    setState("ended");
  };

  const meta = STATE_META[state];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DoctorDialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto max-sm:block max-sm:space-y-4">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" /> Video konsultatsiya — {doctorName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
          <Badge variant="outline" className="gap-1">
            {online ? <Wifi className="w-3 h-3 text-medical-green" /> : <WifiOff className="w-3 h-3 text-destructive" />}
            {online ? "Internet bor" : "Internet yo'q"}
          </Badge>
        </div>

        {state === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Xavfsiz video xona yaratiladi. Shifokorga havola yuboriladi — u qo'shilganda suhbat boshlanadi.
            </p>
            <Button onClick={createRoom} className="w-full gap-2"><Video className="w-4 h-4" /> Video xona yaratish</Button>
          </div>
        )}

        {state === "creating" && (
          <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}

        {room && (state === "waiting" || state === "connecting" || state === "opened") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 text-xs">
              <span className="font-mono truncate flex-1">{room.room_code}</span>
              <Button size="sm" variant="ghost" className="gap-1 h-7"
                onClick={() => { navigator.clipboard.writeText(`https://meet.jit.si/${room.room_code}`); toast({ title: "Havola nusxalandi" }); }}>
                <Copy className="w-3.5 h-3.5" /> Nusxa
              </Button>
            </div>

              <div className="aspect-video rounded-xl border flex flex-col items-center justify-center gap-2 bg-muted/30">
                <Loader2 className={`w-6 h-6 text-primary ${state === "connecting" ? "animate-spin" : ""}`} />
                <p className="text-sm text-muted-foreground">
                  {state === "connecting" ? "Jitsi ochilmoqda..." : state === "opened" ? "Uchrashuv Jitsi’da davom etadi" : "Xona tayyor — qo'shilishingiz mumkin"}
                </p>
              </div>

            <div className="flex flex-wrap gap-2">
                <Button onClick={join} disabled={!online || state === "connecting"} className="flex-1 gap-2"><Video className="w-4 h-4" /> Jitsi’da ochish</Button>
              {state === "opened" && (
                <Button variant="destructive" onClick={end} className="flex-1 gap-2"><PhoneOff className="w-4 h-4" /> Yakunlash</Button>
              )}
            </div>
          </div>
        )}

        {state === "ended" && (
          <div className="text-center space-y-2 py-4">
            <p className="font-semibold">Konsultatsiya yakunlandi</p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Yopish</Button>
          </div>
        )}

        {state === "error" && (
          <Button variant="outline" onClick={createRoom} className="gap-2">Qayta urinish</Button>
        )}
      </DoctorDialogContent>
    </Dialog>
  );
}
