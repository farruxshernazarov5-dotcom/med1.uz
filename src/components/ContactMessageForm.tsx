import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle, MessageSquare } from "lucide-react";

const ContactMessageForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    email: user?.email || "",
    subject: "general",
    message: "",
  });

  const subjects = [
    { value: "general", label: "Umumiy savol" },
    { value: "complaint", label: "Shikoyat" },
    { value: "partnership", label: "Hamkorlik" },
    { value: "subscription", label: "Obuna masalasi" },
    { value: "technical", label: "Texnik yordam" },
    { value: "ai_service", label: "AI xizmatlari" },
  ];

  const validatePhone = (phone: string) => /^\+998\d{9}$/.test(phone.replace(/\s/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.message.trim()) {
      toast({ title: "Barcha majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    if (!validatePhone(form.phone)) {
      toast({ title: "Telefon raqam noto'g'ri", description: "Format: +998XXXXXXXXX", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        user_id: user?.id || null,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
        message_type: form.subject,
      });
      if (error) throw error;

      // Send Telegram notification (fire and forget)
      supabase.functions.invoke("telegram-notify", {
        body: { type: "contact_message", data: form },
      }).catch(() => {});

      setSent(true);
      toast({ title: "Xabaringiz qabul qilindi!", description: "24 soat ichida siz bilan bog'lanamiz." });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Sizning so'rovingiz qabul qilindi!</h3>
        <p className="text-muted-foreground">24 soat ichida siz bilan bog'lanamiz.</p>
        <Button variant="outline" className="mt-4" onClick={() => { setSent(false); setForm(f => ({ ...f, message: "" })); }}>
          Yana xabar yuborish
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Xabar qoldirish</h3>
      </div>
      <Input placeholder="To'liq ismingiz *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required maxLength={100} />
      <Input placeholder="+998XXXXXXXXX *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required maxLength={13} />
      <Input placeholder="Email (ixtiyoriy)" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} maxLength={255} />
      <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
        <SelectTrigger><SelectValue placeholder="Mavzu tanlang" /></SelectTrigger>
        <SelectContent>
          {subjects.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Textarea placeholder="Xabaringiz *" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required maxLength={1000} rows={4} />
      <Button type="submit" className="w-full" disabled={loading}>
        <Send className="w-4 h-4 mr-2" />
        {loading ? "Yuborilmoqda..." : "Yuborish"}
      </Button>
    </form>
  );
};

export default ContactMessageForm;
