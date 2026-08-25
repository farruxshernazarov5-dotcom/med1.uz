import { AlertTriangle, BadgeCheck, Camera, FileText, Lightbulb, Ruler, ShieldCheck, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SPECS = [
  { icon: Camera, title: "Logotip", value: "PNG/WebP, 512×512, kvadrat, oq yoki shaffof fon" },
  { icon: Type, title: "Sarlavha", value: "40–60 belgi. Brend + asosiy foyda. Bosh harflar bilan yozmang" },
  { icon: FileText, title: "Tavsif", value: "90–160 belgi. Bitta aniq taklif + bitta harakatga chaqiruv" },
  { icon: Ruler, title: "Banner (ixtiyoriy)", value: "1200×628 (1.91:1). Matn maydonning 30% dan oshmasin" },
];

const DO = [
  "Aniq xizmat nomi: “Implant o'rnatish — 3 bosqichda”",
  "Real narx yoki narx diapazoni ko'rsating",
  "Litsenziya, tajriba yili, shifokorlar soni — ishonch signallari",
  "Bitta CTA: “Qabulga yozilish” yoki “Qo'ng'iroq qilish”",
  "Hudud va manzilni yozing — lokal qidiruvda konversiya 2x",
  "Foto: real klinika, real jamoa. Stok rasmlardan qoching",
];

const DONT = [
  "“100% davolaymiz”, “kafolatlangan natija”, “mo''jizaviy usul”",
  "Raqobatchini kamsitish yoki taqqoslab ayblash",
  "Retseptli dorilarni to'g'ridan-to'g'ri reklama qilish",
  "Bemor fotosini yoki tahlilini roziliksiz joylash",
  "Tasdiqlanmagan statistika: “eng yaxshi”, “№1” (hujjatsiz)",
  "Qo'rquvga asoslangan matn: “bugun bormasangiz kech bo'ladi”",
];

const FORMULAS = [
  {
    name: "Muammo → Yechim",
    example: "“Tish og'rig'i tunda bezovta qilyaptimi? 24/7 shoshilinch stomatolog — 30 daqiqada qabul.”",
  },
  {
    name: "Raqam → Ishonch",
    example: "“12 yil, 8 400 muvaffaqiyatli implant, 5 yillik kafolat. Bepul konsultatsiya.”",
  },
  {
    name: "Tezlik → Qulaylik",
    example: "“Tahlil natijasi 3 soatda telefoningizda. Uyga hamshira chaqiring.”",
  },
  {
    name: "Paket → Aniq narx",
    example: "“Yurak check-up: EKG + EXO + kardiolog. 390 000 so'm, 1 kunda.”",
  },
];

const CreativeGuide = () => (
  <section id="creative-guide" className="container mx-auto px-4 py-10">
    <div className="flex items-center gap-2 mb-2">
      <Lightbulb className="w-5 h-5 text-primary" />
      <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">Kreativ qo'llanma</h2>
    </div>
    <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
      E'loningiz moderatsiyadan birinchi urinishda o'tishi va bosilishi uchun quyidagi talab va formulalarga amal qiling.
      Har bir e'lon AI moderatsiya va Med1 admin tekshiruvidan o'tadi.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {SPECS.map((s) => (
        <div key={s.title} className="rounded-2xl border border-border bg-card p-4">
          <s.icon className="w-5 h-5 text-primary mb-2" />
          <p className="font-semibold text-sm text-foreground">{s.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.value}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="font-heading font-bold text-foreground flex items-center gap-2 mb-3">
          <BadgeCheck className="w-4 h-4 text-emerald-500" /> Tavsiya etiladi
        </p>
        <ul className="space-y-2">
          {DO.map((x) => (
            <li key={x} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-emerald-500">✓</span> {x}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="font-heading font-bold text-foreground flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-destructive" /> Taqiqlanadi
        </p>
        <ul className="space-y-2">
          {DONT.map((x) => (
            <li key={x} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-destructive">✕</span> {x}
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      {FORMULAS.map((f) => (
        <div key={f.name} className="rounded-2xl border border-border bg-card p-4">
          <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wide border-primary/40 text-primary">
            {f.name}
          </Badge>
          <p className="text-sm text-foreground">{f.example}</p>
        </div>
      ))}
    </div>

    <div className="rounded-2xl border border-border bg-muted/40 p-4 flex gap-3">
      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Moderatsiya qoidasi:</span> pullik reklama hech qachon organik
        natijalar bilan aralashmaydi — u doim “Reklama” belgisi bilan alohida blokda chiqadi. Tibbiy da'volar
        O'zbekiston Respublikasi reklama va sog'liqni saqlash qonunchiligiga mos bo'lishi shart.
      </p>
    </div>
  </section>
);

export default CreativeGuide;
