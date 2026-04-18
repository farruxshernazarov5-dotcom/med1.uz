import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package, AlertTriangle, TrendingUp, Pill, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const PhOverview = ({ pharmacyId }: { pharmacyId: string }) => {
  const [stats, setStats] = useState({ todaySales: 0, todayRevenue: 0, lowStock: 0, expiring: 0, products: 0, customers: 0 });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

      const [salesRes, prodRes, batchesRes, custRes] = await Promise.all([
        supabase.from("pharmacy_sales" as any).select("total_amount, created_at").eq("pharmacy_id", pharmacyId),
        supabase.from("pharmacy_products").select("id").eq("pharmacy_id", pharmacyId).eq("is_active", true),
        supabase.from("pharmacy_inventory_batches" as any).select("remaining_quantity, expiry_date").eq("pharmacy_id", pharmacyId),
        supabase.from("pharmacy_customers" as any).select("id").eq("pharmacy_id", pharmacyId),
      ]);

      const sales = (salesRes.data as any[]) || [];
      const todaySales = sales.filter((s: any) => s.created_at?.startsWith(today));
      const batches = (batchesRes.data as any[]) || [];

      setStats({
        todaySales: todaySales.length,
        todayRevenue: todaySales.reduce((s: number, x: any) => s + Number(x.total_amount || 0), 0),
        lowStock: batches.filter((b: any) => b.remaining_quantity > 0 && b.remaining_quantity < 10).length,
        expiring: batches.filter((b: any) => b.expiry_date && b.expiry_date <= next30 && b.expiry_date >= today).length,
        products: (prodRes.data || []).length,
        customers: (custRes.data || []).length,
      });

      // Sales trend last 7 days
      const trend: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
        trend[d] = 0;
      }
      sales.forEach((s: any) => {
        const d = s.created_at?.split("T")[0];
        if (d in trend) trend[d] += Number(s.total_amount || 0);
      });
      setSalesTrend(Object.entries(trend).map(([date, amount]) => ({ date: date.slice(5), amount })));

      // Top products
      const { data: items } = await supabase.from("pharmacy_sale_items" as any).select("product_name, quantity, total_price").eq("pharmacy_id", pharmacyId);
      const agg: Record<string, { name: string; qty: number; revenue: number }> = {};
      ((items as any[]) || []).forEach((it: any) => {
        if (!agg[it.product_name]) agg[it.product_name] = { name: it.product_name, qty: 0, revenue: 0 };
        agg[it.product_name].qty += it.quantity;
        agg[it.product_name].revenue += Number(it.total_price);
      });
      setTopProducts(Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 5));
    };
    load();
  }, [pharmacyId]);

  const cards = [
    { label: "Bugungi sotuvlar", val: stats.todaySales, icon: ShoppingCart, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500" },
    { label: "Bugungi daromad", val: `${stats.todayRevenue.toLocaleString()} so'm`, icon: TrendingUp, color: "from-secondary/20 to-secondary/5", iconColor: "text-secondary" },
    { label: "Kam qoldi", val: stats.lowStock, icon: AlertTriangle, color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500" },
    { label: "Muddati tugayapti", val: stats.expiring, icon: AlertTriangle, color: "from-red-500/20 to-red-500/5", iconColor: "text-red-500" },
    { label: "Mahsulotlar", val: stats.products, icon: Pill, color: "from-accent/20 to-accent/5", iconColor: "text-accent" },
    { label: "Mijozlar", val: stats.customers, icon: Users, color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={cn("rounded-2xl border border-border p-5 bg-gradient-to-br", c.color)}>
            <c.icon className={cn("w-8 h-8 mb-3", c.iconColor)} />
            <p className="text-xl font-bold text-foreground">{c.val}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-5">
          <h3 className="font-medium text-foreground mb-3">Sotuv tendensiyasi (7 kun)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--secondary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <h3 className="font-medium text-foreground mb-3">Eng ko'p sotilgan dorilar</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Hali sotuvlar yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
};

export default PhOverview;
