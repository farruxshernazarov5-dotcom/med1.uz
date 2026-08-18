import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { formatUzs } from "@/data/doctorServiceTemplates";
import {
  Calendar, Clock, CreditCard, CheckCircle2, Loader2, ChevronRight, ChevronLeft,
  Banknote, Smartphone, QrCode, Download,
} from "lucide-react";

export interface BookableService {
  id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_package?: boolean;
  sessions_count?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doctorId: string;
  doctorName: string;
  doctorSlug: string;
  services: BookableService[];
  initialService?: BookableService | null;
}

const PAY_METHODS = [
  { id: "cash", label: "Klinikada naqd/karta", icon: Banknote, hint: "Qabul kuni to'lanadi" },
  { id: "click", label: "Click", icon: Smartphone, hint: "Onlayn to'lov havolasi yuboriladi" },
  { id: "payme", label: "Payme", icon: CreditCard, hint: "Onlayn to'lov havolasi yuboriladi" },
];

function nextDays(count = 14) {
  const out: Date[] = [];
  const d = new Date();
  for (let i = 1; i <= count; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    if (x.getDay() === 0) continue; // yakshanba dam
    out.push(x);
  }
  return out;
}

const SLOTS = Array.from({ length: 18 }, (_, i) => {
  const m = 9 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

const iso = (d: Date) => d.toISOString().slice(0, 10);
const WD = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

export default function DoctorBookingWizard({ open, onOpenChange, doctorId, doctorName, doctorSlug, services, initialService }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [service, setService] = useState<BookableService | null>(initialService ?? null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [taken, setTaken] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [notes, setNotes] = useState("");
  const [pay, setPay] = useState("cash");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [qr, setQr] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [payState, setPayState] = useState<"idle" | "awaiting" | "paid" | "failed">("idle");

  const days = useMemo(() => nextDays(), []);

  useEffect(() => {
    if (open) {
      setStep(1);
      setService(initialService ?? null);
      setBooking(null); setQr(""); setAgreed(false);
      setDate(""); setTime("");
      setPaymentId(null); setCheckoutUrl(""); setPayState("idle");
    }
  }, [open, initialService]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
      if (data) {
        setName((prev) => prev || data.full_name || "");
        setPhone((prev) => (prev === "+998" ? data.phone || "+998" : prev));
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!date) { setTaken([]); return; }
    (async () => {
      const { data } = await supabase
        .from("doctor_ext_appointments")
        .select("appointment_time")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", date)
        .neq("status", "cancelled");
      setTaken((data || []).map((r: any) => String(r.appointment_time).slice(0, 5)));
    })();
  }, [date, doctorId]);

  // Poll payment status after redirect to Click/Payme
  useEffect(() => {
    if (!paymentId || payState !== "awaiting") return;
    const t = setInterval(async () => {
      const { data } = await supabase.from("platform_payments").select("status").eq("id", paymentId).maybeSingle();
      if (data?.status === "paid" || data?.status === "completed") {
        setPayState("paid");
        setBooking((b: any) => (b ? { ...b, payment_status: "paid", status: "confirmed" } : b));
        toast({ title: "To'lov qabul qilindi", description: "Bron tasdiqlandi" });
      } else if (data && ["cancelled", "failed", "expired"].includes(data.status)) {
        setPayState("failed");
        toast({ title: "To'lov amalga oshmadi", description: "Bron bekor qilindi", variant: "destructive" });
      }
    }, 5000);
    return () => clearInterval(t);
  }, [paymentId, payState]);

  const startOnlinePayment = async (appointment: any) => {
    const fn = pay === "payme" ? "payme-create-invoice" : "click-create-invoice";
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        amount: appointment.price,
        purpose: "doctor_appointment",
        reference_id: appointment.id,
        return_url: `${window.location.origin}/doctors/ext/${doctorSlug}?booking=${appointment.booking_code}`,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.checkout_url) {
      setPayState("failed");
      toast({ title: "To'lov havolasi yaratilmadi", description: json.error || "Qayta urinib ko'ring", variant: "destructive" });
      return;
    }
    setPaymentId(json.payment?.id ?? null);
    setCheckoutUrl(json.checkout_url);
    setPayState("awaiting");
    window.open(json.checkout_url, "_blank", "noopener");
  };

  const submit = async () => {
    if (!user) { toast({ title: "Tizimga kirish talab qilinadi", variant: "destructive" }); return; }
    if (!service || !date || !time) return;
    if (!/^\+998\d{9}$/.test(phone.replace(/\s/g, ""))) {
      toast({ title: "Telefon formati: +998XXXXXXXXX", variant: "destructive" }); return;
    }
    if (!name.trim()) { toast({ title: "Ismingizni kiriting", variant: "destructive" }); return; }
    if (!agreed) { toast({ title: "To'lov va foydalanish shartlarini qabul qiling", variant: "destructive" }); return; }

    setSaving(true);
    // Atomic slot booking — prevents double booking at the database level
    const { data, error } = await supabase.rpc("book_doctor_ext_slot", {
      _doctor_id: doctorId,
      _service_id: service.id ?? null,
      _service_name: service.name,
      _appointment_date: date,
      _appointment_time: time,
      _duration_minutes: service.duration_minutes,
      _patient_name: name.trim(),
      _patient_phone: phone.replace(/\s/g, ""),
      _notes: notes.trim(),
      _price: service.price,
      _payment_method: pay,
    });
    setSaving(false);

    if (error) {
      const msg = String(error.message || "");
      if (msg.includes("slot_taken")) {
        toast({ title: "Bu vaqt band qilindi", description: "Boshqa vaqtni tanlang", variant: "destructive" });
        setTaken((t) => Array.from(new Set([...t, time])));
        setTime("");
        setStep(2);
        return;
      }
      toast({ title: "Bron qilinmadi", description: msg.includes("past_date") ? "O'tgan sana tanlab bo'lmaydi" : msg, variant: "destructive" });
      return;
    }

    const appointment: any = Array.isArray(data) ? data[0] : data;
    setBooking(appointment);
    const url = `${window.location.origin}/doctors/ext/${doctorSlug}?booking=${appointment.booking_code}`;
    setQr(await QRCode.toDataURL(url, { width: 320, margin: 1 }));
    setStep(5);
    toast({ title: "Qabul bron qilindi", description: `Kod: ${appointment.booking_code}` });

    if (pay !== "cash") await startOnlinePayment(appointment);
  };


  const canNext = step === 1 ? !!service : step === 2 ? !!date && !!time : step === 3 ? !!name.trim() && !!phone : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Onlayn qabulga yozilish — {doctorName}</DialogTitle>
        </DialogHeader>

        {step < 5 && (
          <div className="flex items-center gap-1 mb-2">
            {["Xizmat", "Sana/vaqt", "Ma'lumot", "To'lov"].map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-muted"}`} />
                <p className={`text-[10px] mt-1 ${i + 1 === step ? "text-primary font-semibold" : "text-muted-foreground"}`}>{s}</p>
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            {services.map((s, i) => (
              <button key={s.id ?? i} onClick={() => setService(s)}
                className={`w-full text-left p-3 rounded-xl border transition ${service?.name === s.name ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{s.name}</p>
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                    <div className="flex gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{s.duration_minutes} min</Badge>
                      {s.is_package && <Badge className="text-[10px]">Paket · {s.sessions_count} seans</Badge>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary whitespace-nowrap">{formatUzs(s.price)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Sanani tanlang</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((d) => {
                  const v = iso(d);
                  return (
                    <button key={v} onClick={() => { setDate(v); setTime(""); }}
                      className={`shrink-0 w-14 py-2 rounded-xl border text-center ${date === v ? "border-primary bg-primary/10" : "hover:bg-muted/50"}`}>
                      <p className="text-[10px] text-muted-foreground">{WD[d.getDay()]}</p>
                      <p className="text-sm font-bold">{d.getDate()}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {date && (
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Vaqtni tanlang</p>
                <div className="grid grid-cols-4 gap-2">
                  {SLOTS.map((t) => {
                    const busy = taken.includes(t);
                    return (
                      <button key={t} disabled={busy} onClick={() => setTime(t)}
                        className={`py-2 rounded-lg border text-xs ${busy ? "opacity-40 line-through cursor-not-allowed" : time === t ? "border-primary bg-primary/10 font-bold" : "hover:bg-muted/50"}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Bemor F.I.SH.</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism Familiya" />
            </div>
            <div>
              <label className="text-xs font-semibold">Telefon</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" />
            </div>
            <div>
              <label className="text-xs font-semibold">Shikoyat / izoh (ixtiyoriy)</label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qisqa shikoyatingiz..." />
            </div>
          </div>
        )}

        {step === 4 && service && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/40 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Xizmat</span><span className="font-medium">{service.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sana</span><span className="font-medium">{date} {time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bemor</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span className="text-muted-foreground">Jami</span><span className="font-bold text-primary">{formatUzs(service.price)}</span></div>
            </div>
            <div className="space-y-2">
              {PAY_METHODS.map((m) => (
                <button key={m.id} onClick={() => setPay(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${pay === m.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                  <m.icon className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground">{m.hint}</p>
                  </div>
                </button>
              ))}
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
              <span>
                <Link to="/terms" target="_blank" className="text-primary underline">Foydalanish shartlari</Link>,{" "}
                <Link to="/privacy" target="_blank" className="text-primary underline">maxfiylik siyosati</Link> va to'lov shartlarini qabul qilaman.
              </span>
            </label>
          </div>
        )}

        {step === 5 && booking && (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-medical-green mx-auto" />
            <div>
              <p className="font-bold">Qabul tasdiqlash uchun yuborildi</p>
              <p className="text-xs text-muted-foreground">Klinikada QR kodni ko'rsatasiz</p>
            </div>
            {qr && <img loading="lazy" decoding="async" src={qr} alt={`Bron kodi ${booking.booking_code}`} className="w-44 h-44 mx-auto rounded-xl border bg-white p-2" />}
            <p className="text-sm font-mono font-bold tracking-widest">{booking.booking_code}</p>
            <div className="text-xs text-muted-foreground">{booking.service_name} · {booking.appointment_date} {String(booking.appointment_time).slice(0, 5)}</div>

            {pay !== "cash" && (
              <div className={`p-3 rounded-xl border text-sm ${
                payState === "paid" ? "bg-medical-green/10 border-medical-green/20"
                : payState === "failed" ? "bg-destructive/10 border-destructive/20"
                : "bg-yellow-500/10 border-yellow-500/20"}`}>
                {payState === "paid" ? (
                  <p className="font-medium text-medical-green">To'lov qabul qilindi — bron tasdiqlandi ✓</p>
                ) : payState === "failed" ? (
                  <p className="font-medium text-destructive">To'lov amalga oshmadi. Bron bekor qilindi.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="flex items-center justify-center gap-2 text-yellow-700">
                      <Loader2 className="w-4 h-4 animate-spin" /> To'lov kutilmoqda...
                    </p>
                    {checkoutUrl && (
                      <a href={checkoutUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="gap-2">
                          <CreditCard className="w-4 h-4" /> To'lov sahifasini ochish
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-center">
              {qr && (
                <a href={qr} download={`med1-bron-${booking.booking_code}.png`}>
                  <Button size="sm" variant="outline" className="gap-2"><Download className="w-4 h-4" /> QR yuklab olish</Button>
                </a>
              )}
              <Button size="sm" onClick={() => onOpenChange(false)} className="gap-2"><QrCode className="w-4 h-4" /> Yopish</Button>
            </div>
          </div>
        )}

        {step < 5 && (
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" size="sm" disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Orqaga
            </Button>
            {step < 4 ? (
              <Button size="sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="gap-1">
                Keyingi <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" disabled={saving || !agreed} onClick={submit} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Tasdiqlash
              </Button>
            )}
          </div>
        )}
        {!user && step < 5 && (
          <p className="text-xs text-muted-foreground text-center">
            Bron qilish uchun <Link to="/auth" className="text-primary underline">tizimga kiring</Link>.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
