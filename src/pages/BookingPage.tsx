import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Building2, Stethoscope, Calendar, Clock, User, Phone,
  CheckCircle, ArrowLeft, ArrowRight, DollarSign, Star, MapPin
} from "lucide-react";

const DAY_MAP: Record<number, string> = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat", 0: "sun" };

const generateTimeSlots = (start: string, end: string, intervalMin = 30): string[] => {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur < endMin) {
    const h = Math.floor(cur / 60).toString().padStart(2, "0");
    const m = (cur % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    cur += intervalMin;
  }
  return slots;
};

const BookingPage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [clinics, setClinics] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    clinic_id: "", doctor_id: "", service_id: "",
    date: "", time: "",
    patient_name: "", patient_phone: "", notes: "",
  });

  useEffect(() => {
    supabase.from("registered_clinics").select("*").eq("is_active", true).then(({ data }) => setClinics(data || []));
  }, []);

  useEffect(() => {
    if (form.clinic_id) {
      Promise.all([
        supabase.from("doctors").select("*").eq("clinic_id", form.clinic_id).eq("is_active", true),
        supabase.from("clinic_services").select("*").eq("clinic_id", form.clinic_id).eq("is_active", true),
      ]).then(([docRes, srvRes]) => {
        setDoctors(docRes.data || []);
        setServices(srvRes.data || []);
      });
    }
  }, [form.clinic_id]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (form.clinic_id && form.date) {
      const fetchBooked = async () => {
        const query = supabase
          .from("appointments")
          .select("appointment_time, doctor_id")
          .eq("clinic_id", form.clinic_id)
          .eq("appointment_date", form.date)
          .in("status", ["pending", "confirmed"]);

        if (form.doctor_id) query.eq("doctor_id", form.doctor_id);

        const { data } = await query;
        setBookedSlots(new Set((data || []).map((a) => a.appointment_time?.slice(0, 5))));
      };
      fetchBooked();

      // Realtime for booked slots
      const channel = supabase
        .channel("booking-slots")
        .on("postgres_changes", {
          event: "*", schema: "public", table: "appointments",
          filter: `clinic_id=eq.${form.clinic_id}`,
        }, () => fetchBooked())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [form.clinic_id, form.date, form.doctor_id]);

  useEffect(() => {
    if (profile) {
      setForm((p) => ({
        ...p,
        patient_name: p.patient_name || profile.full_name || "",
        patient_phone: p.patient_phone || profile.phone || "",
      }));
    }
  }, [profile]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  const selectedClinic = clinics.find((c) => c.id === form.clinic_id);
  const selectedDoctor = doctors.find((d) => d.id === form.doctor_id);
  const selectedService = services.find((s) => s.id === form.service_id);
  const totalPrice = Number(selectedService?.price || 0) + Number(selectedDoctor?.consultation_price || 0);

  // Generate available time slots based on doctor schedule or default
  const getAvailableSlots = (): string[] => {
    if (!form.date) return [];
    const dayOfWeek = new Date(form.date).getDay();
    const dayKey = DAY_MAP[dayOfWeek];

    if (selectedDoctor?.schedule && (selectedDoctor.schedule as any)[dayKey]?.active) {
      const sched = (selectedDoctor.schedule as any)[dayKey];
      return generateTimeSlots(sched.start, sched.end);
    }

    // Default slots
    return ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
  };

  const availableSlots = getAvailableSlots();
  const isDoctorWorkDay = () => {
    if (!form.date || !selectedDoctor?.schedule) return true;
    const dayKey = DAY_MAP[new Date(form.date).getDay()];
    return (selectedDoctor.schedule as any)[dayKey]?.active !== false;
  };

  const handleSubmit = async () => {
    if (!user || !form.clinic_id || !form.date || !form.time || !form.patient_name || !form.patient_phone) {
      toast({ title: "Iltimos, barcha majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      clinic_id: form.clinic_id,
      doctor_id: form.doctor_id || null,
      service_id: form.service_id || null,
      appointment_date: form.date,
      appointment_time: form.time,
      total_price: totalPrice,
      patient_name: form.patient_name,
      patient_phone: form.patient_phone,
      notes: form.notes,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: "✅ Qabulga muvaffaqiyatli yozildingiz!" });
      // Send Telegram notification
      supabase.functions.invoke("telegram-notify", {
        body: {
          type: "new_appointment",
          data: {
            patient_name: form.patient_name,
            patient_phone: form.patient_phone,
            clinic_name: selectedClinic?.name || "—",
            appointment_date: form.date,
            appointment_time: form.time,
          },
        },
      }).catch(() => {});
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Qabul belgilandi!</h1>
          <p className="text-muted-foreground mb-2">{selectedClinic?.name}</p>
          <p className="text-foreground font-semibold">{form.date} — {form.time}</p>
          {totalPrice > 0 && <p className="text-primary text-xl font-bold mt-2">{totalPrice.toLocaleString()} so'm</p>}
          <p className="text-sm text-muted-foreground mt-4 mb-6">Klinika qabulingizni tez orada tasdiqlaydi</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline"><Link to="/dashboard">Panelga o'tish</Link></Button>
            <Button onClick={() => { setSuccess(false); setStep(1); setForm({ clinic_id: "", doctor_id: "", service_id: "", date: "", time: "", patient_name: profile?.full_name || "", patient_phone: profile?.phone || "", notes: "" }); }} className="bg-hero-gradient text-primary-foreground border-0">Yana yozilish</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">Onlayn qabulga yozilish</h1>
        <p className="text-muted-foreground mb-8">Shifokor qabuliga onlayn yoziling — tez va qulay</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>{s}</div>
              {s < 4 && <div className={cn("h-0.5 flex-1 rounded", step > s ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select clinic */}
        {step === 1 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Klinikani tanlang
            </h2>
            {clinics.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Hozircha ro'yxatdan o'tgan klinikalar yo'q</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {clinics.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setForm((p) => ({ ...p, clinic_id: c.id, doctor_id: "", service_id: "" })); setStep(2); }}
                    className={cn("text-left bg-card rounded-xl border p-4 transition-all hover:border-primary/30",
                      form.clinic_id === c.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.address || "Manzil ko'rsatilmagan"}
                    </p>
                    {(c.specialties as string[])?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(c.specialties as string[]).slice(0, 4).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select doctor & service */}
        {step === 2 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" /> Shifokor va xizmatni tanlang
            </h2>

            {doctors.length > 0 && (
              <div className="mb-6">
                <Label className="text-xs font-medium mb-2 block">Shifokor (ixtiyoriy)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {doctors.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setForm((p) => ({ ...p, doctor_id: p.doctor_id === d.id ? "" : d.id }))}
                      className={cn("text-left bg-card rounded-xl border p-3 transition-all",
                        form.doctor_id === d.id ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {d.photo_url ? (
                          <img src={d.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{d.full_name}</p>
                          <p className="text-xs text-muted-foreground">{d.specialty} • {d.experience_years} yil</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {d.avg_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-bold text-foreground">{Number(d.avg_rating).toFixed(1)}</span>
                          </div>
                        )}
                        {d.consultation_price > 0 && (
                          <span className="text-xs font-bold text-primary">{Number(d.consultation_price).toLocaleString()} so'm</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div className="mb-6">
                <Label className="text-xs font-medium mb-2 block">Xizmat (ixtiyoriy)</Label>
                <div className="space-y-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setForm((p) => ({ ...p, service_id: p.service_id === s.id ? "" : s.id }))}
                      className={cn("w-full text-left bg-card rounded-xl border p-3 transition-all flex justify-between items-center",
                        form.service_id === s.id ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.duration_minutes} daqiqa</p>
                      </div>
                      <span className="font-bold text-primary text-sm">{Number(s.price).toLocaleString()} so'm</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {totalPrice > 0 && (
              <div className="bg-accent rounded-xl p-4 mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Umumiy narx:</span>
                <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString()} so'm</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Orqaga</Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-hero-gradient text-primary-foreground border-0">Davom etish <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time with real-time availability */}
        {step === 3 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Sana va vaqtni tanlang
            </h2>

            <div className="mb-6">
              <Label className="text-xs font-medium">Sana *</Label>
              <Input type="date" value={form.date} min={today} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value, time: "" }))} className="mt-1" />
            </div>

            {form.date && !isDoctorWorkDay() && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-4 text-sm">
                ⚠️ Tanlangan shifokor bu kunda qabul qilmaydi. Iltimos, boshqa kun tanlang yoki shifokorni o'zgartiring.
              </div>
            )}

            {form.date && isDoctorWorkDay() && (
              <div className="mb-6">
                <Label className="text-xs font-medium mb-2 block">Vaqt * <span className="text-muted-foreground">(real vaqtda yangilanadi)</span></Label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {availableSlots.map((t) => {
                    const isBooked = bookedSlots.has(t);
                    return (
                      <button
                        key={t}
                        onClick={() => !isBooked && setForm((p) => ({ ...p, time: t }))}
                        disabled={isBooked}
                        className={cn("py-2 px-3 text-sm font-medium rounded-lg border transition-all relative",
                          isBooked ? "border-border bg-muted text-muted-foreground cursor-not-allowed line-through opacity-50" :
                          form.time === t ? "border-primary bg-primary text-primary-foreground" :
                          "border-border text-foreground hover:border-primary/30"
                        )}
                      >
                        {t}
                        {isBooked && <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />}
                      </button>
                    );
                  })}
                </div>
                {bookedSlots.size > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    🔴 Chizilgan vaqtlar band. Bo'sh vaqtlardan tanlang.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Orqaga</Button>
              <Button onClick={() => setStep(4)} disabled={!form.date || !form.time} className="flex-1 bg-hero-gradient text-primary-foreground border-0">Davom etish <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}

        {/* Step 4: Patient info & confirm */}
        {step === 4 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Ma'lumotlarni tasdiqlang
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-xs">Ism-familiya *</Label>
                <Input value={form.patient_name} onChange={(e) => setForm((p) => ({ ...p, patient_name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Telefon *</Label>
                <Input value={form.patient_phone} onChange={(e) => setForm((p) => ({ ...p, patient_phone: e.target.value }))} placeholder="+998..." className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Qo'shimcha izoh</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="mt-1" />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 mb-6 space-y-2">
              <h3 className="font-heading font-bold text-foreground text-sm">Qabul ma'lumotlari</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Klinika:</span> <span className="text-foreground font-medium">{selectedClinic?.name}</span></p>
                {selectedDoctor && <p><span className="text-muted-foreground">Shifokor:</span> <span className="text-foreground font-medium">{selectedDoctor.full_name}</span></p>}
                {selectedService && <p><span className="text-muted-foreground">Xizmat:</span> <span className="text-foreground font-medium">{selectedService.name}</span></p>}
                <p><span className="text-muted-foreground">Sana:</span> <span className="text-foreground font-medium">{form.date} — {form.time}</span></p>
                {totalPrice > 0 && <p className="text-primary font-bold text-lg pt-2 border-t border-border">{totalPrice.toLocaleString()} so'm</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-1" /> Orqaga</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-hero-gradient text-primary-foreground border-0">
                {submitting ? "Yuborilmoqda..." : "Qabulga yozilish"}
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BookingPage;
