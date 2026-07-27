import { useState } from "react";
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

import { Stethoscope, Star, Loader2, Sparkles, AlertTriangle, RotateCcw } from "lucide-react";

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
              <p className="text-sm font-bold mb-2">Mos shifokorlar ({result.doctors?.length || 0})</p>
              <div className="space-y-2">
                {(result.doctors || []).map((d: any) => (
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
                    </div>
                    {d.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs shrink-0">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{Number(d.rating).toFixed(1)}
                      </span>
                    )}
                  </Link>
                ))}
                {(result.doctors || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Bu hudud bo'yicha shifokor topilmadi — hududni o'zgartirib ko'ring.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
