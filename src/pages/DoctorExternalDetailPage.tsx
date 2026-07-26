import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Stethoscope, Star, MapPin, Award, Languages, ChevronLeft,
  Building2, Calendar, MessageCircle, Send, ShieldCheck,
} from "lucide-react";
import RecommendedAnalyses from "@/components/doctors/RecommendedAnalyses";
import NearbyDoctorsMap from "@/components/doctors/NearbyDoctorsMap";

interface Doctor {
  id: string; slug: string; name: string; rank: string | null;
  experience: number | null; photo_url: string | null;
  rating: number | null; reviews_count: number | null;
  primary_specialty: string | null; primary_region: string | null;
  clinic_id: string | null; bio: string | null;
  services: string[] | null; languages: string[] | null;
}

const DoctorExternalDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [doc, setDoc] = useState<Doctor | null>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      setLoading(true);
      const { data } = await supabase.from("doctors_external")
        .select("*").eq("slug", slug).maybeSingle();
      if (data) {
        setDoc(data as Doctor);
        if (data.clinic_id) {
          const { data: cl } = await supabase.from("registered_clinics")
            .select("id,name,address,phone,latitude,longitude,category")
            .eq("id", data.clinic_id).maybeSingle();
          setClinic(cl);
        }
        // related by specialty
        if (data.primary_specialty) {
          const { data: rel } = await supabase.from("doctors_external")
            .select("id,slug,name,photo_url,rating,primary_specialty,primary_region")
            .eq("primary_specialty", data.primary_specialty)
            .neq("id", data.id)
            .order("rating", { ascending: false })
            .limit(6);
          setRelated(rel || []);
        }
        // reviews (uses shared reviews table by doctor_id text)
        const { data: rv } = await supabase.from("reviews")
          .select("*, profiles:patient_id(full_name, avatar_url)")
          .eq("doctor_id", data.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(20);
        setReviews(rv || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  const handleReview = async () => {
    if (!user) { toast({ title: "Sharh yozish uchun tizimga kiring", variant: "destructive" }); return; }
    if (!doc || !reviewText.trim()) return;
    if (!doc.clinic_id) {
      toast({ title: "Sharh vaqtincha mavjud emas", description: "Bu shifokor hali klinikaga bog'lanmagan", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      doctor_id: doc.id, patient_id: user.id, clinic_id: doc.clinic_id,
      rating: reviewRating, comment: reviewText.trim(), is_approved: false,
    });
    setSubmitting(false);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "Sharh yuborildi", description: "Moderatsiyadan so'ng ko'rinadi" }); setReviewText(""); }
  };


  if (loading) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-64 rounded-2xl" />
      </div></div>
  );

  if (!doc) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <h1 className="text-2xl font-bold">Shifokor topilmadi</h1>
        <Link to="/doctors"><Button className="mt-4">Katalogga qaytish</Button></Link>
      </div></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${doc.name} — ${doc.primary_specialty} | Med1.uz`}
        description={`${doc.name}, ${doc.primary_specialty}${doc.experience ? `, ${doc.experience} yil tajriba` : ""}. ${doc.primary_region ?? ""}. Med1.uz shifokorlar katalogi.`}
        path={`/doctors/ext/${doc.slug}`}
      />
      <Header />

      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/doctors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ChevronLeft className="w-4 h-4" /> Barcha shifokorlar
          </Link>
          <div className="bg-card rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row gap-6">
            {doc.photo_url ? (
              <img src={doc.photo_url} alt={doc.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 shrink-0" />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-16 h-16 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{doc.name}</h1>
              <p className="text-primary font-semibold mt-1">{doc.primary_specialty}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {doc.rank && <Badge variant="outline"><Award className="w-3 h-3 mr-1" />{doc.rank}</Badge>}
                {doc.experience != null && doc.experience > 0 && (
                  <Badge variant="outline">{doc.experience} yil tajriba</Badge>
                )}
                {doc.primary_region && (
                  <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{doc.primary_region}</Badge>
                )}
                <Badge className="bg-medical-green/10 text-medical-green border-medical-green/20">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Med1.uz tasdiqlagan
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-4">
                {doc.rating != null && doc.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-lg">{Number(doc.rating).toFixed(1)}</span>
                    {doc.reviews_count != null && doc.reviews_count > 0 && (
                      <span className="text-sm text-muted-foreground">({doc.reviews_count} sharh)</span>
                    )}
                  </div>
                )}
                {doc.languages && doc.languages.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Languages className="w-4 h-4" /> {doc.languages.join(", ")}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                <Button className="gap-2" onClick={() => setBookOpen(true)}>
                  <Calendar className="w-4 h-4" /> Qabulga yozilish
                </Button>
                <DoctorConsultActions doctorId={doc.id} doctorName={doc.name} />
              </div>
              <DoctorBookingWizard
                open={bookOpen}
                onOpenChange={setBookOpen}
                doctorId={doc.id}
                doctorName={doc.name}
                doctorSlug={doc.slug}
                services={getServiceTemplates(doc.primary_specialty).map((t) => ({ ...t, id: null }))}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border p-6">
              <h2 className="font-heading font-bold text-lg mb-2">Shifokor haqida</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {doc.bio || `${doc.name} — ${doc.primary_specialty}${doc.experience ? `, ${doc.experience} yildan ortiq amaliy tajribaga ega` : ""}. ${doc.rank ? doc.rank + ". " : ""}${doc.primary_region ? doc.primary_region + " hududida faoliyat yuritadi. " : ""}Barcha kasalliklarni zamonaviy usullar bilan tashxislaydi va davolaydi.`}
              </p>
            </div>

            <DoctorServicesSection
              doctorId={doc.id}
              doctorName={doc.name}
              doctorSlug={doc.slug}
              specialty={doc.primary_specialty}
              extraServices={doc.services}
            />


            <RecommendedAnalyses specialty={doc.primary_specialty} />

            <div className="bg-card rounded-2xl border p-6">
              <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Yaqin atrofdagi shifokorlar
              </h2>
              <NearbyDoctorsMap specialty={doc.primary_specialty || undefined} height={340} />
            </div>


            <DoctorVerifiedReviews doctorId={doc.id} />

          </div>

          <div className="space-y-4">
            {clinic ? (
              <div className="bg-card rounded-2xl border p-5">
                <h3 className="font-heading font-bold flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" /> Klinika
                </h3>
                <Link to={`/clinic/${clinic.id}`} className="text-primary font-semibold text-sm hover:underline">
                  {clinic.name}
                </Link>
                {clinic.address && <p className="text-xs text-muted-foreground mt-1">{clinic.address}</p>}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border p-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                  <Building2 className="w-4 h-4" /> Klinika
                </div>
                Shifokor mustaqil qabul qiladi yoki klinika ma'lumoti keyinchalik qo'shiladi.
              </div>
            )}

            {related.length > 0 && (
              <div className="bg-card rounded-2xl border p-5">
                <h3 className="font-heading font-bold mb-3 text-sm">O'xshash shifokorlar</h3>
                <div className="space-y-3">
                  {related.map(r => (
                    <Link key={r.id} to={`/doctors/ext/${r.slug}`} className="flex items-center gap-3 hover:bg-muted/40 rounded-lg p-2 -m-2 transition">
                      {r.photo_url ? (
                        <img src={r.photo_url} alt={r.name} loading="lazy" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.primary_region}</p>
                      </div>
                      {r.rating > 0 && (
                        <div className="flex items-center gap-0.5 text-xs">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {Number(r.rating).toFixed(1)}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DoctorExternalDetailPage;
