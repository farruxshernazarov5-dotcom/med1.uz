import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function RadiologyProjectionGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState(0);
  if (!images.length) return null;
  return <section className="space-y-2" aria-label="Tahlil qilingan tasvirlar">
    <h3 className="text-sm font-semibold">Tekshirilgan tasvirlar · {images.length}</h3>
    <img src={images[selected] ?? images[0]} alt={`Tekshirilgan proyeksiya ${selected + 1}`} className="w-full h-72 object-contain bg-muted rounded-lg" />
    {images.length > 1 && <div className="flex gap-2 overflow-x-auto pb-2">
      {images.map((image, i) => <Button key={i} variant={selected === i ? "default" : "outline"} className="h-auto p-1 shrink-0" aria-label={`Proyeksiya ${i + 1}`} onClick={() => setSelected(i)}><img src={image} alt={`Proyeksiya ${i + 1}`} className="w-14 h-14 object-contain rounded" /></Button>)}
    </div>}
  </section>;
}