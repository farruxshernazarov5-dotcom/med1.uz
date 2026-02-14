import { useState, useMemo } from "react";
import SectionLayout from "@/components/SectionLayout";
import { Droplets, Search, MapPin, Phone, Star, Clock, ChevronDown, ChevronUp, UserPlus, MessageSquare, Filter, X, Stethoscope, Award, Users, DollarSign, Info, AlertTriangle, CheckCircle2, Heart, ArrowRight, Truck, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  bloodBanks,
  bloodGroups,
  bloodBankLogos,
  bloodMedicalTerms,
  bloodBankSpecialties,
  donorRequirements,
  donorInterval,
  afterDonationTips,
  donationProcess,
  type BloodBank,
  type BloodGroupInfo,
} from "@/data/bloodBanks";
import { regions } from "@/data/clinics";
import bloodDonationImg from "@/assets/blood-donation.jpg";
import bloodStorageImg from "@/assets/blood-storage.jpg";
import bloodLabImg from "@/assets/blood-lab.jpg";
import bloodDonorImg from "@/assets/blood-donor.jpg";
import bloodMobileImg from "@/assets/blood-mobile.jpg";
import doctorMaleImg from "@/assets/doctor-male.jpg";
import doctorFemaleImg from "@/assets/doctor-female.jpg";

const getBankImage = (bank: BloodBank) => {
  if (bank.type === "mobil") return bloodMobileImg;
  if (bank.services.some(s => s.name.includes("Plazma"))) return bloodStorageImg;
  return bloodDonationImg;
};

const getSpecPhoto = (name: string) =>
  name.includes("va") || name.includes("ova") || name.includes("ira") || name.includes("ora") || name.includes("uza")
    ? doctorFemaleImg : doctorMaleImg;

// ==================== LOGO TICKER ====================
const LogoTicker = () => (
  <div className="overflow-hidden py-4 bg-muted/30 rounded-2xl mb-8">
    <div className="flex animate-scroll gap-8 w-max">
      {[...bloodBankLogos, ...bloodBankLogos, ...bloodBankLogos].map((logo, i) => (
        <div key={i} className="flex-shrink-0 w-20 h-20 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center">
          <div className="text-center">
            <span className="text-lg font-bold text-medical-red">{logo.abbr}</span>
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
        <span className="font-heading font-semibold text-foreground">Tibbiy iboralar — Qon transfuziologiyasi</span>
        {show ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>
      {show && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {bloodMedicalTerms.map((t) => (
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

// ==================== BLOOD GROUP DETAIL MODAL ====================
const BloodGroupDetail = ({ group, onClose }: { group: BloodGroupInfo; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="relative h-48 overflow-hidden rounded-t-2xl">
        <img src={bloodLabImg} alt={group.type} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-6 flex items-center gap-4">
          <div className={`w-20 h-20 rounded-full ${group.color} flex items-center justify-center shadow-lg`}>
            <span className="font-heading font-bold text-primary-foreground text-2xl">{group.type}</span>
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-white">{group.fullName}</h2>
            <Badge variant="secondary" className="mt-1">{group.rarity} — {group.population}</Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 text-white hover:bg-white/20"><X className="w-5 h-5" /></Button>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{group.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Antigenlar</p>
            <p className="text-sm text-primary font-medium">{group.antigens}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Antitanalar</p>
            <p className="text-sm text-primary font-medium">{group.antibodies}</p>
          </div>
        </div>

        {/* Donor / Recipient compatibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-medical-green/5 border border-medical-green/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
              <ArrowRight className="w-4 h-4 text-medical-green" /> Qon berishi mumkin (Donor)
            </h3>
            <div className="flex flex-wrap gap-1">
              {group.canDonateTo.map((g) => (
                <Badge key={g} className="bg-medical-green/10 text-medical-green border-medical-green/30">{g}</Badge>
              ))}
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
              <ArrowRight className="w-4 h-4 text-primary rotate-180" /> Qon olishi mumkin (Retsipient)
            </h3>
            <div className="flex flex-wrap gap-1">
              {group.canReceiveFrom.map((g) => (
                <Badge key={g} className="bg-primary/10 text-primary border-primary/30">{g}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-primary" /> Xususiyatlari</h3>
          <ul className="space-y-1">
            {group.characteristics.map((c, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-medical-green flex-shrink-0" /> {c}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-medical-orange" /> Sog'liq xavflari</h3>
          <ul className="space-y-1">
            {group.healthRisks.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 text-medical-orange flex-shrink-0" /> {r}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><Heart className="w-4 h-4 text-medical-red" /> Ovqatlanish tavsiyalari</h3>
          <ul className="space-y-1">
            {group.dietRecommendations.map((d, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" /> {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

// ==================== BLOOD GROUP CARD ====================
const BloodGroupCard = ({ group, onClick }: { group: BloodGroupInfo; onClick: () => void }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group text-center" onClick={onClick}>
    <CardContent className="p-6">
      <div className={`w-20 h-20 rounded-full ${group.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
        <span className="font-heading font-bold text-primary-foreground text-2xl">{group.type}</span>
      </div>
      <h3 className="font-heading font-semibold text-foreground mb-1">{group.fullName}</h3>
      <p className="text-xs text-muted-foreground mb-2">{group.population}</p>
      <Badge variant="outline" className="text-[10px]">{group.rarity}</Badge>
      <div className="mt-3 text-xs text-primary flex items-center justify-center gap-1">Batafsil <ArrowRight className="w-3 h-3" /></div>
    </CardContent>
  </Card>
);

// ==================== DONOR INFO SECTION ====================
const DonorInfoSection = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const sections = [
    { key: "requirements", data: donorRequirements, icon: ShieldCheck, img: bloodDonorImg },
    { key: "process", data: donationProcess, icon: Heart, img: bloodDonationImg },
    { key: "interval", data: donorInterval, icon: Clock, img: bloodStorageImg },
    { key: "tips", data: afterDonationTips, icon: CheckCircle2, img: bloodLabImg },
  ];

  return (
    <div className="space-y-4 mb-8">
      <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
        <Heart className="w-6 h-6 text-medical-red" /> Donor ma'lumotlari
      </h2>
      {sections.map(({ key, data, icon: Icon, img }) => (
        <Card key={key} className="overflow-hidden">
          <button onClick={() => setOpenSection(openSection === key ? null : key)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-medical-red/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-medical-red" />
            </div>
            <span className="font-heading font-semibold text-foreground flex-1">{data.title}</span>
            {openSection === key ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {openSection === key && (
            <CardContent className="pt-0 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4">
                <img src={img} alt={data.title} className="w-full md:w-48 h-32 object-cover rounded-xl" />
                <ul className="flex-1 space-y-2">
                  {data.content.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-medical-green flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

// ==================== SPECIALIST CARD ====================
const SpecialistCard = ({ specialist }: { specialist: BloodBank["specialists"][0] }) => (
  <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
    <img src={getSpecPhoto(specialist.name)} alt={specialist.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
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

// ==================== BLOOD BANK CARD ====================
const BloodBankCard = ({ bank }: { bank: BloodBank }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-40 overflow-hidden">
        <img src={getBankImage(bank)} alt={bank.name} className="w-full h-full object-cover" />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-medical-red/10 border border-medical-red/20 flex items-center justify-center flex-shrink-0 -mt-10 relative z-10 shadow-md bg-card">
            <span className="text-sm font-bold text-medical-red">{bank.logo}</span>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight">{bank.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={bank.type === "davlat" ? "default" : bank.type === "mobil" ? "destructive" : "secondary"} className="text-[10px]">
                {bank.type === "davlat" ? "Davlat" : bank.type === "mobil" ? "Mobil" : "Xususiy"}
              </Badge>
              <span className="flex items-center gap-0.5 text-xs text-amber-500"><Star className="w-3 h-3 fill-current" /> {bank.rating}</span>
              <span className="text-xs text-muted-foreground">({bank.reviewCount} sharh)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2 text-sm text-medical-red font-semibold">
          <Users className="w-4 h-4" /> {bank.donorsCount.toLocaleString()} donor ro'yxatda
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p>{bank.address}</p>
            <p className="text-xs italic">{bank.landmark}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-primary font-medium">{bank.phone[0]}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{bank.workingHours}</span>
        </div>

        {/* Available Blood Types */}
        <div className="flex flex-wrap gap-1">
          {bank.bloodTypes.map((bt) => (
            <span key={bt} className="text-[10px] bg-medical-red/10 text-medical-red font-semibold px-2 py-0.5 rounded-full">{bt}</span>
          ))}
        </div>

        {/* Price preview */}
        {bank.services.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-2">
            <p className="text-[10px] font-semibold text-foreground mb-1">Xizmatlar:</p>
            {bank.services.slice(0, 2).map((s) => (
              <div key={s.name} className="flex justify-between text-[10px] text-muted-foreground">
                <span>{s.name}</span>
                <span className="font-medium text-primary">{s.price}</span>
              </div>
            ))}
            {bank.services.length > 2 && <p className="text-[10px] text-primary mt-1">+{bank.services.length - 2} xizmat</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {bank.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-[10px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Yopish" : "Batafsil"} {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>

        {expanded && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">{bank.description}</p>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Barcha xizmatlar</h4>
              <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                {bank.services.map((s) => (
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

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Qulayliklar</h4>
              <div className="flex flex-wrap gap-1">
                {bank.amenities.map((a) => (
                  <span key={a} className="text-[10px] bg-accent text-accent-foreground px-2 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>

            {bank.phone.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Telefon raqamlari</h4>
                {bank.phone.map((p) => (
                  <p key={p} className="text-sm text-primary font-medium">{p}</p>
                ))}
              </div>
            )}

            {bank.specialists.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><Award className="w-4 h-4" /> Mutaxassislar</h4>
                <div className="space-y-2">
                  {bank.specialists.map((sp) => <SpecialistCard key={sp.id} specialist={sp} />)}
                </div>
              </div>
            )}

            {bank.reviews.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Sharhlar</h4>
                <div className="space-y-2">
                  {bank.reviews.map((r) => (
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

// ==================== ADD BLOOD BANK FORM ====================
const AddBankForm = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-8">
      <Button onClick={() => setOpen(!open)} variant="outline" className="w-full md:w-auto">
        <UserPlus className="w-4 h-4 mr-2" /> Qon markazi qo'shish / Ro'yxatdan o'tkazish
      </Button>
      {open && (
        <Card className="mt-4 animate-fade-in">
          <CardHeader><CardTitle className="text-lg">Yangi qon markazini ro'yxatdan o'tkazish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Markaz nomi *</Label><Input placeholder="Masalan: Viloyat Qon Markazi" /></div>
              <div>
                <Label>Markaz turi *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Tanlang</option>
                  <option value="davlat">Davlat</option>
                  <option value="xususiy">Xususiy</option>
                  <option value="mobil">Mobil</option>
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
              <div><Label>Mo'ljal</Label><Input placeholder="Masalan: Shifoxona yonida" /></div>
              <div><Label>Telefon *</Label><Input placeholder="+998 XX XXX-XX-XX" /></div>
              <div><Label>Ish vaqti</Label><Input placeholder="08:00 - 17:00" /></div>
            </div>
            <div><Label>Qisqacha tavsif</Label><Textarea placeholder="Markaz haqida..." rows={3} /></div>
            <Button className="w-full md:w-auto"><Droplets className="w-4 h-4 mr-2" /> Ro'yxatdan o'tkazish</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN PAGE ====================
const BloodBanksPage = () => {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("banks");
  const [selectedGroup, setSelectedGroup] = useState<BloodGroupInfo | null>(null);

  const filteredBanks = useMemo(() => {
    return bloodBanks.filter((b) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          b.name.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.district.toLowerCase().includes(q) ||
          b.bloodTypes.some((bt) => bt.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (selectedRegion && b.region !== selectedRegion) return false;
      return true;
    });
  }, [search, selectedRegion]);

  const clearFilters = () => { setSearch(""); setSelectedRegion(""); };
  const hasFilters = search || selectedRegion;
  const totalDonors = bloodBanks.reduce((sum, b) => sum + b.donorsCount, 0);

  return (
    <SectionLayout
      title="Qon banklari"
      subtitle="O'zbekistondagi barcha qon markazlari, donorlar va qon guruhlari"
      icon={<Droplets className="w-7 h-7 text-primary-foreground" />}
    >
      {/* Medical Terms */}
      <MedTermsBanner />

      {/* Logo Ticker Top */}
      <LogoTicker />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Qon markazlari", value: bloodBanks.length, icon: Droplets },
          { label: "Qon guruhlari", value: 8, icon: Heart },
          { label: "Viloyatlar", value: regions.length, icon: MapPin },
          { label: "Jami donorlar", value: totalDonors.toLocaleString(), icon: Users },
        ].map((s) => (
          <Card key={s.label} className="text-center p-4">
            <s.icon className="w-6 h-6 text-medical-red mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="bg-muted w-full md:w-auto">
          <TabsTrigger value="banks">Qon Markazlari</TabsTrigger>
          <TabsTrigger value="groups">Qon Guruhlari</TabsTrigger>
          <TabsTrigger value="donor">Donor Ma'lumotlari</TabsTrigger>
        </TabsList>

        {/* ===== BANKS TAB ===== */}
        <TabsContent value="banks">
          <AddBankForm />

          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Qon markazi, shahar, qon guruhi qidiring..."
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
            <div className="mb-6 p-4 bg-muted/30 rounded-2xl border border-border animate-fade-in">
              <Label className="text-sm font-semibold mb-2 block">Viloyat bo'yicha</Label>
              <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Barcha viloyatlar</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">{filteredBanks.length} ta qon markazi topildi</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanks.map((bank) => <BloodBankCard key={bank.id} bank={bank} />)}
          </div>

          {filteredBanks.length === 0 && (
            <div className="text-center py-16">
              <Droplets className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground">Qon markazi topilmadi</p>
              <p className="text-muted-foreground">Qidiruv so'zini o'zgartiring yoki filtrlarni tozalang.</p>
            </div>
          )}
        </TabsContent>

        {/* ===== BLOOD GROUPS TAB ===== */}
        <TabsContent value="groups">
          <div className="mb-6">
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">8 ta qon guruhi haqida to'liq ma'lumot</h2>
            <p className="text-sm text-muted-foreground">Har bir qon guruhini bosib, batafsil ma'lumot oling: donor/retsipient mosligi, sog'liq xavflari, ovqatlanish tavsiyalari</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {bloodGroups.map((group) => (
              <BloodGroupCard key={group.id} group={group} onClick={() => setSelectedGroup(group)} />
            ))}
          </div>

          {/* Compatibility Table */}
          <Card className="overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Info className="w-5 h-5" /> Qon guruhlari mosligi jadvali</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left font-semibold text-foreground">Donor →<br/>Retsipient ↓</th>
                    {bloodGroups.map(g => (
                      <th key={g.type} className="p-2 text-center font-semibold text-foreground">{g.type}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloodGroups.map(recipient => (
                    <tr key={recipient.type} className="border-b border-border/50">
                      <td className="p-2 font-semibold text-foreground">{recipient.type}</td>
                      {bloodGroups.map(donor => {
                        const compatible = recipient.canReceiveFrom.includes(donor.type);
                        return (
                          <td key={donor.type} className="p-2 text-center">
                            {compatible ? (
                              <CheckCircle2 className="w-4 h-4 text-medical-green mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== DONOR INFO TAB ===== */}
        <TabsContent value="donor">
          <DonorInfoSection />

          {/* CTA */}
          <div className="bg-gradient-to-r from-medical-red/10 to-medical-purple/10 border border-medical-red/20 rounded-2xl p-8 text-center">
            <Droplets className="w-12 h-12 text-medical-red mx-auto mb-3" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">Donor bo'ling — hayot qutqaring!</h3>
            <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
              Bitta qon topshirish bilan 3 tagacha hayotni saqlab qolishingiz mumkin. Ro'yxatdan o'tishda qon guruhingizni ko'rsating va eng yaqin qon markaziga tashrif buyuring.
            </p>
            <Button className="bg-medical-red hover:bg-medical-red/90 text-white">
              <Heart className="w-4 h-4 mr-2" /> Donor sifatida ro'yxatdan o'tish
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Logo Ticker Bottom */}
      <div className="mt-12">
        <LogoTicker />
      </div>

      {/* Blood Group Detail Modal */}
      {selectedGroup && <BloodGroupDetail group={selectedGroup} onClose={() => setSelectedGroup(null)} />}
    </SectionLayout>
  );
};

export default BloodBanksPage;
