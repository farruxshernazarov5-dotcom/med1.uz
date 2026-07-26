import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Package, Calendar, Info } from "lucide-react";
import { getServiceTemplates, formatUzs } from "@/data/doctorServiceTemplates";
import DoctorBookingWizard, { type BookableService } from "./DoctorBookingWizard";

interface Props {
  doctorId: string;
  doctorName: string;
  doctorSlug: string;
  specialty?: string | null;
  extraServices?: string[] | null;
}

export default function DoctorServicesSection({ doctorId, doctorName, doctorSlug, specialty, extraServices }: Props) {
  const [rows, setRows] = useState<BookableService[] | null>(null);
  const [isTemplate, setIsTemplate] = useState(false);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<BookableService | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("doctor_ext_services")
        .select("id,name,description,price,duration_minutes,is_package,sessions_count")
        .eq("doctor_id", doctorId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data && data.length > 0) {
        setRows(data as BookableService[]);
        setIsTemplate(false);
      } else {
        setRows(getServiceTemplates(specialty).map((t) => ({ ...t, id: null })));
        setIsTemplate(true);
      }
    })();
  }, [doctorId, specialty]);

  const book = (s: BookableService) => { setPicked(s); setOpen(true); };

  if (!rows) return <Skeleton className="h-40 rounded-2xl" />;

  const single = rows.filter((r) => !r.is_package);
  const packages = rows.filter((r) => r.is_package);

  return (
    <div className="bg-card rounded-2xl border p-6" id="services">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading font-bold text-lg">Xizmatlar va narxlar</h2>
        <Button size="sm" onClick={() => book(rows[0])} className="gap-2">
          <Calendar className="w-4 h-4" /> Qabulga yozilish
        </Button>
      </div>
      {isTemplate && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-4">
          <Info className="w-3 h-3" /> Boshlang'ich narxlar. Aniq narx qabul tasdiqlangandan so'ng belgilanadi.
        </p>
      )}

      <div className="space-y-2 mt-3">
        {single.map((s, i) => (
          <div key={s.id ?? i} className="flex items-center justify-between gap-3 p-3 rounded-xl border hover:border-primary/40 transition">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{s.name}</p>
              {s.description && <p className="text-xs text-muted-foreground truncate">{s.description}</p>}
              <Badge variant="outline" className="text-[10px] mt-1"><Clock className="w-3 h-3 mr-1" />{s.duration_minutes} min</Badge>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-primary">{formatUzs(s.price)}</p>
              <Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={() => book(s)}>Bron</Button>
            </div>
          </div>
        ))}
      </div>

      {packages.length > 0 && (
        <>
          <h3 className="font-heading font-bold text-sm mt-6 mb-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Paketlar
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {packages.map((p, i) => (
              <div key={p.id ?? i} className="p-4 rounded-xl border bg-primary/5 border-primary/20">
                <p className="text-sm font-bold">{p.name}</p>
                {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                <p className="text-lg font-bold text-primary mt-2">{formatUzs(p.price)}</p>
                <p className="text-[11px] text-muted-foreground">{p.sessions_count} seans · {p.duration_minutes} min</p>
                <Button size="sm" className="w-full mt-2 h-8 text-xs" onClick={() => book(p)}>Paketni bron qilish</Button>
              </div>
            ))}
          </div>
        </>
      )}

      {extraServices && extraServices.length > 0 && (
        <div className="mt-6">
          <h3 className="font-heading font-bold text-sm mb-2">Yo'nalishlar</h3>
          <div className="flex flex-wrap gap-2">
            {extraServices.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
          </div>
        </div>
      )}

      <DoctorBookingWizard
        open={open} onOpenChange={setOpen}
        doctorId={doctorId} doctorName={doctorName} doctorSlug={doctorSlug}
        services={rows} initialService={picked}
      />
    </div>
  );
}
