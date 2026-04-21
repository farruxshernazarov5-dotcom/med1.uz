import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Activity, Heart, Droplets, Scale, Thermometer, Plus, TrendingUp, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const METRICS = [
  { key: "systolic", label: "Bosim (yuqori)", unit: "mmHg", color: "#ef4444", icon: Droplets },
  { key: "heart_rate", label: "Yurak urishi", unit: "bpm", color: "#f43f5e", icon: Heart },
  { key: "spo2", label: "SpO₂", unit: "%", color: "#3b82f6", icon: Activity },
  { key: "glucose", label: "Qand", unit: "mmol/l", color: "#f59e0b", icon: Droplets },
  { key: "weight_kg", label: "Vazn", unit: "kg", color: "#10b981", icon: Scale },
  { key: "temperature", label: "Harorat", unit: "°C", color: "#8b5cf6", icon: Thermometer },
];

const PatientHealthTracking = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [family, setFamily] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("systolic");
  const [filterMember, setFilterMember] = useState<string>("self");
  const [form, setForm] = useState<any>({
    log_date: new Date().toISOString().slice(0, 10),
    family_member_id: "",
    systolic: "", diastolic: "", heart_rate: "", spo2: "",
    glucose: "", weight_kg: "", height_cm: "", temperature: "", notes: "",
  });

  const fetchData = async () => {
    if (!user) return;
    const [logsRes, famRes] = await Promise.all([
      supabase.from("patient_health_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: true }),
      supabase.from("family_members").select("id, full_name").eq("user_id", user.id),
    ]);
    setLogs(logsRes.data || []);
    setFamily(famRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const save = async () => {
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      log_date: form.log_date,
      family_member_id: form.family_member_id || null,
      notes: form.notes || null,
    };
    ["systolic", "diastolic", "heart_rate", "spo2", "glucose", "weight_kg", "height_cm", "temperature"].forEach(k => {
      if (form[k]) payload[k] = parseFloat(form[k]);
    });
    const { error } = await supabase.from("patient_health_logs").insert(payload);
    if (error) return toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    toast({ title: "Saqlandi ✅" });
    setOpen(false);
    setForm({ ...form, systolic: "", diastolic: "", heart_rate: "", spo2: "", glucose: "", weight_kg: "", height_cm: "", temperature: "", notes: "" });
    fetchData();
  };

  const remove = async (id: string) => {
    await supabase.from("patient_health_logs").delete().eq("id", id);
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const filtered = logs.filter(l => filterMember === "self" ? !l.family_member_id : l.family_member_id === filterMember);
  const metric = METRICS.find(m => m.key === selectedMetric)!;
  const chartData = filtered
    .filter(l => l[selectedMetric] != null)
    .map(l => ({ date: new Date(l.log_date).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" }), value: l[selectedMetric] }));

  const latest = filtered[filtered.length - 1];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">📊 Sog'liq monitoring</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-hero-gradient text-primary-foreground border-0">
              <Plus className="w-4 h-4 mr-1" /> Yangi yozuv
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Sog'liq ko'rsatkichlari</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Sana</Label>
                <Input type="date" value={form.log_date} onChange={e => setForm({ ...form, log_date: e.target.value })} />
              </div>
              {family.length > 0 && (
                <div>
                  <Label>Kim uchun</Label>
                  <Select value={form.family_member_id || "self"} onValueChange={v => setForm({ ...form, family_member_id: v === "self" ? "" : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">O'zim</SelectItem>
                      {family.map(f => <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Sistolik</Label><Input type="number" placeholder="120" value={form.systolic} onChange={e => setForm({ ...form, systolic: e.target.value })} /></div>
                <div><Label className="text-xs">Diastolik</Label><Input type="number" placeholder="80" value={form.diastolic} onChange={e => setForm({ ...form, diastolic: e.target.value })} /></div>
                <div><Label className="text-xs">Yurak urishi</Label><Input type="number" placeholder="72" value={form.heart_rate} onChange={e => setForm({ ...form, heart_rate: e.target.value })} /></div>
                <div><Label className="text-xs">SpO₂ (%)</Label><Input type="number" placeholder="98" value={form.spo2} onChange={e => setForm({ ...form, spo2: e.target.value })} /></div>
                <div><Label className="text-xs">Qand (mmol/l)</Label><Input type="number" step="0.1" placeholder="5.5" value={form.glucose} onChange={e => setForm({ ...form, glucose: e.target.value })} /></div>
                <div><Label className="text-xs">Harorat (°C)</Label><Input type="number" step="0.1" placeholder="36.6" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} /></div>
                <div><Label className="text-xs">Vazn (kg)</Label><Input type="number" step="0.1" placeholder="70" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} /></div>
                <div><Label className="text-xs">Bo'y (sm)</Label><Input type="number" placeholder="170" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">Izoh</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={save} className="w-full bg-hero-gradient text-primary-foreground border-0">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {family.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setFilterMember("self")} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${filterMember === "self" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>O'zim</button>
          {family.map(f => (
            <button key={f.id} onClick={() => setFilterMember(f.id)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${filterMember === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f.full_name}</button>
          ))}
        </div>
      )}

      {/* Latest values */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {METRICS.map(m => {
          const v = latest?.[m.key];
          return (
            <div key={m.key} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{v != null ? `${v} ${m.unit}` : "—"}</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Dinamika</h3>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 mb-3">
          {METRICS.map(m => (
            <button key={m.key} onClick={() => setSelectedMetric(m.key)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${selectedMetric === m.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{m.label}</button>
          ))}
        </div>
        {chartData.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">Ma'lumot yo'q</div>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit={` ${metric.unit}`} width={70} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* History */}
      <h3 className="font-semibold text-foreground mb-3">Yozuvlar tarixi</h3>
      {loading ? <p className="text-sm text-muted-foreground">Yuklanmoqda...</p> :
        filtered.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Yozuvlar yo'q</p> :
        <div className="space-y-2">
          {[...filtered].reverse().slice(0, 20).map(l => (
            <div key={l.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{new Date(l.log_date).toLocaleDateString("uz-UZ")}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {l.systolic && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600">{l.systolic}/{l.diastolic} mmHg</span>}
                  {l.heart_rate && <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-600">❤️ {l.heart_rate} bpm</span>}
                  {l.spo2 && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">SpO₂ {l.spo2}%</span>}
                  {l.glucose && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">{l.glucose} mmol/l</span>}
                  {l.weight_kg && <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600">{l.weight_kg} kg</span>}
                  {l.temperature && <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-600">{l.temperature}°C</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(l.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      }
    </div>
  );
};

export default PatientHealthTracking;
