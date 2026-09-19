import jsPDF from "jspdf";
import QRCode from "qrcode";

export type PublicationCertificateData = {
  certificateId: string;
  title: string;
  author: string;
  affiliation: string;
  publishedAt: string;
  articleUrl: string;
};

const PRIMARY: [number, number, number] = [10, 37, 64];
const ACCENT: [number, number, number] = [47, 128, 237];
const MUTED: [number, number, number] = [71, 85, 105];
const BORDER: [number, number, number] = [203, 213, 225];

export async function downloadPublicationCertificate(data: PublicationCertificateData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const qr = await QRCode.toDataURL(data.articleUrl, {
    width: 420,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#0A2540", light: "#FFFFFF" },
  });

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, width, height, "F");
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(1.4);
  doc.rect(9, 9, width - 18, height - 18);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.rect(13, 13, width - 26, height - 26);

  doc.setFillColor(...PRIMARY);
  doc.rect(18, 18, width - 36, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MED1.UZ ELEKTRON NASHR TASDIQNOMASI", width / 2, 29, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Ilmiy-amaliy materialning portalda e'lon qilinganligini tasdiqlovchi hujjat", width / 2, 36, { align: "center" });

  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("USHBU HUJJAT BILAN TASDIQLANADIKI", 26, 58);

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Muallif", 26, 71);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(data.author.toUpperCase(), 26, 80);

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const affiliationLines = doc.splitTextToSize(data.affiliation, 175);
  doc.text(affiliationLines, 26, 89);

  doc.setDrawColor(...BORDER);
  doc.line(26, 104, 222, 104);
  doc.setTextColor(...MUTED);
  doc.setFontSize(10);
  doc.text("Med1.uz portalida quyidagi ilmiy-amaliy maqolani e'lon qilgan:", 26, 114);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(data.title, 190);
  doc.text(titleLines, 26, 124);

  const detailY = Math.max(150, 124 + titleLines.length * 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`Nashr sanasi: ${data.publishedAt}`, 26, detailY);
  doc.text(`Hujjat raqami: ${data.certificateId}`, 26, detailY + 7);
  doc.text("Nashriyot: Med1.uz tibbiy axborot portali", 26, detailY + 14);

  doc.addImage(qr, "PNG", 236, 57, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text("MAQOLANI TEKSHIRISH", 256, 104, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const urlLines = doc.splitTextToSize(data.articleUrl, 48);
  doc.text(urlLines, 256, 110, { align: "center" });

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(226, 139, 58, 34, 2, 2, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  const notice = "Ushbu hujjat Med1.uz portalidagi nashr faktini tasdiqlaydi. U OTM KPI komissiyasining bahosi yoki davlat sertifikati emas.";
  doc.text(doc.splitTextToSize(notice, 50), 230, 147);

  doc.setDrawColor(...BORDER);
  doc.line(26, height - 28, width - 26, height - 28);
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text("MED-ALL AI SYSTEM MChJ © 2018–2026 • www.med1.uz", 26, height - 20);
  doc.text(`Verification ID: ${data.certificateId}`, width - 26, height - 20, { align: "right" });

  doc.save(`${data.certificateId}-nashr-tasdiqnomasi.pdf`);
}