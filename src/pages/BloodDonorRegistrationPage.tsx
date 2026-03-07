import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Droplets, Heart, Calendar, MapPin, User, Check, AlertTriangle, Loader2 } from "lucide-react";
import { uzbekistanRegions, getDistrictsByRegion } from "@/data/uzbekistanRegions";

const BLOOD_GROUPS = ["A (II) Rh+", "A (II) Rh-", "B (III) Rh+", "B (III) Rh-", "AB (IV) Rh+", "AB (IV) Rh-", "O (I) Rh+", "O (I) Rh-"];

const BloodDonorRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [lastDonationDate, setLastDonationDate] = useState("");
  const [eligibilityStatus, setEligibilityStatus] = useState<"unknown" | "eligible" | "ineligible">("unknown");

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "male",
    passportId: "",
    phone: "+998",
    bloodGroup: "",
    weight: "",
    region: "",
    city: "",
    medicalRestrictions: "",
  });

  const checkEligibility = (dateStr: string) => {
    if (!dateStr) {
      setEligibilityStatus("eligible"); // Assume eligible if never donated
      return;
    }
    const lastDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 90) {
      setEligibilityStatus("ineligible");
      toast({
        title: "Siz qon topshira olmaysiz",
        description: `Oxirgi qon topshirishdan 90 kun o'tishi kerak. Sizda ${90 - diffDays} kun qoldi.`,
        variant: "destructive",
      });
    } else {
      setEligibilityStatus("eligible");
      toast({ title: "Siz qon topshirishingiz mumkin!", description: "90 kundan ortiq vaqt o'tgan.", className: "bg-green-50 border-green-200 text-green-800" });
    }
    setLastDonationDate(dateStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Avval tizimga kiring", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (eligibilityStatus === "ineligible") return;

    setSubmitting(true);
    const { error } = await supabase.from("blood_donors").insert({
      full_name: form.fullName,
      date_of_birth: form.dateOfBirth,
      gender: form.gender,
      passport_id: form.passportId,
      phone: form.phone,
      blood_group: form.bloodGroup,
      weight: parseFloat(form.weight),
      last_donation_date: lastDonationDate || null,
      region: form.region,
      city: form.city,
      medical_restrictions: form.medicalRestrictions,
      user_id: user.id,
    } as any);

    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Donor sifatida ro'yxatdan o'tdingiz!" });
      navigate("/blood-banks");
    }
    setSubmitting(false);
  };

  const districts = form.region ? getDistrictsByRegion(form.region) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-medical-red/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-medical-red" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Donor bo'lish</h1>
            <p className="text-muted-foreground mt-2">Hayot saqlab qolish uchun birinchi qadam</p>
          </div>

          <Card>
            <CardHeader><CardTitle>Donor anketasi</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Shaxsiy ma'lumotlar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>F.I.O</Label>
                      <Input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="To'liq ismingiz" />
                    </div>
                    <div>
                      <Label>Tug'ilgan sana</Label>
                      <Input type="date" required value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
                    </div>
                    <div>
                      <Label>Jinsi</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                        <option value="male">Erkak</option>
                        <option value="female">Ayol</option>
                      </select>
                    </div>
                    <div>
                      <Label>Pasport seriyasi</Label>
                      <Input required value={form.passportId} onChange={e => setForm({...form, passportId: e.target.value.toUpperCase()})} placeholder="AA1234567" maxLength={9} />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+998..." />
                    </div>
                  </div>
                </div>

                {/* Medical Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Droplets className="w-4 h-4 text-medical-red" /> Tibbiy ma'lumotlar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Qon guruhi</Label>
                      <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}>
                        <option value="">Tanlang</option>
                        {BLOOD_GROUPS.map(bg => <option key={bt} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Vazn (kg)</Label>
                      <Input type="number" required value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="65" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Oxirgi qon topshirgan sana</Label>
                      <Input type="date" value={lastDonationDate} onChange={e => checkEligibility(e.target.value)} />
                      <p className="text-xs text-muted-foreground mt-1">Agar avval topshirmagan bo'lsangiz, bo'sh qoldiring</p>
                    </div>
                  </div>
                  
                  {eligibilityStatus === "ineligible" && (
                    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">Hozircha qon topshira olmaysiz</p>
                        <p className="text-xs text-destructive/80">Qon topshirish oralig'i kamida 90 kun (3 oy) bo'lishi shart.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Manzil</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Viloyat</Label>
                      <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.region} onChange={e => setForm({...form, region: e.target.value, city: ""})}>
                        <option value="">Tanlang</option>
                        {uzbekistanRegions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Shahar / Tuman</Label>
                      <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.city} onChange={e => setForm({...form, city: e.target.value})} disabled={!form.region}>
                        <option value="">Tanlang</option>
                        {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={submitting || eligibilityStatus === "ineligible"} className="w-full bg-medical-red hover:bg-medical-red/90 text-white h-12">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
                  Ro'yxatdan o'tish
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BloodDonorRegistrationPage;
