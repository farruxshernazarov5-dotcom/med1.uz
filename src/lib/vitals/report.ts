import { isNativeApp } from "@/lib/nativeApp";
import { sendPdfToTelegram } from "@/lib/telegramBotLink";
import { supabase } from "@/integrations/supabase/client";

/** jsPDF core fonts lack Uzbek apostrophes and emoji; normalise to plain Latin. */
const clean = (t: string) =>
  t.replace(/[‘’ʻʼ`]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
    .replace(/[#*_>|]/g, "").replace(/[^\x20-\x7E\n\u00C0-\u017F]/g, "").replace(/\n{3,}/g, "\n\n");

const VERIFY_BASE = "https://med1.uz/verify/vital/";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint8Array(10));
  return "VIT-" + Array.from(r, (x) => abc[x % abc.length]).join("");
}

/** Registers the report so its QR code can be verified; returns null when offline/signed out. */
async function register(hash: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const code = newCode();
  const { error } = await supabase.from("vital_reports").insert({ code, user_id: data.user.id, content_hash: hash });
  return error ? null : code;
}

/** Builds a health-themed PDF with QR verification; on the native app it opens the share sheet. */
export type ReportMetric = { label: string; value: string; norm: string; ok: boolean | null };

export type MetricStatus = "normal" | "attention" | "urgent" | "unknown";

/** Resting adult reference ranges; estimates are not a diagnosis. */
export function classifyMetricStatus(metric: ReportMetric): MetricStatus {
  const label = metric.label.toLowerCase();
  const value = Number.parseFloat(metric.value.replace(",", "."));
  if (/manba|ishonch|signal/.test(label)) return "unknown";
  if (/stress/.test(label)) return /^(past|low)$/i.test(metric.value.trim()) ? "normal" : "attention";
  if (Number.isFinite(value)) {
    if (/spo2|spo₂/.test(label)) return value < 92 ? "urgent" : value < 95 ? "attention" : "normal";
    if (/puls|pulse|yurak/.test(label)) return value < 40 || value > 140 ? "urgent" : value < 60 || value > 100 ? "attention" : "normal";
    if (/nafas|resp/.test(label)) return value < 8 || value > 30 ? "urgent" : value < 12 || value > 20 ? "attention" : "normal";
    if (/hrv|rmssd/.test(label)) return value < 20 || value > 100 ? "attention" : "normal";
    if (/bosim/.test(label)) {
      const diastolic = Number.parseFloat(metric.value.split("/")[1]);
      if (value >= 180 || diastolic >= 120 || value < 80 || diastolic < 50) return "urgent";
      return value < 90 || value >= 130 || diastolic < 60 || diastolic >= 85 ? "attention" : "normal";
    }
  }
  return metric.ok === null ? "unknown" : metric.ok ? "normal" : "attention";
}

const statusLabels: Record<MetricStatus, string> = {
  normal: "Me'yorda", attention: "E'tibor talab", urgent: "Shifokorga murojaat", unknown: "Baholanmagan",
};
const statusColors: Record<MetricStatus, [number, number, number]> = {
  normal: [22, 112, 70], attention: [153, 94, 8], urgent: [180, 38, 38], unknown: [90, 105, 120],
};

/** Any Med AI answer as a verifiable PDF (used by Qabullar → AI xulosalari). */
export const downloadAiReport = (o: { title: string; conclusion: string; name: string; date?: string; summary?: string }) =>
  downloadVitalReport({ summary: o.summary ?? "", conclusion: o.conclusion, name: o.name, title: o.title, date: o.date });

export async function downloadVitalReport({ summary, conclusion, name, title = "Med AI - Vital ko'rsatkichlar xulosasi", date, metrics }: { summary: string; conclusion: string; name: string; title?: string; date?: string; metrics?: ReportMetric[] }) {
  const [{ jsPDF }, QR, { default: autoTable }] = await Promise.all([import("jspdf"), import("qrcode"), import("jspdf-autotable")]);
  const hash = await sha256(`${summary}\n${conclusion}`);
  const code = await register(hash);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210, PH = 297, W = 170;

  const background = () => {
    // Soft clinical gradient (vertical bands), heartbeat line, corner crosses.
    for (let i = 0; i < 60; i++) {
      const k = i / 59;
      doc.setFillColor(236 - 10 * k, 248 - 6 * k, 250 - 2 * k);
      doc.rect(0, (PH / 60) * i, PW, PH / 60 + 0.5, "F");
    }
    doc.setDrawColor(190, 225, 232); doc.setLineWidth(0.6);
    const yb = PH - 22;
    doc.lines([[60, 0], [4, -8], [4, 16], [4, -14], [4, 6], [134, 0]], 0, yb);
    doc.setFillColor(214, 238, 242);
    for (const [x, y] of [[188, 12], [12, 270]]) { doc.rect(x - 1.5, y - 5, 3, 10, "F"); doc.rect(x - 5, y - 1.5, 10, 3, "F"); }
  };

  const statuses = (metrics ?? []).map(classifyMetricStatus);
  const overall: MetricStatus = statuses.includes("urgent") ? "urgent" : statuses.includes("attention") ? "attention" : statuses.includes("normal") ? "normal" : "unknown";
  const headerColor = statusColors[overall];
  background();
  // Header band
  doc.setFillColor(...headerColor); doc.roundedRect(12, 10, PW - 24, 35, 4, 4, "F");
  doc.setFillColor(47, 128, 237); doc.circle(26, 25, 7, "F");
  doc.setTextColor(255); doc.setFontSize(10); doc.text("+", 24.6, 26.8);
  doc.setFontSize(17); doc.text(clean(title).slice(0, 52), 38, 23);
  doc.setFontSize(9); doc.setTextColor(190, 210, 235);
  doc.text(`${new Date(date ?? Date.now()).toLocaleString("uz-UZ")}  |  ${clean(name) || "Bemor"}  |  med1.uz`, 38, 31);

  doc.setFillColor(255, 255, 255); doc.roundedRect(38, 35, 65, 6, 2, 2, "F");
  doc.setTextColor(...headerColor); doc.setFontSize(8);
  doc.text(statusLabels[overall], 41, 39);

  // QR block
  let y = 56;
  if (code) {
    const url = VERIFY_BASE + code;
    const qr = await QR.toDataURL(url, { margin: 1, width: 300, color: { dark: "#0A2540", light: "#FFFFFF" } });
    doc.setFillColor(255, 255, 255); doc.roundedRect(PW - 56, y - 4, 44, 52, 3, 3, "F");
    doc.addImage(qr, "PNG", PW - 52, y, 36, 36);
    doc.setFontSize(7); doc.setTextColor(10, 37, 64);
    doc.text(code, PW - 34, y + 41, { align: "center" });
    doc.text("QR orqali tekshiring", PW - 34, y + 45, { align: "center" });
  }

  // Warning box
  doc.setFillColor(255, 244, 229); doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.5);
  doc.roundedRect(12, y - 4, code ? PW - 74 : W + 16, 30, 3, 3, "FD");
  doc.setFillColor(245, 158, 11); doc.triangle(22, y + 1, 16, y + 12, 28, y + 12, "F");
  doc.setTextColor(255); doc.setFontSize(10); doc.text("!", 21.3, y + 10.5);
  doc.setTextColor(146, 64, 14); doc.setFontSize(11); doc.text("DIQQAT: BU TASHXIS EMAS", 32, y + 5);
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize("Ushbu xulosa faqat ma'lumot uchun. Kamera o'lchovlari taxminiy va tibbiy asbob o'rnini bosmaydi. Shikoyat bo'lsa shifokorga murojaat qiling; og'ir holatda 103 ga qo'ng'iroq qiling.", code ? 100 : 140), 32, y + 11);
  y += 58;

  const block = (title: string, body: string) => {
    if (y > 255) { doc.addPage(); background(); y = 20; }
    doc.setFillColor(47, 128, 237); doc.rect(12, y - 4.5, 1.5, 6, "F");
    doc.setTextColor(10, 37, 64); doc.setFontSize(12.5); doc.text(title, 16, y); y += 7;
    doc.setFontSize(10); doc.setTextColor(40, 50, 60);
    for (const line of doc.splitTextToSize(clean(body), W)) {
      if (y > 262) { doc.addPage(); background(); y = 20; }
      doc.text(line, 16, y); y += 5;
    }
    y += 5;
  };
  if (metrics?.length) {
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14, top: 20, bottom: 28 },
      head: [["Ko'rsatkich", "Natija", "Me'yor", "Holat"]],
      body: metrics.map((m) => [clean(m.label), clean(m.value), clean(m.norm), statusLabels[classifyMetricStatus(m)]]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, overflow: "linebreak", textColor: [40, 50, 60], lineColor: [215, 225, 230] },
      headStyles: { fillColor: headerColor, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [242, 248, 249] },
      columnStyles: { 0: { cellWidth: 46 }, 1: { cellWidth: 44 }, 2: { cellWidth: 40 }, 3: { cellWidth: 52 } },
      willDrawPage: (data) => { if (data.pageNumber > 1) background(); },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          data.cell.styles.fillColor = statusColors[classifyMetricStatus(metrics[data.row.index])];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: (data) => { y = (data.cursor?.y ?? 20) + 10; },
    });
  }
  const sourceMetric = metrics?.find((m) => /manba|ishonch|signal/i.test(m.label));
  block("Manba va signal sifati", sourceMetric ? sourceMetric.value : "Manba: qo'lda kiritilgan yoki saqlangan AI xulosasi. Signal sifati: ko'rsatilmagan.");
  if (summary) block("O'lchangan ko'rsatkichlar", summary);
  block("Med AI xulosasi", conclusion);
  block("Keyingi qadamlar", "1. Natijani shifokoringiz bilan muhokama qiling.\n2. Qayta o'lchovni dam olgan holatda, bir xil vaqtda bajaring.\n3. Ko'krakda og'riq, hansirash, hushdan ketish bo'lsa darhol 103 ga qo'ng'iroq qiling.\n4. Med1.uz orqali shifokor qabuliga yozilishingiz mumkin.");

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7); doc.setTextColor(110, 120, 130);
    doc.text(`Raqamli imzo (SHA-256): ${hash.slice(0, 32)}...`, 12, PH - 10);
    doc.text(`Bu tashxis emas  |  Manba: med1.uz  |  ${p}/${pages}`, PW - 12, PH - 10, { align: "right" });
  }

  const file = `med-ai-${new Date().toISOString().slice(0, 10)}.pdf`;
  const data = doc.output("datauristring").split(",")[1];
  // Also deliver to the user's linked Telegram bot (silently skipped when not linked).
  void sendPdfToTelegram(data, title, file);
  if (!isNativeApp()) { doc.save(file); return; }
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const saved = await Filesystem.writeFile({ path: file, data, directory: Directory.Cache });
  const { Share } = await import("@capacitor/share");
  await Share.share({ title: "Med AI xulosasi", url: saved.uri, dialogTitle: "Xulosani saqlash yoki yuborish" });
}
