import { useMemo } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, Star, MapPin, Phone, Clock, Stethoscope, Brain,
  CheckCircle2, ChevronRight, ShieldCheck,
} from "lucide-react";
import { clinics, type Clinic } from "@/data/clinics";

const PATH = "/blog/top-clinics-tashkent";
const TITLE = "Toshkentdagi eng yaxshi klinikalar — 2026 solishtirma qo'llanma";
const DESC =
  "Toshkent shahridagi yetakchi davlat va xususiy klinikalar solishtirmasi: yo'nalishlar, ish vaqti, reyting va AI-diagnostika bilan to'g'ri klinikani tanlash bo'yicha qo'llanma.";

const typeLabel: Record<Clinic["type"], string> = {
  davlat: "Davlat",
  xususiy: "Xususiy",
  poliklinika: "Poliklinika",
  "103": "Tez yordam",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Toshkentda klinikani qanday tanlash kerak?",
    a: "Avval kerakli yo'nalishni (kardiologiya, nevrologiya, jarrohlik va h.k.) aniqlang, so'ng tumani, ish vaqti va bemorlar reytingini solishtiring. Med1.uz katalogida har bir klinikaning mutaxassisliklari, manzili va telefon raqami ko'rsatilgan.",
  },
  {
    q: "Davlat klinikasi yaxshiroqmi yoki xususiymi?",
    a: "Davlat markazlari yuqori texnologiyali jarrohlik va ixtisoslashtirilgan davolash uchun kuchli, xususiy klinikalar esa qulay navbat, kengaytirilgan ish vaqti va servis darajasi bilan ajralib turadi. Quyidagi jadvalda ikkala turdagi markazlar solishtirilgan.",
  },
  {
    q: "AI-diagnostika klinika tanlashda qanday yordam beradi?",
    a: "Med1.uz AI xizmatlari simptomlaringizni dastlabki tahlil qilib, qaysi mutaxassisga murojaat qilish kerakligini va tahlil/tekshiruv natijalarini tushuntirib beradi. Bu shifokorga borishdan oldin kerakli yo'nalishni tanlashni osonlashtiradi, lekin shifokor tashxisini almashtirmaydi.",
  },
  {
    q: "Klinikaga Med1.uz orqali yozilish mumkinmi?",
    a: "Ha. Katalogdagi klinika sahifasida telefon raqami va manzili ko'rsatilgan, platformaga ulangan klinikalarda esa onlayn navbat olish imkoniyati mavjud.",
  },
];

export default function TopClinicsTashkentPage() {
  const top = useMemo(
    () =>
      clinics
        .filter((c) => c.region === "Toshkent shahri" && c.type !== "103")
        .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        .slice(0, 12),
    [],
  );

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: TITLE,
      description: DESC,
      mainEntityOfPage: `https://www.med1.uz${PATH}`,
      inLanguage: "uz-UZ",
      publisher: { "@type": "Organization", name: "Med1.uz", url: "https://www.med1.uz" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Toshkentdagi eng yaxshi klinikalar",
      itemListElement: top.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.med1.uz/clinics/${c.id}`,
        item: {
          "@type": "MedicalClinic",
          name: c.name,
          address: { "@type": "PostalAddress", addressLocality: "Toshkent", streetAddress: c.address },
          telephone: c.phone?.[0],
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title={TITLE} description={DESC} path={PATH} ogType="article" jsonLd={jsonLd} />
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <nav className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <Link to="/" className="hover:text-primary">Bosh sahifa</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/clinics" className="hover:text-primary">Klinikalar</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Toshkentdagi eng yaxshi klinikalar</span>
        </nav>

        <header className="mb-8">
          <Badge variant="secondary" className="mb-3">Qo'llanma · Toshkent shahri</Badge>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
            Toshkentdagi eng yaxshi klinikalar: 2026 solishtirma qo'llanma
          </h1>
          <p className="text-muted-foreground">
            Ushbu qo'llanmada Med1.uz katalogidagi Toshkent shahri klinikalari yo'nalishlari, ish vaqti,
            qulayliklari va bemorlar reytingi bo'yicha solishtirilgan. Maqsad — sizga <strong>to'g'ri
            klinikani AI-yordamli diagnostika bilan tanlash</strong>ga yordam berish.
          </p>
        </header>

        {/* Qisqa xulosa */}
        <Card className="mb-10 border-primary/30">
          <CardContent className="p-5 space-y-2 text-sm">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Qisqacha javob
            </h2>
            <p className="text-muted-foreground">
              Toshkentda tanlov ko'pincha uch mezon asosida qilinadi: <strong>kerakli yo'nalish</strong>{" "}
              (masalan kardiojarrohlik yoki onkologiya faqat ixtisoslashtirilgan markazlarda),{" "}
              <strong>joylashuv va ish vaqti</strong>, va <strong>xizmat turi</strong> (davlat yoki xususiy).
              Quyidagi ro'yxat Med1.uz katalogidagi reyting bo'yicha eng yuqori {top.length} ta markazni
              qamrab oladi.
            </p>
          </CardContent>
        </Card>

        {/* Solishtirma jadval */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Solishtirma jadval</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">#</th>
                  <th className="p-3 font-medium">Klinika</th>
                  <th className="p-3 font-medium">Turi</th>
                  <th className="p-3 font-medium">Tuman</th>
                  <th className="p-3 font-medium">Asosiy yo'nalishlar</th>
                  <th className="p-3 font-medium">Ish vaqti</th>
                  <th className="p-3 font-medium">Reyting</th>
                </tr>
              </thead>
              <tbody>
                {top.map((c, i) => (
                  <tr key={c.id} className="border-t border-border align-top">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3">
                      <Link to={`/clinics/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{typeLabel[c.type]}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{c.district || "—"}</td>
                    <td className="p-3 text-muted-foreground">{c.specialties.slice(0, 3).join(", ")}</td>
                    <td className="p-3 text-muted-foreground">{c.workingHours}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        {c.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground"> ({c.reviewCount})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ma'lumotlar Med1.uz klinikalar katalogidan olingan. Narxlar klinika va xizmatga qarab o'zgaradi —
            aniq narxni klinikaning o'zidan tasdiqlang.
          </p>
        </section>

        {/* Batafsil kartalar */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Klinikalar haqida batafsil</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {top.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">
                      <Link to={`/clinics/${c.id}`} className="hover:text-primary">{c.name}</Link>
                    </h3>
                    <Badge variant="outline" className="shrink-0">{typeLabel[c.type]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                  <ul className="text-xs text-muted-foreground space-y-1 pt-1">
                    <li className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{c.address}</li>
                    <li className="flex items-start gap-1.5"><Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />{c.workingHours}</li>
                    {c.phone?.[0] && (
                      <li className="flex items-start gap-1.5">
                        <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <a href={`tel:${c.phone[0]}`} className="hover:text-primary">{c.phone[0]}</a>
                      </li>
                    )}
                    <li className="flex items-start gap-1.5"><Stethoscope className="w-3.5 h-3.5 mt-0.5 shrink-0" />{c.specialties.slice(0, 5).join(", ")}</li>
                  </ul>
                  <div className="pt-2">
                    <Link to={`/clinics/${c.id}`}>
                      <Button size="sm" variant="outline">Klinika sahifasi</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI angle */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> AI-yordamli diagnostika bilan klinikani tanlash
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: "1. Simptomlarni tekshiring", d: "Simptom checker qaysi yo'nalish (kardiologiya, nevrologiya va h.k.) mos kelishini ko'rsatadi.", to: "/symptom-checker", cta: "Simptom checker" },
              { t: "2. Tahlil natijalarini tushuning", d: "Laboratoriya va radiologiya natijalarini AI tahlil qilib, oddiy tilda izohlaydi.", to: "/ai-services", cta: "AI xizmatlari" },
              { t: "3. Mutaxassisni toping", d: "Kerakli yo'nalish bo'yicha Toshkentdagi shifokorlar va klinikalarni solishtiring.", to: "/doctors", cta: "Shifokorlar" },
            ].map((s) => (
              <Card key={s.t}>
                <CardContent className="p-5 space-y-2">
                  <h3 className="font-semibold text-sm">{s.t}</h3>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                  <Link to={s.to}><Button size="sm" variant="ghost" className="px-0">{s.cta} →</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            AI xulosalari faqat ma'lumot uchun va shifokor tashxisini almashtirmaydi.
          </p>
        </section>

        {/* Tanlash mezonlari */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Tanlashda e'tibor bering</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Kerakli yo'nalish klinikaning ixtisosiga kiradimi (masalan, kardiojarrohlik yoki transplantologiya faqat ixtisoslashtirilgan markazlarda).",
              "Ish vaqti va navbat: xususiy markazlar odatda kechqurun va dam olish kunlari ham qabul qiladi.",
              "Joylashuv va tuman — surunkali davolanishda yaqinlik muhim.",
              "Qulayliklar: dorixona, avtoturargoh, palatalar, laboratoriya joyida bormi.",
              "Xizmat narxini va shartnoma shartlarini oldindan yozma tarzda aniqlang.",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />{x}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Ko'p so'raladigan savollar</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <Card key={f.q}>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-1">{f.q}</h3>
                  <p className="text-sm text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link to="/clinics"><Button><Building2 className="w-4 h-4 mr-2" />Barcha klinikalar katalogi</Button></Link>
          <Link to="/doctors"><Button variant="outline">Shifokorlarni ko'rish</Button></Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
