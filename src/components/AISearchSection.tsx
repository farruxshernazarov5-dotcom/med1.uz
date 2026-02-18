import { useState } from "react";
import { Brain, Search, ArrowRight, Sparkles, Stethoscope, Pill, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const popularSearches = [
  { label: "Bosh og'rig'i", icon: Brain },
  { label: "Qandli diabet", icon: Stethoscope },
  { label: "Paratsetamol", icon: Pill },
  { label: "Toshkent klinikalari", icon: Building2 },
];

const AISearchSection = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResult(null);

    setTimeout(() => {
      const lower = query.toLowerCase();
      if (lower.includes("bosh og'ri") || lower.includes("bosh ogri"))
        setResult("Bosh og'rig'i — eng ko'p uchraydigan sog'liq shikoyatlaridan biri. Asosiy sabablari: stress, uyqu yetishmasligi, migren, gipertoniya. Batafsil ma'lumot uchun Kasalliklar bo'limiga o'ting.");
      else if (lower.includes("diabet") || lower.includes("qand"))
        setResult("Qandli diabet — qondagi glyukoza darajasining doimiy ko'tarilishi. I va II tiplari mavjud. Asosiy belgilari: chanqash, tez-tez siydik ajratish, vazn yo'qotish. Endokrinologiya bo'limida batafsil.");
      else if (lower.includes("paratsetamol"))
        setResult("Paratsetamol — og'riq qoldiruvchi va isitmani tushiruvchi dori vositasi. Kattalar uchun bir martalik doza: 500-1000 mg. Kunlik maksimal doza: 4 g. Dorixonalar bo'limida narxlarni solishtiring.");
      else if (lower.includes("klinika") || lower.includes("toshkent"))
        setResult("Toshkent shahridagi yetakchi klinikalar: davlat va xususiy tibbiyot muassasalari. Yo'nalish, joylashuv va narxlar bo'yicha qidiring. Klinikalar katalogimizda batafsil.");
      else
        setResult(`"${query}" bo'yicha qidiruv natijalari: Kasalliklar, dori vositalari va klinikalar bo'limlarimizda batafsil ma'lumot topishingiz mumkin. Chap menyudan kerakli bo'limni tanlang.`);
      setIsSearching(false);
    }, 1200);
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          {/* Header */}
          <div className="bg-hero-gradient px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-primary-foreground">AI Tibbiy Qidiruv</h2>
              <p className="text-primary-foreground/70 text-sm">Kasallik, simptom yoki dori haqida savolingizni yozing</p>
            </div>
          </div>

          <div className="p-6">
            {/* Search */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Masalan: bosh og'rig'ining sabablari..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="bg-hero-gradient text-primary-foreground border-0 px-6 rounded-xl hover:opacity-90">
                {isSearching ? "Qidirilmoqda..." : "Qidirish"}
              </Button>
            </div>

            {/* Popular searches */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Mashhur:</span>
              {popularSearches.map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setQuery(s.label); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <s.icon className="w-3 h-3" />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Result */}
            {result && (
              <div className="bg-accent/50 rounded-xl p-4 border border-primary/20 animate-fade-up">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground leading-relaxed mb-3">{result}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/diseases" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                        Kasalliklar <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link to="/pharmacies" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                        Dorixonalar <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link to="/clinics" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                        Klinikalar <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 italic">
                      ⚠️ Ushbu ma'lumot tibbiy maslahat o'rnini bosmaydi. Shifokorga murojaat qiling.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AISearchSection;
