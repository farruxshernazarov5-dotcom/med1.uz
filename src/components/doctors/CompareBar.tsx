import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDoctorCompare } from "@/hooks/useDoctorFavorites";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scale, X, Star, Award } from "lucide-react";

interface Row {
  id: string; slug: string; name: string; photo_url: string | null;
  primary_specialty: string | null; rating: number | null; reviews_count: number | null;
  experience: number | null; primary_region: string | null; rank: string | null;
  languages: string[] | null;
}

const CompareBar = () => {
  const { ids, toggle, clear } = useDoctorCompare();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!open || ids.length === 0) { setRows([]); return; }
    (async () => {
      const { data } = await supabase.from("doctors_external")
        .select("id,slug,name,photo_url,primary_specialty,rating,reviews_count,experience,primary_region,rank,languages")
        .in("id", ids);
      setRows((data as Row[]) || []);
    })();
  }, [open, ids]);

  if (ids.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 bg-primary text-primary-foreground rounded-full shadow-2xl px-4 py-2.5 flex items-center gap-3 animate-fade-in">
        <Scale className="w-4 h-4" />
        <span className="text-sm font-medium">{ids.length} shifokor tanlangan</span>
        <Button size="sm" variant="secondary" className="h-7" onClick={() => setOpen(true)}>Taqqoslash</Button>
        <button onClick={clear} className="hover:opacity-70"><X className="w-4 h-4" /></button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>Shifokorlarni taqqoslash</DialogTitle></DialogHeader>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${rows.length || 1}, minmax(0, 1fr))` }}>
            {rows.map(d => (
              <div key={d.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  {d.photo_url ? (
                    <img loading="lazy" decoding="async" src={d.photo_url} alt={d.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted" />
                  )}
                  <button onClick={() => toggle(d.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <a href={`/doctors/ext/${d.slug}`} className="font-bold text-sm hover:text-primary line-clamp-2">{d.name}</a>
                  <p className="text-xs text-primary mt-0.5">{d.primary_specialty}</p>
                </div>
                <dl className="text-xs space-y-1.5">
                  <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> Reyting</dt><dd className="font-semibold">{d.rating ? Number(d.rating).toFixed(1) : "—"} ({d.reviews_count || 0})</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><Award className="w-3 h-3" /> Tajriba</dt><dd className="font-semibold">{d.experience ? `${d.experience} yil` : "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Daraja</dt><dd className="font-semibold text-right">{d.rank || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Region</dt><dd className="font-semibold text-right">{d.primary_region || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Tillar</dt><dd className="font-semibold text-right">{d.languages?.join(", ") || "—"}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompareBar;
