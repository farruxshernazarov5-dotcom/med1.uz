import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type TaxReportData = {
  period: { year: number; month: number };
  company: {
    name: string;
    inn: string;
    address: string;
    director: string;
    accountant: string;
    tax_office: string;
    tax_office_code?: string;
    phone?: string;
    bank?: string;
  };
  rate: number; // %
  revenue: number; // so'm
  otherIncome?: number;
  rows: Array<{ source: string; method?: string | null; amount: number; count: number }>;
};

const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(n)).replace(/,/g, " ");

/**
 * Rasmiy my.soliq.uz — "Aylanma solig'i bo'yicha soliq hisoboti"
 * (STV MB Nizomiga 7-ilova) shakliga to'liq mos PDF.
 * A4, portret, Helvetica, 10pt.
 */
export function generateTaxReportPDF(data: TaxReportData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = 210;
  const M = 15;
  let y = 12;

  const revenue = Math.round(data.revenue || 0);
  const otherIncome = Math.round(data.otherIncome || 0);
  const totalBase = revenue + otherIncome;
  const taxDue = Math.round((totalBase * data.rate) / 100);
  const periodLabel = `${String(data.period.month).padStart(2, "0")}.${data.period.year}`;
  const periodText = `${MONTHS_UZ[data.period.month - 1]} ${data.period.year} y.`;

  // ─── Header: rasmiy blok (o'ng yuqori) ───
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const headerRight = [
    "O'zbekiston Respublikasi",
    "Moliya vazirligi va",
    "Davlat soliq qo'mitasining",
    "2021-yil 24-fevraldagi",
    "1-son / 2021-14-son qarori",
    "bilan tasdiqlangan 7-ilova",
  ];
  headerRight.forEach((line, i) => {
    doc.text(line, W - M, y + i * 3.5, { align: "right" });
  });

  // Chap yuqori: shakl kodi
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(M, y, 40, 18);
  doc.setFontSize(7);
  doc.text("Shakl indeksi", M + 20, y + 4, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("0700_09", M + 20, y + 12, { align: "center" });

  y += 26;

  // ─── Title ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("AYLANMA SOLIG'I BO'YICHA SOLIQ HISOBOTI", W / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Hisobot davri: ${periodText}`, W / 2, y, { align: "center" });
  y += 7;

  // ─── Soliq to'lovchi ma'lumotlari ───
  const infoRows: Array<[string, string]> = [
    ["Soliq to'lovchining STIR (INN)", data.company.inn || ""],
    ["Soliq to'lovchining to'liq nomi", data.company.name || ""],
    ["Yuridik manzili", data.company.address || ""],
    ["Telefon raqami", data.company.phone || ""],
    ["Bank rekvizitlari (h/r, MFO)", data.company.bank || ""],
    ["Soliq organi (kodi)", `${data.company.tax_office || ""} ${data.company.tax_office_code ? "(" + data.company.tax_office_code + ")" : ""}`.trim()],
    ["Hisobot davri kodi", periodLabel],
    ["Topshirish sanasi", new Date().toLocaleDateString("uz-UZ")],
  ];

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold", fillColor: [245, 245, 245] },
      1: { cellWidth: 100 },
    },
    body: infoRows,
    margin: { left: M, right: M },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ─── I bo'lim. Soliq bazasini aniqlash ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("I. Soliq bazasini aniqlash", M, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.8, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: 0 },
    headStyles: { fillColor: [220, 230, 241], textColor: 0, fontStyle: "bold", halign: "center" },
    head: [["Ko'rsatkichlar nomi", "Satr kodi", "Summasi (so'm)"]],
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 38, halign: "right" },
    },
    body: [
      ["Tovarlarni realizatsiya qilishdan tushgan tushum (ish, xizmat)", "010", fmt(revenue)],
      ["Boshqa daromadlar (foizlar, royalti, ijara va b.)", "020", fmt(otherIncome)],
      [{ content: "JAMI SOLIQ BAZASI (010 + 020)", styles: { fontStyle: "bold", fillColor: [245, 245, 245] } },
        { content: "030", styles: { fontStyle: "bold", halign: "center", fillColor: [245, 245, 245] } },
        { content: fmt(totalBase), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } }],
    ],
    margin: { left: M, right: M },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ─── II bo'lim. Soliq summasini hisoblash ───
  doc.setFont("helvetica", "bold");
  doc.text("II. Soliq summasini hisoblash", M, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.8, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: 0 },
    headStyles: { fillColor: [220, 230, 241], textColor: 0, fontStyle: "bold", halign: "center" },
    head: [["Ko'rsatkichlar nomi", "Satr kodi", "Qiymati"]],
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 38, halign: "right" },
    },
    body: [
      ["Soliq bazasi (030-satr)", "040", fmt(totalBase)],
      ["Soliq stavkasi (%)", "050", `${data.rate} %`],
      [{ content: "HISOBLANGAN SOLIQ SUMMASI (040 x 050 / 100)", styles: { fontStyle: "bold", fillColor: [255, 245, 220] } },
        { content: "060", styles: { fontStyle: "bold", halign: "center", fillColor: [255, 245, 220] } },
        { content: fmt(taxDue), styles: { fontStyle: "bold", halign: "right", fillColor: [255, 245, 220] } }],
      ["Oldingi davrlarda hisoblangan soliq (kamaytirish)", "070", "0"],
      [{ content: "TO'LANISHI LOZIM BO'LGAN SOLIQ (060 - 070)", styles: { fontStyle: "bold", fillColor: [200, 230, 201] } },
        { content: "080", styles: { fontStyle: "bold", halign: "center", fillColor: [200, 230, 201] } },
        { content: fmt(taxDue), styles: { fontStyle: "bold", halign: "right", fillColor: [200, 230, 201] } }],
    ],
    margin: { left: M, right: M },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ─── Ilova. Daromad manbalari bo'yicha tafsilot ───
  if (data.rows && data.rows.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFont("helvetica", "bold");
    doc.text("Ilova. Daromad manbalari bo'yicha tafsilot", M, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: 0 },
      headStyles: { fillColor: [220, 230, 241], textColor: 0, fontStyle: "bold", halign: "center" },
      head: [["#", "Daromad manbai", "To'lov usuli", "Operatsiyalar", "Summa (so'm)"]],
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 85 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
      body: [
        ...data.rows.map((r, i) => [
          String(i + 1),
          r.source,
          r.method || "-",
          String(r.count),
          fmt(r.amount),
        ]),
        [
          { content: "JAMI", colSpan: 3, styles: { fontStyle: "bold", fillColor: [245, 245, 245], halign: "right" } } as any,
          { content: String(data.rows.reduce((s, r) => s + r.count, 0)), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } } as any,
          { content: fmt(data.rows.reduce((s, r) => s + r.amount, 0)), styles: { fontStyle: "bold", halign: "right", fillColor: [245, 245, 245] } } as any,
        ],
      ],
      margin: { left: M, right: M },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ─── Tasdiqlash & Imzolar ───
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Ushbu hisobotda ko'rsatilgan ma'lumotlarning to'g'riligini tasdiqlaymiz.",
    M, y,
  );
  y += 10;

  const signWidth = 80;
  // Rahbar
  doc.setFont("helvetica", "bold");
  doc.text("Rahbar:", M, y);
  doc.setFont("helvetica", "normal");
  doc.line(M + 20, y + 1, M + signWidth, y + 1);
  doc.text(data.company.director || "", M + 22, y);
  doc.setFontSize(7);
  doc.text("(F.I.O., imzo)", M + 22, y + 4);

  // Bosh hisobchi
  const rx = W - M - signWidth;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Bosh hisobchi:", rx, y);
  doc.setFont("helvetica", "normal");
  doc.line(rx + 28, y + 1, rx + signWidth, y + 1);
  doc.text(data.company.accountant || "", rx + 30, y);
  doc.setFontSize(7);
  doc.text("(F.I.O., imzo)", rx + 30, y + 4);

  y += 15;
  doc.setFontSize(9);
  doc.text("M.O'.  (muhr o'rni)", M, y);
  doc.text(`Sana: ${new Date().toLocaleDateString("uz-UZ")}`, W - M, y, { align: "right" });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `MED1.UZ platformasi orqali avtomatik shakllantirildi | my.soliq.uz rasmiy shakliga muvofiq | ${new Date().toLocaleString("uz-UZ")}`,
      W / 2, 290, { align: "center" },
    );
    doc.text(`${i} / ${pageCount}`, W - M, 290, { align: "right" });
    doc.setTextColor(0);
  }

  return doc;
}

export function downloadTaxReportPDF(data: TaxReportData) {
  const doc = generateTaxReportPDF(data);
  const name = `aylanma-soliq-hisoboti-${data.period.year}-${String(data.period.month).padStart(2, "0")}.pdf`;
  doc.save(name);
}
