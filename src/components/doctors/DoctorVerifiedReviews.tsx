import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, ShieldCheck, Send, Loader2 } from "lucide-react";

interface Props {
  doctorId: string;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  patient_id: string;
}

export default function DoctorVerifiedReviews({ doctorId }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [eligible, setEligible] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("doctor_ext_reviews")
      .select("id,rating,comment,created_at,patient_id")
      .eq("doctor_id", doctorId)
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .limit(30);
    setReviews((data || []) as ReviewRow[]);
  };

  useEffect(() => { load(); }, [doctorId]);

  useEffect(() => {
    if (!user) { setEligible([]); return; }
    (async () => {
      const { data: appts } = await supabase
        .from("doctor_ext_appointments")
        .select("id,service_name,appointment_date")
        .eq("doctor_id", doctorId)
        .eq("patient_id", user.id)
        .eq("status", "completed");
      const ids = (appts || []).map((a) => a.id);
      if (ids.length === 0) { setEligible([]); return; }
      const { data: done } = await supabase
        .from("doctor_ext_reviews")
        .select("appointment_id")
        .in("appointment_id", ids);
      const used = new Set((done || []).map((d: any) => d.appointment_id));
      setEligible((appts || []).filter((a) => !used.has(a.id)));
    })();
  }, [user, doctorId, reviews.length]);

  const submit = async () => {
    if (!user || eligible.length === 0) return;
    setSaving(true);
    const { error } = await supabase.from("doctor_ext_reviews").insert({
      doctor_id: doctorId,
      patient_id: user.id,
      appointment_id: eligible[0].id,
      rating,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) { toast({ title: "Sharh saqlanmadi", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Rahmat!", description: "Tasdiqlangan sharhingiz e'lon qilindi" });
    setComment("");
    load();
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="bg-card rounded-2xl border p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading font-bold text-lg">Tasdiqlangan sharhlar ({reviews.length})</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold">{avg.toFixed(1)}</span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-4">
        <ShieldCheck className="w-3 h-3 text-medical-green" /> Faqat haqiqiy qabuldan o'tgan bemorlar sharh qoldiradi.
      </p>

      {user && eligible.length > 0 && (
        <div className="space-y-3 mb-6 p-4 bg-muted/40 rounded-xl">
          <p className="text-xs font-semibold">
            {eligible[0].appointment_date} — {eligible[0].service_name} qabuli uchun sharh qoldiring
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} yulduz`}>
                <Star className={`w-5 h-5 ${n <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Qabul qanday o'tdi?" />
          <Button size="sm" onClick={submit} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Sharh yuborish
          </Button>
        </div>
      )}

      {user && eligible.length === 0 && (
        <p className="text-xs text-muted-foreground mb-4">
          Sharh qoldirish uchun avval shu shifokorda qabuldan o'tishingiz kerak.
        </p>
      )}
      {!user && (
        <p className="text-xs text-muted-foreground mb-4">
          Sharhlarni ko'rish ochiq. Yozish uchun <Link to="/auth" className="text-primary underline">tizimga kiring</Link>.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hozircha tasdiqlangan sharhlar yo'q.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b pb-3 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <Badge variant="outline" className="text-[10px] text-medical-green border-medical-green/30">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Tasdiqlangan bemor
                </Badge>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {new Date(r.created_at).toLocaleDateString("uz-UZ")}
                </span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
