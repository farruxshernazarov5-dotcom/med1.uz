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

function generateReportHTML(data: ReportData): string {
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

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8"><title>${data.title} — Med1.uz</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
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

  /* Watermark */
  .watermark{
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%) rotate(-35deg);
    font-size:120px;
    font-weight:900;
    color:rgba(14,165,233,0.04);
    letter-spacing:8px;
    white-space:nowrap;
    pointer-events:none;
    z-index:0;
    user-select:none;
  }
  .watermark-pattern{
    position:fixed;
    top:0;left:0;right:0;bottom:0;
    pointer-events:none;
    z-index:0;
    opacity:0.025;
    background-image:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 200px,
        rgba(14,165,233,0.3) 200px,
        rgba(14,165,233,0.3) 201px
      );
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
    page-break-inside:avoid;
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
  .footer-left{font-size:11px;color:#94a3b8;line-height:1.8;}
  .footer-left a{color:#0ea5e9;text-decoration:none;font-weight:600;}
  .footer-qr{
    width:64px;height:64px;
    background:#e2e8f0;
    border-radius:8px;
    display:flex;align-items:center;justify-content:center;
    font-size:8px;color:#94a3b8;text-align:center;
  }

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
    @page{margin:0;size:A4;}
  }
</style></head><body>

<div class="watermark">MED1.UZ</div>
<div class="watermark-pattern"></div>

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
      📅 ${date} &nbsp;|&nbsp; 🕐 ${time}<br>
      📋 ${data.serviceType}
    </div>
  </div>

  <!-- Title bar -->
  <div class="title-bar">
    <h1>📄 ${data.title}</h1>
    <div class="report-id">ID: ${reportId}</div>
  </div>

  <!-- Patient info -->
  <div class="patient-card">
    <div class="patient-card-header">👤 Bemor ma'lumotlari</div>
    <div class="patient-grid">
      <div class="patient-item">
        <div class="patient-label">F.I.Sh</div>
        <div class="patient-value">${patientName}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Tug'ilgan sana</div>
        <div class="patient-value">${data.patientInfo?.dateOfBirth || "—"}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Telefon raqam</div>
        <div class="patient-value">${data.patientInfo?.phone || "—"}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Manzil</div>
        <div class="patient-value">${data.patientInfo?.address || "—"}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Tekshiruv sanasi</div>
        <div class="patient-value">${date}</div>
      </div>
      <div class="patient-item">
        <div class="patient-label">Xizmat turi</div>
        <div class="patient-value">${data.serviceType}</div>
      </div>
    </div>
  </div>

  <!-- Risk level -->
  ${data.riskLevel ? `
  <div class="risk-section">
    <div class="risk-indicator">${data.riskLevel?.toLowerCase().includes("yuqori") ? "!" : data.riskLevel?.toLowerCase().includes("o'rtacha") ? "~" : "✓"}</div>
    <div class="risk-info">
      <h3>${riskLabel}</h3>
      <p>AI tizimi tomonidan aniqlangan xavf darajasi: <strong>${data.riskLevel}</strong></p>
    </div>
  </div>` : ""}

  <!-- Specialist -->
  ${data.suggestedSpecialist ? `
  <div class="specialist-box">
    <div class="icon">👨‍⚕️</div>
    <div class="text">Tavsiya etilgan mutaxassis: <strong>${data.suggestedSpecialist}</strong></div>
  </div>` : ""}

  <!-- Sections -->
  ${data.sections.map((s, i) => `
  <div class="section">
    <div class="section-header">
      <div class="section-number">${i + 1}</div>
      <div class="section-title">${s.heading}</div>
    </div>
    <div class="section-content">
      ${s.content.includes("\n") ? `<ul>${s.content.split("\n").filter(Boolean).map((l) => `<li>${l.replace(/^[-•]\s*/, "")}</li>`).join("")}</ul>` : `<p>${s.content}</p>`}
    </div>
  </div>`).join("")}

  <!-- Disclaimer -->
  <div class="disclaimer">
    <div class="disclaimer-header">
      <span>⚠️</span>
      <h4>Tibbiy Ogohlantirish</h4>
    </div>
    <p>${DISCLAIMER_TEXT_PLAIN}</p>
  </div>

  <!-- Footer -->
  <div class="report-footer">
    <div class="footer-left">
      <strong>Ma'lumot manbasi:</strong> <a href="https://med1.uz">med1.uz</a><br>
      © ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan<br>
      Bu hujjat AI tizimi tomonidan avtomatik yaratilgan
    </div>
    <div class="footer-qr">
      med1.uz<br>🌐
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
  text += `📋 Xizmat turi: ${data.serviceType}\n`;
  text += `📅 Sana: ${date}\n`;
  if (data.patientName) text += `👤 Foydalanuvchi: ${data.patientName}\n`;
  if (data.riskLevel) text += `⚠️ Xavf darajasi: ${data.riskLevel}\n`;
  if (data.suggestedSpecialist) text += `👨‍⚕️ Tavsiya etilgan mutaxassis: ${data.suggestedSpecialist}\n`;
  text += "\n───────────────────────────────────────────\n\n";
  for (const section of data.sections) {
    text += `▶ ${section.heading}\n`;
    text += `${section.content}\n\n`;
  }
  text += "───────────────────────────────────────────\n";
  text += "⚠️ TIBBIY OGOHLANTIRISH\n";
  text += `${DISCLAIMER_TEXT_PLAIN}\n\n`;
  text += "───────────────────────────────────────────\n";
  text += "Ma'lumot manbasi: med1.uz\n";
  text += `© ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan\n`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `med1uz-${data.serviceType.replace(/\s+/g, "-").toLowerCase()}-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
