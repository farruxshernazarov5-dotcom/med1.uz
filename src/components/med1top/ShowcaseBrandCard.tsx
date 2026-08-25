import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Search, Sparkles, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatSum } from "@/lib/med1Top";
import type { ShowcaseBrand } from "@/data/med1TopShowcase";

const ShowcaseBrandCard = ({ brand: b }: { brand: ShowcaseBrand }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="group relative rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
        <span className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${b.accent.split(" ").slice(0, 2).join(" ")}`} />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shrink-0 ${b.accent}`}>
              <span aria-hidden>{b.emoji}</span>
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold text-foreground truncate">{b.name}</p>
              <p className="text-xs text-muted-foreground truncate">{b.category}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 border-dashed">
            Bo'sh o'rin
          </Badge>
        </div>

        <p className="relative text-sm text-muted-foreground line-clamp-2">{b.tagline}</p>

        <div className="relative flex flex-wrap gap-1.5">
          {b.keywords.slice(0, 3).map((k) => (
            <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              #{k}
            </span>
          ))}
        </div>

        <div className="relative grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-muted/60 p-2">
            <p className="text-muted-foreground flex items-center gap-1">
              <Search className="w-3 h-3" /> Talab
            </p>
            <p className="font-semibold text-foreground">{b.monthlyDemand}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-2">
            <p className="text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Boshlang'ich
            </p>
            <p className="font-semibold text-primary">{formatSum(b.startBid)}</p>
          </div>
        </div>

        <div className="relative flex gap-2 mt-auto pt-1">
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="flex-1">
              Batafsil
            </Button>
          </DialogTrigger>
          <Button asChild size="sm" className="flex-1">
            <Link to={`/med1-top/new?category=${b.code}`}>
              Egallash <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-left">
            <span className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl ${b.accent}`} aria-hidden>
              {b.emoji}
            </span>
            <span>
              <span className="block font-heading">{b.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">{b.category}</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm font-medium text-foreground">{b.tagline}</p>
        <p className="text-sm text-muted-foreground">{b.about}</p>

        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-primary" /> Maqsadli auditoriya
          </p>
          <p className="text-sm text-muted-foreground">{b.audience}</p>
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> E'londa nima ko'rsatiladi
          </p>
          <ul className="space-y-1.5">
            {b.benefits.map((x) => (
              <li key={x} className="text-sm text-muted-foreground flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Oylik qidiruv talabi</p>
            <p className="font-bold text-foreground">{b.monthlyDemand}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Boshlang'ich taklif</p>
            <p className="font-bold text-primary">{formatSum(b.startBid)}</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Bu — Med1 TOP auksionidagi yo'nalish namunasi (bo'sh o'rin), real reklama emas. O'rinni egallaganingizdan so'ng
          bu blokda sizning brendingiz, logotipingiz va tugmalaringiz chiqadi.
        </p>

        <Button asChild className="w-full">
          <Link to={`/med1-top/new?category=${b.code}`}>Shu yo'nalishda reklama berish</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShowcaseBrandCard;
