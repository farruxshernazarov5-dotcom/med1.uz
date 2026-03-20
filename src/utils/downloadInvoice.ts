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

const statusLabels: Record<string, { text: string; color: string; bg: string; border: string }> = {
  paid: { text: "✅ TO'LANGAN", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  pending: { text: "⏳ KUTILMOQDA", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  cancelled: { text: "❌ BEKOR QILINGAN", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export function generateInvoiceHTML(data: InvoiceData): string {
  const st = statusLabels[data.status] || statusLabels.pending;
  const date = data.paidAt || data.createdAt || new Date().toISOString();
  const dateStr = new Date(date).toLocaleDateString("uz-UZ");
  const timeStr = new Date(date).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  const qrUrl = `https://med1-uz.lovable.app/report/${data.invoiceNumber}`;

  const metaRows = data.metadata && Object.keys(data.metadata).length > 0
    ? Object.entries(data.metadata)
        .filter(([, v]) => v && String(v) !== "—" && String(v) !== "")
        .map(([k, v]) => `<div class="info-item"><div class="info-label">${esc(k)}</div><div class="info-value">${esc(String(v))}</div></div>`)
        .join("")
    : "";

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8">
<title>Invoice ${data.invoiceNumber} — Med1.uz</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;color:#1e293b;background:#f1f5f9;min-height:100vh;padding:40px 20px}
  .invoice-wrap{max-width:720px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.15)}
  
  .header{background:linear-gradient(135deg,#0A2540 0%,#1e3a5f 40%,#2F80ED 100%);padding:44px 40px;position:relative;overflow:hidden}
  .header::before{content:'';position:absolute;top:-60%;right:-15%;width:450px;height:450px;border-radius:50%;background:rgba(255,255,255,.04)}
  .header::after{content:'';position:absolute;bottom:-40%;left:-10%;width:300px;height:300px;border-radius:50%;background:rgba(96,165,250,.08)}
  .header-top{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1}
  .logo{font-size:36px;font-weight:900;color:#fff;letter-spacing:-1.5px}
  .logo span{color:#60a5fa}
  .subtitle{color:rgba(255,255,255,.6);font-size:12px;margin-top:2px;letter-spacing:3px;text-transform:uppercase}
  .invoice-num{text-align:right}
  .invoice-num .label{color:rgba(255,255,255,.5);font-size:11px;text-transform:uppercase;letter-spacing:2px}
  .invoice-num .value{color:#fff;font-size:18px;font-weight:700;margin-top:4px;font-family:monospace}
  .service-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.15);color:#fff;padding:10px 22px;border-radius:50px;font-size:14px;font-weight:600;margin-top:20px;position:relative;z-index:1}
  
  .body{padding:40px}
  .status-bar{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-radius:16px;margin-bottom:32px;background:${st.bg};border:2px solid ${st.border}}
  .status-text{font-weight:800;color:${st.color};font-size:16px}
  .status-date{color:#64748b;font-size:13px;font-weight:500}
  
  .section{margin-bottom:28px}
  .section-title{font-size:11px;text-transform:uppercase;letter-spacing:2.5px;color:#94a3b8;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px}
  .section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#e2e8f0,transparent)}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .info-item{background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:14px;padding:16px 18px;border:1px solid #e2e8f0;transition:transform .2s}
  .info-item:hover{transform:translateY(-1px)}
  .info-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:600}
  .info-value{font-size:14px;font-weight:700;color:#1e293b}
  
  .total-section{background:linear-gradient(135deg,#0A2540 0%,#1e3a5f 50%,#2F80ED 100%);border-radius:20px;padding:32px;display:flex;justify-content:space-between;align-items:center;margin-top:36px;position:relative;overflow:hidden}
  .total-section::after{content:'';position:absolute;top:-30%;right:-10%;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.04)}
  .total-label{color:rgba(255,255,255,.7);font-size:14px;font-weight:500}
  .total-sub{color:rgba(255,255,255,.4);font-size:11px;margin-top:4px}
  .total-amount{color:#fff;font-size:36px;font-weight:900;letter-spacing:-1.5px;position:relative;z-index:1}
  .total-currency{color:#60a5fa;font-size:16px;font-weight:600;margin-left:8px}
  
  .qr-section{text-align:center;margin-top:36px;padding-top:28px;border-top:2px dashed #e2e8f0}
  .qr-section img{width:130px;height:130px;margin:12px auto;display:block;border-radius:12px;border:4px solid #f1f5f9}
  .qr-text{font-size:11px;color:#94a3b8;font-weight:500}
  
  .footer{text-align:center;padding:28px 40px;background:linear-gradient(180deg,#f8fafc,#f1f5f9);border-top:1px solid #e2e8f0}
  .footer p{font-size:12px;color:#94a3b8;line-height:2}
  .footer .brand{color:#2F80ED;font-weight:800}
  .footer .secure{display:inline-flex;align-items:center;gap:4px;color:#16a34a;font-weight:600}
  
  @media print{body{padding:0;background:#fff}.invoice-wrap{box-shadow:none;border-radius:0}button{display:none!important}}
  .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:130px;font-weight:900;color:rgba(47,128,237,.03);pointer-events:none;white-space:nowrap;z-index:0}
</style></head><body>
<div class="watermark">MED1.UZ</div>
<div class="invoice-wrap">
  <div class="header">
    <div class="header-top">
      <div>
        <div class="logo">Med1<span>.uz</span></div>
        <div class="subtitle">Professional tibbiy platforma</div>
      </div>
      <div class="invoice-num">
        <div class="label">Invoice raqami</div>
        <div class="value">${esc(data.invoiceNumber)}</div>
      </div>
    </div>
    <div class="service-badge">🏷️ ${esc(data.serviceType)}</div>
  </div>
  <div class="body">
    <div class="status-bar">
      <span class="status-text">${st.text}</span>
      <span class="status-date">📅 ${dateStr} &bull; ⏰ ${timeStr}</span>
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

    ${metaRows ? `
    <div class="section">
      <div class="section-title">📎 Qo'shimcha ma'lumotlar</div>
      <div class="info-grid">${metaRows}</div>
    </div>` : ""}

    <div class="total-section">
      <div>
        <div class="total-label">Jami to'lov</div>
        <div class="total-sub">${esc(data.paymentMethod)} orqali</div>
      </div>
      <div><span class="total-amount">${Number(data.amount).toLocaleString("uz-UZ")}</span><span class="total-currency">so'm</span></div>
    </div>

    <div class="qr-section">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrUrl)}&bgcolor=f8fafc" alt="QR Code" />
      <div class="qr-text">QR kodni skanerlash orqali haqiqiyligini tekshiring</div>
    </div>
  </div>
  <div class="footer">
    <p><span class="brand">Med1.uz</span> — O'zbekistonning zamonaviy tibbiy platformasi</p>
    <p><span class="secure">🔒 Xavfsiz hujjat</span> &bull; Avtomatik yaratilgan &bull; ${esc(data.invoiceNumber)}</p>
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
  const st = data.status === "paid" ? "✅ TO'LANGAN" : data.status === "pending" ? "⏳ KUTILMOQDA" : "❌ BEKOR QILINGAN";
  const date = data.paidAt || data.createdAt || new Date().toISOString();

  const metaLines = data.metadata && Object.keys(data.metadata).length > 0
    ? Object.entries(data.metadata)
        .filter(([, v]) => v && String(v) !== "—" && String(v) !== "")
        .map(([k, v]) => `  ${k}: ${v}`)
        .join("\n")
    : "";

  const content = `
══════════════════════════════════════════
        MED1.UZ — PROFESSIONAL CHEK
══════════════════════════════════════════

🧾 Invoice raqami: ${data.invoiceNumber}
📅 Sana: ${new Date(date).toLocaleDateString("uz-UZ")}
⏰ Vaqt: ${new Date(date).toLocaleTimeString("uz-UZ")}

─────────────────────────────────────────
👤 MIJOZ MA'LUMOTLARI
─────────────────────────────────────────
Ism:     ${data.userName}
Telefon: ${data.userPhone}
Email:   ${data.userEmail || "—"}

─────────────────────────────────────────
📋 XIZMAT TAFSILOTLARI
─────────────────────────────────────────
Xizmat turi:  ${data.serviceType}
Xizmat nomi:  ${data.serviceName}
${metaLines ? `\n📎 QO'SHIMCHA:\n${metaLines}` : ""}

─────────────────────────────────────────
💳 TO'LOV
─────────────────────────────────────────
Summa:       ${Number(data.amount).toLocaleString("uz-UZ")} so'm
To'lov usuli: ${data.paymentMethod}
Holat:       ${st}

══════════════════════════════════════════
🔒 Med1.uz — Professional tibbiy platforma
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
