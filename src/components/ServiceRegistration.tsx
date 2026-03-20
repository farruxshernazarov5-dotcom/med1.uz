import { useState } from "react";
import { FileEdit, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const serviceTypes = [
  "Klinikani ro'yxatdan o'tkazish",
  "Dorixonani ro'yxatdan o'tkazish",
  "Shifokor profilini yaratish",
  "Diagnostika markazini qo'shish",
  "Reklama joylashtirish",
  "Hamkorlik taklifi",
  "Boshqa",
];

const ServiceRegistration = () => {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    type: "",
    orgName: "",
    contactName: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleSubmit = () => {
    if (!form.type || !form.contactName || !form.phone) {
      toast({ title: "Iltimos, majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "✅ Arizangiz yuborildi!", description: "24 soat ichida javob beramiz." });

    // Send Telegram notification
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.functions.invoke("telegram-notify", {
        body: {
          type: "service_order",
          data: {
            user_name: form.contactName,
            phone: form.phone,
            org_name: form.orgName || "—",
            service_name: form.type,
            price: "—",
          },
        },
      }).catch(() => {});
    });
  };

  const reset = () => {
    setSubmitted(false);
    setForm({ type: "", orgName: "", contactName: "", phone: "", email: "", message: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <div className="bg-card rounded-2xl border border-border shadow-card p-5 cursor-pointer hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
              <FileEdit className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground text-sm">Ariza qoldirish</h3>
              <p className="text-xs text-muted-foreground">Xizmatlar uchun ro'yxatdan o'ting</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Klinika", "Dorixona", "Shifokor", "Reklama"].map((t) => (
              <span key={t} className="text-[10px] px-2 py-1 bg-accent text-accent-foreground rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-primary" />
            Ariza qoldirish
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">Arizangiz qabul qilindi!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {form.type} — {form.contactName}
            </p>
            <Button onClick={() => { setOpen(false); reset(); }} className="bg-hero-gradient text-primary-foreground border-0">
              Yopish
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-2 block">Xizmat turini tanlang *</Label>
              <div className="grid grid-cols-2 gap-2">
                {serviceTypes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm((p) => ({ ...p, type: s }))}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left",
                      form.type === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30 text-foreground"
                    )}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="orgName" className="text-xs">Tashkilot nomi</Label>
              <Input id="orgName" value={form.orgName} onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))} placeholder="Klinika / dorixona nomi" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cname" className="text-xs">Ism-familiya *</Label>
                <Input id="cname" value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} placeholder="To'liq ism" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cphone" className="text-xs">Telefon *</Label>
                <Input id="cphone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+998..." className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="cemail" className="text-xs">Email</Label>
              <Input id="cemail" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="cmsg" className="text-xs">Qo'shimcha izoh</Label>
              <Textarea id="cmsg" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Batafsil yozing..." rows={3} className="mt-1" />
            </div>

            <Button onClick={handleSubmit} className="w-full bg-hero-gradient text-primary-foreground border-0">
              <Send className="w-4 h-4 mr-2" /> Arizani yuborish
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceRegistration;
