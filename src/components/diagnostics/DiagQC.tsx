import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, X, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface QC {
  id: string;
  clinic_id: string;
  qc_date: string;
  test_name: string;
  instrument: string | null;
  reagent_lot: string | null;
  control_level: string | null;
  expected_value: number | null;
  measured_value: number | null;
  unit: string | null;
  deviation_percent: number | null;
  status: string;
  notes: string | null;
}

interface Props { centerId: string; }

const DiagQC = ({ centerId }: Props) => {
  const [list, setList] = useState<QC[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterTest, setFilterTest] = useState("");
  const [form, setForm] = useState({
    qc_date: new Date().toISOString().slice(0, 10),
    test_name: "", instrument: "", reagent_lot: "",
    control_level: "Normal", expected_value: "", measured_value: "",
    unit: "", notes: "",
  });

  const load = async () => {
    const { data } = await supabase.from("diagnostics_qc_runs" as any)
      .select("*").eq("clinic_id", centerId).order("qc_date", { ascending: false }).limit(200) as any;
    setList(data || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const reset = () => {
    setForm({
      qc_date: new Date().toISOString().slice(0, 10),
      test_name: "", instrument: "", reagent_lot: "",
      control_level: "Normal", expected_value: "", measured_value: "",
      unit: "", notes: "",
    });
    setShowForm(false);
  };

  const computeStatus = (expected: number, measured: number): { status: string; dev: number } => {
    if (!expected) return { status: "pending", dev: 0 };
    const dev = ((measured - expected) / expected) * 100;
    const abs = Math.abs(dev);
    let status = "pass";
    if (abs > 20) status = "fail";
    else if (abs > 10) status = "warning";
    return { status, dev: Number(dev.toFixed(2)) };
  };

  const save = async () => {
    if (!form.test_name.trim() || !form.measured_value) {
      toast({ title: "Test va o'lchov majburiy", variant: "destructive" });
      return;
    }
    const expected = parseFloat(form.expected_value) || 0;
    const measured = parseFloat(form.measured_value);
    const { status, dev } = computeStatus(expected, measured);
    const { error } = await supabase.from("diagnostics_qc_runs" as any).insert({
      clinic_id: centerId,
      qc_date: form.qc_date,
      test_name: form.test_name.trim(),
      instrument: form.instrument.trim() || null,
      reagent_lot: form.reagent_lot.trim() || null,
      control_level: form.control_level || null,
      expected_value: expected || null,
      measured_value: measured,
      unit: form.unit.trim() || null,
      deviation_percent: dev,
      status,
      notes: form.notes.trim() || null,
    });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: status === "pass" ? "✅ QC o'tdi" : status === "warning" ? "⚠️ Ogohlantirish" : "❌ QC o'tmadi" });
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("diagnostics_qc_runs" as any).delete().eq("id", id);
    load();
  };

  const tests = useMemo(() => Array.from(new Set(list.map(q => q.test_name))), [list]);
  const filtered = filterTest ? list.filter(q => q.test_name === filterTest) : list;

  const stats = useMemo(() => {
    const total = list.length;
    const pass = list.filter(q => q.status === "pass").length;
    const warn = list.filter(q => q.status === "warning").length;
    const fail = list.filter(q => q.status === "fail").length;
    return { total, pass, warn, fail, rate: total ? Math.round((pass / total) * 100) : 0 };
  }, [list]);

  const chartData = useMemo(() => {
    if (!filterTest) return [];
    return [...filtered].reverse().slice(-30).map(q => ({
      date: new Date(q.qc_date).toLocaleDateString("uz", { month: "short", day: "numeric" }),
      value: q.measured_value,
      expected: q.expected_value,
    }));
  }, [filtered, filterTest]);

  const statusBadge = (s: string) => {
    if (s === "pass") return <Badge className="bg-green-500 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />O'tdi</Badge>;
    if (s === "warning") return <Badge className="bg-yellow-500 text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />Ogoh</Badge>;
    if (s === "fail") return <Badge variant="destructive" className="text-[10px]"><X className="w-3 h-3 mr-1" />O'tmadi</Badge>;
    return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">QC — Sifat nazorati</h2>
            <p className="text-xs text-muted-foreground">Kontrol o'lchovlar va deviatsiya tahlili</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> QC o'lchov</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Jami o'lchov</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Muvaffaqiyat</p>
          <p className="text-2xl font-bold text-green-600">{stats.rate}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Ogohlantirish</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.warn}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Xato</p>
          <p className="text-2xl font-bold text-red-600">{stats.fail}</p>
        </CardContent></Card>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Yangi QC o'lchov</CardTitle>
            <Button variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Sana</Label>
                <Input type="date" value={form.qc_date} onChange={e => setForm({ ...form, qc_date: e.target.value })} />
              </div>
              <div>
                <Label>Test nomi *</Label>
                <Input value={form.test_name} onChange={e => setForm({ ...form, test_name: e.target.value })} placeholder="Glukoza, HbA1c..." />
              </div>
              <div>
                <Label>Asbob</Label>
                <Input value={form.instrument} onChange={e => setForm({ ...form, instrument: e.target.value })} />
              </div>
              <div>
                <Label>Reagent lot</Label>
                <Input value={form.reagent_lot} onChange={e => setForm({ ...form, reagent_lot: e.target.value })} />
              </div>
              <div>
                <Label>Kontrol darajasi</Label>
                <select value={form.control_level} onChange={e => setForm({ ...form, control_level: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                  <option value="Low">Past</option>
                  <option value="Normal">Normal</option>
                  <option value="High">Yuqori</option>
                </select>
              </div>
              <div>
                <Label>Birlik</Label>
                <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="mmol/L" />
              </div>
              <div>
                <Label>Kutilgan qiymat</Label>
                <Input type="number" step="0.01" value={form.expected_value}
                  onChange={e => setForm({ ...form, expected_value: e.target.value })} />
              </div>
              <div>
                <Label>O'lchangan qiymat *</Label>
                <Input type="number" step="0.01" value={form.measured_value}
                  onChange={e => setForm({ ...form, measured_value: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <Label>Izoh</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            {form.expected_value && form.measured_value && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                Deviatsiya: <strong>{computeStatus(parseFloat(form.expected_value), parseFloat(form.measured_value)).dev}%</strong>
                {" — "}
                {statusBadge(computeStatus(parseFloat(form.expected_value), parseFloat(form.measured_value)).status)}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={save}>Saqlash</Button>
              <Button variant="outline" onClick={reset}>Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tests.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilterTest("")}
            className={`px-3 py-1 text-xs rounded-full ${!filterTest ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            Barchasi
          </button>
          {tests.map(t => (
            <button key={t} onClick={() => setFilterTest(t)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${filterTest === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {filterTest && chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Levey-Jennings: {filterTest}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                {chartData[0]?.expected && (
                  <ReferenceLine y={chartData[0].expected} stroke="hsl(var(--primary))" strokeDasharray="3 3" label="Mean" />
                )}
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">QC tarixi</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">QC yozuvlari yo'q</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Kut.</TableHead>
                    <TableHead>O'lch.</TableHead>
                    <TableHead>Dev %</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="text-xs">{new Date(q.qc_date).toLocaleDateString("uz")}</TableCell>
                      <TableCell className="font-medium text-xs">{q.test_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{q.reagent_lot || "—"}</TableCell>
                      <TableCell className="text-xs">{q.expected_value ?? "—"}</TableCell>
                      <TableCell className="text-xs font-semibold">{q.measured_value} {q.unit}</TableCell>
                      <TableCell className="text-xs">{q.deviation_percent !== null ? `${q.deviation_percent}%` : "—"}</TableCell>
                      <TableCell>{statusBadge(q.status)}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(q.id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagQC;
