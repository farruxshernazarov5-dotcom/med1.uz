import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const CosFeedback = ({ centerId }: { centerId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("cosmetology_feedback" as any).select("*, cosmetology_clients(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }).then(({ data }) => setItems((data as any[]) || []));
  }, [centerId]);

  const avg = items.length ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center"><Star className="w-8 h-8 text-amber-500 fill-current" /></div>
        <div>
          <p className="text-3xl font-bold text-foreground">{avg}</p>
          <p className="text-xs text-muted-foreground">{items.length} ta sharh</p>
        </div>
      </CardContent></Card>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Sharhlar yo'q</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <Card key={f.id}><CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-sm">{f.cosmetology_clients?.full_name || "Anonim"}</p>
                  <p className="text-xs text-muted-foreground">{f.service_name} · {f.staff_name}</p>
                </div>
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-4 h-4", i < f.rating ? "text-amber-500 fill-current" : "text-muted")} />)}</div>
              </div>
              {f.comment && <p className="text-sm text-foreground mt-2">{f.comment}</p>}
              {f.reply && <div className="mt-2 p-2 rounded bg-muted text-xs"><span className="font-medium">Javob:</span> {f.reply}</div>}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CosFeedback;
