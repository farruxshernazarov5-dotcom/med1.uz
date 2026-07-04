import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, Download, Printer, Calculator, TrendingUp, Receipt, Building2, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadTaxReportPDF } from "@/utils/generateTaxReportPDF";

const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

// Aylanma soliq (Turnover tax) — Uzbekistonda standart stavka
const DEFAULT_RATE = 4;

type Row = {
  source: string;
  method?: string | null;
  amount: number;
  count: number;
};

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n));

const TaxReportsModule = () => {
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1); // 1..12
  const [rate, setRate] = useState<number>(DEFAULT_RATE);
  const [company, setCompany] = useState({
    name: "MED-ALL AI SYSTEM MCHJ",
    inn: "309876543",
    address: "Toshkent shahri",
    director: "",
    accountant: "",
    tax_office: "Toshkent shahar STB",
  });
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const period = useMemo(() => {
    const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const to = new Date(Date.UTC(year, month, 1)).toISOString();
    return { from, to };
  }, [year, month]);

  const load = async () => {
    setLoading(true);
    try {
      const [pp, inv, cp, aip] = await Promise.all([
        supabase.from("platform_payments").select("amount,provider,status,paid_at,created_at")
          .eq("status", "paid").gte("paid_at", period.from).lt("paid_at", period.to),
        supabase.from("invoices").select("amount,payment_method,status,paid_at")
          .eq("status", "paid").gte("paid_at", period.from).lt("paid_at", period.to),
        supabase.from("clinic_payments").select("amount,provider,status,created_at")
          .eq("status", "paid").gte("created_at", period.from).lt("created_at", period.to),
        supabase.from("ai_payments").select("amount,payment_method,status,paid_at")
          .eq("status", "paid").gte("paid_at", period.from).lt("paid_at", period.to),
      ]);

      const agg = (data: any[] | null, source: string, key: string): Row[] => {
        const map = new Map<string, Row>();
        (data || []).forEach((r: any) => {
          const m = r[key] || "—";
          const cur = map.get(m) || { source, method: m, amount: 0, count: 0 };
          cur.amount += Number(r.amount || 0);
          cur.count += 1;
          map.set(m, cur);
        });
        return [...map.values()];
      };

      setRows([
        ...agg(pp.data as any[], "SaaS to'lovlari (platform_payments)", "provider"),
        ...agg(inv.data as any[], "Hisob-fakturalar (invoices)", "payment_method"),
        ...agg(cp.data as any[], "Klinika to'lovlari (clinic_payments)", "provider"),
        ...agg(aip.data as any[], "AI xizmat to'lovlari (ai_payments)", "payment_method"),
      ]);
    } catch (e: any) {
      toast({ title: "Xato", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year, month]);

  const totals = useMemo(() => {
    const bySource = new Map<string, number>();
    let revenue = 0;
    rows.forEach(r => {
      revenue += r.amount;
      bySource.set(r.source, (bySource.get(r.source) || 0) + r.amount);
    });
    const tax = Math.round((revenue * rate) / 100);
    return { revenue, tax, bySource };
  }, [rows, rate]);

  const periodLabel = `${MONTHS_UZ[month - 1]} ${year}`;

  const exportCSV = () => {
    const header = ["Manba", "To'lov usuli", "Operatsiyalar", "Summa (so'm)"];
    const body = rows.map(r => [r.source, r.method || "", r.count, r.amount]);
    body.push(["JAMI AYLANMA", "", rows.reduce((s, r) => s + r.count, 0), totals.revenue] as any);
    body.push([`AYLANMA SOLIG'I (${rate}%)`, "", "", totals.tax] as any);
    const csv = [header, ...body].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `aylanma-soliq-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  const downloadOfficialPDF = () => {
    downloadTaxReportPDF({
      period: { year, month },
      company,
      rate,
      revenue: totals.revenue,
      otherIncome: 0,
      rows,
    });
    toast({ title: "PDF tayyor", description: "my.soliq.uz shakliga muvofiq hisobot yuklab olindi." });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Soliq hisobotlari — Aylanma solig'i</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <Label>Yil</Label>
              <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
            </div>
            <div>
              <Label>Oy</Label>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS_UZ.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Soliq stavkasi (%)</Label>
              <Input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} />
            </div>
            <div className="md:col-span-3 flex items-end gap-2">
              <Button onClick={load} disabled={loading} variant="outline">
                <Calculator className="w-4 h-4 mr-1" /> Hisoblash
              </Button>
              <Button onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Excel (CSV)</Button>
              <Button onClick={printReport} variant="secondary"><Printer className="w-4 h-4 mr-1" /> Chop / PDF</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t">
            <div>
              <Label>Tashkilot nomi</Label>
              <Input value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
            </div>
            <div>
              <Label>STIR (INN)</Label>
              <Input value={company.inn} onChange={e => setCompany({ ...company, inn: e.target.value })} />
            </div>
            <div>
              <Label>Soliq inspeksiyasi</Label>
              <Input value={company.tax_office} onChange={e => setCompany({ ...company, tax_office: e.target.value })} />
            </div>
            <div>
              <Label>Manzil</Label>
              <Input value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} />
            </div>
            <div>
              <Label>Rahbar (F.I.O.)</Label>
              <Input value={company.director} onChange={e => setCompany({ ...company, director: e.target.value })} />
            </div>
            <div>
              <Label>Bosh hisobchi (F.I.O.)</Label>
              <Input value={company.accountant} onChange={e => setCompany({ ...company, accountant: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="w-4 h-4" /> Umumiy aylanma</div>
          <div className="text-2xl font-bold mt-1">{fmt(totals.revenue)} so'm</div>
          <div className="text-xs text-muted-foreground mt-1">{periodLabel}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Calculator className="w-4 h-4" /> Aylanma solig'i ({rate}%)</div>
          <div className="text-2xl font-bold mt-1 text-primary">{fmt(totals.tax)} so'm</div>
          <div className="text-xs text-muted-foreground mt-1">To'lash summasi</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Building2 className="w-4 h-4" /> Daromad manbalari</div>
          <div className="text-2xl font-bold mt-1">{totals.bySource.size}</div>
          <div className="text-xs text-muted-foreground mt-1">Aktiv kanallar</div>
        </CardContent></Card>
      </div>

      {/* Official-style report */}
      <Card>
        <CardContent className="p-6 print:p-0">
          <div id="tax-report-print" className="space-y-4 text-foreground">
            <div className="text-center space-y-1 border-b pb-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">O'zbekiston Respublikasi Davlat Soliq Qo'mitasi</div>
              <h1 className="text-xl font-bold">AYLANMA SOLIG'I BO'YICHA HISOBOT</h1>
              <div className="text-sm">Hisobot davri: <b>{periodLabel}</b></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Soliq to'lovchi:</b> {company.name}</div>
              <div><b>STIR:</b> {company.inn}</div>
              <div><b>Manzil:</b> {company.address}</div>
              <div><b>Soliq inspeksiyasi:</b> {company.tax_office}</div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Daromadlar tarkibi</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Daromad manbai</TableHead>
                    <TableHead>To'lov usuli</TableHead>
                    <TableHead className="text-right">Operatsiyalar</TableHead>
                    <TableHead className="text-right">Summa (so'm)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      {loading ? "Yuklanmoqda..." : "Ushbu davr uchun to'lovlar topilmadi"}
                    </TableCell></TableRow>
                  ) : rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.source}</TableCell>
                      <TableCell><Badge variant="outline">{r.method || "—"}</Badge></TableCell>
                      <TableCell className="text-right">{r.count}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3}>JAMI AYLANMA (soliq bazasi)</TableCell>
                    <TableCell className="text-right">{rows.reduce((s, r) => s + r.count, 0)}</TableCell>
                    <TableCell className="text-right">{fmt(totals.revenue)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold mb-3">Soliq hisob-kitobi</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>1. Soliq bazasi (jami aylanma):</div>
                <div className="text-right font-semibold">{fmt(totals.revenue)} so'm</div>
                <div>2. Soliq stavkasi:</div>
                <div className="text-right font-semibold">{rate}%</div>
                <div className="border-t pt-2">3. To'lanishi lozim bo'lgan soliq:</div>
                <div className="border-t pt-2 text-right font-bold text-primary text-lg">{fmt(totals.tax)} so'm</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 text-sm">
              <div>
                <div className="border-b pb-1 mb-1">{company.director || "____________________"}</div>
                <div className="text-muted-foreground text-xs">Rahbar (imzo)</div>
              </div>
              <div>
                <div className="border-b pb-1 mb-1">{company.accountant || "____________________"}</div>
                <div className="text-muted-foreground text-xs">Bosh hisobchi (imzo)</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Hisobot avtomatik ravishda MED1.UZ platformasi orqali {new Date().toLocaleDateString("uz-UZ")} sanasida shakllantirildi.
              Rasmiy topshirish uchun my.soliq.uz portali orqali yuklang.
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #tax-report-print, #tax-report-print * { visibility: visible; }
          #tax-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
        }
      `}</style>
    </div>
  );
};

export default TaxReportsModule;
