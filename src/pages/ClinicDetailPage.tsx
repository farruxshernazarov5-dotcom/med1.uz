import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import SEO from "@/components/SEO";
import SectionLayout from "@/components/SectionLayout";
import Breadcrumb from "@/components/Breadcrumb";
import ShareButton from "@/components/ShareButton";
import { Building2, MapPin, Phone, Clock, Star, Globe, Stethoscope, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clinics } from "@/data/clinics";
import { externalClinics } from "@/data/clinicsExternal";
import clinicPrivateImg from "@/assets/clinic-private.jpg";
import clinicStateImg from "@/assets/clinic-state.jpg";
import clinicPolyclinicImg from "@/assets/clinic-polyclinic.jpg";
import clinicEmergencyImg from "@/assets/clinic-emergency.jpg";
import type { Clinic } from "@/data/clinics";

const getClinicImage = (type: Clinic["type"]) => {
  if (type === "xususiy") return clinicPrivateImg;
  if (type === "davlat") return clinicStateImg;
  if (type === "103") return clinicEmergencyImg;
  return clinicPolyclinicImg;
};

const ClinicDetailPage = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  
  const allClinics = useMemo(() => [...clinics, ...externalClinics], []);
  const clinic = useMemo(() => allClinics.find(c => c.id === clinicId), [clinicId, allClinics]);

  if (!clinic) {
    return (
      <SectionLayout title="Klinika topilmadi" subtitle="" icon={<Building2 className="w-7 h-7 text-primary-foreground" />}>
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-4">Klinika topilmadi</p>
          <Link to="/clinics">
            <Button><ArrowLeft className="w-4 h-4 mr-2" /> Klinikalarga qaytish</Button>
          </Link>
        </div>
      </SectionLayout>
    );
  }

  return (
    <SectionLayout
      title={clinic.name}
      subtitle={`${clinic.address} — ${clinic.city}`}
      icon={<Building2 className="w-7 h-7 text-primary-foreground" />}
    >
      <Breadcrumb items={[
        { label: "Klinikalar", href: "/clinics" },
        { label: clinic.name },
      ]} />

      {/* Hero image */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6">
        <img src={getClinicImage(clinic.type)} alt={clinic.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={clinic.type === "davlat" ? "default" : clinic.type === "xususiy" ? "secondary" : clinic.type === "103" ? "destructive" : "outline"}>
              {clinic.type === "davlat" ? "Davlat" : clinic.type === "xususiy" ? "Xususiy" : clinic.type === "103" ? "103 Tez yordam" : "Poliklinika"}
            </Badge>
            {clinic.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-amber-400 bg-background/80 px-2 py-1 rounded-full">
                <Star className="w-4 h-4 fill-current" /> {clinic.rating} ({clinic.reviewCount} sharh)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Share */}
      <ShareButton title={clinic.name} className="mb-6" />

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-heading font-bold text-lg text-foreground">Aloqa ma'lumotlari</h3>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-foreground">{clinic.address}</p>
                {clinic.landmark && <p className="text-xs text-muted-foreground italic">{clinic.landmark}</p>}
                <p className="text-xs text-muted-foreground">{clinic.district && `${clinic.district}, `}{clinic.city}, {clinic.region}</p>
              </div>
            </div>
            {clinic.phone.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <div className="space-y-1">
                  {clinic.phone.map(p => (
                    <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="block text-primary font-medium hover:underline">{p}</a>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{clinic.workingHours}</span>
            </div>
            {clinic.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-5 h-5 text-primary shrink-0" />
                <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                  {clinic.website}
                </a>
              </div>
            )}
            {/* Social Links */}
            {clinic.socialLinks && Object.entries(clinic.socialLinks).filter(([, v]) => v).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.entries(clinic.socialLinks)
                  .filter(([key, val]) => val && key !== "Website")
                  .map(([key, val]) => (
                    <a
                      key={key}
                      href={val!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full hover:bg-accent/80 transition-colors"
                    >
                      {key}
                    </a>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold text-lg text-foreground mb-3">Klinika haqida</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{clinic.description}</p>
          </CardContent>
        </Card>
      </div>

      {/* Specialties */}
      {clinic.specialties.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="font-heading font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" /> Yo'nalishlar
            </h3>
            <div className="flex flex-wrap gap-2">
              {clinic.specialties.map(s => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {clinic.services && clinic.services.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="font-heading font-bold text-lg text-foreground mb-3">Xizmatlar</h3>
            <div className="flex flex-wrap gap-2">
              {clinic.services.map(s => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      {clinic.amenities.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="font-heading font-bold text-lg text-foreground mb-3">Qulayliklar</h3>
            <div className="flex flex-wrap gap-2">
              {clinic.amenities.map(a => (
                <span key={a} className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full">{a}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Map */}
      {clinic.coordinates && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="font-heading font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Xaritada joylashuvi
            </h3>
            <div className="rounded-xl overflow-hidden border border-border">
              <iframe
                title={`${clinic.name} joylashuvi`}
                width="100%"
                height="350"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1500!2d${clinic.coordinates.lng}!3d${clinic.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1`}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                📍 {clinic.coordinates.lat.toFixed(6)}, {clinic.coordinates.lng.toFixed(6)}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.coordinates.lat},${clinic.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" /> Yo'nalish olish →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back */}
      <div className="flex justify-center">
        <Link to="/clinics">
          <Button variant="outline" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" /> Barcha klinikalarga qaytish
          </Button>
        </Link>
      </div>

      {/* Source */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        Ma'lumot manbasi: med1.uz — {new Date().getFullYear()}
      </p>

    </SectionLayout>
  );
};

export default ClinicDetailPage;
