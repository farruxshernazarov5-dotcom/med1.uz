import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalReportsProps {
  patients: any[];
  appointments: any[];
  treatments: any[];
  services: any[];
}

const DentalReports = ({ patients, appointments, treatments, services }: DentalReportsProps) => {
  const completedTreatments = treatments.filter(t => t.status === "completed");
  const totalRevenue = completedTreatments.reduce((s, t) => s + (Number(t.price) || 0), 0);

  // Top services
  const serviceCounts: Record<string, number> = {};
  treatments.forEach(t => {
    serviceCounts[t.treatment_type] = (serviceCounts[t.treatment_type] || 0) + 1;
  });
  const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">📊 Hisobotlar va Analitika</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami bemorlar", value: patients.length, icon: Users, color: "text-blue-600" },
          { label: "Jami qabullar", value: appointments.length, icon: Calendar, color: "text-green-600" },
          { label: "Davolashlar", value: completedTreatments.length, icon: BarChart3, color: "text-purple-600" },
          { label: "Jami daromad", value: `${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
            <s.icon className={cn("w-6 h-6 mb-2", s.color)} />
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-heading font-bold text-foreground mb-4">Eng ko'p xizmatlar</h3>
        {topServices.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Ma'lumot yetarli emas</p>
        ) : (
          topServices.map(([name, count], i) => (
            <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <span className="text-sm font-medium text-foreground">{name}</span>
              </div>
              <span className="text-sm font-bold text-primary">{count} ta</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DentalReports;
