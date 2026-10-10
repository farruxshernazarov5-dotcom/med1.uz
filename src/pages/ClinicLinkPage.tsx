import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { goBackSafe } from "@/lib/safeBack";
import { useNavigate } from "react-router-dom";

const SOFTWARE = ["DMED", "Damumed", "MedElement", "1C: Medicina", "Med ALL HMS", "Boshqa"];
const SCOPES = [
  { id: "visits", label: "Qabullar va tashxislar" },
  { id: "labs", label: "Laboratoriya tahlillari" },
  { id: "prescriptions", label: "Retseptlar" },
  { id: "imaging", label: "Rentgen, MRT, UZI xulosalari" },
  { id: "documents", label: "Tibbiy hujjatlar" },
] as const;
const STATUS: Record<string, string> = {
  pending: "Ko‘rib chiqilmoqda",
  contacting: "Klinika bilan bog‘lanilmoqda",
  connected: "Ulandi",
  rejected: "Rad etildi",
  revoked: "Rozilik bekor qilingan",
};
const CONSENT_TEXT =
  "Men tanlangan klinikadagi tibbiy ma’lumotlarim (yuqorida belgilangan turlar) Med1.uz / Med ALL shaxsiy kabinetimga uzatilishiga roziman. Rozilikni istalgan vaqtda shu sahifada bekor qilishim mumkin. Ma’lumotlar faqat menga va men ruxsat bergan shifokorlarga ko‘rinadi.";

const schema = z.object({
  clinic_name: z.string().trim().min(2, "Klinika nomini kiriting").max(160),
  clinic_region: z.string().trim().max(80).optional(),
  clinic_phone: z.string().trim().regex(/^\+998\d{9}$/, "Telefon +998XXXXXXXXX ko‘rinishida").or(z.literal("")).optional(),
  software_name: z.string().trim().min(2, "Klinika dasturini tanlang").max(120),
  patient_card_number: z.string().trim().max(60).optional(),
});

type Req = { id: string; clinic_name: string; software_name: string; data_scopes: string[]; status: string; created_at: string; admin_note: string | null };

export default function ClinicLinkPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ clinic_name: "", clinic_region: "", clinic_phone: "", software_name: "", other: "", patient_card_number: "" });
  const [scopes, setScopes] = useState<string[]>(["visits", "labs"]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Req[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("external_clinic_link_requests")
      .select("id,clinic_name,software_name,data_scopes,status,created_at,admin_note")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setList((data ?? []) as Req[]);
  };
  useEffect(() => { void load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!user) return;
    const software = form.software_name === "Boshqa" ? form.other : form.software_name;
    const parsed = schema.safeParse({ ...form, software_name: software });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!scopes.length) { toast.error("Kamida bitta ma’lumot turini tanlang"); return; }
    if (!consent) { toast.error("Davom etish uchun roziligingiz kerak"); return; }
    setBusy(true);
    const d = parsed.data;
    const { error } = await supabase.from("external_clinic_link_requests").insert({
      user_id: user.id,
      clinic_name: d.clinic_name,
      clinic_region: d.clinic_region || null,
      clinic_phone: d.clinic_phone || null,
      software_name: d.software_name,
      patient_card_number: d.patient_card_number || null,
      data_scopes: scopes,
      consent_given: true,
      consent_version: "v1",
    });
    setBusy(false);
    if (error) { toast.error("So‘rov yuborilmadi. Qayta urinib ko‘ring."); return; }
    toast.success("So‘rov yuborildi. Klinika bilan bog‘langach xabar beramiz.");
    setForm({ clinic_name: "", clinic_region: "", clinic_phone: "", software_name: "", other: "", patient_card_number: "" });
    setConsent(false);
    void load();
  };

  const revoke = async (id: string) => {
    const { error } = await (supabase as any).rpc("revoke_my_clinic_link", { _id: id });
    if (error) toast.error("Bekor qilib bo‘lmadi");
    else { toast.success("Rozilik bekor qilindi"); void load(); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 pb-28 pt-6">
      <button onClick={() => goBackSafe(navigate)} className="text-sm text-primary">← Ortga</button>
      <header className="space-y-2">
        <Building2 className="h-9 w-9 text-primary" />
        <h1 className="text-2xl font-bold">Klinikamni ulash</h1>
        <p className="text-sm text-muted-foreground">
          Siz davolanayotgan klinika Med1.uz saytida yo‘qmi? Klinika nomi va u ishlatadigan dasturni kiriting — biz klinika bilan bog‘lanib,
          roziligingiz asosida qabul va tahlillaringizni kabinetingizga ulaymiz.
        </p>
      </header>

      {!user ? (
        <div className="rounded-lg border border-border bg-card p-5 text-center">
          <p className="text-sm">So‘rov yuborish uchun hisobingizga kiring.</p>
          <Button asChild className="mt-4"><Link to={`/auth?next=${encodeURIComponent("/clinic-link")}`}>Kirish</Link></Button>
        </div>
      ) : (
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="space-y-1.5"><Label htmlFor="cn">Klinika nomi *</Label><Input id="cn" maxLength={160} value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} placeholder="Masalan: Shifo-Med klinikasi" /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="cr">Shahar / viloyat</Label><Input id="cr" maxLength={80} value={form.clinic_region} onChange={(e) => setForm({ ...form, clinic_region: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="cp">Klinika telefoni</Label><Input id="cp" inputMode="tel" maxLength={13} value={form.clinic_phone} onChange={(e) => setForm({ ...form, clinic_phone: e.target.value })} placeholder="+998901234567" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Klinika dasturi (tizimi) *</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOFTWARE.map((s) => (
                <Button key={s} type="button" variant={form.software_name === s ? "default" : "outline"} onClick={() => setForm({ ...form, software_name: s })}>{s}</Button>
              ))}
            </div>
            {form.software_name === "Boshqa" && <Input maxLength={120} value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} placeholder="Dastur nomini yozing" />}
            <p className="text-xs text-muted-foreground">Bilmasangiz, klinika registraturasidan so‘rang yoki “Boshqa” → “Bilmayman” deb yozing.</p>
          </div>
          <div className="space-y-1.5"><Label htmlFor="pc">Klinikadagi bemor kartangiz raqami</Label><Input id="pc" maxLength={60} value={form.patient_card_number} onChange={(e) => setForm({ ...form, patient_card_number: e.target.value })} placeholder="Ixtiyoriy" /></div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Qaysi ma’lumotlar ulanadi *</legend>
            {SCOPES.map((s) => (
              <label key={s.id} className="flex items-center gap-3 text-sm">
                <Checkbox checked={scopes.includes(s.id)} onCheckedChange={(v) => setScopes((cur) => (v ? [...cur, s.id] : cur.filter((x) => x !== s.id)))} />
                {s.label}
              </label>
            ))}
          </fieldset>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Bemor roziligi</p>
            <p className="mt-2 text-xs text-muted-foreground">{CONSENT_TEXT}</p>
            <label className="mt-3 flex items-start gap-3 text-sm"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-0.5" />Roziman va ma’lumotlarim to‘g‘ri</label>
          </div>
          <Button className="h-12 w-full" disabled={busy || !consent} onClick={() => void submit()}>{busy && <Loader2 className="animate-spin" />}So‘rov yuborish</Button>
        </section>
      )}

      {list.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold">Mening so‘rovlarim</h2>
          {list.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.clinic_name}</p>
                  <p className="text-xs text-muted-foreground">{r.software_name} · {new Date(r.created_at).toLocaleDateString("uz-UZ")}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium">
                  {r.status === "connected" ? <CheckCircle2 className="h-3.5 w-3.5 text-medical-green" /> : r.status === "rejected" || r.status === "revoked" ? <XCircle className="h-3.5 w-3.5 text-destructive" /> : <Loader2 className="h-3.5 w-3.5" />}
                  {STATUS[r.status] ?? r.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{r.data_scopes.map((s) => SCOPES.find((x) => x.id === s)?.label ?? s).join(", ")}</p>
              {r.admin_note && <p className="mt-2 text-xs">{r.admin_note}</p>}
              {r.status !== "revoked" && r.status !== "rejected" && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void revoke(r.id)}>Roziligimni bekor qilish</Button>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
