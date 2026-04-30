import jsPDF from "jspdf";
import QRCode from "qrcode";
import { generateStampDataUrl } from "./generatePaymentStamp";

export interface PaymentReceiptData {
  paymentId: string;
  amount: number;
  currency: string;
  purpose: string;
  purposeLabel: string;
  provider: string;
  referenceId?: string | null;
  paidAt: Date;
  payerName?: string;
  payerEmail?: string;
}

const COLORS = {
  primary: [10, 37, 64] as [number, number, number],     // Deep Tech Blue
  accent: [47, 128, 237] as [number, number, number],    // Electric Blue
  text: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
};

/**
 * Kvitansiya raqami: CHK-YYYY-XXXXXX
 * payment_id'dan deterministik (har safar bir xil hosil bo'ladi)
 */
function buildReceiptNumber(paymentId: string, paidAt: Date): string {
  const year = paidAt.getFullYear();
  // payment UUID'dan raqamli hash
  const digits = paymentId.replace(/[^0-9]/g, "").slice(0, 6).padStart(6, "0");
  const fallback = paymentId.slice(-6).split("").map(c => c.charCodeAt(0) % 10).join("");
  return `CHK-${year}-${digits || fallback}`;
}

/** "12 345 678 so'm" formatida */
function fmtMoney(n: number, currency: string): string {
  return `${Number(n).toLocaleString("uz-UZ")} ${currency === "UZS" ? "so'm" : currency}`;
}

export async function downloadPaymentReceipt(data: PaymentReceiptData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  const receiptNumber = buildReceiptNumber(data.paymentId, data.paidAt);
  const microId = data.paymentId.slice(-6).toUpperCase();

  // ===== HEADER (brand bar) =====
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MED-ALL AI SYSTEM", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("MAS'ULIYATI CHEKLANGAN JAMIYATI • SAMARQAND • STIR: 312972027", margin, 21);
  doc.text("med1.uz  |  info@med1.uz", margin, 27);

  // O'ng tomonda: KVITANSIYA №
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("KVITANSIYA", pageW - margin, 14, { align: "right" });
  doc.setFontSize(13);
  doc.text(`№ ${receiptNumber}`, pageW - margin, 22, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(data.paidAt.toLocaleString("uz-UZ"), pageW - margin, 28, { align: "right" });

  // ===== "MUVAFFAQIYATLI TO'LANDI" badge =====
  let y = 44;
  doc.setFillColor(220, 252, 231);
  doc.setDrawColor(...COLORS.green);
  doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, "FD");
  doc.setTextColor(...COLORS.green);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("✓ TO'LOV MUVAFFAQIYATLI QABUL QILINDI", pageW / 2, y + 9, { align: "center" });

  // ===== Asosiy summa =====
  y += 22;
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("To'lov summasi", margin, y);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  y += 10;
  doc.text(fmtMoney(data.amount, data.currency), margin, y);

  // ===== Tafsilotlar jadvali =====
  y += 12;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const drawRow = (label: string, value: string, opts?: { bold?: boolean }) => {
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(label, margin, y);

    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(10);
    const valLines = doc.splitTextToSize(value, 110);
    doc.text(valLines, pageW - margin, y, { align: "right" });

    y += Math.max(6, valLines.length * 5);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 1, pageW - margin, y - 1);
    y += 3;
  };

  drawRow("Maqsad", data.purposeLabel, { bold: true });
  drawRow("Provider", data.provider.toUpperCase());
  drawRow("To'langan vaqt", data.paidAt.toLocaleString("uz-UZ"));
  drawRow("Tranzaksiya ID", data.paymentId);
  if (data.referenceId) drawRow("Reference", data.referenceId);
  if (data.payerName) drawRow("To'lovchi", data.payerName);
  if (data.payerEmail) drawRow("Email", data.payerEmail);

  // ===== QR kod (verify URL) =====
  y += 6;
  const verifyUrl = `https://med1.uz/verify?payment_id=${data.paymentId}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200, color: { dark: "#0A2540", light: "#FFFFFF" } });
    doc.addImage(qrDataUrl, "PNG", margin, y, 35, 35);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Tasdiqlash uchun QR kodni skanerlang yoki", margin + 40, y + 10);
    doc.text("havola orqali kiring:", margin + 40, y + 15);
    doc.setTextColor(...COLORS.accent);
    doc.text(verifyUrl, margin + 40, y + 22);
    doc.setTextColor(...COLORS.muted);
    doc.text("Bu kvitansiya elektron tarzda yaratilgan", margin + 40, y + 30);
    doc.text("va imzo talab qilmaydi.", margin + 40, y + 35);
  } catch (e) {
    console.warn("QR generation failed", e);
  }

  // ===== DINAMIK MUHR (har chek uchun noyob) =====
  try {
    const stampPng = await generateStampDataUrl(
      { receiptNumber, paidAt: data.paidAt, microId, amount: data.amount },
      560
    );
    const stampSize = 50;
    const stampX = pageW - margin - stampSize;
    const stampY = y - 5;
    // Yarim shaffof effekt uchun GState
    const gstate = (doc as any).GState ? new (doc as any).GState({ opacity: 0.92 }) : null;
    if (gstate) (doc as any).setGState(gstate);
    doc.addImage(stampPng, "PNG", stampX, stampY, stampSize, stampSize);
    if (gstate) (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
  } catch (e) {
    console.warn("Stamp generation failed", e);
  }

  // ===== FOOTER =====
  const footerY = pageH - 18;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    "Ushbu kvitansiya MED-ALL AI SYSTEM MChJ tomonidan elektron tarzda yaratilgan. Yuridik kuchga ega.",
    pageW / 2, footerY, { align: "center" }
  );
  doc.text(
    `Hujjat ID: ${data.paymentId}  •  Yaratildi: ${new Date().toLocaleString("uz-UZ")}`,
    pageW / 2, footerY + 4, { align: "center" }
  );
  doc.text("med1.uz", pageW / 2, footerY + 8, { align: "center" });

  // ===== Save =====
  doc.save(`${receiptNumber}.pdf`);
}
