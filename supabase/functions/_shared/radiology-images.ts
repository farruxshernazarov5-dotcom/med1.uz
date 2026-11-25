/** Legacy single-image and PDF-page requests share one bounded series. */
export function radiologyRequestImages(body: Record<string, unknown>): string[] {
  const images = Array.isArray(body.pdfPageImages) && body.pdfPageImages.length
    ? body.pdfPageImages : [body.imageBase64];
  if (images.length > 12) throw new Error("Bitta tahlilda 12 tagacha tasvir yoki PDF sahifasi yuboring.");
  if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(String(body.imageMimeType))) {
    throw new Error("Tibbiy tasvir JPEG, PNG yoki WebP formatda bo'lishi kerak.");
  }
  if (images.some(image => typeof image !== "string" || !image.length || !/^[A-Za-z0-9+/]+={0,2}$/.test(image))) {
    throw new Error("Tibbiy tasvir yuklanmadi yoki buzilgan.");
  }
  return images as string[];
}

export const RADIOLOGY_SERIES_INSTRUCTION = "Barcha yuborilgan tasvirlarni bir bemorning bitta tekshiruvi sifatida birgalikda ko'rib chiq. Har bir proyeksiya/kesimni tartib raqami bilan bahola; bir tasvirdagi shubhali belgini boshqa proyeksiyalar bilan solishtir. Ko'rinmaydigan tomon, proyeksiya, kontrast fazasi yoki ketma-ketlikni taxmin qilma. Mos kelmaydigan anatomik soha yoki turli bemor tasviri bo'lsa buni ochiq ayt va umumlashtirma. Xulosada baholab bo'lmaydigan joylarni, tasvir sifati va tekshiruv to'liqligi cheklovlarini ko'rsat. AI ehtimolini klinik tasdiqlangan aniqlik foizi deb ko'rsatma.";