import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Star, MessageSquare, Building2, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PatientReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [reviewsRes, appointmentsRes] = await Promise.all([
      supabase
        .from("reviews")
        .select("*, registered_clinics(name), doctors(full_name)")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("*, registered_clinics(name), doctors(full_name)")
        .eq("patient_id", user.id)
        .eq("status", "completed"),
    ]);
    setReviews(reviewsRes.data || []);
    // Filter out appointments that already have reviews
    const reviewedAppIds = new Set((reviewsRes.data || []).map((r: any) => r.appointment_id));
    setCompletedAppointments((appointmentsRes.data || []).filter((a: any) => !reviewedAppIds.has(a.id)));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const submitReview = async () => {
    if (!user || !selectedAppointment) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      patient_id: user.id,
      clinic_id: selectedAppointment.clinic_id,
      doctor_id: selectedAppointment.doctor_id,
      appointment_id: selectedAppointment.id,
      rating,
      comment,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sharh yuborildi ✅", description: "Admin tasdiqlashidan keyin ko'rinadi" });
      setShowForm(false);
      setComment("");
      setRating(5);
      setSelectedAppointment(null);
      fetchData();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Sharhlarim</h2>
        {completedAppointments.length > 0 && !showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-hero-gradient text-primary-foreground border-0">
            <MessageSquare className="w-4 h-4 mr-1" /> Sharh yozish
          </Button>
        )}
      </div>

      {/* New review form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Yangi sharh</h3>

          {/* Select appointment */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Qabul tanlang:</p>
            <div className="space-y-2">
              {completedAppointments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAppointment(a)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-colors",
                    selectedAppointment?.id === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="font-medium text-foreground text-sm">{a.registered_clinics?.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {a.doctors?.full_name && `Dr. ${a.doctors.full_name} • `}{a.appointment_date}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedAppointment && (
            <>
              {/* Rating */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Baho:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={cn("w-7 h-7 transition-colors", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Sharh matni:</p>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Xizmat sifati, shifokor munosabati..." rows={3} />
              </div>

              <div className="flex gap-2">
                <Button onClick={submitReview} disabled={submitting} className="bg-hero-gradient text-primary-foreground border-0">
                  {submitting ? "Yuborilmoqda..." : "Yuborish"}
                </Button>
                <Button variant="ghost" onClick={() => { setShowForm(false); setSelectedAppointment(null); }}>Bekor qilish</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Existing reviews */}
      {reviews.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Hali sharhlar yo'q</h3>
          <p className="text-muted-foreground text-sm">Qabuldan o'tganingizdan keyin sharh qoldirishingiz mumkin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm">{r.registered_clinics?.name}</span>
                  </div>
                  {r.doctors?.full_name && <p className="text-xs text-muted-foreground">Dr. {r.doctors.full_name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("w-3.5 h-3.5", s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />
                    ))}
                  </div>
                  {r.is_approved ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-600"><CheckCircle className="w-3 h-3" /> Tasdiqlangan</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> Kutilmoqda</span>
                  )}
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(r.created_at).toLocaleDateString("uz-UZ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientReviews;
