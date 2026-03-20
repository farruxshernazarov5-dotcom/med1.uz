import { useState } from "react";
import { Calendar, Clock, User, Stethoscope, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const specialties = [
  "Terapevt", "Kardiolog", "Nevrolog", "Ginekolog", "Urolog",
  "LOR", "Oftalmolog", "Dermatolog", "Endokrinolog", "Gastroenterolog",
  "Stomatolog", "Pediatr", "Jarroh", "Ortoped", "Psixolog",
];

const doctors: Record<string, { name: string; exp: number }[]> = {
  "Terapevt": [{ name: "Dr. Ismoilova Hulkar", exp: 20 }, { name: "Dr. Toshmatov Bobur", exp: 12 }],
  "Kardiolog": [{ name: "Prof. Karimov Alisher", exp: 25 }, { name: "Dr. Ruziyev Nodir", exp: 20 }],
  "Nevrolog": [{ name: "Dots. Raxmatullayeva Nilufar", exp: 18 }],
  "Ginekolog": [{ name: "Dr. Xolmatova Madina", exp: 10 }],
  "Urolog": [{ name: "Dr. Ergashev Oybek", exp: 12 }],
  "Oftalmolog": [{ name: "Dr. Farrukh Farkhadovich", exp: 15 }],
  "Stomatolog": [{ name: "Dr. Salimova Zulfiya", exp: 14 }],
};

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

const AppointmentBooking = () => {
  const [step, setStep] = useState(1);
  const [specialty, setSpecialty] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(false);

  const availableDoctors = doctors[specialty] || [];

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Iltimos, barcha maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "✅ Arizangiz qabul qilindi!", description: "Tez orada siz bilan bog'lanamiz." });

    // Send Telegram notification
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.functions.invoke("telegram-notify", {
        body: {
          type: "new_appointment",
          data: {
            patient_name: name,
            patient_phone: phone,
            clinic_name: "Med1.uz (tezkor qabul)",
            doctor_name: doctor || "—",
            service_name: specialty || "Konsultatsiya",
            appointment_date: date ? format(date, "yyyy-MM-dd") : "—",
            appointment_time: time || "—",
            total_price: 0,
          },
        },
      }).catch(() => {});
    });
  };

  const reset = () => {
    setStep(1); setSpecialty(""); setDoctor(""); setDate(undefined);
    setTime(""); setName(""); setPhone(""); setSubmitted(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <div className="bg-card rounded-2xl border border-border shadow-card p-5 cursor-pointer hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground text-sm">Shifokor qabuliga yozilish</h3>
              <p className="text-xs text-muted-foreground">Online navbatga yoziling</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Sana tanlash", "Shifokor tanlash", "Ariza qoldirish"].map((t) => (
              <span key={t} className="text-[10px] px-2 py-1 bg-accent text-accent-foreground rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Shifokor qabuliga yozilish
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">Arizangiz qabul qilindi!</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {specialty} — {doctor}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              {date && format(date, "dd.MM.yyyy")} soat {time}
            </p>
            <p className="text-sm text-muted-foreground mb-4">Bemor: {name}, Tel: {phone}</p>
            <Button onClick={() => handleOpen(false)} className="bg-hero-gradient text-primary-foreground border-0">
              Yopish
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Steps indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>{s}</div>
                  {s < 4 && <div className={cn("h-0.5 flex-1 rounded-full", step > s ? "bg-primary" : "bg-muted")} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Yo'nalishni tanlang</Label>
                <div className="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto">
                  {specialties.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSpecialty(s); setDoctor(""); setStep(2); }}
                      className={cn(
                        "px-3 py-2.5 text-xs font-medium rounded-xl border transition-all text-center",
                        specialty === s
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30 text-foreground"
                      )}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Shifokorni tanlang — {specialty}</Label>
                {availableDoctors.length > 0 ? (
                  <div className="space-y-2">
                    {availableDoctors.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => { setDoctor(d.name); setStep(3); }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                          doctor === d.name
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                          <User className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.exp} yillik tajriba</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">Hozircha shifokor ro'yxati kiritilmagan</p>
                    <Button variant="outline" size="sm" onClick={() => { setDoctor("Birinchi bo'sh shifokor"); setStep(3); }}>
                      Davom etish
                    </Button>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="mt-2">← Orqaga</Button>
              </div>
            )}

            {step === 3 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Sana va vaqtni tanlang</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal mb-3", !date && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd.MM.yyyy") : "Sanani tanlang"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date() || d.getDay() === 0}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {date && (
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground">Vaqtni tanlang</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((t) => (
                        <button
                          key={t}
                          onClick={() => { setTime(t); setStep(4); }}
                          className={cn(
                            "px-3 py-2 text-xs font-medium rounded-lg border transition-all",
                            time === t
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/30 text-foreground"
                          )}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="mt-2">← Orqaga</Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div className="bg-accent/50 rounded-xl p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Yo'nalish:</span> <strong>{specialty}</strong></p>
                  <p><span className="text-muted-foreground">Shifokor:</span> <strong>{doctor}</strong></p>
                  <p><span className="text-muted-foreground">Sana:</span> <strong>{date && format(date, "dd.MM.yyyy")}</strong></p>
                  <p><span className="text-muted-foreground">Vaqt:</span> <strong>{time}</strong></p>
                </div>

                <div>
                  <Label htmlFor="name" className="text-xs">Ism-familiyangiz</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="To'liq ismingiz" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs">Telefon raqamingiz</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="mt-1" />
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep(3)}>← Orqaga</Button>
                  <Button onClick={handleSubmit} className="flex-1 bg-hero-gradient text-primary-foreground border-0">
                    <CheckCircle className="w-4 h-4 mr-2" /> Arizani yuborish
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBooking;
