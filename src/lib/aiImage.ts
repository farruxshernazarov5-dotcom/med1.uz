export async function readAiImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Faqat rasm faylini tanlang');
  if (file.size > 10 * 1024 * 1024) throw new Error('Rasm hajmi 10 MB dan oshmasin');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Rasm ochilmadi. JPG yoki PNG formatida qayta tanlang'));
      img.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Rasm tayyorlanmadi');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally { URL.revokeObjectURL(url); }
}