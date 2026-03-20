export interface InvoiceData {
  invoiceNumber: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  serviceType: string;
  serviceName: string;
  amount: number;
  paymentMethod: string;
  status: "paid" | "pending" | "cancelled";
  paidAt?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
  paid: { text: "✅ TO'LANGAN", color: "#16a34a", bg: "#f0fdf4" },
  pending: { text: "⏳ KUTILMOQDA", color: "#d97706", bg: "#fffbeb" },
  cancelled: { text: "❌ BEKOR QILINGAN", color: "#dc2626", bg: "#fef2f2" },
};

export function generateInvoiceHTML(data: InvoiceData): string {
  const st = statusLabels[data.status] || statusLabels.pending;
  const date = data.paidAt || data.createdAt || new Date().toISOString();
  const dateStr = new Date(date).toLocaleDateString("uz-UZ");
  const timeStr = new Date(date).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  const qrUrl = `https://med1-uz.lovable.app/report/${data.invoiceNumber}`;

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8">
<title>Invoice ${data.invoiceNumber} — Med1.uz</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;color:#1e293b;background:#f1f5f9;min-height:100vh;padding:40px 20px}
  .invoice-wrap{max-width:700px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.15)}
  .header{background:linear-gradient(135deg,#0A2540 0%,#1e3a5f 50%,#2F80ED 100%);padding:40px;position:relative;overflow:hidden}
  .header::after{content:'';position:absolute;top:-50%;right:-20%;width:400px;height:400px;border-radius:50%;background:rgba(255,255,255,.05)}
  .logo{font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px}
  .logo span{color:#60a5fa}
  .subtitle{color:rgba(255,255,255,.7);font-size:13px;margin-top:4px;letter-spacing:2px;text-transform:uppercase}
  .invoice-badge{display:inline-block;background:rgba(255,255,255,.15);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.2);color:#fff;padding:8px 20px;border-radius:50px;font-size:13px;font-weight:600;margin-top:16px}
  .body{padding:40px}
  .status-bar{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-radius:14px;margin-bottom:32px;background:${st.bg};border:1px solid ${st.color}22}
  .status-text{font-weight:700;color:${st.color};font-size:15px}
  .status-date{color:#64748b;font-size:13px}
  .section{margin-bottom:28px}
  .section-title{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;font-weight:600;margin-bottom:14px;display:flex;align-items:center;gap:8px}
  .section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#e2e8f0,transparent)}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .info-item{background:#f8fafc;border-radius:12px;padding:14px 18px;border:1px solid #e2e8f0}
  .info-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
  .info-value{font-size:14px;font-weight:600;color:#1e293b}
  .total-section{background:linear-gradient(135deg,#0A2540,#1e3a5f);border-radius:16px;padding:28px;display:flex;justify-content:space-between;align-items:center;margin-top:32px}
  .total-label{color:rgba(255,255,255,.7);font-size:14px;font-weight:500}
  .total-amount{color:#fff;font-size:32px;font-weight:800;letter-spacing:-1px}
  .total-currency{color:#60a5fa;font-size:16px;font-weight:500;margin-left:8px}
  .qr-section{text-align:center;margin-top:32px;padding-top:24px;border-top:1px dashed #e2e8f0}
  .qr-section img{width:120px;height:120px;margin:12px auto;display:block}
  .qr-text{font-size:11px;color:#94a3b8}
  .footer{text-align:center;padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0}
  .footer p{font-size:12px;color:#94a3b8;line-height:1.8}
  .footer .brand{color:#2F80ED;font-weight:700}
  @media print{body{padding:0;background:#fff}.invoice-wrap{box-shadow:none;border-radius:0}button{display:none!important}}

  .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:120px;font-weight:900;color:rgba(47,128,237,.04);pointer-events:none;white-space:nowrap;z-index:0}
</style></head><body>
<div class="watermark">MED1.UZ</div>
<div class="invoice-wrap">
  <div class="header">
    <div class="logo">Med1<span>.uz</span></div>
    <div class="subtitle">Professional tibbiy platforma</div>
    <div class="invoice-badge">🧾 Invoice: ${esc(data.invoiceNumber)}</div>
  </div>
  <div class="body">
    <div class="status-bar">
      <span class="status-text">${st.text}</span>
      <span class="status-date">📅 ${dateStr} • ⏰ ${timeStr}</span>
    </div>

    <div class="section">
      <div class="section-title">👤 Mijoz ma'lumotlari</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Ism</div><div class="info-value">${esc(data.userName)}</div></div>
        <div class="info-item"><div class="info-label">Telefon</div><div class="info-value">${esc(data.userPhone)}</div></div>
        <div class="info-item"><div class="info-label">Email</div><div class="info-value">${esc(data.userEmail || "—")}</div></div>
        <div class="info-item"><div class="info-label">To'lov usuli</div><div class="info-value">${esc(data.paymentMethod)}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📋 Xizmat tafsilotlari</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Xizmat turi</div><div class="info-value">${esc(data.serviceType)}</div></div>
        <div class="info-item"><div class="info-label">Xizmat nomi</div><div class="info-value">${esc(data.serviceName)}</div></div>
      </div>
    </div>

    ${data.metadata && Object.keys(data.metadata).length > 0 ? `
    <div class="section">
      <div class="section-title">📎 Qo'shimcha ma'lumotlar</div>
      <div class="info-grid">
        ${Object.entries(data.metadata).map(([k, v]) => `<div class="info-item"><div class="info-label">${esc(k)}</div><div class="info-value">${esc(String(v))}</div></div>`).join("")}
      </div>
    </div>` : ""}

    <div class="total-section">
      <div><div class="total-label">Jami to'lov</div></div>
      <div><span class="total-amount">${Number(data.amount).toLocaleString("uz-UZ")}</span><span class="total-currency">so'm</span></div>
    </div>

    <div class="qr-section">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}" alt="QR Code" />
      <div class="qr-text">QR kodni skanerlash orqali haqiqiyligini tekshiring</div>
    </div>
  </div>
  <div class="footer">
    <p><span class="brand">Med1.uz</span> — O'zbekistonning zamonaviy tibbiy platformasi</p>
    <p>Bu hujjat avtomatik tarzda yaratilgan • ${data.invoiceNumber}</p>
  </div>
</div>
</body></html>`;
}

function esc(text: string): string {
  if (!text) return "—";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function downloadInvoicePDF(data: InvoiceData) {
  const html = generateInvoiceHTML(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => setTimeout(() => win.print(), 500);
  }
}

export function downloadInvoiceTxt(data: InvoiceData) {
  const st = data.status === "paid" ? "TO'LANGAN" : data.status === "pending" ? "KUTILMOQDA" : "BEKOR QILINGAN";
  const content = `
══════════════════════════════════════════
         MED1.UZ - TO'LOV CHEKI
══════════════════════════════════════════

🧾 Invoice raqami: ${data.invoiceNumber}
📅 Sana: ${new Date(data.paidAt || data.createdAt || Date.now()).toLocaleDateString("uz-UZ")}
⏰ Vaqt: ${new Date(data.paidAt || data.createdAt || Date.now()).toLocaleTimeString("uz-UZ")}

─────────────────────────────────────────
👤 MIJOZ MA'LUMOTLARI
─────────────────────────────────────────
Ism: ${data.userName}
Telefon: ${data.userPhone}
Email: ${data.userEmail || "—"}

─────────────────────────────────────────
📋 XIZMAT TAFSILOTLARI
─────────────────────────────────────────
Xizmat turi: ${data.serviceType}
Xizmat nomi: ${data.serviceName}

─────────────────────────────────────────
💳 TO'LOV
─────────────────────────────────────────
Summa: ${Number(data.amount).toLocaleString("uz-UZ")} so'm
To'lov usuli: ${data.paymentMethod}
Holat: ${st}

══════════════════════════════════════════
Med1.uz — Professional tibbiy platforma
══════════════════════════════════════════
`.trim();

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice_${data.invoiceNumber}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
