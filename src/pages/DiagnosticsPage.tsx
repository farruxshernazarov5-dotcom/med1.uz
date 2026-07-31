import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SectionLayout from "@/components/SectionLayout";
import { Activity, Search, MapPin, Phone, Star, Clock, ChevronDown, ChevronUp, UserPlus, MessageSquare, Filter, X, Stethoscope, Award, Users, DollarSign, Info, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  diagnosticCenters,
  diagnosticTypes,
  diagnosticCategories,
  diagnosticLogos,
  diagnosticMedicalTerms,
  diagnosticSpecialties,
  type DiagnosticCenter,
  type DiagnosticType,
} from "@/data/diagnostics";
import { regions } from "@/data/clinics";
import diagMrtImg from "@/assets/diag-mrt.webp";
import diagUziImg from "@/assets/diag-uzi.webp";
import diagLabImg from "@/assets/diag-lab.webp";
import diagKtImg from "@/assets/diag-kt.webp";
import diagRentgenImg from "@/assets/diag-rentgen.webp";
import diagEndoscopyImg from "@/assets/diag-endoscopy.webp";
import diagEkgImg from "@/assets/diag-ekg.webp";
import diagCenterImg from "@/assets/diag-center.webp";
import doctorMaleImg from "@/assets/doctor-male.webp";
import doctorFemaleImg from "@/assets/doctor-female.webp";

const getDiagImage = (types: string[]) => {
  if (types.includes("MRT")) return diagMrtImg;
  if (types.includes("KT")) return diagKtImg;
  if (types.includes("Endoskopiya")) return diagEndoscopyImg;
  if (types.includes("UZI")) return diagUziImg;
  return diagCenterImg;
};

const getDiagTypeImage = (id: string) => {
  const map: Record<string, string> = {
    mrt: diagMrtImg, kt: diagKtImg, rentgen: diagRentgenImg,
    uzi: diagUziImg, dopplerografiya: diagUziImg, exokardiografiya: diagUziImg,
    "qon-tahlili": diagLabImg, "gormon-tahlili": diagLabImg, pcr: diagLabImg,
    ekg: diagEkgImg, eeg: diagEkgImg,
    gastroskopiya: diagEndoscopyImg, kolonoskopiya: diagEndoscopyImg,
  };
  return map[id] || diagCenterImg;
};

const getSpecPhoto = (name: string) =>
  name.includes("va") || name.includes("ova") || name.includes("ira") || name.includes("ora")
    ? doctorFemaleImg : doctorMaleImg;

// ==================== LOGO TICKER ====================
const LogoTicker = () => (
  <div className="overflow-hidden py-4 bg-muted/30 rounded-2xl mb-8">
    <div className="flex animate-scroll gap-8 w-max">
      {[...diagnosticLogos, ...diagnosticLogos, ...diagnosticLogos].map((logo, i) => (
        <div key={i} className="flex-shrink-0 w-20 h-20 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center">
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
const MedTermsBanner = () => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-8 bg-accent/30 border border-accent rounded-2xl p-4">
      <button onClick={() => setShow(!show)} className="flex items-center gap-2 w-full text-left">
        <Stethoscope className="w-5 h-5 text-primary" />
        <span className="font-heading font-semibold text-foreground">Tibbiy iboralar — Diagnostika bo'limi</span>
        {show ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>
      {show && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {diagnosticMedicalTerms.map((t) => (
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

// ==================== DIAGNOSTIC TYPE DETAIL MODAL ====================
const DiagTypeDetail = ({ type, onClose }: { type: DiagnosticType; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="h-48 overflow-hidden rounded-t-2xl">
        <img loading="lazy" decoding="async" src={getDiagTypeImage(type.id)} alt={type.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">{type.name}</h2>
            <Badge variant="secondary" className="mt-1">{diagnosticCategories.find(c => c.id === type.category)?.label}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{type.fullDescription}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Davomiyligi</p>
            <p className="text-sm text-primary font-medium">{type.duration}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Narx oralig'i</p>
            <p className="text-sm text-primary font-medium">{type.priceRange}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><Info className="w-4 h-4" /> Tayyorgarlik</h3>
          <ul className="space-y-1">
            {type.preparations.map((p, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-medical-green flex-shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-medical-orange" /> Qarshi ko'rsatmalar</h3>
          <ul className="space-y-1">
            {type.contraindications.map((c, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <X className="w-3 h-3 mt-0.5 text-medical-red flex-shrink-0" /> {c}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-medical-green" /> Afzalliklari</h3>
          <div className="flex flex-wrap gap-1">
            {type.advantages.map((a) => (
              <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
            ))}
          </div>
        </div>

        {/* Centers that offer this type */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Ushbu tekshiruvni taqdim etuvchi markazlar</h3>
          <div className="space-y-2">
            {diagnosticCenters
              .filter(c => c.diagnosticTypes.some(dt => type.name.toLowerCase().includes(dt.toLowerCase()) || dt.toLowerCase().includes(type.id)))
              .slice(0, 3)
              .map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-muted/30 rounded-xl p-2">
                  <span className="text-xs font-bold text-primary">{c.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.region} — {c.city}</p>
                  </div>
                  <Badge variant={c.type === "davlat" ? "default" : "secondary"} className="text-[9px]">{c.type === "davlat" ? "Davlat" : "Xususiy"}</Badge>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ==================== DIAGNOSTIC TYPE CARD ====================
const DiagTypeCard = ({ type, onClick }: { type: DiagnosticType; onClick: () => void }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
    <div className="h-32 overflow-hidden">
      <img loading="lazy" decoding="async" src={getDiagTypeImage(type.id)} alt={type.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
    </div>
    <CardContent className="p-4">
      <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{type.name}</h3>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{type.shortDescription}</p>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">{type.priceRange}</Badge>
        <span className="text-[10px] text-primary flex items-center gap-1">Batafsil <ExternalLink className="w-3 h-3" /></span>
      </div>
    </CardContent>
  </Card>
);

// ==================== SPECIALIST CARD ====================
const SpecialistCard = ({ specialist }: { specialist: DiagnosticCenter["specialists"][0] }) => (
  <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
    <img loading="lazy" decoding="async" src={getSpecPhoto(specialist.name)} alt={specialist.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm text-foreground truncate">{specialist.name}</p>
      <p className="text-xs text-muted-foreground">{specialist.specialty}</p>
      <div className="flex items-center gap-2 mt-1">
        <Badge variant="secondary" className="text-[10px]">{specialist.experience} yil tajriba</Badge>
        <span className="flex items-center gap-0.5 text-xs text-amber-500"><Star className="w-3 h-3 fill-current" /> {specialist.rating}</span>
      </div>
    </div>
  </div>
);

// ==================== CENTER CARD ====================
const CenterCard = ({ center }: { center: DiagnosticCenter }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-40 overflow-hidden">
        <img loading="lazy" decoding="async" src={getDiagImage(center.diagnosticTypes)} alt={center.name} className="w-full h-full object-cover" />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 -mt-10 relative z-10 shadow-md bg-card">
            <span className="text-sm font-bold text-primary">{center.logo}</span>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight">{center.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={center.type === "davlat" ? "default" : "secondary"} className="text-[10px]">
                {center.type === "davlat" ? "Davlat" : "Xususiy"}
              </Badge>
              <span className="flex items-center gap-0.5 text-xs text-amber-500"><Star className="w-3 h-3 fill-current" /> {center.rating}</span>
              <span className="text-xs text-muted-foreground">({center.reviewCount} sharh)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p>{center.address}</p>
            <p className="text-xs italic">{center.landmark}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-primary font-medium">{center.phone[0]}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{center.workingHours}</span>
        </div>

        {/* Diagnostic Types */}
        <div className="flex flex-wrap gap-1">
          {center.diagnosticTypes.map((dt) => (
            <Badge key={dt} variant="outline" className="text-[10px]">{dt}</Badge>
          ))}
        </div>

        {/* Price preview */}
        {center.services.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-2">
            <p className="text-[10px] font-semibold text-foreground mb-1">Narxlar:</p>
            {center.services.slice(0, 2).map((s) => (
              <div key={s.name} className="flex justify-between text-[10px] text-muted-foreground">
                <span>{s.name}</span>
                <span className="font-medium text-primary">{s.price}</span>
              </div>
            ))}
            {center.services.length > 2 && <p className="text-[10px] text-primary mt-1">+{center.services.length - 2} xizmat</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {center.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-[10px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Yopish" : "Batafsil"} {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>

        {expanded && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">{center.description}</p>

            {/* All services with prices */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Barcha xizmatlar va narxlar</h4>
              <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                {center.services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-foreground font-medium">{s.name}</span>
                      <span className="text-muted-foreground ml-2">({s.duration})</span>
                    </div>
                    <span className="font-semibold text-primary">{s.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All amenities */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Qulayliklar</h4>
              <div className="flex flex-wrap gap-1">
                {center.amenities.map((a) => (
                  <span key={a} className="text-[10px] bg-accent text-accent-foreground px-2 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>

            {center.phone.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Telefon raqamlari</h4>
                {center.phone.map((p) => (
                  <p key={p} className="text-sm text-primary font-medium">{p}</p>
                ))}
              </div>
            )}

            {center.specialists.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><Award className="w-4 h-4" /> Mutaxassislar</h4>
                <div className="space-y-2">
                  {center.specialists.map((sp) => <SpecialistCard key={sp.id} specialist={sp} />)}
                </div>
              </div>
            )}

            {center.reviews.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Sharhlar</h4>
                <div className="space-y-2">
                  {center.reviews.map((r) => (
                    <div key={r.id} className="bg-muted/30 rounded-xl p-3 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-foreground">{r.author}</span>
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

// ==================== ADD CENTER FORM ====================
const AddCenterForm = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <Button onClick={() => setOpen(!open)} variant="outline" className="w-full md:w-auto">
        <UserPlus className="w-4 h-4 mr-2" /> Diagnostika markazi qo'shish / Ro'yxatdan o'tkazish
      </Button>
      {open && (
        <Card className="mt-4 animate-fade-in">
          <CardHeader><CardTitle className="text-lg">Yangi diagnostika markazini ro'yxatdan o'tkazish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Markaz nomi *</Label><Input placeholder="Masalan: Anor Diagnostika" /></div>
              <div>
                <Label>Markaz turi *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Tanlang</option>
                  <option value="davlat">Davlat</option>
                  <option value="xususiy">Xususiy</option>
                </select>
              </div>
              <div>
                <Label>Viloyat *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Tanlang</option>
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><Label>Shahar/Tuman *</Label><Input placeholder="Shahar yoki tuman nomi" /></div>
              <div><Label>Manzil *</Label><Input placeholder="To'liq manzil" /></div>
              <div><Label>Mo'ljal</Label><Input placeholder="Masalan: Metro bekati yonida" /></div>
              <div><Label>Telefon *</Label><Input placeholder="+998 XX XXX-XX-XX" /></div>
              <div><Label>Ish vaqti</Label><Input placeholder="07:00 - 20:00" /></div>
            </div>
            <div><Label>Qisqacha tavsif</Label><Textarea placeholder="Markaz haqida..." rows={3} /></div>
            <div><Label>Diagnostika turlari (vergul bilan ajrating)</Label><Textarea placeholder="MRT, KT, UZI, Laboratoriya..." rows={2} /></div>
            <Button className="w-full md:w-auto" onClick={() => navigate("/diagnostics-register")}>
              <Activity className="w-4 h-4 mr-2" /> Ro'yxatdan o'tkazish
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN PAGE ====================
const DiagnosticsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("centers");
  const [selectedType, setSelectedType] = useState<DiagnosticType | null>(null);
  const [typeCategory, setTypeCategory] = useState("all");

  const filteredCenters = useMemo(() => {
    return diagnosticCenters.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.diagnosticTypes.some((dt) => dt.toLowerCase().includes(q)) ||
          c.city.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedRegion && c.region !== selectedRegion) return false;
      if (selectedSpecialty && !c.diagnosticTypes.some(dt => dt.toLowerCase().includes(selectedSpecialty.toLowerCase()))) return false;
      return true;
    });
  }, [search, selectedRegion, selectedSpecialty]);

  const filteredTypes = useMemo(() => {
    if (typeCategory === "all") return diagnosticTypes;
    return diagnosticTypes.filter(t => t.category === typeCategory);
  }, [typeCategory]);

  const clearFilters = () => { setSearch(""); setSelectedRegion(""); setSelectedSpecialty(""); };
  const hasFilters = search || selectedRegion || selectedSpecialty;

  return (
    <SectionLayout
      title="Diagnostika bo'limi"
      subtitle="O'zbekistondagi barcha diagnostika markazlari va tekshiruv turlari"
      icon={<Activity className="w-7 h-7 text-primary-foreground" />}
    >
      {/* Medical Terms */}
      <MedTermsBanner />

      {/* Logo Ticker Top */}
      <LogoTicker />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Diagnostika markazlari", value: diagnosticCenters.length, icon: Activity },
          { label: "Tekshiruv turlari", value: diagnosticTypes.length, icon: Stethoscope },
          { label: "Viloyatlar", value: regions.length, icon: MapPin },
          { label: "Yo'nalishlar", value: `${diagnosticSpecialties.length}+`, icon: Users },
        ].map((s) => (
          <Card key={s.label} className="text-center p-4">
            <s.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="bg-muted w-full md:w-auto">
          <TabsTrigger value="centers">Diagnostika Markazlari</TabsTrigger>
          <TabsTrigger value="types">Diagnostika Turlari</TabsTrigger>
        </TabsList>

        {/* ===== CENTERS TAB ===== */}
        <TabsContent value="centers">
          <AddCenterForm />

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Markaz, tekshiruv turi, shahar qidiring..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" /> Filtr ({hasFilters ? "Faol" : "O'chirish"})
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-4 h-4 mr-1" /> Tozalash</Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-2xl border border-border animate-fade-in">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Viloyat bo'yicha</Label>
                <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Barcha viloyatlar</option>
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Yo'nalish bo'yicha ({diagnosticSpecialties.length}+ ta)</Label>
                <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Barcha yo'nalishlar</option>
                  {diagnosticSpecialties.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">{filteredCenters.length} ta diagnostika markazi topildi</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCenters.map((center) => <CenterCard key={center.id} center={center} />)}
          </div>

          {filteredCenters.length === 0 && (
            <div className="text-center py-16">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground">Markaz topilmadi</p>
              <p className="text-muted-foreground">Qidiruv so'zini o'zgartiring yoki filtrlarni tozalang.</p>
            </div>
          )}
        </TabsContent>

        {/* ===== TYPES TAB ===== */}
        <TabsContent value="types">
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant={typeCategory === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setTypeCategory("all")}>Barchasi</Badge>
            {diagnosticCategories.map((cat) => (
              <Badge key={cat.id} variant={typeCategory === cat.id ? "default" : "outline"} className="cursor-pointer" onClick={() => setTypeCategory(cat.id)}>
                {cat.label}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTypes.map((type) => (
              <DiagTypeCard key={type.id} type={type} onClick={() => setSelectedType(type)} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Logo Ticker Bottom */}
      <div className="mt-12">
        <LogoTicker />
      </div>

      {/* Type Detail Modal */}
      {selectedType && <DiagTypeDetail type={selectedType} onClose={() => setSelectedType(null)} />}
    </SectionLayout>
  );
};

export default DiagnosticsPage;
