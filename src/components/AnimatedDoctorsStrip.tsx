import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, Sparkles, ArrowRight } from "lucide-react";

interface Doc {
  id: string;
  slug: string;
  name: string;
  photo_url: string | null;
  primary_specialty: string | null;
  experience: number | null;
}

const CREATIVE = [
  "Sizni kutmoqda",
  "Ishonchli qo'llar",
  "Tajriba + g'amxo'rlik",
  "Bugun qabul bor",
  "Sog'lig'ingiz kafolati",
  "Yurakdan davolaydi",
  "Zamonaviy yondashuv",
  "Sizning shifokoringiz",
];

function Avatar({ d, i }: { d: Doc; i: number }) {
  return (
    <Link
      to={`/doctors/ext/${d.slug}`}
      className="group flex-shrink-0 w-32 rounded-2xl border border-border bg-card p-3 text-center transition-all hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg"
      style={{ animation: `float 3.2s ease-in-out ${(i % 5) * 0.35}s infinite` }}
    >
      <div className="relative mx-auto w-16 h-16">
        <span className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        {d.photo_url ? (
          <img
            src={d.photo_url}
            alt={`${d.name} — ${d.primary_specialty || "shifokor"}`}
            loading="lazy"
            className="relative w-16 h-16 rounded-full object-cover ring-2 ring-primary/25 group-hover:ring-primary transition"
          />
        ) : (
          <div className="relative w-16 h-16 rounded-full bg-primary/10 ring-2 ring-primary/25 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] font-semibold leading-tight line-clamp-2">{d.name}</p>
      <p className="text-[9px] text-primary line-clamp-1">{d.primary_specialty}</p>
      <p className="text-[9px] text-muted-foreground line-clamp-1">{CREATIVE[i % CREATIVE.length]}</p>
    </Link>
  );
}

export default function AnimatedDoctorsStrip() {
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    let alive = true;
    supabase
      .from("doctors_external")
      .select("id, slug, name, photo_url, primary_specialty, experience")
      .not("photo_url", "is", null)
      .order("rating", { ascending: false })
      .limit(24)
      .then(({ data }) => alive && setDocs((data as Doc[]) || []));
    return () => {
      alive = false;
    };
  }, []);

  if (docs.length === 0) return null;

  const rowA = docs.slice(0, 12);
  const rowB = docs.slice(12);

  return (
    <section className="py-8" aria-labelledby="animated-doctors-title">
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 id="animated-doctors-title" className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Bizning shifokorlar
            </h2>
            <p className="text-sm text-muted-foreground">
              Med1.uz platformasidagi tajribali mutaxassislar — bir bosishda qabulga yoziling
            </p>
          </div>
          <Link to="/doctors" className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0">
            Barchasi <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card/50 p-4">
          <div className="overflow-hidden">
            <div className="flex animate-scroll gap-4 w-max">
              {[...rowA, ...rowA, ...rowA].map((d, i) => (
                <Avatar key={`a-${d.id}-${i}`} d={d} i={i} />
              ))}
            </div>
          </div>
          {rowB.length > 0 && (
            <div className="overflow-hidden">
              <div className="flex animate-scroll gap-4 w-max" style={{ animationDirection: "reverse", animationDuration: "38s" }}>
                {[...rowB, ...rowB, ...rowB].map((d, i) => (
                  <Avatar key={`b-${d.id}-${i}`} d={d} i={i + 3} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
