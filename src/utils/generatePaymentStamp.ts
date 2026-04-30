/**
 * Har bir kvitansiya uchun NOYOB dinamik muhr generatsiyasi.
 * Asosi: MED-ALL AI SYSTEM rasmiy muhri (STIR: 312972027, Samarqand).
 * Har bir muhrga noyob: kvitansiya №, sana, mikro-ID qo'shiladi.
 *
 * Texnologiya: SVG -> dataURL (jsPDF .addImage uchun yaroqli).
 */

export interface StampPayload {
  receiptNumber: string;   // CHK-2026-000123
  paidAt: Date;            // To'langan vaqt
  microId: string;         // Tranzaksiya UUID'sining oxirgi 6 belgisi
  amount?: number;         // Tasdiqlash uchun
}

const TWO_PI = Math.PI * 2;

/** Aylana bo'ylab matn joylash (SVG <textPath>) */
function curvedText(id: string, text: string, radius: number, cx: number, cy: number, top: boolean) {
  // top=true bo'lsa yuqori yoy (matn tashqarida), aks holda pastki yoy
  const sweep = top ? 1 : 0;
  const startX = cx - radius;
  const endX = cx + radius;
  const path = top
    ? `M ${startX} ${cy} A ${radius} ${radius} 0 0 ${sweep} ${endX} ${cy}`
    : `M ${endX} ${cy} A ${radius} ${radius} 0 0 ${sweep} ${startX} ${cy}`;
  return { path, id };
}

/**
 * SVG ko'rinishidagi muhr — har chek uchun noyob.
 * Rang: ko'k-qora (rasmiy muhr stili).
 */
export function buildStampSvg(p: StampPayload): string {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 170;
  const middleR = 138;
  const innerR = 100;

  const dateStr = p.paidAt.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = p.paidAt.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

  const outerTop = curvedText("outerTop", "", outerR - 14, cx, cy, true);
  const middleTop = curvedText("middleTop", "", middleR - 12, cx, cy, true);
  const middleBot = curvedText("middleBot", "", middleR - 12, cx, cy, false);
  const outerBot = curvedText("outerBot", "", outerR - 14, cx, cy, false);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <path id="${outerTop.id}" d="${outerTop.path}"/>
    <path id="${middleTop.id}" d="${middleTop.path}"/>
    <path id="${middleBot.id}" d="${middleBot.path}"/>
    <path id="${outerBot.id}" d="${outerBot.path}"/>
  </defs>

  <!-- Tashqi va ichki aylanalar -->
  <g fill="none" stroke="#0A2540" stroke-width="3">
    <circle cx="${cx}" cy="${cy}" r="${outerR}"/>
    <circle cx="${cx}" cy="${cy}" r="${outerR - 6}" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${middleR}" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="${innerR}" stroke-width="1"/>
  </g>

  <!-- Tashqi yoy: O'ZBEKISTON RESPUBLIKASI -->
  <text font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0A2540" letter-spacing="2">
    <textPath href="#${outerTop.id}" startOffset="50%" text-anchor="middle">O'ZBEKISTON RESPUBLIKASI</textPath>
  </text>

  <!-- O'rta yoy yuqori: "MED-ALL AI SYSTEM" -->
  <text font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#0A2540" letter-spacing="1.5">
    <textPath href="#${middleTop.id}" startOffset="50%" text-anchor="middle">"MED-ALL AI SYSTEM"</textPath>
  </text>

  <!-- O'rta yoy past: MAS'ULIYATI CHEKLANGAN JAMIYATI -->
  <text font-family="Arial, sans-serif" font-size="10" font-weight="600" fill="#0A2540" letter-spacing="1">
    <textPath href="#${middleBot.id}" startOffset="50%" text-anchor="middle">MAS'ULIYATI CHEKLANGAN JAMIYATI</textPath>
  </text>

  <!-- Tashqi yoy past: SAMARQAND SHAHRI -->
  <text font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#0A2540" letter-spacing="2">
    <textPath href="#${outerBot.id}" startOffset="50%" text-anchor="middle">SAMARQAND SHAHRI</textPath>
  </text>

  <!-- Yulduzchalar (chap va o'ng) -->
  <g fill="#0A2540">
    <text x="${cx - outerR + 18}" y="${cy + 5}" font-size="18" text-anchor="middle">★</text>
    <text x="${cx + outerR - 18}" y="${cy + 5}" font-size="18" text-anchor="middle">★</text>
  </g>

  <!-- Markaz: stetoskop + neyron tarmoq belgisi (soddalashtirilgan) -->
  <g transform="translate(${cx - 38}, ${cy - 50})" stroke="#0A2540" stroke-width="2" fill="none" stroke-linecap="round">
    <!-- Stetoskop tubuslari -->
    <path d="M 10 0 Q 10 25 22 35 L 30 50"/>
    <path d="M 30 0 Q 30 25 38 35 L 30 50"/>
    <!-- ECG to'lqini -->
    <path d="M 0 50 L 18 50 L 22 40 L 28 60 L 34 45 L 40 50 L 76 50" stroke-width="1.8"/>
    <!-- Stetoskop diafragma -->
    <circle cx="30" cy="62" r="6" fill="#0A2540"/>
    <!-- Neyron tarmoq nuqtalari -->
    <g fill="#0A2540">
      <circle cx="58" cy="8" r="3"/>
      <circle cx="68" cy="18" r="3"/>
      <circle cx="58" cy="28" r="3"/>
      <circle cx="74" cy="32" r="3"/>
      <circle cx="64" cy="40" r="3"/>
    </g>
    <g stroke="#0A2540" stroke-width="1">
      <line x1="58" y1="8" x2="68" y2="18"/>
      <line x1="68" y1="18" x2="58" y2="28"/>
      <line x1="68" y1="18" x2="74" y2="32"/>
      <line x1="58" y1="28" x2="64" y2="40"/>
      <line x1="74" y1="32" x2="64" y2="40"/>
    </g>
  </g>

  <!-- STIR -->
  <text x="${cx}" y="${cy + 40}" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#0A2540" text-anchor="middle">
    STIR: 312972027
  </text>

  <!-- DINAMIK qism: kvitansiya № va sana (har muhr noyob bo'lishi uchun) -->
  <text x="${cx}" y="${cy + 58}" font-family="Arial, sans-serif" font-size="8.5" font-weight="600" fill="#0A2540" text-anchor="middle">
    ${p.receiptNumber}
  </text>
  <text x="${cx}" y="${cy + 70}" font-family="Arial, sans-serif" font-size="7.5" fill="#0A2540" text-anchor="middle">
    ${dateStr} • ${timeStr}
  </text>
  <text x="${cx}" y="${cy + 80}" font-family="Arial, sans-serif" font-size="6.5" fill="#0A2540" text-anchor="middle" opacity="0.7">
    ID:${p.microId}
  </text>
</svg>`;
}

/**
 * SVG → PNG dataURL (jsPDF uchun).
 * Brauzer Canvas API orqali konvertatsiya.
 */
export async function stampSvgToPngDataUrl(svg: string, sizePx = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sizePx;
      canvas.height = sizePx;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas context yo'q"));
      }
      ctx.clearRect(0, 0, sizePx, sizePx);
      ctx.drawImage(img, 0, 0, sizePx, sizePx);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function generateStampDataUrl(p: StampPayload, sizePx = 480): Promise<string> {
  const svg = buildStampSvg(p);
  return stampSvgToPngDataUrl(svg, sizePx);
}
