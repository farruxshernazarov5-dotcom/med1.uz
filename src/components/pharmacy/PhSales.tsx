import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Eye, Download } from "lucide-react";

const PhSales = ({ pharmacyId }: { pharmacyId: string }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("pharmacy_sales" as any).select("*").eq("pharmacy_id", pharmacyId).order("created_at", { ascending: false });
      setSales((data as any[]) || []);
    };
    load();
  }, [pharmacyId]);

  const toggleOpen = async (saleId: string) => {
    if (openId === saleId) { setOpenId(null); return; }
    setOpenId(saleId);
    if (!items[saleId]) {
      const { data } = await supabase.from("pharmacy_sale_items" as any).select("*").eq("sale_id", saleId);
      setItems((p) => ({ ...p, [saleId]: (data as any[]) || [] }));
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-heading font-semibold text-lg">Sotuvlar tarixi ({sales.length})</h3>
      {sales.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali sotuvlar yo'q</p></div>
      ) : sales.map((s) => (
        <Card key={s.id}><CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{s.invoice_number}</p>
                <Badge variant={s.payment_status === "paid" ? "default" : "secondary"}>{s.payment_status}</Badge>
                <Badge variant="outline" className="text-xs">{s.payment_method}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {s.customer_name || "Mijoz"} · {new Date(s.created_at).toLocaleString("uz-UZ")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-secondary">{Number(s.total_amount).toLocaleString()} so'm</p>
              <Button size="sm" variant="ghost" onClick={() => toggleOpen(s.id)}><Eye className="w-3.5 h-3.5 mr-1" /> Tafsilot</Button>
            </div>
          </div>
          {openId === s.id && items[s.id] && (
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              {items[s.id].map((it: any) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span>{it.product_name} × {it.quantity}</span>
                  <span className="font-medium">{Number(it.total_price).toLocaleString()} so'm</span>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      ))}
    </div>
  );
};

export default PhSales;
