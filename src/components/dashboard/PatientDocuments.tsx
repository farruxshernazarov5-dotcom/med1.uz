import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Calendar, Building2, User, CreditCard, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  cancelled: "Bekor qilingan",
  completed: "Yakunlangan",
};

const generateReceiptHTML = (appointment: any) => {
  const clinic = appointment.registered_clinics;
  const doctor = appointment.doctors;
  const service = appointment.clinic_services;
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>To'lov cheki - Med1.uz</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1a1a2e}
  .header{text-align:center;border-bottom:2px solid #0ea5e9;padding-bottom:20px;margin-bottom:30px}
  .logo{font-size:28px;font-weight:bold;color:#0ea5e9}
  .subtitle{color:#64748b;font-size:14px;margin-top:4px}
  .receipt-id{background:#f1f5f9;padding:12px;border-radius:8px;margin-bottom:20px;font-size:13px}
  .section{margin-bottom:24px}
  .section h3{font-size:14px;text-transform:uppercase;color:#64748b;margin-bottom:12px;letter-spacing:1px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9}
  .row .label{color:#64748b;font-size:14px}
  .row .value{font-weight:600;font-size:14px}
  .total{display:flex;justify-content:space-between;padding:16px 0;border-top:2px solid #0ea5e9;margin-top:16px;font-size:18px;font-weight:bold}
  .total .amount{color:#0ea5e9}
  .footer{text-align:center;margin-top:40px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:20px}
  @media print{body{padding:20px}button{display:none!important}}
</style></head><body>
  <div class="header"><div class="logo">Med1.uz</div><div class="subtitle">To'lov cheki</div></div>
  <div class="receipt-id"><strong>Chek №:</strong> ${appointment.id?.slice(0, 8).toUpperCase()}<br>
  <strong>Sana:</strong> ${new Date(appointment.created_at).toLocaleDateString("uz-UZ")}</div>
  <div class="section"><h3>Klinika ma'lumotlari</h3>
    <div class="row"><span class="label">Klinika:</span><span class="value">${clinic?.name || "-"}</span></div>
    <div class="row"><span class="label">Manzil:</span><span class="value">${clinic?.address || "-"}</span></div>
    <div class="row"><span class="label">Telefon:</span><span class="value">${clinic?.phone || "-"}</span></div>
  </div>
  <div class="section"><h3>Qabul ma'lumotlari</h3>
    <div class="row"><span class="label">Shifokor:</span><span class="value">${doctor?.full_name ? "Dr. " + doctor.full_name : "-"}</span></div>
    <div class="row"><span class="label">Xizmat:</span><span class="value">${service?.name || "Konsultatsiya"}</span></div>
    <div class="row"><span class="label">Sana:</span><span class="value">${appointment.appointment_date}</span></div>
    <div class="row"><span class="label">Vaqt:</span><span class="value">${appointment.appointment_time?.slice(0, 5)}</span></div>
    <div class="row"><span class="label">Holat:</span><span class="value">${statusLabels[appointment.status] || appointment.status}</span></div>
  </div>
  <div class="section"><h3>Bemor ma'lumotlari</h3>
    <div class="row"><span class="label">Ism:</span><span class="value">${appointment.patient_name}</span></div>
    <div class="row"><span class="label">Telefon:</span><span class="value">${appointment.patient_phone}</span></div>
    ${appointment.notes ? `<div class="row"><span class="label">Izoh:</span><span class="value">${appointment.notes}</span></div>` : ""}
  </div>
  <div class="total"><span>Jami to'lov:</span><span class="amount">${appointment.total_price ? Number(appointment.total_price).toLocaleString() + " so'm" : "Bepul"}</span></div>
  <div class="footer"><p>Med1.uz — O'zbekistonning zamonaviy tibbiy platformasi</p><p>Bu hujjat avtomatik tarzda yaratilgan</p></div>
</body></html>`;
};

const downloadPDF = (appointment: any) => {
  const html = generateReceiptHTML(appointment);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => win.print(), 500);
    };
  }
};

const downloadCSV = (appointments: any[]) => {
  const headers = ["Sana", "Vaqt", "Klinika", "Shifokor", "Xizmat", "Narx", "Holat"];
  const rows = appointments.map((a) => [
    a.appointment_date,
    a.appointment_time?.slice(0, 5),
    a.registered_clinics?.name || "",
    a.doctors?.full_name || "",
    a.clinic_services?.name || "",
    a.total_price || "0",
    statusLabels[a.status] || a.status,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((c: any) => `"${c}"`).join(","))].join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `qabullar_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const PatientDocuments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("appointments")
      .select("*, registered_clinics(name, address, phone), doctors(full_name, specialty), clinic_services(name, price)")
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        setAppointments(data || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">📄 Hujjatlar va to'lovlar</h2>
        {appointments.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => downloadCSV(appointments)}>
            <Download className="w-4 h-4 mr-1" /> Excel yuklab olish
          </Button>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Hujjatlar yo'q</h3>
          <p className="text-muted-foreground text-sm">Qabuldan o'tganingizdan keyin hujjatlar shu yerda paydo bo'ladi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-foreground text-sm truncate">{a.registered_clinics?.name}</span>
                  <Badge variant="outline" className="text-[10px]">{statusLabels[a.status]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.appointment_date} • {a.doctors?.full_name ? `Dr. ${a.doctors.full_name}` : ""} • {a.clinic_services?.name || "Konsultatsiya"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {a.total_price > 0 && (
                  <span className="text-sm font-bold text-primary">{Number(a.total_price).toLocaleString()} so'm</span>
                )}
                <Button variant="outline" size="sm" onClick={() => downloadPDF(a)}>
                  <Printer className="w-3.5 h-3.5 mr-1" /> Chek
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientDocuments;
