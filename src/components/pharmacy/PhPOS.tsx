import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, Smartphone, Loader2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

const PhPOS = ({ pharmacyId }: { pharmacyId: string }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online">("cash");
  const [discount, setDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  const load = async () => {
    const [p, s] = await Promise.all([
      supabase.from("pharmacy_products").select("*").eq("pharmacy_id", pharmacyId).eq("is_active", true),
      supabase.from("pharmacy_sales" as any).select("*").eq("pharmacy_id", pharmacyId).order("created_at", { ascending: false }).limit(5),
    ]);
    setProducts(p.data || []);
    setRecentSales((s.data as any[]) || []);
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.manufacturer?.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (p: any) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.product_id === p.id);
      if (ex) return prev.map((c) => c.product_id === p.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product_id: p.id, product_name: p.name, unit_price: Number(p.price), quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.product_id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((c) => c.product_id !== id));

  const subtotal = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  const checkout = async () => {
    if (cart.length === 0) { toast({ title: "Savat bo'sh", variant: "destructive" }); return; }
    setSaving(true);
    const { data: sale, error: sErr } = await supabase.from("pharmacy_sales" as any).insert({
      pharmacy_id: pharmacyId,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      subtotal,
      discount_amount: discountAmount,
      total_amount: total,
      payment_method: paymentMethod,
      payment_status: "paid",
    } as any).select().single();

    if (sErr || !sale) { setSaving(false); toast({ title: "Xatolik", description: sErr?.message, variant: "destructive" }); return; }

    const items = cart.map((c) => ({
      sale_id: (sale as any).id,
      pharmacy_id: pharmacyId,
      product_id: c.product_id,
      product_name: c.product_name,
      quantity: c.quantity,
      unit_price: c.unit_price,
      total_price: c.unit_price * c.quantity,
    }));
    await supabase.from("pharmacy_sale_items" as any).insert(items as any);

    // Record income transaction
    await supabase.from("pharmacy_transactions" as any).insert({
      pharmacy_id: pharmacyId,
      type: "income",
      category: "sale",
      amount: total,
      description: `Sotuv #${(sale as any).invoice_number}`,
      reference_id: (sale as any).id,
      reference_type: "sale",
    } as any);

    setSaving(false);
    toast({ title: "✅ Sotuv amalga oshirildi", description: `Chek: ${(sale as any).invoice_number}` });
    setCart([]); setCustomerName(""); setCustomerPhone(""); setDiscount("");
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Dori qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">Mahsulot topilmadi</p>
          ) : filtered.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} className="text-left p-3 rounded-lg border border-border bg-card hover:border-secondary transition-all">
              <p className="font-medium text-sm line-clamp-1">{p.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.manufacturer}</p>
              <p className="text-sm font-semibold text-secondary mt-1">{Number(p.price).toLocaleString()} so'm</p>
            </button>
          ))}
        </div>
      </div>

      <Card className="h-fit lg:sticky lg:top-4">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ShoppingCart className="w-5 h-5 text-secondary" />
            <h3 className="font-semibold">Savat ({cart.length})</h3>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Mahsulot tanlang</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cart.map((c) => (
                <div key={c.product_id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{c.product_name}</p>
                    <p className="text-xs text-muted-foreground">{c.unit_price.toLocaleString()} × {c.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => updateQty(c.product_id, -1)}><Minus className="w-3 h-3" /></Button>
                    <span className="text-sm w-6 text-center">{c.quantity}</span>
                    <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => updateQty(c.product_id, 1)}><Plus className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => removeItem(c.product_id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-border">
            <Input placeholder="Mijoz ismi" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Input placeholder="Telefon" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            <Input placeholder="Chegirma (so'm)" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-1">
            {[
              { id: "cash", label: "Naqd", icon: Banknote },
              { id: "card", label: "Karta", icon: CreditCard },
              { id: "online", label: "Online", icon: Smartphone },
            ].map((m) => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id as any)} className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                paymentMethod === m.id ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted-foreground"
              )}>
                <m.icon className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-2 border-t border-border text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal:</span><span>{subtotal.toLocaleString()}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-amber-500"><span>Chegirma:</span><span>-{discountAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-base text-foreground pt-1"><span>Jami:</span><span>{total.toLocaleString()} so'm</span></div>
          </div>

          <Button onClick={checkout} disabled={saving || cart.length === 0} className="w-full bg-gradient-to-r from-secondary to-accent text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Receipt className="w-4 h-4 mr-2" /> Sotuvni yakunlash</>}
          </Button>

          {recentSales.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Oxirgi sotuvlar:</p>
              <div className="space-y-1">
                {recentSales.map((s: any) => (
                  <div key={s.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{s.invoice_number}</span>
                    <span className="font-medium">{Number(s.total_amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PhPOS;
