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

/** Any Med AI answer as a verifiable PDF (used by Qabullar → AI xulosalari). */
export const downloadAiReport = (o: { title: string; conclusion: string; name: string; date?: string; summary?: string }) =>
  downloadVitalReport({ summary: o.summary ?? "", conclusion: o.conclusion, name: o.name, title: o.title, date: o.date });

export async function downloadVitalReport({ summary, conclusion, name, title = "Med AI - Vital ko'rsatkichlar xulosasi", date, metrics }: { summary: string; conclusion: string; name: string; title?: string; date?: string; metrics?: ReportMetric[] }) {
  const [{ jsPDF }, QR] = await Promise.all([import("jspdf"), import("qrcode")]);
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

  background();
  // Header band
  doc.setFillColor(10, 37, 64); doc.roundedRect(12, 10, PW - 24, 30, 4, 4, "F");
  doc.setFillColor(47, 128, 237); doc.circle(26, 25, 7, "F");
  doc.setTextColor(255); doc.setFontSize(10); doc.text("+", 24.6, 26.8);
  doc.setFontSize(17); doc.text(clean(title).slice(0, 52), 38, 23);
  doc.setFontSize(9); doc.setTextColor(190, 210, 235);
  doc.text(`${new Date(date ?? Date.now()).toLocaleString("uz-UZ")}  |  ${clean(name) || "Bemor"}  |  med1.uz`, 38, 31);

  // QR block
  let y = 50;
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
    doc.setFillColor(47, 128, 237); doc.rect(12, y - 4.5, 1.5, 6, "F");
    doc.setTextColor(10, 37, 64); doc.setFontSize(12.5); doc.text("Ko'rsatkichlar va me'yorlar", 16, y); y += 5;
    doc.setFillColor(10, 37, 64); doc.rect(14, y, W + 12, 7, "F");
    doc.setTextColor(255); doc.setFontSize(9);
    doc.text("Ko'rsatkich", 17, y + 4.8); doc.text("Natija", 80, y + 4.8); doc.text("Me'yor", 118, y + 4.8); doc.text("Holat", 165, y + 4.8);
    y += 7;
    metrics.forEach((m, i) => {
      doc.setFillColor(i % 2 ? 245 : 255, i % 2 ? 249 : 255, 255); doc.rect(14, y, W + 12, 7, "F");
      doc.setTextColor(40, 50, 60); doc.text(clean(m.label), 17, y + 4.8); doc.text(clean(m.value), 80, y + 4.8); doc.text(clean(m.norm), 118, y + 4.8);
      if (m.ok === null) doc.setTextColor(110, 120, 130); else if (m.ok) doc.setTextColor(22, 140, 80); else doc.setTextColor(200, 60, 40);
      doc.text(m.ok === null ? "-" : m.ok ? "Me'yorda" : "E'tibor bering", 165, y + 4.8);
      y += 7;
    });
    y += 8;
  }
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
