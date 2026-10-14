import { isNativeApp } from "@/lib/nativeApp";

/** jsPDF core fonts lack Uzbek apostrophes and emoji; normalise to plain Latin. */
const clean = (t: string) =>
  t.replace(/[‘’ʻʼ`]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
    .replace(/[#*_>|]/g, "").replace(/[^\x20-\x7E\n\u00C0-\u017F]/g, "").replace(/\n{3,}/g, "\n\n");

/** Builds a PDF of the Vital AI conclusion; on the native app it is saved and opened in the share sheet. */
export async function downloadVitalReport({ summary, conclusion, name }: { summary: string; conclusion: string; name: string }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 180;
  let y = 18;
  doc.setFontSize(16); doc.text("Med AI - Vital ko'rsatkichlar xulosasi", 15, y); y += 7;
  doc.setFontSize(9); doc.setTextColor(110);
  doc.text(`${new Date().toLocaleString("uz-UZ")}  |  ${clean(name)}  |  med1.uz`, 15, y); y += 8;
  doc.setTextColor(0);
  const block = (title: string, body: string) => {
    doc.setFontSize(12); doc.text(title, 15, y); y += 6; doc.setFontSize(10);
    for (const line of doc.splitTextToSize(clean(body), W)) {
      if (y > 280) { doc.addPage(); y = 18; }
      doc.text(line, 15, y); y += 5;
    }
    y += 4;
  };
  if (summary) block("O'lchangan ko'rsatkichlar", summary);
  block("Med AI xulosasi", conclusion);
  doc.setFontSize(8); doc.setTextColor(120);
  if (y > 270) { doc.addPage(); y = 18; }
  doc.text(doc.splitTextToSize("Ushbu xulosa ma'lumot uchun, tibbiy tashxis o'rnini bosmaydi. Kamera o'lchovlari taxminiy. Manba: med1.uz", W), 15, y + 4);

  const file = `med-ai-vital-${new Date().toISOString().slice(0, 10)}.pdf`;
  if (!isNativeApp()) { doc.save(file); return; }
  const data = doc.output("datauristring").split(",")[1];
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const saved = await Filesystem.writeFile({ path: file, data, directory: Directory.Cache });
  const { Share } = await import("@capacitor/share");
  await Share.share({ title: "Med AI xulosasi", url: saved.uri, dialogTitle: "Xulosani saqlash yoki yuborish" });
}
