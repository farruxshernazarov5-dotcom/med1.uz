import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Star, MapPin, Clock, Phone, Mail, Globe,
  Award, Calendar, Building2, MessageCircle, ChevronLeft,
  Send, GraduationCap, Languages, Instagram, Facebook, Youtube
} from "lucide-react";

const DAYS = [
  { key: "mon", label: "Dushanba" },
  { key: "tue", label: "Seshanba" },
  { key: "wed", label: "Chorshanba" },
  { key: "thu", label: "Payshanba" },
  { key: "fri", label: "Juma" },
  { key: "sat", label: "Shanba" },
  { key: "sun", label: "Yakshanba" },
];

const DoctorProfilePage = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!doctorId) return;
      const { data: doc } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", doctorId)
        .single();

      if (doc) {
        setDoctor(doc);
        if (doc.clinic_id) {
          const { data: cl } = await supabase
            .from("registered_clinics")
            .select("*")
            .eq("id", doc.clinic_id)
            .single();
          setClinic(cl);
        }
        // Fetch reviews
        const { data: revs } = await supabase
          .from("reviews")
          .select("*, profiles:patient_id(full_name, avatar_url)")
          .eq("doctor_id", doctorId)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(20);
        setReviews(revs || []);
      }
      setLoading(false);
    };
    fetch();
  }, [doctorId]);

  const handleSubmitReview = async () => {
    if (!user || !doctor) return;
    if (!reviewText.trim()) {
      toast({ title: "Sharh matnini kiriting", variant: "destructive" });
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      doctor_id: doctor.id,
      clinic_id: doctor.clinic_id || doctor.id,
      patient_id: user.id,
      rating: reviewRating,
      comment: reviewText.trim(),
    });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Sharh yuborildi!", description: "Moderatsiyadan o'tgach ko'rinadi" });
      setReviewText("");
      setReviewRating(5);
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 max-w-4xl py-12">
          <Skeleton className="h-64 rounded-2xl mb-6" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-24">
          <Stethoscope className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl font-bold text-foreground">Shifokor topilmadi</p>
          <Link to="/doctors">
            <Button variant="outline" className="mt-4">
              <ChevronLeft className="w-4 h-4 mr-1" /> Shifokorlarga qaytish
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const schedule = (doctor.schedule || {}) as Record<string, { start: string; end: string; active: boolean }>;
  const activeDays = DAYS.filter((d) => schedule[d.key]?.active);
  const certs = (doctor.certificates as string[]) || [];
  const langs = (doctor.languages as string[]) || [];
  const socialLinks = (doctor.social_links || {}) as Record<string, string>;
  const hasSocials = Object.values(socialLinks).some((v) => v?.trim());
  const mapQuery = [doctor.address, doctor.city, doctor.region].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back */}
          <Link to="/doctors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" /> Barcha shifokorlar
          </Link>

          {/* Profile Card */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {doctor.photo_url ? (
                  <img loading="lazy" decoding="async"
                    src={doctor.photo_url}
                    alt={doctor.full_name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-card shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg">
                    <Stethoscope className="w-12 h-12 text-primary-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                    {doctor.full_name}
                  </h1>
                  <p className="text-lg text-primary font-semibold mt-1">{doctor.specialty}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {doctor.experience_years > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" /> {doctor.experience_years} yil tajriba
                      </Badge>
                    )}
                    {doctor.avg_rating > 0 && (
                      <Badge className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        <Star className="w-3 h-3 fill-current" />
                        {Number(doctor.avg_rating).toFixed(1)} ({doctor.review_count} sharh)
                      </Badge>
                    )}
                    {doctor.online_consultation && (
                      <Badge className="gap-1 bg-medical-green/10 text-medical-green border-medical-green/20">
                        <Globe className="w-3 h-3" /> Onlayn konsultatsiya
                      </Badge>
                    )}
                  </div>
                  {doctor.consultation_price > 0 && (
                    <p className="text-xl font-bold text-primary mt-3">
                      {Number(doctor.consultation_price).toLocaleString()} so'm
                      <span className="text-sm font-normal text-muted-foreground ml-1">/ konsultatsiya</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Bio */}
              {doctor.bio && (
                <div>
                  <h2 className="font-heading font-bold text-foreground mb-2">Shifokor haqida</h2>
                  <p className="text-muted-foreground leading-relaxed">{doctor.bio}</p>
                </div>
              )}

              {/* Education */}
              {doctor.education && (
                <div>
                  <h2 className="font-heading font-bold text-foreground mb-2 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" /> Ta'lim
                  </h2>
                  <p className="text-muted-foreground">{doctor.education}</p>
                </div>
              )}

              {/* Languages */}
              {langs.length > 0 && (
                <div>
                  <h2 className="font-heading font-bold text-foreground mb-2 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-primary" /> Tillar
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {langs.map((l, i) => (
                      <Badge key={i} variant="outline">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificates */}
              {certs.length > 0 && (
                <div>
                  <h2 className="font-heading font-bold text-foreground mb-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" /> Sertifikatlar
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {certs.map((c, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        <Award className="w-3 h-3" /> {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule */}
              {activeDays.length > 0 && (
                <div>
                  <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Qabul jadvali
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeDays.map((d) => {
                      const s = schedule[d.key];
                      return (
                        <div key={d.key} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border">
                          <span className="font-medium text-sm text-foreground">{d.label}</span>
                          <span className="text-sm text-primary font-semibold">{s.start} — {s.end}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctor.phone && (
                  <a href={`tel:${doctor.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border hover:border-primary/30 transition-colors">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground">{doctor.phone}</span>
                  </a>
                )}
                {doctor.email && (
                  <a href={`mailto:${doctor.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border hover:border-primary/30 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground">{doctor.email}</span>
                  </a>
                )}
                {doctor.address && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{doctor.address}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {hasSocials && (
                <div>
                  <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" /> Ijtimoiy tarmoqlar
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.telegram && (
                      <a href={socialLinks.telegram.startsWith("http") ? socialLinks.telegram : `https://t.me/${socialLinks.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(200,80%,50%)]/10 border border-[hsl(200,80%,50%)]/20 hover:border-[hsl(200,80%,50%)]/40 transition-colors">
                        <Send className="w-4 h-4 text-[hsl(200,80%,50%)]" />
                        <span className="text-sm font-medium text-foreground">Telegram</span>
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram.startsWith("http") ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-colors">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span className="text-sm font-medium text-foreground">Instagram</span>
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook.startsWith("http") ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/10 border border-blue-600/20 hover:border-blue-600/40 transition-colors">
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-foreground">Facebook</span>
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a href={socialLinks.youtube.startsWith("http") ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-foreground">YouTube</span>
                      </a>
                    )}
                    {socialLinks.website && (
                      <a href={socialLinks.website.startsWith("http") ? socialLinks.website : `https://${socialLinks.website}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Veb-sayt</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Google Maps */}
              {mapQuery && (
                <div>
                  <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Joylashuv
                  </h2>
                  <div className="rounded-xl overflow-hidden border border-border h-[220px] bg-muted/30">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mapQuery)}&zoom=14`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Shifokor joylashuvi"
                    />
                  </div>
                </div>
              )}

              {/* Clinic */}
              {clinic && (
                <div>
                  <h2 className="font-heading font-bold text-foreground mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> Ish joyi
                  </h2>
                  <Link
                    to={`/clinics/${clinic.id}`}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    {clinic.logo_url ? (
                      <img loading="lazy" decoding="async" src={clinic.logo_url} alt={clinic.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{clinic.name}</p>
                      {clinic.address && <p className="text-xs text-muted-foreground">{clinic.address}</p>}
                    </div>
                  </Link>
                </div>
              )}

              {/* Booking CTA */}
              {clinic && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to={`/booking?clinic=${clinic.id}&doctor=${doctor.id}`} className="flex-1">
                    <Button className="w-full bg-hero-gradient text-primary-foreground border-0 h-12 text-base font-semibold">
                      <Calendar className="w-5 h-5 mr-2" /> Qabulga yozilish
                    </Button>
                  </Link>
                  {doctor.phone && (
                    <a href={`tel:${doctor.phone}`}>
                      <Button variant="outline" className="h-12">
                        <Phone className="w-5 h-5 mr-2" /> Qo'ng'iroq qilish
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 opacity-0 animate-fade-up" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
            <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Bemorlar sharhlari
              {reviews.length > 0 && <Badge variant="secondary">{reviews.length}</Badge>}
            </h2>

            {/* Write review */}
            {user ? (
              <div className="mb-6 p-4 rounded-xl bg-accent/20 border border-border space-y-3">
                <p className="text-sm font-medium text-foreground">Sharh qoldiring</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => setReviewRating(r)}>
                      <Star
                        className={cn("w-6 h-6 transition-colors", r <= reviewRating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Shifokor haqida fikringizni yozing..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleSubmitReview} disabled={submittingReview} className="bg-hero-gradient text-primary-foreground border-0">
                  <Send className="w-4 h-4 mr-2" /> {submittingReview ? "Yuborilmoqda..." : "Yuborish"}
                </Button>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-xl bg-accent/20 border border-border text-center">
                <p className="text-sm text-muted-foreground">
                  Sharh qoldirish uchun{" "}
                  <Link to="/auth" className="text-primary font-semibold hover:underline">
                    tizimga kiring
                  </Link>
                </p>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Hozircha sharhlar yo'q</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-background border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(rev.profiles as any)?.full_name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(rev.profiles as any)?.full_name || "Anonim"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(rev.created_at).toLocaleDateString("uz-UZ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn("w-3.5 h-3.5", i < rev.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30")}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.comment && <p className="text-sm text-muted-foreground">{rev.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DoctorProfilePage;
