import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, X, Save, Users } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  date_of_birth: string | null;
  gender: string;
  blood_group: string | null;
  address: string | null;
  created_at: string;
}

interface Props {
  centerId: string;
  patients: Patient[];
  onReload: () => void;
}

const DiagPatients = ({ centerId, patients, onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "", date_of_birth: "", gender: "male", blood_group: "", address: "" });

  const filtered = patients.filter(
    (p) => p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "Ism va telefon majburiy", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("diagnostics_patients" as any).insert({ ...form, center_id: centerId } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Bemor qo'shildi" });
    setShowForm(false);
    setForm({ full_name: "", phone: "", date_of_birth: "", gender: "male", blood_group: "", address: "" });
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Yangi bemor
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Yangi bemor</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>F.I.O. *</Label><Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Telefon *</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+998..." className="mt-1" /></div>
              <div><Label>Tug'ilgan sana</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>Jinsi</Label>
                <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
              </div>
              <div><Label>Qon guruhi</Label><Input value={form.blood_group} onChange={(e) => setForm((p) => ({ ...p, blood_group: e.target.value }))} placeholder="A+, B-, ..." className="mt-1" /></div>
              <div><Label>Manzil</Label><Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" />Bemorlar topilmadi</CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>F.I.O.</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Jinsi</TableHead>
                <TableHead>Qon guruhi</TableHead>
                <TableHead>Ro'yxatdan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.gender === "male" ? "Erkak" : "Ayol"}</Badge></TableCell>
                  <TableCell>{p.blood_group || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("uz-UZ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default DiagPatients;
