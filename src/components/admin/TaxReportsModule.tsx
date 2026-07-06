import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import {
  FileText, Download, Printer, Calculator, TrendingUp, Receipt, Building2,
  FileDown, Mail, Send, History, Lock, RefreshCw, CheckCircle2, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadTaxReportPDF } from "@/utils/generateTaxReportPDF";

const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const DEFAULT_RATE = 4;
const TAX_THRESHOLD = 5_000_000_000; // 5 mlrd so'm — aylanma solig'i majburiyati ostonasi

type Row = { source: string; method?: string | null; amount: number; count: number };
type HistoryRow = {
  id: string;
  actor_email: string | null;
  actor_role: string | null;
  year: number;
  month: number;
  rate: number;
  revenue: number;
  tax_amount: number;
  action: string;
  channel: string | null;
  recipient: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n));

const ACTION_LABEL: Record<string, string> = {
  generate: "🧮 Hisoblash",
  export_csv: "📊 CSV eksport",
  export_pdf: "📄 PDF eksport",
  print: "🖨️ Chop etish",
  send_email: "📧 Email yuborish",
  send_telegram: "✈️ Telegram yuborish",
};

const TaxReportsModule = () => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [rate, setRate] = useState<number>(DEFAULT_RATE);
  const [company, setCompany] = useState({
    name: "MED-ALL AI SYSTEM MCHJ",
    inn: "312972027",
    address: "Buxoro viloyati, G'ijduvon tumani, G'ijduvon MFY, G'ijduvon ko'chasi, 173 A-uy",
    director: "Shernazarov F.F",
    accountant: "Shernazarov F.F",
    tax_office: "G'ijduvon tuman STB",
    tax_office_code: "",
    phone: "",
    bank: "TOSHKENT SH., \"ANOR BANK\" AJ — h/r: 20208000007455262001, MFO: 01183",
  });
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [ytdRevenue, setYtdRevenue] = useState<number>(0);

  // Delivery
  const [emailTo, setEmailTo] = useState<string>("");
  const [telegramChatId, setTelegramChatId] = useState<string>("");
  const [sending, setSending] = useState<"email" | "telegram" | null>(null);

  // History
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isAllowed = userRole === "admin" || userRole === "tax_officer";

  const period = useMemo(() => {
    const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const to = new Date(Date.UTC(year, month, 1)).toISOString();
    return { from, to };
  }, [year, month]);

  const totals = useMemo(() => {
    const bySource = new Map<string, number>();
    let revenue = 0;
    rows.forEach(r => {
      revenue += r.amount;
      bySource.set(r.source, (bySource.get(r.source) || 0) + r.amount);
    });
    // Aylanma solig'i faqat yillik aylanma 5 mlrd so'mdan oshgandan keyin to'lanadi
    const thresholdReached = ytdRevenue >= TAX_THRESHOLD;
    const tax = thresholdReached ? Math.round((revenue * rate) / 100) : 0;
    return { revenue, tax, bySource, thresholdReached };
  }, [rows, rate, ytdRevenue]);

  const periodLabel = `${MONTHS_UZ[month - 1]} ${year}`;

  const logAudit = useCallback(async (params: {
    action: string;
    channel?: string;
    recipient?: string;
    status?: string;
    error?: string;
    revenue?: number;
    tax?: number;
  }) => {
    if (!user) return;
    try {
      await supabase.from("tax_report_history").insert({
        user_id: user.id,
        actor_email: user.email ?? null,
        actor_role: userRole ?? null,
        year, month, rate,
        revenue: params.revenue ?? totals.revenue,
        tax_amount: params.tax ?? totals.tax,
        action: params.action,
        channel: params.channel ?? null,
        recipient: params.recipient ?? null,
        status: params.status ?? "success",
        error: params.error ?? null,
        metadata: { company_inn: company.inn, sources: rows.length },
      } as any);
    } catch (e) {
      console.error("tax audit log error:", e);
    }
  }, [user, userRole, year, month, rate, totals, company.inn, rows.length]);

  const loadHistory = useCallback(async () => {
    if (!isAllowed) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("tax_report_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory((data ?? []) as HistoryRow[]);
    } catch (e: any) {
      console.error("history load error:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [isAllowed]);

  const load = async () => {
    setLoading(true);
    try {
      const ytdFrom = new Date(Date.UTC(year, 0, 1)).toISOString();
      const ytdTo = new Date(Date.UTC(year, month, 1)).toISOString();
      const [pp, inv, cp, aip, ppY, invY, cpY, aipY] = await Promise.all([
        supabase.from("platform_payments").select("amount,provider,status,paid_at,created_at")
          .eq("status", "paid").gte("paid_at", period.from).lt("paid_at", period.to),
        supabase.from("invoices").select("amount,payment_method,status,paid_at")
          .eq("status", "paid").gte("paid_at", period.from).lt("paid_at", period.to),
        supabase.from("clinic_payments").select("amount,provider,status,created_at")
          .eq("status", "paid").gte("created_at", period.from).lt("created_at", period.to),
        supabase.from("ai_payments").select("amount,payment_method,status,paid_at")
          .eq("status", "paid").gte("paid_at", period.from).lt("paid_at", period.to),
        supabase.from("platform_payments").select("amount").eq("status", "paid").gte("paid_at", ytdFrom).lt("paid_at", ytdTo),
        supabase.from("invoices").select("amount").eq("status", "paid").gte("paid_at", ytdFrom).lt("paid_at", ytdTo),
        supabase.from("clinic_payments").select("amount").eq("status", "paid").gte("created_at", ytdFrom).lt("created_at", ytdTo),
        supabase.from("ai_payments").select("amount").eq("status", "paid").gte("paid_at", ytdFrom).lt("paid_at", ytdTo),
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

      const nextRows = [
        ...agg(pp.data as any[], "SaaS to'lovlari (platform_payments)", "provider"),
        ...agg(inv.data as any[], "Hisob-fakturalar (invoices)", "payment_method"),
        ...agg(cp.data as any[], "Klinika to'lovlari (clinic_payments)", "provider"),
        ...agg(aip.data as any[], "AI xizmat to'lovlari (ai_payments)", "payment_method"),
      ];
      setRows(nextRows);

      const sumAmt = (d: any) => (d?.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      const ytd = sumAmt(ppY) + sumAmt(invY) + sumAmt(cpY) + sumAmt(aipY);
      setYtdRevenue(ytd);

      const revenue = nextRows.reduce((s, r) => s + r.amount, 0);
      const tax = ytd >= TAX_THRESHOLD ? Math.round((revenue * rate) / 100) : 0;
      await logAudit({ action: "generate", revenue, tax });
    } catch (e: any) {
      toast({ title: "Xato", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAllowed) return;
    load();
    loadHistory();
    // eslint-disable-next-line
  }, [year, month, isAllowed]);

  const exportCSV = async () => {
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
    await logAudit({ action: "export_csv" });
    loadHistory();
  };

  const printReport = async () => {
    window.print();
    await logAudit({ action: "print" });
    loadHistory();
  };

  const downloadOfficialPDF = async () => {
    downloadTaxReportPDF({
      period: { year, month },
      company, rate,
      revenue: totals.revenue,
      otherIncome: 0,
      rows,
    });
    toast({ title: "PDF tayyor", description: "my.soliq.uz shakliga muvofiq hisobot yuklab olindi." });
    await logAudit({ action: "export_pdf" });
    loadHistory();
  };

  const sendEmail = async () => {
    if (!emailTo || !/\S+@\S+\.\S+/.test(emailTo)) {
      toast({ title: "Noto'g'ri email", description: "Manzilni tekshiring", variant: "destructive" });
      return;
    }
    setSending("email");
    try {
      const sourcesHtml = `<table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#f1f5f9">
          <th style="text-align:left;padding:6px;border:1px solid #e2e8f0">Manba</th>
          <th style="text-align:left;padding:6px;border:1px solid #e2e8f0">Usul</th>
          <th style="text-align:right;padding:6px;border:1px solid #e2e8f0">Operatsiya</th>
          <th style="text-align:right;padding:6px;border:1px solid #e2e8f0">Summa (so'm)</th>
        </tr></thead><tbody>${rows.map(r => `<tr>
          <td style="padding:6px;border:1px solid #e2e8f0">${r.source}</td>
          <td style="padding:6px;border:1px solid #e2e8f0">${r.method || "—"}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;text-align:right">${r.count}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;text-align:right"><b>${fmt(r.amount)}</b></td>
        </tr>`).join("")}</tbody></table>`;

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "tax-report",
          recipientEmail: emailTo,
          idempotencyKey: `tax-report-${year}-${month}-${emailTo}-${Date.now()}`,
          templateData: {
            companyName: company.name,
            inn: company.inn,
            period: periodLabel,
            revenue: fmt(totals.revenue),
            rate,
            taxAmount: fmt(totals.tax),
            sourcesHtml,
            note: `Rasmiy PDF hisoboti alohida yuklab olinishi mumkin: my.soliq.uz shakli 0700_09.`,
          },
        },
      });
      if (error) throw error;
      toast({ title: "✅ Email yuborildi", description: emailTo });
      await logAudit({ action: "send_email", channel: "email", recipient: emailTo, status: "success" });
    } catch (e: any) {
      toast({ title: "Email xato", description: e.message, variant: "destructive" });
      await logAudit({ action: "send_email", channel: "email", recipient: emailTo, status: "failed", error: e.message });
    } finally {
      setSending(null);
      loadHistory();
    }
  };

  const sendTelegram = async () => {
    if (!telegramChatId || !/^-?\d+$/.test(telegramChatId.trim())) {
      toast({ title: "Noto'g'ri chat ID", description: "Faqat raqam kiriting", variant: "destructive" });
      return;
    }
    setSending("telegram");
    try {
      const lines: string[] = [];
      lines.push(`🧾 <b>AYLANMA SOLIG'I HISOBOTI</b>`);
      lines.push(`🏢 <b>${company.name}</b>`);
      lines.push(`🆔 STIR: <code>${company.inn}</code>`);
      lines.push(`📅 Davr: <b>${periodLabel}</b>`);
      lines.push(``);
      lines.push(`💰 Umumiy aylanma: <b>${fmt(totals.revenue)} so'm</b>`);
      lines.push(`📊 Stavka: <b>${rate}%</b>`);
      lines.push(`💸 To'lanishi lozim: <b>${fmt(totals.tax)} so'm</b>`);
      lines.push(``);
      lines.push(`<b>Manbalar:</b>`);
      rows.forEach(r => {
        lines.push(`• ${r.source} (${r.method || "—"}): <b>${fmt(r.amount)}</b> so'm × ${r.count}`);
      });
      lines.push(``);
      lines.push(`<i>Med1.uz — avtomatik hisobot</i>`);
      const message = lines.join("\n");

      const { error } = await supabase.functions.invoke("telegram-notify", {
        body: { type: "lab_result_direct", data: { chat_id: telegramChatId.trim(), message } },
      });
      if (error) throw error;
      toast({ title: "✅ Telegramga yuborildi", description: `Chat: ${telegramChatId}` });
      await logAudit({ action: "send_telegram", channel: "telegram", recipient: telegramChatId, status: "success" });
    } catch (e: any) {
      toast({ title: "Telegram xato", description: e.message, variant: "destructive" });
      await logAudit({ action: "send_telegram", channel: "telegram", recipient: telegramChatId, status: "failed", error: e.message });
    } finally {
      setSending(null);
      loadHistory();
    }
  };

  if (!isAllowed) {
    return (
      <Card>
        <CardContent className="p-10 text-center space-y-3">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">Kirish taqiqlangan</h3>
          <p className="text-sm text-muted-foreground">
            Ushbu bo'limga faqat <b>Super admin</b> va <b>Soliq xodimi</b> (tax_officer) rollari kira oladi.
          </p>
          <div className="text-xs text-muted-foreground">
            Sizning rolingiz: <Badge variant="outline">{userRole || "noma'lum"}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Soliq hisobotlari — Aylanma solig'i</h2>
            <Badge className="ml-2" variant="secondary">Rol: {userRole}</Badge>
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
            <div className="md:col-span-3 flex items-end gap-2 flex-wrap">
              <Button onClick={load} disabled={loading} variant="outline">
                <Calculator className="w-4 h-4 mr-1" /> Hisoblash
              </Button>
              <Button onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Excel (CSV)</Button>
              <Button onClick={downloadOfficialPDF} className="bg-primary">
                <FileDown className="w-4 h-4 mr-1" /> Rasmiy PDF
              </Button>
              <Button onClick={printReport} variant="secondary"><Printer className="w-4 h-4 mr-1" /> Chop</Button>
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

      {/* Auto delivery */}
      <Card className="print:hidden border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Avtomatik yuborish</h3>
            <Badge variant="outline" className="text-xs">Oy/yil tanlangandan keyin</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email manzil</Label>
                <Input
                  type="email"
                  placeholder="soliq@example.uz"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                />
              </div>
              <Button onClick={sendEmail} disabled={sending !== null || rows.length === 0}>
                {sending === "email" ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Mail className="w-4 h-4 mr-1" />}
                Emailga yuborish
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs flex items-center gap-1"><Send className="w-3 h-3" /> Telegram chat ID</Label>
                <Input
                  placeholder="123456789 yoki -100..."
                  value={telegramChatId}
                  onChange={e => setTelegramChatId(e.target.value)}
                />
              </div>
              <Button onClick={sendTelegram} disabled={sending !== null || rows.length === 0} variant="secondary">
                {sending === "telegram" ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                Telegramga
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Chat ID olish uchun @userinfobot yoki @Med1uzInfoBot foydalaning. Kanal uchun ID <code>-100...</code> bilan boshlanadi.
          </p>
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
              <div className="col-span-2"><b>Yuridik manzil:</b> {company.address}</div>
              <div className="col-span-2"><b>Bank rekvizitlari:</b> {company.bank}</div>
              <div><b>Soliq inspeksiyasi:</b> {company.tax_office}</div>
              <div><b>Telefon:</b> {company.phone || "—"}</div>
            </div>

            {!totals.thresholdReached && (
              <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-lg p-3 text-sm">
                ⚠️ <b>Diqqat:</b> Yillik aylanma <b>{fmt(TAX_THRESHOLD)} so'm</b>dan oshmagan
                (joriy YTD: <b>{fmt(ytdRevenue)} so'm</b>). Aylanma solig'i <u>to'lanmaydi</u>.
                Hisobot faqat ma'lumot uchun shakllantirildi.
              </div>
            )}

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

      {/* History / audit log */}
      <Card className="print:hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Generatsiya tarixi va audit log</h3>
              <Badge variant="outline">{history.length}</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={loadHistory} disabled={historyLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${historyLoading ? "animate-spin" : ""}`} /> Yangilash
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Davr</TableHead>
                  <TableHead>Amal</TableHead>
                  <TableHead>Manzil</TableHead>
                  <TableHead className="text-right">Aylanma</TableHead>
                  <TableHead className="text-right">Soliq</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                      {historyLoading ? "Yuklanmoqda..." : "Tarix bo'sh"}
                    </TableCell>
                  </TableRow>
                ) : history.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(h.created_at).toLocaleString("uz-UZ")}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{h.actor_email || "—"}</div>
                      <div className="text-muted-foreground">{h.actor_role || "—"}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">{MONTHS_UZ[h.month - 1]} {h.year}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {ACTION_LABEL[h.action] || h.action}
                    </TableCell>
                    <TableCell className="text-xs">{h.recipient || "—"}</TableCell>
                    <TableCell className="text-right text-xs">{fmt(Number(h.revenue))}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{fmt(Number(h.tax_amount))}</TableCell>
                    <TableCell>
                      {h.status === "success" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive" title={h.error || undefined}>
                          <XCircle className="w-3 h-3 mr-1" /> {h.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
