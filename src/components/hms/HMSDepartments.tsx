import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Building, X, Edit2, Trash2, Users, BarChart3, BedDouble,
  TrendingUp, ChevronRight, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props { clinicId: string; }

const SPECIALTIES = [
  "Terapiya", "Kardiologiya", "Nevrologiya", "Xirurgiya", "Pediatriya",
  "Ginekologiya", "Ortopediya", "Oftalmologiya", "Dermatologiya",
  "Laboratoriya", "Stomatologiya", "Otorinolaringologiya", "Urologiya", "Boshqa"
];

const PIE_COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

const HMSDepartments = ({ clinicId }: Props) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", floor: "", room_count: 0, head_staff_id: "" });
  const [activeTab, setActiveTab] = useState("list");
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<any>(null);

  const fetchData = async () => {
    const [deptRes, staffRes, bedRes] = await Promise.all([
      supabase.from("hms_departments").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("name"),
      supabase.from("hms_staff").select("id, full_name, role, department_id").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_beds").select("id, department_id, status").eq("clinic_id", clinicId),
    ]);
    setDepartments(deptRes.data || []);
    setStaff(staffRes.data || []);
    setBeds(bedRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ name: "", description: "", floor: "", room_count: 0, head_staff_id: "" }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Bo'lim nomi majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, room_count: Number(form.room_count), head_staff_id: form.head_staff_id || null, clinic_id: clinicId };
    if (editing) {
      await supabase.from("hms_departments").update(payload).eq("id", editing.id);
      toast({ title: "✅ Bo'lim yangilandi" });
    } else {
      await supabase.from("hms_departments").insert(payload);
      toast({ title: "✅ Bo'lim qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_departments").update({ is_active: false }).eq("id", id);
    toast({ title: "Bo'lim o'chirildi" }); fetchData();
  };

  const getStaffName = (id: string) => staff.find(s => s.id === id)?.full_name || "";
  const getDeptBeds = (id: string) => beds.filter(b => b.department_id === id);
  const getDeptStaff = (id: string) => staff.filter(s => s.department_id === id);

  const filteredDepts = useMemo(() => departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  ), [departments, search]);

  const deptStaffChart = useMemo(() =>
    departments.map(d => ({
      name: d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name,
      staff: getDeptStaff(d.id).length,
      beds: getDeptBeds(d.id).length,
    })), [departments, staff, beds]);

  // Detail view
  if (selectedDept) {
    const dept = selectedDept;
    const deptStaff = getDeptStaff(dept.id);
    const deptBeds = getDeptBeds(dept.id);
    const occupiedBeds = deptBeds.filter(b => b.status === "occupied").length;

    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedDept(null)} className="mb-4">
          ← Orqaga
        </Button>
        <div className="bg-card rounded-2xl border border-border p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">{dept.name}</h2>
              {dept.description && <p className="text-sm text-muted-foreground">{dept.description}</p>}
              {dept.floor && <p className="text-xs text-muted-foreground">{dept.floor}-qavat</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Xodimlar</p>
              <p className="text-xl font-bold text-foreground">{deptStaff.length}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">To'shaklar</p>
              <p className="text-xl font-bold text-foreground">{deptBeds.length}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Band</p>
              <p className="text-xl font-bold text-red-600">{occupiedBeds}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Xonalar</p>
              <p className="text-xl font-bold text-foreground">{dept.room_count || 0}</p>
            </div>
          </div>

          {getStaffName(dept.head_staff_id) && (
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Bo'lim boshlig'i:</strong> {getStaffName(dept.head_staff_id)}
            </p>
          )}

          {deptStaff.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Xodimlar</h4>
              <div className="space-y-1">
                {deptStaff.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-sm text-foreground">{s.full_name}</span>
                    <Badge variant="outline" className="text-[10px]">{s.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Bo'limlar ({departments.length})</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi bo'lim</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list"><Building className="w-3.5 h-3.5 mr-1" />Ro'yxat</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="w-3.5 h-3.5 mr-1" />Statistika</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Bo'lim qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground text-sm">{editing ? "Tahrirlash" : "Yangi bo'lim"}</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Bo'lim nomi *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="Qavat" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
                <Input type="number" placeholder="Xonalar soni" value={form.room_count || ""} onChange={e => setForm({ ...form, room_count: Number(e.target.value) })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.head_staff_id} onChange={e => setForm({ ...form, head_staff_id: e.target.value })}>
                  <option value="">Bo'lim boshlig'i</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepts.map(dept => {
              const deptBeds = getDeptBeds(dept.id);
              const deptStaffList = getDeptStaff(dept.id);
              const availableBeds = deptBeds.filter(b => b.status === "available").length;
              return (
                <div key={dept.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDept(dept)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-foreground text-sm">{dept.name}</h3>
                        {dept.floor && <p className="text-xs text-muted-foreground">{dept.floor}-qavat</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditing(dept); setForm({ name: dept.name, description: dept.description || "", floor: dept.floor || "", room_count: dept.room_count, head_staff_id: dept.head_staff_id || "" }); setShowForm(true); }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDelete(dept.id); }}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {dept.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{dept.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px]"><Users className="w-3 h-3 mr-1" /> {deptStaffList.length} xodim</Badge>
                    <Badge variant="outline" className="text-[10px]"><BedDouble className="w-3 h-3 mr-1" /> {deptBeds.length} to'shak ({availableBeds} bo'sh)</Badge>
                    {dept.room_count > 0 && <Badge variant="outline" className="text-[10px]">{dept.room_count} xona</Badge>}
                    {getStaffName(dept.head_staff_id) && <Badge variant="outline" className="text-[10px]">Boshlig': {getStaffName(dept.head_staff_id)}</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
          {departments.length === 0 && <p className="text-center py-8 text-muted-foreground">Bo'limlar yo'q</p>}
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Xodimlar va to'shaklar</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deptStaffChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="staff" fill="hsl(var(--primary))" name="Xodimlar" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="beds" fill="#22c55e" name="To'shaklar" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Bo'lim bandligi</h3>
              <div className="space-y-3">
                {departments.map(dept => {
                  const deptBeds = getDeptBeds(dept.id);
                  const occ = deptBeds.filter(b => b.status === "occupied").length;
                  const rate = deptBeds.length > 0 ? Math.round((occ / deptBeds.length) * 100) : 0;
                  return (
                    <div key={dept.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-foreground font-medium">{dept.name}</span>
                        <span className="text-muted-foreground">{rate}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", rate > 80 ? "bg-red-500" : rate > 50 ? "bg-yellow-500" : "bg-green-500")} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSDepartments;
