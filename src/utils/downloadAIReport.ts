import { esc } from "@/lib/htmlEscape";
import { reportTables } from "@/lib/aiReportTables";
import { DISCLAIMER_TEXT_PLAIN } from "@/components/MedicalDisclaimer";

interface PatientInfo {
  fullName?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  id?: string;
}

interface ReportData {
  title: string;
  serviceType: string;
  date?: string;
  patientName?: string;
  patientInfo?: PatientInfo;
  sections: { heading: string; content: string }[];
  riskLevel?: string;
  suggestedSpecialist?: string;
}

export function generateReportHTML(data: ReportData): string {
  const date = data.date || new Date().toLocaleDateString("uz-UZ");
  const time = new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  const riskColor = data.riskLevel?.toLowerCase().includes("yuqori") ? "#dc2626"
    : data.riskLevel?.toLowerCase().includes("o'rtacha") ? "#d97706" : "#16a34a";
  const riskBg = data.riskLevel?.toLowerCase().includes("yuqori") ? "#fef2f2"
    : data.riskLevel?.toLowerCase().includes("o'rtacha") ? "#fffbeb" : "#f0fdf4";
  const riskLabel = data.riskLevel?.toLowerCase().includes("yuqori") ? "YUQORI XAVF"
    : data.riskLevel?.toLowerCase().includes("o'rtacha") ? "O'RTACHA XAVF" : "PAST XAVF";

  const patientName = data.patientInfo?.fullName || data.patientName || "Noma'lum";
  const reportId = `MED1-${Date.now().toString(36).toUpperCase()}`;

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8"><title>${esc(data.title)} — Med1.uz</title>
<style>

  *{margin:0;padding:0;box-sizing:border-box}
  
  body{
    font-family:'Inter',system-ui,-apple-system,sans-serif;
    color:#1e293b;
    line-height:1.7;
    background:#f8fafc;
    min-height:100vh;
  }

  .page-wrapper{
    max-width:800px;
    margin:0 auto;
    background:#ffffff;
    min-height:100vh;
    position:relative;
    overflow:hidden;
  }

   /* Watermark - center logo */
  .watermark-logo{
    position:fixed;
    top:50%;left:50%;
    transform:translate(-50%,-50%);
    pointer-events:none;
    z-index:0;
    user-select:none;
    width:420px;
    height:420px;
    background-image:url('/images/med1-logo-watermark.webp');
    background-repeat:no-repeat;
    background-position:center;
    background-size:contain;
    opacity:0.08;
  }

  .content{position:relative;z-index:1;}

  /* Header */
  .report-header{
    background:linear-gradient(135deg, #0284c7 0%, #0ea5e9 40%, #06b6d4 100%);
    padding:32px 40px;
    color:white;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:20px;
  }
  .header-left{display:flex;align-items:center;gap:16px;}
  .logo-box{
    width:64px;height:64px;
    background:rgba(255,255,255,0.2);
    border-radius:16px;
    display:flex;align-items:center;justify-content:center;
    backdrop-filter:blur(10px);
    border:2px solid rgba(255,255,255,0.3);
  }
  .logo-box img{width:48px;height:48px;object-fit:contain;}
  .logo-text{font-size:28px;font-weight:900;letter-spacing:-1px;}
  .logo-text span{opacity:0.8;font-weight:400;font-size:14px;display:block;letter-spacing:1px;}
  .header-right{text-align:right;font-size:12px;opacity:0.85;line-height:1.8;}

  /* Report title bar */
  .title-bar{
    background:linear-gradient(90deg, #f0f9ff, #ecfeff);
    border-bottom:2px solid #bae6fd;
    padding:16px 40px;
    display:flex;
    align-items:center;
    justify-content:space-between;
  }
  .title-bar h1{
    font-size:16px;
    font-weight:700;
    color:#0369a1;
    text-transform:uppercase;
    letter-spacing:2px;
  }
  .report-id{
    font-size:11px;
    color:#64748b;
    font-family:monospace;
    background:#e2e8f0;
    padding:4px 12px;
    border-radius:6px;
  }

  /* Patient card */
  .patient-card{
    margin:24px 40px;
    border:2px solid #e2e8f0;
    border-radius:16px;
    overflow:hidden;
  }
  .patient-card-header{
    background:#f8fafc;
    padding:12px 20px;
    border-bottom:1px solid #e2e8f0;
    font-size:12px;
    font-weight:700;
    color:#475569;
    text-transform:uppercase;
    letter-spacing:1.5px;
    display:flex;
    align-items:center;
    gap:8px;
  }
  .patient-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:0;
  }
  .patient-item{
    padding:12px 20px;
    border-bottom:1px solid #f1f5f9;
    border-right:1px solid #f1f5f9;
  }
  .patient-item:nth-child(even){border-right:none;}
  .patient-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
  .patient-value{font-size:14px;font-weight:600;color:#1e293b;}

  /* Risk badge */
  .risk-section{
    margin:0 40px 24px;
    padding:16px 20px;
    border-radius:12px;
    display:flex;
    align-items:center;
    gap:16px;
    background:${riskBg};
    border:2px solid ${riskColor}22;
  }
  .risk-indicator{
    width:56px;height:56px;
    border-radius:50%;
    background:${riskColor};
    display:flex;align-items:center;justify-content:center;
    color:white;font-weight:900;font-size:20px;
    box-shadow:0 4px 15px ${riskColor}44;
    flex-shrink:0;
  }
  .risk-info h3{font-size:14px;font-weight:800;color:${riskColor};text-transform:uppercase;letter-spacing:1px;}
  .risk-info p{font-size:12px;color:#64748b;margin-top:2px;}

  /* Specialist recommendation */
  .specialist-box{
    margin:0 40px 24px;
    padding:14px 20px;
    background:linear-gradient(135deg, #ede9fe, #e0e7ff);
    border-radius:12px;
    border-left:4px solid #7c3aed;
    display:flex;align-items:center;gap:12px;
  }
  .specialist-box .icon{font-size:24px;}
  .specialist-box .text{font-size:13px;color:#4c1d95;}
  .specialist-box .text strong{font-weight:700;}

  /* Sections */
  .section{
    margin:0 40px 20px;
    page-break-inside:auto;
  }
  .section-header{
    display:flex;
    align-items:center;
    gap:10px;
    margin-bottom:12px;
    padding-bottom:8px;
    border-bottom:2px solid #e2e8f0;
  }
  .section-number{
    width:28px;height:28px;
    background:linear-gradient(135deg, #0ea5e9, #06b6d4);
    color:white;
    border-radius:8px;
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:800;
    flex-shrink:0;
  }
  .section-title{
    font-size:14px;
    font-weight:700;
    color:#0c4a6e;
    text-transform:uppercase;
    letter-spacing:1px;
  }
  .section-content{
    font-size:13px;
    color:#334155;
    line-height:1.8;
    padding-left:38px;
  }
  table{width:100%;table-layout:fixed;border-collapse:collapse;margin:10px 0;font-size:12px} th,td{border:1px solid #cbd5e1;padding:8px;vertical-align:top;overflow-wrap:anywhere} th{background:#e0f2fe;text-align:left} thead{display:table-header-group} tr{break-inside:avoid} .section-content{padding-left:0} .patient-value{overflow-wrap:anywhere} @media print{.section{break-inside:auto}.section-header{break-after:avoid}@page{margin:12mm;size:A4}}
  .section-content ul{padding-left:18px;margin:0;}
  .section-content li{
    margin-bottom:6px;
    position:relative;
  }
  .section-content li::marker{color:#0ea5e9;}
  .section-content p{margin-bottom:8px;}

  /* Disclaimer */
  .disclaimer{
    margin:32px 40px 24px;
    background:linear-gradient(135deg, #fef3c7, #fffbeb);
    border:2px solid #f59e0b;
    border-radius:14px;
    padding:20px;
    page-break-inside:avoid;
  }
  .disclaimer-header{
    display:flex;align-items:center;gap:8px;
    margin-bottom:10px;
  }
  .disclaimer-header span{font-size:18px;}
  .disclaimer-header h4{font-size:13px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:1px;}
  .disclaimer p{font-size:11px;color:#78350f;line-height:1.7;}

  /* Footer */
  .report-footer{
    background:#f8fafc;
    border-top:2px solid #e2e8f0;
    padding:24px 40px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-top:32px;
  }
  .footer-left{font-size:11px;color:#94a3b8;line-height:1.8;min-width:0;flex:1;overflow-wrap:anywhere;padding-right:18px;}
  .footer-left a{color:#0ea5e9;text-decoration:none;font-weight:600;}
  .footer-qr{
    text-align:center;
    flex-shrink:0;
  }
  .footer-qr img{
    width:80px;height:80px;
    border-radius:8px;
    border:2px solid #e2e8f0;
  }
  .footer-qr p{font-size:9px;color:#94a3b8;margin-top:4px;}

  /* Print button */
  .no-print{text-align:center;padding:24px;background:#f8fafc;}
  .print-btn{
    padding:14px 40px;
    background:linear-gradient(135deg, #0284c7, #0ea5e9);
    color:white;
    border:none;
    border-radius:10px;
    font-size:14px;
    font-weight:700;
    cursor:pointer;
    letter-spacing:0.5px;
    box-shadow:0 4px 15px rgba(14,165,233,0.3);
    transition:all 0.2s;
  }
  .print-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(14,165,233,0.4);}

  @media print{
    body{background:white;}
    .page-wrapper{box-shadow:none;}
    .no-print{display:none!important;}
    .watermark{position:absolute;}
    .watermark-pattern{position:absolute;}
    @page{margin:12mm;size:A4;}
  }
</style></head><body>

<div class="watermark-logo"></div>

<div class="page-wrapper">
<div class="content">

  <!-- Header -->
  <div class="report-header">
    <div class="header-left">
      <div class="logo-box">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M14 4h8v10h10v8H22v10h-8V22H4v-8h10V4z" fill="white" fill-opacity="0.9"/>
          <path d="M18 8c0 1-0.5 2-1.5 2.5L18 13l1.5-2.5C18.5 10 18 9 18 8z" fill="white" fill-opacity="0.5"/>
        </svg>
      </div>
      <div class="logo-text">
        Med1.uz
        <span>AI TIBBIY TAHLIL HISOBOTI</span>
      </div>
    </div>
    <div class="header-right">
      📅 ${esc(date)} &nbsp;|&nbsp; 🕐 ${time}<br>
      📋 ${esc(data.serviceType)}
    </div>
  </div>

  <!-- Title bar -->
  <div class="title-bar">
    <h1>📄 ${esc(data.title)}</h1>
    <div class="report-id">ID: ${reportId}</div>
  </div>

  <!-- Patient info -->
  <div class="patient-card">
    <div class="patient-card-header">👤 Bemor ma'lumotlari</div>
    <div class="patient-grid">
      <div class="patient-item">
        <div class="patient-label">F.I.Sh</div>
        <div class="patient-value">${esc(patientName)}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Tug'ilgan sana</div>
        <div class="patient-value">${esc(data.patientInfo?.dateOfBirth || "—")}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Telefon raqam</div>
        <div class="patient-value">${esc(data.patientInfo?.phone || "—")}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Manzil</div>
        <div class="patient-value">${esc(data.patientInfo?.address || "—")}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Tekshiruv sanasi</div>
        <div class="patient-value">${esc(date)}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Xizmat turi</div>
        <div class="patient-value">${esc(data.serviceType)}</div>
      </div>
    </div>
  </div>

  <!-- Risk level -->
  ${data.riskLevel ? `
  <div class="risk-section">
    <div class="risk-indicator">${data.riskLevel?.toLowerCase().includes("yuqori") ? "!" : data.riskLevel?.toLowerCase().includes("o'rtacha") ? "~" : "✓"}</div>
    <div class="risk-info">
      <h3>${riskLabel}</h3>
      <p>AI tizimi tomonidan aniqlangan xavf darajasi: <strong>${esc(data.riskLevel)}</strong></p>
    </div>
  </div>` : ""}

  <!-- Specialist -->
  ${`
  <div class="specialist-box">
    <div class="icon">👨‍⚕️</div>
    <div class="text">Tavsiya etilgan mutaxassis: <strong>${esc(data.suggestedSpecialist || "Xulosada ko‘rsatilmagan — oilaviy shifokor bilan aniqlashtiring")}</strong></div>
  </div>`}

  <!-- Sections -->
  ${data.sections.map((s, i) => `
  <div class="section">
    <div class="section-header">
      <div class="section-number">${i + 1}</div>
      <div class="section-title">${esc(s.heading)}</div>
    </div>
    <div class="section-content">
      ${reportTables(s.content).map(t=>`<table><thead><tr>${t.head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("") }
    </div>
  </div>`).join("")}

  <!-- Disclaimer -->
  <div class="disclaimer">
    <div class="disclaimer-header">
      <span>⚠️</span>
      <h4>Tibbiy Ogohlantirish</h4>
    </div>
    <p>${esc(DISCLAIMER_TEXT_PLAIN)}</p>
  </div>

  <!-- Footer -->
  <div class="report-footer">
    <div class="footer-left">
      <strong>Ma'lumot manbasi:</strong> <a href="https://med1.uz">med1.uz</a><br>
      © ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan<br>
      Bu hujjat AI tizimi tomonidan avtomatik yaratilgan. Klinik manbalar faqat xulosada aniq keltirilgan bo‘lsa ko‘rsatiladi; aks holda tekshirilmagan.
    </div>
    <div class="footer-qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://med1.uz/verify/${reportId}`)}&color=0284c7" alt="QR Code" />
      <p>med1.uz</p>
    </div>
  </div>

  <!-- Print -->
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Chop etish / PDF saqlash</button>
  </div>

</div>
</div>
</body></html>`;
}

export function downloadAIReport(data: ReportData) {
  const html = generateReportHTML(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => { win.print(); }, 600);
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Legacy text-only download
export function downloadAIReportTxt(data: ReportData) {
  const date = data.date || new Date().toLocaleDateString("uz-UZ");
  let text = "";
  text += "═══════════════════════════════════════════\n";
  text += "            MED1.UZ — AI TAHLIL HISOBOTI\n";
  text += "═══════════════════════════════════════════\n\n";
  text += `📋 Xizmat turi: ${esc(data.serviceType)}\n`;
  text += `📅 Sana: ${esc(date)}\n`;
  if (data.patientName) text += `👤 Foydalanuvchi: ${data.patientName}\n`;
  if (data.riskLevel) text += `⚠️ Xavf darajasi: ${esc(data.riskLevel)}\n`;
  if (data.suggestedSpecialist) text += `👨‍⚕️ Tavsiya etilgan mutaxassis: ${esc(data.suggestedSpecialist || "Xulosada ko‘rsatilmagan — oilaviy shifokor bilan aniqlashtiring")}\n`;
  text += "\n───────────────────────────────────────────\n\n";
  for (const section of data.sections) {
    text += `▶ ${section.heading}\n`;
    text += `${section.content}\n\n`;
  }
  text += "───────────────────────────────────────────\n";
  text += "⚠️ TIBBIY OGOHLANTIRISH\n";
  text += `${esc(DISCLAIMER_TEXT_PLAIN)}\n\n`;
  text += "───────────────────────────────────────────\n";
  text += "Ma'lumot manbasi: med1.uz\n";
  text += `© ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan\n`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `med1uz-${data.serviceType.replace(/\s+/g, "-").toLowerCase()}-${esc(date)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
