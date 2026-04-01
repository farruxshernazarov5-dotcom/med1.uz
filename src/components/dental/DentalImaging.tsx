import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Image, Plus } from "lucide-react";

interface DentalImagingProps {
  patients: any[];
}

const DentalImaging = ({ patients }: DentalImagingProps) => {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [images] = useState<{ id: string; type: string; date: string; url: string }[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📸 Tasvirlar va Rentgen</h2>
        <Button><Plus className="w-4 h-4 mr-1" /> Rasm qo'shish</Button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <label className="text-sm text-muted-foreground mb-2 block">Bemorni tanlang</label>
        <select
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={selectedPatient}
          onChange={e => setSelectedPatient(e.target.value)}
        >
          <option value="">Tanlang...</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "OPG (Panoramik)", icon: Image, count: 0 },
          { label: "RVG (Periapical)", icon: Camera, count: 0 },
          { label: "Before / After", icon: Image, count: 0 },
        ].map(cat => (
          <div key={cat.label} className="bg-card rounded-2xl border border-border p-5 text-center">
            <cat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold text-foreground text-sm">{cat.label}</p>
            <p className="text-2xl font-bold text-primary mt-1">{cat.count}</p>
            <p className="text-xs text-muted-foreground">ta rasm</p>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hali rasm yuklanmagan</p>
          <p className="text-xs mt-1">Bemor tanlang va rasm qo'shing</p>
        </div>
      )}
    </div>
  );
};

export default DentalImaging;
