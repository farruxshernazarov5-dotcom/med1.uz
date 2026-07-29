import jsPDF from "jspdf";
import QRCode from "qrcode";
import { parseMarkdown, type MdRun } from "@/lib/markdownRender";

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
const TEXT: [number, number, number] = [30, 41, 59];

export async function downloadContractPDF(d: ContractPDFData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const contentW = W - M * 2;

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
  doc.text("med1.uz  •  Yuridik Markaz  •  Rasmiy hujjat", M, 18);
  doc.text(`No ${d.contractNumber}`, M, 23);
  doc.addImage(qrDataUrl, "PNG", W - M - 22, 3, 22, 22);

  // ---------- TITLE ----------
  let y = 36;
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize((d.title || "").toUpperCase(), contentW);
  doc.text(titleLines, M, y);
  y += titleLines.length * 6 + 2;

  // ---------- META ----------
  doc.setDrawColor(...BORDER);
  doc.line(M, y, W - M, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const metaRows: [string, string][] = [
    ["Holat", d.status],
    ["Til", String(d.language).toUpperCase()],
    ...(d.signedAt ? [["Imzolangan", d.signedAt.toLocaleString("uz-UZ")] as [string, string]] : []),
    ...(d.effectiveFrom ? [["Amal qiladi", d.effectiveFrom.toLocaleDateString("uz-UZ")] as [string, string]] : []),
    ...(d.ownerName ? [["Buyurtmachi", d.ownerName] as [string, string]] : []),
    ...(d.counterpartyName ? [["Ijrochi", d.counterpartyName] as [string, string]] : []),
  ];
  metaRows.forEach(([k, v]) => {
    doc.setTextColor(...MUTED); doc.text(k + ":", M, y);
    doc.setTextColor(...TEXT);  doc.text(String(v), M + 30, y);
    y += 5;
  });
  y += 3;
  doc.setDrawColor(...BORDER); doc.line(M, y, W - M, y); y += 6;

  // ---------- BODY (markdown rendering) ----------
  const ensureSpace = (need: number) => {
    if (y + need > H - 22) { doc.addPage(); y = M; }
  };

  const drawRuns = (runs: MdRun[], x: number, maxW: number, size: number, lineH: number) => {
    // Word-wrap while honoring bold spans.
    doc.setFontSize(size);
    const spaceW = (bold: boolean) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      return doc.getStringUnitWidth(" ") * size / doc.internal.scaleFactor;
    };
    let cursorX = x;
    let lineStart = true;
    for (const run of runs) {
      doc.setFont("helvetica", run.bold ? "bold" : "normal");
      const words = run.text.split(/(\s+)/).filter(Boolean);
      for (const w of words) {
        if (/^\s+$/.test(w)) {
          if (!lineStart) cursorX += spaceW(!!run.bold);
          continue;
        }
        const wW = doc.getStringUnitWidth(w) * size / doc.internal.scaleFactor;
        if (cursorX + wW > x + maxW) {
          y += lineH;
          ensureSpace(lineH);
          cursorX = x;
          lineStart = true;
        }
        doc.text(w, cursorX, y);
        cursorX += wW;
        lineStart = false;
      }
    }
    y += lineH;
  };

  const blocks = parseMarkdown(d.body || "");
  doc.setTextColor(...TEXT);

  for (const b of blocks) {
    if (b.type === "h1") {
      ensureSpace(10);
      y += 2;
      doc.setTextColor(...PRIMARY);
      drawRuns(b.runs, M, contentW, 14, 7);
      doc.setTextColor(...TEXT);
      continue;
    }
    if (b.type === "h2") {
      ensureSpace(8);
      y += 1;
      doc.setTextColor(...PRIMARY);
      drawRuns(b.runs, M, contentW, 12, 6);
      doc.setTextColor(...TEXT);
      continue;
    }
    if (b.type === "h3") {
      ensureSpace(7);
      doc.setTextColor(...PRIMARY);
      drawRuns(b.runs, M, contentW, 11, 6);
      doc.setTextColor(...TEXT);
      continue;
    }
    if (b.type === "hr") {
      ensureSpace(4);
      doc.setDrawColor(...BORDER); doc.line(M, y, W - M, y); y += 4; continue;
    }
    if (b.type === "ul" || b.type === "ol") {
      let idx = 0;
      for (const item of b.items) {
        idx++;
        ensureSpace(6);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        const bullet = b.type === "ul" ? "•" : `${idx}.`;
        doc.text(bullet, M + 2, y);
        drawRuns(item, M + 8, contentW - 8, 10, 5);
      }
      y += 1;
      continue;
    }
    // paragraph
    ensureSpace(6);
    if ((b as any).type === "table") continue;
    drawRuns((b as any).runs, M, contentW, 10, 5);
    y += 1;
  }

  // ---------- SIGNATURES ----------
  if (d.signatures && d.signatures.length > 0) {
    ensureSpace(20);
    y += 3;
    doc.setDrawColor(...BORDER); doc.line(M, y, W - M, y); y += 6;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...PRIMARY);
    doc.text("Elektron imzolar", M, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    d.signatures.forEach((s, i) => {
      ensureSpace(14);
      doc.setTextColor(...TEXT);
      doc.text(`${i + 1}. ${s.signer_name}  (${s.signer_role})`, M, y); y += 4;
      doc.setTextColor(...MUTED);
      doc.text(`Usul: ${s.method}  •  ${new Date(s.signed_at).toLocaleString("uz-UZ")}`, M + 4, y); y += 4;
      doc.setFontSize(7);
      doc.text(`Hash: ${s.signature_hash}`, M + 4, y);
      doc.setFontSize(9);
      y += 5;
    });
  }

  // ---------- FOOTER ----------
  const total = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER); doc.line(M, H - 18, W - M, H - 18);
    doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text("MED-ALL AI SYSTEM MChJ © 2018–2026  •  med1.uz  •  Tekshirish: " + verifyUrl, M, H - 13);
    doc.text(`Sahifa ${i} / ${total}`, W - M, H - 13, { align: "right" });
    doc.text(`Verification ID: ${d.hashId}`, M, H - 8);
  }

  doc.save(`Shartnoma-${d.contractNumber}.pdf`);
}
