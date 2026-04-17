import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, AlertTriangle, CheckCircle2, DollarSign, Calendar, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const MTOverview = ({ vendorId }: { vendorId: string }) => {
  const [stats, setStats] = useState({ total: 0, active: 0, maintenance: 0, broken: 0, rentals: 0, todayIncome: 0, monthIncome: 0, lowStock: 0 });

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date(); monthStart.setDate(1);
      const [eqRes, rentRes, txRes, invRes] = await Promise.all([
        supabase.from("medtech_equipment").select("status").eq("vendor_id", vendorId),
        supabase.from("medtech_rentals").select("id").eq("vendor_id", vendorId).eq("status", "active"),
        supabase.from("medtech_transactions").select("amount, transaction_date, type").eq("vendor_id", vendorId).eq("type", "income"),
        supabase.from("medtech_inventory").select("quantity, min_quantity").eq("vendor_id", vendorId),
      ]);
      const eq = eqRes.data || [];
      const tx = txRes.data || [];
      setStats({
        total: eq.length,
        active: eq.filter((e: any) => e.status === "active").length,
        maintenance: eq.filter((e: any) => e.status === "maintenance").length,
        broken: eq.filter((e: any) => e.status === "broken").length,
        rentals: rentRes.data?.length || 0,
        todayIncome: tx.filter((t: any) => t.transaction_date === today).reduce((s: number, t: any) => s + Number(t.amount), 0),
        monthIncome: tx.filter((t: any) => new Date(t.transaction_date) >= monthStart).reduce((s: number, t: any) => s + Number(t.amount), 0),
        lowStock: (invRes.data || []).filter((i: any) => i.quantity <= (i.min_quantity || 5)).length,
      });
    };
    load();
  }, [vendorId]);

  const cards = [
    { label: "Jami uskunalar", val: stats.total, icon: Package, color: "from-secondary/20 to-secondary/5", iconColor: "text-secondary" },
    { label: "Faol", val: stats.active, icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500" },
    { label: "Servisda", val: stats.maintenance, icon: Wrench, color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500" },
    { label: "Nosoz", val: stats.broken, icon: AlertTriangle, color: "from-destructive/20 to-destructive/5", iconColor: "text-destructive" },
    { label: "Ijaradagi", val: stats.rentals, icon: Calendar, color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-500" },
    { label: "Bugungi tushum", val: `${stats.todayIncome.toLocaleString()} UZS`, icon: DollarSign, color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { label: "Oylik tushum", val: `${stats.monthIncome.toLocaleString()} UZS`, icon: DollarSign, color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-500" },
    { label: "Kam zaxira", val: stats.lowStock, icon: AlertTriangle, color: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className={cn("rounded-2xl border border-border p-5 bg-gradient-to-br", c.color)}>
          <c.icon className={cn("w-7 h-7 mb-3", c.iconColor)} />
          <p className="text-xl font-bold text-foreground">{c.val}</p>
          <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

export default MTOverview;
