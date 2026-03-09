import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Users, Wallet, Clock, X, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Props {
  clinicId: string;
}

const HMSPayroll = ({ clinicId }: Props) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [staffForm, setStaffForm] = useState({ full_name: "", role: "nurse", department: "", phone: "", email: "", salary: 0 });
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ staff_id: "", period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), base_salary: 0, bonus: 0, deductions: 0 });

  const fetchData = async () => {
    const [staffRes, attRes, payRes] = await Promise.all([
      supabase.from("hms_staff").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("created_at"),
      supabase.from("hms_attendance").select("*").eq("clinic_id", clinicId).order("attendance_date", { ascending: false }).limit(100),
      supabase.from("hms_payroll").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
    ]);
    setStaff(staffRes.data || []);
    setAttendance(attRes.data || []);
    setPayroll(payRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const handleSaveStaff = async () => {
    if (!staffForm.full_name) { toast({ title: "Ism majburiy!", variant: "destructive" }); return; }
    if (editingStaff) {
      await supabase.from("hms_staff").update({ ...staffForm, salary: Number(staffForm.salary) }).eq("id", editingStaff.id);
      toast({ title: "✅ Xodim yangilandi" });
    } else {
      await supabase.from("hms_staff").insert({ ...staffForm, salary: Number(staffForm.salary), clinic_id: clinicId });
      toast({ title: "✅ Xodim qo'shildi" });
    }
    setShowStaffForm(false);
    setEditingStaff(null);
    setStaffForm({ full_name: "", role: "nurse", department: "", phone: "", email: "", salary: 0 });
    fetchData();
  };

  const handleDeleteStaff = async (id: string) => {
    await supabase.from("hms_staff").update({ is_active: false }).eq("id", id);
    toast({ title: "Xodim o'chirildi" });
    fetchData();
  };

  const handleMarkAttendance = async (staffId: string, status: string) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toTimeString().slice(0, 5);
    const existing = attendance.find((a) => a.staff_id === staffId && a.attendance_date === today);
    if (existing) {
      await supabase.from("hms_attendance").update({ check_out: now, status }).eq("id", existing.id);
    } else {
      await supabase.from("hms_attendance").insert({ staff_id: staffId, clinic_id: clinicId, attendance_date: today, check_in: now, status });
    }
    toast({ title: "✅ Davomat belgilandi" });
    fetchData();
  };

  const handleCreatePayroll = async () => {
    if (!payrollForm.staff_id) { toast({ title: "Xodimni tanlang!", variant: "destructive" }); return; }
    const total = Number(payrollForm.base_salary) + Number(payrollForm.bonus) - Number(payrollForm.deductions);
    await supabase.from("hms_payroll").insert({
      ...payrollForm,
      base_salary: Number(payrollForm.base_salary),
      bonus: Number(payrollForm.bonus),
      deductions: Number(payrollForm.deductions),
      total_paid: total,
      clinic_id: clinicId,
    });
    toast({ title: "✅ Ish haqi hisoblandi" });
    setShowPayrollForm(false);
    setPayrollForm({ staff_id: "", period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), base_salary: 0, bonus: 0, deductions: 0 });
    fetchData();
  };

  const roleLabels: Record<string, string> = {
    nurse: "Hamshira", doctor: "Shifokor", lab_tech: "Laborant", receptionist: "Qabulxona",
    pharmacist: "Farmatsevt", accountant: "Buxgalter", admin: "Administrator", other: "Boshqa",
  };

  const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

  return (
    <div>
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
          <TabsTrigger value="staff"><Users className="w-4 h-4 mr-1" /> Xodimlar</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="w-4 h-4 mr-1" /> Davomat</TabsTrigger>
          <TabsTrigger value="payroll"><Wallet className="w-4 h-4 mr-1" /> Ish haqi</TabsTrigger>
        </TabsList>

        {/* Staff */}
        <TabsContent value="staff">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Xodimlar ({staff.length})</h3>
            <Button size="sm" onClick={() => { setShowStaffForm(true); setEditingStaff(null); setStaffForm({ full_name: "", role: "nurse", department: "", phone: "", email: "", salary: 0 }); }}>
              <Plus className="w-4 h-4 mr-1" /> Yangi xodim
            </Button>
          </div>

          {showStaffForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="To'liq ism *" value={staffForm.full_name} onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                  {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Input placeholder="Bo'lim" value={staffForm.department} onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })} />
                <Input placeholder="Telefon" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
                <Input placeholder="Email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
                <Input type="number" placeholder="Maosh (so'm)" value={staffForm.salary || ""} onChange={(e) => setStaffForm({ ...staffForm, salary: Number(e.target.value) })} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSaveStaff}>{editingStaff ? "Yangilash" : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowStaffForm(false)}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {staff.map((s) => (
              <div key={s.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{s.full_name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{roleLabels[s.role] || s.role}</Badge>
                    {s.department && <span>{s.department}</span>}
                    {s.salary > 0 && <span className="text-primary font-medium">{Number(s.salary).toLocaleString()} so'm</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingStaff(s); setStaffForm({ full_name: s.full_name, role: s.role, department: s.department || "", phone: s.phone || "", email: s.email || "", salary: s.salary }); setShowStaffForm(true); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(s.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance">
          <h3 className="font-heading font-bold text-foreground mb-4">Bugungi davomat</h3>
          <div className="space-y-2">
            {staff.map((s) => {
              const today = new Date().toISOString().split("T")[0];
              const todayAtt = attendance.find((a) => a.staff_id === s.id && a.attendance_date === today);
              return (
                <div key={s.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{roleLabels[s.role] || s.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {todayAtt ? (
                      <>
                        <Badge className={cn("text-[10px]",
                          todayAtt.status === "present" ? "bg-green-100 text-green-800" :
                          todayAtt.status === "late" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>{todayAtt.status === "present" ? "Keldi" : todayAtt.status === "late" ? "Kechikdi" : "Kelmadi"}</Badge>
                        <span className="text-xs text-muted-foreground">{todayAtt.check_in?.slice(0, 5)} - {todayAtt.check_out?.slice(0, 5) || "..."}</span>
                      </>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(s.id, "present")} className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" /> Keldi
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(s.id, "late")} className="text-xs">
                          <Clock className="w-3 h-3 mr-1 text-yellow-600" /> Kechikdi
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(s.id, "absent")} className="text-xs">
                          <X className="w-3 h-3 mr-1 text-red-500" /> Kelmadi
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Payroll */}
        <TabsContent value="payroll">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Ish haqi</h3>
            <Button size="sm" onClick={() => setShowPayrollForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Yangi hisoblash
            </Button>
          </div>

          {showPayrollForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={payrollForm.staff_id} onChange={(e) => {
                  const s = staff.find((x) => x.id === e.target.value);
                  setPayrollForm({ ...payrollForm, staff_id: e.target.value, base_salary: s?.salary || 0 });
                }}>
                  <option value="">Xodimni tanlang *</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={payrollForm.period_month} onChange={(e) => setPayrollForm({ ...payrollForm, period_month: Number(e.target.value) })}>
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <Input type="number" placeholder="Yil" value={payrollForm.period_year} onChange={(e) => setPayrollForm({ ...payrollForm, period_year: Number(e.target.value) })} />
                <Input type="number" placeholder="Asosiy maosh" value={payrollForm.base_salary || ""} onChange={(e) => setPayrollForm({ ...payrollForm, base_salary: Number(e.target.value) })} />
                <Input type="number" placeholder="Bonus" value={payrollForm.bonus || ""} onChange={(e) => setPayrollForm({ ...payrollForm, bonus: Number(e.target.value) })} />
                <Input type="number" placeholder="Ushlab qolish" value={payrollForm.deductions || ""} onChange={(e) => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Jami: <span className="font-bold text-foreground">{(Number(payrollForm.base_salary) + Number(payrollForm.bonus) - Number(payrollForm.deductions)).toLocaleString()} so'm</span>
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleCreatePayroll}>Hisoblash</Button>
                <Button size="sm" variant="outline" onClick={() => setShowPayrollForm(false)}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {payroll.map((p) => {
              const s = staff.find((x) => x.id === p.staff_id);
              return (
                <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{s?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{months[p.period_month - 1]} {p.period_year}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">Maosh: {Number(p.base_salary).toLocaleString()}</span>
                    {p.bonus > 0 && <span className="text-green-600">+{Number(p.bonus).toLocaleString()}</span>}
                    {p.deductions > 0 && <span className="text-red-500">-{Number(p.deductions).toLocaleString()}</span>}
                    <span className="font-bold text-primary text-sm">{Number(p.total_paid).toLocaleString()} so'm</span>
                    <Badge className={cn("text-[10px]", p.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                      {p.status === "paid" ? "To'langan" : "Kutilmoqda"}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {payroll.length === 0 && <p className="text-center py-8 text-muted-foreground">Ish haqi hisoblari yo'q</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSPayroll;
