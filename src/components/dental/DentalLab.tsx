import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, FlaskConical } from "lucide-react";

interface DentalLabProps {
  patients: any[];
}

const LAB_WORK_TYPES = ["Koronka", "Ko'prik", "Protez", "Vinir", "Yelim model", "Implant abutment"];

const DentalLab = ({ patients }: DentalLabProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [orders] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">🧪 Dental Laboratoriya</h2>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-1" /> Buyurtma</Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">Bemor tanlang</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">Ish turi</option>
            {LAB_WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Input placeholder="Tish raqami" type="number" />
          <Input placeholder="Texnik ismi" />
          <Input placeholder="Izoh" />
          <div className="flex gap-2">
            <Button>Saqlash</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Jarayonda", count: 0, color: "text-yellow-600" },
          { label: "Tayyor", count: 0, color: "text-green-600" },
          { label: "Yetkazilgan", count: 0, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Laboratoriya buyurtmalari yo'q</p>
        </div>
      )}
    </div>
  );
};

export default DentalLab;
