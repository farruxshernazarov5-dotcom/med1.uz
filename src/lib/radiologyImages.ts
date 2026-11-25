import { pdfToImageBase64Pages } from "./pdf";

export const MAX_RADIOLOGY_IMAGES = 12;
export const MAX_RADIOLOGY_FILE_BYTES = 10 * 1024 * 1024;

export function validateRadiologyFile(file: Pick<File, "type" | "size">): string | null {
  if (!["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
    return "JPG, PNG, WebP yoki PDF fayl tanlang.";
  }
  return file.size > MAX_RADIOLOGY_FILE_BYTES ? "Har bir fayl hajmi 10 MB dan oshmasin." : null;
}

export function readRadiologyFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Fayl o'qilmadi"));
    reader.onerror = () => reject(new Error("Fayl o'qilmadi"));
    reader.readAsDataURL(file);
  });
}

/** Normalize MIME and bound pixel size without cropping a projection. */
async function jpegProjection(source: string): Promise<string> {
  const img = new Image();
  img.src = source;
  await img.decode();
  const scale = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tasvirni tayyorlab bo'lmadi");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export async function prepareRadiologyImages(files: File[]): Promise<string[]> {
  if (!files.length) throw new Error("Tasvir tanlang");
  const images: string[] = [];
  for (const file of files) {
    const error = validateRadiologyFile(file);
    if (error) throw new Error(error);
    if (file.type === "application/pdf") {
      // Read one extra page to detect overflow instead of silently dropping projections.
      const pages = await pdfToImageBase64Pages(file, MAX_RADIOLOGY_IMAGES + 1);
      if (!pages.length) throw new Error("PDF sahifalarini o'qib bo'lmadi. JPG/PNG tasvir yuklang.");
      images.push(...pages.map(page => `data:image/jpeg;base64,${page}`));
    } else {
      images.push(await jpegProjection(await readRadiologyFile(file)));
    }
    if (images.length > MAX_RADIOLOGY_IMAGES) throw new Error("Bitta tahlilda 12 tagacha tasvir yoki PDF sahifasi tanlang; ortiqcha sahifalar avtomatik tashlab yuborilmaydi.");
  }
  return images;
}

export function radiologyImagePayload(images: string[]) {
  if (!images.length || images.length > MAX_RADIOLOGY_IMAGES) throw new Error("1–12 ta tasvir kerak");
  const pages = images.map(image => {
    if (!image.startsWith("data:image/jpeg;base64,")) throw new Error("Tasvir JPEG formatda tayyorlanishi kerak");
    return image.slice("data:image/jpeg;base64,".length);
  });
  return { imageBase64: pages[0], imageMimeType: "image/jpeg", pdfPageImages: pages };
}