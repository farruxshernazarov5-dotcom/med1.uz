import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Package, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CosCourses = ({ centerId }: { centerId: string }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: "", course_name: "", service_type: "Peeling", total_sessions: "5", total_price: "", start_date: new Date().toISOString().split("T")[0], staff_name: "" });

  const load = async () => {
    const [c, cl] = await Promise.all([
      supabase.from("cosmetology_treatment_courses" as any).select("*, cosmetology_clients(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_clients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setCourses((c.data as any[]) || []);
    setClients((cl.data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.client_id || !form.course_name) { toast({ title: "Mijoz va kurs nomi majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_treatment_courses" as any).insert({
      center_id: centerId, client_id: form.client_id, course_name: form.course_name, service_type: form.service_type,
      total_sessions: parseInt(form.total_sessions) || 1, total_price: parseFloat(form.total_price) || 0,
      start_date: form.start_date, staff_name: form.staff_name || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Kurs yaratildi" });
    setShowForm(false);
    setForm({ client_id: "", course_name: "", service_type: "Peeling", total_sessions: "5", total_price: "", start_date: new Date().toISOString().split("T")[0], staff_name: "" });
    load();
  };

  const completeSession = async (course: any) => {
    const newCount = (course.completed_sessions || 0) + 1;
    const status = newCount >= course.total_sessions ? "completed" : "active";
    await supabase.from("cosmetology_treatment_courses" as any).update({ completed_sessions: newCount, status } as any).eq("id", course.id);
    await supabase.from("cosmetology_course_sessions" as any).insert({
      center_id: centerId, course_id: course.id, session_number: newCount, status: "completed", completed_at: new Date().toISOString(),
    } as any);
    toast({ title: `✅ Seans ${newCount}/${course.total_sessions} yakunlandi` });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Davolash kurslari ({courses.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Kurs qo'shish</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mijoz *</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Tanlang...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div><Label>Kurs nomi *</Label><Input value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Xizmat turi</Label><Input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="mt-1" /></div>
            <div><Label>Seans soni</Label><Input type="number" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} className="mt-1" /></div>
            <div><Label>Umumiy narx</Label><Input type="number" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} className="mt-1" /></div>
            <div><Label>Boshlash sanasi</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1" /></div>
            <div className="col-span-2"><Label>Mutaxassis</Label><Input value={form.staff_name} onChange={(e) => setForm({ ...form, staff_name: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Kurslar yo'q</p></div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => {
            const pct = c.total_sessions ? Math.round((c.completed_sessions / c.total_sessions) * 100) : 0;
            return (
              <Card key={c.id}><CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{c.course_name}</p>
                      <Badge className={cn("text-xs", c.status === "completed" ? "bg-emerald-500/20 text-emerald-500" : c.status === "active" ? "bg-primary/20 text-primary" : "bg-muted")}>{c.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.cosmetology_clients?.full_name} · {c.service_type} · {Number(c.total_price || 0).toLocaleString()} so'm
                    </p>
                  </div>
                  {c.status !== "completed" && (
                    <Button size="sm" onClick={() => completeSession(c)}><CheckCircle2 className="w-4 h-4 mr-1" /> Seans</Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">{c.completed_sessions}/{c.total_sessions}</span>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CosCourses;
