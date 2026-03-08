import { DISCLAIMER_TEXT_PLAIN } from "@/components/MedicalDisclaimer";

interface ReportData {
  title: string;
  serviceType: string;
  date?: string;
  patientName?: string;
  sections: { heading: string; content: string }[];
  riskLevel?: string;
  suggestedSpecialist?: string;
}

function generateReportHTML(data: ReportData): string {
  const date = data.date || new Date().toLocaleDateString("uz-UZ");
  const riskColor = data.riskLevel?.toLowerCase().includes("yuqori") ? "#ef4444"
    : data.riskLevel?.toLowerCase().includes("o'rtacha") ? "#f59e0b" : "#22c55e";

  return `<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8"><title>${data.title} — Med1.uz</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:40px;line-height:1.6}
  .header{text-align:center;border-bottom:3px solid #0ea5e9;padding-bottom:24px;margin-bottom:32px}
  .logo{font-size:32px;font-weight:800;color:#0ea5e9;letter-spacing:-1px}
  .logo span{color:#1a1a2e}
  .subtitle{color:#64748b;font-size:14px;margin-top:4px}
  .meta{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:24px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .meta-item{font-size:13px;color:#475569}
  .meta-item strong{color:#1a1a2e}
  .risk-badge{display:inline-block;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:700;color:white;background:${riskColor}}
  .section{margin-bottom:24px}
  .section h3{font-size:15px;color:#0ea5e9;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
  .section p,.section li{font-size:14px;color:#334155;line-height:1.7}
  .section ul{padding-left:20px}
  .section li{margin-bottom:4px}
  .disclaimer{background:#fffbeb;border:2px solid #fbbf24;border-radius:12px;padding:16px;margin-top:32px}
  .disclaimer h4{color:#b45309;font-size:14px;margin-bottom:8px;display:flex;align-items:center;gap:8px}
  .disclaimer p{font-size:12px;color:#92400e;line-height:1.6}
  .footer{text-align:center;margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;color:#94a3b8;font-size:11px}
  .footer a{color:#0ea5e9;text-decoration:none}
  @media print{body{padding:20px}button,.no-print{display:none!important}}
</style></head><body>
  <div class="header">
    <div class="logo">Med<span>1</span>.uz</div>
    <div class="subtitle">AI Tibbiy Tahlil Hisoboti</div>
  </div>
  <div class="meta">
    <div class="meta-item"><strong>📋 Xizmat turi:</strong> ${data.serviceType}</div>
    <div class="meta-item"><strong>📅 Sana:</strong> ${date}</div>
    ${data.patientName ? `<div class="meta-item"><strong>👤 Foydalanuvchi:</strong> ${data.patientName}</div>` : ""}
    ${data.riskLevel ? `<div class="meta-item"><strong>⚠️ Xavf darajasi:</strong> <span class="risk-badge">${data.riskLevel}</span></div>` : ""}
    ${data.suggestedSpecialist ? `<div class="meta-item"><strong>👨‍⚕️ Tavsiya etilgan mutaxassis:</strong> ${data.suggestedSpecialist}</div>` : ""}
  </div>
  ${data.sections.map((s) => `
  <div class="section">
    <h3>${s.heading}</h3>
    ${s.content.includes("\n") ? `<ul>${s.content.split("\n").filter(Boolean).map((l) => `<li>${l.replace(/^[-•]\s*/, "")}</li>`).join("")}</ul>` : `<p>${s.content}</p>`}
  </div>`).join("")}
  <div class="disclaimer">
    <h4>⚠️ TIBBIY OGOHLANTIRISH</h4>
    <p>${DISCLAIMER_TEXT_PLAIN}</p>
  </div>
  <div class="footer">
    <p>Ma'lumot manbasi: <a href="https://med1.uz">med1.uz</a></p>
    <p>© ${new Date().getFullYear()} Med1.uz — Barcha huquqlar himoyalangan</p>
    <p style="margin-top:8px">Bu hujjat avtomatik tarzda yaratilgan</p>
  </div>
  <div class="no-print" style="text-align:center;margin-top:24px">
    <button onclick="window.print()" style="padding:12px 32px;background:#0ea5e9;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨️ Chop etish / PDF saqlash</button>
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
      setTimeout(() => {
        win.print();
      }, 600);
    };
  }
  // Also allow direct save
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
