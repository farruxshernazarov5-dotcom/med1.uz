import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface HambiReportSection {
  heading: string;
  rows: Array<[string, string]>;
}

export interface HambiReportData {
  title: string;
  subtitle?: string;
  refNumber: string;
  language: "uz" | "ru" | "en";
  sections: HambiReportSection[];
  table?: { headers: string[]; rows: string[][] };
  totals?: Array<[string, string]>;
  notes?: string;
}

const PRIMARY: [number, number, number] = [10, 37, 64];
const ACCENT: [number, number, number] = [47, 128, 237];
const MUTED: [number, number, number] = [100, 116, 139];
const BORDER: [number, number, number] = [226, 232, 240];

/**
 * Universal trilingual PDF generator for HAMBI × MED-ALL AI dashboard.
 * Renders branded header, sections, optional table, totals, QR verification.
 * Replaces previously empty PDF exports.
 */
export async function downloadHambiReport(d: HambiReportData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  let y = 0;

  const verifyUrl = `https://med1.uz/verify/${encodeURIComponent(d.refNumber)}`;
  const qr = await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 });

  // Header
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 30, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 30, W, 1.2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("HAMBI × MED-ALL AI", M, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Enterprise Healthcare Financial Report", M, 18);
  doc.text(`Ref: ${d.refNumber}  •  ${new Date().toLocaleString("uz-UZ")}`, M, 23);
  doc.addImage(qr, "PNG", W - M - 22, 4, 22, 22);

  y = 40;
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(d.title, M, y);
  y += 6;
  if (d.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(d.subtitle, M, y);
    y += 6;
  }
  doc.setDrawColor(...BORDER);
  doc.line(M, y, W - M, y);
  y += 6;

  const ensure = (need: number) => {
    if (y + need > H - 22) {
      doc.addPage();
      y = M;
    }
  };

  // Sections
  d.sections.forEach((sec) => {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ACCENT);
    doc.text(sec.heading, M, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    sec.rows.forEach(([k, v]) => {
      ensure(5);
      doc.setTextColor(...MUTED);
      doc.text(String(k) + ":", M + 2, y);
      doc.setTextColor(30, 41, 59);
      const valueLines = doc.splitTextToSize(String(v ?? "—"), W - M * 2 - 50);
      doc.text(valueLines, M + 50, y);
      y += Math.max(5, valueLines.length * 4.5);
    });
    y += 3;
  });

  // Table
  if (d.table && d.table.rows.length > 0) {
    ensure(20);
    const cols = d.table.headers.length;
    const colW = (W - M * 2) / cols;
    doc.setFillColor(...ACCENT);
    doc.rect(M, y, W - M * 2, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    d.table.headers.forEach((h, i) => doc.text(String(h), M + 2 + i * colW, y + 5));
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    d.table.rows.forEach((row, ri) => {
      ensure(7);
      if (ri % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(M, y, W - M * 2, 6.5, "F");
      }
      row.forEach((cell, i) => {
        const lines = doc.splitTextToSize(String(cell ?? ""), colW - 4);
        doc.text(lines[0] || "", M + 2 + i * colW, y + 4.5);
      });
      y += 6.5;
    });
    y += 4;
  }

  // Totals
  if (d.totals && d.totals.length > 0) {
    ensure(d.totals.length * 6 + 6);
    doc.setDrawColor(...BORDER);
    doc.line(M, y, W - M, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    d.totals.forEach(([k, v]) => {
      ensure(6);
      doc.setTextColor(...MUTED);
      doc.text(k, M, y);
      doc.setTextColor(...PRIMARY);
      doc.text(String(v), W - M, y, { align: "right" });
      y += 6;
    });
  }

  if (d.notes) {
    ensure(12);
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(d.notes, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 4.5;
  }

  // Footer on every page
  const total = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.line(M, H - 16, W - M, H - 16);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("MED-ALL AI SYSTEM MChJ © 2018–2026  •  med1.uz  •  HAMBI × UNITEL Integration", M, H - 11);
    doc.text(`Page ${i} / ${total}`, W - M, H - 11, { align: "right" });
    doc.text(`Verify: ${verifyUrl}`, M, H - 6);
  }

  doc.save(`HAMBI-${d.refNumber}.pdf`);
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (s: any) => {
    const v = String(s ?? "");
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
