import { Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const SAMPLE_CATEGORIES = [
  { name: "Plomba materiallari", count: 0 },
  { name: "Anestetiklar", count: 0 },
  { name: "Implantlar", count: 0 },
  { name: "Sterilizatsiya", count: 0 },
  { name: "Bir martalik", count: 0 },
  { name: "Instrumentlar", count: 0 },
];

const DentalInventory = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📦 Materiallar va Jihozlar</h2>
        <Button><Plus className="w-4 h-4 mr-1" /> Material qo'shish</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SAMPLE_CATEGORIES.map(cat => (
          <div key={cat.name} className="bg-card rounded-2xl border border-border p-5">
            <Package className="w-6 h-6 text-primary mb-2" />
            <p className="font-semibold text-foreground text-sm">{cat.name}</p>
            <p className="text-2xl font-bold text-primary">{cat.count}</p>
            <p className="text-xs text-muted-foreground">ta material</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="font-heading font-bold text-foreground">Kam qolgan materiallar</h3>
        </div>
        <p className="text-muted-foreground text-sm text-center py-4">Hozircha ogohlantirish yo'q</p>
      </div>
    </div>
  );
};

export default DentalInventory;
