import { cn } from "@/lib/utils";
import { Users, Calendar, Activity, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DentalOverviewProps {
  patients: any[];
  todayAppts: any[];
  treatments: any[];
  services: any[];
}

const DentalOverview = ({ patients, todayAppts, treatments, services }: DentalOverviewProps) => {
  const stats = [
    { label: "Bemorlar", value: patients.length, icon: Users, color: "text-blue-600" },
    { label: "Bugungi qabullar", value: todayAppts.length, icon: Calendar, color: "text-green-600" },
    { label: "Davolashlar", value: treatments.length, icon: Activity, color: "text-purple-600" },
    { label: "Xizmatlar", value: services.length, icon: Stethoscope, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
            <s.icon className={cn("w-6 h-6 mb-2", s.color)} />
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-heading font-bold text-foreground mb-4">Bugungi qabullar</h3>
        {todayAppts.length === 0 ? (
          <p className="text-muted-foreground text-sm">Bugun qabul yo'q</p>
        ) : (
          todayAppts.map(a => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground">{a.appointment_time}</span>
              <span className="text-sm text-muted-foreground">{a.doctor_name || "Shifokor"}</span>
              <Badge variant="outline">{a.status}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DentalOverview;
