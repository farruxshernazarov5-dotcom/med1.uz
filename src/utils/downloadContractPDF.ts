import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface ContractPDFData {
  hashId: string;
  contractNumber: string;
  title: string;
  body: string;
  language: "uz" | "ru" | string;
  status: string;
  signedAt?: Date | null;
  effectiveFrom?: Date | null;
  effectiveUntil?: Date | null;
  ownerName?: string;
  counterpartyName?: string;
  signatures?: Array<{
    signer_name: string;
    signer_role: string;
    method: string;
    signed_at: string;
    signature_hash: string;
  }>;
}

const PRIMARY: [number, number, number] = [10, 37, 64];
const MUTED: [number, number, number] = [100, 116, 139];
const BORDER: [number, number, number] = [226, 232, 240];

export async function downloadContractPDF(d: ContractPDFData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;

  const verifyUrl = `https://med1.uz/verify/contract/${d.hashId}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 240, margin: 1 });

  // ---------- HEADER ----------
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MED-ALL AI SYSTEM MChJ", M, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("med1.uz  •  Rasmiy yuridik shartnoma", M, 18);
  doc.text(`№ ${d.contractNumber}`, M, 23);

  doc.addImage(qrDataUrl, "PNG", W - M - 22, 3, 22, 22);

  // ---------- META BLOCK ----------
  let y = 36;
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(d.title, W - M * 2);
  doc.text(titleLines, M, y);
  y += titleLines.length * 6 + 2;

  doc.setDrawColor(...BORDER);
  doc.line(M, y, W - M, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const metaRows: [string, string][] = [
    ["Holat", d.status],
    ["Til", d.language.toUpperCase()],
    ...(d.signedAt ? [["Imzolangan", d.signedAt.toLocaleString("uz-UZ")] as [string, string]] : []),
    ...(d.effectiveFrom ? [["Amal qiladi", d.effectiveFrom.toLocaleDateString("uz-UZ")] as [string, string]] : []),
    ...(d.ownerName ? [["Buyurtmachi", d.ownerName] as [string, string]] : []),
    ...(d.counterpartyName ? [["Ijrochi", d.counterpartyName] as [string, string]] : []),
  ];
  metaRows.forEach(([k, v]) => {
    doc.setTextColor(...MUTED);
    doc.text(k + ":", M, y);
    doc.setTextColor(30, 41, 59);
    doc.text(String(v), M + 30, y);
    y += 5;
  });
  y += 3;

  // ---------- BODY ----------
  doc.setDrawColor(...BORDER);
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const bodyText = (d.body || "").replace(/\r\n/g, "\n");
  const lines = doc.splitTextToSize(bodyText, W - M * 2);
  for (const line of lines) {
    if (y > H - 40) {
      doc.addPage();
      y = M;
    }
    doc.text(line, M, y);
    y += 5;
  }

  // ---------- SIGNATURES ----------
  if (d.signatures && d.signatures.length > 0) {
    if (y > H - 60) { doc.addPage(); y = M; }
    y += 4;
    doc.setDrawColor(...BORDER);
    doc.line(M, y, W - M, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.text("Elektron imzolar", M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    d.signatures.forEach((s, i) => {
      if (y > H - 30) { doc.addPage(); y = M; }
      doc.setTextColor(30, 41, 59);
      doc.text(`${i + 1}. ${s.signer_name}  (${s.signer_role})`, M, y);
      y += 4;
      doc.setTextColor(...MUTED);
      doc.text(`Usul: ${s.method}  •  ${new Date(s.signed_at).toLocaleString("uz-UZ")}`, M + 4, y);
      y += 4;
      doc.setFontSize(7);
      doc.text(`Hash: ${s.signature_hash}`, M + 4, y);
      doc.setFontSize(9);
      y += 5;
    });
  }

  // ---------- FOOTER (every page) ----------
  const total = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.line(M, H - 18, W - M, H - 18);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      "MED-ALL AI SYSTEM MChJ © 2018–2026  •  med1.uz  •  Tekshirish: " + verifyUrl,
      M,
      H - 13,
    );
    doc.text(`Sahifa ${i} / ${total}`, W - M, H - 13, { align: "right" });
    doc.text(`Hash ID: ${d.hashId}`, M, H - 8);
  }

  doc.save(`Shartnoma-${d.contractNumber}.pdf`);
}
