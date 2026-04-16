import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical, Clock, CheckCircle, TrendingUp, Users, FileText } from "lucide-react";

interface Props {
  stats: {
    todayOrders: number;
    pendingOrders: number;
    completedOrders: number;
    todayRevenue: number;
    totalPatients: number;
    totalServices: number;
  };
}

const DiagOverview = ({ stats }: Props) => {
  const cards = [
    { label: "Bugungi buyurtmalar", val: stats.todayOrders, icon: FlaskConical, color: "text-primary" },
    { label: "Kutilmoqda", val: stats.pendingOrders, icon: Clock, color: "text-amber-500" },
    { label: "Tayyor", val: stats.completedOrders, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Kunlik daromad", val: `${stats.todayRevenue.toLocaleString()} so'm`, icon: TrendingUp, color: "text-primary" },
    { label: "Bemorlar", val: stats.totalPatients, icon: Users, color: "text-secondary" },
    { label: "Xizmatlar", val: stats.totalServices, icon: FileText, color: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-5">
            <c.icon className={`w-7 h-7 mb-2 ${c.color}`} />
            <p className="text-2xl font-bold text-foreground">{c.val}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DiagOverview;
