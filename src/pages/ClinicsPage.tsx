import { useState, useMemo } from "react";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import SectionLayout from "@/components/SectionLayout";
import { Building2, Search, MapPin, Phone, Star, Clock, Shield, ChevronDown, ChevronUp, UserPlus, MessageSquare, Filter, X, Stethoscope, Award, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  clinics,
  regions,
  clinicSpecialties,
  clinicLogos,
  clinicMedicalTerms,
  type Clinic,
} from "@/data/clinics";
import { externalClinics } from "@/data/clinicsExternal";
import ShareButton from "@/components/ShareButton";
import clinicPrivateImg from "@/assets/clinic-private.jpg";
import clinicStateImg from "@/assets/clinic-state.jpg";
import clinicPolyclinicImg from "@/assets/clinic-polyclinic.jpg";
import doctorMaleImg from "@/assets/doctor-male.jpg";
import doctorFemaleImg from "@/assets/doctor-female.jpg";
import clinicEmergencyImg from "@/assets/clinic-emergency.jpg";

const getClinicImage = (type: Clinic["type"]) => {
  if (type === "xususiy") return clinicPrivateImg;
  if (type === "davlat") return clinicStateImg;
  if (type === "103") return clinicEmergencyImg;
  return clinicPolyclinicImg;
};

const getSpecialistPhoto = (name: string) => {
  return name.includes("va") || name.includes("ova") || name.includes("ina") || name.includes("ira") || name.includes("iza") || name.includes("oira")
    ? doctorFemaleImg
    : doctorMaleImg;
};

// ==================== LOGO TICKER ====================
const LogoTicker = () => (
  <div className="overflow-hidden py-4 bg-muted/30 rounded-2xl mb-8">
    <div className="flex animate-scroll gap-8 w-max">
      {[...clinicLogos, ...clinicLogos, ...clinicLogos].map((logo, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-20 h-20 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center"
        >
          <div className="text-center">
            <span className="text-lg font-bold text-primary">{logo.abbr}</span>
            <p className="text-[8px] text-muted-foreground leading-tight mt-0.5 px-1">{logo.name.slice(0, 16)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ==================== MEDICAL TERMS BANNER ====================
const MedTermsBanner = ({ terms }: { terms: typeof clinicMedicalTerms }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-8 bg-accent/30 border border-accent rounded-2xl p-4">
      <button onClick={() => setShow(!show)} className="flex items-center gap-2 w-full text-left">
        <Stethoscope className="w-5 h-5 text-primary" />
        <span className="font-heading font-semibold text-foreground">Tibbiy iboralar — Klinikalar bo'limi</span>
        {show ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>
      {show && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {terms.map((t) => (
            <div key={t.term} className="bg-card rounded-xl p-3 border border-border">
              <p className="font-semibold text-sm text-primary">{t.term}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.meaning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== SPECIALIST CARD ====================
const SpecialistCard = ({ specialist }: { specialist: Clinic["specialists"][0] }) => (
  <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
    <img src={getSpecialistPhoto(specialist.name)} alt={specialist.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm text-foreground truncate">{specialist.name}</p>
      <p className="text-xs text-muted-foreground">{specialist.specialty}</p>
      <div className="flex items-center gap-2 mt-1">
        <Badge variant="secondary" className="text-[10px]">{specialist.experience} yil tajriba</Badge>
        <span className="flex items-center gap-0.5 text-xs text-amber-500">
          <Star className="w-3 h-3 fill-current" /> {specialist.rating}
        </span>
      </div>
    </div>
  </div>
);

// ==================== REVIEW CARD ====================
const ReviewCard = ({ review }: { review: Clinic["reviews"][0] }) => (
  <div className="bg-muted/30 rounded-xl p-3 border border-border">
    <div className="flex items-center justify-between mb-1">
      <span className="font-semibold text-sm text-foreground">{review.author}</span>
      <span className="text-xs text-muted-foreground">{review.date}</span>
    </div>
    <div className="flex gap-0.5 mb-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
      ))}
    </div>
    <p className="text-xs text-muted-foreground">{review.text}</p>
  </div>
);

// ==================== CLINIC CARD ====================
const ClinicCard = ({ clinic }: { clinic: Clinic }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Clinic Image - links to detail */}
      <Link to={`/clinics/${clinic.id}`} className="block h-40 overflow-hidden">
        <img src={getClinicImage(clinic.type)} alt={clinic.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
      </Link>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 -mt-10 relative z-10 shadow-md bg-card overflow-hidden">
            {clinic.logoUrl ? (
              <img src={clinic.logoUrl} alt={clinic.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className="text-sm font-bold text-primary">{clinic.logo}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/clinics/${clinic.id}`} className="hover:text-primary transition-colors">
              <CardTitle className="text-base leading-tight">{clinic.name}</CardTitle>
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={clinic.type === "davlat" ? "default" : clinic.type === "xususiy" ? "secondary" : clinic.type === "103" ? "destructive" : "outline"} className="text-[10px]">
                {clinic.type === "davlat" ? "Davlat" : clinic.type === "xususiy" ? "Xususiy" : clinic.type === "103" ? "103 Tez yordam" : "Poliklinika"}
              </Badge>
              <span className="flex items-center gap-0.5 text-xs text-amber-500">
                <Star className="w-3 h-3 fill-current" /> {clinic.rating}
              </span>
              <span className="text-xs text-muted-foreground">({clinic.reviewCount} sharh)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p>{clinic.address}</p>
            <p className="text-xs italic">{clinic.landmark}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-primary font-medium">{clinic.phone[0]}</span>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{clinic.workingHours}</span>
        </div>

        {/* Direction Tags */}
        {clinic.directionTags && clinic.directionTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clinic.directionTags.slice(0, 3).map((t) => (
              <Badge key={t} variant="default" className="text-[10px]">{t}</Badge>
            ))}
            {clinic.directionTags.length > 3 && (
              <Badge variant="default" className="text-[10px]">+{clinic.directionTags.length - 3}</Badge>
            )}
          </div>
        )}

        {/* Specialties */}
        <div className="flex flex-wrap gap-1">
          {clinic.specialties.slice(0, 4).map((s) => (
            <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
          ))}
          {clinic.specialties.length > 4 && (
            <Badge variant="outline" className="text-[10px]">+{clinic.specialties.length - 4}</Badge>
          )}
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1">
          {clinic.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-[10px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full">{a}</span>
          ))}
          {clinic.amenities.length > 3 && (
            <span className="text-[10px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full">+{clinic.amenities.length - 3}</span>
          )}
        </div>

        {/* Expand */}
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Yopish" : "Batafsil"} {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>

        {expanded && (
          <div className="space-y-4 animate-fade-in">
            {/* Description */}
            <p className="text-sm text-muted-foreground">{clinic.description}</p>

            {/* Google Map */}
            {clinic.coordinates && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" /> Xaritada
                </h4>
                <div className="rounded-xl overflow-hidden border border-border">
                  <iframe
                    title={`${clinic.name} joylashuvi`}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1500!2d${clinic.coordinates.lng}!3d${clinic.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1`}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.coordinates.lat},${clinic.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-2"
                >
                  <MapPin className="w-3 h-3" /> Yo'nalish olish →
                </a>
              </div>
            )}

            {/* Website */}
            {clinic.website && (
              <div>
                <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                  🌐 Veb-saytga o'tish
                </a>
              </div>
            )}

            {/* Services */}
            {clinic.services && clinic.services.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Xizmatlar</h4>
                <div className="flex flex-wrap gap-1">
                  {clinic.services.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* All specialties */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Barcha yo'nalishlar</h4>
              <div className="flex flex-wrap gap-1">
                {clinic.specialties.map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            </div>

            {/* All amenities */}
            {clinic.amenities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Qulayliklar</h4>
                <div className="flex flex-wrap gap-1">
                  {clinic.amenities.map((a) => (
                    <span key={a} className="text-[10px] bg-accent text-accent-foreground px-2 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* All phones */}
            {clinic.phone.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Telefon raqamlari</h4>
                {clinic.phone.map((p) => (
                  <p key={p} className="text-sm text-primary font-medium">{p}</p>
                ))}
              </div>
            )}

            {/* Specialists */}
            {clinic.specialists.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                  <Award className="w-4 h-4" /> Mutaxassislar
                </h4>
                <div className="space-y-2">
                  {clinic.specialists.map((sp) => (
                    <SpecialistCard key={sp.id} specialist={sp} />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {clinic.reviews.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> Sharhlar
                </h4>
                <div className="space-y-2">
                  {clinic.reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </div>
            )}

            {/* Detail page link */}
            <Link to={`/clinics/${clinic.id}`} className="block">
              <Button variant="default" size="sm" className="w-full">
                To'liq ma'lumot →
              </Button>
            </Link>

            {/* Review Form Toggle */}
            <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)} className="w-full">
              <MessageSquare className="w-4 h-4 mr-1" /> Sharh qoldirish
            </Button>

            {showReviewForm && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-xl animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Ismingiz</Label>
                    <Input placeholder="Ism" className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Baho</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-5 h-5 text-amber-400 cursor-pointer hover:fill-amber-400 transition-colors" />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Sharh matni</Label>
                  <Textarea placeholder="Tajribangiz haqida yozing..." className="text-sm" rows={3} />
                </div>
                <Button size="sm" className="w-full">Yuborish</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== ADD CLINIC FORM ====================
const AddClinicForm = () => {
  return (
    <div className="mb-8">
      <Link to="/clinic-register">
        <Button variant="outline" className="w-full md:w-auto">
          <UserPlus className="w-4 h-4 mr-2" /> Klinika qo'shish / Ro'yxatdan o'tkazish
        </Button>
      </Link>
    </div>
  );
};

// ==================== MAIN PAGE ====================
const ClinicsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [groupBySpecialty, setGroupBySpecialty] = useState(false);
  const allClinics = useMemo(() => [...clinics, ...externalClinics], []);

  // Collect unique direction tags
  const directionTags = useMemo(() => {
    const tags = new Set<string>();
    allClinics.forEach(c => c.directionTags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b, "uz"));
  }, [allClinics]);

  const filteredClinics = useMemo(() => {
    return allClinics.filter((c) => {
      // Tab filter
      if (activeTab === "davlat" && c.type !== "davlat") return false;
      if (activeTab === "xususiy" && c.type !== "xususiy") return false;
      if (activeTab === "poliklinika" && c.type !== "poliklinika") return false;
      if (activeTab === "103" && c.type !== "103") return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.specialties.some((s) => s.toLowerCase().includes(q)) ||
          c.city.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          (c.directionTags || []).some(t => t.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Region
      if (selectedRegion && c.region !== selectedRegion) return false;

      // Specialty
      if (selectedSpecialty && !c.specialties.includes(selectedSpecialty)) return false;

      // Direction tag
      if (selectedDirection && !(c.directionTags || []).includes(selectedDirection)) return false;

      return true;
    });
  }, [search, selectedRegion, selectedSpecialty, selectedDirection, activeTab]);

  const clearFilters = () => {
    setSearch("");
    setSelectedRegion("");
    setSelectedSpecialty("");
    setSelectedDirection("");
  };

  const hasFilters = search || selectedRegion || selectedSpecialty || selectedDirection;

  return (
    <>
      <SEO
        title="Klinikalar — O'zbekiston tibbiy markazlari katalogi | Med1.uz"
        description="O'zbekistondagi davlat va xususiy klinikalar, poliklinikalar va shoshilinch yordam markazlari. Manzil, mutaxassisliklar va kontaktlar bo'yicha qidiruv."
        path="/clinics"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Klinikalar katalogi",
          description: "O'zbekistondagi tibbiy markazlar to'plami",
          url: "https://med1.uz/clinics",
          about: { "@type": "MedicalOrganization", name: "Med1.uz" },
        }}
      />
    <SectionLayout
      title="Klinikalar bo'limi"
      subtitle="O'zbekistondagi barcha klinikalar — davlat, xususiy, poliklinikalar"
      icon={<Building2 className="w-7 h-7 text-primary-foreground" />}
    >
      {/* Medical Terms */}
      <MedTermsBanner terms={clinicMedicalTerms} />

      {/* Logo Ticker Top */}
      <LogoTicker />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Jami klinikalar", value: allClinics.length, icon: Building2 },
          { label: "Yo'nalishlar", value: `${clinicSpecialties.length}+`, icon: Stethoscope },
          { label: "Viloyatlar", value: regions.length, icon: MapPin },
          { label: "Mutaxassislar", value: allClinics.reduce((a, c) => a + c.specialists.length, 0) + "+", icon: Users },
        ].map((s) => (
          <Card key={s.label} className="text-center p-4">
            <s.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Add Clinic */}
      <AddClinicForm />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="bg-muted w-full md:w-auto">
          <TabsTrigger value="all">Barchasi</TabsTrigger>
          <TabsTrigger value="davlat">Davlat</TabsTrigger>
          <TabsTrigger value="xususiy">Xususiy</TabsTrigger>
          <TabsTrigger value="poliklinika">Poliklinikalar</TabsTrigger>
          <TabsTrigger value="103">103 Markazlari</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Klinika, yo'nalish, shahar qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" /> Filtr ({hasFilters ? "Faol" : "O'chirish"})
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" /> Tozalash
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted/30 rounded-2xl border border-border animate-fade-in">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Viloyat bo'yicha</Label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Barcha viloyatlar</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Yo'nalish bo'yicha ({clinicSpecialties.length}+ ta)</Label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Barcha yo'nalishlar</option>
              {clinicSpecialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Tibbiy yo'nalish ({directionTags.length} ta)</Label>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Barcha yo'nalishlar</option>
              {directionTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredClinics.length} ta klinika topildi
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setGroupBySpecialty(!groupBySpecialty)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              groupBySpecialty ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Stethoscope className="w-3 h-3 inline mr-1" />
            {groupBySpecialty ? "Guruh: Yo'nalish" : "Yo'nalish bo'yicha guruhlash"}
          </button>
        </div>
      </div>

      {/* Clinics Grid */}
      {groupBySpecialty ? (
        <div className="space-y-8">
          {(() => {
            const groups: Record<string, typeof filteredClinics> = {};
            filteredClinics.forEach((c) => {
              const tags = c.directionTags?.length ? c.directionTags : (c.specialties.length ? [c.specialties[0]] : ["Boshqa"]);
              tags.forEach((tag) => {
                if (!groups[tag]) groups[tag] = [];
                groups[tag].push(c);
              });
            });
            return Object.entries(groups)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([tag, tagClinics]) => (
                <div key={tag}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-tech-electric flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground">{tag}</h3>
                    <Badge variant="secondary" className="text-xs">{tagClinics.length} ta</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tagClinics.slice(0, 6).map((clinic) => (
                      <ClinicCard key={clinic.id} clinic={clinic} />
                    ))}
                  </div>
                  {tagClinics.length > 6 && (
                    <p className="text-sm text-muted-foreground mt-3">va yana {tagClinics.length - 6} ta...</p>
                  )}
                </div>
              ));
          })()}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      )}

      {filteredClinics.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">Klinika topilmadi</p>
          <p className="text-muted-foreground">Qidiruv so'zini o'zgartiring yoki filtrlarni tozalang.</p>
        </div>
      )}

      {/* Logo Ticker Bottom */}
      <div className="mt-12">
        <LogoTicker />
      </div>
    </SectionLayout>
    </>
  );
};

export default ClinicsPage;
