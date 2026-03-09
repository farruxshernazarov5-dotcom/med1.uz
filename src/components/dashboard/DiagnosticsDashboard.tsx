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
  Microscope, Plus, Trash2, Edit, Save, X, Calendar, Users,
  TrendingUp, Clock, CheckCircle, XCircle, BarChart3, Loader2,
} from "lucide-react";

interface DiagCenter {
  id: string;
  name: string;
  address: string;
  phone: string;
  specialties: string[];
}

interface DiagService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  description: string;
  preparation_info: string;
  is_active: boolean;
}

interface DiagAppointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string;
  service_id: string | null;
}

const SERVICE_CATEGORIES = [
  "MRT", "KT", "UZI", "Rentgen", "Laboratoriya", "EKG", "Endoskopiya", "Boshqa",
];

const DiagnosticsDashboard = () => {
  const { user } = useAuth();
  const [center, setCenter] = useState<DiagCenter | null>(null);
  const [services, setServices] = useState<DiagService[]>([]);
  const [appointments, setAppointments] = useState<DiagAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [newService, setNewService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "MRT", price: 0, duration_minutes: 30, description: "", preparation_info: "" });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    // Load center
    const { data: centers } = await supabase
      .from("registered_diagnostics" as any)
      .select("*")
      .eq("owner_id", user!.id)
      .limit(1) as any;

    if (centers?.length) {
      const c = centers[0];
      setCenter(c);

      // Load services and appointments in parallel
      const [svcRes, aptRes] = await Promise.all([
        supabase.from("diagnostics_services" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }) as any,
        supabase.from("diagnostics_appointments" as any).select("*").eq("center_id", c.id).order("appointment_date", { ascending: false }).limit(50) as any,
      ]);
      setServices(svcRes.data || []);
      setAppointments(aptRes.data || []);
    }
    setLoading(false);
  };

  const saveService = async () => {
    if (!center || !serviceForm.name.trim()) return;
    const payload = { ...serviceForm, center_id: center.id };

    if (editingService) {
      const { error } = await supabase.from("diagnostics_services" as any).update(payload as any).eq("id", editingService);
      if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Xizmat yangilandi" });
    } else {
      const { error } = await supabase.from("diagnostics_services" as any).insert(payload as any);
      if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Yangi xizmat qo'shildi" });
    }
    setEditingService(null);
    setNewService(false);
    setServiceForm({ name: "", category: "MRT", price: 0, duration_minutes: 30, description: "", preparation_info: "" });
    loadData();
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from("diagnostics_services" as any).delete().eq("id", id);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Xizmat o'chirildi" });
    loadData();
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("diagnostics_appointments" as any).update({ status } as any).eq("id", id);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Holat "${status}" ga o'zgartirildi` });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!center) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Microscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Diagnostika markazi topilmadi</h2>
          <p className="text-muted-foreground mb-4">Avval diagnostika markazingizni ro'yxatdan o'tkazing</p>
          <Button onClick={() => window.location.href = "/diagnostics-register"}>Ro'yxatdan o'tish</Button>
        </CardContent>
      </Card>
    );
  }

  // Stats
  const totalAppointments = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const totalRevenue = services.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Microscope className="w-6 h-6 text-primary" /> {center.name}
          </h1>
          <p className="text-sm text-muted-foreground">{center.address}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalAppointments}</p>
            <p className="text-xs text-muted-foreground">Jami qabullar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Kutilmoqda</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Bajarilgan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{services.length}</p>
            <p className="text-xs text-muted-foreground">Xizmatlar</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="services">Xizmatlar</TabsTrigger>
          <TabsTrigger value="appointments">Qabullar</TabsTrigger>
          <TabsTrigger value="stats">Statistika</TabsTrigger>
          <TabsTrigger value="subscription">Obuna</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading font-bold text-lg text-foreground">Diagnostika xizmatlari</h2>
            <Button size="sm" onClick={() => { setNewService(true); setEditingService(null); setServiceForm({ name: "", category: "MRT", price: 0, duration_minutes: 30, description: "", preparation_info: "" }); }}>
              <Plus className="w-4 h-4 mr-1" /> Yangi xizmat
            </Button>
          </div>

          {(newService || editingService) && (
            <Card className="border-primary/30">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Xizmat nomi *</Label>
                    <Input value={serviceForm.name} onChange={(e) => setServiceForm(p => ({ ...p, name: e.target.value }))} placeholder="Masalan: Bosh MRT" className="mt-1" />
                  </div>
                  <div>
                    <Label>Kategoriya</Label>
                    <select value={serviceForm.category} onChange={(e) => setServiceForm(p => ({ ...p, category: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Narxi (so'm)</Label>
                    <Input type="number" value={serviceForm.price} onChange={(e) => setServiceForm(p => ({ ...p, price: +e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Davomiyligi (daqiqa)</Label>
                    <Input type="number" value={serviceForm.duration_minutes} onChange={(e) => setServiceForm(p => ({ ...p, duration_minutes: +e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Tavsif</Label>
                  <Textarea value={serviceForm.description} onChange={(e) => setServiceForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1" />
                </div>
                <div>
                  <Label>Tayyorgarlik ko'rsatmalari</Label>
                  <Textarea value={serviceForm.preparation_info} onChange={(e) => setServiceForm(p => ({ ...p, preparation_info: e.target.value }))} placeholder="Bemor uchun tayyorgarlik..." rows={2} className="mt-1" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveService}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
                  <Button size="sm" variant="outline" onClick={() => { setNewService(false); setEditingService(null); }}><X className="w-4 h-4 mr-1" /> Bekor</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {services.length === 0 && !newService ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Hali xizmatlar qo'shilmagan</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {services.map((svc) => (
                <Card key={svc.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{svc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{svc.category}</Badge>
                        <span className="text-sm text-primary font-semibold">{svc.price?.toLocaleString()} so'm</span>
                        <span className="text-xs text-muted-foreground">{svc.duration_minutes} daqiqa</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => {
                        setEditingService(svc.id);
                        setNewService(false);
                        setServiceForm({ name: svc.name, category: svc.category, price: svc.price, duration_minutes: svc.duration_minutes, description: svc.description || "", preparation_info: svc.preparation_info || "" });
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteService(svc.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <h2 className="font-heading font-bold text-lg text-foreground">Qabulga yozilganlar</h2>
          {appointments.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Hali qabullar yo'q</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt) => (
                <Card key={apt.id}>
                  <CardContent className="p-4">
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
                        {apt.notes && <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        {apt.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, "confirmed")}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Tasdiqlash
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateAppointmentStatus(apt.id, "cancelled")}>
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {apt.status === "confirmed" && (
                          <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, "completed")}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Bajarildi
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Statistika
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3">Xizmatlar bo'yicha</h3>
                {SERVICE_CATEGORIES.map(cat => {
                  const count = services.filter(s => s.category === cat).length;
                  if (!count) return null;
                  return (
                    <div key={cat} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{cat}</span>
                      <Badge variant="secondary">{count} ta</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-medium text-foreground mb-3">Qabullar holati</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Kutilmoqda</span><Badge>{pendingCount}</Badge></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Tasdiqlangan</span><Badge variant="secondary">{appointments.filter(a => a.status === "confirmed").length}</Badge></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Bajarilgan</span><Badge variant="outline">{completedCount}</Badge></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Bekor qilingan</span><Badge variant="destructive">{appointments.filter(a => a.status === "cancelled").length}</Badge></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <DiagnosticsSubscription />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">Ma'lumot manbasi: med1.uz — {new Date().getFullYear()}</p>
    </div>
  );
};

export default DiagnosticsDashboard;
