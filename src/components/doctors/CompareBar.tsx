import DoctorDialogContent from "./DoctorDialogContent";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDoctorCompare } from "@/hooks/useDoctorFavorites";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scale, X, Star, Award } from "lucide-react";

interface Row {
  id: string; slug: string | null; name: string; photo_url: string | null;
  primary_specialty: string | null; rating: number | null; reviews_count: number | null;
  experience: number | null; primary_region: string | null; rank: string | null;
  languages: string[] | null;
}

const CompareBar = ({ aboveActions = false }: { aboveActions?: boolean }) => {
  const { ids, toggle, clear } = useDoctorCompare();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!open || ids.length === 0) { setRows([]); return; }
    (async () => {
      const [external, platform] = await Promise.all([
        supabase.from("doctors_external").select("id,slug,name,photo_url,primary_specialty,rating,reviews_count,experience,primary_region,rank,languages").in("id", ids),
        supabase.from("doctors").select("id,full_name,specialty,experience_years,photo_url,avg_rating,review_count,region,languages").in("id", ids),
      ]);
      const merged: Row[] = [...(external.data || []), ...(platform.data || []).map(d => ({
        id: d.id, slug: null, name: d.full_name, photo_url: d.photo_url,
        primary_specialty: d.specialty, rating: d.avg_rating, reviews_count: d.review_count,
        experience: d.experience_years, primary_region: d.region, rank: null, languages: d.languages,
      }))];
      setRows(ids.flatMap(id => merged.filter(d => d.id === id)));
    })();
  }, [open, ids]);

  if (ids.length === 0) return null;

  return (
    <>
      <div className={`fixed ${aboveActions ? "bottom-40" : "bottom-20"} lg:bottom-4 inset-x-2 sm:left-auto sm:right-4 z-40 bg-primary text-primary-foreground rounded-full shadow-2xl px-4 py-2.5 flex items-center gap-2 justify-center animate-fade-in`}>
        <Scale className="w-4 h-4" />
        <span className="text-sm font-medium">{ids.length} shifokor tanlangan</span>
        <Button size="sm" variant="secondary" className="min-h-11" onClick={() => setOpen(true)}>Taqqoslash</Button>
        <button onClick={clear} aria-label="Tanlovni tozalash" className="min-h-11 min-w-11 flex items-center justify-center hover:opacity-70"><X className="w-4 h-4" /></button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DoctorDialogContent className="max-w-5xl max-h-[85vh] overflow-auto max-sm:block max-sm:space-y-4">
          <DialogHeader><DialogTitle>Shifokorlarni taqqoslash</DialogTitle></DialogHeader>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 240px), 1fr))` }}>
            {rows.map(d => (
              <div key={d.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  {d.photo_url ? (
                    <img src={d.photo_url} alt={d.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted" />
                  )}
                  <button onClick={() => toggle(d.id)} aria-label="Shifokorni olib tashlash" className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <a href={d.slug ? `/doctors/ext/${d.slug}` : `/doctors/${d.id}`} className="font-bold text-sm hover:text-primary line-clamp-2">{d.name}</a>
                  <p className="text-xs text-primary mt-0.5">{d.primary_specialty}</p>
                </div>
                <dl className="text-xs space-y-1.5">
                  <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> Reyting</dt><dd className="font-semibold">{d.rating ? Number(d.rating).toFixed(1) : "—"} ({d.reviews_count || 0})</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><Award className="w-3 h-3" /> Tajriba</dt><dd className="font-semibold">{d.experience ? `${d.experience} yil` : "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Daraja</dt><dd className="font-semibold text-right">{d.rank || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Hudud</dt><dd className="font-semibold text-right">{d.primary_region || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Tillar</dt><dd className="font-semibold text-right">{d.languages?.join(", ") || "—"}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </DoctorDialogContent>
      </Dialog>
    </>
  );
};

export default CompareBar;
