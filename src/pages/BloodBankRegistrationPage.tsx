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
import { Droplet, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { writeAuditLog } from "@/utils/auditLog";

const STEPS = ["Asosiy ma'lumotlar", "Manzil", "Qo'shimcha", "Tasdiqlash"];
const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const BloodBankRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", inn: "", license_number: "", director_name: "",
    address: "", city: "", region: "", website: "", storage_capacity: "",
    emergency_contact: "", org_type: "government",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const toggleType = (t: string) =>
    setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("blood_banks_registered").insert({
      owner_id: user.id,
      name: form.name,
      org_type: form.org_type,
      phone: form.phone,
      email: form.email || null,
      inn: form.inn || null,
      license_number: form.license_number || null,
      director_name: form.director_name || null,
      address: form.address,
      city: form.city,
      region: form.region,
      website: form.website || null,
      storage_capacity: form.storage_capacity || null,
      emergency_contact: form.emergency_contact || null,
      available_blood_types: types,
    } as any);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      await writeAuditLog({ action: "create", entity_type: "blood_bank", module: "bloodbank", details: { name: form.name } });
      toast({ title: "Muvaffaqiyatli!", description: "Qon banki ro'yxatdan o'tdi" });
      navigate("/dashboard/bloodbank");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Droplet className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">🩸 Qon banki</h1>
            <p className="text-muted-foreground text-sm">Ro'yxatdan o'tish</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${i <= step ? "bg-red-500" : "bg-muted"}`} />
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          {step === 0 && (<>
            <Label>Muassasa nomi *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Respublika qon markazi" />
            <Label>Telefon *</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998..." />
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="info@qonbank.uz" />
            <Label>INN</Label>
            <Input value={form.inn} onChange={(e) => set("inn", e.target.value)} placeholder="123456789" />
          </>)}
          {step === 1 && (<>
            <Label>Manzil *</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Ko'cha, uy" />
            <Label>Shahar *</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Toshkent" />
            <Label>Viloyat *</Label>
            <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Toshkent shahri" />
          </>)}
          {step === 2 && (<>
            <Label>Direktor ismi</Label>
            <Input value={form.director_name} onChange={(e) => set("director_name", e.target.value)} />
            <Label>Litsenziya raqami</Label>
            <Input value={form.license_number} onChange={(e) => set("license_number", e.target.value)} />
            <Label>Saqlash quvvati</Label>
            <Input value={form.storage_capacity} onChange={(e) => set("storage_capacity", e.target.value)} placeholder="500 litr" />
            <Label>Shoshilinch aloqa</Label>
            <Input value={form.emergency_contact} onChange={(e) => set("emergency_contact", e.target.value)} placeholder="+998..." />
            <Label>Mavjud qon guruhlari</Label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    types.includes(t)
                      ? "bg-red-500 text-primary-foreground border-red-500"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </>)}
          {step === 3 && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h3 className="font-heading text-xl font-bold text-foreground">Ma'lumotlarni tasdiqlang</h3>
              <div className="text-left space-y-1 text-sm text-muted-foreground">
                <p><strong>Nom:</strong> {form.name}</p>
                <p><strong>Telefon:</strong> {form.phone}</p>
                <p><strong>Manzil:</strong> {form.address}, {form.city}</p>
                {types.length > 0 && <p><strong>Qon guruhlari:</strong> {types.join(", ")}</p>}
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
              <Button onClick={handleSubmit} disabled={loading || !form.address || !form.city || !form.region}>
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

export default BloodBankRegistrationPage;
