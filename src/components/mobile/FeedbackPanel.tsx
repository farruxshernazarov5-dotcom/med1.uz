import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle, Lightbulb, MessageSquareWarning, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().trim().min(2, "Ismingizni kiriting").max(100),
  phone: z.string().trim().regex(/^\+998\d{9}$/, "Telefon: +998XXXXXXXXX"),
  message: z.string().trim().min(10, "Kamida 10 belgi yozing").max(2000),
});

/** Suggestions and complaints, saved to the same moderated inbox as the contact form. */
export default function FeedbackPanel() {
  const { user, profile } = useAuth();
  const [kind, setKind] = useState<"suggestion" | "complaint">("suggestion");
  const [form, setForm] = useState({ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ ...form, phone: form.phone.replace(/\s/g, "") });
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      user_id: user?.id ?? null, full_name: r.data.full_name, phone: r.data.phone, email: user?.email ?? "",
      subject: kind, message_type: kind, message: r.data.message,
    });
    setBusy(false);
    if (error) { toast.error("Yuborilmadi, qayta urinib ko‘ring"); return; }
    setSent(true);
  };

  if (sent) return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <CheckCircle className="h-12 w-12 text-medical-green" />
      <p className="font-semibold">Rahmat! Murojaatingiz qabul qilindi.</p>
      <p className="text-sm text-muted-foreground">Mutaxassislarimiz ko‘rib chiqib, siz bilan bog‘lanadi.</p>
      <Button variant="outline" onClick={() => { setSent(false); setForm((f) => ({ ...f, message: "" })); }}>Yana yuborish</Button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {([["suggestion", "Taklif", Lightbulb], ["complaint", "Shikoyat", MessageSquareWarning]] as const).map(([v, l, Icon]) => (
          <button key={v} type="button" aria-pressed={kind === v} onClick={() => setKind(v)}
            className={cn("flex h-20 flex-col items-center justify-center gap-1 rounded-xl border text-sm font-medium", kind === v ? "border-primary bg-primary/10 text-primary" : "border-border")}>
            <Icon className="h-6 w-6" />{l}
          </button>
        ))}
      </div>
      <div className="space-y-1.5"><Label htmlFor="fb-name">Ism</Label><Input id="fb-name" maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="fb-phone">Telefon</Label><Input id="fb-phone" inputMode="tel" placeholder="+998901234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="fb-msg">{kind === "complaint" ? "Shikoyatingiz (qayer, qachon, nima bo‘ldi)" : "Taklifingiz"}</Label><Textarea id="fb-msg" rows={5} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
      <Button type="submit" className="w-full" disabled={busy}><Send className="mr-2 h-4 w-4" />Yuborish</Button>
    </form>
  );
}
