import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Scan, Upload, Camera, Loader2, Droplets, Zap, Palette, Heart, X } from "lucide-react";

const SKIN_TYPES = [
  { value: "dry", label: "Quruq", icon: Droplets, desc: "Tarang, po'stloq" },
  { value: "oily", label: "Yog'li", icon: Zap, desc: "Yaltiroq, keng teshiklar" },
  { value: "combination", label: "Aralash", icon: Palette, desc: "T-zona yog'li" },
  { value: "sensitive", label: "Sezgir", icon: Heart, desc: "Qizarish, irritatsiya" },
];

const CONCERNS = [
  "Akne / toshmalar", "Pigmentatsiya", "Ajinlar", "Qora doqlar",
  "Kengaygan teshiklar", "Quruqlik", "Yog'lilik", "Qizarish",
  "Teri elastikligi pasayishi", "Quyosh dog'lari", "Qora nuqtalar", "Teri qurilishi",
];

interface Props {
  skinType: string;
  setSkinType: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  selectedConcerns: string[];
  toggleConcern: (c: string) => void;
  loading: boolean;
  onAnalyze: (mode: string, msg?: string, photoBase64?: string) => void;
}

const SkinScanner = ({ skinType, setSkinType, age, setAge, selectedConcerns, toggleConcern, loading, onAnalyze }: Props) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fayl hajmi 10MB dan oshmasligi kerak", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startScan = () => {
    const photoInfo = photoBase64 ? "\n[Foydalanuvchi yuz fotosuratini yuklagan — AI Computer Vision tahlili amalga oshirilsin]" : "";
    const msg = `AI Teri Skanerini ishga tushiring.${photoInfo}\nTeri turi: ${skinType || "avtomatik aniqlang"}\nYosh: ${age || "noma'lum"}\nMuammolar: ${selectedConcerns.join(", ") || "ko'rsatilmagan"}\n\nQuyidagilarni aniqlang va vizual indikatorlar bilan ko'rsating:\n1. Teri turi (avtomatik aniqlash)\n2. Akne va toshmalar darajasi (0-10)\n3. Pigmentatsiya darajasi (0-10)\n4. Ajinlar darajasi (0-10)\n5. Teri namligi (past/o'rta/yuqori)\n6. Teshiklar kengligi (tor/o'rta/keng)\n7. Teri elastikligi (past/o'rta/yuqori)\n8. Quyosh zarari darajasi\n9. Umumiy teri sog'ligi bali (1-100)\n\nHar bir ko'rsatkich uchun emoji indikator va progress bar ko'rsating.\nOxirida tavsiya etilgan muolajalar va kosmetolog ko'rigi kerakligi haqida xulosa bering.`;
    onAnalyze("skin-scan", msg, photoBase64 || undefined);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" /> AI Teri Skaneri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Photo upload */}
        <div>
          <Label className="text-base font-medium mb-3 block">📸 Yuz fotosuratini yuklang</Label>
          <div className="flex gap-4 items-start">
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Yuz" className="w-32 h-32 object-cover rounded-xl border-2 border-primary/30" />
                <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 w-6 h-6" onClick={removePhoto}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <label className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/30">
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Rasm yuklang</span>
                <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhoto} />
              </label>
            )}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Yuz fotosuratini yuklash orqali AI teri holatini aniqroq tahlil qiladi.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Galereyadan
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Skin type */}
        <div>
          <Label className="text-base font-medium mb-3 block">Teri turingiz (yoki AI avtomatik aniqlaydi)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SKIN_TYPES.map((st) => (
              <button key={st.value} onClick={() => setSkinType(skinType === st.value ? "" : st.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${skinType === st.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                <st.icon className={`w-6 h-6 mx-auto mb-2 ${skinType === st.value ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-medium text-sm text-foreground">{st.label}</p>
                <p className="text-xs text-muted-foreground">{st.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <Label>Yoshingiz</Label>
          <Input type="number" placeholder="Masalan: 28" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 max-w-xs" />
        </div>

        {/* Concerns */}
        <div>
          <Label className="text-base font-medium mb-3 block">Teri muammolari</Label>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((c) => (
              <Badge key={c} variant={selectedConcerns.includes(c) ? "default" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-3" onClick={() => toggleConcern(c)}>
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={startScan} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
          {photoBase64 ? "📸 AI Teri Skanerini Boshlash" : "🔬 AI Tahlilni Boshlash"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SkinScanner;
