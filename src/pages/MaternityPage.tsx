import { useState, useMemo } from "react";
import SectionLayout from "@/components/SectionLayout";
import { Baby, Search, MapPin, Phone, Star, Clock, ChevronDown, ChevronUp, UserPlus, MessageSquare, Filter, X, Stethoscope, Award, Users, DollarSign, Info, CheckCircle2, Heart, ArrowRight, ShieldCheck, Bed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  maternityHospitals,
  maternityLogos,
  maternityMedicalTerms,
  maternitySpecialties,
  type MaternityHospital,
} from "@/data/maternity";
import { regions } from "@/data/clinics";
import maternityHospitalImg from "@/assets/maternity-hospital.jpg";
import maternityNurseryImg from "@/assets/maternity-nursery.jpg";
import maternityUltrasoundImg from "@/assets/maternity-ultrasound.jpg";
import maternityDeliveryImg from "@/assets/maternity-delivery.jpg";
import maternityVipImg from "@/assets/maternity-vip.jpg";
import maternityNicuImg from "@/assets/maternity-nicu.jpg";
import doctorMaleImg from "@/assets/doctor-male.jpg";
import doctorFemaleImg from "@/assets/doctor-female.jpg";

const getHospitalImage = (h: MaternityHospital) => {
  if (h.hasVIP && h.type === "xususiy") return maternityVipImg;
  if (h.hasNICU && h.bedCount > 200) return maternityNurseryImg;
  if (h.type === "xususiy") return maternityDeliveryImg;
  return maternityHospitalImg;
};

const getSpecPhoto = (name: string) =>
  name.includes("va") || name.includes("ova") || name.includes("ira") || name.includes("ora") || name.includes("ola") || name.includes("ida")
    ? doctorFemaleImg : doctorMaleImg;

// ==================== LOGO TICKER ====================
const LogoTicker = () => (
  <div className="overflow-hidden py-4 bg-muted/30 rounded-2xl mb-8">
    <div className="flex animate-scroll gap-8 w-max">
      {[...maternityLogos, ...maternityLogos, ...maternityLogos].map((logo, i) => (
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
        <span className="font-heading font-semibold text-foreground">Tibbiy iboralar — Akusherlik va Perinatal tibbiyot</span>
        {show ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>
      {show && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {maternityMedicalTerms.map((t) => (
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
const SpecialistCard = ({ specialist }: { specialist: MaternityHospital["specialists"][0] }) => (
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

// ==================== HOSPITAL CARD ====================
const HospitalCard = ({ hospital }: { hospital: MaternityHospital }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-40 overflow-hidden">
        <img src={getHospitalImage(hospital)} alt={hospital.name} className="w-full h-full object-cover" />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 -mt-10 relative z-10 shadow-md bg-card">
            <span className="text-sm font-bold text-primary">{hospital.logo}</span>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight">{hospital.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={hospital.type === "davlat" ? "default" : "secondary"} className="text-[10px]">
                {hospital.type === "davlat" ? "Davlat" : "Xususiy"}
              </Badge>
              {hospital.hasNICU && <Badge variant="outline" className="text-[10px] text-medical-red border-medical-red/30">NICU</Badge>}
              {hospital.hasVIP && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">VIP</Badge>}
              <span className="flex items-center gap-0.5 text-xs text-amber-500"><Star className="w-3 h-3 fill-current" /> {hospital.rating}</span>
              <span className="text-xs text-muted-foreground">({hospital.reviewCount} sharh)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-primary font-semibold"><Bed className="w-4 h-4" /> {hospital.bedCount} o'rin</span>
          <span className="flex items-center gap-1 text-muted-foreground"><Baby className="w-4 h-4" /> {hospital.deliveriesPerYear.toLocaleString()}+ tug'ruq/yil</span>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p>{hospital.address}</p>
            <p className="text-xs italic">{hospital.landmark}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-primary font-medium">{hospital.phone[0]}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{hospital.workingHours}</span>
        </div>

        {hospital.services.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-2">
            <p className="text-[10px] font-semibold text-foreground mb-1">Xizmatlar:</p>
            {hospital.services.slice(0, 3).map((s) => (
              <div key={s.name} className="flex justify-between text-[10px] text-muted-foreground">
                <span>{s.name}</span>
                <span className="font-medium text-primary">{s.price}</span>
              </div>
            ))}
            {hospital.services.length > 3 && <p className="text-[10px] text-primary mt-1">+{hospital.services.length - 3} xizmat</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {hospital.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-[10px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Yopish" : "Batafsil"} {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>

        {expanded && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">{hospital.description}</p>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Barcha xizmatlar va narxlar</h4>
              <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                {hospital.services.map((s) => (
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
                {hospital.amenities.map((a) => (
                  <span key={a} className="text-[10px] bg-accent text-accent-foreground px-2 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>

            {hospital.phone.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Barcha telefon raqamlar</h4>
                {hospital.phone.map((p) => (
                  <p key={p} className="text-sm text-primary font-medium">{p}</p>
                ))}
              </div>
            )}

            {hospital.specialists.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><Award className="w-4 h-4" /> Mutaxassislar</h4>
                <div className="space-y-2">
                  {hospital.specialists.map((s) => <SpecialistCard key={s.id} specialist={s} />)}
                </div>
              </div>
            )}

            {hospital.reviews.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">So'nggi sharhlar</h4>
                {hospital.reviews.map((r) => (
                  <div key={r.id} className="bg-muted/30 rounded-xl p-3 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{r.author}</span>
                      <span className="flex items-center text-xs text-amber-500">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowReviewForm(!showReviewForm)}>
              <MessageSquare className="w-4 h-4 mr-1" /> Sharh qoldirish
            </Button>

            {showReviewForm && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 animate-fade-in">
                <Label className="text-sm">Ismingiz</Label>
                <Input placeholder="Ismingizni kiriting" className="h-9" />
                <Label className="text-sm">Baho</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-6 h-6 text-amber-400 cursor-pointer hover:fill-current" />
                  ))}
                </div>
                <Label className="text-sm">Sharh matni</Label>
                <Textarea placeholder="Tajribangizni yozing..." rows={3} />
                <Button size="sm" className="w-full">Yuborish</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== INFO SECTION ====================
const MaternityInfoSection = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const infoSections = [
    {
      key: "pregnancy",
      title: "Homiladorlik davrlari",
      icon: Heart,
      img: maternityUltrasoundImg,
      content: [
        "1-trimester (1-12 hafta): Embrion shakllanadi, asosiy organlar rivojlanadi. Toksikoz boshlanishi mumkin.",
        "2-trimester (13-27 hafta): Homila faol o'sadi, harakatlar sezila boshlaydi. Eng qulay davr.",
        "3-trimester (28-40 hafta): Homila tug'ruqqa tayyorlanadi, og'irlik ortadi. Muntazam tekshiruv zarur.",
        "Birinchi UZI skrining: 11-14 hafta (nuxal shaffoflik tekshiruvi)",
        "Ikkinchi UZI skrining: 18-22 hafta (anatomik tekshiruv)",
        "Uchinchi UZI skrining: 30-34 hafta (o'sish va suyuqlik tekshiruvi)",
      ],
    },
    {
      key: "delivery-types",
      title: "Tug'ruq turlari",
      icon: Baby,
      img: maternityDeliveryImg,
      content: [
        "Tabiiy tug'ruq — eng tabiiy usul, ona tanasi o'zi boshqaradi (6-12 soat)",
        "Sezaryen kesimi — qorin operatsiyasi, tibbiy ko'rsatma bo'yicha (1-2 soat)",
        "Suvda tug'ruq — iliq suvda tug'ish, og'riq kamayadi (xususiy kliniralarda)",
        "Vertikal tug'ruq — tik holatda tug'ish, gravitatsiya yordamida",
        "Epidural anesteziya bilan tug'ruq — og'riqsiz tabiiy tug'ruq",
        "Doula yordamida tug'ruq — tajribali yordamchi hamrohligida",
      ],
    },
    {
      key: "after-birth",
      title: "Tug'ruqdan keyingi parvarrish",
      icon: ShieldCheck,
      img: maternityNicuImg,
      content: [
        "Ona suti — chaqaloq uchun eng yaxshi ozuqa, kamida 6 oy to'liq emizish tavsiya etiladi",
        "Chaqaloqni birinchi soatda ko'krakka qo'yish muhim — kolostrum (og'iz suti) juda foydali",
        "Neonatal skrining — 3 kunlikda chaqaloqdan olinadigan 5 ta kasallik uchun tekshiruv",
        "Tug'ruqdan keyin 40 kun — ona tiklanish davri, og'ir mehnatdan saqlaning",
        "Bolaga emlaish jadvali — tug'ilgan kundan boshlab BCG va Gepatit B emlari",
        "Postnatal depressiya — normal holat, lekin kuchli bo'lsa shifokorga murojaat qiling",
        "Ona uchun temir va vitamin D preparatlari qabul qilish tavsiya etiladi",
      ],
    },
    {
      key: "when-emergency",
      title: "Shoshilinch holatlarda nima qilish kerak",
      icon: Info,
      img: maternityHospitalImg,
      content: [
        "Qon ketishi — darhol tez yordamni chaqiring (103)",
        "Tug'ruq suvining ketishi — kasalxonaga yo'l oling",
        "Kuchli bosh og'rig'i + ko'z oldida chivinlar — preeklampiya belgisi, zudlik bilan shifokorga",
        "Homila harakatlari sezilmasa (24 haftadan keyin) — darhol tekshiruv",
        "39°C dan yuqori isitma — shifokorga murojaat qiling",
        "Muntazam qorin og'rig'i (har 5 daqiqada) — tug'ruq boshlanmoqda, kasalxonaga",
      ],
    },
  ];

  return (
    <div className="space-y-4 mb-8">
      <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
        <Heart className="w-6 h-6 text-primary" /> Foydali ma'lumotlar
      </h2>
      {infoSections.map(({ key, title, icon: Icon, img, content }) => (
        <Card key={key} className="overflow-hidden">
          <button onClick={() => setOpenSection(openSection === key ? null : key)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-semibold text-foreground flex-1">{title}</span>
            {openSection === key ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {openSection === key && (
            <CardContent className="pt-0 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4">
                <img src={img} alt={title} className="w-full md:w-48 h-32 object-cover rounded-xl" />
                <ul className="flex-1 space-y-2">
                  {content.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" /> {item}
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

// ==================== ADD HOSPITAL FORM ====================
const AddHospitalForm = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-8">
      <Button onClick={() => setOpen(!open)} variant="outline" className="w-full md:w-auto">
        <UserPlus className="w-4 h-4 mr-2" /> Tug'ruqxona qo'shish
      </Button>
      {open && (
        <Card className="mt-4 animate-fade-in">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Yangi tug'ruqxona ro'yxatdan o'tkazish</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-sm">Nomi</Label><Input placeholder="Tug'ruqxona nomi" className="mt-1" /></div>
              <div><Label className="text-sm">Turi</Label><Input placeholder="Davlat / Xususiy" className="mt-1" /></div>
              <div><Label className="text-sm">Viloyat</Label><Input placeholder="Viloyat nomi" className="mt-1" /></div>
              <div><Label className="text-sm">Shahar</Label><Input placeholder="Shahar nomi" className="mt-1" /></div>
              <div><Label className="text-sm">Manzil</Label><Input placeholder="To'liq manzil" className="mt-1" /></div>
              <div><Label className="text-sm">Telefon</Label><Input placeholder="+998 ..." className="mt-1" /></div>
              <div><Label className="text-sm">O'rin soni</Label><Input placeholder="100" type="number" className="mt-1" /></div>
              <div><Label className="text-sm">Ish vaqti</Label><Input placeholder="24/7" className="mt-1" /></div>
            </div>
            <div><Label className="text-sm">Tavsif</Label><Textarea placeholder="Tug'ruqxona haqida qisqacha ma'lumot..." rows={3} className="mt-1" /></div>
            <Button className="w-full md:w-auto">Ro'yxatdan o'tkazish</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN PAGE ====================
const MaternityPage = () => {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "davlat" | "xususiy">("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return maternityHospitals.filter((h) => {
      const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.region.toLowerCase().includes(search.toLowerCase()) || h.description.toLowerCase().includes(search.toLowerCase());
      const matchRegion = !selectedRegion || h.region === selectedRegion;
      const matchType = selectedType === "all" || h.type === selectedType;
      return matchSearch && matchRegion && matchType;
    });
  }, [search, selectedRegion, selectedType]);

  const allRegions = [...new Set(maternityHospitals.map((h) => h.region))];

  return (
    <SectionLayout title="Tug'ruqxonalar" subtitle="O'zbekistondagi davlat va xususiy tug'ruqxonalar" icon={<Baby className="w-7 h-7 text-primary-foreground" />}>
      {/* Top Logo Ticker */}
      <LogoTicker />

      {/* Medical Terms */}
      <MedTermsBanner />

      <Tabs defaultValue="hospitals" className="mb-8">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="hospitals">🏥 Tug'ruqxonalar</TabsTrigger>
          <TabsTrigger value="info">📋 Foydali ma'lumotlar</TabsTrigger>
        </TabsList>

        <TabsContent value="hospitals">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tug'ruqxona qidirish..." className="pl-10" />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" /> Filtr
            </Button>
          </div>

          {showFilters && (
            <div className="bg-muted/30 rounded-2xl p-4 mb-6 space-y-4 animate-fade-in">
              {/* Type filter */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Turi:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all" as const, label: "Barchasi" },
                    { value: "davlat" as const, label: "Davlat" },
                    { value: "xususiy" as const, label: "Xususiy" },
                  ].map((t) => (
                    <Button key={t.value} variant={selectedType === t.value ? "default" : "outline"} size="sm" onClick={() => setSelectedType(t.value)}>
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Region filter */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Viloyat:</p>
                <div className="flex flex-wrap gap-1">
                  <Button variant={!selectedRegion ? "default" : "outline"} size="sm" onClick={() => setSelectedRegion("")} className="text-xs">Barchasi</Button>
                  {allRegions.map((r) => (
                    <Button key={r} variant={selectedRegion === r ? "default" : "outline"} size="sm" onClick={() => setSelectedRegion(r)} className="text-xs">
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              {(selectedRegion || selectedType !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setSelectedRegion(""); setSelectedType("all"); }}>
                  <X className="w-4 h-4 mr-1" /> Filtrlarni tozalash
                </Button>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">{filtered.length} ta tug'ruqxona topildi</p>

          {/* Hospitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filtered.map((h) => (
              <HospitalCard key={h.id} hospital={h} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Baby className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Hech narsa topilmadi. Filtrlarni o'zgartiring.</p>
            </div>
          )}

          {/* Add Hospital Form */}
          <AddHospitalForm />
        </TabsContent>

        <TabsContent value="info">
          <MaternityInfoSection />

          {/* Comparison: Davlat vs Xususiy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> Davlat va Xususiy tug'ruqxonalar — taqqoslash</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-semibold text-foreground">Mezon</th>
                      <th className="text-left py-2 px-3 font-semibold text-primary">Davlat</th>
                      <th className="text-left py-2 px-3 font-semibold text-amber-600">Xususiy</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="py-2 px-3 font-medium text-foreground">Narx</td><td className="py-2 px-3">Bepul (davlat kvota)</td><td className="py-2 px-3">3-22 mln so'm</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-medium text-foreground">Palata</td><td className="py-2 px-3">Umumiy (4-8 kishilik)</td><td className="py-2 px-3">Shaxsiy / VIP / Oilaviy</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-medium text-foreground">Ovqat</td><td className="py-2 px-3">Standart parhez</td><td className="py-2 px-3">Shaxsiy oshpaz / menyu</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-medium text-foreground">NICU</td><td className="py-2 px-3">✅ Bor (ko'p markazlarda)</td><td className="py-2 px-3">✅ Bor (premium)</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-medium text-foreground">Epidural</td><td className="py-2 px-3">Ba'zi markazlarda (pullik)</td><td className="py-2 px-3">Har doim mavjud</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-medium text-foreground">Oila tashrifi</td><td className="py-2 px-3">Cheklangan</td><td className="py-2 px-3">Erkin</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-medium text-foreground">Shifokor tanlash</td><td className="py-2 px-3">Navbatchi shifokor</td><td className="py-2 px-3">Shaxsiy akusher</td></tr>
                    <tr><td className="py-2 px-3 font-medium text-foreground">Qo'shimcha xizmatlar</td><td className="py-2 px-3">Asosiy xizmatlar</td><td className="py-2 px-3">SPA, foto, doula, yoga</td></tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center p-4">
              <p className="text-2xl font-bold text-primary">{maternityHospitals.length}</p>
              <p className="text-xs text-muted-foreground">Tug'ruqxonalar</p>
            </Card>
            <Card className="text-center p-4">
              <p className="text-2xl font-bold text-primary">{maternityHospitals.filter(h => h.type === "davlat").length}</p>
              <p className="text-xs text-muted-foreground">Davlat</p>
            </Card>
            <Card className="text-center p-4">
              <p className="text-2xl font-bold text-primary">{maternityHospitals.filter(h => h.type === "xususiy").length}</p>
              <p className="text-xs text-muted-foreground">Xususiy</p>
            </Card>
            <Card className="text-center p-4">
              <p className="text-2xl font-bold text-primary">{maternityHospitals.reduce((acc, h) => acc + h.deliveriesPerYear, 0).toLocaleString()}+</p>
              <p className="text-xs text-muted-foreground">Yillik tug'ruqlar</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Logo Ticker */}
      <LogoTicker />
    </SectionLayout>
  );
};

export default MaternityPage;
