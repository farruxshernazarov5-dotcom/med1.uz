import { Bell, Phone, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DentalRecallProps {
  patients: any[];
}

const DentalRecall = ({ patients }: DentalRecallProps) => {
  // Patients who haven't visited in 6+ months (simulated)
  const recallPatients = patients.filter(p => {
    if (!p.updated_at) return false;
    const lastVisit = new Date(p.updated_at);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return lastVisit < sixMonthsAgo;
  });

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">🔔 Qayta chaqiruv (Recall)</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "6 oy o'tgan", count: recallPatients.length, icon: Calendar, color: "text-yellow-600" },
          { label: "Eslatma yuborilgan", count: 0, icon: MessageSquare, color: "text-blue-600" },
          { label: "Qayta kelgan", count: 0, icon: Phone, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5 text-center">
            <s.icon className={`w-8 h-8 mx-auto mb-2 ${s.color}`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-heading font-bold text-foreground mb-4">Eslatma yuborish kerak</h3>
        {recallPatients.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Hozircha eslatma kerak emas</p>
        ) : (
          recallPatients.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">{p.phone}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">📱 SMS</Button>
                <Button size="sm" variant="outline">📨 Telegram</Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Avtomatik eslatma: bemorlar 6 oyda 1 marta profilaktik tekshiruvga chaqiriladi
          </p>
        </div>
      </div>
    </div>
  );
};

export default DentalRecall;
