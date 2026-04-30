import jsPDF from "jspdf";
import QRCode from "qrcode";
import { generateStampDataUrl } from "./generatePaymentStamp";
import logoUrl from "@/assets/logo.png";

export type ReceiptFormat = "a4" | "thermal" | "both";

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
  serviceName?: string;
  validFrom?: Date;
  validUntil?: Date;
  planName?: string;
  billingCycle?: "monthly" | "yearly" | "one_time" | string;
  /** PDF format: "a4" (standart), "thermal" (80mm chek) yoki "both" (ikkalasi) */
  format?: ReceiptFormat;
}

// Med1.uz brend rangi
const COLORS = {
  primary: [10, 37, 64] as [number, number, number],
  accent: [47, 128, 237] as [number, number, number],
  purple: [123, 97, 255] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  bgSoft: [240, 247, 255] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  greenSoft: [220, 252, 231] as [number, number, number],
};

const SLOGAN = "Sog'lig'ingiz — bizning ustuvor vazifamiz";
const PHONES = "+998 99 214-41-03  •  +998 77 000-04-98";
const COMPANY_LINE = "MED-ALL AI SYSTEM MChJ  •  Samarqand  •  STIR: 312972027";
const CONTACT_LINE = `med1.uz  •  info@med1.uz  •  ${PHONES}`;

/**
 * jsPDF standart helvetica fonti faqat WinAnsi belgilarni qo'llab-quvvatlaydi.
 * Buzilmaslik uchun ba'zi unicode belgilarni xavfsiz ekvivalentlarga almashtiramiz.
 */
function safeText(s: string): string {
  if (!s) return s;
  return s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // curly single quotes -> '
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // curly double quotes -> "
    .replace(/\u2014/g, "-")                       // em dash -> -
    .replace(/\u2013/g, "-")                       // en dash -> -
    .replace(/\u2192/g, "->")                      // → -> ->
    .replace(/\u2190/g, "<-")                      // ←
    .replace(/[\u2705\u2713\u2714]/g, "v")         // ✓ ✅ -> v
    .replace(/\u2716/g, "x")                       // ✖
    .replace(/[\u271A\u271D]/g, "+")               // ✚ ✝
    .replace(/\u2666/g, "*")                       // ◆
    .replace(/\u2726/g, "*")                       // ✦
    .replace(/[\u23F1\u23F2\u23F0]/g, "")          // ⏱ ⏲ ⏰
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")        // emoji range
    ;
}

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

const cycleLabel: Record<string, string> = {
  monthly: "Oylik obuna",
  yearly: "Yillik obuna",
  one_time: "Bir martalik to'lov",
};

// =====================================================================
// A4 LAYOUT — birinchi (oddiy, toza) dizayn
// =====================================================================
async function renderA4(doc: jsPDF, data: PaymentReceiptData) {
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
  doc.text(`med1.uz  |  info@med1.uz  |  ${PHONES}`, margin, 27);

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

  if (data.serviceName) drawRow("Xizmat", data.serviceName, { bold: true });
  drawRow("Maqsad", data.purposeLabel, { bold: !data.serviceName });
  if (data.planName) drawRow("Tarif rejasi", data.planName);
  if (data.billingCycle) drawRow("To'lov turi", cycleLabel[data.billingCycle] || data.billingCycle);
  if (data.validFrom || data.validUntil) {
    const from = data.validFrom ? data.validFrom.toLocaleDateString("uz-UZ") : "—";
    const until = data.validUntil ? data.validUntil.toLocaleDateString("uz-UZ") : "—";
    drawRow("Amal qilish muddati", `${from}  →  ${until}`);
  }
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
}

// =====================================================================
// THERMAL (80mm) LAYOUT — kichik chek
// Avtomatik balandlik: kontentga qarab dinamik o'sadi
// =====================================================================
async function drawThermalContent(doc: jsPDF, data: PaymentReceiptData, logoData: string | null,
  receiptNumber: string, microId: string, qrDataUrl: string | null, stampPng: string | null): Promise<number> {
  const W = 80;
  const M = 4;
  const innerW = W - M * 2;
  let y = M + 2;

  // LOGO + brend
  if (logoData) {
    const sz = 14;
    doc.addImage(logoData, "PNG", (W - sz) / 2, y, sz, sz);
    y += sz + 2;
  }
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("Med1.uz", W / 2, y, { align: "center" }); y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...COLORS.muted);
  const sloganLines = doc.splitTextToSize(SLOGAN, innerW);
  doc.text(sloganLines, W / 2, y, { align: "center" });
  y += sloganLines.length * 3 + 1;
  doc.setFontSize(6);
  doc.text("MED-ALL AI SYSTEM MChJ", W / 2, y, { align: "center" }); y += 2.8;
  doc.text("STIR: 312972027  •  Samarqand", W / 2, y, { align: "center" }); y += 2.8;
  doc.text(PHONES, W / 2, y, { align: "center" }); y += 2.8;
  doc.text("med1.uz  •  info@med1.uz", W / 2, y, { align: "center" }); y += 4;

  // Ajratuvchi
  doc.setDrawColor(...COLORS.border); doc.setLineDashPattern([0.6, 0.6], 0);
  doc.line(M, y, W - M, y); doc.setLineDashPattern([], 0); y += 3.5;

  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...COLORS.primary);
  doc.text("ELEKTRON KVITANSIYA", W / 2, y, { align: "center" }); y += 4;
  doc.setFontSize(10);
  doc.text(`№ ${receiptNumber}`, W / 2, y, { align: "center" }); y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...COLORS.muted);
  doc.text(data.paidAt.toLocaleString("uz-UZ"), W / 2, y, { align: "center" }); y += 4;

  // SUCCESS
  doc.setFillColor(...COLORS.greenSoft); doc.setDrawColor(...COLORS.green); doc.setLineWidth(0.3);
  doc.roundedRect(M, y, innerW, 7, 1.5, 1.5, "FD");
  doc.setTextColor(...COLORS.green); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text("✓ MUVAFFAQIYATLI TO'LANDI", W / 2, y + 4.7, { align: "center" }); y += 10;

  // SUMMA
  doc.setTextColor(...COLORS.muted); doc.setFont("helvetica", "normal"); doc.setFontSize(7);
  doc.text("TO'LOV SUMMASI", W / 2, y, { align: "center" }); y += 4.5;
  doc.setTextColor(...COLORS.primary); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text(fmtMoney(data.amount, data.currency), W / 2, y, { align: "center" }); y += 5;
  doc.setTextColor(...COLORS.accent); doc.setFontSize(9);
  doc.text(data.provider.toUpperCase(), W / 2, y, { align: "center" }); y += 4;

  doc.setDrawColor(...COLORS.border); doc.setLineDashPattern([0.6, 0.6], 0);
  doc.line(M, y, W - M, y); doc.setLineDashPattern([], 0); y += 3;

  // ROWS
  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.8); doc.setTextColor(...COLORS.muted);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.2); doc.setTextColor(...COLORS.text);
    const lines = doc.splitTextToSize(value, innerW - 22);
    doc.text(lines, W - M, y, { align: "right" });
    y += Math.max(3.5, lines.length * 3.2) + 1;
  };

  if (data.serviceName) row("Xizmat", data.serviceName);
  row("Maqsad", data.purposeLabel);
  if (data.planName) row("Tarif", data.planName);
  if (data.billingCycle) row("Turi", cycleLabel[data.billingCycle] || data.billingCycle);
  row("Sana", data.paidAt.toLocaleString("uz-UZ"));
  row("ID", data.paymentId);
  if (data.referenceId) row("Ref", String(data.referenceId));
  if (data.payerName) row("To'lovchi", data.payerName);
  if (data.payerEmail) row("Email", data.payerEmail);

  // OBUNA
  if (data.validFrom || data.validUntil) {
    y += 1.5;
    doc.setDrawColor(...COLORS.purple); doc.setLineWidth(0.3);
    doc.roundedRect(M, y, innerW, 14, 1, 1, "S");
    doc.setTextColor(...COLORS.purple); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text("OBUNA MUDDATI", W / 2, y + 3.5, { align: "center" });
    const from = data.validFrom ? data.validFrom.toLocaleDateString("uz-UZ") : "—";
    const until = data.validUntil ? data.validUntil.toLocaleDateString("uz-UZ") : "—";
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.8); doc.setTextColor(...COLORS.text);
    doc.text(`${from}  →  ${until}`, W / 2, y + 7.5, { align: "center" });
    if (data.validUntil) {
      const days = Math.max(0, Math.ceil((data.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      doc.setTextColor(...COLORS.green); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
      doc.text(`Qolgan: ${days} kun`, W / 2, y + 11.5, { align: "center" });
    }
    y += 16;
  }

  doc.setDrawColor(...COLORS.border); doc.setLineDashPattern([0.6, 0.6], 0);
  doc.line(M, y, W - M, y); doc.setLineDashPattern([], 0); y += 3;

  // QR
  if (qrDataUrl) {
    const qrSize = 28;
    doc.addImage(qrDataUrl, "PNG", (W - qrSize) / 2, y, qrSize, qrSize);
    y += qrSize + 2;
    doc.setTextColor(...COLORS.muted); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    doc.text("QR orqali tasdiqlang:", W / 2, y, { align: "center" }); y += 2.8;
    doc.setTextColor(...COLORS.accent); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    const verifyUrl = `https://med1.uz/verify?payment_id=${data.paymentId}`;
    const urlLines = doc.splitTextToSize(verifyUrl, innerW);
    doc.text(urlLines, W / 2, y, { align: "center" });
    y += urlLines.length * 2.6 + 2;
  }

  // MUHR
  if (stampPng) {
    const sz = 22;
    const gstate = (doc as any).GState ? new (doc as any).GState({ opacity: 0.85 }) : null;
    if (gstate) (doc as any).setGState(gstate);
    doc.addImage(stampPng, "PNG", (W - sz) / 2, y, sz, sz);
    if (gstate) (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
    y += sz + 2;
  }

  // Footer
  doc.setDrawColor(...COLORS.border); doc.setLineDashPattern([0.6, 0.6], 0);
  doc.line(M, y, W - M, y); doc.setLineDashPattern([], 0); y += 3;
  doc.setTextColor(...COLORS.primary); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.text("Rahmat! Sog'lik tilaymiz", W / 2, y, { align: "center" }); y += 3.5;
  doc.setTextColor(...COLORS.muted); doc.setFont("helvetica", "normal"); doc.setFontSize(5.8);
  doc.text("med1.uz/dashboard — AI shifokor, e-retsept", W / 2, y, { align: "center" }); y += 2.5;
  doc.text("Elektron hujjat • Yuridik kuchga ega (Qonun 562)", W / 2, y, { align: "center" }); y += 2.5;
  doc.text(PHONES, W / 2, y, { align: "center" }); y += 2;

  return y + M; // bottom padding
}

async function renderThermal(data: PaymentReceiptData): Promise<jsPDF> {
  const W = 80;
  const receiptNumber = buildReceiptNumber(data.paymentId, data.paidAt);
  const microId = data.paymentId.slice(-6).toUpperCase();
  const logoData = await getLogoDataUrl();

  // Resurslarni oldindan yuklab olamiz (har ikki render uchun)
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(`https://med1.uz/verify?payment_id=${data.paymentId}`, {
      margin: 1, width: 240, color: { dark: "#0A2540", light: "#FFFFFF" },
    });
  } catch {}
  let stampPng: string | null = null;
  try {
    stampPng = await generateStampDataUrl(
      { receiptNumber, paidAt: data.paidAt, microId, amount: data.amount }, 400
    );
  } catch {}

  // 1-bosqich: o'lchov uchun katta qog'oz, kontent balandligini olamiz
  const measureDoc = new jsPDF({ unit: "mm", format: [W, 400] });
  const contentH = await drawThermalContent(measureDoc, data, logoData, receiptNumber, microId, qrDataUrl, stampPng);

  // 2-bosqich: aniq balandlik bilan haqiqiy qog'oz
  const finalDoc = new jsPDF({ unit: "mm", format: [W, contentH] });
  await drawThermalContent(finalDoc, data, logoData, receiptNumber, microId, qrDataUrl, stampPng);

  return finalDoc;
}

// =====================================================================
// PUBLIC API
// =====================================================================
export async function downloadPaymentReceipt(data: PaymentReceiptData): Promise<void> {
  const format: ReceiptFormat = data.format ?? "a4";
  const receiptNumber = buildReceiptNumber(data.paymentId, data.paidAt);

  if (format === "a4" || format === "both") {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    await renderA4(doc, data);
    doc.save(`${receiptNumber}_A4.pdf`);
  }

  if (format === "thermal" || format === "both") {
    const doc = await renderThermal(data);
    doc.save(`${receiptNumber}_chek_80mm.pdf`);
  }
}
