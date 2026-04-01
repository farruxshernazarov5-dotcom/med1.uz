import { DollarSign, CreditCard, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalBillingProps {
  treatments: any[];
  appointments: any[];
}

const DentalBilling = ({ treatments, appointments }: DentalBillingProps) => {
  const totalRevenue = treatments.filter(t => t.status === "completed").reduce((s, t) => s + (Number(t.price) || 0), 0);
  const pendingPayments = treatments.filter(t => t.status === "planned").reduce((s, t) => s + (Number(t.price) || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">💳 Moliya va To'lovlar</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami daromad", value: `${totalRevenue.toLocaleString()} so'm`, icon: TrendingUp, color: "text-green-600" },
          { label: "Kutilmoqda", value: `${pendingPayments.toLocaleString()} so'm`, icon: DollarSign, color: "text-yellow-600" },
          { label: "Qarzdorlik", value: "0 so'm", icon: AlertTriangle, color: "text-red-600" },
          { label: "To'lovlar", value: treatments.filter(t => t.status === "completed").length.toString(), icon: CreditCard, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
            <s.icon className={cn("w-6 h-6 mb-2", s.color)} />
            <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-heading font-bold text-foreground mb-4">So'nggi to'lovlar</h3>
        {treatments.filter(t => t.status === "completed" && t.price > 0).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">To'lovlar topilmadi</p>
        ) : (
          treatments.filter(t => t.status === "completed" && t.price > 0).slice(0, 10).map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{t.treatment_type}</p>
                <p className="text-xs text-muted-foreground">Tish #{t.tooth_number}</p>
              </div>
              <p className="font-bold text-green-600">{Number(t.price).toLocaleString()} so'm</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DentalBilling;
