import jsPDF from "jspdf";
import QRCode from "qrcode";
import { generateStampDataUrl } from "./generatePaymentStamp";
import logoUrl from "@/assets/logo.png";

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

// Med1.uz brend rangi
const COLORS = {
  primary: [10, 37, 64] as [number, number, number],     // Deep Tech Blue #0A2540
  accent: [47, 128, 237] as [number, number, number],    // Electric Blue #2F80ED
  purple: [123, 97, 255] as [number, number, number],    // AI Purple #7B61FF
  text: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  bgSoft: [240, 247, 255] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  greenSoft: [220, 252, 231] as [number, number, number],
};

const SLOGAN = "Sog'lig'ingiz — bizning ustuvor vazifamiz";

/** Logo PNG'ni base64'ga aylantirish (kesh bilan) */
let _logoCache: string | null = null;
async function getLogoDataUrl(): Promise<string | null> {
  if (_logoCache) return _logoCache;
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        _logoCache = reader.result as string;
        resolve(_logoCache);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function buildReceiptNumber(paymentId: string, paidAt: Date): string {
  const year = paidAt.getFullYear();
  const digits = paymentId.replace(/[^0-9]/g, "").slice(0, 6).padStart(6, "0");
  const fallback = paymentId.slice(-6).split("").map(c => c.charCodeAt(0) % 10).join("");
  return `CHK-${year}-${digits || fallback}`;
}

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
  const logoData = await getLogoDataUrl();

  // ===== Tashqi medical "frame" — yengil ramka =====
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.4);
  doc.roundedRect(8, 8, pageW - 16, pageH - 16, 3, 3, "S");

  // ===== HEADER (brand bar gradient effect) =====
  doc.setFillColor(...COLORS.primary);
  doc.rect(8, 8, pageW - 16, 38, "F");
  // Accent strip
  doc.setFillColor(...COLORS.accent);
  doc.rect(8, 44, pageW - 16, 2, "F");

  // Logo (chap tomonda dumaloq oq fonda)
  if (logoData) {
    const logoSize = 22;
    const logoX = margin;
    const logoY = 14;
    // Oq dumaloq fon
    doc.setFillColor(255, 255, 255);
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 1, "F");
    doc.addImage(logoData, "PNG", logoX, logoY, logoSize, logoSize);
  }

  // Brend matni
  const textX = margin + (logoData ? 28 : 0);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Med1.uz", textX, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 215, 255);
  doc.text(SLOGAN, textX, 28);
  doc.setTextColor(220, 230, 245);
  doc.setFontSize(7.5);
  doc.text("MED-ALL AI SYSTEM MChJ  •  Samarqand  •  STIR: 312972027", textX, 33.5);
  doc.text("med1.uz  •  info@med1.uz  •  +998 (90) 000-00-00", textX, 38);

  // O'ng tomonda: KVITANSIYA №
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("ELEKTRON KVITANSIYA", pageW - margin, 16, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`№ ${receiptNumber}`, pageW - margin, 23, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 215, 255);
  doc.text(data.paidAt.toLocaleString("uz-UZ"), pageW - margin, 29, { align: "right" });
  // Tibbiy ramz: + belgisi
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("✚ Medical Payment", pageW - margin, 38, { align: "right" });

  // ===== "MUVAFFAQIYATLI TO'LANDI" badge =====
  let y = 56;
  doc.setFillColor(...COLORS.greenSoft);
  doc.setDrawColor(...COLORS.green);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, "FD");
  doc.setTextColor(...COLORS.green);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("✓  TO'LOV MUVAFFAQIYATLI QABUL QILINDI", pageW / 2, y + 9, { align: "center" });

  // ===== Asosiy summa kartasi =====
  y += 22;
  doc.setFillColor(...COLORS.bgSoft);
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageW - margin * 2, 28, 2, 2, "FD");

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("TO'LOV SUMMASI", margin + 5, y + 8);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(fmtMoney(data.amount, data.currency), margin + 5, y + 21);

  // O'ng tomonda — provider
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("TO'LOV TIZIMI", pageW - margin - 5, y + 8, { align: "right" });
  doc.setTextColor(...COLORS.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(data.provider.toUpperCase(), pageW - margin - 5, y + 21, { align: "right" });

  // ===== Tafsilotlar bo'limi =====
  y += 36;
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("◆  TRANZAKSIYA TAFSILOTLARI", margin, y);
  y += 4;
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 60, y);
  y += 6;

  const drawRow = (label: string, value: string, opts?: { bold?: boolean }) => {
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(label, margin, y);

    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(10);
    const valLines = doc.splitTextToSize(value, 110);
    doc.text(valLines, pageW - margin, y, { align: "right" });

    y += Math.max(6, valLines.length * 5);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.15);
    doc.line(margin, y - 1, pageW - margin, y - 1);
    y += 3;
  };

  drawRow("Maqsad / Xizmat turi", data.purposeLabel, { bold: true });
  drawRow("To'langan sana va vaqt", data.paidAt.toLocaleString("uz-UZ"));
  drawRow("Tranzaksiya identifikatori", data.paymentId);
  if (data.referenceId) drawRow("Provider reference", data.referenceId);
  if (data.payerName) drawRow("To'lovchi", data.payerName);
  if (data.payerEmail) drawRow("Email", data.payerEmail);

  // ===== QR kod (verify URL) =====
  y += 8;
  const verifyUrl = `https://med1.uz/verify?payment_id=${data.paymentId}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1, width: 240,
      color: { dark: "#0A2540", light: "#FFFFFF" },
    });

    // QR atrofida kichik ramka
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin - 1, y - 1, 40, 40, 1, 1, "S");
    doc.addImage(qrDataUrl, "PNG", margin, y, 38, 38);

    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("ONLAYN TASDIQLASH", margin + 44, y + 6);

    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("QR kodni skanerlang yoki quyidagi", margin + 44, y + 13);
    doc.text("havolaga o'ting:", margin + 44, y + 17.5);

    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(verifyUrl, margin + 44, y + 23);

    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text("Ushbu kvitansiya elektron tarzda yaratilgan", margin + 44, y + 30);
    doc.text("va imzo talab qilmaydi (O'z.R Qonuni №562, 03.04.2018).", margin + 44, y + 34);
  } catch (e) {
    console.warn("QR generation failed", e);
  }

  // ===== DINAMIK MUHR (har chek uchun noyob) =====
  try {
    const stampPng = await generateStampDataUrl(
      { receiptNumber, paidAt: data.paidAt, microId, amount: data.amount },
      560
    );
    const stampSize = 48;
    const stampX = pageW - margin - stampSize;
    const stampY = y - 4;
    const gstate = (doc as any).GState ? new (doc as any).GState({ opacity: 0.92 }) : null;
    if (gstate) (doc as any).setGState(gstate);
    doc.addImage(stampPng, "PNG", stampX, stampY, stampSize, stampSize);
    if (gstate) (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
  } catch (e) {
    console.warn("Stamp generation failed", e);
  }

  // ===== FOOTER =====
  const footerY = pageH - 22;
  // Accent strip
  doc.setFillColor(...COLORS.accent);
  doc.rect(8, footerY - 8, pageW - 16, 1, "F");
  // Footer bg
  doc.setFillColor(...COLORS.primary);
  doc.rect(8, footerY - 7, pageW - 16, 15, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`✚  ${SLOGAN}`, pageW / 2, footerY - 2, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 215, 255);
  doc.text(
    "MED-ALL AI SYSTEM MChJ tomonidan elektron tarzda yaratilgan • Yuridik kuchga ega",
    pageW / 2, footerY + 2, { align: "center" }
  );
  doc.text(
    `Hujjat ID: ${data.paymentId}  •  Yaratildi: ${new Date().toLocaleString("uz-UZ")}  •  med1.uz`,
    pageW / 2, footerY + 6, { align: "center" }
  );

  doc.save(`${receiptNumber}.pdf`);
}
