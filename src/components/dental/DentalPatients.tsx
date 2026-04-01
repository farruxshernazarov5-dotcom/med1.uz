import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface DentalPatientsProps {
  patients: any[];
  onAddPatient: (form: { full_name: string; phone: string; date_of_birth: string; gender: string }) => Promise<void>;
  onOpenToothChart: (patient: any) => void;
}

const DentalPatients = ({ patients, onAddPatient, onOpenToothChart }: DentalPatientsProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", date_of_birth: "", gender: "male" });

  const handleAdd = async () => {
    await onAddPatient(form);
    setForm({ full_name: "", phone: "", date_of_birth: "", gender: "male" });
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">Bemorlar</h2>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Yangi bemor</Button>
      </div>
      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <Input placeholder="Ism familiya" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
          <Input placeholder="Telefon" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          <Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Saqlash</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {patients.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{p.full_name}</p>
              <p className="text-xs text-muted-foreground">{p.phone} {p.date_of_birth && `• ${p.date_of_birth}`}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onOpenToothChart(p)}>🦷 Tish xaritasi</Button>
          </div>
        ))}
        {patients.length === 0 && <p className="text-center py-8 text-muted-foreground">Bemorlar topilmadi</p>}
      </div>
    </div>
  );
};

export default DentalPatients;
