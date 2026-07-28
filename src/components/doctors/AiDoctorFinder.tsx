import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildSlots, dateKey } from "@/lib/doctorAvailability";

import { Stethoscope, Star, Loader2, Sparkles, AlertTriangle, RotateCcw, SlidersHorizontal, CalendarCheck, Wallet, Languages } from "lucide-react";


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultRegion?: string;
}

const REGIONS = [
  "г. Ташкент","Ташкентская область","Самаркандская область","Бухарская область",
  "Кашкадарьинская область","Андижанская область","Сырдарьинская область",
  "Наманганская область","Хорезмская область","Джизакская область",
  "Ферганская область","Каракалпакстан","Навоийская область","Сурхандарьинская область",
];

const URGENCY: Record<string, { label: string; cls: string }> = {
  low: { label: "Shoshilinch emas", cls: "bg-medical-green/10 text-medical-green border-medical-green/20" },
  medium: { label: "O'rtacha", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  high: { label: "Tezkor murojaat", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  critical: { label: "Shoshilinch tibbiy yordam!", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function AiDoctorFinder({ open, onOpenChange, defaultRegion }: Props) {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState(defaultRegion || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // --- Qo'shimcha filtrlar ---
  const [fLang, setFLang] = useState("all");
  const [fRating, setFRating] = useState("all");
  const [fPrice, setFPrice] = useState("all");
  const [fToday, setFToday] = useState(false);
  const [meta, setMeta] = useState<Record<string, { languages: string[]; minPrice: number | null; todayFree: number }>>({});
  const [metaLoading, setMetaLoading] = useState(false);

  const doctorIds: string[] = useMemo(
    () => (result?.doctors || []).map((d: any) => d.id).filter(Boolean),
    [result]
  );

  useEffect(() => {
    if (doctorIds.length === 0) { setMeta({}); return; }
    let alive = true;
    setMetaLoading(true);
    (async () => {
      const today = new Date();
      const key = dateKey(today);
      const wd = today.getDay();
      const nowMin = today.getHours() * 60 + today.getMinutes();

      const [langs, services, avail, booked] = await Promise.all([
        supabase.from("doctors_external").select("id, languages").in("id", doctorIds),
        supabase.from("doctor_ext_services").select("doctor_id, price").in("doctor_id", doctorIds).eq("is_active", true),
        supabase.from("doctor_ext_availability").select("doctor_id, start_time, end_time, slot_minutes")
          .in("doctor_id", doctorIds).eq("weekday", wd).eq("is_active", true),
        supabase.from("doctor_ext_appointments").select("doctor_id, appointment_time")
          .in("doctor_id", doctorIds).eq("appointment_date", key).neq("status", "cancelled"),
      ]);
      if (!alive) return;

      const availByDoc = new Map<string, any>();
      (avail.data || []).forEach((r: any) => availByDoc.set(r.doctor_id, r));
      const hasAvailTable = (avail.data || []).length > 0;
      const bookedByDoc = new Map<string, Set<string>>();
      (booked.data || []).forEach((b: any) => {
        const s = bookedByDoc.get(b.doctor_id) || new Set<string>();
        s.add(String(b.appointment_time).slice(0, 5));
        bookedByDoc.set(b.doctor_id, s);
      });
      const priceByDoc = new Map<string, number>();
      (services.data || []).forEach((s: any) => {
        const p = Number(s.price) || 0;
        if (!priceByDoc.has(s.doctor_id) || p < (priceByDoc.get(s.doctor_id) as number)) priceByDoc.set(s.doctor_id, p);
      });

      const next: typeof meta = {};
      doctorIds.forEach((id) => {
        const row = availByDoc.get(id);
        const closed = hasAvailTable ? !row : wd === 0;
        const taken = bookedByDoc.get(id) || new Set<string>();
        const slots = closed ? [] : buildSlots(row);
        const free = slots.filter((t) => {
          const [h, m] = t.split(":").map(Number);
          return !taken.has(t) && h * 60 + m > nowMin;
        }).length;
        next[id] = {
          languages: ((langs.data || []).find((l: any) => l.id === id)?.languages as string[]) || [],
          minPrice: priceByDoc.has(id) ? (priceByDoc.get(id) as number) : null,
          todayFree: free,
        };
      });
      setMeta(next);
      setMetaLoading(false);
    })();
    return () => { alive = false; };
  }, [doctorIds]);

  const langOptions = useMemo(() => {
    const s = new Set<string>();
    Object.values(meta).forEach((m) => m.languages.forEach((l) => l && s.add(l)));
    return Array.from(s).sort();
  }, [meta]);

  const filteredDoctors = useMemo(() => {
    const list: any[] = result?.doctors || [];
    return list.filter((d) => {
      const m = meta[d.id];
      if (fLang !== "all" && !(m?.languages || []).includes(fLang)) return false;
      if (fRating !== "all" && Number(d.rating || 0) < Number(fRating)) return false;
      if (fPrice !== "all") {
        const p = m?.minPrice;
        if (p == null) return false;
        if (fPrice === "0-100000" && p > 100000) return false;
        if (fPrice === "100000-300000" && (p < 100000 || p > 300000)) return false;
        if (fPrice === "300000+" && p < 300000) return false;
      }
      if (fToday && !(m && m.todayFree > 0)) return false;
      return true;
    });
  }, [result, meta, fLang, fRating, fPrice, fToday]);

  const resetFilters = () => { setFLang("all"); setFRating("all"); setFPrice("all"); setFToday(false); };
  const activeFilters = [fLang !== "all", fRating !== "all", fPrice !== "all", fToday].filter(Boolean).length;



  const run = async (withAnswers?: { question: string; answer: string }[]) => {
    if (complaint.trim().length < 3) { toast({ title: "Simptom yoki kasallikni yozing", variant: "destructive" }); return; }
    if (!user) { toast({ title: "Tizimga kirish talab qilinadi", variant: "destructive" }); return; }
    setLoading(true); setError(null);
    if (!withAnswers) { setResult(null); setAnswers({}); }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-doctor-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          complaint: complaint.trim(),
          age: age ? Number(age) : null,
          gender: gender || null,
          region: region || null,
          answers: withAnswers || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI xatosi");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const a = result?.analysis;
  const redFlags: any[] = Array.isArray(a?.red_flags) ? a.red_flags : [];
  const needsAnswers = !!result?.needs_answers && redFlags.length > 0;
  const allAnswered = redFlags.every((q) => answers[q.id]);

  const submitAnswers = () =>
    run(redFlags.map((q) => ({ question: q.question, answer: answers[q.id] === "yes" ? "ha" : "yo'q" })));


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AI menga mos shifokorni topsin
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea rows={3} value={complaint} onChange={(e) => setComplaint(e.target.value)}
            placeholder="Masalan: 3 kundan beri ko'krak qafasida sanchiq va hansirash..." />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Yosh" />
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder="Jins" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Erkak</SelectItem>
                <SelectItem value="female">Ayol</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger><SelectValue placeholder="Joylashuv (viloyat)" /></SelectTrigger>
            <SelectContent>
              {REGIONS.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => run()} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "AI tahlil qilmoqda..." : "Mos shifokorni topish"}
          </Button>
          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              Foydalanish uchun <Link to="/auth" className="text-primary underline">tizimga kiring</Link>.
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
            <p className="flex items-center gap-2 text-destructive font-medium"><AlertTriangle className="w-4 h-4" /> {error}</p>
            <Button size="sm" variant="outline" className="mt-2 gap-2" onClick={() => run()}><RotateCcw className="w-3.5 h-3.5" /> Qayta urinish</Button>
          </div>
        )}

        {needsAnswers && (
          <div className="space-y-3 border-t pt-3">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" /> Aniqlashtiruvchi savollar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Xavfli belgilarni istisno qilish uchun quyidagilarga javob bering — tavsiya ishonchliligi oshadi.
              </p>
            </div>
            {redFlags.map((q: any) => (
              <div key={q.id} className="space-y-1.5">
                <p className="text-sm font-medium">{q.question}</p>
                {q.why && <p className="text-[11px] text-muted-foreground">{q.why}</p>}
                <div className="flex gap-2">
                  {[{ v: "yes", l: "Ha" }, { v: "no", l: "Yo'q" }].map((o) => (
                    <button key={o.v} onClick={() => setAnswers((p) => ({ ...p, [q.id]: o.v }))}
                      className={`px-4 py-1.5 rounded-lg border text-xs ${answers[q.id] === o.v ? "border-primary bg-primary/10 font-bold" : "hover:bg-muted/50"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={submitAnswers} disabled={loading || !allAnswered} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Yakuniy tavsiyani olish
            </Button>
          </div>
        )}

        {a && !needsAnswers && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={URGENCY[a.urgency]?.cls}>{URGENCY[a.urgency]?.label || a.urgency}</Badge>
              {(a.specialties || []).map((s: string) => <Badge key={s}>{s}</Badge>)}
            </div>

            {typeof a.confidence === "number" && (
              <div className="p-3 rounded-xl border bg-muted/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Tavsiya ishonchliligi</span>
                  <span className="text-primary">{a.confidence}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${a.confidence}%` }} />
                </div>
                {a.confidence_reason && <p className="text-[11px] text-muted-foreground">{a.confidence_reason}</p>}
              </div>
            )}

            {Array.isArray(a.detected_red_flags) && a.detected_red_flags.length > 0 && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
                <p className="font-semibold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Diqqat talab qiluvchi belgilar
                </p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {a.detected_red_flags.slice(0, 4).map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {a.summary && <p className="text-sm text-muted-foreground">{a.summary}</p>}
            {a.age_note && <p className="text-xs text-muted-foreground">{a.age_note}</p>}
            {Array.isArray(a.possible_conditions) && a.possible_conditions.length > 0 && (
              <p className="text-xs"><span className="font-semibold">Ehtimoliy holatlar:</span> {a.possible_conditions.join(", ")}</p>
            )}
            {Array.isArray(a.questions_for_doctor) && a.questions_for_doctor.length > 0 && (
              <div className="text-xs">
                <p className="font-semibold mb-1">Shifokorga so'rang:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {a.questions_for_doctor.slice(0, 4).map((q: string, i: number) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">
                  Mos shifokorlar ({filteredDoctors.length}
                  {filteredDoctors.length !== (result.doctors?.length || 0) ? ` / ${result.doctors?.length || 0}` : ""})
                </p>
                {activeFilters > 0 && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={resetFilters}>
                    <RotateCcw className="w-3 h-3" /> Tozalash
                  </Button>
                )}
              </div>

              <div className="rounded-xl border bg-muted/30 p-2.5 space-y-2 mb-3">
                <p className="text-[11px] font-semibold flex items-center gap-1.5 text-muted-foreground">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Qo'shimcha mezonlar
                  {metaLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={fLang} onValueChange={setFLang}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Til" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha tillar</SelectItem>
                      {langOptions.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={fRating} onValueChange={setFRating}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Reyting" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha reyting</SelectItem>
                      <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                      <SelectItem value="4">4.0+ ⭐</SelectItem>
                      <SelectItem value="3">3.0+ ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={fPrice} onValueChange={setFPrice}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Narx" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha narxlar</SelectItem>
                      <SelectItem value="0-100000">100 000 so'mgacha</SelectItem>
                      <SelectItem value="100000-300000">100–300 ming so'm</SelectItem>
                      <SelectItem value="300000+">300 ming so'mdan yuqori</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant={fToday ? "default" : "outline"}
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setFToday((v) => !v)}
                  >
                    <CalendarCheck className="w-3.5 h-3.5" /> Bugun bo'sh
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {filteredDoctors.map((d: any) => {
                  const m = meta[d.id];
                  return (
                  <Link key={d.id} to={`/doctors/ext/${d.slug}`} onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border hover:border-primary/40 transition">
                    {d.photo_url ? (
                      <img src={d.photo_url} alt={d.name} loading="lazy" className="w-11 h-11 rounded-lg object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{d.name}</p>
                      <p className="text-xs text-primary truncate">{d.primary_specialty}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {d.primary_region}{d.experience ? ` · ${d.experience} yil` : ""}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m?.minPrice != null && (
                          <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0">
                            <Wallet className="w-2.5 h-2.5" />{m.minPrice.toLocaleString("uz-UZ")} so'mdan
                          </Badge>
                        )}
                        {m && m.todayFree > 0 && (
                          <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0 border-medical-green/30 text-medical-green">
                            <CalendarCheck className="w-2.5 h-2.5" />Bugun {m.todayFree} slot
                          </Badge>
                        )}
                        {(m?.languages || []).slice(0, 2).map((l) => (
                          <Badge key={l} variant="outline" className="text-[9px] gap-1 px-1.5 py-0">
                            <Languages className="w-2.5 h-2.5" />{l}
                          </Badge>
                        ))}
                      </div>
                      {d.match_reason && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">Sabab: {d.match_reason}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      {typeof d.match_score === "number" && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{d.match_score}% mos</Badge>
                      )}
                      {d.rating > 0 && (
                        <span className="flex items-center justify-end gap-0.5 text-xs">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{Number(d.rating).toFixed(1)}
                        </span>
                      )}
                    </div>

                  </Link>
                  );
                })}
                {filteredDoctors.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {activeFilters > 0
                      ? "Tanlangan mezonlarga mos shifokor yo'q — filtrlarni yumshating."
                      : "Bu hudud bo'yicha shifokor topilmadi — hududni o'zgartirib ko'ring."}
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
