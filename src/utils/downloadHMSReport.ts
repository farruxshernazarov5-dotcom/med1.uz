/**
 * Universal HMS Report Download Utility
 * Supports: HTML/PDF (print), CSV, TXT
 * Features: QR code verification, Med1.uz logo watermark
 */

export interface HMSReportSection {
  heading: string;
  content: string;
}

export interface HMSReportTable {
  headers: string[];
  rows: string[][];
}

export interface HMSReportData {
  title: string;
  moduleType: string;
  clinicName?: string;
  date?: string;
  sections?: HMSReportSection[];
  tables?: { title: string; table: HMSReportTable }[];
  kpiCards?: { label: string; value: string | number }[];
  generatedBy?: string;
}

function generateReportId(): string {
  return `HMS-${Date.now().toString(36).toUpperCase()}`;
}

function getVerificationUrl(reportId: string): string {
  return `${window.location.origin}/report/${reportId}`;
}

function getQRCodeUrl(reportId: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(getVerificationUrl(reportId))}&color=0284c7`;
}

function generateHTML(data: HMSReportData): string {
  const date = data.date || new Date().toLocaleDateString("uz-UZ");
  const time = new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  const reportId = generateReportId();

  const kpiHTML = data.kpiCards?.length ? `
    <div class="kpi-grid">
      ${data.kpiCards.map(k => `<div class="kpi-card"><div class="kpi-value">${k.value}</div><div class="kpi-label">${k.label}</div></div>`).join("")}
    </div>` : "";

  const sectionsHTML = data.sections?.map((s, i) => `
    <div class="section">
      <div class="section-header">
        <div class="section-number">${i + 1}</div>
        <div class="section-title">${s.heading}</div>
      </div>
      <div class="section-content">
        ${s.content.includes("\n") ? `<ul>${s.content.split("\n").filter(Boolean).map(l => `<li>${l.replace(/^[-•]\s*/, "")}</li>`).join("")}</ul>` : `<p>${s.content}</p>`}
      </div>
    </div>`).join("") || "";

  const tablesHTML = data.tables?.map(t => `
    <div class="table-section">
      <h3 class="table-title">${t.title}</h3>
      <table>
        <thead><tr>${t.table.headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${t.table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>`).join("") || "";

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8"><title>${data.title} — Med1.uz</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;color:#1e293b;line-height:1.7;background:#f8fafc;min-height:100vh}
  .page-wrapper{max-width:800px;margin:0 auto;background:#fff;min-height:100vh;position:relative;overflow:hidden}
  .watermark-logo{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0;user-select:none;width:420px;height:420px;background-image:url('/images/med1-logo-watermark.webp');background-repeat:no-repeat;background-position:center;background-size:contain;opacity:0.06}
  .content{position:relative;z-index:1}
  .report-header{background:linear-gradient(135deg,#0284c7 0%,#0ea5e9 40%,#06b6d4 100%);padding:28px 40px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:20px}
  .header-left{display:flex;align-items:center;gap:14px}
  .logo-box{width:56px;height:56px;background:rgba(255,255,255,.2);border-radius:14px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);border:2px solid rgba(255,255,255,.3)}
  .logo-box svg{width:32px;height:32px}
  .logo-text{font-size:24px;font-weight:900;letter-spacing:-1px}
  .logo-text span{opacity:.8;font-weight:400;font-size:12px;display:block;letter-spacing:1px;text-transform:uppercase}
  .header-right{text-align:right;font-size:12px;opacity:.85;line-height:1.8}
  .title-bar{background:linear-gradient(90deg,#f0f9ff,#ecfeff);border-bottom:2px solid #bae6fd;padding:14px 40px;display:flex;align-items:center;justify-content:space-between}
  .title-bar h1{font-size:15px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:2px}
  .report-id{font-size:11px;color:#64748b;font-family:monospace;background:#e2e8f0;padding:4px 12px;border-radius:6px}
  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:24px 40px}
  .kpi-card{background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:14px 16px;text-align:center}
  .kpi-value{font-size:20px;font-weight:800;color:#0284c7}
  .kpi-label{font-size:11px;color:#64748b;margin-top:2px}
  .section{margin:0 40px 16px;page-break-inside:avoid}
  .section-header{display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
  .section-number{width:26px;height:26px;background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:#fff;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
  .section-title{font-size:13px;font-weight:700;color:#0c4a6e;text-transform:uppercase;letter-spacing:1px}
  .section-content{font-size:13px;color:#334155;line-height:1.8;padding-left:36px}
  .section-content ul{padding-left:18px;margin:0}
  .section-content li{margin-bottom:4px}
  .section-content li::marker{color:#0ea5e9}
  .section-content p{margin-bottom:6px}
  .table-section{margin:20px 40px;page-break-inside:avoid}
  .table-title{font-size:13px;font-weight:700;color:#0c4a6e;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#f0f9ff;color:#0369a1;padding:10px 12px;text-align:left;border:1px solid #bae6fd;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
  td{padding:8px 12px;border:1px solid #e2e8f0;color:#334155}
  tr:nth-child(even) td{background:#f8fafc}
  .disclaimer{margin:28px 40px 20px;background:linear-gradient(135deg,#fef3c7,#fffbeb);border:2px solid #f59e0b;border-radius:14px;padding:16px 20px;page-break-inside:avoid}
  .disclaimer h4{font-size:12px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .disclaimer p{font-size:11px;color:#78350f;line-height:1.7}
  .report-footer{background:#f8fafc;border-top:2px solid #e2e8f0;padding:20px 40px;display:flex;justify-content:space-between;align-items:center;margin-top:28px}
  .footer-left{font-size:11px;color:#94a3b8;line-height:1.8}
  .footer-left a{color:#0ea5e9;text-decoration:none;font-weight:600}
  .footer-qr{text-align:center}
  .footer-qr img{width:80px;height:80px;border-radius:8px;border:2px solid #e2e8f0}
  .footer-qr p{font-size:9px;color:#94a3b8;margin-top:4px}
  .no-print{text-align:center;padding:20px;background:#f8fafc}
  .btn-group{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .print-btn{padding:12px 32px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.5px;box-shadow:0 4px 15px rgba(14,165,233,.3);transition:all .2s}
  .print-btn:hover{transform:translateY(-1px)}
  .csv-btn{padding:12px 32px;background:#10b981;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.5px}
  .txt-btn{padding:12px 32px;background:#8b5cf6;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.5px}
  @media print{body{background:#fff}.page-wrapper{box-shadow:none}.no-print{display:none!important}.watermark-logo{position:absolute}@page{margin:0;size:A4}}
</style></head><body>
<div class="watermark-logo"></div>
<div class="page-wrapper"><div class="content">
  <div class="report-header">
    <div class="header-left">
      <div class="logo-box">
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none"><path d="M14 4h8v10h10v8H22v10h-8V22H4v-8h10V4z" fill="white" fill-opacity="0.9"/></svg>
      </div>
      <div class="logo-text">Med1.uz<span>${data.moduleType} hisoboti</span></div>
    </div>
    <div class="header-right">📅 ${date} | 🕐 ${time}<br>${data.clinicName ? `🏥 ${data.clinicName}` : ""}</div>
  </div>
  <div class="title-bar"><h1>📄 ${data.title}</h1><div class="report-id">ID: ${reportId}</div></div>
  ${kpiHTML}
  ${sectionsHTML}
  ${tablesHTML}
  <div class="disclaimer"><h4>⚠️ Ogohlantirish</h4><p>Ushbu hisobot Med1.uz HMS tizimi tomonidan avtomatik yaratilgan. Ma'lumotlar to'g'riligini tekshiring.</p></div>
  <div class="report-footer">
    <div class="footer-left"><strong>Tizim:</strong> <a href="https://med1.uz">Med1.uz HMS</a><br>© ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan<br>${data.generatedBy ? `Yaratdi: ${data.generatedBy}` : "Avtomatik hisobot"}</div>
    <div class="footer-qr"><img src="${getQRCodeUrl(reportId)}" alt="QR Code" /><p>Verifikatsiya: ${reportId}</p></div>
  </div>
  <div class="no-print"><div class="btn-group">
    <button class="print-btn" onclick="window.print()">🖨️ PDF saqlash / Chop etish</button>
  </div></div>
</div></div></body></html>`;
}

// ========== HTML/PDF ==========
export function downloadHMSReportHTML(data: HMSReportData) {
  const html = generateHTML(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.onload = () => setTimeout(() => win.print(), 600);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ========== CSV ==========
export function downloadHMSReportCSV(data: HMSReportData) {
  const BOM = "\uFEFF";
  let csv = "";

  if (data.kpiCards?.length) {
    csv += "Ko'rsatkich,Qiymat\n";
    data.kpiCards.forEach(k => { csv += `"${k.label}","${k.value}"\n`; });
    csv += "\n";
  }

  if (data.tables?.length) {
    data.tables.forEach(t => {
      csv += `"${t.title}"\n`;
      csv += t.table.headers.map(h => `"${h}"`).join(",") + "\n";
      t.table.rows.forEach(r => { csv += r.map(c => `"${c}"`).join(",") + "\n"; });
      csv += "\n";
    });
  }

  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `med1uz-${data.moduleType.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ========== TXT ==========
export function downloadHMSReportTXT(data: HMSReportData) {
  const date = data.date || new Date().toLocaleDateString("uz-UZ");
  const reportId = generateReportId();
  let txt = "";
  txt += "════════════════════════════════════════════\n";
  txt += "          MED1.UZ — HMS HISOBOTI\n";
  txt += "════════════════════════════════════════════\n\n";
  txt += `📋 Modul: ${data.moduleType}\n`;
  txt += `📄 Hisobot: ${data.title}\n`;
  txt += `📅 Sana: ${date}\n`;
  txt += `🆔 ID: ${reportId}\n`;
  if (data.clinicName) txt += `🏥 Klinika: ${data.clinicName}\n`;
  txt += `🔗 Verifikatsiya: ${getVerificationUrl(reportId)}\n`;
  txt += "\n────────────────────────────────────────────\n\n";

  if (data.kpiCards?.length) {
    txt += "📊 UMUMIY KO'RSATKICHLAR\n";
    data.kpiCards.forEach(k => { txt += `  • ${k.label}: ${k.value}\n`; });
    txt += "\n";
  }

  data.sections?.forEach((s, i) => {
    txt += `▶ ${i + 1}. ${s.heading}\n`;
    txt += `${s.content}\n\n`;
  });

  data.tables?.forEach(t => {
    txt += `📋 ${t.title}\n`;
    txt += t.table.headers.join(" | ") + "\n";
    txt += "─".repeat(60) + "\n";
    t.table.rows.forEach(r => { txt += r.join(" | ") + "\n"; });
    txt += "\n";
  });

  txt += "────────────────────────────────────────────\n";
  txt += "⚠️ Ushbu hisobot Med1.uz HMS tizimi tomonidan yaratilgan\n";
  txt += `© ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan\n`;

  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `med1uz-${data.moduleType.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
