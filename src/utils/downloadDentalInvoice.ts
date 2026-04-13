export interface DentalInvoiceData {
  clinicName: string;
  invoiceNumber: string;
  patientName: string;
  patientPhone: string;
  date: string;
  items: Array<{ name: string; qty: number; price: number }>;
  payments: Array<{ method: string; amount: number; date: string }>;
  totalAmount: number;
  paidAmount: number;
  status: string;
  verificationCode: string;
}

const methodLabels: Record<string, string> = {
  cash: "💵 Naqd",
  card: "💳 Karta",
  click: "📱 Click",
  payme: "📱 Payme",
  insurance: "🏥 Sug'urta",
  multi: "🔄 Ko'p usulda",
};

const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
  paid: { text: "✅ TO'LANGAN", color: "#16a34a", bg: "#f0fdf4" },
  partial: { text: "⏳ QISMAN TO'LANGAN", color: "#d97706", bg: "#fffbeb" },
  unpaid: { text: "❌ TO'LANMAGAN", color: "#dc2626", bg: "#fef2f2" },
};

function esc(s: string): string {
  if (!s) return "—";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateDentalInvoiceHTML(data: DentalInvoiceData): string {
  const st = statusLabels[data.status] || statusLabels.unpaid;
  const debt = Math.max(0, data.totalAmount - data.paidAmount);
  const qrUrl = `https://med1-uz.lovable.app/verify/${data.verificationCode}`;

  const paymentRows = data.payments.map(p =>
    `<tr>
      <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f1f5f9">${esc(p.date)}</td>
      <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f1f5f9">${methodLabels[p.method] || p.method}</td>
      <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#16a34a;font-weight:600">+${Number(p.amount).toLocaleString()} so'm</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8">
<title>Invoice ${esc(data.invoiceNumber)} — ${esc(data.clinicName)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;color:#1e293b;background:#f1f5f9;min-height:100vh;padding:30px 16px}
  .invoice{max-width:680px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px -12px rgba(0,0,0,.12)}
  .header{background:linear-gradient(135deg,#0A2540 0%,#1e3a5f 40%,#2563eb 100%);padding:36px 32px;position:relative;overflow:hidden}
  .header::before{content:'';position:absolute;top:-50%;right:-10%;width:400px;height:400px;border-radius:50%;background:rgba(255,255,255,.03)}
  .header-top{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1}
  .logo{font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px}
  .logo span{color:#60a5fa}
  .subtitle{color:rgba(255,255,255,.5);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-top:2px}
  .inv-num{text-align:right}
  .inv-num .lbl{color:rgba(255,255,255,.5);font-size:10px;text-transform:uppercase;letter-spacing:2px}
  .inv-num .val{color:#fff;font-size:16px;font-weight:700;margin-top:3px;font-family:monospace}
  .badge-row{display:flex;gap:8px;margin-top:16px;position:relative;z-index:1}
  .hbadge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:#fff;padding:6px 16px;border-radius:30px;font-size:12px;font-weight:600}
  
  .body{padding:32px}
  .status-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-radius:14px;margin-bottom:24px;background:${st.bg};border:2px solid ${st.color}20}
  .status-text{font-weight:800;color:${st.color};font-size:15px}
  .status-date{color:#64748b;font-size:12px}
  
  .section{margin-bottom:24px}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px}
  .section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#e2e8f0,transparent)}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .info-item{background:#f8fafc;border-radius:12px;padding:12px 14px;border:1px solid #e2e8f0}
  .info-label{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:600}
  .info-value{font-size:13px;font-weight:700;color:#1e293b}
  
  table{width:100%;border-collapse:collapse}
  th{background:#f1f5f9;padding:8px 12px;font-size:10px;text-align:left;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px}
  td{padding:8px 12px;font-size:12px;border-bottom:1px solid #f1f5f9}
  
  .total-box{background:linear-gradient(135deg,#0A2540,#2563eb);border-radius:16px;padding:24px;display:flex;justify-content:space-between;align-items:center;margin-top:24px;position:relative;overflow:hidden}
  .total-box::after{content:'';position:absolute;top:-30%;right:-8%;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.04)}
  .total-label{color:rgba(255,255,255,.7);font-size:13px}
  .total-sub{color:rgba(255,255,255,.4);font-size:11px;margin-top:3px}
  .total-amount{color:#fff;font-size:32px;font-weight:900;letter-spacing:-1px;position:relative;z-index:1}
  .total-currency{color:#60a5fa;font-size:14px;font-weight:600;margin-left:6px}
  
  .debt-bar{background:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:14px 20px;margin-top:12px;display:flex;justify-content:space-between;align-items:center}
  .debt-label{color:#dc2626;font-size:13px;font-weight:600}
  .debt-amount{color:#dc2626;font-size:20px;font-weight:900}
  
  .qr-section{text-align:center;margin-top:28px;padding-top:24px;border-top:2px dashed #e2e8f0}
  .qr-section img{width:120px;height:120px;margin:10px auto;display:block;border-radius:10px;border:3px solid #f1f5f9}
  .qr-text{font-size:10px;color:#94a3b8;font-weight:500}
  .verify-code{font-family:monospace;font-size:11px;color:#2563eb;font-weight:700;margin-top:4px}
  
  .footer{text-align:center;padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0}
  .footer p{font-size:11px;color:#94a3b8;line-height:2}
  .footer .brand{color:#2563eb;font-weight:800}
  .footer .secure{display:inline-flex;align-items:center;gap:3px;color:#16a34a;font-weight:600}
  
  @media print{body{padding:0;background:#fff}.invoice{box-shadow:none;border-radius:0}button{display:none!important}}
  .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:120px;font-weight:900;color:rgba(37,99,235,.03);pointer-events:none;z-index:0}
</style></head><body>
<div class="watermark">MED1.UZ</div>
<div class="invoice">
  <div class="header">
    <div class="header-top">
      <div>
        <div class="logo">🦷 ${esc(data.clinicName)}</div>
        <div class="subtitle">Med1.uz • Stomatologiya</div>
      </div>
      <div class="inv-num">
        <div class="lbl">Invoice raqami</div>
        <div class="val">${esc(data.invoiceNumber)}</div>
      </div>
    </div>
    <div class="badge-row">
      <div class="hbadge">🧾 CHEK / INVOICE</div>
      <div class="hbadge">🔒 VERIFIED</div>
    </div>
  </div>
  <div class="body">
    <div class="status-bar">
      <span class="status-text">${st.text}</span>
      <span class="status-date">📅 ${esc(data.date)}</span>
    </div>
    
    <div class="section">
      <div class="section-title">👤 Bemor ma'lumotlari</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Ism</div><div class="info-value">${esc(data.patientName)}</div></div>
        <div class="info-item"><div class="info-label">Telefon</div><div class="info-value">${esc(data.patientPhone)}</div></div>
        <div class="info-item"><div class="info-label">Invoice</div><div class="info-value">${esc(data.invoiceNumber)}</div></div>
        <div class="info-item"><div class="info-label">Sana</div><div class="info-value">${esc(data.date)}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📋 Xizmatlar</div>
      <table>
        <tr><th>#</th><th>Xizmat</th><th>Soni</th><th style="text-align:right">Narx</th><th style="text-align:right">Jami</th></tr>
        ${data.items.map((it, i) => `<tr>
          <td>${i + 1}</td>
          <td style="font-weight:600">${esc(it.name)}</td>
          <td>${it.qty}</td>
          <td style="text-align:right">${Number(it.price).toLocaleString()}</td>
          <td style="text-align:right;font-weight:600">${(it.qty * it.price).toLocaleString()} so'm</td>
        </tr>`).join("")}
      </table>
    </div>

    ${data.payments.length > 0 ? `
    <div class="section">
      <div class="section-title">💳 To'lovlar (${data.payments.length} ta)</div>
      <table>
        <tr><th>Sana</th><th>Usul</th><th style="text-align:right">Summa</th></tr>
        ${paymentRows}
      </table>
    </div>` : ""}

    <div class="total-box">
      <div>
        <div class="total-label">Jami xizmat narxi</div>
        <div class="total-sub">${data.payments.length} ta to'lov qilingan</div>
      </div>
      <div><span class="total-amount">${Number(data.totalAmount).toLocaleString()}</span><span class="total-currency">so'm</span></div>
    </div>

    ${debt > 0 ? `
    <div class="debt-bar">
      <span class="debt-label">⚠️ Qolgan qarz:</span>
      <span class="debt-amount">${debt.toLocaleString()} so'm</span>
    </div>` : `
    <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:14px 20px;margin-top:12px;text-align:center">
      <span style="color:#16a34a;font-size:15px;font-weight:800">✅ TO'LIQ TO'LANGAN</span>
    </div>`}

    <div class="qr-section">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}&bgcolor=f8fafc" alt="QR Code" width="120" height="120" />
      <div class="verify-code">ID: ${esc(data.verificationCode.slice(0, 12))}</div>
      <div class="qr-text">QR kodni skanerlash orqali haqiqiyligini tekshiring</div>
    </div>
  </div>
  <div class="footer">
    <p><span class="brand">Med1.uz</span> — O'zbekistonning zamonaviy stomatologiya platformasi</p>
    <p><span class="secure">🔒 Xavfsiz hujjat</span> • Avtomatik yaratilgan • ${esc(data.invoiceNumber)}</p>
    <p>© ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan</p>
  </div>
</div></body></html>`;
}
