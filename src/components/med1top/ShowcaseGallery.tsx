import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShowcaseBrandCard from "./ShowcaseBrandCard";
import { SHOWCASE_BRANDS } from "@/data/med1TopShowcase";

/**
 * Med1 TOP auksionidagi bo'sh o'rinlar — 25 ta yo'nalish namunasi.
 * Real pullik reklama emas; alohida blokda, aniq "Namuna / Bo'sh o'rin" belgisi bilan.
 */
const ShowcaseGallery = () => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(SHOWCASE_BRANDS.map((b) => b.category))).sort(),
    [],
  );

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return SHOWCASE_BRANDS.filter((b) => {
      if (cat && b.category !== cat) return false;
      if (!term) return true;
      return [b.name, b.category, b.tagline, b.about, ...b.keywords]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [q, cat]);

  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <Badge variant="outline" className="mb-2 border-primary/40 text-primary">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Namuna · Bo'sh o'rinlar
            </Badge>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              {SHOWCASE_BRANDS.length} ta tibbiy yo'nalish bo'yicha bo'sh o'rin
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mt-1">
              Quyidagi kartochkalar — real reklama emas, auksiondagi bo'sh o'rinlar namunasi. O'rinni egallaganingizdan
              so'ng shu blokda sizning brendingiz chiqadi.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/med1-top/guide">Tariflar va qo'llanma</Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Yo'nalish qidirish: kardiologiya, laboratoriya, stomatologiya..."
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <Button size="sm" variant={cat === "" ? "default" : "outline"} onClick={() => setCat("")} className="shrink-0">
            Barchasi
          </Button>
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cat === c ? "default" : "outline"}
              onClick={() => setCat(c)}
              className="shrink-0"
            >
              {c}
            </Button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Bunday yo'nalish topilmadi.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((b) => (
              <ShowcaseBrandCard key={b.code} brand={b} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShowcaseGallery;
