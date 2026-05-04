import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Droplets, Plus, Trash2, Edit, Save, X, Calendar,
  TrendingUp, Clock, CheckCircle, BarChart3, Loader2, Settings, Users, Crown, ShieldCheck,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import BloodBankSubscription from "@/components/dashboard/BloodBankSubscription";
import DashboardShell from "./DashboardShell";
import type { SidebarItem } from "./DashboardShell";
import OrgAttendance from "@/components/attendance/OrgAttendance";

interface BloodBank {
  id: string; name: string; address: string; phone: string; email: string;
  director_name: string; region: string; city: string; website: string;
  available_blood_types: string[]; storage_capacity: string; org_type: string;
  inn: string; license_number: string;
}

interface Donation {
  id: string; donor_id: string; donation_date: string; status: string; notes: string;
}

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const BloodBankDashboard = () => {
  const { user } = useAuth();
  const [bank, setBank] = useState<BloodBank | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "", phone: "", email: "", address: "", director_name: "", website: "",
    storage_capacity: "", available_blood_types: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: banks } = await supabase
      .from("blood_banks_registered")
      .select("*")
      .eq("owner_id", user!.id)
      .limit(1);
    if (banks?.length) {
      const b = banks[0];
      setBank(b as any);
      setProfileForm({
        name: b.name, phone: b.phone, email: b.email || "", address: b.address,
        director_name: b.director_name || "", website: b.website || "",
        storage_capacity: b.storage_capacity || "",
        available_blood_types: b.available_blood_types || [],
      });
      const [donationRes, donorRes] = await Promise.all([
        supabase.from("blood_donations").select("*").eq("blood_bank_id", b.id).order("donation_date", { ascending: false }).limit(100),
        supabase.from("blood_donors").select("*").eq("is_active", true).limit(50),
      ]);
      setDonations((donationRes.data || []) as any);
      setDonors(donorRes.data || []);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!bank) return;
    setSaving(true);
    const { error } = await supabase.from("blood_banks_registered").update({
      name: profileForm.name, phone: profileForm.phone, email: profileForm.email,
      address: profileForm.address, director_name: profileForm.director_name,
      website: profileForm.website, storage_capacity: profileForm.storage_capacity,
      available_blood_types: profileForm.available_blood_types,
    }).eq("id", bank.id);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Profil yangilandi" }); setProfileEdit(false); loadData();
  };

  const updateDonationStatus = async (id: string, status: string) => {
    await supabase.from("blood_donations").update({ status } as any).eq("id", id);
    toast({ title: `Holat: ${status}` }); loadData();
  };

  const toggleBloodType = (type: string) => {
    setProfileForm(p => ({
      ...p,
      available_blood_types: p.available_blood_types.includes(type)
        ? p.available_blood_types.filter(t => t !== type)
        : [...p.available_blood_types, type],
    }));
  };

  const [tab, setTab] = useState("donations");

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-destructive border-t-transparent rounded-full" /></div>;

  if (!bank) return (
    <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center p-8">
      <Droplets className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">Qon banki topilmadi</h2>
      <p className="text-muted-foreground mb-4">Avval qon bankingizni ro'yxatdan o'tkazing</p>
      <Button onClick={() => window.location.href = "/blood-donor-register"}>Ro'yxatdan o'tish</Button>
    </div></div>
  );

  const pendingCount = donations.filter(d => d.status === "pending").length;
  const completedCount = donations.filter(d => d.status === "completed").length;
  const statusData = [
    { name: "Kutilmoqda", value: pendingCount },
    { name: "Qabul qilindi", value: completedCount },
    { name: "Bekor", value: donations.filter(d => d.status === "cancelled").length },
  ].filter(d => d.value > 0);
  const bloodTypeData = BLOOD_TYPES.map(bt => ({ name: bt, count: donors.filter(d => `${d.blood_group}${d.rh_factor}` === bt).length })).filter(d => d.count > 0);

  const sidebarItems: SidebarItem[] = [
    { id: "donations", label: "Donatsiyalar", icon: Droplets, badge: pendingCount },
    { id: "stats", label: "Statistika", icon: BarChart3 },
    { id: "subscription", label: "Obuna", icon: Crown },
    { id: "attendance", label: "Keldi-Ketdi", icon: ShieldCheck },
    { id: "profile", label: "Profil", icon: Settings },
  ];

  return (
    <DashboardShell title={bank.name} subtitle="Qon banki boshqaruv paneli" icon={Droplets} iconColor="text-destructive" sidebarItems={sidebarItems} activeTab={tab} onTabChange={setTab}>
      {/* Blood types */}
      {tab === "donations" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Faol donorlar", val: donors.length, icon: Users, color: "from-destructive/20 to-destructive/5", iconColor: "text-destructive" },
              { label: "Jami donatsiyalar", val: donations.length, icon: Calendar, color: "from-secondary/20 to-secondary/5", iconColor: "text-secondary" },
              { label: "Kutilmoqda", val: pendingCount, icon: Clock, color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500" },
              { label: "Qabul qilingan", val: completedCount, icon: CheckCircle, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500" },
            ].map(s => (
              <div key={s.label} className={cn("rounded-2xl border border-border p-5 bg-gradient-to-br", s.color)}>
                <s.icon className={cn("w-8 h-8 mb-3", s.iconColor)} />
                <p className="text-2xl font-bold text-foreground">{s.val}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <Card><CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-3">Mavjud qon guruhlari</h3>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map(bt => (
                <Badge key={bt} variant={bank.available_blood_types?.includes(bt) ? "default" : "outline"} className={bank.available_blood_types?.includes(bt) ? "bg-destructive" : ""}>{bt}</Badge>
              ))}
            </div>
          </CardContent></Card>

          {donations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Hali donatsiyalar yo'q</div>
          ) : (
            <div className="space-y-2">
              {donations.map(d => (
                <Card key={d.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{d.donation_date}</p>
                    <Badge variant={d.status === "pending" ? "default" : d.status === "completed" ? "secondary" : "destructive"} className="text-xs mt-1">
                      {d.status === "pending" ? "Kutilmoqda" : d.status === "completed" ? "Qabul qilindi" : "Bekor"}
                    </Badge>
                    {d.notes && <p className="text-xs text-muted-foreground mt-1">📝 {d.notes}</p>}
                  </div>
                  {d.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateDonationStatus(d.id, "completed")}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Qabul qilish
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateDonationStatus(d.id, "cancelled")}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent></Card>
              ))}
            </div>
          )}
        </div>
      )}

        <TabsContent value="stats" className="space-y-4">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Statistika</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="p-5">
              <h3 className="font-medium text-foreground mb-3">Qon guruhlari taqsimoti</h3>
              {bloodTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bloodTypeData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <h3 className="font-medium text-foreground mb-3">Donatsiya holati</h3>
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

        <TabsContent value="subscription" className="space-y-4">
          <BloodBankSubscription />
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
                  <div><Label>Qon banki nomi</Label><Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Telefon</Label><Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Email</Label><Input value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Direktor</Label><Input value={profileForm.director_name} onChange={e => setProfileForm(p => ({ ...p, director_name: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Website</Label><Input value={profileForm.website} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Saqlash hajmi</Label><Input value={profileForm.storage_capacity} onChange={e => setProfileForm(p => ({ ...p, storage_capacity: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><Label>Manzil</Label><Textarea value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} rows={2} className="mt-1" /></div>
                <div>
                  <Label>Mavjud qon guruhlari</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BLOOD_TYPES.map(bt => (
                      <Badge key={bt} variant={profileForm.available_blood_types.includes(bt) ? "default" : "outline"}
                        className={`cursor-pointer ${profileForm.available_blood_types.includes(bt) ? "bg-red-500" : ""}`}
                        onClick={() => toggleBloodType(bt)}>
                        {bt}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveProfile} disabled={saving}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
                  <Button size="sm" variant="outline" onClick={() => setProfileEdit(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Nomi:</span> <span className="font-medium text-foreground">{bank.name}</span></div>
                <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium text-foreground">{bank.phone}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{bank.email || "—"}</span></div>
                <div><span className="text-muted-foreground">Direktor:</span> <span className="font-medium text-foreground">{bank.director_name || "—"}</span></div>
                <div><span className="text-muted-foreground">Hudud:</span> <span className="font-medium text-foreground">{bank.region}, {bank.city}</span></div>
                <div><span className="text-muted-foreground">Turi:</span> <span className="font-medium text-foreground">{bank.org_type}</span></div>
                <div className="md:col-span-2"><span className="text-muted-foreground">Manzil:</span> <span className="font-medium text-foreground">{bank.address}</span></div>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      {tab === "attendance" && <OrgAttendance orgType="bloodbank" orgName={bank.name} />}
    </DashboardShell>
  );
};

export default BloodBankDashboard;
