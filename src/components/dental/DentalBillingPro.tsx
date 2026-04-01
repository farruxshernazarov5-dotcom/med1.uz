import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, CreditCard, AlertTriangle, TrendingUp, Receipt, Search, Download, Banknote, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: "cash" | "card" | "insurance" | "mixed";
  status: "paid" | "partial" | "unpaid";
  date: string;
  items: { name: string; price: number }[];
}

const SAMPLE_INVOICES: Invoice[] = [
  { id: "1", invoiceNumber: "DEN-2026-001", patientName: "Aliyev Jasur", totalAmount: 4500000, paidAmount: 4500000, paymentMethod: "card", status: "paid", date: "2026-03-28", items: [{ name: "Implant o'rnatish", price: 4000000 }, { name: "Anesteziya", price: 500000 }] },
  { id: "2", invoiceNumber: "DEN-2026-002", patientName: "Rahimova Dilnoza", totalAmount: 5000000, paidAmount: 2500000, paymentMethod: "mixed", status: "partial", date: "2026-03-25", items: [{ name: "Breket o'rnatish", price: 5000000 }] },
  { id: "3", invoiceNumber: "DEN-2026-003", patientName: "Toshmatov Rustam", totalAmount: 800000, paidAmount: 800000, paymentMethod: "cash", status: "paid", date: "2026-03-22", items: [{ name: "Plomba qo'yish", price: 600000 }, { name: "Konsultatsiya", price: 200000 }] },
  { id: "4", invoiceNumber: "DEN-2026-004", patientName: "Usmonova Gulnora", totalAmount: 1200000, paidAmount: 0, paymentMethod: "insurance", status: "unpaid", date: "2026-03-20", items: [{ name: "Tish tozalash", price: 700000 }, { name: "Fluorlash", price: 500000 }] },
];

const paymentMethodLabel = { cash: "💵 Naqd", card: "💳 Karta", insurance: "🏥 Sug'urta", mixed: "🔄 Aralash" };
const statusConfig = {
  paid: { label: "To'langan", color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  partial: { label: "Qisman", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
  unpaid: { label: "To'lanmagan", color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
};

interface DentalBillingProProps {
  treatments: any[];
  appointments: any[];
}

const DentalBillingPro = ({ treatments, appointments }: DentalBillingProProps) => {
  const [invoices] = useState<Invoice[]>(SAMPLE_INVOICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const totalRevenue = invoices.reduce((a, i) => a + i.paidAmount, 0);
  const totalDebt = invoices.reduce((a, i) => a + (i.totalAmount - i.paidAmount), 0);
  const todayRevenue = invoices.filter(i => i.date === new Date().toISOString().split("T")[0]).reduce((a, i) => a + i.paidAmount, 0);

  const filtered = invoices.filter(i => {
    const matchSearch = i.patientName.toLowerCase().includes(search.toLowerCase()) || i.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>← Orqaga</Button>
          <h2 className="font-heading text-xl font-bold text-foreground">🧾 {selectedInvoice.invoiceNumber}</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-lg font-bold text-foreground">{selectedInvoice.patientName}</p>
              <p className="text-sm text-muted-foreground">{selectedInvoice.date}</p>
            </div>
            <Badge className={statusConfig[selectedInvoice.status].color}>{statusConfig[selectedInvoice.status].label}</Badge>
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            {selectedInvoice.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground">{item.name}</span>
                <span className="font-medium text-foreground">{item.price.toLocaleString()} so'm</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 space-y-1">
            <div className="flex justify-between font-bold text-foreground">
              <span>Jami:</span>
              <span>{selectedInvoice.totalAmount.toLocaleString()} so'm</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>To'langan:</span>
              <span>{selectedInvoice.paidAmount.toLocaleString()} so'm</span>
            </div>
            {selectedInvoice.totalAmount - selectedInvoice.paidAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600 font-medium">
                <span>Qarz:</span>
                <span>{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()} so'm</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-6">
            <Button><Download className="w-4 h-4 mr-1" /> PDF yuklash</Button>
            <Button variant="outline">🖨️ Chop etish</Button>
            {selectedInvoice.status !== "paid" && <Button variant="outline" className="text-green-600">💰 To'lov qabul qilish</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">💰 Moliya va to'lovlar (Pro)</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami daromad", value: `${(totalRevenue / 1000000).toFixed(1)}M`, icon: TrendingUp, color: "text-green-600" },
          { label: "Bugungi daromad", value: `${todayRevenue.toLocaleString()}`, icon: DollarSign, color: "text-blue-600" },
          { label: "Qarzdorlik", value: `${(totalDebt / 1000000).toFixed(1)}M`, icon: AlertTriangle, color: "text-red-600" },
          { label: "Invoicelar", value: invoices.length, icon: Receipt, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payment method breakdown */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-heading font-bold text-foreground mb-3">To'lov usullari</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["cash", "card", "insurance", "mixed"] as const).map(method => {
            const count = invoices.filter(i => i.paymentMethod === method).length;
            const amount = invoices.filter(i => i.paymentMethod === method).reduce((a, i) => a + i.paidAmount, 0);
            return (
              <div key={method} className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg">{paymentMethodLabel[method].split(" ")[0]}</p>
                <p className="text-sm font-bold text-foreground">{count} ta</p>
                <p className="text-xs text-muted-foreground">{(amount / 1000000).toFixed(1)}M so'm</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "paid", "partial", "unpaid"].map(f => (
          <Button key={f} size="sm" variant={statusFilter === f ? "default" : "outline"} onClick={() => setStatusFilter(f)}>
            {f === "all" ? "Barchasi" : statusConfig[f as keyof typeof statusConfig]?.label}
          </Button>
        ))}
      </div>

      {/* Invoices list */}
      {filtered.map(inv => (
        <div
          key={inv.id}
          className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedInvoice(inv)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{inv.invoiceNumber}</p>
                <Badge variant="outline" className={statusConfig[inv.status].color}>{statusConfig[inv.status].label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{inv.patientName} • {inv.date}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">{inv.totalAmount.toLocaleString()} so'm</p>
              <p className="text-xs text-muted-foreground">{paymentMethodLabel[inv.paymentMethod]}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DentalBillingPro;
