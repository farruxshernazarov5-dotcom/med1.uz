import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, FlaskConical, Clock, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clinicId: string;
}

const HMSLaboratory = ({ clinicId }: Props) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [results, setResults] = useState<Record<string, any[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [showResultForm, setShowResultForm] = useState<string | null>(null);
  const [form, setForm] = useState({ patient_id: "", test_name: "", test_category: "blood", priority: "normal", notes: "" });
  const [resultForm, setResultForm] = useState({ parameter_name: "", value: "", unit: "", reference_range: "", is_abnormal: false });

  const fetchData = async () => {
    const [ordersRes, patientsRes] = await Promise.all([
      supabase.from("hms_lab_orders").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_patients").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setOrders(ordersRes.data || []);
    setPatients(patientsRes.data || []);

    // Fetch results for each order
    if (ordersRes.data?.length) {
      const { data: allResults } = await supabase
        .from("hms_lab_results")
        .select("*")
        .in("order_id", ordersRes.data.map((o: any) => o.id));
      const grouped: Record<string, any[]> = {};
      (allResults || []).forEach((r: any) => {
        if (!grouped[r.order_id]) grouped[r.order_id] = [];
        grouped[r.order_id].push(r);
      });
      setResults(grouped);
    }
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const handleCreateOrder = async () => {
    if (!form.patient_id || !form.test_name) {
      toast({ title: "Bemor va tahlil nomi majburiy!", variant: "destructive" });
      return;
    }
    await supabase.from("hms_lab_orders").insert({ ...form, clinic_id: clinicId });
    toast({ title: "✅ Tahlil buyurtmasi yaratildi" });
    setShowForm(false);
    setForm({ patient_id: "", test_name: "", test_category: "blood", priority: "normal", notes: "" });
    fetchData();
  };

  const handleAddResult = async (orderId: string) => {
    if (!resultForm.parameter_name || !resultForm.value) {
      toast({ title: "Parametr va qiymat majburiy!", variant: "destructive" });
      return;
    }
    await supabase.from("hms_lab_results").insert({ ...resultForm, order_id: orderId });
    toast({ title: "✅ Natija qo'shildi" });
    setResultForm({ parameter_name: "", value: "", unit: "", reference_range: "", is_abnormal: false });
    fetchData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("hms_lab_orders").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", id);
    toast({ title: `Status: ${status}` });
    fetchData();
  };

  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.full_name || "—";

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Laboratoriya</h2>
        <Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi tahlil</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Yangi tahlil buyurtmasi</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Bemorni tanlang *</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <Input placeholder="Tahlil nomi *" value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.test_category} onChange={(e) => setForm({ ...form, test_category: e.target.value })}>
              <option value="blood">Qon tahlili</option>
              <option value="urine">Siydik tahlili</option>
              <option value="biochemistry">Biokimyoviy</option>
              <option value="hormones">Gormonlar</option>
              <option value="immunology">Immunologiya</option>
              <option value="other">Boshqa</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="normal">Oddiy</option>
              <option value="urgent">Shoshilinch</option>
              <option value="critical">Juda shoshilinch</option>
            </select>
            <Input placeholder="Izoh" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
          </div>
          <Button onClick={handleCreateOrder} className="mt-4">Buyurtma berish</Button>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <FlaskConical className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{order.test_name}</p>
                <p className="text-xs text-muted-foreground">
                  Bemor: {getPatientName(order.patient_id)} • {new Date(order.ordered_at).toLocaleDateString("uz")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {order.priority === "urgent" && <Badge className="bg-orange-100 text-orange-800 text-[10px]">Shoshilinch</Badge>}
                {order.priority === "critical" && <Badge className="bg-red-100 text-red-800 text-[10px]">Juda shoshilinch</Badge>}
                <Badge className={cn("text-[10px]", statusColors[order.status] || "bg-muted text-muted-foreground")}>{order.status}</Badge>
                {order.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "in_progress")}>
                    <Clock className="w-3 h-3 mr-1" /> Boshlash
                  </Button>
                )}
                {order.status === "in_progress" && (
                  <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "completed")}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Tayyor
                  </Button>
                )}
              </div>
            </div>

            {/* Results */}
            {results[order.id]?.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 mb-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left py-1">Parametr</th>
                      <th className="text-left py-1">Qiymat</th>
                      <th className="text-left py-1">Birlik</th>
                      <th className="text-left py-1">Norma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results[order.id].map((r: any) => (
                      <tr key={r.id} className={r.is_abnormal ? "text-destructive font-medium" : "text-foreground"}>
                        <td className="py-1">{r.parameter_name} {r.is_abnormal && <AlertTriangle className="w-3 h-3 inline" />}</td>
                        <td className="py-1">{r.value}</td>
                        <td className="py-1">{r.unit}</td>
                        <td className="py-1">{r.reference_range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add result form */}
            {showResultForm === order.id ? (
              <div className="bg-muted/30 rounded-lg p-3 mt-2">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Input placeholder="Parametr *" value={resultForm.parameter_name} onChange={(e) => setResultForm({ ...resultForm, parameter_name: e.target.value })} className="text-xs" />
                  <Input placeholder="Qiymat *" value={resultForm.value} onChange={(e) => setResultForm({ ...resultForm, value: e.target.value })} className="text-xs" />
                  <Input placeholder="Birlik" value={resultForm.unit} onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })} className="text-xs" />
                  <Input placeholder="Norma" value={resultForm.reference_range} onChange={(e) => setResultForm({ ...resultForm, reference_range: e.target.value })} className="text-xs" />
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={resultForm.is_abnormal} onChange={(e) => setResultForm({ ...resultForm, is_abnormal: e.target.checked })} /> Normadan tashqari</label>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => handleAddResult(order.id)}>Qo'shish</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowResultForm(null)}>Yopish</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowResultForm(order.id)} className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Natija qo'shish
              </Button>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-center py-8 text-muted-foreground">Tahlil buyurtmalari yo'q</p>}
      </div>
    </div>
  );
};

export default HMSLaboratory;
