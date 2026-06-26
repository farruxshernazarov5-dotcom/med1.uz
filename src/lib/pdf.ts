async function loadPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const arrayBuffer = await file.arrayBuffer();
  return pdfjs.getDocument({ data: arrayBuffer }).promise;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdf = await loadPdf(file);
  const pages: string[] = [];

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(text);
  }

  return pages.join("\n\n").trim();
}

export async function pdfToImageBase64Pages(file: File, maxPages = 3): Promise<string[]> {
  const pdf = await loadPdf(file);
  const pages: string[] = [];
  const total = Math.min(pdf.numPages, maxPages);

  for (let pageNo = 1; pageNo <= total; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push(canvas.toDataURL("image/jpeg", 0.82).split(",")[1]);
  }

  return pages;
}