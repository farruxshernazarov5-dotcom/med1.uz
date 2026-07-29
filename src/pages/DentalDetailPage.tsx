import { useParams, Link, Navigate } from "react-router-dom";
import { Smile, Star, MapPin, Phone, Clock, Globe, Mail, ArrowLeft, Building2 } from "lucide-react";
import SectionLayout from "@/components/SectionLayout";
import Breadcrumb from "@/components/Breadcrumb";
import ShareButton from "@/components/ShareButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DoctorRecommendations from "@/components/DoctorRecommendations";
import ClinicDoctorsSection from "@/components/doctors/ClinicDoctorsSection";
import { getDentalClinic, dentalClinics, DENTAL_DOCTOR_SPECIALTIES, cityToDoctorRegion } from "@/data/dentalClinics";

const DentalDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const clinic = slug ? getDentalClinic(slug) : undefined;

  if (!clinic) return <Navigate to="/dental" replace />;

  const nearby = dentalClinics
    .filter((c) => c.city === clinic.city && c.slug !== clinic.slug)
    .slice(0, 6);

  const mapQuery = encodeURIComponent(`${clinic.name} ${clinic.address}`);

  return (
    <SectionLayout
      title={clinic.name}
      subtitle={`${clinic.city} · Stomatologiya klinikasi`}
      icon={<Smile className="w-7 h-7 text-primary-foreground" />}
      bgVariant="waves"
    >
      <Breadcrumb items={[{ label: "Stomatologiya", href: "/dental" }, { label: clinic.name }]} />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link to="/dental">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Klinikalar</Button>
        </Link>
        <ShareButton title={`${clinic.name} — Med1.uz`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {clinic.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {clinic.rating}
                  <span className="text-muted-foreground font-normal">({clinic.reviewsCount} sharh)</span>
                </span>
              )}
              <Badge variant="secondary">{clinic.city}</Badge>
              {clinic.is24h && <Badge>24/7</Badge>}
            </div>
            {clinic.fullTitle && <p className="text-sm font-medium text-foreground mb-2">{clinic.fullTitle}</p>}
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{clinic.description}</p>
            <div className="flex flex-wrap gap-1 mt-4">
              {clinic.tags.map((t) => <Badge key={t} variant="outline" className="text-[11px]">{t}</Badge>)}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <iframe
              title={`${clinic.name} xaritada`}
              className="w-full h-72 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
            />
          </div>

          {/* Doctors internal integration */}
          <ClinicDoctorsSection clinicName={clinic.name} city={clinic.city} />

          <DoctorRecommendations
            specialty={DENTAL_DOCTOR_SPECIALTIES}
            region={cityToDoctorRegion[clinic.city]}
            limit={6}
            title="Ushbu yo'nalishdagi stomatologlar"
          />
        </div>

        {/* Contacts */}
        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-sm">
            <h3 className="font-heading font-semibold text-foreground">Aloqa ma'lumotlari</h3>
            <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> {clinic.address}</p>
            {clinic.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                <Phone className="w-4 h-4 text-primary" /> {p}
              </a>
            ))}
            {clinic.schedule && <p className="flex items-start gap-2 text-muted-foreground"><Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> {clinic.schedule}</p>}
            {clinic.websites.map((w) => (
              <a key={w} href={w} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 text-primary break-all">
                <Globe className="w-4 h-4 shrink-0" /> {w.replace(/^https?:\/\//, "")}
              </a>
            ))}
            {clinic.emails?.map((e) => (
              <a key={e} href={`mailto:${e}`} className="flex items-center gap-2 text-primary break-all">
                <Mail className="w-4 h-4 shrink-0" /> {e}
              </a>
            ))}
            <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">Manba: med1.uz</p>
          </div>

          {nearby.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Yaqin klinikalar
              </h3>
              <div className="space-y-2">
                {nearby.map((n) => (
                  <Link key={n.slug} to={`/dental/${n.slug}`} className="block rounded-lg px-3 py-2 bg-muted/40 hover:bg-muted transition">
                    <p className="text-sm font-medium text-foreground truncate">{n.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.address}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </SectionLayout>
  );
};

export default DentalDetailPage;
