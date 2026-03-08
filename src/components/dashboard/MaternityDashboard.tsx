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
  Baby, Plus, Trash2, Edit, Save, X, Calendar, Camera, Upload,
  TrendingUp, Clock, CheckCircle, XCircle, BarChart3, Loader2, Settings, Image,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface MaternityCenter {
  id: string; name: string; address: string; phone: string; email: string;
  specialties: string[]; description: string; logo_url: string; region: string; city: string;
  website: string; telegram: string; room_types: string;
}
interface MaternityService {
  id: string; name: string; category: string; price: number; duration_minutes: number; description: string; is_active: boolean;
}
interface MaternityAppointment {
  id: string; patient_name: string; patient_phone: string; appointment_date: string; appointment_time: string; status: string; notes: string; service_id: string | null;
}

const SERVICE_CATEGORIES = ["Tug'ruq", "Monitoring", "Neonatologiya", "Laboratoriya", "UZI", "Konsultatsiya", "Boshqa"];
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const MaternityDashboard = () => {
  const { user } = useAuth();
  const [center, setCenter] = useState<MaternityCenter | null>(null);
  const [services, setServices] = useState<MaternityService[]>([]);
  const [appointments, setAppointments] = useState<MaternityAppointment[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [newService, setNewService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "Tug'ruq", price: 0, duration_minutes: 30, description: "" });
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "", address: "", description: "", website: "", telegram: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: centers } = await supabase.from("registered_maternity" as any).select("*").eq("owner_id", user!.id).limit(1) as any;
    if (centers?.length) {
      const c = centers[0]; setCenter(c);
      setProfileForm({ name: c.name, phone: c.phone, email: c.email || "", address: c.address, description: c.description || "", website: c.website || "", telegram: c.telegram || "" });
      const [svcRes, aptRes, photoRes] = await Promise.all([
        supabase.from("maternity_services" as any).select("*").eq("center_id", c.id).order("created_at", { ascending: false }) as any,
        supabase.from("maternity_appointments" as any).select("*").eq("center_id", c.id).order("appointment_date", { ascending: false }).limit(50) as any,
        supabase.from("maternity_photos" as any).select("*").eq("center_id", c.id).order("sort_order") as any,
      ]);
      setServices(svcRes.data || []); setAppointments(aptRes.data || []); setPhotos(photoRes.data || []);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!center) return;
    setSaving(true);
    const { error } = await supabase.from("registered_maternity" as any).update({
      name: profileForm.name, phone: profileForm.phone, email: profileForm.email,
      address: profileForm.address, description: profileForm.description,
      website: profileForm.website, telegram: profileForm.telegram,
    } as any).eq("id", center.id);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Profil yangilandi" }); setProfileEdit(false); loadData();
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !center || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "5MB dan oshmasligi kerak", variant: "destructive" }); return; }
    const ext = file.name.split(".").pop();
    const path = `maternity-photos/${center.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("maternity-files").upload(path, file);
    if (error) { toast({ title: "Yuklash xatosi", variant: "destructive" }); return; }
    const { data } = supabase.storage.from("maternity-files").getPublicUrl(path);
    await supabase.from("maternity_photos" as any).insert({ center_id: center.id, url: data.publicUrl, sort_order: photos.length } as any);
    toast({ title: "✅ Rasm yuklandi" }); loadData();
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("maternity_photos" as any).delete().eq("id", id);
    toast({ title: "Rasm o'chirildi" }); loadData();
  };

  const saveService = async () => {
    if (!center || !serviceForm.name.trim()) return;
    const payload = { ...serviceForm, center_id: center.id };
    if (editingService) {
      const { error } = await supabase.from("maternity_services" as any).update(payload as any).eq("id", editingService);
      if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Xizmat yangilandi" });
    } else {
      const { error } = await supabase.from("maternity_services" as any).insert(payload as any);
      if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
      toast({ title: "✅ Yangi xizmat qo'shildi" });
    }
    setEditingService(null); setNewService(false);
    setServiceForm({ name: "", category: "Tug'ruq", price: 0, duration_minutes: 30, description: "" });
    loadData();
  };

  const deleteService = async (id: string) => {
    await supabase.from("maternity_services" as any).delete().eq("id", id);
    toast({ title: "Xizmat o'chirildi" }); loadData();
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    await supabase.from("maternity_appointments" as any).update({ status } as any).eq("id", id);
    toast({ title: `Holat: ${status}` }); loadData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!center) return (
    <Card><CardContent className="p-8 text-center">
      <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">Tug'ruqxona topilmadi</h2>
      <p className="text-muted-foreground mb-4">Avval tug'ruqxonangizni ro'yxatdan o'tkazing</p>
      <Button onClick={() => window.location.href = "/maternity-register"}>Ro'yxatdan o'tish</Button>
    </CardContent></Card>
  );

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  const statusData = [
    { name: "Kutilmoqda", value: pendingCount },
    { name: "Tasdiqlangan", value: confirmedCount },
    { name: "Bajarilgan", value: completedCount },
    { name: "Bekor", value: cancelledCount },
  ].filter(d => d.value > 0);

  const categoryData = SERVICE_CATEGORIES.map(cat => ({
    name: cat, count: services.filter(s => s.category === cat).length,
  })).filter(d => d.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {center.logo_url && <img src={center.logo_url} className="w-14 h-14 rounded-xl object-cover border" alt="" />}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Baby className="w-6 h-6 text-pink-500" /> {center.name}
          </h1>
          <p className="text-sm text-muted-foreground">{center.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Calendar className="w-6 h-6 text-primary mx-auto mb-1" /><p className="text-2xl font-bold">{appointments.length}</p><p className="text-xs text-muted-foreground">Jami qabullar</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" /><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Kutilmoqda</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" /><p className="text-2xl font-bold">{completedCount}</p><p className="text-xs text-muted-foreground">Bajarilgan</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" /><p className="text-2xl font-bold">{services.length}</p><p className="text-xs text-muted-foreground">Xizmatlar</p></CardContent></Card>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid grid-cols-5 w-full max-w-xl">
          <TabsTrigger value="services">Xizmatlar</TabsTrigger>
          <TabsTrigger value="appointments">Qabullar</TabsTrigger>
          <TabsTrigger value="photos">Rasmlar</TabsTrigger>
          <TabsTrigger value="stats">Statistika</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading font-bold text-lg">Tug'ruqxona xizmatlari</h2>
            <Button size="sm" onClick={() => { setNewService(true); setEditingService(null); setServiceForm({ name: "", category: "Tug'ruq", price: 0, duration_minutes: 30, description: "" }); }}>
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
                      <span className="text-xs text-muted-foreground">{svc.duration_minutes} daqiqa</span>
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
          <h2 className="font-heading font-bold text-lg">Qabulga yozilganlar</h2>
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

        <TabsContent value="photos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Rasmlar ({photos.length})</h2>
            <label className="cursor-pointer">
              <Input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
              <Button size="sm" asChild><span><Upload className="w-4 h-4 mr-1" /> Yuklash</span></Button>
            </label>
          </div>
          {photos.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground"><Camera className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali rasmlar yuklanmagan</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p: any) => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden border border-border">
                  <img src={p.url} alt="" className="w-full h-40 object-cover" />
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7"
                    onClick={() => deletePhoto(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Statistika</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="p-5">
              <h3 className="font-medium text-foreground mb-3">Xizmatlar bo'yicha</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <h3 className="font-medium text-foreground mb-3">Qabullar holati</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Profil sozlamalari</h2>
            {!profileEdit && <Button size="sm" variant="outline" onClick={() => setProfileEdit(true)}><Edit className="w-4 h-4 mr-1" /> Tahrirlash</Button>}
          </div>
          <Card><CardContent className="p-5 space-y-4">
            {profileEdit ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Tug'ruqxona nomi</Label><Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Telefon</Label><Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Email</Label><Input value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Website</Label><Input value={profileForm.website} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Telegram</Label><Input value={profileForm.telegram} onChange={e => setProfileForm(p => ({ ...p, telegram: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><Label>Manzil</Label><Input value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} className="mt-1" /></div>
                <div><Label>Tavsif</Label><Textarea value={profileForm.description} onChange={e => setProfileForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1" /></div>
                <div className="flex gap-2">
                  <Button onClick={saveProfile} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Saqlash</Button>
                  <Button variant="outline" onClick={() => setProfileEdit(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {[
                  ["Nomi", center.name], ["Telefon", center.phone], ["Email", center.email],
                  ["Manzil", center.address], ["Hudud", `${center.region}, ${center.city}`],
                  ["Website", center.website], ["Telegram", center.telegram],
                  ["Palata turlari", center.room_types],
                ].filter(([_, v]) => v).map(([label, val]) => (
                  <div key={label as string} className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{val}</span>
                  </div>
                ))}
                {center.specialties?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Xizmatlar: </span>
                    <div className="flex flex-wrap gap-1 mt-1">{center.specialties.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaternityDashboard;
