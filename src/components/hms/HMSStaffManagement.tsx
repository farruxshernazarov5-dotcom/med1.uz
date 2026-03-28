import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, User, Phone, Edit2, Trash2, X, Users, UserCheck,
  Calendar, Briefcase, DollarSign, Star, Shield, Clock, ChevronLeft, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

interface Props { clinicId: string; }

const ROLES = [
  { value: "doctor", label: "Shifokor" },
  { value: "nurse", label: "Hamshira" },
  { value: "lab_technician", label: "Laborant" },
  { value: "receptionist", label: "Registrator" },
  { value: "admin", label: "Administrator" },
  { value: "pharmacist", label: "Farmatsevt" },
  { value: "accountant", label: "Buxgalter" },
  { value: "other", label: "Boshqa" },
];

const HMSStaffManagement = ({ clinicId }: Props) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [staffTab, setStaffTab] = useState("profile");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", role: "doctor",
    department: "", salary: "", hire_date: "",
  });

  const fetchData = async () => {
    const [staffRes, deptRes] = await Promise.all([
      supabase.from("hms_staff").select("*").eq("clinic_id", clinicId)
        .eq("is_active", filterStatus === "active")
        .order("created_at", { ascending: false }),
      supabase.from("hms_departments").select("*").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setStaff(staffRes.data || []);
    setDepartments(deptRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId, filterStatus]);

  const fetchStaffDetails = async (s: any) => {
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = new Date().getMonth() + 1;
    const thisYear = new Date().getFullYear();

    const [attRes, payRes] = await Promise.all([
      supabase.from("hms_attendance").select("*").eq("staff_id", s.id).order("attendance_date", { ascending: false }).limit(30),
      supabase.from("hms_payroll").select("*").eq("staff_id", s.id).order("period_year", { ascending: false }).limit(12),
    ]);
    setAttendance(attRes.data || []);
    setPayroll(payRes.data || []);
  };

  const openStaff = (s: any) => {
    setSelectedStaff(s);
    setStaffTab("profile");
    fetchStaffDetails(s);
  };

  const resetForm = () => {
    setForm({ full_name: "", phone: "", email: "", role: "doctor", department: "", salary: "", hire_date: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.role) {
      toast({ title: "Ism va lavozim majburiy!", variant: "destructive" });
      return;
    }
    const payload = {
      full_name: form.full_name, phone: form.phone || null, email: form.email || null,
      role: form.role, department: form.department || null,
      salary: form.salary ? Number(form.salary) : null,
      hire_date: form.hire_date || null, clinic_id: clinicId,
    };
    if (editing) {
      await supabase.from("hms_staff").update(payload).eq("id", editing.id);
      toast({ title: "✅ Xodim yangilandi" });
    } else {
      await supabase.from("hms_staff").insert(payload);
      toast({ title: "✅ Xodim qo'shildi" });
    }
    resetForm();
    fetchData();
  };

  const handleEdit = (s: any) => {
    setForm({
      full_name: s.full_name, phone: s.phone || "", email: s.email || "",
      role: s.role, department: s.department || "",
      salary: s.salary ? String(s.salary) : "", hire_date: s.hire_date || "",
    });
    setEditing(s);
    setShowForm(true);
    setSelectedStaff(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hms_staff").update({ is_active: false }).eq("id", id);
    toast({ title: "Xodim o'chirildi" });
    fetchData();
    if (selectedStaff?.id === id) setSelectedStaff(null);
  };

  const filtered = useMemo(() => staff.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search));
    const matchRole = filterRole === "all" || s.role === filterRole;
    const matchDept = filterDept === "all" || s.department === filterDept;
    return matchSearch && matchRole && matchDept;
  }), [staff, search, filterRole, filterDept]);

  const stats = useMemo(() => ({
    total: staff.length,
    doctors: staff.filter(s => s.role === "doctor").length,
    nurses: staff.filter(s => s.role === "nurse").length,
    totalSalary: staff.reduce((sum, s) => sum + (s.salary || 0), 0),
  }), [staff]);

  const getRoleLabel = (role: string) => ROLES.find(r => r.value === role)?.label || role;

  const reportData: HMSReportData = {
    title: "Xodimlar hisoboti",
    moduleType: "HMS Xodimlar",
    kpiCards: [
      { label: "Jami xodimlar", value: String(stats.total) },
      { label: "Shifokorlar", value: String(stats.doctors) },
      { label: "Hamshiralar", value: String(stats.nurses) },
      { label: "Umumiy maosh", value: stats.totalSalary.toLocaleString() + " so'm" },
    ],
    tables: staff.length > 0 ? [{
      title: "Xodimlar ro'yxati",
      table: {
        headers: ["Ism", "Lavozim", "Bo'lim", "Telefon", "Maosh"],
        rows: staff.slice(0, 100).map(s => [
          s.full_name, getRoleLabel(s.role), s.department || "-",
          s.phone || "-", s.salary ? s.salary.toLocaleString() + " so'm" : "-"
        ])
      }
    }] : undefined,
  };

  // ============ STAFF DETAIL VIEW ============
  if (selectedStaff) {
    const s = selectedStaff;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedStaff(null)} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Orqaga
        </Button>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{s.full_name}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline">{getRoleLabel(s.role)}</Badge>
                {s.department && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{s.department}</span>}
                {s.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{s.phone}</span>}
                {s.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{s.email}</span>}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleEdit(s)}><Edit2 className="w-3.5 h-3.5 mr-1" /> Tahrirlash</Button>
          </div>
        </div>

        <Tabs value={staffTab} onValueChange={setStaffTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="profile"><User className="w-3.5 h-3.5 mr-1" />Profil</TabsTrigger>
            <TabsTrigger value="attendance"><Calendar className="w-3.5 h-3.5 mr-1" />Davomat</TabsTrigger>
            <TabsTrigger value="salary"><DollarSign className="w-3.5 h-3.5 mr-1" />Maosh</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Shaxsiy ma'lumotlar</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Lavozim:</span><br/>{getRoleLabel(s.role)}</div>
                  <div><span className="text-muted-foreground">Bo'lim:</span><br/>{s.department || "—"}</div>
                  <div><span className="text-muted-foreground">Ish boshlagan:</span><br/>{s.hire_date || "—"}</div>
                  <div><span className="text-muted-foreground">Maosh:</span><br/>{s.salary ? s.salary.toLocaleString() + " so'm" : "—"}</div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> Statistika</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-foreground">{attendance.filter(a => a.status === "present").length}</p>
                    <p className="text-xs text-muted-foreground">Kelgan kunlar</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-foreground">{attendance.filter(a => a.status === "absent").length}</p>
                    <p className="text-xs text-muted-foreground">Kelmagan</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="mt-4">
            {attendance.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Davomat ma'lumotlari topilmadi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Sana</TableHead>
                    <TableHead className="text-xs">Kelish</TableHead>
                    <TableHead className="text-xs">Ketish</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Izoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{a.attendance_date}</TableCell>
                      <TableCell className="text-xs">{a.check_in || "—"}</TableCell>
                      <TableCell className="text-xs">{a.check_out || "—"}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px]",
                          a.status === "present" ? "bg-green-100 text-green-800" :
                          a.status === "late" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        )}>{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{a.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="salary" className="mt-4">
            {payroll.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Maosh ma'lumotlari topilmadi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Davr</TableHead>
                    <TableHead className="text-xs">Asosiy maosh</TableHead>
                    <TableHead className="text-xs">Bonus</TableHead>
                    <TableHead className="text-xs">Ushlamalar</TableHead>
                    <TableHead className="text-xs">Jami</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.period_month}/{p.period_year}</TableCell>
                      <TableCell className="text-xs">{(p.base_salary || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-green-600">+{(p.bonus || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-destructive">-{(p.deductions || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-bold">{(p.total_paid || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px]",
                          p.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        )}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ============ STAFF LIST VIEW ============
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Jami xodimlar", value: stats.total, icon: Users, color: "text-primary" },
          { label: "Shifokorlar", value: stats.doctors, icon: UserCheck, color: "text-blue-500" },
          { label: "Hamshiralar", value: stats.nurses, icon: Shield, color: "text-pink-500" },
          { label: "Maosh fondi", value: stats.totalSalary.toLocaleString(), icon: DollarSign, color: "text-green-500" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("w-4 h-4", s.color)} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Xodimlar boshqaruvi</h2>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full sm:w-48" />
          </div>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">Barcha lavozim</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
          <HMSDownloadMenu data={reportData} />
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Yangi xodim
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">
              {editing ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
            </h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="To'liq ism *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input placeholder="Telefon (+998)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              <option value="">Bo'limni tanlang</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <Input type="number" placeholder="Maosh (so'm)" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            <Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave}>{editing ? "Yangilash" : "Saqlash"}</Button>
            <Button variant="outline" onClick={resetForm}>Bekor qilish</Button>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-3">Jami: {filtered.length} xodim</p>

      {/* Staff Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Xodim</TableHead>
              <TableHead className="text-xs">Lavozim</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Bo'lim</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Telefon</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Maosh</TableHead>
              <TableHead className="text-xs text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openStaff(s)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-medium text-sm text-foreground">{s.full_name}</p>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{getRoleLabel(s.role)}</Badge></TableCell>
                <TableCell className="text-xs hidden md:table-cell">{s.department || "—"}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{s.phone || "—"}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{s.salary ? s.salary.toLocaleString() + " so'm" : "—"}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(s)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Xodimlar topilmadi</p>}
      </div>
    </div>
  );
};

export default HMSStaffManagement;
