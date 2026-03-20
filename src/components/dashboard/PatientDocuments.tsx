import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, CreditCard, Printer, Receipt, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadInvoicePDF, downloadInvoiceTxt, type InvoiceData } from "@/utils/downloadInvoice";

const statusLabels: Record<string, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { text: "Kutilmoqda", variant: "outline" },
  confirmed: { text: "Tasdiqlangan", variant: "default" },
  cancelled: { text: "Bekor qilingan", variant: "destructive" },
  completed: { text: "Yakunlangan", variant: "secondary" },
  paid: { text: "To'langan", variant: "default" },
};

const invoiceTypeLabels: Record<string, string> = {
  ai_service: "AI Xizmat",
  clinic_service: "Klinika",
  diagnostics: "Diagnostika",
  cosmetology: "Kosmetologiya",
  pharmacy: "Dorixona",
  subscription: "Obuna",
  service: "Xizmat",
};

const generateAppointmentInvoice = (a: any): InvoiceData => ({
  invoiceNumber: `MED-APT-${a.id?.slice(0, 8).toUpperCase()}`,
  userName: a.patient_name,
  userPhone: a.patient_phone,
  userEmail: "",
  serviceType: "Klinika qabuli",
  serviceName: a.clinic_services?.name || "Konsultatsiya",
  amount: a.total_price || 0,
  paymentMethod: "Naqd / Karta",
  status: a.status === "completed" || a.status === "confirmed" ? "paid" : "pending",
  paidAt: a.created_at,
  metadata: {
    "Klinika": a.registered_clinics?.name || "—",
    "Shifokor": a.doctors?.full_name ? `Dr. ${a.doctors.full_name}` : "—",
    "Sana": a.appointment_date,
    "Vaqt": a.appointment_time?.slice(0, 5),
  },
});

const PatientDocuments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("appointments")
        .select("*, registered_clinics(name, address, phone), doctors(full_name, specialty), clinic_services(name, price)")
        .eq("patient_id", user.id)
        .order("appointment_date", { ascending: false }),
      supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([aptRes, invRes]) => {
      setAppointments(aptRes.data || []);
      setInvoices(invRes.data || []);
      setLoading(false);
    });

    // Realtime subscription for new invoices
    const channel = supabase
      .channel("patient-invoices")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "invoices", filter: `user_id=eq.${user.id}` }, (payload) => {
        setInvoices((prev) => [payload.new as any, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const downloadCSV = () => {
    const allItems = [
      ...appointments.map((a) => ({
        sana: a.appointment_date,
        vaqt: a.appointment_time?.slice(0, 5),
        tur: "Qabul",
        nomi: a.clinic_services?.name || "Konsultatsiya",
        muassasa: a.registered_clinics?.name || "",
        narx: a.total_price || "0",
        holat: statusLabels[a.status]?.text || a.status,
      })),
      ...invoices.map((inv) => ({
        sana: new Date(inv.created_at).toISOString().slice(0, 10),
        vaqt: new Date(inv.created_at).toISOString().slice(11, 16),
        tur: invoiceTypeLabels[inv.invoice_type] || inv.invoice_type,
        nomi: inv.service_name || "—",
        muassasa: inv.service_type || "—",
        narx: inv.amount || "0",
        holat: statusLabels[inv.status]?.text || inv.status,
      })),
    ];
    const headers = ["Sana", "Vaqt", "Tur", "Nomi", "Muassasa", "Narx", "Holat"];
    const rows = allItems.map((r) => Object.values(r).map((c) => `"${c}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hujjatlar_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>;

  const hasData = appointments.length > 0 || invoices.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">📄 Hujjatlar va to'lovlar</h2>
        {hasData && (
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="w-4 h-4 mr-1" /> Excel
          </Button>
        )}
      </div>

      {!hasData ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Hujjatlar yo'q</h3>
          <p className="text-muted-foreground text-sm">Qabuldan o'tganingizdan keyin hujjatlar shu yerda paydo bo'ladi</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Barchasi</TabsTrigger>
            <TabsTrigger value="invoices">🧾 Invoicelar ({invoices.length})</TabsTrigger>
            <TabsTrigger value="appointments">📅 Qabullar ({appointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-3">
              {invoices.map((inv) => (
                <InvoiceCard key={inv.id} invoice={inv} />
              ))}
              {appointments.map((a) => (
                <AppointmentCard key={a.id} appointment={a} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-3">
              {invoices.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Invoice topilmadi</p>
              ) : invoices.map((inv) => (
                <InvoiceCard key={inv.id} invoice={inv} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Qabullar topilmadi</p>
              ) : appointments.map((a) => (
                <AppointmentCard key={a.id} appointment={a} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

const InvoiceCard = ({ invoice }: { invoice: any }) => {
  const st = statusLabels[invoice.status] || statusLabels.pending;
  const invoiceData: InvoiceData = {
    invoiceNumber: invoice.invoice_number,
    userName: (invoice.metadata as any)?.user_name || "—",
    userPhone: (invoice.metadata as any)?.user_phone || "—",
    userEmail: (invoice.metadata as any)?.user_email || "—",
    serviceType: invoiceTypeLabels[invoice.invoice_type] || invoice.invoice_type,
    serviceName: invoice.service_name || "—",
    amount: invoice.amount,
    paymentMethod: invoice.payment_method || "—",
    status: invoice.status as any,
    paidAt: invoice.paid_at || invoice.created_at,
    metadata: typeof invoice.metadata === "object" ? invoice.metadata : {},
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Receipt className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-foreground text-sm">{invoice.invoice_number}</span>
          <Badge variant={st.variant} className="text-[10px]">{st.text}</Badge>
          <Badge variant="outline" className="text-[10px]">{invoiceTypeLabels[invoice.invoice_type] || invoice.invoice_type}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(invoice.created_at).toLocaleDateString("uz-UZ")} • {invoice.service_name || "—"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {invoice.amount > 0 && (
          <span className="text-sm font-bold text-primary">{Number(invoice.amount).toLocaleString()} so'm</span>
        )}
        <Button variant="outline" size="sm" onClick={() => downloadInvoicePDF(invoiceData)}>
          <Printer className="w-3.5 h-3.5 mr-1" /> PDF
        </Button>
        <Button variant="ghost" size="sm" onClick={() => downloadInvoiceTxt(invoiceData)}>
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

const AppointmentCard = ({ appointment }: { appointment: any }) => {
  const a = appointment;
  const st = statusLabels[a.status] || statusLabels.pending;
  const invoiceData = generateAppointmentInvoice(a);

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
        <CreditCard className="w-5 h-5 text-accent-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-foreground text-sm truncate">{a.registered_clinics?.name || "Klinika"}</span>
          <Badge variant={st.variant} className="text-[10px]">{st.text}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {a.appointment_date} • {a.doctors?.full_name ? `Dr. ${a.doctors.full_name}` : ""} • {a.clinic_services?.name || "Konsultatsiya"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {a.total_price > 0 && (
          <span className="text-sm font-bold text-primary">{Number(a.total_price).toLocaleString()} so'm</span>
        )}
        <Button variant="outline" size="sm" onClick={() => downloadInvoicePDF(invoiceData)}>
          <Printer className="w-3.5 h-3.5 mr-1" /> Chek
        </Button>
      </div>
    </div>
  );
};

export default PatientDocuments;
