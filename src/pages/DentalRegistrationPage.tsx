import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Stethoscope, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { writeAuditLog } from "@/utils/auditLog";

const STEPS = ["Asosiy ma'lumotlar", "Manzil", "Qo'shimcha", "Tasdiqlash"];

const DentalRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", inn: "", license_number: "", director_name: "",
    address: "", city: "", region: "", website: "", working_hours: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("registered_dental_clinics").insert({
      owner_id: user.id,
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      inn: form.inn || null,
      license_number: form.license_number || null,
      director_name: form.director_name || null,
      address: form.address,
      city: form.city,
      region: form.region,
      website: form.website || null,
      working_hours: form.working_hours ? { schedule: form.working_hours } : null,
    } as any);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      await writeAuditLog({ action: "create", entity_type: "dental_clinic", module: "dental", details: { name: form.name } });
      toast({ title: "Muvaffaqiyatli!", description: "Stomatologiya klinikangiz ro'yxatdan o'tdi" });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">🦷 Stomatologiya klinikasi</h1>
            <p className="text-muted-foreground text-sm">Ro'yxatdan o'tish</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          {step === 0 && (<>
            <Label>Klinika nomi *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Dental Smile" />
            <Label>Telefon *</Label>
            <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+998..." />
            <Label>Email</Label>
            <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="info@dental.uz" />
            <Label>INN</Label>
            <Input value={form.inn} onChange={e => set("inn", e.target.value)} placeholder="123456789" />
          </>)}
          {step === 1 && (<>
            <Label>Manzil *</Label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Ko'cha, uy" />
            <Label>Shahar *</Label>
            <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Toshkent" />
            <Label>Viloyat *</Label>
            <Input value={form.region} onChange={e => set("region", e.target.value)} placeholder="Toshkent shahri" />
          </>)}
          {step === 2 && (<>
            <Label>Direktor ismi</Label>
            <Input value={form.director_name} onChange={e => set("director_name", e.target.value)} />
            <Label>Litsenziya raqami</Label>
            <Input value={form.license_number} onChange={e => set("license_number", e.target.value)} />
            <Label>Veb-sayt</Label>
            <Input value={form.website} onChange={e => set("website", e.target.value)} />
            <Label>Ish vaqti</Label>
            <Input value={form.working_hours} onChange={e => set("working_hours", e.target.value)} placeholder="09:00-18:00" />
          </>)}
          {step === 3 && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="w-16 h-16 text-primary mx-auto" />
              <h3 className="font-heading text-xl font-bold text-foreground">Ma'lumotlarni tasdiqlang</h3>
              <div className="text-left space-y-1 text-sm text-muted-foreground">
                <p><strong>Nom:</strong> {form.name}</p>
                <p><strong>Telefon:</strong> {form.phone}</p>
                <p><strong>Manzil:</strong> {form.address}, {form.city}</p>
                {form.email && <p><strong>Email:</strong> {form.email}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 0 && (!form.name || !form.phone)}>
                Keyingi <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Yuklanmoqda..." : "Ro'yxatdan o'tish"}
              </Button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DentalRegistrationPage;
