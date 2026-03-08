import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles, Plus, Trash2, Edit, Save, X, Calendar,
  TrendingUp, Clock, CheckCircle, XCircle, BarChart3, Loader2,
} from "lucide-react";

interface CosmetologyCenter {
  id: string; name: string; address: string; phone: string; specialties: string[];
}
interface CosmetologyService {
  id: string; name: string; category: string; price: number; duration_minutes: number; description: string; is_active: boolean;
}
interface CosmetologyAppointment {
  id: string; patient_name: string; patient_phone: string; appointment_date: string; appointment_time: string; status: string; notes: string; service_id: string | null;
}

const SERVICE_CATEGORIES = ["Lazer", "Yuz parvarishi", "Dermatologiya", "Estetik", "Inyeksiya", "Tana", "Boshqa"];

const CosmetologyDashboard = () => {
  const { user } = useAuth();
  const [center, setCenter] = useState<CosmetologyCenter | null>(null);
  const [services, setServices] = useState<CosmetologyService[]>([]);
  const [appointments, setAppointments] = useState<CosmetologyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [newService, setNewService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "Lazer", price: 0, duration_minutes: 30, description: "" });

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: centers } = await supabase.from("registered_cosmetology" as any).select("*").eq("owner_id", user!.id).limit(1) as any;
    if (centers?.length) {
      const c = centers[0]; setCenter(c);
      const [svcRes, aptRes] = await Promise.all([
        supabase.from("cosmetology_services" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }) as any,
        supabase.from("cosmetology_appointments" as any).select("*").eq("center_id", c.id).order("appointment_date", { ascending: false }).limit(50) as any,
      ]);
      setServices(svcRes.data || []); setAppointments(aptRes.data || []);
    }
    setLoading(false);
  };

  const saveService = async () => {
    if (!center || !serviceForm.name.trim()) return;
    const payload = { ...serviceForm, center_id: center.id };
    if (editingService) {
      const { error } = await supabase.from("cosmetology_services" as any).update(payload as any).eq("id", editingService);
      if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Xizmat yangilandi" });
    } else {
      const { error } = await supabase.from("cosmetology_services" as any).insert(payload as any);
      if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Yangi xizmat qo'shildi" });
    }
    setEditingService(null); setNewService(false);
    setServiceForm({ name: "", category: "Lazer", price: 0, duration_minutes: 30, description: "" });
    loadData();
  };

  const deleteService = async (id: string) => {
    await supabase.from("cosmetology_services" as any).delete().eq("id", id);
    toast({ title: "Xizmat o'chirildi" }); loadData();
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    await supabase.from("cosmetology_appointments" as any).update({ status } as any).eq("id", id);
    toast({ title: `Holat: ${status}` }); loadData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!center) return (
    <Card><CardContent className="p-8 text-center">
      <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">Kosmetologiya markazi topilmadi</h2>
      <p className="text-muted-foreground mb-4">Avval markazingizni ro'yxatdan o'tkazing</p>
      <Button onClick={() => window.location.href = "/cosmetology-register"}>Ro'yxatdan o'tish</Button>
    </CardContent></Card>
  );

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-500" /> {center.name}
        </h1>
        <p className="text-sm text-muted-foreground">{center.address}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Calendar className="w-6 h-6 text-primary mx-auto mb-1" /><p className="text-2xl font-bold">{appointments.length}</p><p className="text-xs text-muted-foreground">Jami qabullar</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" /><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Kutilmoqda</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" /><p className="text-2xl font-bold">{completedCount}</p><p className="text-xs text-muted-foreground">Bajarilgan</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" /><p className="text-2xl font-bold">{services.length}</p><p className="text-xs text-muted-foreground">Xizmatlar</p></CardContent></Card>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="services">Xizmatlar</TabsTrigger>
          <TabsTrigger value="appointments">Qabullar</TabsTrigger>
          <TabsTrigger value="stats">Statistika</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading font-bold text-lg">Kosmetologiya xizmatlari</h2>
            <Button size="sm" onClick={() => { setNewService(true); setEditingService(null); setServiceForm({ name: "", category: "Lazer", price: 0, duration_minutes: 30, description: "" }); }}>
              <Plus className="w-4 h-4 mr-1" /> Yangi
            </Button>
          </div>

          {(newService || editingService) && (
            <Card className="border-primary/30"><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Xizmat nomi *</Label><Input value={serviceForm.name} onChange={(e) => setServiceForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
                <div><Label>Kategoriya</Label>
                  <select value={serviceForm.category} onChange={(e) => setServiceForm(p => ({ ...p, category: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><Label>Narxi (so'm)</Label><Input type="number" value={serviceForm.price} onChange={(e) => setServiceForm(p => ({ ...p, price: +e.target.value }))} className="mt-1" /></div>
                <div><Label>Davomiyligi (daqiqa)</Label><Input type="number" value={serviceForm.duration_minutes} onChange={(e) => setServiceForm(p => ({ ...p, duration_minutes: +e.target.value }))} className="mt-1" /></div>
              </div>
              <div><Label>Tavsif</Label><Textarea value={serviceForm.description} onChange={(e) => setServiceForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveService}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
                <Button size="sm" variant="outline" onClick={() => { setNewService(false); setEditingService(null); }}><X className="w-4 h-4 mr-1" /> Bekor</Button>
              </div>
            </CardContent></Card>
          )}

          {services.length === 0 && !newService ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Hali xizmatlar qo'shilmagan</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {services.map((svc) => (
                <Card key={svc.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{svc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{svc.category}</Badge>
                      <span className="text-sm text-primary font-semibold">{svc.price?.toLocaleString()} so'm</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditingService(svc.id); setNewService(false);
                      setServiceForm({ name: svc.name, category: svc.category, price: svc.price, duration_minutes: svc.duration_minutes, description: svc.description || "" });
                    }}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteService(svc.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <h2 className="font-heading font-bold text-lg">Mijozlar qabullari</h2>
          {appointments.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Hali qabullar yo'q</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt) => (
                <Card key={apt.id}><CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{apt.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{apt.patient_phone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={apt.status === "pending" ? "default" : apt.status === "completed" ? "secondary" : "destructive"} className="text-xs">
                          {apt.status === "pending" ? "Kutilmoqda" : apt.status === "confirmed" ? "Tasdiqlangan" : apt.status === "completed" ? "Bajarilgan" : "Bekor qilingan"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{apt.appointment_date} — {apt.appointment_time}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {apt.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, "confirmed")}><CheckCircle className="w-3 h-3 mr-1" /> Tasdiqlash</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateAppointmentStatus(apt.id, "cancelled")}><XCircle className="w-3 h-3" /></Button>
                        </>
                      )}
                      {apt.status === "confirmed" && (
                        <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, "completed")}><CheckCircle className="w-3 h-3 mr-1" /> Bajarildi</Button>
                      )}
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Statistika</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="p-5">
              <h3 className="font-medium text-foreground mb-3">Xizmatlar bo'yicha</h3>
              {SERVICE_CATEGORIES.map(cat => {
                const count = services.filter(s => s.category === cat).length;
                if (!count) return null;
                return <div key={cat} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{cat}</span><Badge variant="secondary">{count}</Badge>
                </div>;
              })}
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <h3 className="font-medium text-foreground mb-3">Qabullar holati</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Kutilmoqda</span><Badge>{pendingCount}</Badge></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Tasdiqlangan</span><Badge variant="secondary">{appointments.filter(a => a.status === "confirmed").length}</Badge></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Bajarilgan</span><Badge variant="outline">{completedCount}</Badge></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Bekor qilingan</span><Badge variant="destructive">{appointments.filter(a => a.status === "cancelled").length}</Badge></div>
              </div>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CosmetologyDashboard;
