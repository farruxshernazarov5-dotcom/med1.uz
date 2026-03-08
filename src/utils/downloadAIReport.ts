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

export function downloadAIReport(data: ReportData) {
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
