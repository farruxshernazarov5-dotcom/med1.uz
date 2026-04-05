export interface HMSReceiptData {
  clinicName: string;
  patientName: string;
  patientPhone?: string;
  patientId?: string;
  invoiceNumber: string;
  date: string;
  items: Array<{ name: string; qty: number; price: number }>;
  discount?: number;
  paymentMethod?: string;
  verificationCode?: string;
  notes?: string;
}

export function generateHMSReceiptHTML(data: HMSReceiptData): string {
  const subtotal = data.items.reduce((s, it) => s + it.qty * it.price, 0);
  const discount = data.discount || 0;
  const total = subtotal - discount;
  const qrUrl = data.verificationCode
    ? `https://med1-uz.lovable.app/verify/${data.verificationCode}`
    : `https://med1-uz.lovable.app/report/${data.invoiceNumber}`;
  const payLabel = data.paymentMethod === "cash" ? "Naqd" : data.paymentMethod === "card" ? "Karta" : data.paymentMethod === "transfer" ? "O'tkazma" : data.paymentMethod || "—";

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8">
<title>Chek ${data.invoiceNumber} — ${esc(data.clinicName)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;color:#1e293b;background:#f8fafc;padding:30px 16px}
  .receipt{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#0A2540,#2F80ED);padding:28px 24px;text-align:center;color:#fff}
  .header h1{font-size:20px;font-weight:800;letter-spacing:-0.5px}
  .header p{font-size:11px;opacity:.7;margin-top:4px}
  .badge{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;margin-top:8px;color:#fff}
  .body{padding:24px}
  .info{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
  .info-item{background:#f8fafc;border-radius:8px;padding:10px 12px}
  .info-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .info-value{font-size:13px;font-weight:600;color:#1e293b}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#f1f5f9;padding:8px 12px;font-size:11px;text-align:left;color:#64748b;font-weight:600}
  td{padding:8px 12px;font-size:12px;border-bottom:1px solid #f1f5f9}
  .total-row{background:#f0f7ff;font-weight:700}
  .total-row td{color:#0066ff;font-size:14px;padding:12px}
  .footer{text-align:center;padding:20px 24px;border-top:1px dashed #e2e8f0}
  .footer p{font-size:10px;color:#94a3b8;line-height:1.6}
  .qr{margin:12px auto;display:block;border-radius:8px}
  .verify-code{font-family:monospace;font-size:12px;color:#0066ff;font-weight:700;margin-top:6px}
  @media print{body{padding:0;background:#fff}.receipt{box-shadow:none;border-radius:0}}
</style></head><body>
<div class="receipt">
  <div class="header">
    <h1>🏥 ${esc(data.clinicName)}</h1>
    <p>MED1.UZ — Tibbiy platforma</p>
    <div class="badge">CHEK / RECEIPT</div>
  </div>
  <div class="body">
    <div class="info">
      <div class="info-item"><div class="info-label">Bemor</div><div class="info-value">${esc(data.patientName)}</div></div>
      <div class="info-item"><div class="info-label">Telefon</div><div class="info-value">${esc(data.patientPhone || "—")}</div></div>
      <div class="info-item"><div class="info-label">Chek raqami</div><div class="info-value">${esc(data.invoiceNumber)}</div></div>
      <div class="info-item"><div class="info-label">Sana</div><div class="info-value">${esc(data.date)}</div></div>
    </div>
    <table>
      <tr><th>Xizmat</th><th>Soni</th><th>Narxi</th><th>Jami</th></tr>
      ${data.items.map(it => `<tr><td>${esc(it.name)}</td><td>${it.qty}</td><td>${it.price.toLocaleString()} so'm</td><td>${(it.qty * it.price).toLocaleString()} so'm</td></tr>`).join("")}
      ${discount > 0 ? `<tr><td colspan="3" style="text-align:right;color:#64748b">Chegirma:</td><td style="color:#dc2626">-${discount.toLocaleString()} so'm</td></tr>` : ""}
      <tr class="total-row"><td colspan="3" style="text-align:right">JAMI:</td><td>${total.toLocaleString()} so'm</td></tr>
    </table>
    <div class="info" style="grid-template-columns:1fr">
      <div class="info-item"><div class="info-label">To'lov usuli</div><div class="info-value">${esc(payLabel)}</div></div>
    </div>
    ${data.notes ? `<p style="font-size:11px;color:#64748b;margin-top:8px">📝 ${esc(data.notes)}</p>` : ""}
  </div>
  <div class="footer">
    <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}" alt="QR" width="120" height="120" />
    ${data.verificationCode ? `<p class="verify-code">ID: ${esc(data.verificationCode)}</p>` : ""}
    <p>Ushbu chek Med1.uz tibbiy platformasida yaratilgan.<br/>Haqiqiyligini QR kod orqali tekshiring.<br/>© ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan</p>
  </div>
</div></body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function downloadHMSReceipt(data: HMSReceiptData) {
  const html = generateHMSReceiptHTML(data);
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

export function printHMSReceipt(data: HMSReceiptData) {
  downloadHMSReceipt(data);
}
