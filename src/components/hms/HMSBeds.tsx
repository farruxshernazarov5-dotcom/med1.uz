import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plus, BedDouble, User, X, Edit2, Trash2, BarChart3, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props { clinicId: string; }

const BED_TYPES = [
  { value: "standard", label: "Standart", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "icu", label: "Reanimatsiya (ICU)", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  { value: "vip", label: "VIP", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "pediatric", label: "Bolalar", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: "Bo'sh", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" },
  occupied: { label: "Band", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  maintenance: { label: "Ta'mirda", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500" },
  reserved: { label: "Rezerv", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
};

const HMSBeds = ({ clinicId }: Props) => {
  const [beds, setBeds] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ bed_number: "", room_number: "", floor: "", bed_type: "standard", department_id: "", daily_rate: 0 });
  const [activeTab, setActiveTab] = useState("map");
  const [filterDept, setFilterDept] = useState("all");

  const fetchData = async () => {
    const [bedRes, deptRes, patRes] = await Promise.all([
      supabase.from("hms_beds").select("*").eq("clinic_id", clinicId).order("bed_number"),
      supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setBeds(bedRes.data || []);
    setDepartments(deptRes.data || []);
    setPatients(patRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ bed_number: "", room_number: "", floor: "", bed_type: "standard", department_id: "", daily_rate: 0 }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.bed_number) { toast({ title: "To'shak raqami majburiy!", variant: "destructive" }); return; }
    const payload = { ...form, daily_rate: Number(form.daily_rate), clinic_id: clinicId, department_id: form.department_id || null };
    if (editing) {
      await supabase.from("hms_beds").update(payload).eq("id", editing.id);
      toast({ title: "✅ To'shak yangilandi" });
    } else {
      await supabase.from("hms_beds").insert(payload);
      toast({ title: "✅ To'shak qo'shildi" });
    }
    resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_beds").delete().eq("id", id);
    toast({ title: "To'shak o'chirildi" }); fetchData();
  };

  const handleAssignPatient = async (bedId: string, patientId: string | null) => {
    await supabase.from("hms_beds").update({
      patient_id: patientId, status: patientId ? "occupied" : "available",
      admitted_at: patientId ? new Date().toISOString() : null,
    }).eq("id", bedId);
    toast({ title: patientId ? "✅ Bemor joylashtirildi" : "To'shak bo'shatildi" }); fetchData();
  };

  const available = beds.filter(b => b.status === "available").length;
  const occupied = beds.filter(b => b.status === "occupied").length;
  const occupancyRate = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0;
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || "";
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.full_name || "";

  const filteredBeds = useMemo(() => {
    if (filterDept === "all") return beds;
    return beds.filter(b => b.department_id === filterDept);
  }, [beds, filterDept]);

  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    beds.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label || status, value: count
    }));
  }, [beds]);

  const PIE_COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">To'shak va palatalar</h2>
          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
            <span>Jami: <strong className="text-foreground">{beds.length}</strong></span>
            <span>Bo'sh: <strong className="text-green-600">{available}</strong></span>
            <span>Band: <strong className="text-red-600">{occupied}</strong></span>
            <span>Bandlik: <strong className={cn(occupancyRate > 80 ? "text-red-600" : "text-foreground")}>{occupancyRate}%</strong></span>
          </div>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi to'shak</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="map"><BedDouble className="w-3.5 h-3.5 mr-1" />Xarita</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="w-3.5 h-3.5 mr-1" />Statistika</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            <select className="h-9 rounded-md border border-input bg-background px-3 text-xs" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="all">Barcha bo'limlar</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground text-sm">{editing ? "Tahrirlash" : "Yangi to'shak"}</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="To'shak raqami *" value={form.bed_number} onChange={e => setForm({ ...form, bed_number: e.target.value })} />
                <Input placeholder="Xona raqami" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} />
                <Input placeholder="Qavat" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.bed_type} onChange={e => setForm({ ...form, bed_type: e.target.value })}>
                  {BED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">Bo'lim tanlang</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <Input type="number" placeholder="Kunlik narx (so'm)" value={form.daily_rate || ""} onChange={e => setForm({ ...form, daily_rate: Number(e.target.value) })} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          {/* Bed Map */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredBeds.map(bed => {
              const sc = STATUS_CONFIG[bed.status] || STATUS_CONFIG.available;
              const bt = BED_TYPES.find(t => t.value === bed.bed_type);
              return (
                <div key={bed.id} className={cn(
                  "bg-card rounded-xl border p-3 relative group transition-all hover:shadow-md",
                  bed.status === "occupied" ? "border-red-200 dark:border-red-900/50" :
                  bed.status === "available" ? "border-green-200 dark:border-green-900/50" : "border-border"
                )}>
                  {/* Status dot */}
                  <div className={cn("absolute top-2 right-2 w-2.5 h-2.5 rounded-full", sc.dot)} />
                  
                  <div className="flex items-center gap-2 mb-2">
                    <BedDouble className={cn("w-5 h-5", bed.status === "available" ? "text-green-600" : bed.status === "occupied" ? "text-red-500" : "text-yellow-500")} />
                    <span className="font-bold text-foreground text-sm">#{bed.bed_number}</span>
                  </div>

                  <div className="text-[10px] text-muted-foreground space-y-0.5 mb-2">
                    {bed.room_number && <p>Xona: {bed.room_number}{bed.floor ? `, ${bed.floor}-q` : ""}</p>}
                    {getDeptName(bed.department_id) && <p>{getDeptName(bed.department_id)}</p>}
                    {bt && <Badge className={cn("text-[9px]", bt.color)}>{bt.label}</Badge>}
                  </div>

                  {bed.patient_id && (
                    <p className="text-xs text-foreground font-medium flex items-center gap-1 mb-2">
                      <User className="w-3 h-3" /> {getPatientName(bed.patient_id)}
                    </p>
                  )}

                  {bed.daily_rate > 0 && <p className="text-[10px] text-primary font-medium">{Number(bed.daily_rate).toLocaleString()} so'm/kun</p>}

                  <div className="flex gap-1 mt-2">
                    {bed.status === "available" ? (
                      <select className="h-7 rounded-md border border-input bg-background px-1 text-[10px] flex-1" defaultValue="" onChange={e => { if (e.target.value) handleAssignPatient(bed.id, e.target.value); }}>
                        <option value="">Joylashtirish...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                      </select>
                    ) : bed.status === "occupied" ? (
                      <Button size="sm" variant="outline" className="text-[10px] h-7 flex-1" onClick={() => handleAssignPatient(bed.id, null)}>Bo'shatish</Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(bed); setForm({ bed_number: bed.bed_number, room_number: bed.room_number || "", floor: bed.floor || "", bed_type: bed.bed_type, department_id: bed.department_id || "", daily_rate: bed.daily_rate }); setShowForm(true); }}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(bed.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {beds.length === 0 && <p className="text-center py-8 text-muted-foreground">To'shaklar yo'q. Yangi qo'shing!</p>}
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Bandlik holati</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Bo'limlar bo'yicha</h3>
              <div className="space-y-2">
                {departments.map(dept => {
                  const deptBeds = beds.filter(b => b.department_id === dept.id);
                  const deptOccupied = deptBeds.filter(b => b.status === "occupied").length;
                  const rate = deptBeds.length > 0 ? Math.round((deptOccupied / deptBeds.length) * 100) : 0;
                  return (
                    <div key={dept.id} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", rate > 80 ? "bg-red-500" : rate > 50 ? "bg-yellow-500" : "bg-green-500")} style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">{deptOccupied}/{deptBeds.length} ({rate}%)</span>
                      </div>
                    </div>
                  );
                })}
                {departments.length === 0 && <p className="text-sm text-muted-foreground text-center">Bo'limlar yo'q</p>}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSBeds;
