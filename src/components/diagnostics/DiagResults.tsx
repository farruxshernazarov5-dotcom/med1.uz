import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, X, FileText } from "lucide-react";

interface LabOrder { id: string; order_number: string; status: string; }
interface Result {
  id: string; order_id: string; parameter_name: string; value: string | null;
  unit: string | null; reference_min: string | null; reference_max: string | null;
  status: string; created_at: string;
}
interface Template {
  id: string; name: string; category: string;
  parameters: { name: string; unit: string; min: string; max: string }[];
}

interface Props {
  centerId: string;
  results: Result[];
  orders: LabOrder[];
  templates: Template[];
  onReload: () => void;
}

const DiagResults = ({ centerId, results, orders, templates, onReload }: Props) => {
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [rows, setRows] = useState<{ parameter_name: string; value: string; unit: string; reference_min: string; reference_max: string }[]>([]);

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const params = Array.isArray(tpl.parameters) ? tpl.parameters : [];
    setRows(params.map((p: any) => ({ parameter_name: p.name || "", value: "", unit: p.unit || "", reference_min: p.min || "", reference_max: p.max || "" })));
  };

  const handleSaveResults = async () => {
    if (!selectedOrder) { toast({ title: "Buyurtmani tanlang", variant: "destructive" }); return; }
    if (rows.length === 0) { toast({ title: "Natijalar kiritilmagan", variant: "destructive" }); return; }
    const payload = rows.filter((r) => r.parameter_name).map((r) => ({
      center_id: centerId, order_id: selectedOrder,
      parameter_name: r.parameter_name, value: r.value || null,
      unit: r.unit || null, reference_min: r.reference_min || null,
      reference_max: r.reference_max || null,
      status: r.value && r.reference_min && r.reference_max
        ? (parseFloat(r.value) < parseFloat(r.reference_min) || parseFloat(r.value) > parseFloat(r.reference_max) ? "abnormal" : "normal")
        : "normal",
    }));
    const { error } = await supabase.from("diagnostics_lab_results" as any).insert(payload as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Natijalar saqlandi" });
    setRows([]);
    setSelectedOrder("");
    setSelectedTemplate("");
    onReload();
  };

  const addRow = () => setRows((prev) => [...prev, { parameter_name: "", value: "", unit: "", reference_min: "", reference_max: "" }]);

  const completedOrders = orders.filter((o) => o.status === "in_progress" || o.status === "completed");
  const orderResults = selectedOrder ? results.filter((r) => r.order_id === selectedOrder) : results;

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-lg text-foreground">Natijalar kiritish</h3>

      <Card className="border-primary/30">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Buyurtma *</Label>
              <select value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                <option value="">Tanlang...</option>
                {completedOrders.map((o) => <option key={o.id} value={o.id}>{o.order_number}</option>)}
              </select>
            </div>
            <div>
              <Label>Shablon</Label>
              <select value={selectedTemplate} onChange={(e) => applyTemplate(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                <option value="">Shablondan yuklash...</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
              </select>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parametr</TableHead>
                    <TableHead>Natija</TableHead>
                    <TableHead>Birlik</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell><Input value={r.parameter_name} onChange={(e) => { const n = [...rows]; n[i].parameter_name = e.target.value; setRows(n); }} /></TableCell>
                      <TableCell><Input value={r.value} onChange={(e) => { const n = [...rows]; n[i].value = e.target.value; setRows(n); }} /></TableCell>
                      <TableCell><Input value={r.unit} onChange={(e) => { const n = [...rows]; n[i].unit = e.target.value; setRows(n); }} className="w-20" /></TableCell>
                      <TableCell><Input value={r.reference_min} onChange={(e) => { const n = [...rows]; n[i].reference_min = e.target.value; setRows(n); }} className="w-20" /></TableCell>
                      <TableCell><Input value={r.reference_max} onChange={(e) => { const n = [...rows]; n[i].reference_max = e.target.value; setRows(n); }} className="w-20" /></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}><X className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addRow}><Plus className="w-4 h-4 mr-1" /> Qator</Button>
            {rows.length > 0 && <Button size="sm" onClick={handleSaveResults}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>}
          </div>
        </CardContent>
      </Card>

      {orderResults.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Saqlangan natijalar</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parametr</TableHead>
                  <TableHead>Natija</TableHead>
                  <TableHead>Birlik</TableHead>
                  <TableHead>Norma</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderResults.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.parameter_name}</TableCell>
                    <TableCell className="font-semibold">{r.value || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.unit || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.reference_min} – {r.reference_max}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "abnormal" ? "destructive" : "outline"} className="text-xs">
                        {r.status === "abnormal" ? "⚠ Norma emas" : "✅ Normal"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiagResults;
