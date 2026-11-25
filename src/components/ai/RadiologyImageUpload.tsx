import { useEffect, useRef, useState } from "react";
import { FileImage, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { beginExternalPicker, endExternalPicker } from "@/lib/appLock";
import { MAX_RADIOLOGY_IMAGES, validateRadiologyFile } from "@/lib/radiologyImages";
import { toast } from "@/hooks/use-toast";
import RadiologyCamera from "./RadiologyCamera";

function FileThumbnail({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url ? <img src={url} alt={file.name} className="w-14 h-14 shrink-0 object-contain rounded bg-muted" /> : <FileImage className="w-14 h-14 shrink-0 text-primary" />;
}

export default function RadiologyImageUpload({ files, onChange, disabled = false, onPreview }: {
  files: File[]; onChange: (files: File[]) => void; disabled?: boolean; onPreview?: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const add = (incoming: File[]) => {
    if (disabled) return;
    const accepted: File[] = [];
    for (const file of incoming) {
      const error = validateRadiologyFile(file);
      if (error) { toast({ title: file.name, description: error, variant: "destructive" }); continue; }
      if (![...files, ...accepted].some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) accepted.push(file);
    }
    if (files.length + accepted.length > MAX_RADIOLOGY_IMAGES) {
      toast({ title: "12 tagacha fayl tanlang", variant: "destructive" }); return;
    }
    onChange([...files, ...accepted]);
  };
  return (
    <div className="space-y-3">
      <div className={`border-2 border-dashed rounded-lg p-4 ${dragging ? "border-primary bg-primary/5" : "border-border"}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); add(Array.from(e.dataTransfer.files)); }}>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled={disabled} onClick={() => { beginExternalPicker(); input.current?.click(); }}>
            <Upload className="w-4 h-4 mr-2" /> {files.length ? "Tasvir qo'shish" : "Tasvirlar tanlash"}
          </Button>
          {!disabled && <RadiologyCamera onCapture={file => add([file])} />}
          <span className="text-xs text-muted-foreground">{files.length}/12 · JPG, PNG, WebP, PDF · 10 MB/fayl</span>
        </div>
        <input ref={input} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" disabled={disabled}
          onChange={e => { endExternalPicker(); add(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      </div>
      {files.length > 0 && <ul className="grid gap-2 sm:grid-cols-2">
        {files.map((file, i) => <li key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 min-w-0 border border-border rounded-lg p-2">
          {onPreview && file.type.startsWith("image/") ? <Button type="button" variant="ghost" className="p-0 h-14 w-14 shrink-0" aria-label={`${file.name} ko'rish`} onClick={() => onPreview(file)}><FileThumbnail file={file} /></Button> : <FileThumbnail file={file} />}
          <div className="min-w-0 flex-1"><p className="text-sm truncate">{i + 1}. {file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
          <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`${file.name} o'chirish`} onClick={() => onChange(files.filter((_, index) => index !== i))}><X className="w-4 h-4" /></Button>
        </li>)}
      </ul>}
    </div>
  );
}