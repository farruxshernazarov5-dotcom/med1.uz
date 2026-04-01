import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, AlertTriangle, TrendingUp, Receipt, Search, Download, FileText, PieChart, Plus, X, Banknote } from "lucide-react";
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

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

const SAMPLE_INVOICES: Invoice[] = [
  { id: "1", invoiceNumber: "DEN-2026-001", patientName: "Aliyev Jasur", totalAmount: 4500000, paidAmount: 4500000, paymentMethod: "card", status: "paid", date: "2026-03-28", items: [{ name: "Implant o'rnatish", price: 4000000 }, { name: "Anesteziya", price: 500000 }] },
  { id: "2", invoiceNumber: "DEN-2026-002", patientName: "Rahimova Dilnoza", totalAmount: 5000000, paidAmount: 2500000, paymentMethod: "mixed", status: "partial", date: "2026-03-25", items: [{ name: "Breket o'rnatish", price: 5000000 }] },
  { id: "3", invoiceNumber: "DEN-2026-003", patientName: "Toshmatov Rustam", totalAmount: 800000, paidAmount: 800000, paymentMethod: "cash", status: "paid", date: "2026-03-22", items: [{ name: "Plomba qo'yish", price: 600000 }, { name: "Konsultatsiya", price: 200000 }] },
  { id: "4", invoiceNumber: "DEN-2026-004", patientName: "Usmonova Gulnora", totalAmount: 1200000, paidAmount: 0, paymentMethod: "insurance", status: "unpaid", date: "2026-03-20", items: [{ name: "Tish tozalash", price: 700000 }, { name: "Fluorlash", price: 500000 }] },
];

const SAMPLE_EXPENSES: Expense[] = [
  { id: "e1", category: "Material", description: "Plomba materiallari", amount: 2000000, date: "2026-03-26" },
  { id: "e2", category: "Ish haqi", description: "Mart oylik", amount: 8000000, date: "2026-03-25" },
  { id: "e3", category: "Jihozlar", description: "Bor mashinasi ta'miri", amount: 1500000, date: "2026-03-20" },
  { id: "e4", category: "Kommunal", description: "Elektr energiya", amount: 500000, date: "2026-03-18" },
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
  const [expenses] = useState<Expense[]>(SAMPLE_EXPENSES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [mainTab, setMainTab] = useState("dashboard");

  const totalRevenue = invoices.reduce((a, i) => a + i.paidAmount, 0);
  const totalDebt = invoices.reduce((a, i) => a + (i.totalAmount - i.paidAmount), 0);
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const todayRevenue = invoices.filter(i => i.date === new Date().toISOString().split("T")[0]).reduce((a, i) => a + i.paidAmount, 0);

  const filtered = invoices.filter(i => {
    const matchSearch = i.patientName.toLowerCase().includes(search.toLowerCase()) || i.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Invoice detail view
  if (selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}><X className="w-4 h-4 mr-1" /> Orqaga</Button>
          <h2 className="font-heading text-xl font-bold text-foreground">🧾 {selectedInvoice.invoiceNumber}</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-border">
            <div>
              <p className="text-lg font-bold text-foreground">{selectedInvoice.patientName}</p>
              <p className="text-sm text-muted-foreground">📅 {selectedInvoice.date}</p>
              <p className="text-sm text-muted-foreground">{paymentMethodLabel[selectedInvoice.paymentMethod]}</p>
            </div>
            <Badge className={statusConfig[selectedInvoice.status].color}>{statusConfig[selectedInvoice.status].label}</Badge>
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">#</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Xizmat</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Narx</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items.map((item, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-3 text-foreground">{item.name}</td>
                  <td className="py-3 text-right font-medium text-foreground">{item.price.toLocaleString()} so'm</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex justify-between font-bold text-foreground text-lg">
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

          {/* Actions */}
          <div className="flex gap-2 mt-6 flex-wrap">
            <Button><Download className="w-4 h-4 mr-1" /> PDF yuklash</Button>
            <Button variant="outline">🖨️ Chop etish</Button>
            <Button variant="outline">📤 Telegram yuborish</Button>
            {selectedInvoice.status !== "paid" && <Button variant="outline" className="text-green-600">💰 To'lov qabul qilish</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">💰 Moliya va to'lovlar</h2>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoicelar</TabsTrigger>
          <TabsTrigger value="payments">To'lovlar</TabsTrigger>
          <TabsTrigger value="receipts">Cheklar</TabsTrigger>
          <TabsTrigger value="expenses">Chiqimlar</TabsTrigger>
          <TabsTrigger value="reports">Hisobot</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Jami daromad", value: `${(totalRevenue / 1000000).toFixed(1)}M`, icon: TrendingUp, color: "text-green-600" },
                { label: "Bugungi", value: todayRevenue > 0 ? `${(todayRevenue / 1000000).toFixed(1)}M` : "0", icon: DollarSign, color: "text-blue-600" },
                { label: "Qarzdorlik", value: `${(totalDebt / 1000000).toFixed(1)}M`, icon: AlertTriangle, color: "text-red-600" },
                { label: "Sof foyda", value: `${(netProfit / 1000000).toFixed(1)}M`, icon: PieChart, color: "text-purple-600" },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
                  <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Payment methods */}
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

            {/* Recent transactions */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground mb-3">Oxirgi operatsiyalar</h3>
              {invoices.slice(0, 3).map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.patientName}</p>
                    <p className="text-xs text-muted-foreground">{inv.date} • {inv.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{inv.totalAmount.toLocaleString()}</p>
                    <Badge variant="outline" className={cn("text-xs", statusConfig[inv.status].color)}>{statusConfig[inv.status].label}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices">
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {["all", "paid", "partial", "unpaid"].map(f => (
                <Button key={f} size="sm" variant={statusFilter === f ? "default" : "outline"} onClick={() => setStatusFilter(f)}>
                  {f === "all" ? "Barchasi" : statusConfig[f as keyof typeof statusConfig]?.label}
                </Button>
              ))}
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
            </div>

            {filtered.map(inv => (
              <div key={inv.id} className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedInvoice(inv)}>
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
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">To'lovlar tarixi</h3>
            {invoices.filter(i => i.paidAmount > 0).map(inv => (
              <div key={inv.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{inv.patientName}</p>
                    <p className="text-xs text-muted-foreground">{inv.date} • {paymentMethodLabel[inv.paymentMethod]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{inv.paidAmount.toLocaleString()} so'm</p>
                  <Badge variant="outline" className={statusConfig[inv.status].color}>{statusConfig[inv.status].label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* RECEIPTS */}
        <TabsContent value="receipts">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Cheklar</h3>
            <p className="text-sm text-muted-foreground">To'langan invoicelar uchun cheklar avtomatik yaratiladi</p>
            {invoices.filter(i => i.status === "paid").map(inv => (
              <div key={inv.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">🧾 {inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{inv.patientName} • {inv.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><Download className="w-3 h-3 mr-1" /> PDF</Button>
                  <Button size="sm" variant="outline">📤 Yuborish</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-foreground">Chiqimlar</h3>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi chiqim</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Material", "Ish haqi", "Jihozlar", "Kommunal"].map(cat => {
                const catTotal = expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0);
                return (
                  <div key={cat} className="bg-card rounded-2xl border border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">{cat}</p>
                    <p className="text-lg font-bold text-red-600">{(catTotal / 1000000).toFixed(1)}M</p>
                  </div>
                );
              })}
            </div>
            {expenses.map(exp => (
              <div key={exp.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">{exp.date} • {exp.category}</p>
                  </div>
                </div>
                <p className="font-bold text-red-600">-{exp.amount.toLocaleString()} so'm</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Moliyaviy hisobot</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 p-5 text-center">
                <p className="text-sm text-green-600">Jami daromad</p>
                <p className="text-2xl font-bold text-green-700">{(totalRevenue / 1000000).toFixed(1)}M so'm</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 p-5 text-center">
                <p className="text-sm text-red-600">Jami chiqim</p>
                <p className="text-2xl font-bold text-red-700">{(totalExpenses / 1000000).toFixed(1)}M so'm</p>
              </div>
              <div className={cn(
                "rounded-2xl border p-5 text-center",
                netProfit >= 0 ? "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
              )}>
                <p className="text-sm text-purple-600">Sof foyda</p>
                <p className={cn("text-2xl font-bold", netProfit >= 0 ? "text-purple-700" : "text-red-700")}>{(netProfit / 1000000).toFixed(1)}M so'm</p>
              </div>
            </div>

            {/* Top services */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h4 className="font-bold text-foreground mb-3">Eng daromadli xizmatlar</h4>
              {[
                { name: "Implant o'rnatish", revenue: 4000000, count: 3 },
                { name: "Breket o'rnatish", revenue: 5000000, count: 2 },
                { name: "Plomba qo'yish", revenue: 600000, count: 8 },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">{i + 1}.</span>
                    <span className="text-sm text-foreground">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{s.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{s.count} ta</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button><Download className="w-4 h-4 mr-1" /> Excel yuklab olish</Button>
              <Button variant="outline"><FileText className="w-4 h-4 mr-1" /> PDF hisobot</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DentalBillingPro;
