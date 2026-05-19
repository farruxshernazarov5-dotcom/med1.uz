import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bed, Plus, Sparkles, Brush, Wrench, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BedRow = {
  id: string;
  room_number: string;
  bed_label: string;
  room_type: string;
  status: string;
  patient_id: string | null;
  occupied_at: string | null;
  notes: string | null;
};

const ROOM_TYPES = [
  { v: "standard", l: "Standart" },
  { v: "vip", l: "VIP" },
  { v: "nicu", l: "NICU (chaqaloq RR)" },
  { v: "labor", l: "Tug'ruq xonasi" },
  { v: "delivery", l: "Delivery" },
];

const STATUSES = [
  { v: "available", l: "Bo'sh", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { v: "occupied", l: "Band", color: "bg-rose-100 text-rose-700 border-rose-300" },
  { v: "cleaning", l: "Tozalanmoqda", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { v: "maintenance", l: "Ta'mir", color: "bg-slate-100 text-slate-700 border-slate-300" },
];

export const MatBeds = ({ centerId }: { centerId: string }) => {
  const [beds, setBeds] = useState<BedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ room_number: "", bed_label: "", room_type: "standard", notes: "" });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("maternity_beds" as any)
      .select("*")
      .eq("center_id", centerId)
      .order("room_number") as any;
    setBeds((data as BedRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [centerId]);

  const addBed = async () => {
    if (!form.room_number || !form.bed_label) {
      toast({ title: "Xona raqami va karavot belgisi shart", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("maternity_beds" as any).insert({ ...form, center_id: centerId });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Karavot qo'shildi" });
    setOpen(false);
    setForm({ room_number: "", bed_label: "", room_type: "standard", notes: "" });
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "occupied") patch.occupied_at = new Date().toISOString();
    if (status === "available") { patch.patient_id = null; patch.occupied_at = null; }
    await supabase.from("maternity_beds" as any).update(patch).eq("id", id);
    load();
  };

  const counts = {
    total: beds.length,
    available: beds.filter(b => b.status === "available").length,
    occupied: beds.filter(b => b.status === "occupied").length,
    cleaning: beds.filter(b => b.status === "cleaning").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bed className="w-6 h-6 text-pink-500" /> Karavotlar boshqaruvi
          </h2>
          <p className="text-sm text-muted-foreground">Xonalar, VIP va NICU bandligini real-time kuzating</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> Yangi karavot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi karavot qo'shish</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Xona raqami (masalan, 201)" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} />
              <Input placeholder="Karavot belgisi (A, B)" value={form.bed_label} onChange={e => setForm({ ...form, bed_label: e.target.value })} />
              <Select value={form.room_type} onValueChange={v => setForm({ ...form, room_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROOM_TYPES.map(r => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Izoh (ixtiyoriy)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={addBed} className="w-full bg-pink-500 text-white">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jami", value: counts.total, color: "from-slate-50 to-slate-100", icon: Bed },
          { label: "Bo'sh", value: counts.available, color: "from-emerald-50 to-emerald-100", icon: CheckCircle2 },
          { label: "Band", value: counts.occupied, color: "from-rose-50 to-rose-100", icon: Sparkles },
          { label: "Tozalanmoqda", value: counts.cleaning, color: "from-amber-50 to-amber-100", icon: Brush },
        ].map((c) => (
          <Card key={c.label} className={`bg-gradient-to-br ${c.color} border-0`}>
            <CardContent className="p-4">
              <c.icon className="w-5 h-5 text-foreground/60 mb-2" />
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
      ) : beds.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Bed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Hali karavotlar qo'shilmagan</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {beds.map((b) => {
            const st = STATUSES.find(s => s.v === b.status);
            return (
              <Card key={b.id} className="hover:shadow-lg transition-all border-pink-100">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground">№{b.room_number}-{b.bed_label}</p>
                      <p className="text-xs text-muted-foreground">{ROOM_TYPES.find(r => r.v === b.room_type)?.l}</p>
                    </div>
                    <Badge variant="outline" className={st?.color}>{st?.l}</Badge>
                  </div>
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setStatus(b.id, "available")} title="Bo'sh"><CheckCircle2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setStatus(b.id, "occupied")} title="Band"><Sparkles className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setStatus(b.id, "cleaning")} title="Tozalash"><Brush className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setStatus(b.id, "maintenance")} title="Ta'mir"><Wrench className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
