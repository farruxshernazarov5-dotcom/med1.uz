interface LabReportData {
  testName: string;
  testCategory: string;
  patientName: string;
  patientPhone?: string;
  patientDob?: string;
  patientGender?: string;
  patientBloodGroup?: string;
  patientAllergies?: string;
  orderedAt: string;
  completedAt?: string;
  results: Array<{
    parameter_name: string;
    value: string;
    unit: string;
    reference_range: string;
    is_abnormal: boolean;
  }>;
  verificationCode?: string;
}

export const downloadLabReportPDF = (data: LabReportData) => {
  const abnormalCount = data.results.filter(r => r.is_abnormal).length;
  const now = new Date().toLocaleString("uz");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: auto; position: relative; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; font-size: 120px; font-weight: 900; color: #0066ff; z-index: -1; pointer-events: none; }
  .header { text-align: center; border-bottom: 3px solid #0066ff; padding-bottom: 20px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #0066ff; margin-bottom: 4px; }
  .header p { font-size: 12px; color: #666; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .info-box { background: #f8f9ff; border-radius: 8px; padding: 12px; border: 1px solid #e0e4ff; }
  .info-box h4 { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .info-box p { font-size: 13px; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #0066ff; color: white; padding: 10px 12px; font-size: 12px; text-align: left; }
  td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f8f9ff; }
  .abnormal { background: #fff0f0 !important; }
  .abnormal td { color: #dc2626; font-weight: 600; }
  .flag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .flag-normal { background: #dcfce7; color: #16a34a; }
  .flag-high { background: #fee2e2; color: #dc2626; }
  .flag-low { background: #dbeafe; color: #2563eb; }
  .summary { background: #f0f4ff; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center; }
  .summary h3 { font-size: 14px; color: #0066ff; }
  .footer { text-align: center; border-top: 2px solid #eee; padding-top: 16px; margin-top: 24px; }
  .footer p { font-size: 10px; color: #999; }
  .qr-section { text-align: center; margin-top: 16px; }
  .qr-section img { width: 100px; height: 100px; }
  @media print { body { padding: 20px; } .watermark { position: fixed; } }
</style>
</head><body>
<div class="watermark">MED1</div>
<div class="header">
  <h1>🏥 MED1.UZ — Laboratoriya hisoboti</h1>
  <p>Avtomatlashtirilgan tibbiy tahlil natijasi</p>
</div>
<div class="info-grid">
  <div class="info-box">
    <h4>Bemor ma'lumoti</h4>
    <p><strong>${esc(data.patientName)}</strong></p>
    ${data.patientPhone ? `<p>📞 ${esc(data.patientPhone)}</p>` : ""}
    ${data.patientDob ? `<p>🎂 ${esc(data.patientDob)}</p>` : ""}
  </div>
  <div class="info-box">
    <h4>Tahlil ma'lumoti</h4>
    <p><strong>${esc(data.testName)}</strong></p>
    <p>📂 ${esc(data.testCategory)}</p>
    <p>📅 Buyurtma: ${new Date(data.orderedAt).toLocaleDateString("uz")}</p>
    ${data.completedAt ? `<p>✅ Tayyor: ${new Date(data.completedAt).toLocaleDateString("uz")}</p>` : ""}
  </div>
</div>
<div class="summary">
  <h3>Jami: ${data.results.length} parametr &nbsp;|&nbsp; ✅ Normal: ${data.results.length - abnormalCount} &nbsp;|&nbsp; ⚠️ Normadan tashqari: ${abnormalCount}</h3>
</div>
<table>
  <thead><tr><th>Parametr</th><th>Natija</th><th>Birlik</th><th>Norma</th><th>Holat</th></tr></thead>
  <tbody>
    ${data.results.map(r => {
      let flag = "normal";
      if (r.is_abnormal) {
        const val = parseFloat(r.value);
        if (!isNaN(val) && r.reference_range.includes("-")) {
          const [min] = r.reference_range.split("-").map(Number);
          flag = val < min ? "low" : "high";
        } else {
          flag = "high";
        }
      }
      return `<tr class="${r.is_abnormal ? "abnormal" : ""}">
        <td>${esc(r.parameter_name)}</td>
        <td><strong>${esc(r.value)}</strong></td>
        <td>${esc(r.unit)}</td>
        <td>${esc(r.reference_range)}</td>
        <td><span class="flag flag-${flag}">${flag === "normal" ? "✅ Normal" : flag === "high" ? "↑ Yuqori" : "↓ Past"}</span></td>
      </tr>`;
    }).join("")}
  </tbody>
</table>
${data.verificationCode ? `
<div class="qr-section">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://med1-uz.lovable.app/verify/${data.verificationCode}`)}" alt="QR Verification" />
  <p style="font-size:10px;color:#666;margin-top:4px;">Tekshirish kodi: ${data.verificationCode.slice(0, 8)}...</p>
</div>` : ""}
<div class="footer">
  <p>🏥 Med1.uz — O'zbekistonning #1 tibbiy platformasi</p>
  <p>📅 Hisobot yaratilgan: ${now}</p>
  <p style="margin-top:8px;font-size:9px;color:#bbb;">Bu hujjat avtomatik generatsiya qilingan. Rasmiy tibbiy hujjat emas.</p>
</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lab-report-${data.patientName.replace(/\s+/g, "-")}-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

function esc(text: string): string {
  if (!text) return "—";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
