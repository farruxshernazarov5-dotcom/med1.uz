import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Settings, AlertTriangle, CheckCircle, Wrench, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Equipment {
  id: string;
  name: string;
  category: string;
  model: string;
  serialNumber: string;
  status: "active" | "maintenance" | "repair" | "inactive";
  lastService: string;
  nextService: string;
  cabinet: string;
}

const SAMPLE_EQUIPMENT: Equipment[] = [
  { id: "1", name: "Dental Unit (Stomatologik kreslo)", category: "Asosiy jihoz", model: "Planmeca Compact i5", serialNumber: "DC-2024-001", status: "active", lastService: "2026-02-15", nextService: "2026-05-15", cabinet: "Kabinet 1" },
  { id: "2", name: "Panoramik Rentgen (OPG)", category: "Diagnostika", model: "Vatech PaX-i", serialNumber: "RX-2023-045", status: "active", lastService: "2026-01-20", nextService: "2026-04-20", cabinet: "Rentgen xonasi" },
  { id: "3", name: "Avtoklav (Sterilizator)", category: "Sterilizatsiya", model: "Euronda E9", serialNumber: "ST-2024-012", status: "maintenance", lastService: "2026-03-01", nextService: "2026-04-01", cabinet: "Sterilizatsiya" },
  { id: "4", name: "Dental Unit #2", category: "Asosiy jihoz", model: "Sirona Intego", serialNumber: "DC-2023-002", status: "active", lastService: "2026-03-10", nextService: "2026-06-10", cabinet: "Kabinet 2" },
  { id: "5", name: "Periapical Rentgen (RVG)", category: "Diagnostika", model: "Carestream CS 2200", serialNumber: "RX-2024-078", status: "repair", lastService: "2026-02-28", nextService: "—", cabinet: "Kabinet 1" },
  { id: "6", name: "Ultratovush skaleri", category: "Asbob", model: "EMS Air-Flow", serialNumber: "US-2024-033", status: "active", lastService: "2026-03-20", nextService: "2026-06-20", cabinet: "Kabinet 3" },
];

const statusConfig = {
  active: { label: "Faol", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  maintenance: { label: "Texnik xizmat", icon: Wrench, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
  repair: { label: "Ta'mirda", icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
  inactive: { label: "Nofaol", icon: Settings, color: "text-muted-foreground bg-muted" },
};

const DentalEquipment = () => {
  const [equipment] = useState<Equipment[]>(SAMPLE_EQUIPMENT);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = equipment.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.cabinet.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || e.status === filter;
    return matchSearch && matchFilter;
  });

  const needsService = equipment.filter(e => {
    if (e.nextService === "—") return false;
    return new Date(e.nextService) <= new Date(new Date().setDate(new Date().getDate() + 30));
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">🔧 Jihozlar va texnika</h2>
        <Button><Plus className="w-4 h-4 mr-1" /> Jihoz qo'shish</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami jihozlar", value: equipment.length, color: "text-primary" },
          { label: "Faol", value: equipment.filter(e => e.status === "active").length, color: "text-green-600" },
          { label: "Texnik xizmat", value: equipment.filter(e => e.status === "maintenance").length, color: "text-yellow-600" },
          { label: "Ta'mirda", value: equipment.filter(e => e.status === "repair").length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Jihoz qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {["all", "active", "maintenance", "repair"].map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "Barchasi" : statusConfig[f as keyof typeof statusConfig]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Upcoming service alert */}
      {needsService.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl border border-yellow-200 dark:border-yellow-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="font-semibold text-yellow-800 dark:text-yellow-400">Yaqinlashayotgan texnik xizmatlar</p>
          </div>
          {needsService.map(e => (
            <p key={e.id} className="text-sm text-yellow-700 dark:text-yellow-300">
              • {e.name} — keyingi xizmat: {e.nextService}
            </p>
          ))}
        </div>
      )}

      {/* Equipment list */}
      {filtered.map(eq => {
        const cfg = statusConfig[eq.status];
        const Icon = cfg.icon;
        return (
          <div key={eq.id} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{eq.name}</p>
                  <p className="text-xs text-muted-foreground">{eq.model} • S/N: {eq.serialNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">📍 {eq.cabinet} • {eq.category}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Oxirgi xizmat: {eq.lastService}</p>
                  <p>Keyingi: {eq.nextService}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DentalEquipment;
